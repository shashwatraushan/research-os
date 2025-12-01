// src/app/api/projects/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // UPDATED IMPORT

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: {
      members: { some: { user: { email: session.user.email } } }
    },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { tasks: true } } }
  });

  return NextResponse.json(projects);
}

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
      members: {
        create: { 
            userId: user.id, 
            role: "OWNER",
            // --- NEW: Grant Full Access to Creator ---
            canEditLit: true,
            canEditData: true,
            canEditExps: true,
            canManageTeam: true
            // ---------------------------------------
        }
      }
    }
  });

  return NextResponse.json(project);
}