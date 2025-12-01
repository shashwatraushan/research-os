// src/app/api/artifacts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "research-os-artifacts" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || "");
      }
    ).end(buffer);
  });
}

// GET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "Project ID required" }, { status: 400 });

  const artifacts = await prisma.artifact.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(artifacts);
}

// POST (Create with File or URL)
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const projectId = formData.get("projectId") as string;
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    const caption = formData.get("caption") as string;
    const file = formData.get("file") as File | null;
    const urlInput = formData.get("url") as string;

    let finalUrl = urlInput;

    if (file && file.size > 0) {
        finalUrl = await uploadFile(file);
    }

    const artifact = await prisma.artifact.create({
      data: {
        projectId,
        title,
        type: type || "image",
        subtitle: caption,
        url: finalUrl || "",
        primaryFlag: false
      }
    });

    return NextResponse.json(artifact);
  } catch (error) {
    console.error("Create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH (Update)
export async function PATCH(req: Request) {
  try {
    const formData = await req.formData();
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const caption = formData.get("caption") as string;
    const file = formData.get("file") as File | null;
    
    const updates: any = { title, subtitle: caption };

    if (file && file.size > 0) {
        updates.url = await uploadFile(file);
    }

    const artifact = await prisma.artifact.update({
      where: { id },
      data: updates
    });

    return NextResponse.json(artifact);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.artifact.delete({ where: { id } });
  return NextResponse.json({ success: true });
}