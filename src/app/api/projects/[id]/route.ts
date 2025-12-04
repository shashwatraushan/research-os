import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Fetch Project Details & Permissions
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  // 1. Fetch Project with Members & Related Data
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
        members: { include: { user: true } },
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
      currentUserMember = project.members.find(m => m.user.email === session.user.email);
  }

  // 3. Authorization Check
  if (currentUserMember) {
      // SCENARIO A: User is a Member (Owner or Collaborator)
      return NextResponse.json({
          ...project,
          accessLevel: "member",
          permissions: {
              isOwner: currentUserMember.role === "OWNER",
              canEditLit: currentUserMember.canEditLit,
              canEditData: currentUserMember.canEditData,
              canEditExps: currentUserMember.canEditExps,
              canManageTeam: currentUserMember.canManageTeam,
              // INCLUDED: The new fields you added to your schema
              canEditTasks: currentUserMember.canEditTasks,
              canEditArtifacts: currentUserMember.canEditArtifacts
          }
      });
  } 
  else if (project.isPublic) {
      // SCENARIO B: Project is Public (Guest View)
      return NextResponse.json({
          ...project,
          accessLevel: "public",
          permissions: {
              isOwner: false,
              canEditLit: false,
              canEditData: false,
              canEditExps: false,
              canManageTeam: false,
              canEditTasks: false,
              canEditArtifacts: false
          }
      });
  } 
  else {
      // SCENARIO C: Private Project & User not invited
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}

// PATCH: Update Project (Handles Title, Description, Color, & Visibility)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // 1. Verify Ownership
  const project = await prisma.project.findUnique({
    where: { id },
    include: { members: true }
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the OWNER can edit project details
  const isOwner = project.members.some(
    m => m.userId === session.user.id && m.role === "OWNER"
  );

  if (!isOwner) {
    return NextResponse.json({ error: "Only the owner can edit this project" }, { status: 403 });
  }

  // 2. Prepare Data (Only update fields sent in the request)
  const dataToUpdate: any = {};
  if (body.title !== undefined) dataToUpdate.title = body.title;
  if (body.description !== undefined) dataToUpdate.description = body.description;
  if (body.color !== undefined) dataToUpdate.color = body.color;
  // Social Feed Info (THIS WAS MISSING)
  if (body.postHeading !== undefined) dataToUpdate.postHeading = body.postHeading;
  if (body.postSummary !== undefined) dataToUpdate.postSummary = body.postSummary;
  if (body.tags !== undefined) dataToUpdate.tags = body.tags;
  
  // Handle Visibility Toggle
  if (body.isPublic !== undefined) {
      dataToUpdate.isPublic = body.isPublic;
      // If setting to public and it wasn't before, set the published date
      if (body.isPublic && !project.publishedAt) {
          dataToUpdate.publishedAt = new Date();
      }
  }

  try {
    const updated = await prisma.project.update({
      where: { id },
      data: dataToUpdate
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update Project Error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE: Delete Project
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // 1. Verify Ownership
  const project = await prisma.project.findUnique({
    where: { id },
    include: { members: true }
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the OWNER can delete the project
  const isOwner = project.members.some(
    m => m.userId === session.user.id && m.role === "OWNER"
  );

  if (!isOwner) {
    return NextResponse.json({ error: "Only the owner can delete this project" }, { status: 403 });
  }

  // 2. Perform Delete
  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Project Error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}