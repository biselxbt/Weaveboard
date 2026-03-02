import { PipelineProgress } from '../types/pipeline';
import logoUrl from '../assets/logo.png';

interface LoadingOverlayProps {
  progress: PipelineProgress;
}

export const LoadingOverlay = ({ progress }: LoadingOverlayProps) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-void z-50">
      {/* Logo */}
      <div className="relative mb-10">
        <img 
          src={logoUrl} 
          alt="Weaveboard" 
          className="w-28 h-28 rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.4)] ring-2 ring-white/30" 
        />
      </div>

      {/* Progress bar */}
      <div className="w-80 mb-4">
        <div className="h-1.5 glass rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="font-mono text-sm text-white mb-1">
          {progress.message}
          <span className="animate-pulse">|</span>
        </p>
        {progress.detail && (
          <p className="font-mono text-xs text-text-muted truncate max-w-md">
            {progress.detail}
          </p>
        )}
      </div>

      {/* Stats */}
      {progress.stats && (
        <div className="mt-8 flex items-center gap-6 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-node-file rounded-full" />
            <span>{progress.stats.filesProcessed} / {progress.stats.totalFiles} files</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-node-function rounded-full" />
            <span>{progress.stats.nodesCreated} nodes</span>
          </div>
        </div>
      )}

      {/* Percent */}
      <p className="mt-4 font-mono text-3xl font-semibold text-white">
        {progress.percent}%
      </p>
    </div>
  );
};
