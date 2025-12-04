"use client";
import { signIn, useSession, signOut } from "next-auth/react";
import React, { useState, useEffect, useMemo, createContext, useContext, useRef, Suspense} from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // <--- ADD THIS
import { 
  LayoutGrid, BookOpen, Database, FlaskConical, AreaChart, 
  Settings, Plus, Search, LogOut, ChevronRight, Check, 
  Trash2, Pencil, Maximize2, Paperclip, ExternalLink,
  FileText, Clock, AlertCircle, X, Sparkles, Loader2, Bot,
  ArrowRight, Filter, Users, ArrowUpDown, Sun, Moon, Key, Lock,
  ClipboardList, Share2, UserIcon, Box, Atom, Brain, Cpu, Rocket, Microscope, Layers, Activity, GitBranch, CheckCircle2, Bug, Bell, Pin, StickyNote, Lightbulb, 
  MoreHorizontal, Link as LinkIcon, CheckSquare, PlayCircle, Zap, Shield, Globe, StopCircle, Archive, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { GiArchiveResearch } from "react-icons/gi";
import NetworkBackground from "@/components/NetworkBackground";
import dynamic from "next/dynamic"; // <--- ADD THIS LINE
// Add Dynamic Import for v2
const ReCAPTCHA = dynamic(() => import("react-google-recaptcha"), { 
  ssr: false,
  loading: () => <div className="h-[78px] w-[304px] bg-gray-800/50 rounded animate-pulse" />
});

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
  accent: '#6366F1',
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
 * COMPONENT: LOGIN SCREEN (Updated with reCAPTCHA v2)
 */
const AuthScreen = ({ onLogin }) => {
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- RECAPTCHA V2 STATE ---
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<any>(null);

  // Helper: Strong Password Check
  const validatePassword = (pwd) => {
    // At least 8 chars, 1 uppercase, 1 number, 1 special char
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return re.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Client-side Validation
    if (!isLogin) {
      if (!validatePassword(password)) {
        setError("Password must have 8+ chars, 1 uppercase, 1 number, and 1 special char.");
        return;
      }

      // 2. Check CAPTCHA for Signup
      if (!captchaToken) {
        setError("Please complete the CAPTCHA verification.");
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
        // --- SIGNUP LOGIC (With v2 Token) ---
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, captchaToken }), // Send v2 token
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Registration failed');
        
        // Auto-login after signup
        await signIn('credentials', { redirect: false, email, password });
        onLogin();
      }
    } catch (err) {
      setError(err.message);
      // Reset captcha on error so user can try again
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden"> 
      <NetworkBackground />
      <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none z-0"
      />
      <div className="w-full max-w-md p-8 rounded-xl shadow-2xl border relative z-10 backdrop-blur-xl bg-[#161B22]/80" 
           style={{ borderColor: theme.border }}>
        
        <div className="text-center mb-8">
          <div className="h-12 w-12 mx-auto mb-4 rounded-lg flex items-center justify-center" 
               style={{ backgroundColor: theme.accent }}>
            <GiArchiveResearch size={35} color="white" />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: theme.textMain }}>Research OS</h1>
          <p style={{ color: theme.textMuted }}>{isLogin ? 'Welcome back' : 'Create your lab'}</p>
        </div>

        {/* --- GOOGLE LOGIN BUTTON --- */}
        <button
          onClick={() => signIn("google")} 
          className="w-full py-2.5 rounded-lg font-medium text-sm mb-6 flex items-center justify-center gap-3 transition-all hover:opacity-90 shadow-sm"
          style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
            </g>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
           <div className="flex-1 h-[1px]" style={{ backgroundColor: theme.border }}></div>
           <span className="text-xs font-medium uppercase opacity-50" style={{ color: theme.textMuted }}>Or</span>
           <div className="flex-1 h-[1px]" style={{ backgroundColor: theme.border }}></div>
        </div>

        {/* EXISTING FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md text-sm flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5 ml-1" style={{ color: theme.textMuted }}>EMAIL</label>
            <input 
              type="email" 
              required
              className="w-full p-3 rounded-lg text-sm border transition-all focus:ring-1 outline-none bg-transparent"
              style={{ 
                borderColor: theme.border, 
                color: theme.textMain,
                '--tw-ring-color': theme.accent 
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 ml-1" style={{ color: theme.textMuted }}>
                PASSWORD 
                {!isLogin && <span className="opacity-50 font-normal ml-1">(8+ chars, A-Z, 0-9, #$%)</span>}
            </label>
            <input 
              type="password" 
              required
              className="w-full p-3 rounded-lg text-sm border transition-all focus:ring-1 outline-none bg-transparent"
              style={{ 
                borderColor: theme.border, 
                color: theme.textMain,
                '--tw-ring-color': theme.accent 
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* --- RECAPTCHA V2 WIDGET (Only for Signup) --- */}
          {!isLogin && (
            <div className="flex justify-center mb-2">
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                    onChange={(token) => setCaptchaToken(token)}
                    theme="dark" // Matches your dark mode theme
                />
            </div>
          )}
          {/* --------------------------------------------- */}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-lg font-medium text-sm transition-all hover:opacity-90 flex justify-center items-center"
            style={{ backgroundColor: theme.accent, color: '#FFF' }}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setCaptchaToken(null); }}
            className="text-xs hover:underline"
            style={{ color: theme.textMuted }}
          >
            {isLogin ? "Need an account? Sign up" : "Have an account? Log in"}
          </button>
        </div>
        
      </div>
    </div>
  );
};

/**
 * COMPONENT: CREATE / EDIT PROJECT MODAL (Updated)
 */
const CreateProjectModal = ({ isOpen, onClose, onSubmit, theme, initialData = null }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill data when editing
  useEffect(() => {
    if (isOpen && initialData) {
        setTitle(initialData.title);
        setDesc(initialData.description || "");
    } else if (isOpen) {
        // Reset if creating new
        setTitle("");
        setDesc("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Wait for the parent operation (Create or Update) to finish
    await onSubmit(title, desc);
    
    setLoading(false);
    
    // Only clear fields if creating a NEW project.
    // If editing, we keep the values so the UI doesn't jump before closing.
    if (!initialData) {
        setTitle("");
        setDesc("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md p-6 rounded-xl shadow-2xl border" 
           style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
        <h2 className="text-lg font-medium mb-4" style={{ color: theme.textMain }}>
            {initialData ? "Edit Project" : "New Project"}
        </h2>
        
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
              {initialData ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * COMPONENT: PROJECT SELECTION SCREEN (Fixed & Updated)
 */
const ProjectSelectionScreen = ({ 
  projects, 
  onSelectProject, 
  onOpenCreateModal,
  onLogout,
  toggleTheme,
  isDarkMode,
  onRefreshProjects,
  onEdit,   
  onDelete 
}) => {
  const { theme } = useTheme(); 
  
  // --- VIEW STATE ---
  const [viewMode, setViewMode] = useState('my'); // 'my' | 'explore'
  
  // --- COMMENT UI STATE ---
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  
  // Store the list of fetched comments
  const [currentComments, setCurrentComments] = useState([]); 
  const [fetchingComments, setFetchingComments] = useState(false);

  // --- SETTINGS STATE ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const menuRef = useRef(null);

  // --- LOCAL SORT/FILTER STATE (My Projects) ---
  const [localSearch, setLocalSearch] = useState("");
  const [sortBy, setSortBy] = useState('created'); 
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  // --- GLOBAL SEARCH STATE ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  // --- EXPLORE STATE (Public Feed) ---
  const [publicProjects, setPublicProjects] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [forkingId, setForkingId] = useState(null);
  
  // --- PASSWORD LOGIC ---
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passMsg, setPassMsg] = useState(""); 
  const [passLoading, setPassLoading] = useState(false);
  
  // --- MENU STATE (For Edit/Delete) ---
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // --- NEW: Infinite Scroll Ref & Logic ---
  const observerRef = useRef(null);

  useEffect(() => {
    if (viewMode !== 'explore') return;

    const observer = new IntersectionObserver((entries) => {
        // If bottom is visible AND we have data, append current data to itself
        if (entries[0].isIntersecting && !exploreLoading && publicProjects.length > 0) {
            setPublicProjects(prev => [...prev, ...prev]); 
        }
    }, { threshold: 0.1 });

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [publicProjects, exploreLoading, viewMode]);

  // --- CLICK OUTSIDE LISTENER (FIXED) ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 1. Close Settings Menu (Only if clicked outside the container)
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }

      // 2. Close Search
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }

      // 3. Close Sort Dropdown
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }

      // 4. Close Project Card Menus (CRITICAL FIX)
      // Only close if the click is NOT inside the menu popup
      if (!event.target.closest('.project-menu-popup')) {
          setActiveMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuToggle = (id, e) => {
      e.stopPropagation();
      // If clicking the same one, close it. If different, open new one.
      setActiveMenuId(activeMenuId === id ? null : id);
  };

  // --- FETCH PUBLIC FEED ---
  useEffect(() => {
    if (viewMode === 'explore') {
        setExploreLoading(true);
        // Force fresh fetch with timestamp
        fetch(`/api/projects/public?t=${Date.now()}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPublicProjects(data);
            })
            .catch(err => console.error("Failed to fetch feed:", err))
            .finally(() => setExploreLoading(false));
    }
  }, [viewMode]);
  
  // --- FETCH COMMENTS ---
  useEffect(() => {
    if (openCommentsId) {
        setFetchingComments(true);
        fetch(`/api/projects/comments?projectId=${openCommentsId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCurrentComments(data);
            })
            .finally(() => setFetchingComments(false));
    } else {
        setCurrentComments([]); 
    }
  }, [openCommentsId]);
  
  // --- FORK HANDLER ---
  const handleForkProject = async (proj, e) => {
      e.stopPropagation();
      if (!confirm(`Fork "${proj.title}" to your workspace?`)) return;
      
      setForkingId(proj.id);
      
      try {
          const res = await fetch('/api/projects/fork', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ originalProjectId: proj.id })
          });
          
          if (!res.ok) throw new Error("Fork failed");
          
          const newProject = await res.json();
          if (onRefreshProjects) await onRefreshProjects();
          alert(`Project forked! You are now the owner of "${newProject.title}".`);
          setViewMode('my'); 
      } catch (err) {
          alert("Error forking project.");
      } finally {
          setForkingId(null);
      }
  };

  // --- LOGIC: SPLIT INVITES vs ACTIVE ---
  const myInvites = useMemo(() => {
    return projects.filter(p => p.myStatus === 'invited');
  }, [projects]);

  // Filter Active Projects for the Grid
  const processedProjects = useMemo(() => {
    const active = projects.filter(p => p.myStatus !== 'invited');

    return active
      .filter(p => {
         const searchLower = localSearch.toLowerCase();
         return p.title.toLowerCase().includes(searchLower) || 
                (p.description && p.description.toLowerCase().includes(searchLower));
      })
      .sort((a, b) => {
         if (sortBy === 'alpha') return a.title.localeCompare(b.title);
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
        alert("Project not found locally.");
    }
  };

  // --- ACCEPT INVITE HANDLER ---
  const handleAcceptInvite = async (proj) => {
      const memberRecord = proj.members?.[0]; 
      if (!memberRecord?.id) {
          alert("Error: Member ID missing.");
          return;
      }
      if(!confirm(`Accept invitation to join "${proj.title}"?`)) return;

      try {
          const res = await fetch('/api/members', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: memberRecord.id, status: 'active' })
          });
          if (!res.ok) throw new Error("Failed to join");
          if (onRefreshProjects) onRefreshProjects();
      } catch (e) { alert("Error accepting invite."); }
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
  
  // --- INTERACTION HANDLERS ---
  const handleLike = async (proj, e) => {
      e.stopPropagation();
      const wasLiked = proj.isLikedByMe;
      const newLikedState = !wasLiked;
      const newCount = (proj._count?.likes || 0) + (newLikedState ? 1 : -1);

      const updatedFeed = publicProjects.map(p => {
          if (p.id === proj.id) {
              return { ...p, isLikedByMe: newLikedState, _count: { ...p._count, likes: newCount } };
          }
          return p;
      });
      setPublicProjects(updatedFeed);

      try {
          await fetch('/api/projects/interact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projectId: proj.id, type: 'like' })
          });
      } catch (err) { console.error("Like failed"); }
  };

  const handleToggleComments = (projId, e) => {
      e.stopPropagation();
      if (openCommentsId === projId) {
          setOpenCommentsId(null);
      } else {
          setOpenCommentsId(projId);
          setCommentText("");
      }
  };

  const handleSubmitComment = async (projId, e) => {
      e.stopPropagation(); 
      if (!commentText.trim()) return;
      setCommentLoading(true);
      try {
          const res = await fetch('/api/projects/interact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projectId: projId, type: 'comment', text: commentText })
          });
          if (!res.ok) throw new Error("Failed to comment");
          const newComment = await res.json();
          setCurrentComments([newComment, ...currentComments]);
          const updatedFeed = publicProjects.map(p => 
              p.id === projId ? { ...p, _count: { ...p._count, comments: (p._count.comments || 0) + 1 } } : p
          );
          setPublicProjects(updatedFeed);
          setCommentText("");
      } catch (err) { alert("Failed to comment"); } 
      finally { setCommentLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-24 font-sans animate-in fade-in duration-700 transition-colors duration-300 relative" style={{ backgroundColor: theme.bg }}>
      
      {/* --- TOP RIGHT GLOBAL SEARCH --- */}
      <div ref={searchRef} className={`absolute top-6 right-6 z-50 flex items-center justify-end transition-all duration-300 ${isSearchOpen ? 'w-full max-w-md' : 'w-auto'}`}>
        <div 
            className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 shadow-sm border overflow-hidden ${isSearchOpen ? 'w-full ring-1 ring-gray-500/20' : 'w-auto hover:bg-white/5 bg-transparent border-transparent hover:border-gray-500/20 cursor-pointer'}`}
            style={{ borderColor: isSearchOpen ? theme.border : 'transparent', backgroundColor: isSearchOpen ? theme.cardBg : 'transparent' }}
            onClick={() => setIsSearchOpen(true)}
        >
            <Zap size={18} color={theme.textMuted} className="shrink-0" />
            {isSearchOpen ? (
                <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search across all projects..." className="bg-transparent border-none outline-none text-sm w-full min-w-[200px]" style={{ color: theme.textMain }} />
            ) : <span className="text-sm opacity-50 select-none hidden sm:block" style={{ color: theme.textMuted }}>Global Search</span>}
            {isSearchOpen && <div className="flex items-center gap-2 shrink-0"><Loader2 className={isSearching ? "animate-spin" : "hidden"} size={14} /><button onClick={(e) => { e.stopPropagation(); setSearchQuery(""); setIsSearchOpen(false); }}><X size={14} color={theme.textMuted}/></button></div>}
        </div>
        {/* Search Dropdown */}
        {isSearchOpen && searchResults && searchQuery && (
            <div className="absolute top-full right-0 w-full mt-2 rounded-xl border shadow-xl overflow-hidden max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                {['papers', 'tasks', 'experiments', 'datasets', 'artifacts'].map(cat => {
                    const items = searchResults[cat];
                    if (!items?.length) return null;
                    return (
                        <div key={cat} className="p-2 border-b last:border-0" style={{ borderColor: theme.border }}>
                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 px-2 mb-1">{cat}</div>
                            {items.map(item => (
                                <div key={item.id} onClick={() => handleResultClick(item)} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer text-sm transition-colors group">
                                    <div className="flex flex-col min-w-0 text-left">
                                        <span className="truncate font-medium" style={{color: theme.textMain}}>{cat === 'datasets' ? item.file?.name : item.title}</span>
                                        <span className="text-[10px] opacity-40 truncate" style={{ color: theme.textMuted }}>In: {projects.find(p => p.id === item.projectId)?.title || "Unknown"}</span>
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

      {/* --- HEADER --- */}
      <div className="w-full max-w-5xl px-6 mb-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-4" style={{ color: theme.textMain }}>Dashboard</h1>
          <div className="flex gap-6 border-b" style={{ borderColor: theme.border }}>
             <button onClick={() => setViewMode('my')} className={`pb-2 text-sm font-medium transition-colors border-b-2 ${viewMode === 'my' ? 'border-current' : 'border-transparent opacity-50'}`} style={{ color: viewMode === 'my' ? theme.accent : theme.textMain }}>My Projects</button>
             <button onClick={() => setViewMode('explore')} className={`pb-2 text-sm font-medium transition-colors border-b-2 ${viewMode === 'explore' ? 'border-current' : 'border-transparent opacity-50'}`} style={{ color: viewMode === 'explore' ? theme.accent : theme.textMain }}>Explore Public</button>
          </div>
        </div>

        {/* Local Filter Toolbar */}
        {viewMode === 'my' && (
            <div className="flex items-center gap-3 p-1 rounded-xl border" style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
                <div className="relative group flex items-center">
                    <Search size={14} className="absolute left-3 opacity-50" style={{ color: theme.textMuted }}/>
                    <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Filter..." className="pl-8 pr-3 py-1.5 text-sm bg-transparent outline-none w-40 focus:w-56 transition-all" style={{ color: theme.textMain }} />
                </div>
                <div className="h-4 w-[1px]" style={{ backgroundColor: theme.border }}></div>
                <div className="relative" ref={sortRef}>
                    <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-gray-500/10" style={{ color: theme.textMuted }}>
                        <ArrowUpDown size={12} /><span className="capitalize">{sortBy === 'created' ? 'Date' : 'Alpha'}</span>
                    </button>
                    {isSortOpen && (
                        <div className="absolute right-0 top-full mt-2 w-32 rounded-xl border shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                            {[{ id: 'created', label: 'Date' }, { id: 'alpha', label: 'Alpha' }].map(opt => (
                                <button key={opt.id} onClick={() => { setSortBy(opt.id); setIsSortOpen(false); }} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-500/10 transition-colors flex items-center justify-between" style={{ color: sortBy === opt.id ? theme.accent : theme.textMain }}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="w-full max-w-5xl px-6 pb-20 space-y-8">
        
        {/* INVITES SECTION */}
        {viewMode === 'my' && myInvites.length > 0 && (
            <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 animate-in slide-in-from-top-2">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: theme.warning }}><Bell size={16} /> Pending Invites ({myInvites.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myInvites.map(proj => (
                        <div key={proj.id} className="flex justify-between items-center p-4 rounded-lg border" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                            <div><h4 className="font-medium text-sm" style={{ color: theme.textMain }}>{proj.title}</h4><p className="text-xs opacity-50" style={{ color: theme.textMuted }}>Invitation pending.</p></div>
                            <button onClick={(e) => handleAcceptInvite(proj)} className="px-3 py-1.5 text-xs font-bold rounded text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: theme.accent }}>Accept</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* MY PROJECTS VIEW */}
          {viewMode === 'my' && (
            <>
                {!localSearch && (
                    <div onClick={onOpenCreateModal} className="group cursor-pointer rounded-xl border border-dashed flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/5 min-h-[220px]" style={{ borderColor: theme.border }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: theme.hover }}><Plus size={20} color={theme.textMuted} /></div>
                        <span className="text-sm font-medium" style={{ color: theme.textMuted }}>Create New Project</span>
                    </div>
                )}

                {processedProjects.map((proj) => (
                    <div 
                        key={proj.id}
                        onClick={() => onSelectProject(proj)} 
                        className={`group cursor-pointer rounded-xl p-0 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative ${activeMenuId === proj.id ? 'z-50' : 'z-0'}`}
                        style={{ backgroundColor: theme.bgSidebar || theme.cardBg, borderColor: theme.border }}
                    >
                        {/* Accent Bar (Rounded Top) */}
                        <div className="h-1.5 w-full rounded-t-xl" style={{ backgroundColor: theme.accent }}></div>
                        
                        <div className="p-6 h-full flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-md flex items-center justify-center border font-bold text-sm" style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.textMain }}>
                                    {proj.title.substring(0, 1).toUpperCase()}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {proj.isPublic && <Globe size={14} className="text-green-500" title="Publicly Visible"/>}
                                    <span className="text-[10px] opacity-40 font-mono" style={{ color: theme.textMuted }}>{new Date(proj.createdAt).toLocaleDateString()}</span>

                                    {/* OPTIONS MENU (EDIT/DELETE) */}
                                    {proj.myRole === 'OWNER' && (
                                        <div className="relative ml-1" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                onClick={(e) => handleMenuToggle(proj.id, e)}
                                                className="p-1.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                            
                                            {activeMenuId === proj.id && (
                                              <div 
                                              className="project-menu-popup absolute right-0 top-full mt-1 w-32 rounded-lg shadow-xl border overflow-hidden z-50 animate-in fade-in zoom-in-95" 
                                              style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
                                              onClick={(e) => e.stopPropagation()}
                                              >
                                                <button
                                                onClick={(e) => { 
                                                  e.stopPropagation(); 
                                                  setActiveMenuId(null); 
                                                  onEdit(proj); 
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                                                style={{ color: theme.textMain }}
                                                >
                                                  <Pencil size={12}/> Edit
                                                  </button>
                                                  <button
                                                  onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setActiveMenuId(null);
                                                    onDelete(proj.id); 
                                                  }}
                                                  className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 text-red-500 transition-colors flex items-center gap-2"
                                                  >
                                                    <Trash2 size={12}/> Delete
                                                    </button>
                                                    </div>
                                                  )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-base font-medium mb-2 truncate" style={{ color: theme.textMain }}>{proj.title}</h3>
                            <p className="text-xs leading-relaxed mb-8 flex-1 line-clamp-3 opacity-80" style={{ color: theme.textMuted }}>{proj.description || "No description provided."}</p>
                            <div className="flex items-center gap-2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-auto" style={{ color: proj.color || theme.accent }}>
                                Open Project <ArrowRight size={12} />
                            </div>
                        </div>
                    </div>
                ))}
            </>
          )}

          {/* EXPLORE VIEW (SOCIAL FEED) */}
          {viewMode === 'explore' && (
             <>
                {exploreLoading ? (
                    <div className="col-span-full py-20 text-center opacity-50 flex flex-col items-center gap-3"><Loader2 className="animate-spin" size={24} /><span className="text-xs">Fetching feed...</span></div>
                ) : (
                    <div className="max-w-2xl mx-auto space-y-8 w-full col-span-full">
                        {publicProjects.map((proj, index) => (
                          <div key={`${proj.id}-${index}`} className="flex flex-col rounded-xl border overflow-hidden transition-all hover:shadow-lg" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
                            {/* Top Section: Header + Text */}
                            <div className="p-6 border-b shrink-0" style={{ borderColor: theme.border }}>
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  {/* --- UPDATED AVATAR WITH LINK --- */}
                                  <div 
                                  className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"style={{ backgroundColor: theme.accent }}
                                  onClick={(e) => {
                                    e.stopPropagation(); 
                                    if (proj.owner?.id) {
        window.location.href = `/profile/${proj.owner.id}`; 
    } else {
        console.warn("Owner ID missing for project:", proj.id);
    }
  }}
                                  >
                                    {proj.owner?.image ? (
                                      <img src={proj.owner.image} alt={proj.owner.name} className="w-full h-full object-cover" />
                                    ) : (
                                      proj.owner?.name?.[0]?.toUpperCase() || "U"
                                      )}
                                      </div>
                                      {/* -------------------------------- */}
                                      <div>
                                        {/* Correctly displaying Heading if available, else Title */}
                        <h3 className="font-bold text-base" style={{ color: theme.textMain }}>{proj.postHeading || proj.title}</h3>
                        <p className="text-xs opacity-60" style={{ color: theme.textMuted }}>{proj.owner?.name} • {new Date(proj.publishedAt || proj.updatedAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <button onClick={() => onSelectProject(proj)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border hover:bg-white/5 transition-colors" style={{ borderColor: theme.border, color: theme.textMain }}>View <ArrowRight size={12}/></button>
            </div>
            
            {/* Correctly displaying Summary if available, else Description */}
            <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap" style={{ color: theme.textMain }}>{proj.postSummary || proj.description}</p>
            
            <div className="flex flex-wrap gap-2">
  {(proj.tags || []).map((tag, i) => (
    <span 
      key={i} 
      className="text-xs px-2 py-1 rounded-md"
      style={{ 
        backgroundColor: theme.accent + '20', // Adds 20% opacity to your accent color
        color: theme.accent 
      }}
    >
      #{tag.replace('#','')}
    </span>
  ))}
</div>
        </div>

        {/* --- MODIFIED: SINGLE IMAGE SECTION --- */}
        {proj.artifacts && proj.artifacts.length > 0 && (
            <div 
                className="h-64 w-full shrink-0 bg-gray-900 cursor-pointer border-b overflow-hidden relative group" 
                style={{ borderColor: theme.border }} 
                onClick={() => onSelectProject(proj)}
            >
                <img 
                    src={proj.artifacts[0].url} 
                    alt="Project Artifact" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                
                {/* Optional: Badge if there are more images inside */}
                {proj.artifacts.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
                        + {proj.artifacts.length - 1} more
                    </div>
                )}
            </div>
        )}
        {/* --------------------------------------- */}
        
        {/* Footer Actions */}
        {/* FIX 3: Added 'mt-auto' to push footer to the very bottom */}
        <div className="p-4 flex items-center gap-6 text-xs border-t mt-auto relative bg-inherit" style={{ color: theme.textMuted, borderColor: theme.border }}>
            <button onClick={(e) => handleLike(proj, e)} className={`flex items-center gap-2 transition-colors group ${proj.isLikedByMe ? 'text-red-500' : 'hover:text-red-500'}`}><div className={`p-1.5 rounded-full transition-colors ${proj.isLikedByMe ? 'bg-red-500/10' : 'group-hover:bg-red-500/10'}`}><CheckCircle2 size={16} className={proj.isLikedByMe ? "fill-current" : ""} /></div>{proj._count?.likes || 0} Likes</button>
            <button onClick={(e) => handleToggleComments(proj.id, e)} className={`flex items-center gap-2 transition-colors group ${openCommentsId === proj.id ? 'text-blue-500' : 'hover:text-blue-500'}`}><div className={`p-1.5 rounded-full transition-colors ${openCommentsId === proj.id ? 'bg-blue-500/10' : 'group-hover:bg-blue-500/10'}`}><FileText size={16} /></div>{proj._count?.comments || 0} Comments</button>
            <button onClick={(e) => handleForkProject(proj, e)} disabled={forkingId === proj.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border hover:bg-white/5 transition-colors disabled:opacity-50 ml-auto" style={{ borderColor: theme.border, color: theme.textMain }}>{forkingId === proj.id ? <Loader2 size={14} className="animate-spin"/> : <Share2 size={14} />}<span className="font-medium">{forkingId === proj.id ? "Forking..." : "Fork"}</span></button>
        </div>

        {/* Comments Section */}
        {openCommentsId === proj.id && (
            <div className="border-t p-4 shrink-0" style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}>
                <div className="max-h-48 overflow-y-auto mb-3 custom-scrollbar space-y-3">
                    {fetchingComments ? <div className="text-center py-4 opacity-50 flex items-center justify-center gap-2"><Loader2 size={12} className="animate-spin"/> Loading...</div> : currentComments.length === 0 ? <div className="text-center py-4 opacity-50 text-xs">No comments yet.</div> : currentComments.map(c => (
                        <div key={c.id} className="flex gap-2 items-start"><div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[9px] font-bold text-white shrink-0">{c.user?.name?.[0] || "?"}</div><div className="flex-1 min-w-0"><div className="flex items-baseline gap-2"><span className="text-xs font-bold" style={{ color: theme.textMain }}>{c.user?.name}</span><span className="text-[9px] opacity-40">{new Date(c.createdAt).toLocaleDateString()}</span></div><p className="text-xs mt-0.5" style={{ color: theme.textMain }}>{c.text}</p></div></div>
                    ))}
                </div>
                <div className="flex gap-2 pt-2 border-t" style={{ borderColor: theme.border }} onClick={(e) => e.stopPropagation()}>
                    <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="flex-1 bg-transparent border rounded px-3 py-2 text-xs outline-none focus:ring-1 transition-all" style={{ borderColor: theme.border, color: theme.textMain, '--tw-ring-color': theme.accent }} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(proj.id, e); }}}/>
                    <button onClick={(e) => handleSubmitComment(proj.id, e)} disabled={!commentText.trim() || commentLoading} className="px-3 py-1 rounded text-white text-xs font-bold disabled:opacity-50 transition-opacity" style={{ backgroundColor: theme.accent }}>{commentLoading ? <Loader2 size={12} className="animate-spin"/> : "Post"}</button>
                </div>
            </div>
        )}
    </div>
))}
{/* --- NEW: Invisible Trigger for Infinite Scroll --- */}
<div ref={observerRef} className="h-10 w-full transparent pointer-events-none" />
                    </div>
                )}
             </>
          )}
        </div>
      </div>

      {/* --- FLOATING SETTINGS MENU (FIXED) --- */}
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
                {/* Add inside the Settings Popup Menu in ProjectSelectionScreen */}
                <button 
                onClick={() => window.location.href = '/profile'} 
                className="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors text-left"
                style={{ color: theme.textMain }}
                >
                  <UserIcon size={14} />
                  <span>My Profile</span>
                  </button> 
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
 * SUB-COMPONENT: SIDEBAR (Updated with Permissions & Project Settings)
 */
const Sidebar = ({ activeTab, setActiveTab, projectName, projectColor, onLogout, onOpenSettings, permissions }) => {
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
        {/* Workspace Switcher / Header */}
        <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-3 w-full">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: projectColor || theme.accent }}
            >
              {projectName ? projectName.substring(0,1) : 'N'}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium tracking-tight truncate" style={{ color: theme.textMain }}>
                  {projectName || 'Neuro Lab'}
                </span>
                {/* Role Badge */}
                <span className="text-[9px] opacity-50 uppercase tracking-wider font-bold" style={{ color: theme.textMuted }}>
                    {permissions?.isOwner ? 'Owner' : 'Member'}
                </span>
            </div>
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
                    
                    {/* NEW: Manage Project Button (Only if allowed) */}
                    {(permissions?.canManageTeam || permissions?.isOwner) && (
                        <button 
                            onClick={() => { onOpenSettings(); setShowSettings(false); }}
                            className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-2"
                            style={{ color: theme.textMain, ':hover': { backgroundColor: theme.hover } }}
                        >
                            <Users size={14} /> Manage Project
                        </button>
                    )}

                    <button 
                        onClick={() => { setShowPasswordModal(true); setShowSettings(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-2"
                        style={{ color: theme.textMain, ':hover': { backgroundColor: theme.hover } }}
                    >
                        <Key size={14}/> Change Password
                    </button>
                    
                    <div className="h-px w-full" style={{ backgroundColor: theme.border }}></div>
                    
                    <button 
                        onClick={onLogout} 
                        className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-2 text-red-500 hover:bg-red-500/10"
                    >
                        <LogOut size={14}/> Close Project
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
 * COMPONENT: LITERATURE MANAGER (With Filtering, Sorting & "Swap on Hover" UI)
 */
const LiteratureManager = ({ project, permissions }) => {
  const { theme } = useTheme();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Sorting & Filtering State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'include', 'exclude', 'unsure'
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'title', 'authors', 'year'

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);

  // --- PERMISSION CHECK ---
  const canEdit = permissions?.canEditLit || permissions?.isOwner;

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

  // --- Logic Engine for Filtering & Sorting ---
  const processedPapers = useMemo(() => {
    let result = [...papers];

    // 1. Filter by Status
    if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus);
    }

    // 2. Filter by Search (Title or Authors)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        (p.authors && p.authors.toLowerCase().includes(q))
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title); // A-Z
        case 'authors':
          return (a.authors || "").localeCompare(b.authors || ""); // A-Z
        case 'year':
          return (b.year || 0) - (a.year || 0); // Newest Year First
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest Added First
      }
    });

    return result;
  }, [papers, filterStatus, searchQuery, sortBy]);
  
  // 2. Save (Create/Update)
  const handleSavePaper = async (e) => {
    e.preventDefault();
    if (!canEdit) return; // Permission guard

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
    if (!canEdit) return; // Permission guard
    setEditingPaper(paper);
    setIsModalOpen(true);
  };

  // 4. Delete Handler
  const handleDelete = async (id) => {
    if (!canEdit) return; // Permission guard
    if (!confirm("Are you sure?")) return;
    setPapers(papers.filter(p => p.id !== id));
    await fetch(`/api/papers?id=${id}`, { method: 'DELETE' });
  };

  // 5. Status Handler
  const handleStatusChange = async (id, newStatus) => {
    if (!canEdit) return; // Permission guard
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
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-medium mb-2" style={{ color: theme.textMain }}>Literature Review</h2>
          <div className="flex gap-4 text-xs font-mono" style={{ color: theme.textMuted }}>
            <span>TOTAL: {stats.total}</span>
            <span style={{ color: theme.success }}>INCLUDED: {stats.included}</span>
            <span style={{ color: theme.danger }}>EXCLUDED: {stats.excluded}</span>
          </div>
        </div>
        
        {/* ADD BUTTON (Hidden if no permission) */}
        {canEdit && (
            <button 
            onClick={() => { setEditingPaper(null); setIsModalOpen(true); }}
            className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: theme.accent, color: '#FFF' }}
            >
            <Plus size={14} /> Add Paper
            </button>
        )}
      </div>

      {/* --- FILTER & SORT TOOLBAR --- */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 p-1">
        
        {/* Search Bar */}
        <div className="relative flex-1 group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: theme.textMuted }} />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title or author..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-transparent outline-none focus:ring-1 transition-all"
            style={{ borderColor: theme.border, color: theme.textMain, '--tw-ring-color': theme.accent }}
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-2">
           {/* Filter Dropdown */}
           <div className="relative">
             <select
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
               className="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-lg border bg-transparent outline-none cursor-pointer hover:bg-white/5 transition-colors"
               style={{ borderColor: theme.border, color: theme.textMain }}
             >
               <option value="all">All Status</option>
               <option value="include">Included</option>
               <option value="exclude">Excluded</option>
               <option value="unsure">Unsure</option>
             </select>
             <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: theme.textMuted }}/>
           </div>

           {/* Sort Dropdown */}
           <div className="relative">
             <select
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value)}
               className="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-lg border bg-transparent outline-none cursor-pointer hover:bg-white/5 transition-colors"
               style={{ borderColor: theme.border, color: theme.textMain }}
             >
               <option value="newest">Newest Added</option>
               <option value="title">Title (A-Z)</option>
               <option value="authors">Author (A-Z)</option>
               <option value="year">Year (Desc)</option>
             </select>
             <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: theme.textMuted }}/>
           </div>
        </div>
      </div>

      {/* PAPERS LIST */}
      <div className="space-y-3">
        {loading ? <div className="text-sm opacity-50">Loading papers...</div> : processedPapers.map((paper) => (
          <div 
            key={paper.id}
            className="group p-4 rounded-lg border transition-all hover:shadow-sm flex gap-4 relative pr-20"
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

              {/* Status Toggles (Disabled style if no permission) */}
              <div className={`flex gap-2 transition-opacity ${canEdit ? 'opacity-40 group-hover:opacity-100' : 'opacity-20 pointer-events-none'}`}>
                <button onClick={() => handleStatusChange(paper.id, 'include')} title="Include" className={`p-1.5 rounded ${paper.status === 'include' ? 'bg-green-500 text-white' : 'hover:bg-green-500/10 text-green-500'}`}><Check size={14} /></button>
                <button onClick={() => handleStatusChange(paper.id, 'exclude')} title="Exclude" className={`p-1.5 rounded ${paper.status === 'exclude' ? 'bg-red-500 text-white' : 'hover:bg-red-500/10 text-red-500'}`}><X size={14} /></button>
                <button onClick={() => handleStatusChange(paper.id, 'unsure')} title="Unsure" className={`p-1.5 rounded ${paper.status === 'unsure' ? 'bg-yellow-500 text-white' : 'hover:bg-yellow-500/10 text-yellow-500'}`}><AlertCircle size={14} /></button>
              </div>
            </div>

            {/* --- TOP RIGHT CORNER (SWAP ZONE) --- */}
            
            {/* 1. THE YEAR BADGE (Visible by default, Hidden on Hover only if Editable) */}
            <div className={`absolute top-4 right-4 transition-opacity duration-200 ${canEdit ? 'opacity-100 group-hover:opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <span className="text-[10px] font-mono border px-1.5 py-0.5 rounded" style={{ borderColor: theme.border, color: theme.textMuted }}>
                  {paper.year || "N/A"}
                </span>
            </div>

            {/* 2. THE ACTION BUTTONS (Hidden by default, Visible on Hover) - Only if Editable */}
            {canEdit && (
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
            )}

          </div>
        ))}

        {!loading && processedPapers.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-xl" style={{ borderColor: theme.border }}>
            <p style={{ color: theme.textMuted }}>No papers found matching criteria.</p>
          </div>
        )}
      </div>

      {/* MODAL (Render only if permission exists) */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border shadow-2xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h3 className="text-lg font-medium mb-4" style={{ color: theme.textMain }}>
                {editingPaper ? "Edit Paper" : "Add New Paper"}
            </h3>
            <form onSubmit={handleSavePaper} className="space-y-4">
              <input name="title" defaultValue={editingPaper?.title} placeholder="Paper Title" required className="w-full p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border, color: theme.textMain }} />
              <input name="authors" defaultValue={editingPaper?.authors} placeholder="Authors" required className="w-full p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border, color: theme.textMain }} />
              <div className="flex gap-4">
                <input name="year" defaultValue={editingPaper?.year} placeholder="Year" type="number" className="w-1/3 p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border, color: theme.textMain }} />
                <input name="doi" defaultValue={editingPaper?.doi} placeholder="DOI" className="flex-1 p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border, color: theme.textMain }} />
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
 * COMPONENT: DATASET REGISTRY (With Search, Filtering & Permissions)
 */
const DatasetRegistry = ({ project, permissions }) => {
  const { theme } = useTheme();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Filter & Sort State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPII, setFilterPII] = useState("all"); 
  const [filterType, setFilterType] = useState("all"); 
  const [sortBy, setSortBy] = useState("newest"); 

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); 
  const [uploading, setUploading] = useState(false);
  const [editingDataset, setEditingDataset] = useState(null);
  const [showReplaceFile, setShowReplaceFile] = useState(false);

  // --- PERMISSION CHECK ---
  const canEdit = permissions?.canEditData || permissions?.isOwner;

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

  // --- Logic Engine ---
  const processedDatasets = useMemo(() => {
    let result = [...datasets];

    // 1. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ds => 
        (ds.file?.name || "").toLowerCase().includes(q) ||
        (ds.description || "").toLowerCase().includes(q) ||
        (ds.license || "").toLowerCase().includes(q)
      );
    }

    // 2. Filter by PII Status
    if (filterPII !== 'all') {
      const isPII = filterPII === 'pii';
      result = result.filter(ds => ds.piiFlag === isPII);
    }

    // 3. Filter by Type
    if (filterType !== 'all') {
      result = result.filter(ds => {
        const isFile = ds.file?.url?.includes('cloudinary');
        return filterType === 'file' ? isFile : !isFile;
      });
    }

    // 4. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.file?.name || "").localeCompare(b.file?.name || "");
        case 'license':
          return (a.license || "").localeCompare(b.license || "");
        case 'newest':
        default:
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
    });

    return result;
  }, [datasets, searchQuery, filterPII, filterType, sortBy]);

  // 2. Handle Save (Create OR Edit)
  const handleSaveDataset = async (e) => {
    e.preventDefault();
    if (!canEdit) return; // Permission guard
    setUploading(true);
    
    const formData = new FormData(e.target);
    
    if (!editingDataset) {
        formData.append('projectId', project.id);
        formData.append('type', uploadMode); 
    } else {
        formData.append('id', editingDataset.id);
        if (!showReplaceFile && uploadMode === 'file') {
            formData.delete('file'); 
        }
    }

    try {
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
    if (!canEdit) return; // Permission guard
    if (!confirm("Remove this dataset?")) return;
    setDatasets(datasets.filter(d => d.id !== id));
    await fetch(`/api/datasets?id=${id}`, { method: 'DELETE' });
  };

  // 4. Open Edit Modal
  const handleEditClick = (ds) => {
    if (!canEdit) return; // Permission guard
    setEditingDataset(ds);
    setUploadMode(ds.file?.url?.includes('cloudinary') ? 'file' : 'link');
    setShowReplaceFile(false); 
    setIsModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-medium mb-2" style={{ color: theme.textMain }}>Data Registry</h2>
          <p className="text-xs max-w-lg" style={{ color: theme.textMuted }}>
             Upload datasets (auto-PII scan) or link external resources.
          </p>
        </div>
        
        {/* ADD BUTTON (Hidden if no permission) */}
        {canEdit && (
            <button 
            onClick={() => { setEditingDataset(null); setUploadMode('file'); setIsModalOpen(true); }}
            className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: theme.accent, color: '#FFF' }}
            >
            <Plus size={14} /> Register Data
            </button>
        )}
      </div>

      {/* --- FILTER & SORT TOOLBAR --- */}
      <div className="flex flex-col xl:flex-row gap-3 mb-6 p-1">
        {/* Search Bar */}
        <div className="relative flex-1 group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: theme.textMuted }} />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, description, license..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-transparent outline-none focus:ring-1 transition-all"
            style={{ borderColor: theme.border, color: theme.textMain, '--tw-ring-color': theme.accent }}
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0">
           {/* PII Filter */}
           <div className="relative shrink-0">
             <select
               value={filterPII}
               onChange={(e) => setFilterPII(e.target.value)}
               className="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-lg border bg-transparent outline-none cursor-pointer hover:bg-white/5 transition-colors"
               style={{ borderColor: theme.border, color: theme.textMain }}
             >
               <option value="all">All Safety</option>
               <option value="pii">PII Detected</option>
               <option value="safe">Safe Only</option>
             </select>
             <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: theme.textMuted }}/>
           </div>

           {/* Type Filter */}
           <div className="relative shrink-0">
             <select
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-lg border bg-transparent outline-none cursor-pointer hover:bg-white/5 transition-colors"
               style={{ borderColor: theme.border, color: theme.textMain }}
             >
               <option value="all">All Types</option>
               <option value="file">Uploaded (CSV)</option>
               <option value="link">External Link</option>
             </select>
             <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: theme.textMuted }}/>
           </div>

           {/* Sort Dropdown */}
           <div className="relative shrink-0">
             <select
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value)}
               className="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-lg border bg-transparent outline-none cursor-pointer hover:bg-white/5 transition-colors"
               style={{ borderColor: theme.border, color: theme.textMain }}
             >
               <option value="newest">Newest</option>
               <option value="name">Name (A-Z)</option>
               <option value="license">License (A-Z)</option>
             </select>
             <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: theme.textMuted }}/>
           </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <div className="text-sm opacity-50">Loading data...</div> : processedDatasets.map((ds) => (
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

            {/* EDIT/DELETE ACTIONS (Hidden if no permission) */}
            {canEdit && (
                <div className="absolute top-4 right-4 flex gap-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                    <button onClick={() => handleEditClick(ds)} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(ds.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={14} /></button>
                </div>
            )}

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
        {!loading && processedDatasets.length === 0 && (
            <div className="text-center py-12 border border-dashed rounded-xl col-span-1 md:col-span-2" style={{ borderColor: theme.border }}>
                <p style={{ color: theme.textMuted }}>No datasets found.</p>
            </div>
        )}
      </div>

      {/* MODAL (Rendered conditionally based on permission) */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border shadow-2xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h3 className="text-lg font-medium mb-4" style={{ color: theme.textMain }}>
                {editingDataset ? "Edit Dataset" : "Add Data"}
            </h3>
            
            {/* Show Tabs */}
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
 * COMPONENT: EXPERIMENTS (Updated with Permissions)
 */
const Experiments = ({ project, permissions }) => {
  const { theme } = useTheme();
  const [experiments, setExperiments] = useState([]);
  const [selectedExp, setSelectedExp] = useState(null);
  
  // --- UI STATE: Layout ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- UI STATE: Study List Controls ---
  const [studySearch, setStudySearch] = useState("");
  const [studyFilter, setStudyFilter] = useState("all"); 
  const [studySort, setStudySort] = useState("newest"); 

  // --- UI STATE: Log List Controls ---
  const [logSearch, setLogSearch] = useState("");
  const [logFilterType, setLogFilterType] = useState("all"); 
  const [logShowEvidenceOnly, setLogShowEvidenceOnly] = useState(false);
  const [logSort, setLogSort] = useState("newest"); 

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingStudy, setIsEditingStudy] = useState(false); 
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

  // --- PERMISSION CHECK ---
  const canEdit = permissions?.canEditExps || permissions?.isOwner;

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

  // --- LOGIC: Processed Studies ---
  const processedStudies = useMemo(() => {
    let result = [...experiments];
    if (studySearch.trim()) result = result.filter(e => e.title.toLowerCase().includes(studySearch.toLowerCase()));
    if (studyFilter !== 'all') result = result.filter(e => e.status === studyFilter);
    result.sort((a, b) => {
        switch (studySort) {
            case 'alpha': return a.title.localeCompare(b.title);
            case 'logs': return (b.logs?.length || 0) - (a.logs?.length || 0);
            case 'newest': default: return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        }
    });
    return result;
  }, [experiments, studySearch, studyFilter, studySort]);

  // --- LOGIC: Processed Logs ---
  const processedLogs = useMemo(() => {
    if (!selectedExp?.logs) return [];
    let result = [...selectedExp.logs];
    if (logSearch.trim()) result = result.filter(l => l.message.toLowerCase().includes(logSearch.toLowerCase()));
    if (logFilterType !== 'all') result = result.filter(l => l.type === logFilterType);
    if (logShowEvidenceOnly) result = result.filter(l => l.hasEvidence);
    result.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        switch (logSort) {
            case 'alpha': return a.message.localeCompare(b.message);
            case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'newest': default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });
    return result;
  }, [selectedExp, logSearch, logFilterType, logShowEvidenceOnly, logSort]);


  // --- EXPERIMENT HANDLERS ---

  const handleSaveExp = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
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
            const res = await fetch('/api/experiments', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: selectedExp.id, ...payload })
            });
            const updated = await res.json();
            const fullUpdated = { ...selectedExp, ...updated, logs: selectedExp.logs };
            setSelectedExp(fullUpdated);
            setExperiments(experiments.map(ex => ex.id === fullUpdated.id ? fullUpdated : ex));
        } else {
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
    if (!canEdit) return;
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
    if (!canEdit) return;
    if (!confirm("Delete this study?")) return;
    setExperiments(experiments.filter(e => e.id !== id));
    if (selectedExp?.id === id) setSelectedExp(null);
    await fetch(`/api/experiments?id=${id}`, { method: 'DELETE' });
  };

  const openEditStudyModal = () => {
    if (!canEdit) return;
    setIsEditingStudy(true);
    setIsModalOpen(true);
  };

  // --- LOG HANDLERS ---

  const handleAddLog = async () => {
    if (!selectedExp || !logMsg.trim() || !canEdit) return;
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

  const startEditLog = (log) => {
    if (!canEdit) return;
    setEditingLogId(log.id);
    setEditLogText(log.message);
  };

  const saveLogEdit = async () => {
    if (!editLogText.trim() || !canEdit) return;
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
    if (!canEdit) return;
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
    if (!canEdit) return;
    if(!confirm("Delete log?")) return;
    const updatedLogs = selectedExp.logs.filter(l => l.id !== logId);
    setSelectedExp({ ...selectedExp, logs: updatedLogs });
    await fetch(`/api/experiments/logs?id=${logId}`, { method: 'DELETE' });
  };

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

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in">
      
      {/* LEFT COL: Studies List (Collapsible) */}
      <div 
        className={`flex flex-col gap-4 border-r shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-80 pr-4' : 'w-20 items-center'}`} 
        style={{ borderColor: theme.border }}
      >
        <div className="flex justify-between items-center">
          {isSidebarOpen && <h2 className="text-lg font-medium" style={{ color: theme.textMain }}>Studies</h2>}
          <div className="flex items-center gap-1">
             {/* HIDE ADD BUTTON */}
             {isSidebarOpen && canEdit && (
                <button onClick={() => { setIsEditingStudy(false); setIsModalOpen(true); }} className="p-1.5 rounded hover:bg-white/5 transition-colors">
                    <Plus size={18} color={theme.accent} />
                </button>
             )}
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded hover:bg-white/5 transition-colors" title={isSidebarOpen ? "Collapse" : "Expand"}>
                {isSidebarOpen ? <ChevronRight size={18} className="rotate-180" color={theme.textMuted}/> : <ChevronRight size={18} color={theme.textMuted}/>}
             </button>
          </div>
        </div>

        {/* STUDY FILTERS (Only visible if expanded) */}
        {isSidebarOpen && (
            <div className="flex flex-col gap-2 p-1">
                {/* Search */}
                <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" style={{ color: theme.textMuted }} />
                    <input 
                        value={studySearch}
                        onChange={(e) => setStudySearch(e.target.value)}
                        placeholder="Search studies..."
                        className="w-full pl-8 pr-2 py-1.5 text-xs rounded border bg-transparent outline-none focus:ring-1"
                        style={{ borderColor: theme.border, color: theme.textMain, '--tw-ring-color': theme.accent }}
                    />
                </div>
                {/* Filter & Sort Row */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <select 
                            value={studyFilter}
                            onChange={(e) => setStudyFilter(e.target.value)}
                            className="w-full appearance-none pl-2 pr-6 py-1.5 text-[10px] font-medium rounded border bg-transparent outline-none cursor-pointer"
                            style={{ borderColor: theme.border, color: theme.textMain }}
                        >
                            <option value="all">All Status</option>
                            <option value="planned">Planned</option>
                            <option value="running">Running</option>
                            <option value="completed">Done</option>
                            <option value="abandoned">Archived</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" style={{ color: theme.textMuted }}/>
                    </div>
                    <div className="relative flex-1">
                        <select 
                            value={studySort}
                            onChange={(e) => setStudySort(e.target.value)}
                            className="w-full appearance-none pl-2 pr-6 py-1.5 text-[10px] font-medium rounded border bg-transparent outline-none cursor-pointer"
                            style={{ borderColor: theme.border, color: theme.textMain }}
                        >
                            <option value="newest">Newest</option>
                            <option value="alpha">A-Z</option>
                            <option value="logs">Most Logs</option>
                        </select>
                        <ArrowUpDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" style={{ color: theme.textMuted }}/>
                    </div>
                </div>
            </div>
        )}

        {/* THE LIST */}
        <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          {processedStudies.map(exp => {
            const isSelected = selectedExp?.id === exp.id;
            const statusStyle = getStatusStyle(exp.status);
            
            if (!isSidebarOpen) {
                return (
                    <div 
                        key={exp.id}
                        onClick={() => { setIsSidebarOpen(true); setSelectedExp(exp); }}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer mx-auto transition-all ${isSelected ? 'shadow-md' : 'opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: statusStyle.bg, borderColor: isSelected ? theme.accent : statusStyle.border, color: statusStyle.color }}
                        title={exp.title}
                    >
                        {exp.title.substring(0,1).toUpperCase()}
                    </div>
                );
            }

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
                    {/* HIDE DELETE */}
                    {canEdit && (
                        <button onClick={(e) => handleDeleteExp(exp.id, e)} className="opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-red-500/10 rounded transition-opacity">
                            <Trash2 size={12}/>
                        </button>
                    )}
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
          
          {isSidebarOpen && processedStudies.length === 0 && (
              <div className="text-center py-8 opacity-50 text-xs" style={{ color: theme.textMuted }}>No studies found.</div>
          )}
        </div>
      </div>

      {/* RIGHT COL: Workbench */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        {selectedExp ? (
          <div className="pr-2"> 
            {/* EXPERIMENT HEADER */}
            <div className="mb-4 p-6 rounded-xl border relative" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3 flex-1 mr-4">
                    <h1 className="text-xl font-bold" style={{ color: theme.textMain }}>{selectedExp.title}</h1>
                    {/* HIDE EDIT */}
                    {canEdit && (
                        <button onClick={openEditStudyModal} className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                            <Pencil size={14} />
                        </button>
                    )}
                </div>
                <div className="relative">
                    {/* DISABLE STATUS */}
                    <select 
                        disabled={!canEdit}
                        value={selectedExp.status}
                        onChange={(e) => handleUpdateStatus(selectedExp.id, { status: e.target.value })}
                        className={`appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded border bg-transparent outline-none hover:bg-white/5 transition-colors ${!canEdit ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
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
                 {/* READ-ONLY CONCLUSION */}
                 <input 
                    disabled={!canEdit}
                    className={`w-full bg-transparent text-sm outline-none placeholder:opacity-30 transition-all focus:pl-2 ${!canEdit ? 'cursor-not-allowed' : ''}`}
                    style={{ color: theme.textMain }}
                    placeholder={canEdit ? "Enter final takeaway..." : "No conclusion yet."}
                    defaultValue={selectedExp.conclusion}
                    onBlur={(e) => handleUpdateStatus(selectedExp.id, { conclusion: e.target.value })}
                 />
              </div>
            </div>

            {/* LOG TOOLBAR */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 pb-2 border-b" style={{ borderColor: theme.border }}>
                <div className="relative flex-1 w-full">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" style={{ color: theme.textMuted }} />
                    <input 
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        placeholder="Search logs..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded border bg-transparent outline-none focus:ring-1"
                        style={{ borderColor: theme.border, color: theme.textMain, '--tw-ring-color': theme.accent }}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <select
                        value={logFilterType}
                        onChange={(e) => setLogFilterType(e.target.value)}
                        className="appearance-none pl-2 pr-6 py-1.5 text-[10px] font-medium rounded border bg-transparent outline-none cursor-pointer"
                        style={{ borderColor: theme.border, color: theme.textMain }}
                    >
                        <option value="all">All Types</option>
                        <option value="note">Notes</option>
                        <option value="result">Results</option>
                        <option value="decision">Decisions</option>
                        <option value="bug">Bugs</option>
                    </select>
                    <select
                        value={logSort}
                        onChange={(e) => setLogSort(e.target.value)}
                        className="appearance-none pl-2 pr-6 py-1.5 text-[10px] font-medium rounded border bg-transparent outline-none cursor-pointer"
                        style={{ borderColor: theme.border, color: theme.textMain }}
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="alpha">A-Z</option>
                    </select>
                    <button 
                        onClick={() => setLogShowEvidenceOnly(!logShowEvidenceOnly)}
                        className={`px-2 py-1.5 text-[10px] font-medium rounded border transition-colors flex items-center gap-1 whitespace-nowrap ${logShowEvidenceOnly ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'hover:bg-white/5'}`}
                        style={{ borderColor: logShowEvidenceOnly ? undefined : theme.border, color: logShowEvidenceOnly ? undefined : theme.textMuted }}
                    >
                        {logShowEvidenceOnly ? <CheckCircle2 size={10}/> : <div className="w-2.5 h-2.5 rounded-full border border-current opacity-50" />}
                        Has Evidence
                    </button>
                </div>
            </div>

            {/* LOG INPUT - CONDITIONAL RENDER */}
            {canEdit ? (
                <div className="flex flex-col gap-3 mb-4 p-4 rounded-xl border" style={{ borderColor: theme.border, backgroundColor: theme.bg }}>
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
            ) : (
                <div className="mb-4 p-4 rounded-xl border border-dashed text-center text-xs opacity-50" style={{ borderColor: theme.border, color: theme.textMuted }}>
                    Read-only mode. You cannot add logs.
                </div>
            )}

            {/* TIMELINE FEED */}
            <div className="space-y-4 pl-2 pr-2 pb-10">
              {processedLogs.map((log) => {
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
                            
                            {/* EDIT AREA */}
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

                        {/* ACTIONS (HIDE IF NO PERMISSION) */}
                        {canEdit && editingLogId !== log.id && (
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
              {processedLogs.length === 0 && <div className="text-center py-10 opacity-50 text-xs">No logs found.</div>}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
            <FlaskConical size={48} />
            <p>Select a study to view the notebook</p>
          </div>
        )}
      </div>

      {/* SHARED MODAL (Create + Edit) */}
      {isModalOpen && canEdit && (
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
 * COMPONENT: ARTIFACTS (With Filtering, Sorting & Search)
 */
const Artifacts = ({ project, permissions }) => {
  const { theme } = useTheme();
  // PERMISSION CHECK
  const canEdit = permissions?.canEditArtifacts || permissions?.isOwner;
  const [artifacts, setArtifacts] = useState([]);
  
  // --- NEW: Filter & Sort State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'image', 'chart', 'heatmap', 'file'
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'alpha'

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null); // For Viewing
  const [editingArtifact, setEditingArtifact] = useState(null);   // For Editing
  
  // Upload State
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'link'
  const [showReplace, setShowReplace] = useState(false); // For Edit Mode
  const [loading, setLoading] = useState(false);
  const [stagedFile, setStagedFile] = useState(null);

  // 1. Fetch
  useEffect(() => {
    if (project?.id) {
      fetch(`/api/artifacts?projectId=${project.id}`)
        .then(res => {
            if (!res.ok) return [];
            return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setArtifacts(data);
        })
        .catch(err => console.error("Failed to load artifacts:", err));
    }
  }, [project]);

  // --- NEW: Logic Engine ---
  const processedArtifacts = useMemo(() => {
    let result = [...artifacts];

    // 1. Search (Title, Subtitle)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) || 
        (a.subtitle || "").toLowerCase().includes(q)
      );
    }

    // 2. Filter by Type
    if (filterType !== 'all') {
      result = result.filter(a => a.type === filterType);
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortBy === 'alpha') return a.title.localeCompare(b.title);
      // Default: Newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [artifacts, searchQuery, filterType, sortBy]);

  // 2. Handle Save
  const handleSaveArtifact = async (e) => {
    e.preventDefault();
    if (!canEdit) return; // <--- ADD THIS LINE
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
    if (!canEdit) return; // <--- ADD THIS LINE
    if(!confirm("Delete this artifact?")) return;
    await fetch(`/api/artifacts?id=${id}`, { method: 'DELETE' });
    setArtifacts(artifacts.filter(a => a.id !== id));
  }

  // Edit Click Handler
  const handleEditClick = (art, e) => {
    e.stopPropagation();
    if (!canEdit) return; // <--- ADD THIS LINE
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        setStagedFile(e.target.files[0].name);
    }
  };

  const isVisualType = (type) => ['image', 'chart'].includes(type);

  return (
    <div className="animate-in fade-in duration-500 relative z-0 pt-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium" style={{ color: theme.textMain }}>Results Gallery</h2>
        {canEdit && ( // <--- ADD THIS
        <button 
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2" 
            style={{ backgroundColor: theme.accent, color: '#FFF' }}
        >
          <Plus size={14} /> Add Result
        </button>
        )}
      </div>

      {/* --- NEW: FILTER & SORT TOOLBAR --- */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 p-1">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: theme.textMuted }} />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artifacts..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-transparent outline-none focus:ring-1 transition-all"
            style={{ borderColor: theme.border, color: theme.textMain, '--tw-ring-color': theme.accent }}
          />
        </div>

        <div className="flex items-center gap-2">
           {/* Filter Type */}
           <div className="relative">
             <select
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-lg border bg-transparent outline-none cursor-pointer hover:bg-white/5 transition-colors"
               style={{ borderColor: theme.border, color: theme.textMain }}
             >
               <option value="all">All Types</option>
               <option value="image">Images</option>
               <option value="chart">Charts</option>
               <option value="heatmap">Heatmaps</option>
               <option value="file">Files</option>
             </select>
             <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: theme.textMuted }}/>
           </div>

           {/* Sort */}
           <div className="relative">
             <select
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value)}
               className="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-lg border bg-transparent outline-none cursor-pointer hover:bg-white/5 transition-colors"
               style={{ borderColor: theme.border, color: theme.textMain }}
             >
               <option value="newest">Newest</option>
               <option value="alpha">A-Z</option>
             </select>
             <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: theme.textMuted }}/>
           </div>
        </div>
      </div>

      {/* GRID (Using processedArtifacts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
        {processedArtifacts.map((art) => (
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
                    {canEdit && (
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
                    )}
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

      {processedArtifacts.length === 0 && (
          <div className="text-center py-20 border border-dashed rounded-xl" style={{ borderColor: theme.border }}>
            <p className="text-xs opacity-50" style={{ color: theme.textMuted }}>No artifacts found.</p>
          </div>
      )}

      {/* FULL SCREEN MODAL (Kept same) */}
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

      {/* CREATE / EDIT MODAL (Kept same) */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-xl border shadow-2xl" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h3 className="text-lg font-medium mb-4" style={{ color: theme.textMain }}>{editingArtifact ? "Edit Result" : "Add Result"}</h3>
            
            {/* TABS */}
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
                
                {uploadMode === 'link' ? (
                    <input name="url" defaultValue={editingArtifact?.url} placeholder="https://..." required={!editingArtifact} className="flex-1 p-2 text-sm rounded border bg-transparent" style={{ borderColor: theme.border }} />
                ) : (
                    <div className="flex-1 relative group">
                        {(!editingArtifact || showReplace) && (
                            <input 
                                type="file" 
                                name="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                                required={!editingArtifact}
                                onChange={handleFileChange} 
                            />
                        )}
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
 * COMPONENT: OVERVIEW HUB (With Reminders, Deadlines, Pinning, & Advanced Input)
 */
const OverviewHub = ({ project, permissions }) => {
  const { theme } = useTheme();
  // PERMISSION CHECK
  const canEdit = permissions?.canEditTasks || permissions?.isOwner;
  const [data, setData] = useState(null);
  
  // Input State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState(""); 
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [useReminder, setUseReminder] = useState(false); // <--- NEW: Reminder State

  // Filter & Sort State
  const [taskFilter, setTaskFilter] = useState("all"); 
  const [taskSort, setTaskSort] = useState("recent"); 
  
  // UI State
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [expandedTasks, setExpandedTasks] = useState({});

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

  // 2. Add Task (With Deadline & Reminder)
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!canEdit) return; // <--- ADD THIS LINE
    if (!newTaskTitle.trim()) return;

    const payload = { 
        projectId: project.id, 
        title: newTaskTitle,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
        sendReminder: useReminder // <--- SEND REMINDER FLAG
    };

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const newTask = await res.json();
    
    setData(prev => ({ ...prev, tasks: [newTask, ...(prev.tasks || [])] }));
    
    // Reset form
    setNewTaskTitle("");
    setNewDueDate("");
    setShowDatePicker(false);
    setUseReminder(false); // Reset toggle
  };

  // 3. Logic: Filter & Sort
  const processedTasks = useMemo(() => {
    if (!data?.tasks) return [];
    let res = [...data.tasks];

    // Filter
    if (taskFilter === 'todo') res = res.filter(t => t.status !== 'done');
    if (taskFilter === 'done') res = res.filter(t => t.status === 'done');

    // Sort
    res.sort((a, b) => {
        const aPinned = a.priority === 'high';
        const bPinned = b.priority === 'high';
        if (aPinned !== bPinned) return aPinned ? -1 : 1;

        switch (taskSort) {
            case 'alpha': return a.title.localeCompare(b.title);
            case 'due': 
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            case 'recent':
            default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });
    return res;
  }, [data?.tasks, taskFilter, taskSort]);

  // 4. Pin Task
  const handleTogglePin = async (task) => {
    if (!canEdit) return; // <--- ADD THIS LINE HERE

    const newPriority = task.priority === 'high' ? 'medium' : 'high';
    const updatedTasks = data.tasks.map(t => t.id === task.id ? { ...t, priority: newPriority } : t);
    setData(prev => ({ ...prev, tasks: updatedTasks }));

    await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, priority: newPriority })
    });
  };

  // 5. Toggle Status
  const handleToggleStatus = async (task) => {
    if (!canEdit) return; // <--- ADD THIS LINE HERE

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
    if (!canEdit) return; // <--- ADD THIS LINE
    if (!confirm("Delete this task?")) return;
    setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
  };

  const startEditing = (task) => {
    if (!canEdit) return; // <--- ADD THIS LINE
    setEditingTask(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = async () => {
    if (!canEdit) return; // <--- ADD THIS LINE
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

  // Toggle Expand Helper
  const toggleExpand = (id) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Format Date Helper
  const formatDeadline = (task) => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    const now = new Date();
    const isOverdue = date < now;
    return (
        <span className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${isOverdue ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-gray-500/10 border-gray-500/20 text-gray-500'}`}>
            <Clock size={8} />
            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            {/* Show Bell icon if reminder is ON */}
            {task.sendReminder && <Bell size={8} className="fill-current" />}
        </span>
    );
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

      <div className="grid grid-cols-3 gap-6 h-[28rem]">
        
        {/* COL 1 & 2 (Charts) - Kept same as before */}
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

        {/* COL 3: TASKS */}
        <div className="col-span-1 rounded-xl border p-4 flex flex-col h-full overflow-hidden" style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}>
           
           {/* HEADER & FILTERS */}
           <div className="flex flex-col gap-2 mb-3 shrink-0">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium" style={{ color: theme.textMain }}>Tasks</h3>
                    <div className="flex gap-2">
                        <div className="relative group">
                            <button className="p-1 hover:bg-white/5 rounded"><ArrowUpDown size={12} color={theme.textMuted}/></button>
                            <select value={taskSort} onChange={(e) => setTaskSort(e.target.value)} className="absolute right-0 top-0 w-full h-full opacity-0 cursor-pointer">
                                <option value="recent">Recent</option>
                                <option value="alpha">Alphabetical</option>
                                <option value="due">Due Date</option>
                            </select>
                        </div>
                        <div className="relative group">
                            <button className="p-1 hover:bg-white/5 rounded"><Filter size={12} color={theme.textMuted}/></button>
                            <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} className="absolute right-0 top-0 w-full h-full opacity-0 cursor-pointer">
                                <option value="all">All</option>
                                <option value="todo">Pending</option>
                                <option value="done">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>
           </div>
           
           {/* ADD TASK INPUT (Layout Fixed: Date on new line) */}
           {canEdit && (
             <div className="flex flex-col gap-2 mb-4 shrink-0 bg-white/5 p-3 rounded-lg border border-transparent focus-within:border-gray-500/30 transition-colors">
               
               {/* Text Area & Word Count */}
               <div className="flex gap-2 relative">
                  <textarea 
                      className="flex-1 text-xs bg-transparent outline-none resize-none custom-scrollbar pb-4"
                      rows={2}
                      style={{ color: theme.textMain }}
                      placeholder="Add new task..."
                      value={newTaskTitle}
                      onChange={(e) => {
                          const val = e.target.value;
                          if (getWordCount(val) <= 100) setNewTaskTitle(val);
                      }}
                  />
                  
                  {/* Word Count */}
                  <span className="absolute bottom-0 left-0 text-[9px] opacity-30 select-none pointer-events-none" style={{ color: theme.textMuted }}>
                      {getWordCount(newTaskTitle)}/100
                  </span>

                  <button 
                      onClick={handleAddTask} 
                      disabled={!newTaskTitle.trim()} 
                      className="p-2 h-8 w-8 flex items-center justify-center rounded hover:opacity-80 disabled:opacity-50 self-start mt-1" 
                      style={{ backgroundColor: theme.accent, color: '#FFF' }}
                  >
                      <Plus size={14} />
                  </button>
               </div>
               
               {/* Controls Section */}
               <div className="pt-2 border-t border-white/5">
                  {/* Buttons Row */}
                  <div className="flex items-center gap-2">
                      <button 
                          onClick={() => setShowDatePicker(!showDatePicker)}
                          className={`px-3 py-1.5 rounded flex items-center gap-2 text-xs transition-colors shrink-0 ${newDueDate ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:bg-white/5'}`}
                      >
                          <Clock size={14} className={newDueDate ? "text-blue-400" : "text-white"} /> 
                          {newDueDate ? new Date(newDueDate).toLocaleDateString() : "Set Date"}
                      </button>

                      <button 
                          onClick={() => setUseReminder(!useReminder)}
                          className={`px-3 py-1.5 rounded flex items-center gap-2 text-xs transition-colors shrink-0 ${useReminder ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500 hover:bg-white/5'}`}
                          title="Email Reminder"
                      >
                          <Bell size={14} className={useReminder ? "fill-current" : ""} />
                          {useReminder ? "On" : "Remind Me"}
                      </button>
                  </div>

                  {/* Date Input Row (Moved to next line) */}
                  {showDatePicker && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                          <input 
                              type="datetime-local" 
                              className="w-full bg-black/20 text-xs border rounded border-gray-600 outline-none p-2"
                              style={{ color: theme.textMain }}
                              value={newDueDate}
                              onChange={(e) => setNewDueDate(e.target.value)}
                          />
                      </div>
                  )}
               </div>
             </div>
           )}

           {/* TASK LIST */}
           <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
             {processedTasks.map(task => {
               const isPinned = task.priority === 'high';
               
               // Logic: Split lines for "Show More"
               const lines = task.title.split('\n');
               const firstLine = lines[0];
               const hasMoreContent = lines.length > 1 || task.title.length > 60;
               const isExpanded = expandedTasks[task.id];

               return (
                 <div 
                   key={task.id} 
                   className={`flex flex-col p-2 rounded group border transition-all ${isPinned ? 'bg-yellow-500/5 border-yellow-500/20' : 'hover:bg-white/5 border-transparent hover:border-gray-500/20'}`}
                 >
                   <div className="flex items-start gap-2">
                        {/* Checkbox */}
                        <button 
                            onClick={() => handleToggleStatus(task)}
                            disabled={!canEdit} // <--- ADD THIS
                            // UPDATE CLASSNAME BELOW:
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-500'} ${!canEdit ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            {task.status === 'done' && <Check size={10} color="#FFF" />}
                        </button>

                        {/* Content Area */}
                        <div className="flex-1 min-w-0">
                            {editingTask === task.id ? (
                                <div className="flex gap-2 mb-1">
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
                                        className={`text-xs ${task.status === 'done' ? 'line-through opacity-50' : ''} whitespace-pre-wrap`} 
                                        style={{ color: theme.textMain }}
                                    >
                                        {isExpanded ? task.title : firstLine}
                                        {!isExpanded && hasMoreContent && <span className="opacity-50">...</span>}
                                    </p>

                                    {hasMoreContent && (
                                        <button 
                                            onClick={() => toggleExpand(task.id)}
                                            className="text-[10px] flex items-center gap-1 mt-1 opacity-60 hover:opacity-100 hover:underline cursor-pointer w-fit"
                                            style={{ color: theme.accent }}
                                        >
                                            {isExpanded ? <>Show Less <ChevronUp size={10}/></> : <>Show More <ChevronDown size={10}/></>}
                                        </button>
                                    )}
                                </div>
                            )}
                            
                            {/* Meta Row */}
                            <div className="flex justify-between items-center h-4 mt-1">
                                {formatDeadline(task)}
                                
                                {/* Actions */}
                                {!editingTask && canEdit && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                        <button onClick={() => handleTogglePin(task)} title="Pin" className={`p-1 rounded hover:bg-white/10 ${isPinned ? 'text-yellow-500' : 'text-gray-500'}`}>
                                            <Pin size={10} className={isPinned ? "fill-current" : ""}/>
                                        </button>
                                        <button onClick={() => startEditing(task)} className="p-1 text-blue-500 hover:bg-blue-500/10 rounded"><Pencil size={10}/></button>
                                        <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={10}/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                   </div>
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
 * COMPONENT: LANDING PAGE (Fixed Logos & Sliding Reviews)
 */
const LandingPage = ({ onLogin }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState(0);
  const [userCount, setUserCount] = useState(0);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animated User Counter
  useEffect(() => {
    let start = 0;
    const end = 2430; 
    const duration = 2500;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setUserCount(end);
        clearInterval(timer);
      } else {
        setUserCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, []);

  const handleDocs = () => {
    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
  };

  // Testimonials (Formal DPs, Balanced Size)
  const testimonials = [
    { name: "Sarah Chen", role: "Principal Investigator", lab: "Neuro Inst.", text: "ResearchOS has become the central nervous system of our lab. The data visualization is instant.", img: "https://i.pravatar.cc/150?u=sarah_res_fix" },
    { name: "James Miller", role: "PhD Candidate", lab: "Stanford Bio-X", text: "Finally, a tool that understands the scientific workflow. It's like GitHub, but built for our data.", img: "https://i.pravatar.cc/150?u=james_res_fix" },
    { name: "Elena Rodriguez", role: "Data Scientist", lab: "CERN", text: "The automated PII detection saved us from a major compliance headache. Worth every penny.", img: "https://i.pravatar.cc/150?u=elena_res_fix" },
    { name: "Dr. A. Patel", role: "Lead Researcher", lab: "DeepMind", text: "Collaboration has never been this seamless. We fork projects daily to test new hypotheses.", img: "https://i.pravatar.cc/150?u=patel_res_fix" },
    { name: "Marcus Wei", role: "Lab Director", lab: "Broad Institute", text: "The ability to publish negative results properly has changed how we work forever.", img: "https://i.pravatar.cc/150?u=marcus_res_fix" },
  ];
  
  // Actual Company Logos (Reliable URLs)
  const companyLogos = [
      { name: "MIT", url: "https://upload.wikimedia.org/wikipedia/commons/0/0c/MIT_logo.svg" },
      { name: "OpenAI", url: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
      { name: "Meta", url: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" },
      { name: "Google", url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
      { name: "IBM", url: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" }
  ];

  return (
    <div className="min-h-screen bg-[#08090B] text-[#E1E1E3] font-sans selection:bg-purple-500/30 overflow-x-hidden relative">
      
      {/* --- BACKGROUND --- */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(1000px at ${mousePos.x}px ${mousePos.y}px, rgba(147, 51, 234, 0.15), transparent 70%)`
        }} 
      />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#08090B]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-6 h-6 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-sm flex items-center justify-center shadow-lg shadow-purple-500/20">
              <GiArchiveResearch size={19} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white font-serif">ResearchOS</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={handleDocs} className="hidden sm:block text-xs font-medium text-gray-400 hover:text-white transition-colors">Documentation</button>
            <button onClick={onLogin} className="text-xs font-medium text-gray-400 hover:text-white transition-colors">Log In</button>
            <button onClick={onLogin} className="text-xs bg-white text-black px-5 py-2 rounded-full font-semibold hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative pt-40 pb-24 z-10">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="text-left relative z-10">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-medium text-gray-300 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> v2.0 Public Beta
            </div>

            <h1 className="text-6xl sm:text-7xl md:text-8xl font-serif font-medium tracking-tight mb-8 text-white leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Research <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-400">Synchronized.</span>
            </h1>
            
            <p className="text-lg text-gray-400 mb-12 max-w-lg leading-relaxed font-light animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
              The operating system for modern labs. Organize private experiments, collaborate securely, and publish to the global feed.
            </p>
            
            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300 mb-16">
              <button onClick={onLogin} className="h-12 px-8 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)]">
                Start Researching <ArrowRight size={16} />
              </button>
              <button onClick={handleDocs} className="h-12 px-8 rounded-full border border-white/10 hover:bg-white/5 text-white font-medium text-sm transition-colors">
                Read Manifest
              </button>
            </div>

            {/* SOCIAL PROOF */}
            <div className="flex items-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500 p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm w-fit">
                <div className="flex -space-x-4">
                   {[1,2,3,4,5].map(i => (
                       <div key={i} className="w-12 h-12 rounded-full border-4 border-[#08090B] bg-gradient-to-b from-gray-700 to-black flex items-center justify-center overflow-hidden shadow-lg">
                          <img src={`https://i.pravatar.cc/150?u=${i + 20}`} alt="User" className="w-full h-full object-cover opacity-80" />
                       </div>
                   ))}
                </div>
                <div className="flex flex-col">
                   <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white tabular-nums tracking-tighter">
                        {userCount.toLocaleString()}
                      </span>
                      <span className="text-lg text-gray-500 font-medium">+</span>
                   </div>
                   <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Active Researchers</span>
                </div>
            </div>

          </div>

          {/* HERO VISUAL: Abstract Knowledge Graph */}
          <div className="relative h-[500px] hidden md:flex items-center justify-center perspective-[1000px]">
              <div className="relative w-80 h-80 animate-[float_6s_ease-in-out_infinite]">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#161B22] border border-purple-500/30 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.2)] flex items-center justify-center z-20 backdrop-blur-xl">
                      <Layers size={32} className="text-purple-400"/>
                  </div>
                  {[0, 72, 144, 216, 288].map((deg, i) => (
                      <div key={i} className="absolute top-1/2 left-1/2 w-full h-full" style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)` }}>
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#161B22] border border-white/10 rounded-xl flex items-center justify-center shadow-xl animate-[spin_20s_linear_infinite_reverse]">
                              {i === 0 && <FileText size={16} className="text-gray-400"/>}
                              {i === 1 && <Activity size={16} className="text-purple-400"/>}
                              {i === 2 && <Database size={16} className="text-gray-400"/>}
                              {i === 3 && <GitBranch size={16} className="text-gray-400"/>}
                              {i === 4 && <Users size={16} className="text-gray-400"/>}
                          </div>
                          <div className="absolute top-[20px] left-1/2 -translate-x-1/2 w-[1px] h-[100px] bg-gradient-to-b from-purple-500/30 to-transparent"></div>
                      </div>
                  ))}
                  <div className="absolute inset-0 border border-purple-500/10 rounded-full animate-[spin_40s_linear_infinite]"></div>
                  <div className="absolute inset-12 border border-dashed border-purple-500/10 rounded-full animate-[spin_30s_linear_infinite_reverse]"></div>
              </div>
          </div>
        </div>
      </div>

      {/* --- COMPANY LOGOS (Real Images, White Filter, Sliding) --- */}
      <div className="py-10 border-y border-white/5 bg-white/[0.01] overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#08090B] to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#08090B] to-transparent z-10"></div>
          
          <div className="flex gap-24 w-max animate-[marquee_40s_linear_infinite] items-center">
              {[...companyLogos, ...companyLogos, ...companyLogos].map((co, i) => (
                  <div key={i} className="opacity-40 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0">
                      {/* CSS Filter makes images monochrome white. Hover reveals original. */}
                      <img 
                        src={co.url} 
                        alt={co.name} 
                        className="h-8 w-auto object-contain" 
                        style={{ filter: 'brightness(0) invert(1)' }} 
                      />
                  </div>
              ))}
          </div>
      </div>

      {/* --- INTERACTIVE FEATURES SECTION --- */}
      <div className="py-32 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid md:grid-cols-12 gap-16 items-center">
                  
                  {/* Left: Navigation */}
                  <div className="md:col-span-5 space-y-10 sticky top-32 h-fit">
                      <h2 className="text-4xl font-serif text-white mb-12">A unified workspace</h2>
                      {[
                          { id: 0, title: "Connect & Fork", desc: "Clone public projects to your private workspace." },
                          { id: 1, title: "Analyze Data", desc: "Auto-detect PII and visualize CSVs instantly." },
                          { id: 2, title: "Publish Findings", desc: "Share verified results to the global feed." }
                      ].map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`cursor-pointer group transition-all duration-500 pl-8 border-l-4 ${
                                activeTab === item.id 
                                ? 'border-purple-500' 
                                : 'border-white/5 hover:border-white/20'
                            }`}
                          >
                              <h3 className={`text-2xl font-medium mb-2 transition-colors ${
                                  activeTab === item.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                              }`}>
                                  {item.title}
                              </h3>
                              <p className={`text-base leading-relaxed transition-colors ${
                                  activeTab === item.id ? 'text-purple-200/80' : 'text-gray-600'
                              }`}>
                                  {item.desc}
                              </p>
                          </div>
                      ))}
                  </div>

                  {/* Right: Floating Graphics (No Box) */}
                  <div className="md:col-span-7 aspect-video relative flex items-center justify-center">
                      
                      {/* CONTENT 1: FORKING */}
                      <div className={`absolute transition-all duration-700 ${activeTab === 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                          <div className="relative w-[400px]">
                               {/* Original */}
                               <div className="bg-[#161B22] border border-purple-500/30 p-6 rounded-2xl mb-12 mx-auto w-56 text-center shadow-[0_20px_50px_rgba(168,85,247,0.15)] z-10 relative backdrop-blur-xl">
                                   <div className="w-10 h-10 bg-purple-500 text-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg"><Lock size={18}/></div>
                                   <div className="text-sm text-white font-bold">Original Study</div>
                               </div>
                               {/* Lines */}
                               <svg className="absolute top-16 left-0 w-full h-32 pointer-events-none" style={{ overflow: 'visible' }}>
                                   <path d="M200,0 V40 C200,80 60,80 60,120" fill="none" stroke="url(#grad1)" strokeWidth="2" className="opacity-50" />
                                   <path d="M200,0 V40 C200,80 340,80 340,120" fill="none" stroke="url(#grad2)" strokeWidth="2" className="opacity-50" />
                                   <defs>
                                       <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#a855f7" stopOpacity="1" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="1" /></linearGradient>
                                       <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#a855f7" stopOpacity="1" /><stop offset="100%" stopColor="#a855f7" stopOpacity="1" /></linearGradient>
                                   </defs>
                               </svg>

                               {/* Forks */}
                               <div className="flex justify-between gap-8">
                                   <div className="bg-[#0D1117] border border-blue-500/30 p-5 rounded-2xl w-44 text-center shadow-2xl transform hover:-translate-y-2 transition-transform duration-500">
                                       <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full mx-auto mb-3 flex items-center justify-center"><GitBranch size={16}/></div>
                                       <div className="text-xs text-gray-300 font-mono">Fork A (Bio)</div>
                                       <div className="mt-2 h-1 w-12 bg-blue-500/30 rounded-full mx-auto"></div>
                                   </div>
                                   <div className="bg-[#0D1117] border border-purple-500/30 p-5 rounded-2xl w-44 text-center shadow-2xl transform hover:-translate-y-2 transition-transform duration-500 delay-100">
                                       <div className="w-8 h-8 bg-purple-500/20 text-purple-400 rounded-full mx-auto mb-3 flex items-center justify-center"><GitBranch size={16}/></div>
                                       <div className="text-xs text-gray-300 font-mono">Fork B (Neuro)</div>
                                       <div className="mt-2 h-1 w-12 bg-purple-500/30 rounded-full mx-auto"></div>
                                   </div>
                               </div>
                          </div>
                      </div>

                      {/* CONTENT 2: ANALYSIS */}
                      <div className={`absolute transition-all duration-700 ${activeTab === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                           <div className="w-80 bg-[#161B22]/80 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                               <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                                   <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"/>
                                   <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"/>
                                   <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"/>
                               </div>
                               <div className="p-6 space-y-4 relative">
                                   <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                                       <div className="flex items-center gap-2"><FileText size={12}/> data_v2.csv</div>
                                       <span>24MB</span>
                                   </div>
                                   <div className="space-y-2">
                                       {[1,2,3,4,5].map(i => (
                                           <div key={i} className="h-6 bg-white/5 rounded flex items-center px-3 gap-3">
                                               <div className="w-2 h-2 bg-white/10 rounded-full"/>
                                               <div className="w-1/3 h-2 bg-white/10 rounded"/>
                                               <div className="w-1/4 h-2 bg-white/5 rounded ml-auto"/>
                                           </div>
                                       ))}
                                   </div>
                                   <div className="absolute top-0 left-0 right-0 h-[2px] bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,1)] animate-[scan_2s_linear_infinite] z-10"></div>
                                   <div className="flex justify-end pt-2">
                                       <span className="text-[10px] font-bold tracking-wider px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded flex items-center gap-1">
                                           <Check size={10} /> PII SAFE
                                       </span>
                                   </div>
                               </div>
                           </div>
                      </div>

                      {/* CONTENT 3: PUBLISH */}
                      <div className={`absolute transition-all duration-700 ${activeTab === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                          <div className="relative">
                              <div className="w-80 bg-[#161B22] rounded-2xl border border-white/10 p-6 shadow-2xl transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500 cursor-default">
                                  <div className="flex gap-4 mb-6">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg"></div>
                                      <div className="flex-1 space-y-2">
                                          <div className="h-2.5 w-32 bg-white/20 rounded"></div>
                                          <div className="h-2 w-20 bg-white/10 rounded"></div>
                                      </div>
                                  </div>
                                  <div className="h-32 bg-black/40 rounded-xl mb-6 overflow-hidden relative border border-white/5">
                                      <div className="absolute bottom-0 left-0 w-full h-full flex items-end px-3 gap-1.5 pb-3">
                                          <div className="w-1/4 h-[40%] bg-purple-500/60 rounded-t-sm animate-[growBar_3s_infinite_alternate]"></div>
                                          <div className="w-1/4 h-[70%] bg-purple-500/60 rounded-t-sm animate-[growBar_4s_infinite_alternate]"></div>
                                          <div className="w-1/4 h-[50%] bg-purple-500/60 rounded-t-sm animate-[growBar_2.5s_infinite_alternate]"></div>
                                          <div className="w-1/4 h-[80%] bg-purple-500/60 rounded-t-sm animate-[growBar_3.5s_infinite_alternate]"></div>
                                      </div>
                                  </div>
                                  <div className="flex gap-3">
                                      <div className="h-8 w-16 bg-white/5 rounded-full"></div>
                                      <div className="h-8 w-16 bg-white/5 rounded-full"></div>
                                  </div>
                              </div>
                              
                              {/* Tooltip */}
                              <div className="absolute -right-12 -bottom-6 bg-white text-black text-xs font-bold px-4 py-2 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] animate-bounce z-20 flex items-center gap-2">
                                  <Sparkles size={12} className="text-purple-600" /> 
                                  AI Generated
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- REVIEWS (Compact Sliding Marquee) --- */}
      <div className="py-32 border-b border-white/5 bg-[#08090B] overflow-hidden relative">
         <div className="max-w-[1400px] mx-auto px-6 mb-16 text-center">
             <h2 className="text-4xl font-serif text-white">Trusted by pioneers</h2>
         </div>
         
         <div className="flex gap-8 w-max animate-[marquee_60s_linear_infinite] hover:[animation-play-state:paused]">
             {/* Duplicated list for seamless loop */}
             {[...testimonials, ...testimonials].map((t, i) => (
                 <div key={i} className="w-[320px] p-6 rounded-[24px] bg-[#161B22] border border-white/5 hover:border-purple-500/30 transition-all duration-500 group hover:-translate-y-1 flex flex-col justify-between">
                     <div>
                        <p className="text-sm text-gray-300 font-serif leading-relaxed mb-6">"{t.text}"</p>
                     </div>
                     <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                         <div className="shrink-0 w-10 h-10 rounded-full border border-white/10 shadow-lg overflow-hidden bg-gray-800">
                            <img src={t.img} alt={t.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                         </div>
                         <div>
                             <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{t.name}</div>
                             <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{t.role}</div>
                         </div>
                     </div>
                 </div>
             ))}
         </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-[#050505] border-t border-white/10 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-20">
           <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                      <GiArchiveResearch size={20} color="black"/>
                  </div>
                  <span className="font-bold text-xl text-white font-serif">ResearchOS</span>
              </div>
              <p className="text-gray-500 max-w-sm text-sm leading-relaxed mb-8">
                  The collaborative operating system for modern research. <br/>Designed in India, built for the world.
              </p>
               <div>
                  <a href="mailto:researchoshello@gmail.com" className="text-sm text-gray-400 hover:text-white border-b border-white/20 hover:border-white pb-1 transition-all">
                      researchoshello@gmail.com
                  </a>
              </div>
           </div>
           
           <div>
               <h4 className="font-bold mb-6 text-white text-sm uppercase tracking-wider">Product</h4>
               <ul className="space-y-4 text-gray-500 text-sm">
                   <li><button onClick={onLogin} className="hover:text-white transition-colors">Log In</button></li>
                   <li><button onClick={onLogin} className="hover:text-white transition-colors">Request Access</button></li>
                   <li><button onClick={handleDocs} className="hover:text-white transition-colors">Manifesto</button></li>
               </ul>
           </div>

            <div>
               <h4 className="font-bold mb-6 text-white text-sm uppercase tracking-wider">Legal</h4>
               <ul className="space-y-4 text-gray-500 text-sm">
                   <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                   <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
                   <li className="hover:text-white cursor-pointer transition-colors">Security</li>
               </ul>
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex justify-between items-center text-xs text-gray-600">
            <div>© 2025 ResearchOS Inc.</div>
            <div className="flex gap-6">
                <span>Indore, India</span>
            </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes growBar {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.0); }
        }
      `}</style>
    </div>
  );
};

/**
 * COMPONENT: PROJECT SETTINGS MODAL (Visibility, Social Post & Team)
 */
const ProjectSettingsModal = ({ isOpen, onClose, project, isOwner, onUpdateProject }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'team'
  
  // --- General State (Visibility & Social) ---
  const [isPublic, setIsPublic] = useState(project?.isPublic || false);
  const [heading, setHeading] = useState(project?.postHeading || "");
  const [summary, setSummary] = useState(project?.postSummary || "");
  const [tags, setTags] = useState(project?.tags ? project.tags.join(", ") : "");
  
  const [loading, setLoading] = useState(false); // Save loading
  const [genLoading, setGenLoading] = useState(false); // AI loading

  // --- Team State ---
  const [inviteEmail, setInviteEmail] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);
  const [memberList, setMemberList] = useState(project?.members || []);
  
  // Permissions State for Invite
  const [perms, setPerms] = useState({
    canEditLit: false,
    canEditData: false,
    canEditExps: false,
    canEditTasks: false,      // <--- ADD THIS
    canEditArtifacts: false,  // <--- ADD THIS
    canManageTeam: false
  });

  // Sync state when project prop updates
  useEffect(() => {
    if (project) {
        setIsPublic(project.isPublic);
        setHeading(project.postHeading || "");
        setSummary(project.postSummary || "");
        setTags(project.tags ? project.tags.join(", ") : "");
        setMemberList(project.members || []);
    }
  }, [project]);

  // --- HANDLER: AI GENERATION (Context Aware) ---
  const handleAiGenerate = async () => {
    if (!project) return;
    setGenLoading(true);
    try {
        // Call our smart internal API with just the ID
        const res = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: project.id })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");
        
        // Clean and Parse JSON
        const cleanText = data.text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        
        setHeading(parsed.heading);
        setSummary(parsed.summary);
        // Ensure tags is a string for the input field
        setTags(Array.isArray(parsed.tags) ? parsed.tags.join(", ") : parsed.tags); 
    } catch (e) {
        console.error("AI Generation Error:", e);
        // 3. Show the ACTUAL error message
        alert(`Generation failed: ${e.message}`);
    } finally {
        setGenLoading(false);
    }
  };

  // --- HANDLER: SAVE GENERAL SETTINGS ---
  const handleUpdate = async () => {
    setLoading(true);
    try {
        // Parse tags string back to array
        const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

        const res = await fetch(`/api/projects/${project.id}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                isPublic,
                postHeading: heading,
                postSummary: summary,
                tags: tagArray
            })
        });
        if(!res.ok) throw new Error("Failed");
        const updated = await res.json();
        onUpdateProject(updated); // Update parent state
        alert("Settings saved successfully!");
    } catch(e) {
        alert("Error updating settings. Are you the owner?");
    } finally {
        setLoading(false);
    }
  };

  // --- HANDLER: INVITE MEMBER ---
  const handleInvite = async (e) => {
    e.preventDefault();
    setTeamLoading(true);
    try {
        const res = await fetch('/api/members', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                projectId: project.id, 
                email: inviteEmail,
                permissions: perms 
            })
        });
        
        const data = await res.json();
        
        if(!res.ok) throw new Error(data.error);
        
        // Smart Update: Update if exists, add if new
        setMemberList(prevList => {
            const exists = prevList.find(m => m.id === data.id);
            if (exists) {
                return prevList.map(m => m.id === data.id ? data : m);
            }
            return [...prevList, data];
        });

        setInviteEmail("");
        setPerms({ canEditLit: false, canEditData: false, canEditExps: false, canManageTeam: false });
        alert("Member invited/updated!");
    } catch(e) {
        alert(e.message);
    } finally {
        setTeamLoading(false);
    }
  };

  // --- HANDLER: REMOVE MEMBER ---
  const handleRemoveMember = async (memberId) => {
    if(!confirm("Remove this member?")) return;
    try {
        await fetch(`/api/members?id=${memberId}`, { method: 'DELETE' });
        setMemberList(memberList.filter(m => m.id !== memberId));
    } catch(e) { alert("Failed to remove member"); }
  };

  if(!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Settings">
        {/* Tabs */}
        <div className="flex border-b mb-6" style={{ borderColor: theme.border }}>
            <button 
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-500 text-blue-500' : 'border-transparent opacity-50'}`}
                style={{ color: activeTab === 'general' ? theme.accent : theme.textMuted, borderColor: activeTab === 'general' ? theme.accent : 'transparent' }}
            >
                General
            </button>
            <button 
                onClick={() => setActiveTab('team')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'team' ? 'border-blue-500 text-blue-500' : 'border-transparent opacity-50'}`}
                style={{ color: activeTab === 'team' ? theme.accent : theme.textMuted, borderColor: activeTab === 'team' ? theme.accent : 'transparent' }}
            >
                Team
            </button>
        </div>

        {/* GENERAL TAB: Visibility & Social Post */}
        {activeTab === 'general' && (
            <div className="space-y-6">
                {/* Visibility Toggle */}
                <div className={`p-4 rounded-lg border flex items-center justify-between ${isPublic ? 'bg-green-500/10 border-green-500/20' : 'bg-gray-500/5 border-gray-500/20'}`}>
                    <div className="flex items-center gap-3">
                        {isPublic ? <Globe size={20} className="text-green-500"/> : <Lock size={20} className="text-gray-500"/>}
                        <div>
                            <h4 className="font-bold text-sm" style={{ color: theme.textMain }}>{isPublic ? "Public Project" : "Private Project"}</h4>
                            <p className="text-[10px] opacity-60" style={{ color: theme.textMuted }}>
                                {isPublic 
                                    ? "Visible in Explore Feed. Anyone can view." 
                                    : "Only invited members can access."}
                            </p>
                        </div>
                    </div>
                    {isOwner && (
                        <button 
                            onClick={() => setIsPublic(!isPublic)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${isPublic ? 'bg-green-500' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isPublic ? 'left-6' : 'left-1'}`} />
                        </button>
                    )}
                </div>

                {/* Social Post Editor (Only if Public) */}
                {isPublic && (
                    <div className="space-y-4 border-t pt-4 animate-in fade-in" style={{ borderColor: theme.border }}>
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Explore Feed Post</h4>
                            <button 
                                onClick={handleAiGenerate}
                                disabled={genLoading}
                                className="text-[10px] px-2 py-1 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 flex items-center gap-1 transition-colors border border-purple-500/20"
                            >
                                {genLoading ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} Auto-Generate
                            </button>
                        </div>
                        
                        <div>
                            <label className="text-[10px] opacity-50 mb-1 block" style={{ color: theme.textMuted }}>Heading</label>
                            <input 
                                value={heading} 
                                onChange={e => setHeading(e.target.value)}
                                className="w-full p-2 text-sm rounded border bg-transparent focus:ring-1 outline-none" 
                                placeholder="e.g. Breakthrough in Neural Imaging"
                                style={{ borderColor: theme.border, color: theme.textMain, '--tw-ring-color': theme.accent }}
                            />
                        </div>
                        
                        <div>
                            <label className="text-[10px] opacity-50 mb-1 block" style={{ color: theme.textMuted }}>Summary</label>
                            <textarea 
                                value={summary} 
                                onChange={e => setSummary(e.target.value)}
                                className="w-full p-2 text-sm rounded border bg-transparent h-24 resize-none focus:ring-1 outline-none" 
                                placeholder="Describe your findings to the community..."
                                style={{ borderColor: theme.border, color: theme.textMain, '--tw-ring-color': theme.accent }}
                            />
                        </div>
                        
                        <div>
                            <label className="text-[10px] opacity-50 mb-1 block" style={{ color: theme.textMuted }}>Tags (comma separated)</label>
                            <input 
                                value={tags} 
                                onChange={e => setTags(e.target.value)}
                                className="w-full p-2 text-sm rounded border bg-transparent focus:ring-1 outline-none" 
                                placeholder="#Science, #Tech, #Data"
                                style={{ borderColor: theme.border, color: theme.textMain, '--tw-ring-color': theme.accent }}
                            />
                        </div>
                    </div>
                )}

                {/* Save Button */}
                {isOwner ? (
                    <button 
                        onClick={handleUpdate}
                        disabled={loading || genLoading}
                        className="w-full py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ backgroundColor: theme.accent }}
                    >
                        {loading && <Loader2 size={14} className="animate-spin"/>}
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                ) : (
                    <p className="text-xs text-center opacity-50" style={{ color: theme.textMuted }}>Only the owner can change settings.</p>
                )}
            </div>
        )}

        {/* TEAM TAB (Invites & Permissions) */}
        {activeTab === 'team' && (
            <div className="space-y-6">
                {/* Invite Form */}
                <form onSubmit={handleInvite} className="space-y-3 p-4 rounded-lg border border-dashed" style={{ borderColor: theme.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Invite Collaborator</h4>
                    <input 
                        type="email" 
                        placeholder="colleague@lab.edu" 
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full p-2 text-sm rounded border bg-transparent"
                        style={{ borderColor: theme.border, color: theme.textMain }}
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'canEditLit', label: 'Edit Literature' },
                            { id: 'canEditData', label: 'Edit Data' },
                            { id: 'canEditExps', label: 'Edit Experiments' },
                            { id: 'canEditTasks', label: 'Edit Tasks' },       // <--- NEW
                            { id: 'canEditArtifacts', label: 'Edit Artifacts' }, // <--- NEW
                            { id: 'canManageTeam', label: 'Manage Team' },
                        ].map(p => (
                            <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: theme.textMuted }}>
                                <input 
                                    type="checkbox" 
                                    checked={perms[p.id]} 
                                    onChange={(e) => setPerms({...perms, [p.id]: e.target.checked})}
                                    className="rounded border-gray-600 bg-transparent"
                                />
                                {p.label}
                            </label>
                        ))}
                    </div>

                    <button 
                        type="submit" 
                        disabled={teamLoading}
                        className="w-full py-2 rounded text-xs font-medium text-white flex items-center justify-center gap-2"
                        style={{ backgroundColor: theme.accent }}
                    >
                        {teamLoading && <Loader2 className="animate-spin" size={12}/>} Send Invite
                    </button>
                </form>

                {/* Member List */}
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Current Members</h4>
                    {memberList.length === 0 && <p className="text-xs opacity-50">No members yet.</p>}
                    {memberList.map(m => (
                        <div key={m.id} className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                            <div>
                                <div className="text-sm font-medium" style={{ color: theme.textMain }}>{m.user?.name || m.user?.email}</div>
                                <div className="text-[10px] opacity-50" style={{ color: theme.textMuted }}>{m.role}</div>
                            </div>
                            {m.role !== 'OWNER' && (
                                <button onClick={() => handleRemoveMember(m.id)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded">
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
    </Modal>
  );
};

/**
 * MAIN APP SHELL (Final: Landing Page -> Custom Auth -> App)
 */
const ResearchOSContent = () => {
  const { data: session } = useSession();
  
  // NEW: State to toggle between Landing Page and Custom Auth Screen
  const [showAuth, setShowAuth] = useState(false);

  // App State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // For Project-Level Settings
  
  // --- NEW: Edit Mode State ---
  const [projectToEdit, setProjectToEdit] = useState(null);

  const [projects, setProjects] = useState([]); 
  const [selectedProject, setSelectedProject] = useState(null); // Basic info for list
  
  // --- NEW: Active Project & Permissions State ---
  const [fullProjectData, setFullProjectData] = useState(null); 
  const [permissions, setPermissions] = useState(null); 

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
  
  // --- DATA FETCHING ---
  const fetchProjects = async () => {
    if (session) {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (Array.isArray(data)) setProjects(data);
      } catch (err) {
        console.error("Failed to load projects", err);
      }
    }
  };
  
  // --- NEW: Handle Incoming Project Links (Deep Linking) ---
  const searchParams = useSearchParams();

  useEffect(() => {
    const projectIdFromUrl = searchParams.get('projectId');
    
    // If we have an ID in URL and we haven't selected a project yet
    if (projectIdFromUrl && !selectedProject) {
        // 1. Create a temporary placeholder so the UI shows "Loading..." immediately
        const placeholder = { id: projectIdFromUrl, title: "Loading Project...", color: "#5E6AD2" };
        
        // 2. Trigger selection logic
        handleSelectProject(placeholder);
        
        // 3. Clean up URL (remove ?projectId=... so refreshing doesn't get stuck)
        window.history.replaceState(null, '', '/');
    }
  }, [searchParams]); // Run whenever URL params change

  // Initial Load
  useEffect(() => {
    fetchProjects();
  }, [session]);

  // --- HANDLERS: CREATE / EDIT / DELETE ---

  // 1. Open Create Modal (Reset Edit Mode)
  const openCreate = () => {
      setProjectToEdit(null);
      setIsCreateModalOpen(true);
  };

  // 2. Open Edit Modal (Set Edit Data)
  const handleEditProjectClick = (proj) => {
      setProjectToEdit(proj);
      setIsCreateModalOpen(true);
  };

  // 3. Unified Save Handler (Handles both Create and Update)
  const handleSaveProject = async (title, description) => {
    try {
        if (projectToEdit) {
            // --- EDIT MODE ---
            const res = await fetch(`/api/projects/${projectToEdit.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });
            
            if (!res.ok) throw new Error("Update failed");
            const updated = await res.json();
            
            // Optimistic update of local list
            setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
        } else {
            // --- CREATE MODE ---
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });
            
            if (!res.ok) throw new Error("Create failed");
            // Refresh list from server to ensure we get everything
            await fetchProjects();
        }
        
        // Cleanup
        setIsCreateModalOpen(false);
        setProjectToEdit(null);
    } catch (err) {
        alert("Action failed. Please check your connection.");
    }
  };

  // 4. Delete Handler
  const handleDeleteProject = async (projectId) => {
      if(!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
      
      // Optimistic delete
      setProjects(prev => prev.filter(p => p.id !== projectId));

      try {
          const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error("Delete failed");
      } catch (err) {
          alert("Failed to delete project");
          fetchProjects(); // Revert logic on failure
      }
  };

  // --- PROJECT SELECTION & NAVIGATION ---

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    setFullProjectData(null); 
    setPermissions(null); 
    
    try {
        const res = await fetch(`/api/projects/${project.id}`);
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        
        setFullProjectData(data);
        
        // --- FIX: Update selectedProject with the REAL title from the DB ---
        setSelectedProject(prev => ({
            ...prev,
            id: data.id,
            title: data.title, // <--- This overwrites "Loading Project..."
            color: data.color
        }));
        // ------------------------------------------------------------------

        // Use permissions from API, or fallback to defaults
        let perms = data.permissions || {
            canEditLit: false, canEditData: false, 
            canEditExps: false, canManageTeam: false,
            canEditTasks: false, canEditArtifacts: false
        };
        
        // Force owner permissions if applicable
        if (data.members?.some(m => m.user.email === session?.user?.email && m.role === 'OWNER')) {
            perms = { isOwner: true, canEditLit: true, canEditData: true, canEditExps: true, canManageTeam: true, canEditTasks: true, canEditArtifacts: true };
        }

        setPermissions(perms);
        setActiveTab('overview');

    } catch (e) {
        console.error(e);
        setSelectedProject(null); // Reset if fetch fails
    }
  };

  const handleLogout = () => {
    signOut(); 
    setSelectedProject(null);
    setShowAuth(false);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setFullProjectData(null);
  };

  // --- SEARCH LOGIC ---
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
    if (!fullProjectData || !permissions) {
        return (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
                <Loader2 className="animate-spin mb-2" size={32} />
                <span className="text-xs">Loading Workspace...</span>
            </div>
        );
    }

    const props = { project: fullProjectData, permissions };

    switch (activeTab) {
      case 'overview': return <OverviewHub {...props} />;
      case 'literature': return <LiteratureManager {...props} />;
      case 'datasets': return <DatasetRegistry {...props} />;
      case 'experiments': return <Experiments {...props} />;
      case 'artifacts': return <Artifacts {...props} />;
      default: return <OverviewHub {...props} />;
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
            <AuthScreen onLogin={() => {}} /> 
        )
      ) : !selectedProject ? (
        // --- SHOW PROJECT SELECTION ---
        <>
          <ProjectSelectionScreen 
            projects={projects}
            onSelectProject={handleSelectProject}
            
            // Open Modal in Create Mode
            onOpenCreateModal={openCreate}
            
            onLogout={handleLogout}
            toggleTheme={() => setIsDarkMode(!isDarkMode)}
            isDarkMode={isDarkMode}
            onRefreshProjects={fetchProjects}
            
            // Pass Edit/Delete Handlers
            onEdit={handleEditProjectClick} 
            onDelete={handleDeleteProject}
          />
          
          <CreateProjectModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleSaveProject} // Handles both Create & Edit
            theme={currentTheme}
            initialData={projectToEdit}  // Pass data for editing
          />
        </>
      ) : (
        // --- SHOW MAIN APP ---
        <div className="flex h-screen w-screen overflow-hidden font-sans transition-colors duration-300" style={{ backgroundColor: currentTheme.bg, color: currentTheme.textMain }}>
          
          {/* SIDEBAR */}
          <div className="w-[240px] flex flex-col h-full border-r fixed left-0 top-0 bottom-0 z-20" style={{ backgroundColor: currentTheme.bgSidebar, borderColor: currentTheme.border }}>
             <Sidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                projectName={selectedProject?.title} 
                projectColor={selectedProject?.color}
                onLogout={handleBackToProjects}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                permissions={permissions}
             />
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
                        <button onClick={(e) => { e.stopPropagation(); setSearchQuery(""); setIsSearchOpen(false); }}>
                            <X size={14} className="opacity-50 hover:opacity-100"/>
                        </button>
                    )}
                </div>

                {/* SEARCH RESULTS DROPDOWN */}
                {isSearchOpen && searchResults && searchQuery && (
                    <div className="absolute top-full right-0 w-full mt-2 rounded-xl border shadow-xl overflow-hidden max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2" style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }}>
                        {Object.values(searchResults).every(arr => !arr || arr.length === 0) && (
                            <div className="p-4 text-center text-xs opacity-50">No results found.</div>
                        )}
                        {['papers', 'tasks', 'experiments', 'datasets', 'artifacts'].map(category => {
                            const items = searchResults[category];
                            if (!items || items.length === 0) return null;
                            const typeMap = { papers: 'paper', tasks: 'task', experiments: 'experiment', datasets: 'dataset', artifacts: 'artifact' };
                            return (
                                <div key={category} className="p-2 border-b last:border-0" style={{ borderColor: currentTheme.border }}>
                                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 px-2 mb-1">{category}</div>
                                    {items.map(item => (
                                        <div key={item.id} onClick={() => handleSearchResultClick(typeMap[category])} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer text-sm transition-colors">
                                            <span className="truncate" style={{color: currentTheme.textMain}}>{category === 'datasets' ? item.file?.name : item.title}</span>
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
          {/* --- ADD THIS BLOCK --- */}
          {fullProjectData && (
              <ProjectSettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                project={fullProjectData}
                isOwner={permissions?.isOwner}
                onUpdateProject={(updated) => {
                    setFullProjectData({ ...fullProjectData, ...updated });
                    // Refresh main list to reflect changes (e.g., public status)
                    fetchProjects(); 
                }}
              />
          )}
        </div>
      )}
    </ThemeContext.Provider>
  );
};

// --- NEW WRAPPER FOR SUSPENSE ---
const ResearchOS = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
         <Loader2 className="animate-spin text-[#5E6AD2]" size={40} />
      </div>
    }>
      <ResearchOSContent />
    </Suspense>
  );
};

export default ResearchOS;