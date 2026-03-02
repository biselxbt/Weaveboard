import { Search, Settings, Sparkles, Github, Star, ChevronDown, Folder, FolderOpen, MessageCircle, PanelRight, PanelRightClose } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import type { RepoSummary } from '../services/server-connection';
import { useState, useMemo, useRef, useEffect } from 'react';
import { GraphNode } from '../core/graph/types';
import { EmbeddingStatus } from './EmbeddingStatus';
import logoUrl from '../assets/logo.png';

const NODE_TYPE_COLORS: Record<string, string> = {
  Folder: '#6366f1',
  File: '#3b82f6',
  Function: '#10b981',
  Class: '#f59e0b',
  Method: '#14b8a6',
  Interface: '#ec4899',
  Variable: '#64748b',
  Import: '#475569',
  Type: '#a78bfa',
};

interface HeaderProps {
  onFocusNode?: (nodeId: string) => void;
  availableRepos?: RepoSummary[];
  onSwitchRepo?: (repoName: string) => void;
  onBackToLanding?: () => void;
  onNavigateToWeave?: () => void;
}

export const Header = ({ onFocusNode, availableRepos = [], onSwitchRepo, onBackToLanding, onNavigateToWeave }: HeaderProps) => {
  const {
    projectName,
    graph,
    openChatPanel,
    isRightPanelOpen,
    rightPanelTab,
    setSettingsPanelOpen,
    setRightPanelOpen,
  } = useAppState();
  const [isRepoDropdownOpen, setIsRepoDropdownOpen] = useState(false);
  const repoDropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const nodeCount = graph?.nodes.length ?? 0;
  const edgeCount = graph?.relationships.length ?? 0;

  const searchResults = useMemo(() => {
    if (!graph || !searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return graph.nodes
      .filter(node => node.properties.name.toLowerCase().includes(query))
      .slice(0, 10);
  }, [graph, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (repoDropdownRef.current && !repoDropdownRef.current.contains(e.target as Node)) {
        setIsRepoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchOpen || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = searchResults[selectedIndex];
      if (selected) {
        onFocusNode?.(selected.id);
        setSearchQuery('');
        setIsSearchOpen(false);
        setSelectedIndex(0);
      }
    }
  };

  const handleSelectNode = (node: GraphNode) => {
    onFocusNode?.(node.id);
    setSearchQuery('');
    setIsSearchOpen(false);
    setSelectedIndex(0);
  };

  return (
    <header className="flex items-center justify-between px-4 sm:px-5 py-3 glass border-b border-border-subtle">
      {/* Left section */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Logo + Back button */}
        <div className="flex items-center gap-2.5">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="p-1.5 -ml-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-4 h-4 rotate-90 text-text-muted" />
            </button>
          )}
          <img src={logoUrl} alt="Weaveboard" className="w-9 h-9 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.4)] ring-1 ring-white/30" />
          <span className="font-semibold text-lg hidden sm:block">Weaveboard</span>
        </div>

        {/* Project badge */}
        {projectName && (
          <div className="relative" ref={repoDropdownRef}>
            <button
              onClick={() => availableRepos.length >= 2 && setIsRepoDropdownOpen(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 glass-strong border border-white/10 rounded-xl text-sm transition-all hover:bg-white/10 hover:border-white/20 ${availableRepos.length >= 2 ? 'cursor-pointer' : ''}`}
            >
              <div className="w-5 h-5 flex items-center justify-center bg-gradient-to-br from-amber-400/30 to-orange-500/30 rounded-md">
                <FolderOpen className="w-3 h-3 text-amber-400" />
              </div>
              <span className="truncate max-w-[150px] sm:max-w-[200px] font-medium text-white">{projectName}</span>
              {availableRepos.length >= 2 && (
                <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${isRepoDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {isRepoDropdownOpen && availableRepos.length >= 2 && (
              <div className="absolute top-full left-0 mt-2 glass-strong rounded-xl shadow-glass overflow-hidden z-50">
                {availableRepos.map((repo) => {
                  const isCurrent = repo.name === projectName;
                  return (
                    <button
                      key={repo.name}
                      onClick={() => {
                        if (!isCurrent && onSwitchRepo) {
                          onSwitchRepo(repo.name);
                        }
                        setIsRepoDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${isCurrent ? 'bg-white/10 border-l-2 border-white' : 'hover:bg-white/5 border-l-2 border-transparent'}`}
                    >
                      <div className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-lg flex-shrink-0">
                        <Folder className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${isCurrent ? 'text-white' : 'text-text-primary'}`}>
                          {repo.name}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">
                          {repo.stats?.nodes ?? '?'} nodes · {repo.stats?.files ?? '?'} files
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center - Search - hidden on xs, visible on sm+ */}
      <div className="hidden sm:block flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-4 relative" ref={searchRef}>
        <div className="flex items-center gap-2 px-3 py-2 glass border border-border-subtle rounded-full transition-all focus-within:border-white/50 focus-within:bg-white/10">
          <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search nodes..."
            aria-label="Search nodes"
            aria-expanded={isSearchOpen && searchQuery.trim().length > 0}
            aria-controls="search-results"
            aria-activedescendant={searchResults[selectedIndex] ? `search-result-${selectedIndex}` : undefined}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
              setSelectedIndex(0);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-text-muted min-w-0"
          />
          <kbd className="px-1.5 py-0.5 glass rounded text-[10px] text-text-muted font-mono hidden sm:inline">
            {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </div>

        {isSearchOpen && searchQuery.trim() && (
          <div 
            id="search-results"
            role="listbox"
            aria-label="Search results"
            className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-xl shadow-glass overflow-hidden z-50 max-h-80 overflow-y-auto"
          >
            {searchResults.length === 0 ? (
              <div className="px-4 py-3 text-sm text-text-muted">
                No nodes found for "{searchQuery}"
              </div>
            ) : (
              <div role="presentation">
                {searchResults.map((node, index) => (
                  <button
                    id={`search-result-${index}`}
                    role="option"
                    aria-selected={index === selectedIndex}
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${index === selectedIndex
                      ? 'bg-white/20 text-white'
                      : 'hover:bg-white/5 text-text-secondary'
                      }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: NODE_TYPE_COLORS[node.label] || '#6b7280' }}
                    />
                    <span className="flex-1 truncate text-sm font-medium">
                      {node.properties.name}
                    </span>
                    <span className="text-xs text-text-muted px-2 py-0.5 glass rounded">
                      {node.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Stats */}
        {graph && (
          <div className="hidden lg:flex items-center gap-4 mr-2 text-xs text-text-muted">
            <span>{nodeCount} nodes</span>
            <span>{edgeCount} edges</span>
          </div>
        )}

        {/* Embedding Status */}
        <EmbeddingStatus />

        {/* $WEAVE Token Button */}
        {onNavigateToWeave && (
          <button
            onClick={onNavigateToWeave}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-600/80 hover:bg-purple-600 text-white transition-colors"
            title="$WEAVE Token"
          >
            <span>🪙</span>
            <span>$WEAVE</span>
          </button>
        )}

        {/* Mobile: Search button (hidden on sm+) */}
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full glass hover:bg-white/10 transition-colors"
          title="Search"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>

        {/* Icon buttons - hidden on mobile since BottomNav handles it */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={() => setSettingsPanelOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full glass hover:bg-white/10 transition-colors"
            title="AI Settings"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* AI Button - hidden on mobile since FAB handles it */}
        <button
          onClick={openChatPanel}
          className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
            isRightPanelOpen && rightPanelTab === 'chat'
              ? 'bg-white text-black shadow-glow'
              : 'btn-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI</span>
        </button>
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div 
          className="sm:hidden fixed inset-0 z-[100] bg-void"
          onClick={() => setIsMobileSearchOpen(false)}
        >
          <div 
            className="absolute top-0 left-0 right-0 bg-void/98 backdrop-blur-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 -ml-2 text-text-muted hover:text-white"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              <div className="flex-1">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsMobileSearchOpen(false);
                    }
                    handleKeyDown(e);
                  }}
                  className="w-full bg-white/10 border border-border-subtle rounded-full px-4 py-2.5 text-sm text-white placeholder:text-text-muted outline-none focus:border-white/50"
                />
              </div>
            </div>
          </div>
          <div className="pt-24 px-4 pb-4 h-full overflow-y-auto">
            {searchResults.length === 0 ? (
              searchQuery.trim() ? (
                <div className="text-sm text-text-muted text-center py-8">
                  No nodes found for "{searchQuery}"
                </div>
              ) : (
                <div className="text-sm text-text-muted text-center py-8">
                  Type to search...
                </div>
              )
            ) : (
              <div className="space-y-1">
                {searchResults.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => {
                      onFocusNode?.(node.id);
                      setSearchQuery('');
                      setIsMobileSearchOpen(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: NODE_TYPE_COLORS[node.label] || '#6b7280' }}
                    />
                    <span className="flex-1 truncate text-sm font-medium text-white">
                      {node.properties.name}
                    </span>
                    <span className="text-xs text-text-muted px-2 py-0.5 bg-white/10 rounded">
                      {node.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
