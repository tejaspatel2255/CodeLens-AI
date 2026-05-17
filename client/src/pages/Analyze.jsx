import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAnalyze } from '../hooks/useAnalyze';
import CodeEditor from '../components/CodeEditor';
import FlowSummary from '../components/FlowSummary';
import StepCard from '../components/StepCard';
import BugCard from '../components/BugCard';
import LoadingAnimation from '../components/LoadingAnimation';
import { HelpCircle, Share2, Check, ArrowRight, History, Terminal } from 'lucide-react';

export default function Analyze() {
  const { 
    currentAnalysis, 
    setCurrentAnalysis, 
    fetchAnalysisById,
    sidebarOpen,
    setSidebarOpen 
  } = useApp();
  
  const { loading, error, analyze, setError } = useAnalyze();
  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedLink, setCopiedLink] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const resultsRef = useRef(null);
  const stepsContainerRef = useRef(null);

  // 1. Process Shared ID Query Parameter (?id=...) on Mount
  useEffect(() => {
    const sharedId = searchParams.get('id');
    if (sharedId) {
      const loadSharedAnalysis = async () => {
        setQueryLoading(true);
        setError(null);
        try {
          const sharedData = await fetchAnalysisById(sharedId);
          setCurrentAnalysis(sharedData);
          showToast("Shared analysis loaded successfully!");
        } catch (err) {
          setError("Failed to load shared analysis. It may have been deleted or the link is invalid.");
        } finally {
          setQueryLoading(false);
        }
      };
      loadSharedAnalysis();
    }
  }, [searchParams]);

  // 2. Auto-scroll to results when currentAnalysis completes or changes
  useEffect(() => {
    if (currentAnalysis && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [currentAnalysis]);

  // 3. Track scroll progress through the execution steps for the progress bar
  useEffect(() => {
    const handleScroll = () => {
      if (!stepsContainerRef.current) return;
      
      const container = stepsContainerRef.current;
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the container has scrolled past the top of the viewport
      const totalHeight = container.scrollHeight;
      const scrolled = window.scrollY - (container.offsetTop - 80); // Adjusted for sticky headers
      const maxScroll = totalHeight - windowHeight + 150;
      
      if (scrolled <= 0) {
        setScrollProgress(0);
      } else if (scrolled >= maxScroll) {
        setScrollProgress(100);
      } else {
        setScrollProgress((scrolled / maxScroll) * 100);
      }
    };

    if (currentAnalysis && currentAnalysis.steps?.length > 0) {
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [currentAnalysis]);

  // 4. Ingest and trigger analysis execution
  const handleAnalyze = async (code) => {
    try {
      await analyze(code);
      showToast("Analysis complete! Traces generated.");
    } catch (err) {
      // Handled by hook state error
    }
  };

  // 5. Generate sharing links
  const handleShare = () => {
    if (!currentAnalysis || !currentAnalysis.id) {
      showToast("Cannot share. This analysis has not been saved in the database yet.");
      return;
    }

    const shareUrl = `${window.location.origin}/analyze?id=${currentAnalysis.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    showToast("Share link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // 6. Toast Notification states
  const [toastMsg, setToastMsg] = useState('');
  const [toastActive, setToastActive] = useState(false);
  
  const showToast = (msg) => {
    setToastMsg(msg);
    setToastActive(true);
  };

  useEffect(() => {
    if (toastActive) {
      const timer = setTimeout(() => setToastActive(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastActive]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full py-8 bg-background">
      {/* Background radial overlays */}
      <div className="absolute h-96 w-96 rounded-full bg-accentCyan/3 blur-[120px] top-10 left-10 pointer-events-none" />
      <div className="absolute h-96 w-96 rounded-full bg-accentPurple/3 blur-[120px] bottom-10 right-10 pointer-events-none" />

      {/* Fullscreen premium scanning loader overlay */}
      {(loading || queryLoading) && <LoadingAnimation />}

      {/* Floating step progress indicator bar */}
      {currentAnalysis && currentAnalysis.steps?.length > 0 && (
        <div className="fixed top-16 left-0 right-0 h-1 z-30 bg-border/40 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-accentCyan via-accentPurple to-accentYellow shadow-[0_1px_8px_rgba(0,245,196,0.6)] transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}

      {/* Main Workspace container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Workspace Title & Sharing Bar */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-8 text-left">
          <div>
            <h1 className="font-heading text-2xl font-black uppercase tracking-wide flex items-center gap-2">
              <Terminal className="h-6 w-6 text-accentCyan" /> Debugging Dashboard
            </h1>
            <p className="text-xs text-mutedMain">
              Write, drop, or import code snippets to generate execution trees.
            </p>
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-2">
            {currentAnalysis && currentAnalysis.id && (
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-accentCyan/20 bg-accentCyan/5 hover:border-accentCyan/40 hover:bg-accentCyan/10 text-xs font-semibold text-accentCyan uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,245,196,0.05)]"
                title="Copy share link"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface2 text-xs font-semibold text-textMain uppercase tracking-widest transition-all"
            >
              <History className="h-4 w-4" />
              <span>Logs</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 rounded-xl border border-accentRed/30 bg-accentRed/5 p-4 text-sm text-accentRed flex gap-3 text-left items-start shadow-[0_0_15px_rgba(255,107,107,0.05)]">
            <span className="font-bold flex-shrink-0 mt-0.5">⚠️ Error:</span>
            <p>{error}</p>
          </div>
        )}

        {/* Desktop Split / Mobile Stack Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Code Editor workspace */}
          <div className="lg:col-span-5 sticky top-20 z-10">
            <CodeEditor onAnalyze={handleAnalyze} loading={loading} />
          </div>

          {/* Right Column: Dynamic Analysis Reports panel */}
          <div className="lg:col-span-7" ref={resultsRef} id="analysis-results-panel">
            {currentAnalysis ? (
              <div className="space-y-6">
                
                {/* 1. Execution Flow & Concept Tags */}
                <FlowSummary 
                  flow={currentAnalysis.flow} 
                  concepts={currentAnalysis.concepts}
                  optimizations={currentAnalysis.optimizations}
                />

                {/* 2. Step Cards Visual Breakdowns with Laser Timeline Alignment */}
                {currentAnalysis.steps && currentAnalysis.steps.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4 text-left">
                      <h3 className="font-heading text-base font-extrabold uppercase text-accentCyan tracking-wide">
                        Step-by-Step Breakdown
                      </h3>
                      <span className="text-[10px] text-mutedMain font-mono">
                        {currentAnalysis.steps.length} Steps Traceable
                      </span>
                    </div>

                    {/* Timeline relative container */}
                    <div className="relative pl-0 lg:pl-6 text-left" ref={stepsContainerRef}>
                      
                      {/* Laser-aligned vertical dotted trace path */}
                      <div className="absolute top-8 bottom-12 left-0 w-[2px] border-l-2 border-dashed border-accentCyan/25 hidden lg:block z-0 pointer-events-none" />

                      {/* Map Step Cards */}
                      {currentAnalysis.steps.map((stepData, index) => (
                        <StepCard
                          key={index}
                          stepData={stepData}
                          language={currentAnalysis.language}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Bug Card Reports */}
                <BugCard 
                  bugs={currentAnalysis.bugs} 
                  language={currentAnalysis.language}
                />

              </div>
            ) : (
              // Empty result dashboard placeholder
              <div className="glass-card rounded-2xl border border-border p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
                <div className="h-16 w-16 rounded-2xl bg-surface2 border border-border/60 flex items-center justify-center text-mutedMain/40 mb-6 shadow-inner animate-pulse-glow">
                  <HelpCircle className="h-8 w-8 text-mutedMain/60" />
                </div>
                
                <h3 className="font-heading text-lg font-extrabold text-textMain/90 uppercase tracking-wide">
                  Analysis Report Workspace
                </h3>
                
                <p className="text-sm text-mutedMain mt-2 max-w-sm leading-relaxed font-body">
                  No analysis loaded yet. Paste your code in the left workspace and press the glowing "Analyze Code" button to run the explainer engine.
                </p>

                <div className="mt-8 flex items-center gap-2 text-xs text-mutedMain font-medium font-mono uppercase tracking-wider bg-surface2/40 px-4 py-2 rounded-xl border border-border/40 select-none">
                  <span>Enter Code</span>
                  <ArrowRight className="h-3 w-3 text-accentCyan" />
                  <span>Execute Trace</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Floating Toast Alert Popup */}
      {toastActive && (
        <div className="fixed bottom-8 right-8 bg-surface border border-border/80 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold tracking-wider text-accentCyan z-40 flex items-center gap-2.5 animate-bounce">
          <Check className="h-4 w-4" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
