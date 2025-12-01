// src/app/api/auth/change-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  // 1. Fetch User
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // 2. Verify Current Password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
  }

  // 3. Validate New Password Strength (Server-side check)
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!strongRegex.test(newPassword)) {
    return NextResponse.json({ error: "Weak password. Needs 8+ chars, uppercase, number, symbol." }, { status: 400 });
  }

  // 4. Update Password
  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email: session.user.email },
    data: { passwordHash: newHash }
  });

  return NextResponse.json({ success: true });
}