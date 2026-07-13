import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ChevronRight, Terminal, Inbox, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function HistorySidebar() {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    history, 
    historyLoading, 
    setCurrentAnalysis,
    deleteHistoryItem 
  } = useApp();
  
  const navigate = useNavigate();

  // Navigation and detail view trigger (R in CRUD)
  const handleItemClick = (item) => {
    // Supabase returns stored JSONB data. Depending on details, ensure standard parses.
    const formattedItem = {
      id: item.id,
      language: item.language,
      summary: item.summary,
      steps: typeof item.steps === 'string' ? JSON.parse(item.steps) : item.steps,
      bugs: typeof item.bugs === 'string' ? JSON.parse(item.bugs) : item.bugs,
      optimizations: typeof item.optimizations === 'string' ? JSON.parse(item.optimizations) : item.optimizations,
      concepts: typeof item.concepts === 'string' ? JSON.parse(item.concepts) : item.concepts,
      flow: item.flow,
      original_code: item.original_code,
      created_at: item.created_at
    };

    setCurrentAnalysis(formattedItem);
    setSidebarOpen(false);
    navigate('/analyze');
    
    // Auto-scroll to results container if in Analyze page
    setTimeout(() => {
      const el = document.getElementById('analysis-results-panel');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Human readable time generation helper
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return 'Just now';
  };

  // Loading skeleton card template
  const SkeletonCard = () => (
    <div className="w-full rounded-xl bg-surface2/30 border border-border/40 p-4 animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4.5 w-16 bg-border/60 rounded" />
        <div className="h-3.5 w-12 bg-border/40 rounded" />
      </div>
      <div className="h-4 w-full bg-border/60 rounded" />
      <div className="h-3 w-3/4 bg-border/40 rounded" />
    </div>
  );

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          />

          {/* Sliding sidebar container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[360px] bg-surface/95 border-l border-border/80 backdrop-blur-xl flex flex-col shadow-2xl text-left"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border/85 flex items-center justify-between bg-surface bg-opacity-70">
              <div className="flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-accentCyan" />
                <span className="font-heading text-sm font-extrabold uppercase tracking-widest bg-gradient-to-r from-accentCyan to-accentPurple bg-clip-text text-transparent">
                  Session Logs
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg border border-border/50 text-mutedMain hover:text-textMain hover:bg-surface2 transition-all cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sidebar Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {historyLoading ? (
                // History Loading Skeleton Cards
                <div className="space-y-3.5">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : history && history.length > 0 ? (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="w-full text-left glass-card rounded-xl border border-border/50 bg-surface2/30 hover:bg-surface2/70 p-4 transition-all duration-300 group flex flex-col gap-2.5 relative shadow-sm cursor-pointer select-none"
                  >
                    {/* Floating select indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-accentCyan">
                      <ChevronRight className="h-4.5 w-4.5" />
                    </div>

                    <div className="flex justify-between items-center pr-2">
                      {/* Language Badge */}
                      <span className="px-2 py-0.5 rounded border border-accentCyan/20 bg-accentCyan/5 text-[9px] uppercase font-code tracking-wider text-accentCyan">
                        {item.language || 'Plain Text'}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {/* Created Date */}
                        <span className="text-[10px] text-mutedMain flex items-center gap-1 font-medium">
                          <Calendar className="h-2.5 w-2.5" />
                          {formatTimeAgo(item.created_at)}
                        </span>

                        {/* Interactive Delete Button (D in CRUD) */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation(); // Avoid triggering card selection click!
                            if (window.confirm("Are you sure you want to permanently delete this execution log from your history?")) {
                              try {
                                await deleteHistoryItem(item.id);
                              } catch (err) {
                                alert(err.message || "Unable to delete history log.");
                              }
                            }
                          }}
                          className="p-1 rounded hover:bg-accentRed/15 text-mutedMain/50 hover:text-accentRed transition-all cursor-pointer z-30"
                          title="Delete Session Log"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Shortened Code Summary */}
                    <p className="text-xs text-textMain/85 leading-relaxed font-body pr-5 line-clamp-2">
                      {item.summary || (item.original_code ? item.original_code.substring(0, 60) + '...' : 'No Summary available')}
                    </p>
                  </div>
                ))
              ) : (
                // Empty History state
                <div className="h-full flex flex-col items-center justify-center text-center p-6 mt-12">
                  <div className="h-12 w-12 rounded-xl bg-surface2 border border-border/50 flex items-center justify-center text-mutedMain/50 mb-3.5 shadow-inner">
                    <Inbox className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-heading font-extrabold uppercase text-textMain/90 tracking-wider">
                    No Logs Scanned
                  </h4>
                  <p className="text-xs text-mutedMain mt-1 leading-relaxed max-w-[200px]">
                    Paste code, hit analyze, and your detailed debug traces will be saved here!
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-border/80 bg-surface/50 text-[10px] text-mutedMain text-center uppercase tracking-wider font-semibold">
              CodeLens AI • Session Database
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
