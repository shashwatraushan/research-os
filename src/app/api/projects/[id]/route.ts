// src/app/api/projects/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Wait for the params to be available
  const { id } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: true,
        papers: true,
        experiments: { 
          include: { logs: true } 
        },
        artifacts: true,
        datasets: true,
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}