import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth"; // Import Session
import { authOptions } from "@/lib/auth";     // Import Auth Options

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Get Current User ID
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // 2. Fetch Projects
    const projects = await prisma.project.findMany({
      where: { isPublic: true },
      orderBy: { publishedAt: 'desc' },
      include: {
        members: {
            where: { role: 'OWNER' },
            take: 1,
            include: { user: { select: { name: true, email: true } } }
        },
        _count: { select: { likes: true, comments: true } },
        artifacts: { 
            where: { type: { in: ['image', 'chart'] } },
            take: 2 
        }
      }
    });

    // 3. Fetch User's Likes (Optimization: Get all liked IDs for this user in one query)
    let likedProjectIds = new Set();
    if (userId) {
        const userLikes = await prisma.like.findMany({
            where: {
                userId: userId,
                projectId: { in: projects.map(p => p.id) }
            },
            select: { projectId: true }
        });
        likedProjectIds = new Set(userLikes.map(l => l.projectId));
    }

    // 4. Transform & Add "isLikedByMe" flag
    const feed = projects.map(p => ({
        ...p,
        owner: p.members[0]?.user || { name: "Unknown", email: "" },
        members: undefined,
        isLikedByMe: likedProjectIds.has(p.id) // <--- THIS IS THE KEY FIX
    }));

    return NextResponse.json(feed);
  } catch (error) {
    console.error("Feed Error:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}