// src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // UPDATED IMPORT

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({});

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const q = searchParams.get("q");

  if (!q) return NextResponse.json({});

  let whereCondition;

  if (projectId) {
    // Search specific project
    whereCondition = { projectId };
  } else {
    // GLOBAL SEARCH: Find all projects user is a member of
    const userProjects = await prisma.member.findMany({
      where: { userId: session.user.id },
      select: { projectId: true }
    });
    const projectIds = userProjects.map(m => m.projectId);
    
    // Search across ALL user's projects
    whereCondition = { projectId: { in: projectIds } };
  }

  // Common Search Logic
  const [papers, tasks, datasets, experiments, artifacts] = await Promise.all([
    prisma.paper.findMany({
      where: { ...whereCondition, title: { contains: q, mode: 'insensitive' } },
      take: 3
    }),
    prisma.task.findMany({
      where: { ...whereCondition, title: { contains: q, mode: 'insensitive' } },
      take: 3
    }),
    prisma.dataset.findMany({
      where: { ...whereCondition, file: { name: { contains: q, mode: 'insensitive' } } },
      include: { file: true },
      take: 3
    }),
    prisma.experiment.findMany({
      where: { ...whereCondition, title: { contains: q, mode: 'insensitive' } },
      take: 3
    }),
    prisma.artifact.findMany({
      where: { ...whereCondition, title: { contains: q, mode: 'insensitive' } },
      take: 3
    })
  ]);

  return NextResponse.json({ papers, tasks, datasets, experiments, artifacts });
}