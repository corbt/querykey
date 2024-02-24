import { NodeEntry, Node, NodeType } from "@prisma/client";
import { z } from "zod";

import { ForwardEntriesSelectionExpression } from "~/server/tasks/nodes/processNodes/forwardNodeEntries";
import { ProcessEntryResult } from "~/server/tasks/nodes/processNodes/processNode.task";
import { AtLeastOne } from "~/types/shared.types";
import { InferNodeConfig, typedNodeEntry } from "../node.types";

type CacheMatchField = "nodeEntryPersistentId" | "incomingInputHash" | "incomingOutputHash";
type CacheWriteField =
  | "outgoingInputHash"
  | "outgoingOutputHash"
  | "outgoingSplit"
  | "filterOutcome"
  | "explanation";

export type NodeProperties<T extends NodeType> = {
  schema: z.ZodObject<
    {
      type: z.ZodLiteral<T>;
      config: z.ZodObject<
        {},
        "passthrough",
        z.ZodTypeAny,
        z.objectOutputType<{}, z.ZodTypeAny, "passthrough">
      >;
    },
    "passthrough",
    z.ZodTypeAny
  >;
  cacheMatchFields?: AtLeastOne<CacheMatchField>;
  cacheWriteFields?: AtLeastOne<CacheWriteField>;
  readBatchSize?: number;
  outputs: {
    label: string;
    selectionExpression?: ForwardEntriesSelectionExpression;
  }[];
  hashableFields?: (node: { config: InferNodeConfig<T> } & Pick<Node, "id" | "projectId">) => {
    [key: string]: unknown;
  };
  getConcurrency?: (node: { config: InferNodeConfig<T> }) => number;
  processEntry?: ({
    node,
    entry,
  }: {
    node: { config: InferNodeConfig<T> } & Pick<Node, "projectId" | "hash">;
    entry: ReturnType<typeof typedNodeEntry> & Pick<NodeEntry, "id" | "outputHash">;
  }) => Promise<ProcessEntryResult>;
  beforeAll?: (
    node: { config: InferNodeConfig<T> } & Pick<Node, "id" | "projectId" | "hash">,
  ) => Promise<void>;
  afterAll?: (node: { config: InferNodeConfig<T> } & Pick<Node, "id" | "hash">) => Promise<void>;
};
