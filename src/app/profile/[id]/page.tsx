"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, MapPin, Link as LinkIcon, Briefcase, Calendar, 
  User as UserIcon, Loader2, ArrowRight, Folder 
} from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/profile/${params.id}`)
        .then(res => {
             if (!res.ok) throw new Error("User not found");
             return res.json();
        })
        .then(data => setUser(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [params]);

  // Handle "View Project" click
  const handleViewProject = (projectId: string) => {
     // Navigate to home with a query param so the dashboard knows what to open
     router.push(`/?projectId=${projectId}`);
  };

  if (loading) return <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2"/> Loading...</div>;
  
  if (!user) return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center text-gray-500 gap-4">
        <p>User not found.</p>
        <button onClick={() => router.back()} className="text-[#5E6AD2] hover:underline">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F7F8F8] font-sans pb-20">
      <nav className="h-16 border-b border-[#22262E] bg-[#161B22] flex items-center px-6 sticky top-0 z-50">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
      </nav>

      <main className="max-w-4xl mx-auto mt-8 px-6">
        {/* Header Card */}
        <div className="bg-[#161B22] rounded-xl border border-[#22262E] overflow-hidden relative">
          <div className="h-32 bg-gradient-to-r from-[#5E6AD2] to-purple-600 opacity-80"></div>
          <div className="px-8 pb-8">
            <div className="-mt-12 mb-6">
                <div className="w-24 h-24 rounded-full border-4 border-[#161B22] bg-[#22262E] overflow-hidden flex items-center justify-center shadow-xl relative z-10">
                   {user.image ? (
                     <img src={user.image} className="w-full h-full object-cover"/>
                   ) : (
                     <UserIcon size={40} className="text-gray-500"/>
                   )}
                </div>
            </div>
            
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <p className="text-[#5E6AD2] font-medium text-sm mt-1">{user.headline || "Researcher"}</p>

            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-[#22262E] text-sm text-gray-400">
                {user.company && <div className="flex items-center gap-2"><Briefcase size={16} /> {user.company}</div>}
                {user.location && <div className="flex items-center gap-2"><MapPin size={16} /> {user.location}</div>}
                {user.website && <div className="flex items-center gap-2"><LinkIcon size={16} /> <a href={user.website} target="_blank" className="text-[#5E6AD2] hover:underline">Website</a></div>}
                <div className="flex items-center gap-2 ml-auto opacity-50"><Calendar size={16} /> Joined {new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-6 bg-[#161B22] rounded-xl border border-[#22262E] p-6">
           <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">About</h3>
           <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{user.bio || "This user hasn't written a bio yet."}</p>
        </div>
        
        {/* Public Projects List */}
        {user.memberships && user.memberships.length > 0 && (
            <div className="mt-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Public Projects</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {user.memberships.map((m: any) => (
                        <div key={m.projectId} className="group p-5 rounded-xl border border-[#22262E] bg-[#161B22] hover:border-[#5E6AD2]/50 transition-all flex flex-col">
                             <div className="flex justify-between items-start mb-3">
                                <div className="w-10 h-10 rounded bg-[#0B0E14] border border-[#22262E] flex items-center justify-center text-[#5E6AD2]">
                                    <Folder size={18} />
                                </div>
                                <button 
                                  onClick={() => handleViewProject(m.project.id)}
                                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#22262E] hover:bg-[#5E6AD2] hover:text-white hover:border-[#5E6AD2] transition-all flex items-center gap-1"
                                >
                                    View Project <ArrowRight size={12} />
                                </button>
                             </div>
                             
                             <h4 className="font-bold text-white text-lg mb-1">{m.project.title}</h4>
                             <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                {m.project.description || "No description available."}
                             </p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
}