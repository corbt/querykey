import { expect, it } from "vitest";
import { type Prisma } from "@prisma/client";
import { type ChatCompletionMessageParam } from "openai/resources/chat";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "~/server/db";
import { updatePruningRuleMatches } from "./updatePruningRuleMatches";

const input1: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content:
      "The user is testing multiple scenarios against the same prompt. Attempt to generate a new scenario that is different from the others.",
  },
  {
    role: "user",
    content:
      "This is the user message.\nIt has a newline.\n\nAnd another two. Then it has text without newlines.",
  },
  {
    role: "assistant",
    content: null,
    function_call: { name: "add_scenario", arguments: '{"language":"English"}' },
  },
  {
    role: "assistant",
    content: null,
    function_call: { name: "add_scenario", arguments: '{"language":"Spanish"}' },
  },
  {
    role: "assistant",
    content: null,
    function_call: { name: "add_scenario", arguments: '{"language":"German"}' },
  },
];

const createProject = async (datasetId: string) => {
  return await prisma.project.create({
    data: {
      id: uuidv4(),
      name: "test",
      datasets: {
        create: [
          {
            id: datasetId,
            name: "test",
          },
        ],
      },
    },
  });
};

const datasetId = uuidv4();

const createDatasetEntry = async (datasetId: string, messages: ChatCompletionMessageParam[]) => {
  return await prisma.datasetEntry.create({
    data: {
      messages: messages as unknown as Prisma.InputJsonValue,
      output: {},
      inputTokens: 0,
      outputTokens: 0,
      datasetId,
      split: "TRAIN",
      sortKey: "_",
      importId: "_",
      provenance: "UPLOAD",
    },
  });
};

const createPruningRule = async (datasetId: string, textToMatch: string) => {
  return await prisma.pruningRule.create({
    data: {
      datasetId,
      textToMatch,
      tokensInText: 0,
    },
  });
};

it("matches basic string", async () => {
  await createProject(datasetId);
  // Create experiments concurrently
  const [_, rule] = await Promise.all([
    createDatasetEntry(datasetId, input1),
    createPruningRule(datasetId, "The user is testing multiple scenarios against the same prompt"),
  ]);

  await updatePruningRuleMatches(datasetId, new Date(0));

  // Make sure there are a total of 4 scenarios for exp2
  expect(
    await prisma.pruningRuleMatch.count({
      where: {
        pruningRuleId: rule.id,
      },
    }),
  ).toBe(1);
});

it("matches string with newline", async () => {
  await createProject(datasetId);
  // Create experiments concurrently
  const [_, rule] = await Promise.all([
    createDatasetEntry(datasetId, input1),
    createPruningRule(
      datasetId,
      "This is the user message.\nIt has a newline.\n\nAnd another two. ",
    ),
  ]);

  await updatePruningRuleMatches(datasetId, new Date(0));

  // Make sure there are a total of 4 scenarios for exp2
  expect(
    await prisma.pruningRuleMatch.count({
      where: {
        pruningRuleId: rule.id,
      },
    }),
  ).toBe(1);
});
