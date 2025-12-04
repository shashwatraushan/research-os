import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: Toggle Like OR Add Comment
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, type, text } = await req.json(); // type: 'like' | 'comment'

  try {
      if (type === 'like') {
          // Check if already liked
          const existing = await prisma.like.findUnique({
              where: { projectId_userId: { projectId, userId: session.user.id } }
          });

          if (existing) {
              // Unlike
              await prisma.like.delete({ where: { id: existing.id } });
              return NextResponse.json({ liked: false });
          } else {
              // Like
              await prisma.like.create({
                  data: { projectId, userId: session.user.id }
              });
              return NextResponse.json({ liked: true });
          }
      } 
      
      else if (type === 'comment') {
          if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });
          
          const comment = await prisma.comment.create({
              data: {
                  projectId,
                  userId: session.user.id,
                  text
              },
              include: { user: { select: { name: true } } }
          });
          return NextResponse.json(comment);
      }
  } catch (e) {
      return NextResponse.json({ error: "Interaction failed" }, { status: 500 });
  }
}