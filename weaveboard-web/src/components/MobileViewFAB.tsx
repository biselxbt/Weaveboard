import { Network, FolderOpen, MessageCircle, GitBranch } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';

export const MobileViewFAB = () => {
  const { mobileView, setMobileView, isRightPanelOpen, setRightPanelOpen, isFileTreeOpen, setFileTreeOpen, rightPanelTab, setRightPanelTab } = useAppState();

  const cycleView = () => {
    const views: Array<'graph' | 'filetree' | 'ai'> = ['graph', 'filetree', 'ai'];
    const currentIndex = views.indexOf(mobileView as any);
    const nextIndex = (currentIndex + 1) % views.length;
    const nextView = views[nextIndex];

    // Update related state based on view
    if (nextView === 'graph') {
      setFileTreeOpen(false);
      setRightPanelOpen(false);
    } else if (nextView === 'filetree') {
      setFileTreeOpen(true);
      setRightPanelOpen(false);
    } else if (nextView === 'ai') {
      setFileTreeOpen(false);
      setRightPanelOpen(true);
      // Toggle between chat and processes
      if (rightPanelTab === 'chat') {
        setRightPanelTab('processes');
      } else if (rightPanelTab === 'processes') {
        setRightPanelTab('chat');
      } else {
        setRightPanelTab('chat');
      }
    }

    setMobileView(nextView);
  };

  const getIcon = () => {
    switch (mobileView) {
      case 'graph': return <Network className="w-5 h-5" />;
      case 'filetree': return <FolderOpen className="w-5 h-5" />;
      case 'ai':
      case 'chat':
      case 'processes':
        return rightPanelTab === 'processes' ? <GitBranch className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    switch (mobileView) {
      case 'graph': return 'Graph';
      case 'filetree': return 'Files';
      case 'ai':
      case 'chat':
      case 'processes':
        return rightPanelTab === 'processes' ? 'Processes' : 'AI Chat';
    }
  };

  return (
    <button
      onClick={cycleView}
      className="sm:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 glass-strong border border-white/20 rounded-full shadow-glass hover:bg-white/10 transition-all active:scale-95"
      title={`Current: ${getLabel()} - Tap to switch`}
    >
      {getIcon()}
      <span className="text-sm font-medium">{getLabel()}</span>
    </button>
  );
};
