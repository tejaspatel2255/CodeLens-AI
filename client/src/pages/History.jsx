import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Calendar, Filter, Terminal, ChevronRight, Inbox, RefreshCw } from 'lucide-react';

export default function History() {
  const { 
    history, 
    historyLoading, 
    historyError, 
    fetchHistory, 
    setCurrentAnalysis, 
    sessionId 
  } = useApp();
  
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [filteredHistory, setFilteredHistory] = useState([]);

  // 1. Load History on Mount
  useEffect(() => {
    if (sessionId) {
      fetchHistory(sessionId);
    }
  }, [sessionId]);

  // 2. Compute Unique Languages present in history for dynamic dropdown selection
  const uniqueLanguages = ['All', ...new Set(history.map(item => item.language).filter(Boolean))];

  // 3. Filter History based on dropdown selection
  useEffect(() => {
    if (selectedLanguage === 'All') {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(history.filter(item => item.language === selectedLanguage));
    }
  }, [selectedLanguage, history]);

  // 4. Navigate and Load detailed analysis
  const handleViewAnalysis = (item) => {
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
    navigate('/analyze');
  };

  // Human date format helper (e.g. May 17, 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Loading skeleton layout card template
  const SkeletonGridCard = () => (
    <div className="glass-card rounded-2xl p-6 border border-border/40 bg-surface2/30 animate-pulse space-y-4 text-left">
      <div className="flex justify-between items-center">
        <div className="h-5 w-16 bg-border/60 rounded" />
        <div className="h-4 w-20 bg-border/40 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4.5 w-full bg-border/60 rounded" />
        <div className="h-4.5 w-5/6 bg-border/60 rounded" />
      </div>
      <div className="pt-2 border-t border-border/30 flex justify-between items-center">
        <div className="h-3 w-16 bg-border/30 rounded" />
        <div className="h-8 w-24 bg-border/50 rounded-lg" />
      </div>
    </div>
  );

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full py-12 bg-background text-left">
      {/* Background glow graphics */}
      <div className="absolute h-96 w-96 rounded-full bg-accentCyan/2 blur-[120px] top-20 left-10 pointer-events-none" />
      <div className="absolute h-96 w-96 rounded-full bg-accentPurple/2 blur-[120px] bottom-10 right-10 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Page Header and Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-border/40 pb-8">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wide flex items-center gap-2">
              <Terminal className="h-6 w-6 sm:h-7 sm:w-7 text-accentCyan shrink-0" /> <span>Scanned Archives</span>
            </h1>
            <p className="text-xs text-mutedMain mt-1">
              Browse through your past step-by-step code explainers and bug reports.
            </p>
          </div>

          {/* Filtering Dropdown Control */}
          {history.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-mutedMain flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-accentCyan" /> Filter:
              </span>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="appearance-none bg-surface border border-border px-4 py-2 pr-10 rounded-xl text-xs font-semibold uppercase tracking-wider text-textMain outline-none focus:border-accentCyan/60 transition-all cursor-pointer shadow-md min-w-[140px]"
                >
                  {uniqueLanguages.map((lang, idx) => (
                    <option key={idx} value={lang} className="bg-surface2 text-textMain uppercase">
                      {lang === 'All' ? 'All Languages' : lang}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l border-border pl-2 text-mutedMain">
                  <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                </div>
              </div>
              
              {/* Refresh trigger */}
              <button
                onClick={() => fetchHistory(sessionId)}
                disabled={historyLoading}
                className="p-2 rounded-xl border border-border bg-surface hover:bg-surface2 text-mutedMain hover:text-textMain transition-all disabled:opacity-35"
                title="Refresh logs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Global Fetch Error Message */}
        {historyError && (
          <div className="mb-6 rounded-xl border border-accentRed/30 bg-accentRed/5 p-4 text-sm text-accentRed shadow-sm">
            <span className="font-bold">⚠️ Warning:</span> {historyError}
          </div>
        )}

        {/* Grid Reports Container */}
        {historyLoading ? (
          // Skeletons Loader
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonGridCard />
            <SkeletonGridCard />
            <SkeletonGridCard />
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="glass-card rounded-2xl p-6 border border-border/80 bg-surface flex flex-col justify-between transition-all duration-300 group hover:border-accentCyan/30 relative overflow-hidden shadow-md"
              >
                {/* Visual Accent Corner Glow */}
                <div className="absolute -top-10 -right-10 h-20 w-20 rounded-full bg-accentCyan/2 blur-lg group-hover:bg-accentCyan/5 transition-all" />

                <div>
                  {/* Top language badge and timestamp */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="px-2.5 py-0.5 rounded-md border border-accentCyan/20 bg-accentCyan/5 text-[9px] uppercase font-code tracking-widest text-accentCyan">
                      {item.language || 'Plain Text'}
                    </span>
                    <span className="text-[10px] text-mutedMain flex items-center gap-1 font-semibold">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  {/* Summary content */}
                  <h3 className="font-heading text-xs uppercase font-extrabold tracking-wider text-mutedMain mb-2 text-left">
                    Explanation Summary
                  </h3>
                  <p className="text-sm text-textMain/85 leading-relaxed font-body line-clamp-3 text-left">
                    {item.summary || (item.original_code ? item.original_code.substring(0, 100) + '...' : 'No summary generated')}
                  </p>
                </div>

                {/* Card footer details & view button */}
                <div className="pt-4 mt-6 border-t border-border/40 flex justify-between items-center">
                  <span className="text-[9px] font-mono text-mutedMain/60 uppercase">
                    ID: #{item.id.substring(0, 6)}
                  </span>
                  
                  <button
                    onClick={() => handleViewAnalysis(item)}
                    className="inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-lg border border-accentCyan/30 bg-accentCyan/5 hover:border-accentCyan hover:bg-accentCyan text-background hover:text-background font-heading text-[10px] font-black uppercase tracking-widest text-accentCyan transition-all shadow-[0_0_10px_rgba(0,245,196,0.05)] hover:shadow-[0_0_15px_rgba(0,245,196,0.25)]"
                  >
                    <span>View Trace</span>
                    <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty State view
          <div className="glass-card rounded-2xl border border-border p-12 text-center flex flex-col items-center justify-center min-h-[380px] max-w-2xl mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-surface2 border border-border/60 flex items-center justify-center text-mutedMain/40 mb-6 shadow-inner">
              <Inbox className="h-8 w-8 text-mutedMain/60" />
            </div>
            
            <h3 className="font-heading text-lg font-extrabold text-textMain/90 uppercase tracking-wide">
              No History Logs Found
            </h3>
            
            <p className="text-sm text-mutedMain mt-2 max-w-sm leading-relaxed font-body">
              {selectedLanguage !== 'All' 
                ? `You don't have any code explanation archives saved under the language "${selectedLanguage}".`
                : "You haven't run any code analyses yet. Head over to the editor workspace to scan your first code block!"
              }
            </p>

            <button
              onClick={() => selectedLanguage !== 'All' ? setSelectedLanguage('All') : navigate('/analyze')}
              className="mt-8 inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl font-heading text-xs font-extrabold uppercase tracking-widest text-background bg-accentCyan hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              <span>{selectedLanguage !== 'All' ? 'Clear Filters' : 'Run First Analysis'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
