// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, password, captchaToken } = await req.json();

    // 1. Verify CAPTCHA (Security Layer 1)
    const captchaRes = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      { method: "POST" }
    );
    const captchaJson = await captchaRes.json();
    
    // Note: Localhost sometimes gives a low score, so we check success first
    if (!captchaJson.success) {
      return NextResponse.json({ error: "Captcha failed" }, { status: 400 });
    }

    // 2. Enforce Strong Password (Security Layer 2)
    // This is the CRITICAL missing link.
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongRegex.test(password)) {
      return NextResponse.json({ 
        error: "Password is too weak. Requires 8+ chars, uppercase, number, & symbol." 
      }, { status: 400 });
    }

    // 3. Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create User
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: "OWNER", 
        name: email.split("@")[0],
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}