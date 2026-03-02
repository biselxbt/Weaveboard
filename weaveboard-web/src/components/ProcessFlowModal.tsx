/**
 * Process Flow Modal
 * 
 * Displays a Mermaid flowchart for a process in a centered modal popup.
 * Uses new glassmorphism design system with mobile support.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { X, GitBranch, Copy, Focus, Layers, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import mermaid from 'mermaid';
import { ProcessData, generateProcessMermaid } from '../lib/mermaid-generator';

interface ProcessFlowModalProps {
    process: ProcessData | null;
    onClose: () => void;
    onFocusInGraph?: (nodeIds: string[], processId: string) => void;
    isFullScreen?: boolean;
}

// Initialize mermaid with white theme matching new Weaveboard design
mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
    maxTextSize: 900000,
    theme: 'base',
    themeVariables: {
        primaryColor: '#0a0a0a',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#ffffff',
        lineColor: 'rgba(255, 255, 255, 0.4)',
        secondaryColor: '#0a0a0a',
        tertiaryColor: '#000000',
        mainBkg: '#0a0a0a',
        nodeBorder: '#ffffff',
        clusterBkg: '#0a0a0a',
        clusterBorder: 'rgba(255, 255, 255, 0.2)',
        titleColor: '#ffffff',
        edgeLabelBackground: '#000000',
    },
    flowchart: {
        curve: 'basis',
        padding: 50,
        nodeSpacing: 120,
        rankSpacing: 140,
        htmlLabels: true,
    },
});

// Suppress distinct syntax error overlay
mermaid.parseError = (err) => {
    console.debug('Mermaid parse error (suppressed):', err);
};

export const ProcessFlowModal = ({ process, onClose, onFocusInGraph, isFullScreen = false }: ProcessFlowModalProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const diagramRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    // Full process map gets higher default zoom (667%) and max zoom (3000%)
    const defaultZoom = isFullScreen ? 6.67 : 1;
    const maxZoom = isFullScreen ? 30 : 10;
    
    const [zoom, setZoom] = useState(defaultZoom);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    
    // Reset zoom when switching between full screen and regular mode
    useEffect(() => {
        setZoom(defaultZoom);
        setPan({ x: 0, y: 0 });
    }, [isFullScreen, defaultZoom]);

    // Handle zoom with scroll wheel
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY * -0.001;
            setZoom(prev => Math.min(Math.max(0.1, prev + delta), maxZoom));
        };

        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, [process, maxZoom]); // Re-attach when process or maxZoom changes

    // Handle keyboard zoom
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '+' || e.key === '=') {
                setZoom(prev => Math.min(prev + 0.2, maxZoom));
            } else if (e.key === '-' || e.key === '_') {
                setZoom(prev => Math.max(prev - 0.2, 0.1));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [maxZoom]);

    // Zoom in/out handlers
    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + 0.25, maxZoom));
    }, [maxZoom]);

    const handleZoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - 0.25, 0.1));
    }, []);

    // Handle pan with mouse drag
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }, [pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning) return;
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }, [isPanning, panStart]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    const resetView = useCallback(() => {
        setZoom(defaultZoom);
        setPan({ x: 0, y: 0 });
    }, [defaultZoom]);

    // Render mermaid diagram
    useEffect(() => {
        if (!process || !diagramRef.current) return;

        const renderDiagram = async () => {
            try {
                // Check if we have raw mermaid code (from AI chat) or need to generate it
                const mermaidCode = (process as any).rawMermaid
                    ? (process as any).rawMermaid
                    : generateProcessMermaid(process);
                const id = `mermaid-${Date.now()}`;

                // Clear previous content
                diagramRef.current!.innerHTML = '';

                const { svg } = await mermaid.render(id, mermaidCode);
                diagramRef.current!.innerHTML = svg;
            } catch (error) {
                console.error('Mermaid render error:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                const isSizeError = errorMessage.includes('Maximum') || errorMessage.includes('exceeded');

                diagramRef.current!.innerHTML = `
          <div class="flex flex-col items-center justify-center p-8 text-center">
            <div class="text-text-primary text-sm font-medium mb-2">
              ${isSizeError ? '📊 Diagram Too Large' : '⚠️ Render Error'}
            </div>
            <div class="text-text-muted text-xs max-w-md">
              ${isSizeError
                        ? `This diagram has ${process.steps?.length || 0} steps and is too complex to render. Try viewing individual processes instead of "All Processes".`
                        : `Unable to render diagram. Steps: ${process.steps?.length || 0}`
                    }
            </div>
          </div>
        `;
            }
        };

        renderDiagram();
    }, [process]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Close on backdrop click
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === containerRef.current) {
            onClose();
        }
    }, [onClose]);

    // Copy mermaid code to clipboard
    const handleCopyMermaid = useCallback(async () => {
        if (!process) return;
        const mermaidCode = generateProcessMermaid(process);
        await navigator.clipboard.writeText(mermaidCode);
    }, [process]);

    // Focus in graph
    const handleFocusInGraph = useCallback(() => {
        if (!process || !onFocusInGraph) return;
        const nodeIds = process.steps.map(s => s.id);
        onFocusInGraph(nodeIds, process.id);
        onClose();
    }, [process, onFocusInGraph, onClose]);

    if (!process) return null;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-2 sm:p-4"
            onClick={handleBackdropClick}
        >
            {/* Glassmorphism Modal - New Design System */}
            <div className={`glass-strong rounded-2xl sm:rounded-3xl shadow-glass flex flex-col animate-scale-in overflow-hidden relative w-full h-full ${isFullScreen
                ? 'max-w-[98vw] max-h-[98vh]'
                : 'max-w-5xl max-h-[90vh]'
                }`}>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-5 border-b border-border-subtle relative z-10 flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary truncate pr-2">
                        {process.label}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-hover rounded-lg transition-colors flex-shrink-0"
                    >
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                {/* Diagram */}
                <div
                    ref={scrollContainerRef}
                    className={`flex-1 p-2 sm:p-8 flex items-center justify-center relative z-10 overflow-hidden ${isFullScreen ? 'min-h-[50vh]' : 'min-h-[300px]'}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
                >
                    <div
                        ref={diagramRef}
                        className="[&_.edgePath_.path]:stroke-text-muted [&_.edgePath_.path]:stroke-2 [&_.marker]:fill-text-muted transition-transform origin-center w-fit h-fit"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        }}
                    />
                </div>

                {/* Footer Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t border-border-subtle bg-surface/50 relative z-10">
                    {/* Zoom controls */}
                    <div className="flex items-center gap-1 bg-elevated border border-border-subtle rounded-lg p-1">
                        <button
                            onClick={handleZoomOut}
                            className="p-2 text-text-muted hover:text-white hover:bg-hover rounded-md transition-all"
                            title="Zoom out (-)"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="px-2 text-xs text-text-muted font-mono min-w-[3rem] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            className="p-2 text-text-muted hover:text-white hover:bg-hover rounded-md transition-all"
                            title="Zoom in (+)"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={resetView}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-text-muted hover:text-white bg-elevated hover:bg-hover border border-border-subtle rounded-lg transition-all"
                        title="Reset zoom and pan"
                    >
                        <span className="hidden sm:inline">Reset</span>
                        <span className="sm:hidden">Reset</span>
                    </button>
                    {onFocusInGraph && (
                        <button
                            onClick={handleFocusInGraph}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-white hover:bg-white/90 rounded-lg transition-all shadow-lg"
                        >
                            <Focus className="w-4 h-4" />
                            <span className="hidden sm:inline">Focus</span>
                        </button>
                    )}
                    <button
                        onClick={handleCopyMermaid}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-border-default rounded-lg transition-all"
                    >
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">Copy</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-text-muted hover:text-white bg-elevated hover:bg-hover border border-border-subtle rounded-lg transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
