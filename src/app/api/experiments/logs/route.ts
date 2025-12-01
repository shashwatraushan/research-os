// src/app/api/experiments/logs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadEvidence(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "research-os-evidence" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || "");
      }
    ).end(buffer);
  });
}

// POST
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const experimentId = formData.get("experimentId") as string;
    const message = formData.get("message") as string;
    const type = formData.get("type") as string;
    const file = formData.get("file") as File | null;

    let link = null;
    let fileName = null;
    let isCsv = false;

    if (file && file.size > 0) {
        link = await uploadEvidence(file);
        fileName = file.name;
        if (file.name.toLowerCase().endsWith('.csv')) isCsv = true;
    }

    // 1. Create Log
    const log = await prisma.experimentLog.create({
      data: {
        experimentId,
        message,
        type: type || "note",
        link,
        fileName,
        hasEvidence: !!link
      },
      include: { experiment: true } // Need this to get ProjectId
    });

    // 2. AUTO-GENERATE ARTIFACT (If file exists)
    if (link && log.experiment?.projectId) {
        let artifactType = "file";
        if (isCsv) artifactType = "heatmap";
        else if (fileName?.match(/\.(jpeg|jpg|gif|png)$/i)) artifactType = "image";

        await prisma.artifact.create({
            data: {
                projectId: log.experiment.projectId,
                experimentLogId: log.id, // Link it!
                title: isCsv ? `Correlation: ${fileName}` : `Evidence: ${fileName}`,
                subtitle: `From Experiment: ${log.experiment.title}`,
                type: artifactType,
                url: link
            }
        });
    }

    return NextResponse.json(log);
  } catch (err) {
    console.error("Log Error:", err);
    return NextResponse.json({ error: "Log failed" }, { status: 500 });
  }
}

// PATCH (Pinning)
export async function PATCH(req: Request) {
  try {
    const body = await req.json(); // Patch is still JSON (no files)
    const { id, ...updates } = body;

    const log = await prisma.experimentLog.update({
      where: { id },
      data: updates
    });

    return NextResponse.json(log);
  } catch (err) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.experimentLog.delete({ where: { id } });
  return NextResponse.json({ success: true });
}