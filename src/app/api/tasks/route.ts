// src/app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // UPDATED IMPORT

// POST (Create)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // Extract new field
  const { projectId, title, assigneeId, dueDate, sendReminder } = body; 

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      status: "todo",
      assigneeId: assigneeId || undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      sendReminder: sendReminder || false, // Save the preference
      reminderSent: false
    }
  });
  return NextResponse.json(task);
}

// PATCH (Update)
export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, ...updates } = body; 

  // If user changes due date, reset the 'sent' flag so they get reminded again
  if (updates.dueDate) {
      updates.reminderSent = false;
  }

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