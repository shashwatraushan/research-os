// src/app/api/papers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // UPDATED IMPORT

// GET: List papers for a project
export async function GET(req: Request) {
 const { searchParams } = new URL(req.url);
 const projectId = searchParams.get("projectId");


 if (!projectId) return NextResponse.json({ error: "Project ID required" }, { status: 400 });


 const papers = await prisma.paper.findMany({
   where: { projectId },
   orderBy: { createdAt: "desc" }
 });


 return NextResponse.json(papers);
}

// POST: Add a new paper
export async function POST(req: Request) {
 const session = await getServerSession(authOptions);
 if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


 try {
   const body = await req.json();
   const { projectId, title, authors, year, doi, status } = body;


   const paper = await prisma.paper.create({
     data: {
       projectId,
       title,
       authors,
       year: year ? parseInt(year) : undefined,
       doi: doi || undefined,
       status: status || "unsure",
       topic: body.topic || "General"
     }
   });


   return NextResponse.json(paper);
 } catch (error: any) {
   if (error.code === 'P2002') {
     return NextResponse.json({ error: "This DOI already exists in this project." }, { status: 409 });
   }
   return NextResponse.json({ error: "Failed to add paper" }, { status: 500 });
 }
}


// PATCH: Update Paper (Handles BOTH Status changes AND Full Edits)
export async function PATCH(req: Request) {
 const body = await req.json();
 const { id, ...updates } = body; // Separates 'id' from everything else


 if (!id) return NextResponse.json({ error: "Paper ID required" }, { status: 400 });


 // If the update includes a year (from Edit Modal), make sure it's a number
 if (updates.year) {
   updates.year = parseInt(updates.year);
 }


 // This one line handles BOTH cases:
 // 1. If frontend sends { id, status: 'include' } -> It updates status.
 // 2. If frontend sends { id, title: 'New Title' } -> It updates title.
 const paper = await prisma.paper.update({
   where: { id },
   data: updates
 });


 return NextResponse.json(paper);
}


// DELETE: Remove paper
export async function DELETE(req: Request) {
 const { searchParams } = new URL(req.url);
 const id = searchParams.get("id");
 if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });


 await prisma.paper.delete({ where: { id } });
 return NextResponse.json({ success: true });
}

