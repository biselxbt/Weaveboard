import { Network, FolderOpen, MessageCircle, Settings, GitBranch, Sparkles } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';

export const BottomNav = () => {
  const { 
    mobileView, 
    setMobileView, 
    setFileTreeOpen, 
    setRightPanelOpen, 
    setRightPanelTab,
    setSettingsPanelOpen,
    isRightPanelOpen,
    isFileTreeOpen,
    rightPanelTab
  } = useAppState();

  const handleViewChange = (view: 'graph' | 'filetree' | 'ai') => {
    setMobileView(view);
    
    if (view === 'graph') {
      setFileTreeOpen(false);
      setRightPanelOpen(false);
    } else if (view === 'filetree') {
      setFileTreeOpen(true);
      setRightPanelOpen(false);
    } else if (view === 'ai') {
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
  };

  const handleSettings = () => {
    setSettingsPanelOpen(true);
  };

  const navItems = [
    { 
      id: 'graph' as const, 
      icon: Network, 
      label: 'Graph',
      isActive: mobileView === 'graph' && !isFileTreeOpen && !isRightPanelOpen
    },
    { 
      id: 'filetree' as const, 
      icon: FolderOpen, 
      label: 'Files',
      isActive: isFileTreeOpen
    },
    { 
      id: 'ai' as const, 
      icon: mobileView === 'processes' ? GitBranch : MessageCircle, 
      label: rightPanelTab === 'processes' ? 'Processes' : 'AI Chat',
      isActive: isRightPanelOpen
    },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all min-w-[60px] ${
                item.isActive 
                  ? 'text-accent bg-white/10' 
                  : 'text-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${item.isActive ? 'text-accent' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        
        <button
          onClick={handleSettings}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all text-text-muted hover:text-white hover:bg-white/5 min-w-[60px]"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
};
