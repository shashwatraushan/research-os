// src/app/api/projects/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route"; // We'll fix this import path in a second

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

  // 1. Get User ID
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // 2. Create Project & Add User as Owner
  const project = await prisma.project.create({
    data: {
      title,
      description,
      ownerId: user.id,
      color: "#5E6AD2", // Default color
      members: {
        create: { userId: user.id, role: "OWNER" }
      }
    }
  });

  return NextResponse.json(project);
}