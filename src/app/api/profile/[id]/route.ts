import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Await params in Next.js 15
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, 
      name: true, 
      image: true, 
      bio: true,
      headline: true, 
      company: true, 
      website: true, 
      location: true,
      createdAt: true, 
      role: true,
      // Also fetch their PUBLIC projects to show on their profile
      memberships: {
          where: { 
              role: 'OWNER', 
              project: { isPublic: true } 
          },
          include: { 
              project: {
                  select: { title: true, description: true, id: true }
              } 
          }
      }
    }
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(user);
}