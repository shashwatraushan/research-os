"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, Link as LinkIcon, Briefcase, Calendar, 
  Edit2, Save, Loader2, User as UserIcon, Camera
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- NEW: File Upload State ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    bio: "",
    company: "",
    location: "",
    website: "",
    image: ""
  });

  // --- FETCH DATA ---
  useEffect(() => {
    fetch('/api/profile')
      .then(res => {
        if (res.status === 401) router.push('/');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setFormData({
          name: data.name || "",
          headline: data.headline || "",
          bio: data.bio || "",
          company: data.company || "",
          location: data.location || "",
          website: data.website || "",
          image: data.image || ""
        });
        // Set initial preview to existing image
        setPreviewUrl(data.image || "");
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  // --- NEW: Handle File Selection ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Create a local URL for instant preview
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // --- UPDATED: SAVE HANDLER (Uses FormData) ---
  const handleSave = async () => {
    setSaving(true);
    try {
      // We must use FormData to upload files
      const data = new FormData();
      data.append("name", formData.name);
      data.append("headline", formData.headline);
      data.append("bio", formData.bio);
      data.append("company", formData.company);
      data.append("location", formData.location);
      data.append("website", formData.website);

      // If user selected a new file, send it. Otherwise send the old URL.
      if (selectedFile) {
        data.append("file", selectedFile);
      } else {
        data.append("image", formData.image);
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        body: data // Browser automatically sets Content-Type
      });
      
      if (!res.ok) throw new Error("Failed to update");
      
      const updated = await res.json();
      setUser(updated);
      // Update local state with the real URL from server
      setFormData(prev => ({ ...prev, image: updated.image }));
      setSelectedFile(null); // Clear temp file
      setIsEditing(false);
    } catch (error) {
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading Profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F7F8F8] font-sans pb-20">
      
      {/* --- NAVBAR --- */}
      <nav className="h-16 border-b border-[#22262E] bg-[#161B22] flex items-center px-6 sticky top-0 z-50">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-4xl mx-auto mt-8 px-6">
        
        {/* HEADER CARD */}
        <div className="bg-[#161B22] rounded-xl border border-[#22262E] overflow-hidden relative">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-[#5E6AD2] to-purple-600 opacity-80"></div>
          
          <div className="px-8 pb-8">
            <div className="flex justify-between items-end -mt-12 mb-6">
              
              {/* --- UPDATED AVATAR SECTION --- */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-[#161B22] bg-[#22262E] overflow-hidden flex items-center justify-center shadow-xl relative">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={40} className="text-gray-500" />
                  )}
                </div>
                
                {/* Edit Overlay (Only visible in Edit Mode) */}
                {isEditing && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity border-4 border-transparent z-10"
                  >
                    <Camera size={20} className="text-white" />
                  </div>
                )}
                
                {/* Hidden File Input */}
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept="image/*"
                   onChange={handleFileChange}
                />
              </div>
              {/* -------------------------------- */}

              {/* Action Buttons */}
              <div>
                {isEditing ? (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-lg text-sm font-medium border border-[#22262E] hover:bg-[#22262E] transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-[#5E6AD2] hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      {saving && <Loader2 className="animate-spin" size={14} />}
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-[#22262E] hover:bg-[#22262E] transition-colors flex items-center gap-2"
                  >
                    <Edit2 size={14} /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div>
              {isEditing ? (
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Display Name</label>
                    <input 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[#0B0E14] border border-[#22262E] rounded p-2 text-white outline-none focus:border-[#5E6AD2]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Headline</label>
                    <input 
                      value={formData.headline}
                      onChange={e => setFormData({...formData, headline: e.target.value})}
                      className="w-full bg-[#0B0E14] border border-[#22262E] rounded p-2 text-white outline-none focus:border-[#5E6AD2]"
                      placeholder="e.g. Research Scientist at MIT"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                  <p className="text-[#5E6AD2] font-medium text-sm mt-1">{user.headline || "No headline yet"}</p>
                </>
              )}
            </div>

            {/* Meta Data Row */}
            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-[#22262E] text-sm text-gray-400">
                <div className="flex items-center gap-2">
                   <Briefcase size={16} />
                   {isEditing ? (
                     <input 
                       value={formData.company} 
                       onChange={e => setFormData({...formData, company: e.target.value})}
                       placeholder="Company / Lab"
                       className="bg-transparent border-b border-gray-700 focus:border-[#5E6AD2] outline-none w-32"
                     />
                   ) : (
                     <span>{user.company || "No Organization"}</span>
                   )}
                </div>

                <div className="flex items-center gap-2">
                   <MapPin size={16} />
                   {isEditing ? (
                     <input 
                       value={formData.location} 
                       onChange={e => setFormData({...formData, location: e.target.value})}
                       placeholder="City, Country"
                       className="bg-transparent border-b border-gray-700 focus:border-[#5E6AD2] outline-none w-32"
                     />
                   ) : (
                     <span>{user.location || "No Location"}</span>
                   )}
                </div>

                <div className="flex items-center gap-2">
                   <LinkIcon size={16} />
                   {isEditing ? (
                     <input 
                       value={formData.website} 
                       onChange={e => setFormData({...formData, website: e.target.value})}
                       placeholder="Website URL"
                       className="bg-transparent border-b border-gray-700 focus:border-[#5E6AD2] outline-none w-48"
                     />
                   ) : user.website ? (
                     <a href={user.website} target="_blank" className="text-[#5E6AD2] hover:underline">{user.website.replace(/^https?:\/\//, '')}</a>
                   ) : (
                     <span>No Website</span>
                   )}
                </div>

                <div className="flex items-center gap-2 ml-auto opacity-50">
                   <Calendar size={16} /> Joined {new Date(user.createdAt).toLocaleDateString()}
                </div>
            </div>

          </div>
        </div>

        {/* BIO & STATS GRID */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
            
            {/* Left: Bio */}
            <div className="md:col-span-2 bg-[#161B22] rounded-xl border border-[#22262E] p-6">
               <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">About</h3>
               {isEditing ? (
                 <textarea 
                   value={formData.bio}
                   onChange={e => setFormData({...formData, bio: e.target.value})}
                   className="w-full h-40 bg-[#0B0E14] border border-[#22262E] rounded p-3 text-sm text-gray-300 outline-none focus:border-[#5E6AD2] resize-none"
                   placeholder="Tell us about your research interests..."
                 />
               ) : (
                 <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {user.bio || "This user hasn't written a bio yet."}
                 </p>
               )}
            </div>

            {/* Right: Stats & Role */}
            <div className="space-y-6">
                {/* Role Card */}
                <div className="bg-[#161B22] rounded-xl border border-[#22262E] p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Account Role</h3>
                    <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold">
                        {user.role}
                    </span>
                </div>

                {/* Email Card (Private) */}
                <div className="bg-[#161B22] rounded-xl border border-[#22262E] p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Contact</h3>
                    <p className="text-gray-300 text-sm truncate">{user.email}</p>
                    <p className="text-[10px] text-gray-600 mt-1">Only visible to you</p>
                </div>

                {/* Simple Stats */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-[#161B22] rounded-xl border border-[#22262E] p-4 text-center">
                      <div className="text-2xl font-bold text-white">{user._count?.memberships || 0}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Projects</div>
                   </div>
                   <div className="bg-[#161B22] rounded-xl border border-[#22262E] p-4 text-center">
                      <div className="text-2xl font-bold text-white">{user._count?.tasks || 0}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Tasks</div>
                   </div>
                </div>
            </div>

        </div>

      </main>
    </div>
  );
}