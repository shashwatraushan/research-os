// src/app/api/experiments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) return NextResponse.json({ error: "Project ID required" }, { status: 400 });

    const experiments = await prisma.experiment.findMany({
      where: { projectId },
      orderBy: { startDate: "desc" },
      include: { logs: { orderBy: { createdAt: 'desc' } } }
    });

    return NextResponse.json(experiments);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch experiments" }, { status: 500 });
  }
}

// POST (Create)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Log the body to verify data is arriving
    console.log("Creating Experiment:", body);

    const { projectId, title, method, hypothesis, metric, status } = body;

    const experiment = await prisma.experiment.create({
      data: {
        projectId,
        title,
        method,
        hypothesis,
        metric,
        status: status || "planned",
        startDate: new Date(),
      }
    });

    return NextResponse.json(experiment);
  } catch (error) {
    // This logs the REAL error to your terminal
    console.error("CREATE Error:", error); 
    return NextResponse.json({ error: "Failed to create experiment" }, { status: 500 });
  }
}

// PATCH
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    const experiment = await prisma.experiment.update({
      where: { id },
      data: updates
    });

    return NextResponse.json(experiment);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.experiment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}