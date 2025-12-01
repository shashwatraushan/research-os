// src/app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// POST (Create)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectId, title, assigneeId, dueDate } = body;

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      status: "todo",
      assigneeId: assigneeId || undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    }
  });
  return NextResponse.json(task);
}

// PATCH (Update Status OR Title)
export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, ...updates } = body; // Supports status AND title updates

  const task = await prisma.task.update({
    where: { id },
    data: updates
  });
  return NextResponse.json(task);
}

// DELETE
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}