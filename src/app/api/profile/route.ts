import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from 'cloudinary';

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Helper: Upload Image
async function uploadProfileImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: "image", folder: "research-os-profiles" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || "");
      }
    ).end(buffer);
  });
}

// GET: Fetch Profile (Keep as is)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true, name: true, email: true, image: true, bio: true,
      headline: true, company: true, website: true, location: true,
      createdAt: true, role: true,
      _count: { select: { memberships: true, tasks: true } }
    }
  });

  return NextResponse.json(user);
}

// PATCH: Update Profile (Now handles Files)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Parse FormData (instead of JSON)
    const formData = await req.formData();
    
    // 2. Check for a new file
    const file = formData.get("file") as File | null;
    let imageUrl = formData.get("image") as string; // Existing URL if no new file

    if (file && file.size > 0) {
       // Upload new image if provided
       imageUrl = await uploadProfileImage(file);
    }

    // 3. Update Database
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: formData.get("name") as string,
        bio: formData.get("bio") as string,
        headline: formData.get("headline") as string,
        company: formData.get("company") as string,
        website: formData.get("website") as string,
        location: formData.get("location") as string,
        image: imageUrl
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}