import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Get Current User ID (for "isLikedByMe" check)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // 2. Fetch Projects
    const projects = await prisma.project.findMany({
      where: { isPublic: true },
      orderBy: { publishedAt: 'desc' }, // Show newest published posts first
      include: {
        // Fetch Owner details via Members relation
        members: {
            where: { role: 'OWNER' },
            take: 1,
            include: { 
                user: { 
                    select: { 
                        id: true,      // <--- CRITICAL for profile link
                        name: true, 
                        email: true,
                        image: true    // <--- CRITICAL for avatar
                    } 
                } 
            }
        },
        // Get counts for UI
        _count: { select: { likes: true, comments: true } },
        // Get visuals for the collage (Fetching 3 to fill the grid)
        artifacts: { 
            where: { type: { in: ['image', 'chart', 'heatmap'] } },
            take: 3, 
            orderBy: { createdAt: 'desc' }
        }
      }
    });

    // 3. Fetch User's Likes (Optimization: Single query)
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

    // 4. Transform Data for Frontend
    const feed = projects.map(p => {
        const ownerUser = p.members[0]?.user;

        return {
            ...p,
            // Flatten owner object for easy access
            owner: ownerUser ? {
                id: ownerUser.id,
                name: ownerUser.name,
                email: ownerUser.email,
                image: ownerUser.image,
            } : { 
                id: null, 
                name: "Unknown Researcher", 
                email: "", 
                image: null 
            },
            members: undefined, // Remove raw member list to keep payload clean
            isLikedByMe: likedProjectIds.has(p.id)
        };
    });

    return NextResponse.json(feed);
  } catch (error) {
    console.error("Feed Error:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}