import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { prisma } from "~/server/db";
import { success } from "~/utils/errorHandling/standardResponses";
import { requireIsProjectAdmin } from "~/utils/accessControl";
import { TRPCError } from "@trpc/server";

export const usersRouter = createTRPCRouter({
  inviteToProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        email: z.string().email(),
        role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await requireIsProjectAdmin(input.projectId, ctx);

      const user = await prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (user) {
        const existingMembership = await prisma.projectUser.findUnique({
          where: {
            projectId_userId: {
              projectId: input.projectId,
              userId: user.id,
            },
          },
        });

        if (existingMembership) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `A user with ${input.email} is already a member of this project`,
          });
        }
      }

      const invitation = await prisma.userInvitation.upsert({
        where: {
          projectId_email: {
            projectId: input.projectId,
            email: input.email,
          },
        },
        update: {
          role: input.role,
        },
        create: {
          projectId: input.projectId,
          email: input.email,
          role: input.role,
          invitationToken: uuidv4(),
          senderId: ctx.session.user.id,
        },
      });

      //   TODO: send email

      return success();
    }),
  getProjectInvitation: protectedProcedure
    .input(
      z.object({
        invitationToken: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const invitation = await prisma.userInvitation.findUnique({
        where: {
          invitationToken: input.invitationToken,
        },
        include: {
          project: {
            select: {
              name: true,
            },
          },
          sender: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return invitation;
    }),
  acceptProjectInvitation: protectedProcedure
    .input(
      z.object({
        invitationToken: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const invitation = await prisma.userInvitation.findUnique({
        where: {
          invitationToken: input.invitationToken,
        },
      });

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await prisma.projectUser.create({
        data: {
          projectId: invitation.projectId,
          userId: ctx.session.user.id,
          role: invitation.role,
        },
      });

      await prisma.userInvitation.delete({
        where: {
          invitationToken: input.invitationToken,
        },
      });

      return success(invitation.projectId);
    }),
  cancelProjectInvitation: protectedProcedure
    .input(
      z.object({
        invitationToken: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const invitation = await prisma.userInvitation.findUnique({
        where: {
          invitationToken: input.invitationToken,
        },
      });

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await requireIsProjectAdmin(invitation.projectId, ctx);

      await prisma.userInvitation.delete({
        where: {
          invitationToken: input.invitationToken,
        },
      });

      return success();
    }),
  editProjectUserRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
        role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await requireIsProjectAdmin(input.projectId, ctx);

      await prisma.projectUser.update({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
        data: {
          role: input.role,
        },
      });

      return success();
    }),
  removeUserFromProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await requireIsProjectAdmin(input.projectId, ctx);

      await prisma.projectUser.delete({
        where: {
          projectId_userId: {
            projectId: input.projectId,
            userId: input.userId,
          },
        },
      });

      return success();
    }),
});
