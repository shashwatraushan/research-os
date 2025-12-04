import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { projectId } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
    }

    // 1. Fetch FULL Project Context
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        papers: true,
        experiments: { include: { logs: true } },
        datasets: true,
        artifacts: true
      }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // 2. Construct a Rich Context Prompt
    const context = `
      Project Title: ${project.title}
      Description: ${project.description || "N/A"}
      Field: ${project.field || "General Science"}
      
      Key Stats:
      - ${project.papers.length} papers reviewed
      - ${project.experiments.length} experiments conducted
      - ${project.datasets.length} datasets analyzed

      Experiment Details:
      ${project.experiments.map(e => `- Study: ${e.title}\n  Hypothesis: ${e.hypothesis || 'N/A'}\n  Conclusion: ${e.conclusion || 'Ongoing'}`).join('\n')}

      Key Tasks Completed:
      ${project.tasks.filter(t => t.status === 'done').map(t => `- ${t.title}`).join('\n')}
    `;

    const prompt = `
      You are a science communicator. Write a catchy, professional social media post for this research project based on the data below.
      
      ${context}

      Instructions:
      - Return ONLY a JSON object. Do not include markdown formatting like \`\`\`json.
      - Fields required:
        1. "heading": A punchy title (max 10 words).
        2. "summary": A compelling summary of the progress and findings (max 80 words).
        3. "tags": An array of 3-5 relevant hashtags (strings).
    `;

    // 3. Call Gemini (Updated Model Name)
    // We changed 'gemini-1.5-flash' to 'gemini-1.5-flash-latest' to fix the 404
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
        const err = await response.json();
        console.log("Google API Error:", JSON.stringify(err, null, 2));
        return NextResponse.json({ error: "Gemini API Error", details: err }, { status: response.status });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    return NextResponse.json({ text });

  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}