import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) return NextResponse.json({ error: "Project ID required" }, { status: 400 });

  try {
    const comments = await prisma.comment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }, // Newest first
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}