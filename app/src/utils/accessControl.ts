import { ProjectUserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { type TRPCContext } from "~/server/api/trpc";
import { prisma } from "~/server/db";

const isAdmin = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: "ADMIN" },
  });

  return !!user;
};

// No-op method for protected routes that really should be accessible to anyone.
export const requireNothing = (ctx: TRPCContext) => {
  ctx.markAccessControlRun();
};

export const requireCanViewProject = async (projectId: string, ctx: TRPCContext) => {
  ctx.markAccessControlRun();

  const userId = ctx.session?.user.id;
  if (!userId || !projectId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const canView = await prisma.projectUser.findFirst({
    where: {
      userId,
      projectId,
    },
  });

  if (!canView) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
      },
    });
    // Automatically add the user to the project if it's public
    if (project?.isPublic) {
      await prisma.projectUser.create({
        data: {
          userId,
          projectId,
          role: "VIEWER",
        },
      });
    } else {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
  }
};

export const requireCanModifyProject = async (projectId: string, ctx: TRPCContext) => {
  ctx.markAccessControlRun();

  const userId = ctx.session?.user.id;
  if (!userId || !projectId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const canModify = await prisma.projectUser.findFirst({
    where: {
      userId,
      projectId,
      role: { in: [ProjectUserRole.ADMIN, ProjectUserRole.MEMBER] },
    },
  });

  if (!canModify) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
};

export const requireIsProjectAdmin = async (projectId: string, ctx: TRPCContext) => {
  ctx.markAccessControlRun();

  const userId = ctx.session?.user.id;
  if (!userId || !projectId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const isAdmin = await prisma.projectUser.findFirst({
    where: {
      userId,
      projectId,
      role: "ADMIN",
    },
  });

  if (!isAdmin) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
};

export const requireCanModifyPruningRule = async (pruningRuleId: string, ctx: TRPCContext) => {
  ctx.markAccessControlRun();

  const userId = ctx.session?.user.id;
  if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

  const pruningRule = await prisma.pruningRule.findFirst({
    where: {
      id: pruningRuleId,
      dataset: {
        project: {
          projectUsers: {
            some: {
              role: { in: [ProjectUserRole.ADMIN, ProjectUserRole.MEMBER] },
              userId,
            },
          },
        },
      },
    },
  });

  if (!pruningRule) throw new TRPCError({ code: "UNAUTHORIZED" });
};

export const requireIsAdmin = async (ctx: TRPCContext) => {
  ctx.markAccessControlRun();

  const userId = ctx.session?.user.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!(await isAdmin(userId))) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
};

export const accessLevels = {
  requireNothing,
  requireCanViewProject,
  requireCanModifyProject,
  requireIsProjectAdmin,
  requireCanModifyPruningRule,
  requireIsAdmin,
} as const;

export type AccessLevel = keyof typeof accessLevels;
