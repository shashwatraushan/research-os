// src/app/api/projects/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  // 1. Fetch Project with Members
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
        members: { include: { user: true } }, // Get member details
        tasks: true,
        papers: true,
        experiments: { include: { logs: true } },
        artifacts: true,
        datasets: { include: { file: true } },
    }
  });

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 2. Determine User's Access Level
  let currentUserMember = null;
  
  if (session?.user?.email) {
      // Find the current user in the member list
      currentUserMember = project.members.find(m => m.user.email === session.user.email);
  }

  // 3. Authorization Check
  if (currentUserMember) {
      // SCENARIO A: User is a Member (Owner or Collaborator)
      // We return the project AND their specific permissions
      return NextResponse.json({
          ...project,
          accessLevel: "member",
          permissions: {
              canEditLit: currentUserMember.canEditLit,
              canEditData: currentUserMember.canEditData,
              canEditExps: currentUserMember.canEditExps,
              canManageTeam: currentUserMember.canManageTeam
          }
      });
  } 
  else if (project.isPublic) {
      // SCENARIO B: Project is Public (Guest View)
      // User is NOT a member, but project is public.
      return NextResponse.json({
          ...project,
          accessLevel: "public",
          permissions: {
              canEditLit: false,
              canEditData: false,
              canEditExps: false,
              canManageTeam: false
          }
      });
  } 
  else {
      // SCENARIO C: Private Project & User not invited
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}


// ... existing GET method ...

// NEW: Update Project Settings (Visibility)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // 1. Verify Ownership (Only Owners can change visibility)
  const project = await prisma.project.findUnique({
    where: { id },
    include: { members: true }
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = project.members.some(
    m => m.userId === session.user.id && m.role === "OWNER"
  );

  if (!isOwner) {
    return NextResponse.json({ error: "Only the owner can change settings" }, { status: 403 });
  }

  // 2. Update
  const updated = await prisma.project.update({
    where: { id },
    data: {
      isPublic: body.isPublic,
      // If turning public, set publishedAt if not already set
      publishedAt: body.isPublic && !project.publishedAt ? new Date() : undefined
    }
  });

  return NextResponse.json(updated);
}