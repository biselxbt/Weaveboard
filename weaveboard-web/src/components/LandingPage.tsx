import { useState, useRef, useEffect } from 'react';
import { 
  Github, 
  ArrowRight, 
  Loader2,
  Eye,
  EyeOff,
  Upload,
  Server,
  FileArchive,
  Terminal,
  Globe,
  Shield,
  Zap,
  Search,
  Layers,
  Workflow,
  Code2,
  ExternalLink,
  CheckCircle2,
  Box,
  Cpu,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { cloneRepository, parseGitHubUrl } from '../services/git-clone';
import { connectToServer, type ConnectToServerResult } from '../services/server-connection';
import { FileEntry } from '../services/zip';
import logoUrl from '../assets/logo.png';
import { TokenBanner } from './TokenBanner';

interface LandingPageProps {
  onEnterApp: () => void;
  onFileSelect: (file: File) => void;
  onGitClone: (files: FileEntry[], repoName?: string) => void;
  onServerConnect?: (result: ConnectToServerResult, serverUrl?: string) => void;
  onNavigateToWeave?: () => void;
}

const navLinks = [
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Tools', href: '#tools' },
  { label: 'Docs', href: '#docs' },
];

const howItWorksSteps = [
  { icon: Box, title: 'Structure', desc: 'Walk file tree, map folder/file relationships' },
  { icon: Code2, title: 'Parsing', desc: 'Extract functions, classes, methods using Tree-sitter ASTs' },
  { icon: Layers, title: 'Resolution', desc: 'Resolve imports and calls across files' },
  { icon: Workflow, title: 'Clustering', desc: 'Group symbols into functional communities' },
  { icon: Search, title: 'Processes', desc: 'Trace execution flows from entry points' },
  { icon: Zap, title: 'Search', desc: 'Build hybrid search indexes (BM25 + semantic)' },
];

const mcpTools = [
  { name: 'list_repos', desc: 'Discover all indexed repositories', param: '—' },
  { name: 'query', desc: 'Process-grouped hybrid search (BM25 + semantic + RRF)', param: 'Optional' },
  { name: 'context', desc: '360° symbol view — refs, processes', param: 'Optional' },
  { name: 'impact', desc: 'Blast radius analysis with confidence', param: 'Optional' },
  { name: 'detect_changes', desc: 'Git-diff impact — changed lines → affected processes', param: 'Optional' },
  { name: 'rename', desc: 'Multi-file coordinated rename', param: 'Optional' },
  { name: 'cypher', desc: 'Raw Cypher graph queries', param: 'Optional' },
];

const languages = [
  'TypeScript', 'JavaScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Swift'
];

const features = [
  {
    title: 'Impact Analysis',
    desc: 'Know exactly what breaks before you ship. See upstream/downstream dependencies with confidence scores.',
    code: `impact({target: "UserService", direction: "upstream", minConfidence: 0.8})`,
  },
  {
    title: 'Process-Grouped Search',
    desc: 'Search understands execution flows, not just keywords. Find code in the context of how it runs.',
    code: `query({query: "authentication middleware"})`,
  },
  {
    title: 'Context View',
    desc: '360° symbol view showing incoming/outgoing calls, imports, and which processes use it.',
    code: `context({name: "validateUser"})`,
  },
  {
    title: 'Detect Changes',
    desc: 'Pre-commit analysis. See what processes your changes affect before pushing.',
    code: `detect_changes({scope: "all"})`,
  },
];

const cliCommands = [
  { cmd: 'weaveboard analyze', desc: 'Index a repository' },
  { cmd: 'weaveboard analyze --force', desc: 'Force full re-index' },
  { cmd: 'weaveboard analyze --skip-embeddings', desc: 'Skip embeddings (faster)' },
  { cmd: 'weaveboard setup', desc: 'Configure MCP for editors' },
  { cmd: 'weaveboard serve', desc: 'Start local HTTP server' },
  { cmd: 'weaveboard wiki', desc: 'Generate repository wiki' },
];

export const LandingPage = ({ 
  onEnterApp, 
  onFileSelect, 
  onGitClone, 
  onServerConnect,
  onNavigateToWeave
}: LandingPageProps) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'github' | 'server'>('zip');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGitClone = async () => {
    if (!githubUrl.trim()) {
      setError('Please enter a GitHub URL');
      return;
    }
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      setError('Invalid GitHub URL');
      return;
    }
    setError(null);
    setIsCloning(true);
    try {
      const files = await cloneRepository(githubUrl, () => {}, githubToken || undefined);
      setGithubToken('');
      if (files.length > 0) {
        onGitClone(files, parsed.repo);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clone';
      setError(message);
    } finally {
      setIsCloning(false);
    }
  };

  const handleServerConnect = async () => {
    const urlToUse = serverUrl.trim() || window.location.origin;
    setError(null);
    setIsConnecting(true);
    try {
      const result = await connectToServer(urlToUse, () => {});
      if (onServerConnect) {
        onServerConnect(result, urlToUse);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.zip')) {
        onFileSelect(file);
      } else {
        setError('Please select a .zip file');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.zip')) {
        onFileSelect(file);
      } else {
        setError('Please drop a .zip file');
      }
    }
  };

  return (
    <div className="min-h-screen bg-void text-white overflow-x-hidden w-full max-w-full pb-28">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logoUrl} alt="Weaveboard" className="w-9 h-9 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.4)] ring-1 ring-white/30" />
            <span className="font-semibold text-lg">Weaveboard</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            <a href="https://github.com/biselxbt/weaveboard" target="_blank" rel="noopener noreferrer" aria-label="View on GitHub" className="btn-white px-3 sm:px-4 py-2 text-sm flex items-center gap-2">
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Star</span>
            </a>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0a0a0a]">
            <div className="px-3 py-4 space-y-2">
              {navLinks.map((link) => (
                <a 
                  key={link.href} 
                  href={link.href} 
                  className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a 
                href="https://github.com/biselxbt/weaveboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                GitHub
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-28 pb-12 sm:pb-16 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Understand Your Code
            <br />
            <span className="text-gradient">Like Never Before</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-8">
            Indexes any codebase into a knowledge graph — every dependency, call chain, cluster, 
            and execution flow — then exposes it through smart tools so AI agents never miss code.
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            {/* Prominent Upload Card */}
            <div className="glass-strong rounded-2xl p-1 w-full max-w-lg relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 via-transparent to-white/10 pointer-events-none" />
              
              <div className="flex glass rounded-xl p-1 mb-4">
                {[
                  { id: 'zip', label: 'ZIP Upload', icon: FileArchive },
                  { id: 'github', label: 'GitHub', icon: Github },
                  { id: 'server', label: 'Server', icon: Server },
                ].map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => { setActiveTab(id as any); setError(null); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

              {activeTab === 'zip' && (
                <div className={`border-2 border-dashed rounded-xl p-10 sm:p-14 text-center cursor-pointer transition-all ${isDragging ? 'border-white bg-white/10' : 'border-white/20 hover:border-white/40'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" accept=".zip" aria-label="Upload ZIP file" onChange={handleFileChange} className="hidden" />
                  <div className={`w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-2xl ${isDragging ? 'bg-white/20' : 'bg-white/10'}`}>
                    <Upload className="w-7 h-7" />
                  </div>
                  <p className="text-white/80 mb-2 text-base">{isDragging ? 'Drop your ZIP file here' : 'Drop your codebase ZIP file here'}</p>
                  <p className="text-white/40 text-sm">or click to browse</p>
                </div>
              )}

              {activeTab === 'github' && (
                <div className="border-2 border-dashed border-white/20 rounded-xl p-10 sm:p-14">
                  <div className="space-y-3">
                    <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !isCloning && handleGitClone()} placeholder="https://github.com/owner/repo" disabled={isCloning} className="w-full px-4 py-3 input-glass text-sm" />
                    <div className="relative">
                      <input type={showToken ? 'text' : 'password'} value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder="Token (recommended)" disabled={isCloning} className="w-full px-4 py-3 pr-10 input-glass text-sm" />
                      <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/40">Avoids rate limits. Stored locally.</p>
                    <button onClick={handleGitClone} disabled={isCloning || !githubUrl.trim()} className="w-full btn-white py-3 text-sm flex items-center justify-center gap-2">
                      {isCloning ? <><Loader2 className="w-4 h-4 animate-spin" />Cloning...</> : <><ArrowRight className="w-4 h-4" />Clone</>}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'server' && (
                <div className="border-2 border-dashed border-white/20 rounded-xl p-10 sm:p-14">
                  <div className="space-y-3">
                    <input type="url" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !isConnecting && handleServerConnect()} placeholder="http://localhost:3000" disabled={isConnecting} className="w-full px-4 py-3 input-glass text-sm" />
                    <p className="text-xs text-white/40 text-center">Connect to a local or remote Weaveboard server</p>
                    <button onClick={handleServerConnect} disabled={isConnecting} className="w-full btn-white py-3 text-sm flex items-center justify-center gap-2">
                      {isConnecting ? <><Loader2 className="w-4 h-4 animate-spin" />Connecting...</> : <><ArrowRight className="w-4 h-4" />Connect to Server</>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-white/40 mt-4 sm:mt-8">Press <kbd className="px-2 py-0.5 glass rounded text-xs">{navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘K' : 'Ctrl+K'}</kbd> to search in app</p>
          
            <p className="mt-16 sm:mt-32 text-sm text-white/40">
              Like DeepWiki, but deeper. We let you analyze code — because a knowledge graph tracks every relationship.
            </p>
            
            <a href="#the-problem" className="inline-flex mt-8 text-white/30 hover:text-white/60 transition-colors">
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="the-problem" className="py-12 sm:py-16 px-3 sm:px-4 bg-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">The Problem</h2>
          <p className="text-lg text-white/70 mb-8">
            Tools like <span className="text-white font-medium">Cursor</span>, <span className="text-white font-medium">Claude Code</span>, <span className="text-white font-medium">Cline</span>, and <span className="text-white font-medium">Windsurf</span> are powerful — but they don't truly know your codebase structure.
          </p>
          
          <div className="glass rounded-2xl p-6 text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-red-500/20 rounded-lg flex-shrink-0">
                <Zap className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-white/90 mb-2"><span className="text-red-400 font-mono text-sm">AI edits UserService.validate()</span></p>
                <p className="text-white/60 text-sm">Doesn't know <span className="text-white font-medium">47 functions</span> depend on its return type</p>
                <p className="text-red-400 font-medium mt-2">Breaking changes ship</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4">
              <div className="text-2xl font-bold text-gradient mb-1">Reliability</div>
              <p className="text-sm text-white/50">LLM can't miss context — it's in the tool response</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-2xl font-bold text-gradient mb-1">Efficiency</div>
              <p className="text-sm text-white/50">No 10-query chains to understand one function</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-2xl font-bold text-gradient mb-1">Democratization</div>
              <p className="text-sm text-white/50">Smaller LLMs work because tools do the heavy lifting</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-20 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Weaveboard builds a complete knowledge graph of your codebase through a multi-phase indexing pipeline</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {howItWorksSteps.map((step, i) => (
              <div key={i} className="glass rounded-xl p-5 hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg mb-3">
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="text-xs text-white/40 mb-1">Step {i + 1}</div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-white/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Ways to Use */}
      <section className="py-12 sm:py-20 px-3 sm:px-4 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Two Ways to Use Weaveboard</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">CLI + MCP</h3>
                  <p className="text-sm text-white/50">Recommended</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm"><span className="text-white/60">What</span><span className="text-white">Index repos locally, connect AI agents via MCP</span></div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm"><span className="text-white/60">For</span><span className="text-white">Cursor, Claude Code, Windsurf, OpenCode</span></div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm"><span className="text-white/60">Scale</span><span className="text-white">Full repos, any size</span></div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm"><span className="text-white/60">Install</span><span className="text-white font-mono text-sm">npm install -g weaveboard</span></div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm"><span className="text-white/60">Privacy</span><span className="text-green-400">Everything local, no network</span></div>
              </div>
              <div className="text-xs text-white/40">Bridge: <code className="text-white/60">weaveboard serve</code></div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Web UI</h3>
                  <p className="text-sm text-white/50">Browser-based</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm"><span className="text-white/60">What</span><span className="text-white">Visual graph explorer + AI chat</span></div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm"><span className="text-white/60">For</span><span className="text-white">Quick exploration, demos</span></div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm"><span className="text-white/60">Scale</span><span className="text-white">~5k files or unlimited via backend</span></div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm"><span className="text-white/60">Install</span><span className="text-white">No install — weaveboard.pro</span></div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm"><span className="text-white/60">Privacy</span><span className="text-green-400">In-browser, no server</span></div>
              </div>
              <div className="text-xs text-white/40">Try now: <a href="https://weaveboard.pro" className="text-white/60 underline">weaveboard.pro</a></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 sm:py-20 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Features</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Precomputed relational intelligence — tools return complete context in one call</p>
          </div>

          <div className="space-y-6">
            {features.map((feature, i) => (
              <div key={i} className="glass rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-white/60 text-sm">{feature.desc}</p>
                  </div>
                  <div className="sm:w-80 flex-shrink-0">
                    <pre className="bg-black/50 rounded-lg p-3 text-xs font-mono text-white/80 break-all whitespace-normal">{feature.code}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MCP Tools */}
      <section id="tools" className="py-12 sm:py-20 px-3 sm:px-4 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Your AI Agent Gets</h2>
            <p className="text-white/60">7 tools exposed via MCP + 2 prompts</p>
          </div>

          <div className="glass rounded-xl overflow-x-auto mb-8">
            <table className="w-full text-sm min-w-[300px] sm:min-w-[400px]">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-white/70">Tool</th>
                    <th className="px-4 py-3 text-left font-medium text-white/70">What It Does</th>
                    <th className="px-4 py-3 text-left font-medium text-white/70">repo Param</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {mcpTools.map((tool, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-white">{tool.name}</td>
                      <td className="px-4 py-3 text-white/60">{tool.desc}</td>
                      <td className="px-4 py-3 text-white/50">{tool.param}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4">
              <h3 className="font-medium mb-2">2 MCP Prompts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-white/60">detect_impact — Pre-commit change analysis</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-white/60">generate_map — Architecture docs with mermaid</span></div>
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <h3 className="font-medium mb-2">4 Agent Skills</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-white/60">Exploring — Navigate unfamiliar code</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-white/60">Debugging — Trace bugs through call chains</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-white/60">Impact Analysis — Analyze blast radius</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-white/60">Refactoring — Plan safe refactors</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="py-12 sm:py-16 px-3 sm:px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">Supported Languages</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {languages.map((lang, i) => (
              <span key={i} className="px-4 py-2 glass rounded-full text-sm">{lang}</span>
            ))}
          </div>
          <p className="mt-4 text-white/40 text-sm">11 languages supported</p>
        </div>
      </section>

      {/* Quick Start / Docs */}
      <section id="docs" className="py-12 sm:py-20 px-3 sm:px-4 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Quick Start</h2>
            <p className="text-white/60">Get started with the CLI in seconds</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Terminal className="w-4 h-4" />CLI Commands</h3>
              <div className="space-y-2">
                {cliCommands.map((cmd, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm">
                    <code className="px-2 py-1 bg-black/50 rounded text-white/80 font-mono flex-shrink-0 whitespace-nowrap">{cmd.cmd}</code>
                    <span className="text-white/50">{cmd.desc}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 glass rounded-xl">
                <h4 className="font-medium mb-2">Quick Start</h4>
                <pre className="text-sm font-mono text-white/80">{`# Index your repo
npx weaveboard analyze

# Configure MCP
npx weaveboard setup`}</pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Cpu className="w-4 h-4" />Tech Stack</h3>
              <div className="glass rounded-xl overflow-x-auto">
                <table className="w-full text-sm min-w-[300px]">
                  <thead className="bg-white/5">
                    <tr><th className="px-4 py-2 text-left font-medium text-white/70">Layer</th><th className="px-4 py-2 text-left font-medium text-white/70">CLI</th><th className="px-4 py-2 text-left font-medium text-white/70">Web</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    <tr><td className="px-4 py-2 text-white/60">Runtime</td><td className="px-4 py-2">Node.js</td><td className="px-4 py-2">WASM</td></tr>
                    <tr><td className="px-4 py-2 text-white/60">Parsing</td><td className="px-4 py-2">Tree-sitter</td><td className="px-4 py-2">Tree-sitter WASM</td></tr>
                    <tr><td className="px-4 py-2 text-white/60">Database</td><td className="px-4 py-2">KuzuDB</td><td className="px-4 py-2">KuzuDB WASM</td></tr>
                    <tr><td className="px-4 py-2 text-white/60">Search</td><td className="px-4 py-2">BM25 + semantic</td><td className="px-4 py-2">BM25 + semantic</td></tr>
                    <tr><td className="px-4 py-2 text-white/60">Frontend</td><td className="px-4 py-2">—</td><td className="px-4 py-2">React 18, Vite, Tailwind</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-12 sm:py-16 px-3 sm:px-4">
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="w-12 h-12 flex items-center justify-center bg-green-500/20 rounded-xl mx-auto mb-4">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Security & Privacy</h2>
            <div className="grid sm:grid-cols-2 gap-6 text-left mt-6">
              <div>
                <h3 className="font-medium text-white mb-2">CLI</h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li>• Everything runs locally on your machine</li>
                  <li>• No network calls</li>
                  <li>• Index stored in <code className="text-white/80">.weaveboard/</code></li>
                  <li>• Global registry stores only paths</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">Web</h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li>• Everything runs in your browser</li>
                  <li>• No code uploaded to any server</li>
                  <li>• API keys stored in localStorage only</li>
                  <li>• Open source — audit the code yourself</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Token Banner */}
      <TokenBanner onNavigate={onNavigateToWeave} />

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Weaveboard" className="w-6 h-6 rounded shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-1 ring-white/20" />
            <span className="font-medium">Weaveboard</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="https://github.com/biselxbt/weaveboard" aria-label="GitHub" className="hover:text-white transition-colors">GitHub</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </div>
          
          <p className="text-sm text-white/40">© 2026 Weaveboard. Open Source.</p>
        </div>
      </footer>
    </div>
  );
};
