import { Brain, Loader2, Check, AlertCircle, Zap, FlaskConical } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { useState } from 'react';
import { WebGPUFallbackDialog } from './WebGPUFallbackDialog';

export const EmbeddingStatus = () => {
  const {
    embeddingStatus,
    embeddingProgress,
    startEmbeddings,
    graph,
    viewMode,
    serverBaseUrl,
    testArrayParams,
  } = useAppState();

  const [testResult, setTestResult] = useState<string | null>(null);
  const [showFallbackDialog, setShowFallbackDialog] = useState(false);

  if (viewMode !== 'exploring' || !graph || serverBaseUrl) return null;

  const nodeCount = graph.nodes.length;

  const handleStartEmbeddings = async (forceDevice?: 'webgpu' | 'wasm') => {
    try {
      await startEmbeddings(forceDevice);
    } catch (error: any) {
      if (error?.name === 'WebGPUNotAvailableError' || 
          error?.message?.includes('WebGPU not available')) {
        setShowFallbackDialog(true);
      } else {
        console.error('Embedding failed:', error);
      }
    }
  };

  const handleUseCPU = () => {
    setShowFallbackDialog(false);
    handleStartEmbeddings('wasm');
  };

  const handleSkipEmbeddings = () => {
    setShowFallbackDialog(false);
  };
  
  const handleTestArrayParams = async () => {
    setTestResult('Testing...');
    const result = await testArrayParams();
    if (result.success) {
      setTestResult('✅ Array params WORK!');
      console.log('✅ Array params test passed!');
    } else {
      setTestResult(`❌ ${result.error}`);
      console.error('❌ Array params test failed:', result.error);
    }
  };

  const fallbackDialog = (
    <WebGPUFallbackDialog
      isOpen={showFallbackDialog}
      onClose={() => setShowFallbackDialog(false)}
      onUseCPU={handleUseCPU}
      onSkip={handleSkipEmbeddings}
      nodeCount={nodeCount}
    />
  );

  if (embeddingStatus === 'idle') {
    return (
      <>
        <div className="flex items-center gap-2">
          {import.meta.env.DEV && (
            <button
              onClick={handleTestArrayParams}
              className="flex items-center gap-1 px-2 py-1.5 glass rounded-lg text-xs text-text-muted hover:bg-white/10 transition-all"
              title="Test if KuzuDB supports array params"
            >
              <FlaskConical className="w-3 h-3" />
              {testResult || 'Test'}
            </button>
          )}
          
          <button
            onClick={() => handleStartEmbeddings()}
            className="flex items-center gap-2 px-3 py-1.5 glass border border-border-subtle rounded-full text-sm text-text-secondary hover:bg-white/10 hover:text-white transition-all group"
            title="Generate embeddings for semantic search"
          >
            <Brain className="w-4 h-4 group-hover:animate-pulse" />
            <span className="hidden sm:inline">Enable Semantic Search</span>
            <Zap className="w-3 h-3 text-text-muted" />
          </button>
        </div>
        {fallbackDialog}
      </>
    );
  }

  if (embeddingStatus === 'loading') {
    const downloadPercent = embeddingProgress?.modelDownloadPercent ?? 0;
    return (
      <>
        <div className="flex items-center gap-2.5 px-3 py-1.5 glass border border-white/20 rounded-full text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <div className="flex flex-col gap-0.5">
            <span className="text-text-secondary text-xs">Loading AI model...</span>
            <div className="w-20 h-1 glass rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${downloadPercent}%` }}
              />
            </div>
          </div>
        </div>
        {fallbackDialog}
      </>
    );
  }

  if (embeddingStatus === 'embedding') {
    const processed = embeddingProgress?.nodesProcessed ?? 0;
    const total = embeddingProgress?.totalNodes ?? 0;
    const percent = embeddingProgress?.percent ?? 0;
    
    return (
      <div className="flex items-center gap-2.5 px-3 py-1.5 glass border border-white/20 rounded-full text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <div className="flex flex-col gap-0.5">
          <span className="text-text-secondary text-xs">
            Embedding {processed}/{total}
          </span>
          <div className="w-20 h-1 glass rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (embeddingStatus === 'indexing') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 glass border border-white/20 rounded-full text-sm text-text-secondary">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Creating vector index...</span>
      </div>
    );
  }

  if (embeddingStatus === 'ready') {
    return (
      <div 
        className="flex items-center gap-2 px-3 py-1.5 glass border border-white/30 rounded-full text-sm"
        title="Semantic search is ready!"
      >
        <Check className="w-4 h-4" />
        <span className="text-xs font-medium">Semantic Ready</span>
      </div>
    );
  }

  if (embeddingStatus === 'error') {
    return (
      <>
        <button
          onClick={() => handleStartEmbeddings()}
          className="flex items-center gap-2 px-3 py-1.5 glass border border-red-500/30 rounded-full text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          title={embeddingProgress?.error || 'Embedding failed. Click to retry.'}
        >
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs">Failed - Retry</span>
        </button>
        {fallbackDialog}
      </>
    );
  }

  return null;
};
