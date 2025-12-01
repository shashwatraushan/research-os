"use client";
import { signIn, useSession, signOut } from "next-auth/react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import React, { useState, useEffect, useMemo, createContext, useContext, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // <--- ADD THIS
import { 
  LayoutGrid, BookOpen, Database, FlaskConical, AreaChart, 
  Settings, Plus, Search, LogOut, ChevronRight, Check, 
  Trash2, Pencil, Maximize2, Paperclip, ExternalLink,
  FileText, Clock, AlertCircle, X, Sparkles, Loader2, Bot,
  ArrowRight, Filter, ArrowUpDown, Sun, Moon, Key, Lock,
  ClipboardList, CheckCircle2, Bug, Pin, StickyNote, Lightbulb, 
  MoreHorizontal, Link as LinkIcon, CheckSquare, PlayCircle, Zap, Shield, Globe, StopCircle, Archive, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer 
} from 'recharts';

/**
 * THEME SYSTEM
 */
const DARK_THEME = {
  name: 'dark',
  bg: '#0B0E14',
  bgSidebar: '#161B22',
  border: '#22262E',
  textMain: '#F7F8F8',
  textMuted: '#8A8F98',
  accent: '#5E6AD2',
  success: '#4ADE80',
  danger: '#F87171',
  warning: '#FBBF24',
  hover: '#1C2128',
  cardBg: '#161B22',
  inputBg: '#0d1117'
};

const LIGHT_THEME = {
  name: 'light',
  bg: '#F9FAFB',
  bgSidebar: '#FFFFFF',
  border: '#E5E7EB',
  textMain: '#111827',
  textMuted: '#6B7280',
  accent: '#5E6AD2',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  hover: '#F3F4F6',
  cardBg: '#FFFFFF',
  inputBg: '#F9FAFB'
};

const ThemeContext = createContext(null);

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

// --- GEMINI API UTILITY ---
const callGemini = async (prompt) => {
  const apiKey = ""; // Injected by runtime
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service.";
  }
};

// --- DATA DEFINITIONS ---
const MOCK_PROJECTS_LIST = [
  { id: 'proj_1', name: 'Neural Study', description: 'fMRI analysis of parietal lobe activation during memory tasks.', color: '#5E6AD2', lastActive: '2m ago' },
  { id: 'proj_2', name: 'Hippocampus Replay', description: 'Investigating sharp-wave ripples in mouse navigation patterns.', color: '#4ADE80', lastActive: '2d ago' },
  { id: 'proj_3', name: 'Visual Cortex V1', description: 'Mapping receptive fields using synthetic grating stimuli.', color: '#F87171', lastActive: '1w ago' },
];

const PROJECT_DATA = {
  'proj_1': { // Neural Study
    tasks: [
      { id: 'RES-101', title: 'Define exclusion criteria for fMRI scans', status: 'done', date: '2025-10-24' },
      { id: 'RES-102', title: 'Pre-process T1-weighted structural images', status: 'active', date: '2025-11-02' },
      { id: 'RES-103', title: 'Run first-level GLM analysis on pilot data', status: 'active', date: '2025-11-14' },
      { id: 'RES-104', title: 'Draft methodology section for Nature', status: 'todo', date: '2025-12-01' },
      { id: 'RES-105', title: 'Review ethics committee feedback', status: 'todo', date: '2025-12-05' },
    ],
    literature: [
      { id: 1, title: 'Attention Is All You Need', authors: 'Vaswani et al.', year: 2017, status: 'include', hasFile: true, summary: '' },
      { id: 2, title: 'Deep Residual Learning', authors: 'He et al.', year: 2016, status: 'include', hasFile: true, summary: '' },
      { id: 3, title: 'Outdated methodologies', authors: 'Smith et al.', year: 2012, status: 'exclude', hasFile: false, summary: '' },
    ],
    datasets: [
      { id: 1, name: 'Patient MRI Scans (Phase 2)', desc: 'Raw DICOM files collected from St. Mary\'s Hospital cohort. 500GB total storage.', link: '#' },
      { id: 2, name: 'HCP Young Adult Data', desc: 'Connectome data for 1200 subjects. Pre-processed fMRI pipelines.', link: '#' },
    ],
    experiments: [
      { 
        id: 'EXP-A', title: 'Trial A: Hyperparameter Tuning', method: 'Random Search', 
        hypothesis: 'If we increase the learning rate dropout to 0.3, then validation accuracy will improve by >2% due to reduced overfitting.',
        logs: [
          { id: 1, text: 'Run 3: Accuracy reached 88.5%. Best performance so far.', hasEvidence: true, time: '2m ago' },
          { id: 2, text: 'Run 2: Failed due to memory error (OOM) on GPU 0.', hasEvidence: false, time: '1h ago' },
        ]
      },
      {
        id: 'EXP-B', title: 'Trial B: Feature Selection', method: 'Recursive Elimination',
        hypothesis: 'Removing noisy features from the parietal lobe region will increase signal-to-noise ratio.',
        logs: []
      }
    ],
    artifacts: [
      { id: 1, type: 'chart', title: 'Validation Loss Curve', subtitle: 'Linked to Run #123', isPrimary: true, color: '#5E6AD2' },
      { id: 2, type: 'heatmap', title: 'Confusion Matrix', subtitle: 'Linked to Run #125', isPrimary: false, color: '#F87171' },
      { id: 3, type: 'code', title: 'Error Log Dump', subtitle: 'Memory Overflow - Trial B', isPrimary: false, color: '#8A8F98' },
    ]
  },
  'proj_2': { // Hippocampus Replay
    tasks: [
      { id: 'HIP-001', title: 'Surgically implant electrodes in CA1 region', status: 'done', date: '2025-09-10' },
      { id: 'HIP-002', title: 'Record spike trains during maze navigation', status: 'active', date: '2025-11-23' },
      { id: 'HIP-003', title: 'Decode position from place cells', status: 'todo', date: '2025-11-30' },
    ],
    literature: [
      { id: 1, title: 'The Hippocampus as a Cognitive Map', authors: 'O\'Keefe & Nadel', year: 1978, status: 'include', hasFile: false, summary: '' },
      { id: 2, title: 'Replay of prior experience', authors: 'Wilson & McNaughton', year: 1994, status: 'include', hasFile: true, summary: '' },
    ],
    datasets: [
      { id: 1, name: 'Mouse Maze Trajectories', desc: 'X,Y coordinates of 10 mice running the linear track.', link: '#' },
      { id: 2, name: 'Spike Train Recordings', desc: 'Raw electrophysiology data (Neurodata Without Borders format).', link: '#' },
    ],
    experiments: [
      { 
        id: 'EXP-H1', title: 'Sharp-Wave Ripple Detection', method: 'Thresholding', 
        hypothesis: 'Ripples occur predominantly during immobility and slow-wave sleep.',
        logs: [
          { id: 1, text: 'Detected 400 ripples in 10 minutes of sleep.', hasEvidence: true, time: '1d ago' }
        ]
      }
    ],
    artifacts: [
      { id: 1, type: 'chart', title: 'Spike Raster Plot', subtitle: 'CA1 Activity', isPrimary: true, color: '#4ADE80' },
      { id: 2, type: 'image', title: 'Maze Layout', subtitle: 'Top-down view', isPrimary: false, color: '#FBBF24' },
    ]
  },
  'proj_3': { // Visual Cortex V1
    tasks: [
      { id: 'VIS-20', title: 'Generate Gabor patch stimuli', status: 'done', date: '2025-08-01' },
      { id: 'VIS-21', title: 'Calibrate monitor luminance', status: 'done', date: '2025-08-02' },
      { id: 'VIS-22', title: 'Analyze receptive field size', status: 'active', date: '2025-11-23' },
    ],
    literature: [
      { id: 1, title: 'Receptive fields of single neurones in the cat\'s striate cortex', authors: 'Hubel & Wiesel', year: 1959, status: 'include', hasFile: true, summary: '' },
    ],
    datasets: [
      { id: 1, name: 'Synthetic Gratings Dataset', desc: '3000 images of oriented gratings at varying frequencies.', link: '#' },
    ],
    experiments: [
      { 
        id: 'EXP-V1', title: 'Orientation Selectivity', method: 'Single Unit Recording', 
        hypothesis: 'Neurons in V1 will respond maximally to bars of light at specific angles.',
        logs: []
      }
    ],
    artifacts: [
      { id: 1, type: 'heatmap', title: 'Orientation Tuning Curve', subtitle: 'Neuron #42', isPrimary: true, color: '#F87171' },
    ]
  }
};


/**
 * HELPER: Simple Modal
 */
const Modal = ({ isOpen, onClose, title, children }) => {
  const { theme } = useTheme();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md p-6 rounded-xl border shadow-xl"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium" style={{ color: theme.textMain }}>{title}</h3>
          <button onClick={onClose} style={{ color: theme.textMuted }} className="hover:opacity-70">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/**
 * COMPONENT: LOGIN SCREEN (Updated)
 */
const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Hooks for Real Auth
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Helper: Strong Password Check
  const validatePassword = (pwd) => {
    // At least 8 chars, 1 uppercase, 1 number, 1 special char
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return re.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Client-side Validation (Only for Signup)
    if (!isLogin) {
      if (!validatePassword(password)) {
        setError("Password must have 8+ chars, 1 uppercase, 1 number, and 1 special char.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          setError('Invalid email or password');
        } else {
          onLogin(); 
        }
      } else {
        // --- SIGNUP LOGIC ---
        if (!executeRecaptcha) {
          setError("reCAPTCHA not ready");
          setLoading(false);
          return;
        }

        const token = await executeRecaptcha("signup");

        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, captchaToken: token }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Registration failed');
        
        // Auto-login after signup
        await signIn('credentials', { redirect: false, email, password });
        onLogin();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentTheme = DARK_THEME; 

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: currentTheme.bg }}>
      <div className="w-full max-w-md p-8 rounded-xl shadow-2xl border" 
           style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}>
        
        <div className="text-center mb-8">
          <div className="h-12 w-12 mx-auto mb-4 rounded-lg flex items-center justify-center" 
               style={{ backgroundColor: 'rgba(94, 106, 210, 0.2)' }}>
            <FlaskConical size={24} color={currentTheme.accent} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: currentTheme.textMain }}>Research OS</h1>
          <p style={{ color: currentTheme.textMuted }}>{isLogin ? 'Welcome back' : 'Create your lab'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md text-sm flex items-center gap-2 bg-red-900/30 text-red-200 border border-red-900">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5 ml-1" style={{ color: currentTheme.textMuted }}>EMAIL</label>
            <input 
              type="email" 
              required
              className="w-full p-3 rounded-lg text-sm border transition-all focus:ring-2 outline-none"
              style={{ 
                backgroundColor: currentTheme.inputBg, 
                borderColor: currentTheme.border, 
                color: currentTheme.textMain,
                '--tw-ring-color': currentTheme.accent 
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 ml-1" style={{ color: currentTheme.textMuted }}>
                PASSWORD 
                {!isLogin && <span className="opacity-50 font-normal ml-1">(8+ chars, A-Z, 0-9, #$%)</span>}
            </label>
            <input 
              type="password" 
              required
              className="w-full p-3 rounded-lg text-sm border transition-all focus:ring-2 outline-none"
              style={{ 
                backgroundColor: currentTheme.inputBg, 
                borderColor: currentTheme.border, 
                color: currentTheme.textMain,
                '--tw-ring-color': currentTheme.accent 
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-lg font-medium text-sm transition-all hover:opacity-90 flex justify-center items-center"
            style={{ backgroundColor: currentTheme.accent, color: '#FFF' }}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs hover:underline"
            style={{ color: currentTheme.textMuted }}
          >
            {isLogin ? "Need an account? Sign up" : "Have an account? Log in"}
          </button>
        </div>
        
        <div className="mt-8 text-center text-[10px] opacity-40" style={{ color: currentTheme.textMuted }}>
           Protected by reCAPTCHA v3
        </div>
      </div>
    </div>
  );
};

/**
 * COMPONENT: CREATE PROJECT MODAL
 */
const CreateProjectModal = ({ isOpen, onClose, onSubmit, theme }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(title, desc);
    setLoading(false);
    setTitle("");
    setDesc("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md p-6 rounded-xl shadow-2xl border" 
           style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
        <h2 className="text-lg font-medium mb-4" style={{ color: theme.textMain }}>New Project</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>TITLE</label>
            <input 
              autoFocus
              className="w-full p-2 rounded-md text-sm border outline-none focus:ring-1"
              style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain, '--tw-ring-color': theme.accent }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: theme.textMuted }}>DESCRIPTION</label>
            <textarea 
              className="w-full p-2 rounded-md text-sm border outline-none focus:ring-1"
              rows={3}
              style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain, '--tw-ring-color': theme.accent }}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-medium hover:opacity-80 transition-opacity"
              style={{ color: theme.textMuted }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || !title}
              className="px-4 py-2 rounded-md text-xs font-medium transition-all hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: theme.accent, color: '#FFF' }}
            >
              {loading && <Loader2 className="animate-spin" size={12} />}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * COMPONENT: PROJECT SELECTION SCREEN (With "Find your project" & Sorting)
 */
const ProjectSelectionScreen = ({ 
  projects, 
  onSelectProject, 
  onOpenCreateModal,
  onLogout,
  toggleTheme,
  isDarkMode
}) => {
  const { theme } = useTheme(); 
  
  // --- SETTINGS STATE ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const menuRef = useRef(null);

  // --- LOCAL SORT/FILTER STATE ---
  const [localSearch, setLocalSearch] = useState("");
  const [sortBy, setSortBy] = useState('created'); // Default to 'created'
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  // --- GLOBAL SEARCH STATE ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  // --- PASSWORD LOGIC ---
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passMsg, setPassMsg] = useState(""); 
  const [passLoading, setPassLoading] = useState(false);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowSettings(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchOpen(false);
      if (sortRef.current && !sortRef.current.contains(event.target)) setIsSortOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LOGIC: FILTER & SORT PROJECTS ---
  const processedProjects = useMemo(() => {
    return projects
      .filter(p => {
         // Filter by Title or Description
         const searchLower = localSearch.toLowerCase();
         return p.title.toLowerCase().includes(searchLower) || 
                (p.description && p.description.toLowerCase().includes(searchLower));
      })
      .sort((a, b) => {
         // Sort Logic
         if (sortBy === 'alpha') return a.title.localeCompare(b.title);
         
         // Default: Created Date (Newest First)
         return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [projects, localSearch, sortBy]);

  // --- GLOBAL SEARCH LOGIC ---
  useEffect(() => {
    if (!searchQuery.trim()) {
        setSearchResults(null);
        return;
    }
    const timer = setTimeout(() => {
        setIsSearching(true);
        fetch(`/api/search?q=${searchQuery}`)
            .then(res => res.json())
            .then(data => setSearchResults(data))
            .catch(() => setSearchResults(null))
            .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResultClick = (item) => {
    const parentProject = projects.find(p => p.id === item.projectId);
    if (parentProject) {
        onSelectProject(parentProject); 
    } else {
        alert("Project not found locally. Try refreshing.");
    }
  };

  const handleChangePassword = async () => {
    setPassLoading(true);
    setPassMsg("");
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currPass, newPassword: newPass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPassMsg("Success! Password updated.");
      setTimeout(() => { setShowPasswordModal(false); setCurrPass(""); setNewPass(""); setPassMsg(""); }, 1500);
    } catch (err) { setPassMsg(err.message); } 
    finally { setPassLoading(false); }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-24 font-sans animate-in fade-in duration-700 transition-colors duration-300 relative" style={{ backgroundColor: theme.bg }}>
      
      {/* --- TOP RIGHT GLOBAL SEARCH --- */}
      <div ref={searchRef} className={`absolute top-6 right-6 z-50 flex items-center justify-end transition-all duration-300 ${isSearchOpen ? 'w-full max-w-md' : 'w-auto'}`}>
        <div 
            className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 shadow-sm border overflow-hidden ${isSearchOpen ? 'w-full ring-1 ring-gray-500/20' : 'w-auto hover:bg-white/5 bg-transparent border-transparent hover:border-gray-500/20 cursor-pointer'}`}
            style={{ 
                borderColor: isSearchOpen ? theme.border : 'transparent',
                backgroundColor: isSearchOpen ? theme.cardBg : 'transparent'
            }}
            onClick={() => setIsSearchOpen(true)}
        >
            <Zap size={18} color={theme.textMuted} className="shrink-0" />
            
            {isSearchOpen ? (
                <input 
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search across all projects..."
                    className="bg-transparent border-none outline-none text-sm w-full min-w-[200px]"
                    style={{ color: theme.textMain }}
                />
            ) : (
                <span className="text-sm opacity-50 select-none hidden sm:block" style={{ color: theme.textMuted }}>Global Search</span>
            )}

            {isSearchOpen && (
                <div className="flex items-center gap-2 shrink-0">
                    {isSearching ? <Loader2 size={14} className="animate-spin opacity-50"/> : null}
                    <button onClick={(e) => { e.stopPropagation(); setSearchQuery(""); setIsSearchOpen(false); }} className="hover:opacity-100 opacity-50">
                        <X size={14} color={theme.textMuted}/>
                    </button>
                </div>
            )}
        </div>

        {/* RESULTS DROPDOWN */}
        {isSearchOpen && searchResults && searchQuery && (
            <div className="absolute top-full right-0 w-full mt-2 rounded-xl border shadow-xl overflow-hidden max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                
                {Object.values(searchResults).every(arr => !arr || arr.length === 0) && (
                    <div className="p-4 text-center text-xs opacity-50" style={{ color: theme.textMuted }}>No results found across projects.</div>
                )}

                {['papers', 'tasks', 'experiments', 'datasets', 'artifacts'].map(category => {
                    const items = searchResults[category];
                    if (!items || items.length === 0) return null;
                    
                    return (
                        <div key={category} className="p-2 border-b last:border-0" style={{ borderColor: theme.border }}>
                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 px-2 mb-1" style={{ color: theme.textMuted }}>{category}</div>
                            {items.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => handleResultClick(item)} 
                                    className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer text-sm transition-colors group"
                                >
                                    {category === 'papers' && <BookOpen size={14} style={{ color: theme.textMuted }} className="opacity-50"/>}
                                    {category === 'tasks' && <Check size={14} style={{ color: theme.textMuted }} className="opacity-50"/>}
                                    {category === 'experiments' && <FlaskConical size={14} style={{ color: theme.textMuted }} className="opacity-50"/>}
                                    {category === 'datasets' && <Database size={14} style={{ color: theme.textMuted }} className="opacity-50"/>}
                                    {category === 'artifacts' && <FileText size={14} style={{ color: theme.textMuted }} className="opacity-50"/>}
                                    
                                    <div className="flex flex-col min-w-0 text-left">
                                        <span className="truncate font-medium" style={{color: theme.textMain}}>
                                            {category === 'datasets' ? item.file?.name : item.title}
                                        </span>
                                        <span className="text-[10px] opacity-40 truncate" style={{ color: theme.textMuted }}>
                                            In: {projects.find(p => p.id === item.projectId)?.title || "Unknown Project"}
                                        </span>
                                    </div>
                                    <ArrowRight size={12} className="ml-auto opacity-0 group-hover:opacity-50" style={{ color: theme.textMuted }} />
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* --- HEADER + LOCAL FILTER TOOLBAR --- */}
      <div className="w-full max-w-5xl px-6 mb-8 flex flex-col md:flex-row justify-between items-end gap-6">
        
        {/* Title Area */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <LayoutGrid size={20} color={theme.textMain} />
            </div>
            <h1 className="text-2xl font-medium tracking-tight" style={{ color: theme.textMain }}>Select a Project</h1>
          </div>
          <p className="text-sm" style={{ color: theme.textMuted }}>{processedProjects.length} projects found</p>
        </div>

        {/* --- NEW TOOLBAR: SORT & FIND --- */}
        <div className="flex items-center gap-3 p-1 rounded-xl border" style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
            
            {/* Find Your Project Input */}
            <div className="relative group flex items-center">
                <Search size={14} className="absolute left-3 opacity-50" style={{ color: theme.textMuted }}/>
                <input 
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Find your project..."
                    className="pl-8 pr-3 py-1.5 text-sm bg-transparent outline-none w-40 focus:w-56 transition-all"
                    style={{ color: theme.textMain }}
                />
            </div>

            <div className="h-4 w-[1px]" style={{ backgroundColor: theme.border }}></div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
                <button 
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-gray-500/10"
                    style={{ color: theme.textMuted }}
                >
                    <ArrowUpDown size={12} />
                    <span className="capitalize">
                        {sortBy === 'created' ? 'Date Created' : 'Alphabetical'}
                    </span>
                </button>

                {isSortOpen && (
                    <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                        {[
                            { id: 'created', label: 'Date Created' },
                            { id: 'alpha', label: 'Alphabetical' }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => { setSortBy(opt.id); setIsSortOpen(false); }}
                                className="w-full text-left px-4 py-2 text-xs hover:bg-gray-500/10 transition-colors flex items-center justify-between"
                                style={{ color: sortBy === opt.id ? theme.accent : theme.textMain }}
                            >
                                {opt.label}
                                {sortBy === opt.id && <Check size={12} />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* GRID */}
      <div className="w-full max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Create New Card */}
          {/* Only show "Create New" if we aren't heavily filtering, or just keep it as the first item always */}
          {!localSearch && (
              <div 
                onClick={onOpenCreateModal} 
                className="group cursor-pointer rounded-xl border border-dashed flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/5"
                style={{ borderColor: theme.border, minHeight: '220px', backgroundColor: 'transparent' }}
              >
                 <div className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: theme.hover }}>
                   <Plus size={20} color={theme.textMuted} />
                 </div>
                 <span className="text-sm font-medium" style={{ color: theme.textMuted }}>Create New Project</span>
              </div>
          )}

          {/* Mapped Projects */}
          {processedProjects.map((proj) => (
            <div 
              key={proj.id}
              onClick={() => onSelectProject(proj)} 
              className="group cursor-pointer rounded-xl p-1 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ backgroundColor: theme.bgSidebar || theme.cardBg, borderColor: theme.border }}
            >
              <div 
                className="h-full rounded-lg p-6 flex flex-col relative overflow-hidden border border-transparent" 
                style={{ backgroundColor: theme.cardBg }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5" style={{ backgroundColor: proj.color || theme.accent }}></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center border font-bold text-sm" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.textMain }}>
                    {proj.title.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="text-[10px] opacity-40 font-mono" style={{ color: theme.textMuted }}>
                    {/* Safe Date Rendering */}
                    {new Date(proj.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-medium mb-2 truncate" style={{ color: theme.textMain }}>{proj.title}</h3>
                <p className="text-xs leading-relaxed mb-8 flex-1 line-clamp-3 opacity-80" style={{ color: theme.textMuted }}>
                  {proj.description || "No description provided."}
                </p>

                <div className="flex items-center gap-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0" style={{ color: proj.color || theme.accent }}>
                  Open Project <ArrowRight size={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {processedProjects.length === 0 && localSearch && (
            <div className="text-center py-20 opacity-50 text-sm" style={{ color: theme.textMuted }}>
                No projects found matching "{localSearch}"
            </div>
        )}
      </div>

      {/* --- FLOATING SETTINGS MENU --- */}
      <div className="fixed bottom-6 left-6 z-50" ref={menuRef}>
        
        {isSettingsOpen && (
            <div className="absolute bottom-14 left-0 w-56 rounded-xl border shadow-2xl p-2 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-200" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 px-3 py-2" style={{ color: theme.textMuted }}>Settings</div>
                
                <button 
                    onClick={() => { toggleTheme(); setIsSettingsOpen(false); }} 
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors text-left"
                    style={{ color: theme.textMain }}
                >
                    {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                    <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                </button>

                <button 
                    onClick={() => { setShowPasswordModal(true); setIsSettingsOpen(false); }} 
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors text-left"
                    style={{ color: theme.textMain }}
                >
                    <Lock size={14} />
                    <span>Change Password</span>
                </button>

                <div className="h-[1px] w-full my-1 opacity-20" style={{ backgroundColor: theme.border }}></div>

                <button 
                    onClick={onLogout} 
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg hover:bg-red-500/10 text-red-500 transition-colors text-left"
                >
                    <LogOut size={14} />
                    <span>Log Out</span>
                </button>
            </div>
        )}

        <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-3 rounded-full shadow-lg border transition-all hover:scale-105 ${isSettingsOpen ? 'rotate-90' : ''}`}
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textMuted }}
        >
            {isSettingsOpen ? <X size={20} /> : <Settings size={20} />}
        </button>
      </div>

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border shadow-2xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
             
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium" style={{ color: theme.textMain }}>Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)} className="p-1 rounded hover:bg-white/10">
                    <X size={16} color={theme.textMuted}/>
                </button>
             </div>

             <div className="space-y-4">
                <div className="p-3 rounded border bg-yellow-500/10 border-yellow-500/20 text-yellow-500 text-xs flex items-center gap-2">
                     <Lock size={14} /> Security Check Required
                </div>

                {passMsg && (
                  <div className={`p-2 text-xs rounded border ${passMsg.includes("Success") ? "text-green-500 bg-green-500/10 border-green-500/20" : "text-red-500 bg-red-500/10 border-red-500/20"}`}>
                    {passMsg}
                  </div>
                )}

                <input 
                  type="password"
                  placeholder="Current Password"
                  className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-1 transition-all"
                  style={{ backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.textMain, '--tw-ring-color': theme.accent }}
                  value={currPass}
                  onChange={(e) => setCurrPass(e.target.value)}
                />
                <input 
                  type="password"
                  placeholder="New Password (8+ chars, 1 Uppercase, 1 Symbol)"
                  className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-1 transition-all"
                  style={{ backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.textMain, '--tw-ring-color': theme.accent }}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
                <button 
                  onClick={handleChangePassword}
                  disabled={passLoading || !currPass || !newPass}
                  className="w-full py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: theme.accent }}
                >
                    {passLoading ? "Updating..." : "Update Credentials"}
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

/**
 * SUB-COMPONENT: SIDEBAR (Updated)
 */
const Sidebar = ({ activeTab, setActiveTab, projectName, projectColor, onLogout }) => {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Change Password Form State
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passMsg, setPassMsg] = useState(""); 
  const [passLoading, setPassLoading] = useState(false);

  const navItems = [
    { id: 'overview', icon: LayoutGrid, label: 'Overview' },
    { id: 'literature', icon: BookOpen, label: 'Literature' },
    { id: 'datasets', icon: Database, label: 'Datasets' },
    { id: 'experiments', icon: FlaskConical, label: 'Experiments' },
    { id: 'artifacts', icon: AreaChart, label: 'Artifacts' },
  ];

  // API Call to Change Password
  const handleChangePassword = async () => {
    setPassLoading(true);
    setPassMsg("");

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currPass, newPassword: newPass })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setPassMsg("Success! Password updated.");
      
      // Clear and close after delay
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrPass("");
        setNewPass("");
        setPassMsg("");
      }, 1500);

    } catch (err) {
      setPassMsg(err.message);
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed left-0 top-0 bottom-0 w-[240px] flex flex-col border-r z-20 transition-colors duration-300"
        style={{ backgroundColor: theme.bgSidebar, borderColor: theme.border }}
      >
        {/* Workspace Switcher */}
        <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity w-full">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: projectColor || theme.accent }}
            >
              {projectName ? projectName.substring(0,1) : 'N'}
            </div>
            <span className="text-sm font-medium tracking-tight truncate" style={{ color: theme.textMain }}>
              {projectName || 'Neuro Lab'}
            </span>
            <ChevronRight size={14} className="ml-auto opacity-50 shrink-0" color={theme.textMuted} />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group"
                style={{ backgroundColor: isActive ? theme.hover : 'transparent' }}
              >
                <item.icon 
                  size={16} 
                  className="transition-colors"
                  style={{ color: isActive ? theme.textMain : theme.textMuted }}
                />
                <span style={{ color: isActive ? theme.textMain : theme.textMuted }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Actions with Settings Popup */}
        <div className="p-4 border-t space-y-2 relative" style={{ borderColor: theme.border }}>
          {showSettings && (
             <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)}></div>
                <div 
                  className="absolute bottom-16 left-4 w-48 rounded-lg shadow-xl border overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50"
                  style={{ backgroundColor: theme.bgSidebar, borderColor: theme.border }}
                >
                    <button 
                        onClick={() => { toggleTheme(); setShowSettings(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-2"
                        style={{ color: theme.textMain, ':hover': { backgroundColor: theme.hover } }}
                    >
                        {isDarkMode ? <Sun size={14}/> : <Moon size={14}/>}
                        {isDarkMode ? "Light Mode" : "Dark Mode"}
                    </button>
                    <button 
                        onClick={() => { setShowPasswordModal(true); setShowSettings(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-2"
                        style={{ color: theme.textMain }}
                    >
                        <Key size={14}/> Change Password
                    </button>
                    <div className="h-px w-full" style={{ backgroundColor: theme.border }}></div>
                    <button 
                        onClick={onLogout} 
                        className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-2 text-red-500 hover:bg-red-500/10"
                    >
                        <LogOut size={14}/> Log Out
                    </button>
                </div>
             </>
          )}

          <button 
             onClick={() => setShowSettings(!showSettings)}
             className="flex items-center gap-3 px-3 py-2 text-sm w-full rounded transition-colors"
             style={{ ':hover': { backgroundColor: theme.hover } }}
          >
            <Settings size={16} color={theme.textMuted} />
            <span style={{ color: theme.textMuted }}>Settings</span>
          </button>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
         <div className="space-y-4">
            <div className="p-3 rounded border bg-yellow-500/10 border-yellow-500/20 text-yellow-500 text-xs flex items-center gap-2">
                 <Lock size={14} /> Security Check Required
            </div>

            {/* Success/Error Message */}
            {passMsg && (
              <div className={`p-2 text-xs rounded border ${passMsg.includes("Success") ? "text-green-500 bg-green-500/10 border-green-500/20" : "text-red-500 bg-red-500/10 border-red-500/20"}`}>
                {passMsg}
              </div>
            )}

            <input 
              type="password"
              placeholder="Current Password"
              className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.textMain, '--tw-ring-color': theme.accent }}
              value={currPass}
              onChange={(e) => setCurrPass(e.target.value)}
            />
            <input 
              type="password"
              placeholder="New Password (8+ chars, 1 Uppercase, 1 Symbol)"
              className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.textMain, '--tw-ring-color': theme.accent }}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <button 
              onClick={handleChangePassword}
              disabled={passLoading || !currPass || !newPass}
              className="w-full py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: theme.accent }}
            >
                {passLoading ? "Updating..." : "Update Credentials"}
            </button>
         </div>
      </Modal>
    </>
  );
};

/**
 * COMPONENT: LITERATURE MANAGER (With "Swap on Hover" UI)
 */
const LiteratureManager = ({ project }) => {
  const { theme } = useTheme();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);

  const stats = useMemo(() => {
    return {
      total: papers.length,
      included: papers.filter(p => p.status === 'include').length,
      excluded: papers.filter(p => p.status === 'exclude').length,
    };
  }, [papers]);

  // 1. Fetch
  useEffect(() => {
    if (project?.id) {
      setLoading(true);
      fetch(`/api/papers?projectId=${project.id}`)
        .then(res => res.json())
        .then(data => {
          setPapers(Array.isArray(data) ? data : []);
          setLoading(false);
        });
    }
  }, [project]);

  // 2. Save (Create/Update)
  const handleSavePaper = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const yearInput = formData.get('year');

    if (yearInput && !/^\d{4}$/.test(yearInput)) {
        alert("Please enter a valid 4-digit year (e.g., 2023)");
        return;
    }

    const payload = {
      title: formData.get('title'),
      authors: formData.get('authors'),
      year: yearInput,
      doi: formData.get('doi'),
    };

    if (editingPaper) {
      const res = await fetch('/api/papers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingPaper.id, ...payload })
      });
      const updated = await res.json();
      setPapers(papers.map(p => p.id === updated.id ? updated : p));
    } else {
      const res = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, ...payload })
      });
      if (res.status === 409) { alert("Duplicate DOI."); return; }
      const created = await res.json();
      setPapers([created, ...papers]);
    }
    setIsModalOpen(false);
    setEditingPaper(null);
  };

  // 3. Edit Handler
  const handleEditClick = (paper) => {
    setEditingPaper(paper);
    setIsModalOpen(true);
  };

  // 4. Delete Handler
  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    setPapers(papers.filter(p => p.id !== id));
    await fetch(`/api/papers?id=${id}`, { method: 'DELETE' });
  };

  // 5. Status Handler
  const handleStatusChange = async (id, newStatus) => {
    setPapers(papers.map(p => p.id === id ? { ...p, status: newStatus } : p));
    await fetch('/api/papers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    });
  };

  const truncate = (str, len) => str && str.length > len ? str.substring(0, len) + "..." : str;
  const getDoiLink = (doi) => doi ? (doi.startsWith("http") ? doi : `https://doi.org/${doi}`) : "#";

  return (
    <div className="animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-xl font-medium mb-2" style={{ color: theme.textMain }}>Literature Review</h2>
          <div className="flex gap-4 text-xs font-mono" style={{ color: theme.textMuted }}>
            <span>TOTAL: {stats.total}</span>
            <span style={{ color: theme.success }}>INCLUDED: {stats.included}</span>
            <span style={{ color: theme.danger }}>EXCLUDED: {stats.excluded}</span>
          </div>
        </div>
        <button 
          onClick={() => { setEditingPaper(null); setIsModalOpen(true); }}
          className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: theme.accent, color: '#FFF' }}
        >
          <Plus size={14} /> Add Paper
        </button>
      </div>

      {/* PAPERS LIST */}
      <div className="space-y-3">
        {loading ? <div className="text-sm opacity-50">Loading papers...</div> : papers.map((paper) => (
          <div 
            key={paper.id}
            className="group p-4 rounded-lg border transition-all hover:shadow-sm flex gap-4 relative pr-20" // Padding right prevents title overlap
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >
            {/* Status Bar */}
            <div className={`w-1 rounded-full self-stretch ${
              paper.status === 'include' ? 'bg-green-500' : 
              paper.status === 'exclude' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>

            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <h3 className="text-sm font-medium leading-tight truncate" title={paper.title} style={{ color: theme.textMain }}>
                  {paper.title}
                </h3>
              </div>
              
              <div className="text-xs mb-3 flex items-center gap-2" style={{ color: theme.textMuted }}>
                <span className="truncate max-w-[200px]" title={paper.authors}>{paper.authors || "Unknown"}</span>
                <span>•</span>
                {paper.doi ? (
                    <a href={getDoiLink(paper.doi)} target="_blank" rel="noreferrer" className="hover:underline opacity-60 hover:opacity-100 flex items-center gap-1">
                        {truncate(paper.doi, 25)} <ExternalLink size={10} />
                    </a>
                ) : <span className="opacity-60">No DOI</span>}
              </div>

              {/* Status Toggles */}
              <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleStatusChange(paper.id, 'include')} title="Include" className={`p-1.5 rounded ${paper.status === 'include' ? 'bg-green-500 text-white' : 'hover:bg-green-500/10 text-green-500'}`}><Check size={14} /></button>
                <button onClick={() => handleStatusChange(paper.id, 'exclude')} title="Exclude" className={`p-1.5 rounded ${paper.status === 'exclude' ? 'bg-red-500 text-white' : 'hover:bg-red-500/10 text-red-500'}`}><X size={14} /></button>
                <button onClick={() => handleStatusChange(paper.id, 'unsure')} title="Unsure" className={`p-1.5 rounded ${paper.status === 'unsure' ? 'bg-yellow-500 text-white' : 'hover:bg-yellow-500/10 text-yellow-500'}`}><AlertCircle size={14} /></button>
              </div>
            </div>

            {/* --- TOP RIGHT CORNER (SWAP ZONE) --- */}
            
            {/* 1. THE YEAR BADGE (Visible by default, Hidden on Hover) */}
            <div className="absolute top-4 right-4 transition-opacity duration-200 opacity-100 group-hover:opacity-0 pointer-events-none">
                <span className="text-[10px] font-mono border px-1.5 py-0.5 rounded" style={{ borderColor: theme.border, color: theme.textMuted }}>
                  {paper.year || "N/A"}
                </span>
            </div>

            {/* 2. THE ACTION BUTTONS (Hidden by default, Visible on Hover) */}
            <div className="absolute top-4 right-4 flex gap-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                <button 
                    onClick={() => handleEditClick(paper)}
                    className="p-1 text-blue-500 hover:bg-blue-500/10 rounded"
                    title="Edit"
                >
                    <Pencil size={14} />
                </button>
                <button 
                    onClick={() => handleDelete(paper.id)}
                    className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                    title="Delete"
                >
                    <Trash2 size={14} />
                </button>
            </div>

          </div>
        ))}

        {!loading && papers.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-xl" style={{ borderColor: theme.border }}>
            <p style={{ color: theme.textMuted }}>No papers yet.</p>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border shadow-2xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h3 className="text-lg font-medium mb-4" style={{ color: theme.textMain }}>
                {editingPaper ? "Edit Paper" : "Add New Paper"}
            </h3>
            <form onSubmit={handleSavePaper} className="space-y-4">
              <input name="title" defaultValue={editingPaper?.title} placeholder="Paper Title" required className="w-full p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border }} />
              <input name="authors" defaultValue={editingPaper?.authors} placeholder="Authors" required className="w-full p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border }} />
              <div className="flex gap-4">
                <input name="year" defaultValue={editingPaper?.year} placeholder="Year" type="number" className="w-1/3 p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border }} />
                <input name="doi" defaultValue={editingPaper?.doi} placeholder="DOI" className="flex-1 p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border }} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs" style={{ color: theme.textMuted }}>Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs rounded text-white" style={{ backgroundColor: theme.accent }}>
                    {editingPaper ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * COMPONENT: DATASET REGISTRY (Fixes Uploads + Downloads + Edit)
 */
const DatasetRegistry = ({ project }) => {
  const { theme } = useTheme();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); 
  const [uploading, setUploading] = useState(false);
  const [editingDataset, setEditingDataset] = useState(null);
  
  // Toggle for "Replace File" in Edit Mode
  const [showReplaceFile, setShowReplaceFile] = useState(false);

  // 1. Fetch
  useEffect(() => {
    if (project?.id) {
      fetch(`/api/datasets?projectId=${project.id}`)
        .then(res => res.json())
        .then(data => {
          setDatasets(Array.isArray(data) ? data : []);
          setLoading(false);
        });
    }
  }, [project]);

  // 2. Handle Save (Create OR Edit)
  const handleSaveDataset = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    const formData = new FormData(e.target);
    
    // IMPORTANT: Ensure projectId is present
    if (!editingDataset) {
        formData.append('projectId', project.id);
        formData.append('type', uploadMode); 
    } else {
        formData.append('id', editingDataset.id);
        // If editing and NOT replacing file, ensure we don't send an empty file object
        if (!showReplaceFile && uploadMode === 'file') {
            formData.delete('file'); 
        }
    }

    try {
        // We use the SAME logic for POST and PATCH now (FormData)
        const method = editingDataset ? 'PATCH' : 'POST';
        const res = await fetch('/api/datasets', {
            method: method,
            body: formData 
        });

        if (!res.ok) throw new Error("Operation failed");

        const result = await res.json();
        
        if (editingDataset) {
            setDatasets(datasets.map(d => d.id === result.id ? result : d));
        } else {
            setDatasets([result, ...datasets]);
        }
        
        setIsModalOpen(false);
        setEditingDataset(null);
    } catch (err) {
        alert("Failed to save. Check your file/internet.");
    } finally {
        setUploading(false);
    }
  };

  // 3. Delete
  const handleDelete = async (id) => {
    if (!confirm("Remove this dataset?")) return;
    setDatasets(datasets.filter(d => d.id !== id));
    await fetch(`/api/datasets?id=${id}`, { method: 'DELETE' });
  };

  // 4. Open Edit Modal
  const handleEditClick = (ds) => {
    setEditingDataset(ds);
    setUploadMode(ds.file?.url?.includes('cloudinary') ? 'file' : 'link');
    setShowReplaceFile(false); // Reset replace toggle
    setIsModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-xl font-medium mb-2" style={{ color: theme.textMain }}>Data Registry</h2>
          <p className="text-xs max-w-lg" style={{ color: theme.textMuted }}>
             Upload datasets (auto-PII scan) or link external resources.
          </p>
        </div>
        <button 
          onClick={() => { setEditingDataset(null); setUploadMode('file'); setIsModalOpen(true); }}
          className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: theme.accent, color: '#FFF' }}
        >
          <Plus size={14} /> Register Data
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <div className="text-sm opacity-50">Loading data...</div> : datasets.map((ds) => (
          <div 
            key={ds.id}
            className="group p-5 rounded-xl border relative transition-all hover:shadow-md"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4 pr-16">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 rounded-lg shrink-0 bg-blue-500/10 text-blue-500">
                  <Database size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium truncate" title={ds.file?.name} style={{ color: theme.textMain }}>
                      {ds.file?.name}
                  </h3>
                  <a href={ds.file?.url} target="_blank" rel="noreferrer" className="text-[10px] hover:underline block truncate" style={{ color: theme.textMuted }}>
                    {ds.file?.url?.includes('cloudinary') ? 'Download CSV ↗' : 'External Link ↗'}
                  </a>
                </div>
              </div>
            </div>

            {/* Edit/Delete Buttons */}
            <div className="absolute top-4 right-4 flex gap-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                <button onClick={() => handleEditClick(ds)} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(ds.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={14} /></button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-[10px] px-2 py-1 rounded border font-medium ${ds.piiFlag ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                {ds.piiFlag ? "PII DETECTED" : "SAFE / NO PII"}
              </span>
              <span className="text-[10px] px-2 py-1 rounded border bg-gray-500/5" style={{ borderColor: theme.border, color: theme.textMuted }}>
                {ds.license || "No License"}
              </span>
            </div>

            {/* PII Columns WARNING */}
            {ds.piiFlag && ds.piiColumns && ds.piiColumns.length > 0 && (
                <div className="mb-3 p-2 rounded text-[10px] bg-red-500/5 border border-red-500/10" style={{ color: theme.danger }}>
                    <span className="font-bold">Columns Found:</span> {ds.piiColumns.join(", ")}
                </div>
            )}

            <div className="text-xs p-3 rounded border mb-2 h-16 overflow-hidden" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.textMuted }}>
              {ds.description || "No description provided."}
            </div>
            
            <div className="text-[10px] opacity-40 text-right mt-2" style={{ color: theme.textMuted }}>
              Updated: {new Date(ds.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        ))}
        {!loading && datasets.length === 0 && <p className="text-xs opacity-50 col-span-2 text-center py-10">No data found.</p>}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border shadow-2xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h3 className="text-lg font-medium mb-4" style={{ color: theme.textMain }}>
                {editingDataset ? "Edit Dataset" : "Add Data"}
            </h3>
            
            {/* Show Tabs if Creating OR if Editing and we want to allow switching types */}
            <div className="flex gap-4 mb-4 border-b" style={{ borderColor: theme.border }}>
                <button 
                    type="button"
                    onClick={() => { setUploadMode('file'); setShowReplaceFile(true); }}
                    className={`pb-2 text-sm font-medium transition-colors ${uploadMode === 'file' ? 'border-b-2' : 'opacity-50'}`}
                    style={{ borderColor: theme.accent, color: uploadMode === 'file' ? theme.textMain : theme.textMuted }}
                >
                    File Upload
                </button>
                <button 
                    type="button"
                    onClick={() => setUploadMode('link')}
                    className={`pb-2 text-sm font-medium transition-colors ${uploadMode === 'link' ? 'border-b-2' : 'opacity-50'}`}
                    style={{ borderColor: theme.accent, color: uploadMode === 'link' ? theme.textMain : theme.textMuted }}
                >
                    External Link
                </button>
            </div>

            <form onSubmit={handleSaveDataset} className="space-y-4">
              <input name="name" defaultValue={editingDataset?.file?.name} placeholder="Dataset Name" required className="w-full p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border }} />
              
              {/* FILE LOGIC */}
              {uploadMode === 'file' && (
                <div className="p-4 border border-dashed rounded-lg text-center" style={{ borderColor: theme.border }}>
                    {editingDataset && !showReplaceFile ? (
                        <div className="text-xs flex justify-between items-center">
                            <span style={{color: theme.textMuted}}>Current: {editingDataset.file?.name}</span>
                            <button type="button" onClick={() => setShowReplaceFile(true)} className="text-blue-500 hover:underline">Replace?</button>
                        </div>
                    ) : (
                        <>
                            <Paperclip size={20} className="mx-auto mb-2 opacity-50" />
                            <input type="file" name="file" accept=".csv,.json,.txt,.xlsx" required className="text-xs" style={{ color: theme.textMuted }} />
                            <p className="text-[10px] mt-2 opacity-50">CSV headers will be scanned for PII.</p>
                        </>
                    )}
                </div>
              )}

              {/* LINK LOGIC */}
              {uploadMode === 'link' && (
                 <input 
                    name="url" 
                    defaultValue={editingDataset?.file?.url}
                    placeholder="https://..." 
                    required 
                    className="w-full p-2 text-sm rounded border bg-transparent" 
                    style={{ borderColor: theme.border }} 
                 />
              )}

              <input name="license" defaultValue={editingDataset?.license} placeholder="License" className="w-full p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border }} />
              <textarea name="description" defaultValue={editingDataset?.description} placeholder="Description..." className="w-full p-2 text-sm rounded border bg-transparent h-24" style={{ borderColor: theme.border }} />
              
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs" style={{ color: theme.textMuted }}>Cancel</button>
                <button 
                    type="submit" 
                    disabled={uploading}
                    className="px-4 py-2 text-xs rounded text-white flex items-center gap-2" 
                    style={{ backgroundColor: theme.accent }}
                >
                    {uploading && <Loader2 className="animate-spin" size={12} />}
                    {uploading ? "Uploading..." : (editingDataset ? "Update" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * COMPONENT: EXPERIMENTS (Full CRUD: Edit Studies + Edit Logs)
 */
const Experiments = ({ project }) => {
  const { theme } = useTheme();
  const [experiments, setExperiments] = useState([]);
  const [selectedExp, setSelectedExp] = useState(null);
  
  // Modal State (Shared for Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingStudy, setIsEditingStudy] = useState(false); // <--- Track mode
  const [createLoading, setCreateLoading] = useState(false);

  // Log Input State
  const [logMsg, setLogMsg] = useState("");
  const [logType, setLogType] = useState("note"); 
  const [logFile, setLogFile] = useState(null);
  const [logLoading, setLogLoading] = useState(false);
  
  // Log Editing State
  const [editingLogId, setEditingLogId] = useState(null);
  const [editLogText, setEditLogText] = useState("");

  const [expandedLogs, setExpandedLogs] = useState({});

  // 1. Fetch
  useEffect(() => {
    if (project?.id) {
      fetch(`/api/experiments?projectId=${project.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setExperiments(data);
            if (data.length > 0 && !selectedExp) {
                setSelectedExp(data[0]);
            } else if (selectedExp) {
                const updated = data.find(e => e.id === selectedExp.id);
                if (updated) setSelectedExp(updated);
            }
          }
        });
    }
  }, [project]);

  // --- EXPERIMENT HANDLERS ---

  const handleSaveExp = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    const formData = new FormData(e.target);
    
    const payload = {
      title: formData.get('title'),
      method: formData.get('method'),
      hypothesis: formData.get('hypothesis'),
      metric: formData.get('metric'),
    };

    try {
        if (isEditingStudy) {
            // UPDATE EXISTING
            const res = await fetch('/api/experiments', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: selectedExp.id, ...payload })
            });
            const updated = await res.json();
            
            // Merge the updated fields with existing logs (API might return logs, but safety first)
            const fullUpdated = { ...selectedExp, ...updated, logs: selectedExp.logs };
            
            setSelectedExp(fullUpdated);
            setExperiments(experiments.map(ex => ex.id === fullUpdated.id ? fullUpdated : ex));
        } else {
            // CREATE NEW
            const res = await fetch('/api/experiments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projectId: project.id, ...payload, status: 'planned' })
            });
            const newExp = await res.json();
            setExperiments([newExp, ...experiments]);
            setSelectedExp(newExp);
        }
        setIsModalOpen(false);
    } catch (err) { alert("Action failed."); } 
    finally { setCreateLoading(false); }
  };

  const handleUpdateStatus = async (id, updates) => {
    // Optimistic UI update
    const updated = { ...selectedExp, ...updates };
    setSelectedExp(updated);
    setExperiments(experiments.map(e => e.id === id ? { ...e, ...updates } : e));
    await fetch('/api/experiments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    });
  };

  const handleDeleteExp = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this study?")) return;
    setExperiments(experiments.filter(e => e.id !== id));
    if (selectedExp?.id === id) setSelectedExp(null);
    await fetch(`/api/experiments?id=${id}`, { method: 'DELETE' });
  };

  // Open Edit Modal
  const openEditStudyModal = () => {
    setIsEditingStudy(true);
    setIsModalOpen(true);
  };

  // --- LOG HANDLERS ---

  const handleAddLog = async () => {
    if (!selectedExp || !logMsg.trim()) return;
    setLogLoading(true);
    try {
        const formData = new FormData();
        formData.append("experimentId", selectedExp.id);
        formData.append("message", logMsg);
        formData.append("type", logType);
        if (logFile) formData.append("file", logFile);

        const res = await fetch('/api/experiments/logs', { method: 'POST', body: formData });
        const newLog = await res.json();
        
        const currentLogs = selectedExp.logs || [];
        const updatedExp = { ...selectedExp, logs: [newLog, ...currentLogs] };
        
        setSelectedExp(updatedExp);
        setExperiments(experiments.map(ex => ex.id === updatedExp.id ? updatedExp : ex));
        
        setLogMsg("");
        setLogFile(null);
    } catch (err) { alert("Failed to log."); } 
    finally { setLogLoading(false); }
  };

  // Start Editing Log
  const startEditLog = (log) => {
    setEditingLogId(log.id);
    setEditLogText(log.message);
  };

  // Save Log Edit
  const saveLogEdit = async () => {
    if (!editLogText.trim()) return;
    
    // Optimistic Update
    const updatedLogs = selectedExp.logs.map(l => l.id === editingLogId ? { ...l, message: editLogText } : l);
    setSelectedExp({ ...selectedExp, logs: updatedLogs });
    setEditingLogId(null);

    await fetch('/api/experiments/logs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingLogId, message: editLogText })
    });
  };

  const handleTogglePin = async (log) => {
    const newStatus = !log.isPinned;
    const updatedLogs = selectedExp.logs.map(l => l.id === log.id ? { ...l, isPinned: newStatus } : l);
    setSelectedExp({ ...selectedExp, logs: updatedLogs });
    await fetch('/api/experiments/logs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: log.id, isPinned: newStatus })
    });
  };

  const handleDeleteLog = async (logId) => {
    if(!confirm("Delete log?")) return;
    const updatedLogs = selectedExp.logs.filter(l => l.id !== logId);
    setSelectedExp({ ...selectedExp, logs: updatedLogs });
    await fetch(`/api/experiments/logs?id=${logId}`, { method: 'DELETE' });
  };

  // Helpers
  const toggleLogExpand = (id) => setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }));
  
  const getStatusStyle = (status) => {
    switch(status) {
        case 'running': return { color: theme.accent, bg: `${theme.accent}20`, border: `${theme.accent}40`, label: 'Running' };
        case 'completed': return { color: theme.success, bg: `${theme.success}20`, border: `${theme.success}40`, label: 'Completed' };
        case 'abandoned': return { color: theme.danger, bg: `${theme.danger}20`, border: `${theme.danger}40`, label: 'Archived' };
        default: return { color: theme.textMuted, bg: `${theme.textMuted}20`, border: `${theme.textMuted}40`, label: 'Planned' };
    }
  };

  const getLogIcon = (type) => {
    switch(type) {
        case 'bug': return <Bug size={14} className="text-red-400" />;
        case 'result': return <CheckCircle2 size={14} className="text-green-400" />;
        case 'decision': return <Lightbulb size={14} className="text-yellow-400" />;
        default: return <StickyNote size={14} className="text-gray-400" />;
    }
  };

  const uniqueLogs = selectedExp?.logs ? selectedExp.logs.filter((log, index, self) => index === self.findIndex((t) => t.id === log.id)) : [];
  const sortedLogs = uniqueLogs.sort((a, b) => (a.isPinned === b.isPinned) ? 0 : a.isPinned ? -1 : 1);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in">
      
      {/* LEFT COL: Studies List */}
      <div className="w-80 flex flex-col gap-4 border-r pr-6 shrink-0" style={{ borderColor: theme.border }}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium" style={{ color: theme.textMain }}>Studies</h2>
          <button onClick={() => { setIsEditingStudy(false); setIsModalOpen(true); }} className="p-1.5 rounded hover:bg-white/5 transition-colors">
            <Plus size={18} color={theme.accent} />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          {experiments.map(exp => {
            const isSelected = selectedExp?.id === exp.id;
            const statusStyle = getStatusStyle(exp.status);
            return (
                <div 
                key={exp.id}
                onClick={() => setSelectedExp(exp)}
                className={`group relative p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'shadow-md' : 'hover:bg-white/5'}`}
                style={{ 
                    backgroundColor: theme.cardBg, 
                    borderColor: isSelected ? theme.accent : theme.border,
                    borderWidth: '1px'
                }}
                >
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-sm font-medium leading-tight line-clamp-2 ${isSelected ? 'text-white' : ''}`} style={{ color: isSelected ? '#FFF' : theme.textMain }}>
                        {exp.title}
                    </h3>
                    <button onClick={(e) => handleDeleteExp(exp.id, e)} className="opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-red-500/10 rounded"><Trash2 size={12}/></button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider" 
                        style={{ color: statusStyle.color, backgroundColor: statusStyle.bg, borderColor: statusStyle.border }}>
                        {statusStyle.label}
                    </span>
                    {exp.method && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border opacity-60" style={{ color: theme.textMuted, borderColor: theme.border }}>
                            {exp.method}
                        </span>
                    )}
                </div>
                <div className="text-[10px] opacity-40 flex items-center gap-2" style={{ color: theme.textMuted }}>
                    <span>{new Date(exp.startDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{exp.logs?.length || 0} logs</span>
                </div>
                </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT COL: Workbench */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedExp ? (
          <>
            {/* HEADER PANEL */}
            <div className="mb-6 p-6 rounded-xl border relative" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div className="flex justify-between items-start mb-6">
                
                {/* Title + Edit Button */}
                <div className="flex items-center gap-3 flex-1 mr-4">
                    <h1 className="text-xl font-bold" style={{ color: theme.textMain }}>{selectedExp.title}</h1>
                    <button onClick={openEditStudyModal} className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                        <Pencil size={14} />
                    </button>
                </div>
                
                <div className="relative">
                    <select 
                        value={selectedExp.status}
                        onChange={(e) => handleUpdateStatus(selectedExp.id, { status: e.target.value })}
                        className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded border bg-transparent outline-none cursor-pointer hover:bg-white/5 transition-colors"
                        style={{ color: getStatusStyle(selectedExp.status).color, borderColor: getStatusStyle(selectedExp.status).border }}
                    >
                        <option value="planned">Planned</option>
                        <option value="running">Running</option>
                        <option value="completed">Completed</option>
                        <option value="abandoned">Abandoned</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 text-sm mb-6">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block mb-1.5" style={{ color: theme.textMuted }}>Hypothesis</span>
                    <p style={{ color: theme.textMain }} className="leading-relaxed">{selectedExp.hypothesis || "—"}</p>
                </div>
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block mb-1.5" style={{ color: theme.textMuted }}>Primary Metric</span>
                    <p style={{ color: theme.textMain }} className="leading-relaxed">{selectedExp.metric || "—"}</p>
                </div>
              </div>
              <div className="pt-4 border-t" style={{ borderColor: theme.border }}>
                 <div className="flex items-center gap-2 mb-2">
                    <CheckSquare size={14} className="opacity-50" color={theme.textMuted}/>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-50" style={{ color: theme.textMuted }}>Conclusion</span>
                 </div>
                 <input 
                    className="w-full bg-transparent text-sm outline-none placeholder:opacity-30 transition-all focus:pl-2"
                    style={{ color: theme.textMain }}
                    placeholder="Enter final takeaway..."
                    defaultValue={selectedExp.conclusion}
                    onBlur={(e) => handleUpdateStatus(selectedExp.id, { conclusion: e.target.value })}
                 />
              </div>
            </div>

            {/* TIMELINE INPUT */}
            <div className="flex flex-col gap-3 mb-6 p-4 rounded-xl border" style={{ borderColor: theme.border, backgroundColor: theme.bg }}>
               <div className="flex gap-2">
                  {['note', 'result', 'decision', 'bug'].map(type => (
                      <button key={type} onClick={() => setLogType(type)} className={`text-[10px] px-3 py-1 rounded-full border transition-all uppercase font-bold flex items-center gap-1.5 ${logType === type ? 'bg-white/10 border-white/20 text-white' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                        {type === 'bug' && <Bug size={10}/>} {type === 'result' && <CheckCircle2 size={10}/>} {type === 'decision' && <Lightbulb size={10}/>} {type}
                      </button>
                  ))}
               </div>
               <div className="flex gap-2 items-start">
                 <textarea value={logMsg} onChange={(e) => setLogMsg(e.target.value)} placeholder={`Log a new ${logType}...`} className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-30 resize-none min-h-[60px]" style={{ color: theme.textMain }} rows={3} />
                 <div className="flex flex-col gap-2">
                    <div className="relative group">
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setLogFile(e.target.files[0])} />
                        <button className={`p-2 rounded transition-colors ${logFile ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500 hover:bg-white/5'}`}><Paperclip size={16} /></button>
                    </div>
                    <button onClick={handleAddLog} disabled={!logMsg || logLoading} className="p-2 rounded text-white disabled:opacity-30 transition-all flex items-center justify-center" style={{ backgroundColor: theme.accent }}>
                        {logLoading ? <Loader2 className="animate-spin" size={16}/> : <ArrowRight size={16} />}
                    </button>
                 </div>
               </div>
               {logFile && <span className="text-[10px] text-blue-400">Attached: {logFile.name}</span>}
            </div>

            {/* TIMELINE FEED (With Edit) */}
            <div className="flex-1 overflow-y-auto space-y-4 pl-2 pr-2 custom-scrollbar pb-10">
              {sortedLogs.map((log) => {
                const isExpanded = expandedLogs[log.id];
                const isLong = log.message.length > 80 || log.message.includes('\n');
                
                return (
                    <div key={log.id} className={`relative pl-8 group ${log.isPinned ? 'bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/20 mb-4' : ''}`}>
                    {!log.isPinned && <div className="absolute left-2.5 top-2 bottom-[-16px] w-[1px]" style={{ backgroundColor: theme.border }}></div>}
                    
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border flex items-center justify-center z-10 ${log.isPinned ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-gray-900'}`} style={{ borderColor: log.isPinned ? theme.warning : theme.border }}>
                        {log.isPinned ? <Pin size={10} /> : getLogIcon(log.type)}
                    </div>

                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold uppercase ${log.isPinned ? 'text-yellow-500' : 'opacity-50'}`} style={{ color: log.isPinned ? theme.warning : theme.textMuted }}>{log.isPinned ? 'Pinned' : log.type}</span>
                                <span className="text-[10px] opacity-30" style={{ color: theme.textMuted }}>{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                            
                            {/* --- EDITABLE LOG AREA --- */}
                            {editingLogId === log.id ? (
                                <div className="mt-2">
                                    <textarea 
                                        className="w-full bg-black/20 border rounded p-2 text-sm text-white resize-none outline-none focus:border-blue-500"
                                        style={{ borderColor: theme.border }}
                                        value={editLogText}
                                        onChange={(e) => setEditLogText(e.target.value)}
                                        rows={3}
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={saveLogEdit} className="text-xs px-2 py-1 bg-green-600 rounded text-white hover:bg-green-500">Save</button>
                                        <button onClick={() => setEditingLogId(null)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300 hover:bg-gray-600">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <p className={`text-sm leading-relaxed ${isExpanded ? 'whitespace-pre-wrap' : 'truncate'}`} style={{ color: theme.textMain }}>
                                        {log.message}
                                    </p>
                                    {isLong && (
                                        <button onClick={() => toggleLogExpand(log.id)} className="text-[10px] flex items-center gap-1 mt-1 opacity-60 hover:opacity-100 hover:underline" style={{ color: theme.accent }}>
                                            {isExpanded ? <>Show Less <ChevronUp size={10}/></> : <>Show More <ChevronDown size={10}/></>}
                                        </button>
                                    )}
                                </div>
                            )}
                            
                            {log.hasEvidence && log.link && (
                                <a href={log.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-3 text-xs p-2 rounded bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 w-fit transition-colors" style={{ color: theme.accent }}>
                                    <LinkIcon size={12} /> <span>{log.fileName || "View Attachment"}</span>
                                </a>
                            )}
                        </div>

                        {/* --- ACTIONS --- */}
                        {editingLogId !== log.id && (
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                <button onClick={() => handleTogglePin(log)} className={`p-1.5 rounded hover:bg-white/5 ${log.isPinned ? 'text-yellow-500' : 'text-gray-500'}`}><Pin size={12} className={log.isPinned ? "fill-current" : ""}/></button>
                                <button onClick={() => startEditLog(log)} className="p-1.5 rounded hover:bg-blue-500/10 text-gray-500 hover:text-blue-500"><Pencil size={12} /></button>
                                <button onClick={() => handleDeleteLog(log.id)} className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-500"><Trash2 size={12} /></button>
                            </div>
                        )}
                    </div>
                    </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
            <FlaskConical size={48} />
            <p>Select a study to view the notebook</p>
          </div>
        )}
      </div>

      {/* SHARED MODAL (Create + Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-xl border shadow-2xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h3 className="text-lg font-medium mb-4" style={{ color: theme.textMain }}>{isEditingStudy ? "Edit Study Details" : "Design New Experiment"}</h3>
            <form onSubmit={handleSaveExp} className="space-y-4">
              <input name="title" defaultValue={isEditingStudy ? selectedExp?.title : ""} placeholder="Experiment Title *" required className="w-full p-2.5 text-sm rounded border bg-transparent focus:ring-1" style={{ borderColor: theme.border, color: theme.textMain, '--tw-ring-color': theme.accent }} />
              <div className="grid grid-cols-2 gap-4">
                <select name="method" defaultValue={isEditingStudy ? selectedExp?.method : ""} required className="w-full p-2.5 text-sm rounded border bg-transparent" style={{ borderColor: theme.border, color: theme.textMain }}>
                    <option value="">Select Method *</option>
                    <option value="A/B Test">A/B Test</option>
                    <option value="Survey">Survey</option>
                    <option value="Interview">User Interview</option>
                    <option value="Prototype">Prototype Test</option>
                    <option value="Model Training">Model Training</option>
                    <option value="Analysis">Data Analysis</option>
                </select>
                <input name="metric" defaultValue={isEditingStudy ? selectedExp?.metric : ""} placeholder="Primary Metric (e.g. Accuracy)" className="w-full p-2.5 text-sm rounded border bg-transparent" style={{ borderColor: theme.border, color: theme.textMain }} />
              </div>
              <textarea name="hypothesis" defaultValue={isEditingStudy ? selectedExp?.hypothesis : ""} placeholder="Hypothesis..." required className="w-full p-2.5 text-sm rounded border bg-transparent h-24 resize-none" style={{ borderColor: theme.border, color: theme.textMain }} />
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-medium" style={{ color: theme.textMuted }}>Cancel</button>
                <button type="submit" disabled={createLoading} className="px-6 py-2 text-xs font-bold rounded text-white flex items-center gap-2" style={{ backgroundColor: theme.accent }}>
                    {createLoading && <Loader2 className="animate-spin" size={12} />}
                    {isEditingStudy ? "Save Changes" : "Start Experiment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HELPER: MATH LOGIC ---
const calculateCorrelation = (data, key1, key2) => {
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

// --- SUB-COMPONENT: FULL SCREEN HEATMAP (Interactive & Labeled) ---
const FullScreenHeatmap = ({ url, theme }) => {
    const [matrix, setMatrix] = useState(null);
    const [cols, setCols] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(url)
            .then(r => r.text())
            .then(csv => {
                // Parse CSV
                const lines = csv.split(/\r\n|\n/).filter(l => l.trim());
                if (lines.length < 2) return;
                
                const headers = lines[0].split(',').map(h => h.trim());
                const rawData = lines.slice(1).map(line => {
                    const vals = line.split(',');
                    const obj = {};
                    headers.forEach((h, i) => obj[h] = vals[i]);
                    return obj;
                });

                // Filter Numeric Columns
                const numericCols = headers.filter(h => {
                    return rawData.every(row => !isNaN(Number(row[h])) && row[h] !== "");
                });

                // Show up to 15 columns in full view
                const displayCols = numericCols.slice(0, 15); 
                
                const corrMatrix = displayCols.map(c1 => 
                    displayCols.map(c2 => calculateCorrelation(rawData, c1, c2))
                );

                setCols(displayCols);
                setMatrix(corrMatrix);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [url]);

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin mr-2"/> Calculating matrix...</div>;
    if (!matrix) return <div className="h-96 flex items-center justify-center">Failed to load data.</div>;

    return (
        <div className="p-4 overflow-auto max-h-[80vh]">
            <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${cols.length}, minmax(40px, 1fr))` }}>
                {/* Empty Top-Left Corner */}
                <div></div>

                {/* X-Axis Labels (Top) */}
                {cols.map((col, i) => (
                    <div key={`xh-${i}`} className="text-[9px] font-medium text-center rotate-[-45deg] origin-bottom-left translate-y-2 truncate" style={{ color: theme.textMuted }} title={col}>
                        {col.length > 10 ? col.substring(0,8)+'..' : col}
                    </div>
                ))}

                {/* Rows (Y-Axis Label + Cells) */}
                {matrix.map((row, i) => (
                    <React.Fragment key={`row-${i}`}>
                        {/* Y-Axis Label */}
                        <div className="text-[9px] font-medium flex items-center justify-end pr-2 truncate" style={{ color: theme.textMuted }} title={cols[i]}>
                             {cols[i].length > 15 ? cols[i].substring(0,12)+'..' : cols[i]}
                        </div>

                        {/* Cells */}
                        {row.map((val, j) => {
                            const opacity = Math.abs(val);
                            const bgColor = val > 0 ? `rgba(239, 68, 68, ${opacity})` : `rgba(59, 130, 246, ${opacity})`;
                            // Dynamic text color for readability
                            const textColor = opacity > 0.5 ? 'white' : (theme.type === 'dark' ? 'white' : 'black');
                            
                            return (
                                <div key={`${i}-${j}`} className="aspect-square flex items-center justify-center text-[10px] rounded-sm relative group cursor-default" style={{ backgroundColor: bgColor, color: textColor }}>
                                    {val.toFixed(1)}
                                    
                                    {/* Tooltip on Hover */}
                                    <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap" style={{ borderColor: theme.border }}>
                                        <div className="font-bold mb-1">{val.toFixed(3)}</div>
                                        <div className="text-[10px] opacity-80">{cols[i]} <br/> vs <br/> {cols[j]}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: PREVIEW CARD (Clean 5x5) ---
const HeatmapCardPreview = ({ url, theme, onClick }) => {
    const [matrix, setMatrix] = useState(null);
    const [cols, setCols] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(url)
            .then(r => r.text())
            .then(csv => {
                const lines = csv.split(/\r\n|\n/).filter(l => l.trim());
                if (lines.length < 2) return;
                const headers = lines[0].split(',').map(h => h.trim());
                const rawData = lines.slice(1).map(line => {
                    const vals = line.split(',');
                    const obj = {};
                    headers.forEach((h, i) => obj[h] = vals[i]);
                    return obj;
                });
                const numericCols = headers.filter(h => rawData.every(row => !isNaN(Number(row[h])) && row[h] !== ""));
                
                // Limit to 5x5 for clean preview
                const displayCols = numericCols.slice(0, 5); 
                const corrMatrix = displayCols.map(c1 => displayCols.map(c2 => calculateCorrelation(rawData, c1, c2)));

                setCols(displayCols);
                setMatrix(corrMatrix);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [url]);

    if (loading) return <div className="h-40 flex items-center justify-center text-xs opacity-50"><Loader2 className="animate-spin mr-2"/> analyzing...</div>;
    if (!matrix || matrix.length === 0) return <div className="h-40 flex items-center justify-center text-xs opacity-50">No data found</div>;

    return (
        <div className="cursor-pointer relative group" onClick={onClick}>
            {/* Hover Icon */}
            <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                <Maximize2 className="text-white drop-shadow-lg" size={24} />
            </div>
            {/* Simple Grid */}
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
                {matrix.map((row, i) => (
                    row.map((val, j) => {
                        const opacity = Math.abs(val);
                        const color = val > 0 ? `rgba(239, 68, 68, ${opacity})` : `rgba(59, 130, 246, ${opacity})`;
                        const textColor = opacity > 0.6 ? 'white' : 'transparent';
                        return (
                            <div key={`${i}-${j}`} className="aspect-square flex items-center justify-center text-[8px] rounded-sm" style={{ backgroundColor: color, color: textColor }}>
                                {val.toFixed(1)}
                            </div>
                        );
                    })
                ))}
            </div>
             <div className="mt-2 text-[8px] opacity-50 text-center truncate">Click to expand</div>
        </div>
    );
};

/**
 * COMPONENT: ARTIFACTS (Fixed: File Staging Feedback + Smart Edit + Unified Visuals)
 */
const Artifacts = ({ project }) => {
  const { theme } = useTheme();
  const [artifacts, setArtifacts] = useState([]);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null); // For Viewing
  const [editingArtifact, setEditingArtifact] = useState(null);   // For Editing
  
  // Upload State
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'link'
  const [showReplace, setShowReplace] = useState(false); // For Edit Mode
  const [loading, setLoading] = useState(false);
  const [stagedFile, setStagedFile] = useState(null); // <--- NEW: Track selected file name

  // 1. Fetch (Safely)
  useEffect(() => {
    if (project?.id) {
      fetch(`/api/artifacts?projectId=${project.id}`)
        .then(res => {
            if (!res.ok) return []; // If API errors, return empty array instead of crashing
            return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setArtifacts(data);
        })
        .catch(err => console.error("Failed to load artifacts:", err));
    }
  }, [project]);

  // 2. Handle Save
  const handleSaveArtifact = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    
    if (editingArtifact) {
        formData.append("id", editingArtifact.id);
        if (uploadMode === 'file' && !showReplace) formData.delete('file');
        
        try {
            const res = await fetch('/api/artifacts', { method: 'PATCH', body: formData });
            const updated = await res.json();
            setArtifacts(artifacts.map(a => a.id === updated.id ? updated : a));
        } catch (err) { alert("Update failed"); }
    } else {
        formData.append("projectId", project.id);
        if (uploadMode === 'link') formData.delete('file');

        try {
            const res = await fetch('/api/artifacts', { method: 'POST', body: formData });
            const created = await res.json();
            setArtifacts([created, ...artifacts]);
        } catch (err) { alert("Upload failed"); }
    }
    
    setLoading(false);
    setIsModalOpen(false);
    setEditingArtifact(null);
    setShowReplace(false);
    setStagedFile(null);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if(!confirm("Delete this artifact?")) return;
    await fetch(`/api/artifacts?id=${id}`, { method: 'DELETE' });
    setArtifacts(artifacts.filter(a => a.id !== id));
  }

  // Edit Click Handler (Smart Mode Lock)
  const handleEditClick = (art, e) => {
    e.stopPropagation();
    setEditingArtifact(art);
    const isUpload = art.url?.includes('cloudinary');
    setUploadMode(isUpload ? 'file' : 'link');
    setShowReplace(false);
    setStagedFile(null);
    setIsModalOpen(true);
  };

  // Create Click Handler
  const openCreateModal = () => {
    setEditingArtifact(null);
    setUploadMode('file');
    setShowReplace(false);
    setStagedFile(null);
    setIsModalOpen(true);
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        setStagedFile(e.target.files[0].name);
    }
  };

  // Helper: Visual Types (Image/Chart share logic)
  const isVisualType = (type) => ['image', 'chart'].includes(type);

  return (
    <div className="animate-in fade-in duration-500 relative z-0 pt-6">
      
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-medium" style={{ color: theme.textMain }}>Results Gallery</h2>
        <button 
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2" 
            style={{ backgroundColor: theme.accent, color: '#FFF' }}
        >
          <Plus size={14} /> Add Result
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
        {artifacts.map((art) => (
          <div key={art.id} className="group rounded-xl overflow-hidden border relative flex flex-col transition-shadow hover:shadow-md h-full" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
            
            {/* PREVIEW AREA */}
            <div className="h-48 shrink-0 border-b relative bg-gray-900/5" style={{ borderColor: theme.border }}>
                {art.type === 'heatmap' ? (
                    <div className="w-full h-full p-4 overflow-hidden">
                        <HeatmapCardPreview url={art.url} theme={theme} onClick={() => setSelectedArtifact(art)} />
                    </div>
                ) : isVisualType(art.type) ? (
                    <div 
                        className="w-full h-full flex items-center justify-center overflow-hidden cursor-pointer relative"
                        onClick={() => setSelectedArtifact(art)}
                    >
                        <img src={art.url} alt={art.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                             <Maximize2 className="text-white drop-shadow-md" size={24} />
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 gap-2">
                        <div className="p-3 rounded-full bg-blue-500/10 text-blue-500"><FileText size={24}/></div>
                        <a href={art.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Download File ↗</a>
                    </div>
                )}
            </div>

            {/* INFO AREA */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium truncate w-full" title={art.title} style={{ color: theme.textMain }}>{art.title}</h3>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                        {art.type !== 'heatmap' && (
                            <button onClick={(e) => handleEditClick(art, e)} className="p-1.5 hover:bg-blue-500/10 text-gray-400 hover:text-blue-500 rounded transition-colors">
                                <Pencil size={12} />
                            </button>
                        )}
                        <button onClick={(e) => handleDelete(art.id, e)} className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded transition-colors">
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
                
                <div className="mb-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-50 px-1.5 py-0.5 rounded border" style={{ color: theme.textMuted, borderColor: theme.border }}>
                        {art.type}
                    </span>
                </div>

                <p className="text-xs line-clamp-3 opacity-60 flex-1" style={{ color: theme.textMuted }}>{art.subtitle || "No caption."}</p>
            </div>
          </div>
        ))}
      </div>

      {artifacts.length === 0 && <p className="text-center py-20 text-xs opacity-50">No artifacts yet.</p>}

      {/* FULL SCREEN MODAL */}
      {selectedArtifact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] rounded-xl border shadow-2xl overflow-hidden flex flex-col" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: theme.border }}>
                <div>
                    <h3 className="text-lg font-medium" style={{ color: theme.textMain }}>{selectedArtifact.title}</h3>
                    {selectedArtifact.subtitle && <p className="text-sm opacity-50">{selectedArtifact.subtitle}</p>}
                </div>
                <button onClick={() => setSelectedArtifact(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <X size={20} style={{ color: theme.textMuted }} />
                </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50/5 p-4 flex items-center justify-center">
                {isVisualType(selectedArtifact.type) ? (
                    <img src={selectedArtifact.url} alt={selectedArtifact.title} className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg" />
                ) : selectedArtifact.type === 'heatmap' ? (
                    <FullScreenHeatmap url={selectedArtifact.url} theme={theme} />
                ) : (
                    <div className="text-center p-10">
                        <FileText size={48} className="mx-auto mb-4 opacity-20"/>
                        <p>Preview not supported.</p>
                        <a href={selectedArtifact.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline mt-4 block">Open external link ↗</a>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border shadow-2xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h3 className="text-lg font-medium mb-4" style={{ color: theme.textMain }}>{editingArtifact ? "Edit Result" : "Add Result"}</h3>
            
            {/* TABS: Only show if creating new (Lock logic applied) */}
            {!editingArtifact ? (
                <div className="flex gap-4 mb-4 border-b" style={{ borderColor: theme.border }}>
                    <button 
                        onClick={() => { setUploadMode('file'); setShowReplace(false); }}
                        className={`pb-2 text-sm font-medium transition-colors ${uploadMode === 'file' ? 'border-b-2' : 'opacity-50'}`}
                        style={{ borderColor: theme.accent, color: uploadMode === 'file' ? theme.textMain : theme.textMuted }}
                    >
                        File Upload
                    </button>
                    <button 
                        onClick={() => setUploadMode('link')}
                        className={`pb-2 text-sm font-medium transition-colors ${uploadMode === 'link' ? 'border-b-2' : 'opacity-50'}`}
                        style={{ borderColor: theme.accent, color: uploadMode === 'link' ? theme.textMain : theme.textMuted }}
                    >
                        External Link
                    </button>
                </div>
            ) : (
                // If editing, show label instead of tabs
                <div className="mb-4 text-xs font-bold uppercase tracking-wider opacity-50" style={{ color: theme.textMuted }}>
                    {uploadMode === 'file' ? 'Editing Upload' : 'Editing Link'}
                </div>
            )}

            <form onSubmit={handleSaveArtifact} className="space-y-4">
              <input name="title" defaultValue={editingArtifact?.title} placeholder="Title" required className="w-full p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border }} />
              
              <div className="flex gap-4">
                <select name="type" defaultValue={editingArtifact?.type || "image"} className="p-2 text-sm rounded border bg-transparent shrink-0" style={{ borderColor: theme.border }}>
                  <option value="image">Image</option>
                  <option value="chart">Chart</option>
                  <option value="code">Code</option>
                </select>
                
                {/* DYNAMIC INPUT */}
                {uploadMode === 'link' ? (
                    <input name="url" defaultValue={editingArtifact?.url} placeholder="https://..." required={!editingArtifact} className="flex-1 p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border }} />
                ) : (
                    <div className="flex-1 relative group">
                        {/* FILE INPUT (Hidden overlay) */}
                        {(!editingArtifact || showReplace) && (
                            <input 
                                type="file" 
                                name="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                                required={!editingArtifact}
                                onChange={handleFileChange} // Show feedback
                            />
                        )}

                        {/* CUSTOM FILE BUTTON UI */}
                        {editingArtifact && !showReplace ? (
                            <div className="flex items-center justify-between p-2 border rounded bg-gray-500/10" style={{ borderColor: theme.border }}>
                                <span className="text-xs truncate opacity-70 max-w-[150px]">Keep Current File</span>
                                <button type="button" onClick={() => setShowReplace(true)} className="text-xs text-blue-500 hover:underline z-30">Replace</button>
                            </div>
                        ) : (
                            <div className="w-full p-2 text-sm rounded border bg-transparent flex items-center gap-2 truncate" style={{ borderColor: theme.border, color: theme.textMuted }}>
                                <Paperclip size={14}/> 
                                <span className={`truncate ${stagedFile ? 'text-blue-400' : ''}`}>
                                    {stagedFile ? stagedFile : (editingArtifact ? "Click to Replace..." : "Choose File...")}
                                </span>
                            </div>
                        )}
                    </div>
                )}
              </div>
              
              <textarea name="caption" defaultValue={editingArtifact?.subtitle} placeholder="Caption..." className="w-full p-2 text-sm rounded border bg-transparent h-24" style={{ borderColor: theme.border }} />
              
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs" style={{ color: theme.textMuted }}>Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-xs rounded text-white flex items-center gap-2" style={{ backgroundColor: theme.accent }}>
                    {loading && <Loader2 className="animate-spin" size={12}/>} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * COMPONENT: OVERVIEW HUB (Fixed Layout + Single Line Tasks)
 */
const OverviewHub = ({ project }) => {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  
  // Task Input State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  
  // UI State
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [expandedTasks, setExpandedTasks] = useState({}); // Tracks open tasks

  // 1. Fetch Data
  useEffect(() => {
    if (project?.id) {
      fetch(`/api/projects/${project.id}`)
        .then(res => res.json())
        .then(details => setData(details));
    }
  }, [project]);

  // Helper: Count Words
  const getWordCount = (str) => str.trim().split(/\s+/).filter(Boolean).length;

  // 2. Add Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id, title: newTaskTitle })
    });
    const newTask = await res.json();
    setData(prev => ({ ...prev, tasks: [newTask, ...(prev.tasks || [])] }));
    setNewTaskTitle("");
  };

  // 3. Handle Input (Limit 100 Words)
  const handleInputChange = (e) => {
    const val = e.target.value;
    if (getWordCount(val) <= 100) setNewTaskTitle(val);
  };

  // 4. Toggle Expand
  const toggleExpand = (id) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 5. Toggle Status
  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const updatedTasks = data.tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
    setData(prev => ({ ...prev, tasks: updatedTasks }));
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status: newStatus })
    });
  };

  const handleDeleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
  };

  const startEditing = (task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = async () => {
    if (!editTitle.trim()) return;
    const updatedTasks = data.tasks.map(t => t.id === editingTask ? { ...t, title: editTitle } : t);
    setData(prev => ({ ...prev, tasks: updatedTasks }));
    setEditingTask(null);
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingTask, title: editTitle })
    });
  };

  if (!data) return <div className="p-8 text-center text-sm opacity-50">Loading Dashboard...</div>;

  // Stats
  const allTasks = data.tasks || [];
  const doneTasks = allTasks.filter(t => t.status === 'done').length;
  const pendingTasks = allTasks.length - doneTasks;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  const donutData = [
    { name: 'Done', value: doneTasks, color: theme.success },
    { name: 'Pending', value: pendingTasks, color: theme.textMuted + '40' }
  ];

  const papersByYear = (data.papers || []).reduce((acc, p) => {
    const year = p.year || 'Unknown';
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.keys(papersByYear).map(y => ({ name: y, value: papersByYear[y] }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* TOP STATS ROW */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Pending Tasks', val: pendingTasks, icon: <Check size={16}/>, color: theme.accent },
          { label: 'Papers', val: data.papers?.length || 0, icon: <BookOpen size={16}/>, color: theme.success },
          { label: 'Datasets', val: data.datasets?.length || 0, icon: <Database size={16}/>, color: theme.warning },
          { label: 'Studies', val: data.experiments?.length || 0, icon: <FlaskConical size={16}/>, color: theme.danger }
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl border flex items-center justify-between" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div>
              <p className="text-[10px] font-bold tracking-wider opacity-60 uppercase" style={{ color: theme.textMuted }}>{stat.label}</p>
              <p className="text-2xl font-medium mt-1" style={{ color: theme.textMain }}>{stat.val}</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-20" style={{ backgroundColor: stat.color, color: stat.color }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* LAYOUT FIX: 
          h-[28rem] (approx 450px) locks the height of this entire row.
          Graphs won't grow. Tasks will scroll.
      */}
      <div className="grid grid-cols-3 gap-6 h-[28rem]">
        
        {/* COL 1: TASK PROGRESS (Donut) */}
        <div className="col-span-1 rounded-xl border p-6 flex flex-col relative h-full" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: theme.textMain }}>Task Completion</h3>
          <div className="flex-1 w-full min-h-0 relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={donutData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                   {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 </Pie>
                 <Tooltip contentStyle={{ backgroundColor: theme.bg, borderColor: theme.border, borderRadius: '8px' }} itemStyle={{ color: theme.textMain }} />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold" style={{ color: theme.textMain }}>{progress}%</span>
             </div>
          </div>
        </div>

        {/* COL 2: LITERATURE TIMELINE (Bar) */}
        <div className="col-span-1 rounded-xl border p-6 flex flex-col h-full" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: theme.textMain }}>Literature / Year</h3>
          <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData}>
                 <XAxis dataKey="name" stroke={theme.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                 <Tooltip contentStyle={{ backgroundColor: theme.bg, borderColor: theme.border, borderRadius: '8px' }} itemStyle={{ color: theme.textMain }} />
                 <Bar dataKey="value" fill={theme.accent} radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* COL 3: TASKS (Scrollable + Single Line) */}
        <div className="col-span-1 rounded-xl border p-4 flex flex-col h-full overflow-hidden" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
           <div className="flex justify-between items-center mb-3 shrink-0">
             <h3 className="text-sm font-medium" style={{ color: theme.textMain }}>Tasks</h3>
             <span className="text-[10px] opacity-50" style={{ color: theme.textMuted }}>{getWordCount(newTaskTitle)}/100 words</span>
           </div>
           
           {/* Add Input */}
           <div className="flex gap-2 mb-4 shrink-0 items-start">
             <textarea 
               className="flex-1 p-2 text-xs rounded border bg-transparent outline-none focus:ring-1 resize-none custom-scrollbar"
               rows={2}
               style={{ borderColor: theme.border, '--tw-ring-color': theme.accent, color: theme.textMain }}
               placeholder="Add task..."
               value={newTaskTitle}
               onChange={handleInputChange}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleAddTask(e);
                 }
               }}
             />
             <button onClick={handleAddTask} disabled={!newTaskTitle.trim()} className="p-2 h-8 w-8 flex items-center justify-center rounded hover:opacity-80 disabled:opacity-50 mt-1" style={{ backgroundColor: theme.accent, color: '#FFF' }}>
               <Plus size={14} />
             </button>
           </div>

           {/* Scrollable List Container - flex-1 takes remaining space, overflow-y-auto makes it scroll */}
           <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
             {allTasks.map(task => {
               const isExpanded = expandedTasks[task.id];
               const isLong = task.title.length > 40; // Threshold for Show More

               return (
                 <div 
                   key={task.id} 
                   className="flex items-start gap-3 p-2 rounded hover:bg-white/5 group border border-transparent hover:border-gray-500/20 transition-all"
                 >
                   {/* Checkbox */}
                   <button 
                      onClick={() => handleToggleTask(task)}
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}
                   >
                     {task.status === 'done' && <Check size={10} color="#FFF" />}
                   </button>

                   {/* Content Area */}
                   <div className="flex-1 min-w-0">
                      {editingTask === task.id ? (
                          <div className="flex gap-2">
                              <textarea 
                                  autoFocus
                                  className="w-full text-xs bg-transparent border-b outline-none resize-none"
                                  rows={3}
                                  style={{ borderColor: theme.accent, color: theme.textMain }}
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                              />
                              <div className="flex flex-col gap-1">
                                <button onClick={saveEdit} className="text-green-500"><Check size={12}/></button>
                                <button onClick={() => setEditingTask(null)} className="text-red-500"><X size={12}/></button>
                              </div>
                          </div>
                      ) : (
                          <div>
                            <p 
                                className={`text-xs ${task.status === 'done' ? 'line-through opacity-50' : ''} ${isExpanded ? 'whitespace-pre-wrap' : 'truncate'}`} 
                                style={{ color: theme.textMain }}
                            >
                               {task.title}
                            </p>
                            
                            {/* Show More / Less Toggle */}
                            {isLong && (
                                <button 
                                    onClick={() => toggleExpand(task.id)}
                                    className="text-[10px] flex items-center gap-1 mt-0.5 opacity-60 hover:opacity-100 hover:underline"
                                    style={{ color: theme.accent }}
                                >
                                    {isExpanded ? <>Show Less <ChevronUp size={10}/></> : <>Show More <ChevronDown size={10}/></>}
                                </button>
                            )}
                          </div>
                      )}
                   </div>

                   {/* Edit/Delete Actions */}
                   {!editingTask && (
                       <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditing(task)} className="p-1 text-blue-500 hover:bg-blue-500/10 rounded"><Pencil size={12}/></button>
                          <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={12}/></button>
                       </div>
                   )}
                 </div>
               );
             })}
             
             {allTasks.length === 0 && <span className="text-xs opacity-50 text-center block mt-10">No tasks.</span>}
           </div>
        </div>
      </div>
    </div>
  );
};

/**
 * COMPONENT: LANDING PAGE (Linear-Style)
 */
const LandingPage = ({ onLogin }) => {
  
  // Helper for documentation link
  const handleDocs = () => {
    window.open('https://github.com/', '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-purple-500/30">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0B0E14]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
              <div className="w-2 h-2 bg-black rounded-full" />
            </div>
            <span className="font-semibold tracking-tight">ResearchOS</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onLogin} className="text-sm text-gray-400 hover:text-white transition-colors">Log In</button>
            <button onClick={onLogin} className="text-sm bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-purple-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            v1.0 is now live
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            The operating system <br /> for modern research.
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            Manage literature, track experiments, and visualize results in one unified workspace. Designed for labs that move fast.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <button onClick={onLogin} className="h-12 px-8 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-all flex items-center gap-2 group">
              Start Researching <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={handleDocs} className="h-12 px-8 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-gray-300">
              View Documentation
            </button>
          </div>
        </div>
      </div>

      {/* --- UI PREVIEW (Bento Grid Style) --- */}
      <div className="max-w-6xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Literature */}
          <div className="col-span-2 p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
                <BookOpen size={20} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Literature Manager</h3>
              <p className="text-gray-400 text-sm max-w-sm">AI-powered summarization and organization for your papers. Never lose a citation again.</p>
            </div>
            <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Card 2: Experiments */}
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
              <FlaskConical size={20} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lab Notebook</h3>
            <p className="text-gray-400 text-sm">Track variables, log results, and maintain reproducibility.</p>
          </div>

          {/* Card 3: Data */}
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <Database size={20} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Data Registry</h3>
            <p className="text-gray-400 text-sm">Secure storage with automatic PII detection and schema validation.</p>
          </div>

          {/* Card 4: Global Search */}
          <div className="col-span-2 p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex items-center justify-between">
            <div>
               <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4 text-orange-400">
                <Zap size={20} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Command Center</h3>
              <p className="text-gray-400 text-sm max-w-xs">Find any paper, dataset, or experiment instantly across all your projects.</p>
            </div>
            <div className="hidden sm:block p-4 bg-black/40 rounded-xl border border-white/10 text-xs text-gray-500 font-mono">
               Cmd + K to search...
            </div>
          </div>

        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="text-sm text-gray-500">© 2024 ResearchOS. All rights reserved.</div>
           <div className="flex gap-6">
              <CheckCircle2 size={20} className="text-gray-600" />
              <Shield size={20} className="text-gray-600" />
              <Globe size={20} className="text-gray-600" />
           </div>
        </div>
      </footer>
    </div>
  );
};

/**
 * MAIN APP SHELL (Final: Landing Page -> Custom Auth -> App)
 */
const ResearchOS = () => {
  const { data: session } = useSession();
  
  // NEW: State to toggle between Landing Page and Custom Auth Screen
  const [showAuth, setShowAuth] = useState(false);

  // App State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projects, setProjects] = useState([]); 
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  // Theme Logic
  const currentTheme = useMemo(() => isDarkMode ? DARK_THEME : LIGHT_THEME, [isDarkMode]);
  const themeContextValue = useMemo(() => ({
    theme: currentTheme,
    toggleTheme: () => setIsDarkMode(prev => !prev),
    isDarkMode
  }), [currentTheme, isDarkMode]);
  
  // 1. Fetch Projects
  useEffect(() => {
    if (session) {
      fetch('/api/projects')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setProjects(data);
        })
        .catch(err => console.error("Failed to load projects", err));
    }
  }, [session]);

  // 2. Search Logic
  useEffect(() => {
    if (!searchQuery.trim() || !selectedProject) {
        setSearchResults(null);
        return;
    }
    const timer = setTimeout(() => {
        setIsSearching(true);
        fetch(`/api/search?projectId=${selectedProject.id}&q=${searchQuery}`)
            .then(res => res.json())
            .then(data => setSearchResults(data))
            .catch(() => setSearchResults(null))
            .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedProject]);

  // Click Outside Search
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
            setIsSearchOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const handleCreateProject = async (title, description) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      if (!res.ok) throw new Error("Failed");
      const newProject = await res.json();
      setProjects([newProject, ...projects]);
      setIsCreateModalOpen(false);
    } catch (err) { alert("Failed to create project"); }
  };

  const handleLogout = () => {
    signOut(); 
    setSelectedProject(null);
    setShowAuth(false); // Reset to landing page on logout
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setActiveTab('overview');
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  const handleSearchResultClick = (type) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    if (type === 'paper') setActiveTab('literature');
    if (type === 'task') setActiveTab('overview');
    if (type === 'dataset') setActiveTab('datasets');
    if (type === 'experiment') setActiveTab('experiments');
    if (type === 'artifact') setActiveTab('artifacts');
  };

  // Helper: Render Tab Content
  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewHub project={selectedProject} />;
      case 'literature': return <LiteratureManager project={selectedProject} />;
      case 'datasets': return <DatasetRegistry project={selectedProject} />;
      case 'experiments': return <Experiments project={selectedProject} />;
      case 'artifacts': return <Artifacts project={selectedProject} />;
      default: return <OverviewHub project={selectedProject} />;
    }
  };

  const getBreadcrumbs = () => {
    const projName = selectedProject?.title || 'Project';
    const map = {
      overview: `Projects / ${projName} / Overview`,
      literature: `Projects / ${projName} / Literature`,
      datasets: `Projects / ${projName} / Datasets`,
      experiments: `Projects / ${projName} / Experiments`,
      artifacts: `Projects / ${projName} / Artifacts`
    };
    return map[activeTab] || 'Projects';
  };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {!session ? (
        // --- LOGIC SWITCH: Landing Page VS Your Custom Auth Screen ---
        !showAuth ? (
            <LandingPage onLogin={() => setShowAuth(true)} />
        ) : (
            // Passing empty fn since session update handles the redirect automatically
            <AuthScreen onLogin={() => {}} /> 
        )
      ) : !selectedProject ? (
        // --- SHOW PROJECT SELECTION ---
        <>
          <ProjectSelectionScreen 
            projects={projects}
            onSelectProject={handleSelectProject}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onLogout={handleLogout}
            toggleTheme={() => setIsDarkMode(!isDarkMode)}
            isDarkMode={isDarkMode}
          />
          <CreateProjectModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateProject}
            theme={currentTheme}
          />
        </>
      ) : (
        // --- SHOW MAIN APP ---
        <div className="flex h-screen w-screen overflow-hidden font-sans transition-colors duration-300" style={{ backgroundColor: currentTheme.bg, color: currentTheme.textMain }}>
          
          {/* SIDEBAR (With Footer Settings) */}
          <div className="w-[240px] flex flex-col h-full border-r fixed left-0 top-0 bottom-0 z-20" style={{ backgroundColor: currentTheme.bgSidebar, borderColor: currentTheme.border }}>
             <Sidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                projectName={selectedProject?.title} 
                projectColor={selectedProject?.color}
                onLogout={handleLogout} // "Back" button
             />
             
             {/* Sidebar Footer Settings */}
             <div className="p-4 border-t mt-auto" style={{ borderColor: currentTheme.border }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-50 pl-2">Settings</div>
                <div className="space-y-1">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors opacity-70 hover:opacity-100">
                        {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                        <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                    </button>
                    <button onClick={() => alert("Change Password Coming Soon")} className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors opacity-70 hover:opacity-100">
                        <Lock size={14} />
                        <span>Change Password</span>
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                        <LogOut size={14} />
                        <span>Log Out</span>
                    </button>
                </div>
             </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 ml-[240px] flex flex-col h-full overflow-hidden relative">
            <header 
              className="h-14 flex items-center justify-between px-8 border-b z-50 absolute top-0 left-0 right-0 transition-colors duration-300" 
              style={{ 
                borderColor: currentTheme.border, 
                backgroundColor: isDarkMode ? 'rgba(11, 14, 20, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)'
              }}
            >
              {/* Breadcrumbs */}
              {!isSearchOpen ? (
                  <div className="flex items-center gap-2 text-sm animate-in fade-in" style={{ color: currentTheme.textMuted }}>
                    <button onClick={handleBackToProjects} className="hover:text-opacity-80 transition-colors hover:underline">Projects</button>
                    <span>/</span>
                    {getBreadcrumbs().split(' / ').slice(1).map((crumb, i, arr) => (
                      <React.Fragment key={i}>
                        <span className={i === arr.length - 1 ? 'font-medium' : ''} style={{ color: i === arr.length - 1 ? currentTheme.textMain : currentTheme.textMuted }}>{crumb}</span>
                        {i !== arr.length - 1 && <span className="opacity-50">/</span>}
                      </React.Fragment>
                    ))}
                  </div>
              ) : <div className="flex-1" />}

              {/* SEARCH BAR (Top Right) */}
              <div ref={searchRef} className={`relative flex items-center justify-end transition-all duration-300 ${isSearchOpen ? 'w-full max-w-lg' : 'w-auto'}`}>
                <div 
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all overflow-hidden ${isSearchOpen ? 'w-full bg-gray-500/10 ring-1 ring-gray-500/20' : 'w-auto hover:bg-gray-500/5 cursor-pointer'}`}
                    onClick={() => { setIsSearchOpen(true); }}
                >
                    <Search size={16} color={currentTheme.textMuted} className="shrink-0" />
                    
                    {isSearchOpen ? (
                        <input 
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search papers, tasks, data..."
                            className="bg-transparent border-none outline-none text-sm w-full min-w-[200px]"
                            style={{ color: currentTheme.textMain }}
                        />
                    ) : (
                        <span className="text-sm opacity-50 select-none hidden sm:block">Search</span>
                    )}

                    {isSearchOpen && (
                        <div className="flex items-center gap-2 shrink-0">
                            {isSearching ? <Loader2 size={14} className="animate-spin opacity-50" /> : null}
                            <button onClick={(e) => { e.stopPropagation(); setSearchQuery(""); setIsSearchOpen(false); }}>
                                <X size={14} className="opacity-50 hover:opacity-100"/>
                            </button>
                        </div>
                    )}
                </div>

                {/* SEARCH RESULTS DROPDOWN */}
                {isSearchOpen && searchResults && searchQuery && (
                    <div className="absolute top-full right-0 w-full mt-2 rounded-xl border shadow-xl overflow-hidden max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2" style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}>
                        
                        {Object.values(searchResults).every(arr => !arr || arr.length === 0) && (
                            <div className="p-4 text-center text-xs opacity-50">No results found.</div>
                        )}

                        {/* Results Groups */}
                        {['papers', 'tasks', 'experiments', 'datasets', 'artifacts'].map(category => {
                            const items = searchResults[category];
                            if (!items || items.length === 0) return null;
                            const typeMap = { papers: 'paper', tasks: 'task', experiments: 'experiment', datasets: 'dataset', artifacts: 'artifact' };
                            
                            return (
                                <div key={category} className="p-2 border-b last:border-0" style={{ borderColor: currentTheme.border }}>
                                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 px-2 mb-1">{category}</div>
                                    {items.map(item => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => handleSearchResultClick(typeMap[category])} 
                                            className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer text-sm transition-colors"
                                        >
                                            {category === 'papers' && <BookOpen size={14} className="opacity-50"/>}
                                            {category === 'tasks' && <Check size={14} className="opacity-50"/>}
                                            {category === 'experiments' && <FlaskConical size={14} className="opacity-50"/>}
                                            {category === 'datasets' && <Database size={14} className="opacity-50"/>}
                                            {category === 'artifacts' && <FileText size={14} className="opacity-50"/>}
                                            
                                            <span className="truncate" style={{color: currentTheme.textMain}}>
                                                {category === 'datasets' ? item.file?.name : item.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}
              </div>
            </header>

            <main className="flex-1 overflow-y-auto pt-20 px-8 pb-12">
              <div className="max-w-6xl mx-auto">
                {renderContent()}
              </div>
            </main>

          </div>
        </div>
      )}
    </ThemeContext.Provider>
  );
};

export default ResearchOS;