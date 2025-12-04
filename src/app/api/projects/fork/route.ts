import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { originalProjectId } = await req.json();

    // 1. Fetch Original Project with all sub-data
    const original = await prisma.project.findUnique({
      where: { id: originalProjectId },
      include: {
        tasks: true,
        papers: true,
        datasets: { include: { file: true } },
        experiments: true, // Only copying experiment metadata, not logs (too complex for V1)
        artifacts: { include: { file: true } }
      }
    });

    if (!original) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (!original.isPublic) return NextResponse.json({ error: "Project is private" }, { status: 403 });

    // 2. Create the "Forked" Project
    const newProject = await prisma.$transaction(async (tx) => {
      // A. Create Project Shell
      const project = await tx.project.create({
        data: {
          title: `${original.title} (Fork)`,
          description: original.description,
          field: original.field,
          color: original.color,
          ownerId: session.user.id,
          forkedFromId: original.id,
          status: 'active',
          isPublic: false, // Forks start as private
          
          // Create Owner Member
          members: {
            create: {
              userId: session.user.id,
              role: "OWNER",
              status: "active",
              canEditLit: true, canEditData: true, canEditExps: true, canEditTasks: true, canEditArtifacts: true, canManageTeam: true
            }
          },

          // B. Copy Tasks (Reset status)
          tasks: {
            create: original.tasks.map(t => ({
              title: t.title,
              status: 'todo',
              priority: t.priority
            }))
          },

          // C. Copy Literature
          papers: {
            create: original.papers.map(p => ({
              title: p.title,
              authors: p.authors,
              year: p.year,
              doi: p.doi,
              url: p.url,
              abstract: p.abstract,
              status: 'include', // Default to include
              topic: p.topic
            }))
          },
          
          // D. Copy Experiments (Metadata Only - Fresh Notebook)
          experiments: {
            create: original.experiments.map(e => ({
              title: e.title,
              method: e.method,
              hypothesis: e.hypothesis,
              metric: e.metric,
              status: 'planning'
            }))
          }
        }
      });

      // E. Copy Datasets (Advanced: Create new File records pointing to same URL)
      // We do this in a loop because nested writes with relations are tricky in Prisma create
      for (const ds of original.datasets) {
        if (ds.file) {
            const newFile = await tx.file.create({
                data: {
                    projectId: project.id,
                    type: "dataset",
                    name: ds.file.name,
                    url: ds.file.url, // Re-use the cloud URL
                    size: ds.file.size
                }
            });

            await tx.dataset.create({
                data: {
                    projectId: project.id,
                    fileId: newFile.id,
                    description: ds.description,
                    license: ds.license,
                    piiFlag: ds.piiFlag,
                    piiColumns: ds.piiColumns
                }
            });
        }
      }

      return project;
    });

    return NextResponse.json(newProject);

  } catch (error) {
    console.error("Fork Error:", error);
    return NextResponse.json({ error: "Failed to fork project" }, { status: 500 });
  }
}