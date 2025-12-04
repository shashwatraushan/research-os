// src/app/api/projects/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List Projects (My Projects + Invites)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: {
      members: { some: { user: { email: session.user.email } } }
    },
    orderBy: { updatedAt: 'desc' },
    include: { 
        _count: { select: { tasks: true } },
        // Include current user's member record to check role/status
        members: {
            where: { user: { email: session.user.email } },
            select: { id: true, status: true, role: true } 
        }
    }
  });

  // Flatten data for frontend
  const formattedProjects = projects.map(p => ({
      ...p,
      myStatus: p.members[0]?.status || 'active', 
      myRole: p.members[0]?.role || 'VIEWER' // Used to show/hide Edit/Delete menu
  }));

  return NextResponse.json(formattedProjects);
}

// POST: Create New Project
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description } = await req.json();

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const project = await prisma.project.create({
    data: {
      title,
      description,
      ownerId: user.id,
      color: "#5E6AD2",
      status: "active",
      members: {
        create: { 
            userId: user.id, 
            role: "OWNER",
            status: "active",
            // --- Grant Full Access to Creator ---
            canEditLit: true,
            canEditData: true,
            canEditExps: true,
            canManageTeam: true,
            // Ensure these are true so Owner can manage tasks/artifacts immediately
            canEditTasks: true, 
            canEditArtifacts: true
            // ------------------------------------
        }
      }
    }
  });

  return NextResponse.json(project);
}