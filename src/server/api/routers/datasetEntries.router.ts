import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";
import {
  requireCanModifyDataset,
  requireCanModifyExperiment,
  requireCanViewDataset,
} from "~/utils/accessControl";

const PAGE_SIZE = 10;

export const datasetEntries = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ datasetId: z.string(), page: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireCanViewDataset(input.datasetId, ctx);

      const { datasetId, page } = input;

      const entries = await prisma.datasetEntry.findMany({
        where: {
          datasetId,
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      });

      const count = await prisma.datasetEntry.count({
        where: {
          datasetId,
        },
      });

      return {
        entries,
        startIndex: (page - 1) * PAGE_SIZE + 1,
        lastPage: Math.ceil(count / PAGE_SIZE),
        count,
      };
    }),
  createOne: protectedProcedure
    .input(
      z.object({
        datasetId: z.string(),
        input: z.string(),
        output: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await requireCanModifyDataset(input.datasetId, ctx);

      return await prisma.datasetEntry.create({
        data: {
          datasetId: input.datasetId,
          input: input.input,
          output: input.output,
        },
      });
    }),

  autogenerate: protectedProcedure
    .input(
      z.object({
        datasetId: z.string(),
        numToGenerate: z.number(),
        instructions: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await requireCanModifyDataset(input.datasetId, ctx);

      const dataset = await prisma.dataset.findUnique({
        where: {
          id: input.datasetId,
        },
      });

      if (!dataset) {
        throw new Error(`Dataset with id ${input.datasetId} does not exist`);
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const datasetId = (
        await prisma.datasetEntry.findUniqueOrThrow({
          where: { id: input.id },
        })
      ).datasetId;

      await requireCanModifyExperiment(datasetId, ctx);

      return await prisma.datasetEntry.delete({
        where: {
          id: input.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        updates: z.object({
          input: z.string(),
          output: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.datasetEntry.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!existing) {
        throw new Error(`dataEntry with id ${input.id} does not exist`);
      }

      await requireCanModifyDataset(existing.datasetId, ctx);

      return await prisma.datasetEntry.update({
        where: {
          id: input.id,
        },
        data: {
          input: input.updates.input,
          output: input.updates.output,
        },
      });
    }),
});
