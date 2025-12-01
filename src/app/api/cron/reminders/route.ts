import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();

    // 1. Precise Query Logic
    const tasks = await prisma.task.findMany({
      where: {
        status: "todo",          // Task is not done
        sendReminder: true,      // User ASKED for a reminder
        reminderSent: false,     // We haven't sent it yet
        dueDate: {
          lte: now,              // The due time has passed (or is right now)
        },
        assignee: { email: { not: undefined } }
      },
      include: { assignee: true, project: true }
    });

    if (tasks.length === 0) return NextResponse.json({ message: "No pending reminders." });

    // 2. Setup Mailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 3. Send & Update Database
    const results = [];
    for (const task of tasks) {
      if (task.assignee?.email) {
        
        // A. Send Email
        await transporter.sendMail({
            from: '"Research OS" <no-reply@researchos.com>',
            to: task.assignee.email,
            subject: `🔔 Reminder: ${task.title}`,
            text: `Your task is due now: ${task.title}`,
            html: `...html content...`
        });

        // B. MARK AS SENT (Critical to prevent spam)
        await prisma.task.update({
            where: { id: task.id },
            data: { reminderSent: true }
        });

        results.push(task.id);
      }
    }

    return NextResponse.json({ success: true, sentCount: results.length });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}