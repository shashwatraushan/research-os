import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: Invite (or Update) a Member
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, email, permissions } = await req.json();

  // 1. Verify Permission (Requester must be Owner/Manager)
  const requester = await prisma.member.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } }
  });

  if (!requester?.canManageTeam && requester?.role !== "OWNER") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // 2. Find User
  const userToInvite = await prisma.user.findUnique({ where: { email } });
  if (!userToInvite) {
    return NextResponse.json({ error: "User not found. They must sign up first." }, { status: 404 });
  }

  try {
    // 3. UPSERT: Update if exists, Create if new
    const member = await prisma.member.upsert({
      where: {
        projectId_userId: { projectId, userId: userToInvite.id }
      },
      update: {
        // If they already exist, just update permissions (status remains whatever it was)
        ...permissions
      },
      create: {
        // If new, set status to "invited"
        projectId,
        userId: userToInvite.id,
        role: "MEMBER",
        status: "invited", 
        ...permissions
      },
      include: { user: true }
    });

    return NextResponse.json(member);
  } catch (e) {
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
  }
}

// PATCH: Accept Invite
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await req.json();

  // 1. Verify User is accepting their OWN invite
  // We find the member record and ensure the linked User ID matches the Session User ID
  const member = await prisma.member.findUnique({ 
    where: { id },
    include: { user: true } 
  });

  if (!member) return NextResponse.json({ error: "Member record not found" }, { status: 404 });

  if (member.userId !== session.user.id) {
    return NextResponse.json({ error: "You can only accept your own invites" }, { status: 403 });
  }

  // 2. Update Status
  const updated = await prisma.member.update({
    where: { id },
    data: { status }
  });

  return NextResponse.json(updated);
}

// DELETE: Remove Member
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("id");
  if (!memberId) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.member.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
}