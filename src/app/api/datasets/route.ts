// src/app/api/datasets/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // UPDATED IMPORT
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: Upload as RAW with specific filename handling
async function uploadToCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Clean filename (remove spaces)
  const cleanName = (file.name || "data").replace(/\s+/g, "_");

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        resource_type: "raw", // CRITICAL: Treat as binary file
        folder: "research-os-datasets",
        public_id: `${Date.now()}_${cleanName}`, // Force unique name with extension
        use_filename: true, 
        format: cleanName.split('.').pop() // Ensure extension is preserved
      },
      (error, result) => {
        if (error) {
            console.error("Cloudinary Error:", error);
            reject(error);
        }
        else resolve(result?.secure_url || "");
      }
    );
    uploadStream.end(buffer);
  });
}

// Helper: Detect PII (Improved Newline Handling)
async function scanForPII(file: File): Promise<string[]> {
  try {
    const text = await file.text();
    
    // 1. Robust Split: Handles \n (Unix), \r\n (Windows), and \r (Old Mac)
    const lines = text.split(/\r\n|\n|\r/);
    if (lines.length === 0) return [];

    // 2. Get Headers (Row 1)
    const headerRow = lines[0].toLowerCase();
    
    // 3. Split headers by comma or semicolon
    const columns = headerRow.split(/[,;]/).map(c => c.trim().replace(/['"]+/g, ''));

    const dangerousTerms = [
      "email", "e-mail", "phone", "mobile", "cell",
      "ssn", "social security", "credit card", "id", "passport",
      "dob", "birthdate", "password", "secret", "ip address"
    ];

    // 4. Find matches
    return columns.filter(col => dangerousTerms.some(term => col.includes(term)));
  } catch (e) {
    console.error("PII Scan failed:", e);
    return []; 
  }
}

// GET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "Project ID required" }, { status: 400 });

  const datasets = await prisma.dataset.findMany({
    where: { projectId },
    include: { file: true },
    orderBy: { lastUpdated: "desc" }
  });
  return NextResponse.json(datasets);
}

// POST
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const projectId = formData.get("projectId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const license = formData.get("license") as string;
    const type = formData.get("type") as string;

    let finalUrl = "";
    let piiColumns: string[] = [];
    let isCsv = false;

    if (type === 'file') {
      const file = formData.get("file") as File;
      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
      
      piiColumns = await scanForPII(file);
      finalUrl = await uploadToCloudinary(file);
      
      // Check if CSV
      if (file.name.toLowerCase().endsWith('.csv')) {
        isCsv = true;
      }
    } else {
      finalUrl = formData.get("url") as string;
      if (finalUrl.toLowerCase().endsWith('.csv')) isCsv = true;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create File Record
      const newFile = await tx.file.create({
        data: { projectId, type: "dataset", name, url: finalUrl, size: 0 }
      });

      // 2. Create Dataset Record
      const newDataset = await tx.dataset.create({
        data: {
          projectId,
          fileId: newFile.id,
          description,
          license: license || "Unknown",
          piiFlag: piiColumns.length > 0,
          piiColumns: piiColumns,
          lastUpdated: new Date()
        },
        include: { file: true }
      });

      // 3. AUTO-GENERATE ARTIFACT
      // If CSV -> Heatmap. If Image -> Image. Else -> File.
      let artifactType = "file";
      if (isCsv) artifactType = "heatmap";
      else if (finalUrl.match(/\.(jpeg|jpg|gif|png)$/i)) artifactType = "image";

      await tx.artifact.create({
        data: {
            projectId,
            datasetId: newDataset.id, // Link it!
            title: isCsv ? `Correlation: ${name}` : `Dataset: ${name}`,
            subtitle: "Auto-generated from Dataset",
            type: artifactType,
            url: finalUrl 
        }
      });

      return newDataset;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to create dataset" }, { status: 500 });
  }
}

// PATCH (Update)
export async function PATCH(req: Request) {
  try {
    const formData = await req.formData();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const license = formData.get("license") as string;
    
    // Check for NEW file
    const file = formData.get("file") as File | null;
    const urlInput = formData.get("url") as string;

    const existing = await prisma.dataset.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let finalUrl = urlInput || existing.file?.url; // Fallback to existing if no new URL
    let piiColumns: string[] = existing.piiColumns; 
    let piiFlag = existing.piiFlag;

    // If REPLACING file
    if (file && file.size > 0) {
       console.log("Replacing file...");
       piiColumns = await scanForPII(file);
       piiFlag = piiColumns.length > 0;
       finalUrl = await uploadToCloudinary(file);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update File Record
      await tx.file.update({
        where: { id: existing.fileId },
        data: { name, url: finalUrl }
      });

      // Update Dataset Record
      const updated = await tx.dataset.update({
        where: { id },
        data: { 
            description, 
            license, 
            piiFlag, 
            piiColumns, 
            lastUpdated: new Date() 
        },
        include: { file: true }
      });
      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.dataset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}