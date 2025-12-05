"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { 
  Loader2, Quote, Link as LinkIcon, Calendar, Users, 
  CheckCircle2, Activity, Check, Database, FlaskConical 
} from 'lucide-react';
import { GiArchiveResearch } from "react-icons/gi"; 

// --- 1. UTILITIES ---

const calculateCorrelation = (data: any[], key1: string, key2: string) => {
    const n = data.length;
    let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
    for (let i = 0; i < n; i++) {
        const x = Number(data[i][key1]);
        const y = Number(data[i][key2]);
        if (isNaN(x) || isNaN(y)) return 0;
        sum1 += x; sum2 += y;
        sum1Sq += x * x; sum2Sq += y * y;
        pSum += x * y;
    }
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    return den === 0 ? 0 : num / den;
};

const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r\n|\n/).filter(l => l.trim());
    if (lines.length < 2) return null;
    // Handle CSV quotes robustly
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '')); 
    const rawData = lines.slice(1).map(line => {
        // Regex to split by comma but ignore commas inside quotes
        const vals = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const obj: any = {};
        headers.forEach((h, i) => obj[h] = vals[i]?.replace(/^"|"$/g, '') || "");
        return obj;
    });
    
    const numericCols = headers.filter(h => rawData.every(row => !isNaN(Number(row[h])) && row[h] !== ""));
    const displayCols = numericCols.slice(0, 10); // Limit 10x10
    const matrix = displayCols.map(c1 => displayCols.map(c2 => calculateCorrelation(rawData, c1, c2)));
    
    return { headers, data: rawData, matrix, displayCols };
};

const getDoiLink = (doi: string) => {
    if (!doi) return "";
    return doi.startsWith("http") ? doi : `https://doi.org/${doi}`;
};

// --- 2. VISUAL COMPONENTS ---

// Custom Page Component (Not from Recharts)
const Page = ({ title, subtitle, children, className = "" }: any) => (
  <div className={`w-[297mm] h-[210mm] bg-white text-slate-900 p-[20mm] relative break-after-page overflow-hidden flex flex-col ${className}`}>
     {/* Minimal Header */}
     <div className="flex justify-between items-start mb-12 border-b border-slate-100 pb-6 shrink-0">
        <div>
            <div className="flex items-center gap-3 text-slate-400 mb-2">
                <GiArchiveResearch size={18}/>
                <span className="text-xs font-bold tracking-widest uppercase">Research OS</span>
            </div>
            <h2 className="text-3xl font-light tracking-tight text-slate-900">{title}</h2>
        </div>
        {subtitle && (
            <div className="text-right max-w-sm">
                <p className="text-sm text-slate-500 leading-relaxed">{subtitle}</p>
            </div>
        )}
     </div>

     {/* Content */}
     <div className="flex-1 min-h-0 flex flex-col relative">
        {children}
     </div>
     
     {/* Minimal Footer */}
     <div className="absolute bottom-8 left-[20mm] right-[20mm] flex justify-between text-[9px] text-slate-300 font-mono uppercase tracking-widest mt-auto">
        <span>Confidential Project Data</span>
        <span>{new Date().toLocaleDateString()}</span>
     </div>
  </div>
);

const HeatmapViz = ({ data }: { data: any }) => {
    if (!data || !data.matrix) return null;
    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="grid gap-px" style={{ gridTemplateColumns: `auto repeat(${data.displayCols.length}, 1fr)` }}>
                 {/* Top Left Blank */}
                 <div></div>
                 
                 {/* X-Axis Labels */}
                 {data.displayCols.map((col: string, i: number) => (
                     <div key={`h-${i}`} className="text-[9px] text-center rotate-[-90deg] origin-bottom translate-y-4 font-medium text-slate-500">{col.substring(0, 12)}</div>
                 ))}

                 {/* Rows */}
                 {data.matrix.map((row: number[], i: number) => (
                     <React.Fragment key={`r-${i}`}>
                        {/* Y-Axis Label */}
                        <div key={`v-${i}`} className="text-[9px] flex items-center justify-end pr-3 font-medium text-slate-500">{data.displayCols[i].substring(0, 12)}</div>
                        
                        {/* Cells */}
                        {row.map((val: number, j: number) => {
                             const opacity = Math.abs(val);
                             const color = val > 0 ? `rgba(99, 102, 241, ${opacity})` : `rgba(148, 163, 184, ${opacity})`; 
                             return (
                                 <div key={`${i}-${j}`} className="w-10 h-10 flex items-center justify-center text-[10px] font-medium transition-colors" style={{ backgroundColor: color, color: opacity > 0.5 ? 'white' : 'transparent' }}>
                                     {val.toFixed(1)}
                                 </div>
                             )
                        })}
                     </React.Fragment>
                 ))}
            </div>
        </div>
    );
};

// --- 3. MAIN LOGIC ---

function ReportContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const [project, setProject] = useState<any>(null);
  const [csvData, setCsvData] = useState<Record<string, any>>({});
  const [aiSummary, setAiSummary] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("Initializing...");

  useEffect(() => {
    if (!projectId) return;

    const loadPipeline = async () => {
        try {
            // 1. Fetch Project Data
            setStep("Fetching Project Data...");
            const res = await fetch(`/api/projects/${projectId}`);
            const data = await res.json();
            setProject(data);

            // 2. Process Datasets (Heatmaps)
            setStep("Analyzing Datasets...");
            const csvUrls: { id: string, url: string }[] = [];
            data.datasets?.forEach((ds: any) => {
                if (ds.file?.url?.includes('.csv') || ds.file?.name?.endsWith('.csv')) {
                    csvUrls.push({ id: ds.id, url: ds.file.url });
                }
            });
            const processedCsv: Record<string, any> = {};
            await Promise.all(csvUrls.map(async (item) => {
                try {
                    const r = await fetch(item.url);
                    const txt = await r.text();
                    processedCsv[item.id] = parseCSV(txt);
                } catch (e) { console.warn("CSV Fail", item.id); }
            }));
            setCsvData(processedCsv);

            // 3. Generate AI Summary (Always run this, regardless of description)
            setStep("Generating AI Insights...");
            try {
                const aiRes = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // We send the ID so backend can fetch full context (tasks, papers, etc)
                    body: JSON.stringify({ projectId: data.id }) 
                });
                
                if (!aiRes.ok) throw new Error("AI API Error");

                const aiJson = await aiRes.json();
                
                // Robust Parsing Logic
                const cleanText = aiJson.text.replace(/```json|```/g, '').trim();
                let parsed;
                try {
                    parsed = JSON.parse(cleanText);
                } catch (e) {
                    // If AI returns plain text, use it as the summary
                    parsed = { summary: cleanText };
                }
                
                setAiSummary(parsed.summary || data.description || "No summary available.");
            } catch (err) {
                console.warn("AI Generation Failed, using description fallback.");
                setAiSummary(data.description || "Automated summary unavailable."); 
            }

            // 4. Finish & Print
            setStep("Finalizing Report...");
            setLoading(false);
            
            // Small delay to ensure React render completes before print dialog
            setTimeout(() => window.print(), 1000);

        } catch (e) {
            setStep("Error loading report.");
            setLoading(false);
        }
    };
    loadPipeline();
  }, [projectId]);

  const stats = useMemo(() => {
    if (!project) return { donut: [], bar: [] };
    const done = project.tasks?.filter((t: any) => t.status === 'done').length || 0;
    const total = project.tasks?.length || 0;
    return {
        donut: [{ name: 'Complete', value: done, color: '#1E293B' }, { name: 'Pending', value: total - done, color: '#E2E8F0' }],
        bar: Object.entries((project.papers || []).reduce((acc: any, p: any) => ({ ...acc, [p.year || 'Unknown']: (acc[p.year || 'Unknown'] || 0) + 1 }), {})).map(([name, value]) => ({ name, value }))
    };
  }, [project]);

  if (loading) return (
      <div className="min-h-screen flex flex-col items-center justify-center font-sans bg-white text-slate-900">
          <Loader2 className="animate-spin mb-4 text-indigo-600" size={32}/>
          <h2 className="text-sm font-medium tracking-widest uppercase">{step}</h2>
      </div>
  );

  if (!project) return <div className="p-10 text-center">Project not found.</div>;

  return (
    <div className="bg-slate-50 min-h-screen print:bg-white font-sans">
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print { 
            body { -webkit-print-color-adjust: exact; } 
            .break-after-page { page-break-after: always; }
        }
      `}</style>

      {/* PAGE 1: COVER */}
      <div className="w-[297mm] h-[210mm] bg-slate-900 text-white p-[20mm] relative break-after-page flex flex-col justify-between">
         <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
             <GiArchiveResearch size={400} />
         </div>

         <div>
             <div className="flex items-center gap-3 text-indigo-400 mb-12">
                <GiArchiveResearch size={24}/>
                <span className="text-sm font-bold tracking-[0.2em] uppercase">Research OS</span>
             </div>
             <h1 className="text-7xl font-light tracking-tight mb-6 leading-[1.1]">{project.title}</h1>
             <p className="text-xl text-slate-400 font-light max-w-2xl">{project.description}</p>
         </div>

         <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-sm max-w-3xl">
             <div className="flex items-start gap-4">
                 <Quote size={24} className="text-indigo-400 shrink-0 mt-1"/>
                 <div>
                     <p className="text-lg text-slate-200 font-light leading-relaxed italic">
                        "{aiSummary}"
                     </p>
                     <p className="text-xs text-indigo-400 mt-4 font-bold uppercase tracking-wider flex items-center gap-2">
                        <FlaskConical size={12}/> AI Generated Abstract
                     </p>
                 </div>
             </div>
         </div>

         <div className="flex justify-between items-end border-t border-white/10 pt-6">
             <div className="flex gap-12">
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Owner</div>
                    <div className="text-sm font-medium flex items-center gap-2"><Users size={14}/> {project.members?.[0]?.user?.name || "Unknown"}</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Date</div>
                    <div className="text-sm font-medium flex items-center gap-2"><Calendar size={14}/> {new Date().toLocaleDateString()}</div>
                </div>
             </div>
             <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Project ID</div>
                <div className="font-mono text-xs text-slate-400">{project.id}</div>
             </div>
         </div>
      </div>

      {/* PAGE 2: EXECUTIVE DASHBOARD */}
      <Page title="Executive Dashboard" subtitle="High-level metrics and project velocity analysis.">
         <div className="grid grid-cols-4 gap-8 h-full">
             {/* KPIs */}
             <div className="col-span-1 flex flex-col gap-6 border-r border-slate-100 pr-8">
                 <div className="p-6 bg-slate-50 rounded-sm">
                     <div className="text-4xl font-light text-indigo-600 mb-1">{project.tasks?.length || 0}</div>
                     <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total Tasks</div>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-sm">
                     <div className="text-4xl font-light text-slate-900 mb-1">{project.papers?.length || 0}</div>
                     <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Papers Indexed</div>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-sm">
                     <div className="text-4xl font-light text-slate-900 mb-1">{project.datasets?.length || 0}</div>
                     <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Datasets</div>
                 </div>
             </div>

             {/* Charts */}
             <div className="col-span-3 grid grid-cols-2 gap-12">
                 <div>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Task Completion Rate</h3>
                     <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.donut} innerRadius={60} outerRadius={80} dataKey="value" isAnimationActive={false}>
                                    {stats.donut.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color}/>)}
                                </Pie>
                                <Tooltip/>
                            </PieChart>
                        </ResponsiveContainer>
                     </div>
                 </div>
                 <div>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Literature Timeline</h3>
                     <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.bar}>
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false}/>
                                <Bar dataKey="value" fill="#6366F1" isAnimationActive={false} radius={[2,2,0,0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                 </div>
             </div>
         </div>
      </Page>

      {/* PAGE 3: LITERATURE REVIEW */}
      <Page title="Literature Review" subtitle="Comprehensive bibliographic index.">
         <div className="border border-slate-200 rounded-sm overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider font-bold text-slate-500">
                    <tr>
                        <th className="p-4 border-b border-slate-200 w-[40%]">Title</th>
                        <th className="p-4 border-b border-slate-200 w-[25%]">Authors</th>
                        <th className="p-4 border-b border-slate-200 w-[10%]">Year</th>
                        <th className="p-4 border-b border-slate-200 w-[25%]">DOI / Link</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {project.papers?.map((p: any) => (
                        <tr key={p.id}>
                            <td className="p-4 font-medium text-slate-900">{p.title}</td>
                            <td className="p-4 text-slate-500">{p.authors}</td>
                            <td className="p-4 text-slate-500">{p.year || "-"}</td>
                            <td className="p-4">
                                {p.doi ? (
                                    <a href={getDoiLink(p.doi)} target="_blank" className="text-indigo-600 hover:underline flex items-center gap-2 text-xs">
                                        <LinkIcon size={12}/> {p.doi}
                                    </a>
                                ) : <span className="text-slate-300">-</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </Page>

      {/* PAGE 4+: DATASETS */}
      {project.datasets?.map((ds: any) => (
         <Page key={ds.id} title="Data Analysis" subtitle={`Asset: ${ds.file?.name}`}>
             <div className="grid grid-cols-12 gap-12 h-full">
                 {/* Metadata Side */}
                 <div className="col-span-4 space-y-8 border-r border-slate-100 pr-8">
                     <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Description</span>
                         <p className="text-sm text-slate-700 leading-relaxed">{ds.description || "No description provided."}</p>
                     </div>
                     
                     <div className="p-4 bg-slate-50 rounded-sm border border-slate-100">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Safety Compliance</span>
                         {ds.piiFlag ? (
                             <div className="flex items-center gap-2 text-red-600 text-sm font-bold"><Activity size={16}/> PII Detected</div>
                         ) : (
                             <div className="flex items-center gap-2 text-green-600 text-sm font-bold"><CheckCircle2 size={16}/> Verified Safe</div>
                         )}
                     </div>

                     <div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">License</span>
                         <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded-sm">{ds.license || "Unknown"}</span>
                     </div>
                 </div>

                 {/* Visualization Side */}
                 <div className="col-span-8 flex flex-col">
                     <div className="flex-1 flex flex-col items-center justify-center border border-slate-100 rounded-sm bg-slate-50/50 p-8 relative">
                         <h4 className="absolute top-4 left-4 text-xs font-bold uppercase tracking-widest text-slate-400">Correlation Matrix</h4>
                         {csvData[ds.id] ? (
                             <HeatmapViz data={csvData[ds.id]} />
                         ) : (
                             <div className="text-slate-400 italic text-sm">
                                 {ds.file?.url?.includes('.csv') ? "Rendering Visualization..." : "Preview not available for this file type."}
                             </div>
                         )}
                     </div>
                 </div>
             </div>
         </Page>
      ))}

      {/* PAGE 5+: EXPERIMENTS & IMAGES */}
      {project.experiments?.length > 0 && (
         <Page title="Experimental Notebook" subtitle="Key findings and evidence logs.">
             <div className="grid grid-cols-2 gap-8 h-full">
                 {project.experiments.slice(0, 2).map((exp: any) => (
                     <div key={exp.id} className="border border-slate-200 rounded-sm p-6 flex flex-col h-full">
                         <div className="mb-6">
                             <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1">{exp.status}</div>
                             <h3 className="text-xl font-bold text-slate-900">{exp.title}</h3>
                         </div>
                         
                         <div className="space-y-4 mb-8 flex-1">
                             <div className="bg-slate-50 p-4 rounded-sm text-sm">
                                 <strong className="block text-slate-900 mb-1">Hypothesis</strong>
                                 <span className="text-slate-600">{exp.hypothesis}</span>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-sm text-sm border-l-2 border-indigo-500">
                                 <strong className="block text-slate-900 mb-1">Conclusion</strong>
                                 <span className="text-slate-600">{exp.conclusion || "Pending Analysis"}</span>
                             </div>
                         </div>

                         {/* Evidence Images */}
                         <div className="grid grid-cols-2 gap-4 mt-auto">
                             {exp.logs?.filter((l: any) => l.hasEvidence).slice(0, 2).map((log: any) => (
                                 <div key={log.id} className="aspect-video relative bg-slate-100 rounded-sm overflow-hidden">
                                     {log.link && log.link.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                                         <img src={log.link} className="w-full h-full object-cover" alt="Evidence"/>
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">File</div>
                                     )}
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
             </div>
         </Page>
      )}

    </div>
  );
}

// --- 4. EXPORT WRAPPER ---
export default function ProjectReportPageWrapper() {
  return (
      <div className="min-h-screen bg-white text-slate-900">
          <Suspense fallback={<div className="p-12 flex items-center gap-4"><Loader2 className="animate-spin"/> Loading Report Generator...</div>}>
              <ReportContent />
          </Suspense>
      </div>
  );
}