import { useCallback, useEffect, useRef, useState } from 'react';
import { AppStateProvider, useAppState } from './hooks/useAppState';
import { LandingPage } from './components/LandingPage';
import { WeavePage } from './components/WeavePage';
import { DropZone } from './components/DropZone';
import { LoadingOverlay } from './components/LoadingOverlay';
import { Header } from './components/Header';
import { GraphCanvas, GraphCanvasHandle } from './components/GraphCanvas';
import { RightPanel } from './components/RightPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { StatusBar } from './components/StatusBar';
import { FileTreePanel } from './components/FileTreePanel';
import { CodeReferencesPanel } from './components/CodeReferencesPanel';
import { MobileViewFAB } from './components/MobileViewFAB';
import { BottomNav } from './components/BottomNav';
import { FileEntry } from './services/zip';
import { getActiveProviderConfig } from './core/llm/settings-service';
import { createKnowledgeGraph } from './core/graph/graph';
import { connectToServer, fetchRepos, normalizeServerUrl, type ConnectToServerResult } from './services/server-connection';
import { X } from 'lucide-react';

const AppContent = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [showWeavePage, setShowWeavePage] = useState(false);
  const {
    viewMode,
    setViewMode,
    setGraph,
    setFileContents,
    setProgress,
    setProjectName,
    progress,
    isRightPanelOpen,
    isFileTreeOpen,
    setFileTreeOpen,
    runPipeline,
    runPipelineFromFiles,
    isSettingsPanelOpen,
    setSettingsPanelOpen,
    refreshLLMSettings,
    initializeAgent,
    startEmbeddings,
    embeddingStatus,
    codeReferences,
    selectedNode,
    isCodePanelOpen,
    setCodePanelOpen,
    serverBaseUrl,
    setServerBaseUrl,
    availableRepos,
    setAvailableRepos,
    switchRepo,
  } = useAppState();

  const graphCanvasRef = useRef<GraphCanvasHandle>(null);

  const handleEnterApp = useCallback(() => {
    setShowLanding(false);
  }, []);

  const handleBackToLanding = useCallback(() => {
    setShowLanding(true);
    setViewMode('onboarding');
  }, [setViewMode]);

  const handleFileSelect = useCallback(async (file: File) => {
    setShowLanding(false);
    const projectName = file.name.replace('.zip', '');
    setProjectName(projectName);
    setProgress({ phase: 'extracting', percent: 0, message: 'Starting...', detail: 'Preparing to extract files' });
    setViewMode('loading');

    try {
      const result = await runPipeline(file, (progress) => {
        setProgress(progress);
      });

      setGraph(result.graph);
      setFileContents(result.fileContents);
      setViewMode('exploring');

      if (getActiveProviderConfig()) {
        initializeAgent(projectName);
      }

      startEmbeddings().catch((err) => {
        if (err?.name === 'WebGPUNotAvailableError' || err?.message?.includes('WebGPU')) {
          startEmbeddings('wasm').catch(console.warn);
        } else {
          console.warn('Embeddings auto-start failed:', err);
        }
      });
    } catch (error) {
      console.error('Pipeline error:', error);
      setProgress({
        phase: 'error',
        percent: 0,
        message: 'Error processing file',
        detail: error instanceof Error ? error.message : 'Unknown error',
      });
      setTimeout(() => {
        setViewMode('onboarding');
        setProgress(null);
      }, 3000);
    }
  }, [setViewMode, setGraph, setFileContents, setProgress, setProjectName, runPipeline, startEmbeddings, initializeAgent]);

  const handleGitClone = useCallback(async (files: FileEntry[], repoName?: string) => {
    setShowLanding(false);
    // Use the repo name from GitHub URL if available, otherwise extract from file paths
    const projectName = repoName || files[0]?.path.split('/')[0].replace(/-\d+$/, '') || 'repository';

    setProjectName(projectName);
    setProgress({ phase: 'extracting', percent: 0, message: 'Starting...', detail: 'Preparing to process files' });
    setViewMode('loading');

    try {
      const result = await runPipelineFromFiles(files, (progress) => {
        setProgress(progress);
      });

      setGraph(result.graph);
      setFileContents(result.fileContents);
      setViewMode('exploring');

      if (getActiveProviderConfig()) {
        initializeAgent(projectName);
      }

      startEmbeddings().catch((err) => {
        if (err?.name === 'WebGPUNotAvailableError' || err?.message?.includes('WebGPU')) {
          startEmbeddings('wasm').catch(console.warn);
        } else {
          console.warn('Embeddings auto-start failed:', err);
        }
      });
    } catch (error) {
      console.error('Pipeline error:', error);
      setProgress({
        phase: 'error',
        percent: 0,
        message: 'Error processing repository',
        detail: error instanceof Error ? error.message : 'Unknown error',
      });
      setTimeout(() => {
        setViewMode('onboarding');
        setProgress(null);
      }, 3000);
    }
  }, [setViewMode, setGraph, setFileContents, setProgress, setProjectName, runPipelineFromFiles, startEmbeddings, initializeAgent]);

  const handleServerConnect = useCallback((result: ConnectToServerResult, serverUrl?: string) => {
    setShowLanding(false);
    const repoPath = result.repoInfo.repoPath;
    const projectName = repoPath.split('/').pop() || 'server-project';
    setProjectName(projectName);

    const graph = createKnowledgeGraph();
    for (const node of result.nodes) {
      graph.addNode(node);
    }
    for (const rel of result.relationships) {
      graph.addRelationship(rel);
    }
    setGraph(graph);

    const fileMap = new Map<string, string>();
    for (const [path, content] of Object.entries(result.fileContents)) {
      fileMap.set(path, content);
    }
    setFileContents(fileMap);

    setViewMode('exploring');

    if (getActiveProviderConfig()) {
      initializeAgent(projectName);
    }

    startEmbeddings().catch((err) => {
      if (err?.name === 'WebGPUNotAvailableError' || err?.message?.includes('WebGPU')) {
        startEmbeddings('wasm').catch(console.warn);
      } else {
        console.warn('Embeddings auto-start failed:', err);
      }
    });

    if (serverUrl) {
      const baseUrl = normalizeServerUrl(serverUrl);
      setServerBaseUrl(baseUrl);
      fetchRepos(baseUrl).then(setAvailableRepos).catch(console.warn);
    }
  }, [setViewMode, setGraph, setFileContents, setProjectName, initializeAgent, startEmbeddings, setServerBaseUrl, setAvailableRepos]);

  const autoConnectRan = useRef(false);
  useEffect(() => {
    if (autoConnectRan.current) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('server')) return;
    autoConnectRan.current = true;

    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);

    setProgress({ phase: 'extracting', percent: 0, message: 'Connecting to server...', detail: 'Validating server' });
    setViewMode('loading');

    const serverUrl = params.get('server') || window.location.origin;
    const baseUrl = normalizeServerUrl(serverUrl);

    connectToServer(serverUrl, (phase, downloaded, total) => {
      if (phase === 'validating') {
        setProgress({ phase: 'extracting', percent: 5, message: 'Connecting to server...', detail: 'Validating server' });
      } else if (phase === 'downloading') {
        const pct = total ? Math.round((downloaded / total) * 90) + 5 : 50;
        const mb = (downloaded / (1024 * 1024)).toFixed(1);
        setProgress({ phase: 'extracting', percent: pct, message: 'Downloading graph...', detail: `${mb} MB downloaded` });
      } else if (phase === 'extracting') {
        setProgress({ phase: 'extracting', percent: 97, message: 'Processing...', detail: 'Extracting file contents' });
      }
    }).then(async (result) => {
      handleServerConnect(result, serverUrl);
    }).catch((err) => {
      console.error('Auto-connect failed:', err);
      setProgress({
        phase: 'error',
        percent: 0,
        message: 'Failed to connect to server',
        detail: err instanceof Error ? err.message : 'Unknown error',
      });
      setTimeout(() => {
        setViewMode('onboarding');
        setProgress(null);
      }, 3000);
    });
  }, [handleServerConnect, setProgress, setViewMode, setServerBaseUrl, setAvailableRepos]);

  const handleFocusNode = useCallback((nodeId: string) => {
    graphCanvasRef.current?.focusNode(nodeId);
  }, []);

  const handleSettingsSaved = useCallback(() => {
    refreshLLMSettings();
    initializeAgent();
  }, [refreshLLMSettings, initializeAgent]);

  // Show Weave token page
  if (showWeavePage) {
    return <WeavePage onBack={() => setShowWeavePage(false)} />;
  }

  // Show landing page
  if (showLanding && viewMode === 'onboarding') {
    return (
      <LandingPage 
        onEnterApp={handleEnterApp}
        onFileSelect={handleFileSelect}
        onGitClone={handleGitClone}
        onServerConnect={handleServerConnect}
        onNavigateToWeave={() => setShowWeavePage(true)}
      />
    );
  }

  // Show compact dropzone when onboarding but not from landing
  if (viewMode === 'onboarding') {
    return (
      <>
        <Header onBackToLanding={handleBackToLanding} onNavigateToWeave={() => setShowWeavePage(true)} />
        <DropZone
          onFileSelect={handleFileSelect}
          onGitClone={handleGitClone}
          onServerConnect={handleServerConnect}
          compact
        />
      </>
    );
  }

  if (viewMode === 'loading' && progress) {
    return <LoadingOverlay progress={progress} />;
  }

  // Exploring view
  return (
    <div className="flex flex-col h-screen bg-void overflow-hidden">
      <Header onFocusNode={handleFocusNode} availableRepos={availableRepos} onSwitchRepo={switchRepo} onBackToLanding={handleBackToLanding} />

      {/* Mobile: Desktop recommended banner */}
      <div className="sm:hidden px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 text-center">
        <p className="text-[11px] text-amber-300">
          For best experience, use desktop view
        </p>
      </div>

      <main className="flex-1 flex min-h-0 pb-16 sm:pb-0">
        {/* Desktop: always visible. Mobile: controlled by isFileTreeOpen */}
        <div className={`hidden sm:block ${isFileTreeOpen ? 'block' : ''}`}>
          <FileTreePanel onFocusNode={handleFocusNode} />
        </div>
        {/* Mobile: slide-in overlay when isFileTreeOpen is true */}
        {isFileTreeOpen && (
          <div className="sm:hidden fixed inset-0 z-30">
            {/* Backdrop - tap to close */}
            <div 
              className="absolute inset-0 bg-void/60"
              onClick={() => setFileTreeOpen(false)}
            />
            {/* Floating Close Button */}
            <button 
              className="absolute top-4 right-4 z-50 p-3 bg-red-500/80 hover:bg-red-500 rounded-full shadow-lg active:scale-95 transition-all"
              onClick={() => setFileTreeOpen(false)}
              title="Close Files"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {/* Panel */}
            <div className="absolute inset-0 pt-12 pb-20 pointer-events-auto">
              <FileTreePanel onFocusNode={handleFocusNode} />
            </div>
          </div>
        )}

        <div className="flex-1 relative min-w-0 overflow-hidden">
          <GraphCanvas ref={graphCanvasRef} />

          {isCodePanelOpen && (codeReferences.length > 0 || !!selectedNode) && (
            <>
              {/* Backdrop - tap to close */}
              <div 
                className="sm:hidden fixed inset-0 z-40 bg-void/60"
                onClick={() => setCodePanelOpen(false)}
              />
              {/* Floating Close Button - always visible on mobile */}
              <button 
                className="sm:hidden fixed top-4 right-4 z-50 p-3 bg-red-500/80 hover:bg-red-500 rounded-full shadow-lg active:scale-95 transition-all"
                onClick={() => setCodePanelOpen(false)}
                title="Close Code Inspector"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              {/* Panel - full screen on mobile */}
              <div className="sm:hidden absolute inset-0 z-40 pt-12 pb-20 pointer-events-auto">
                <CodeReferencesPanel onFocusNode={handleFocusNode} />
              </div>
              {/* Desktop: partial overlay */}
              <div className="hidden sm:block absolute inset-y-0 left-0 z-30 pointer-events-auto">
                <CodeReferencesPanel onFocusNode={handleFocusNode} />
              </div>
            </>
          )}
        </div>

        {isRightPanelOpen && <RightPanel />}
      </main>

      <StatusBar />

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      <SettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
        onSettingsSaved={handleSettingsSaved}
      />
    </div>
  );
};

function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;
