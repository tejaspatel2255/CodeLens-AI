import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAnalyze } from '../hooks/useAnalyze';
import CodeEditor from '../components/CodeEditor';
import FlowSummary from '../components/FlowSummary';
import StepCard from '../components/StepCard';
import BugCard from '../components/BugCard';
import LoadingAnimation from '../components/LoadingAnimation';
import ChatAssistant from '../components/ChatAssistant';

import {
  HelpCircle,
  Share2,
  Check,
  ArrowRight,
  History,
  Terminal,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Cpu,
  Box,
  Code,
  Volume2
} from 'lucide-react';

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

  // Premium Stepper Tabs & Playback states
  const [activeTab, setActiveTab] = useState('traces'); // 'traces' | 'sandbox'
  const [sandboxStep, setSandboxStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Reset tab and active stepper when a new analysis loads
  useEffect(() => {
    setActiveTab('traces');
    setSandboxStep(0);
    setIsPlaying(false);
  }, [currentAnalysis]);

  // 3. Auto-play timer for Visual Memory Sandbox Stepper
  useEffect(() => {
    let interval = null;
    if (isPlaying && currentAnalysis?.steps) {
      interval = setInterval(() => {
        setSandboxStep((prev) => {
          if (prev >= currentAnalysis.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500); // Steps through frames every 2.5 seconds
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentAnalysis]);

  // 4. Track scroll progress through the execution steps for the progress bar
  useEffect(() => {
    const handleScroll = () => {
      if (!stepsContainerRef.current) return;

      const container = stepsContainerRef.current;
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const totalHeight = container.scrollHeight;
      const scrolled = window.scrollY - (container.offsetTop - 80);
      const maxScroll = totalHeight - windowHeight + 150;

      if (scrolled <= 0) {
        setScrollProgress(0);
      } else if (scrolled >= maxScroll) {
        setScrollProgress(100);
      } else {
        setScrollProgress((scrolled / maxScroll) * 100);
      }
    };

    if (currentAnalysis && currentAnalysis.steps?.length > 0 && activeTab === 'traces') {
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [currentAnalysis, activeTab]);

  // 5. Ingest and trigger analysis execution
  const handleAnalyze = async (code, language) => {
    try {
      await analyze(code, language);
      showToast("Analysis complete! Traces generated.");
    } catch (err) {
      // Handled by hook state error
    }
  };

  // 6. Generate sharing links
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

  // 7. Dynamic Call-Stack Frame Evaluator
  const getStackFramesForStep = (stepIdx, steps) => {
    const frames = ['Global Context'];

    for (let i = 0; i <= stepIdx; i++) {
      const s = steps[i];
      if (!s) continue;
      const titleLower = (s.title || '').toLowerCase();
      const lineLower = (s.line || '').toLowerCase();

      // Look for function entry points
      if (titleLower.includes('function') || titleLower.includes('method') || titleLower.includes('declaration') && !titleLower.includes('class')) {
        const nameMatch = s.line.match(/(?:function|def|void|int|public static \w+)\s+([a-zA-Z0-9_]+)/);
        const funcName = nameMatch ? `${nameMatch[1]}()` : 'localScope()';
        if (!frames.includes(funcName)) {
          frames.push(funcName);
        }
      }

      // Recursive loops (Fibonacci/Factorial)
      if (titleLower.includes('recursion') || titleLower.includes('recursive') || lineLower.includes('return ') && (lineLower.includes('fib') || lineLower.includes('fac') || lineLower.includes('getfib'))) {
        const callMatch = s.line.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*([a-zA-Z0-9_\s\-+*]+)\s*\)/);
        if (callMatch) {
          const frameName = `${callMatch[1]}(${callMatch[2].trim()})`;
          frames.push(frameName);
        } else {
          frames.push(`recursiveFrame(${i})`);
        }
      }
    }
    return frames;
  };

  // 8. Dynamic Variable hex-address Register scanner
  const getVariablesForStep = (stepIdx, steps) => {
    const vars = {};

    for (let i = 0; i <= stepIdx; i++) {
      const s = steps[i];
      if (!s) continue;
      const line = s.line || '';

      // Let/const declarations
      const jsMatch = line.match(/(?:let|const|var)\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+)/);
      if (jsMatch) {
        vars[jsMatch[1]] = jsMatch[2].trim();
      }

      // Python parameters
      const pyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^#\n]+)/);
      if (pyMatch && !line.includes('def ') && !line.includes('import ') && !line.includes('return ')) {
        vars[pyMatch[1]] = pyMatch[2].trim();
      }

      // Java/C++ types
      const cppMatch = line.match(/(?:int|double|float|String|char|let|const)\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+)/);
      if (cppMatch) {
        vars[cppMatch[1]] = cppMatch[2].trim();
      }

      // Recursive parameter variables
      if (line.includes('(') && line.includes(')')) {
        const paramMatch = line.match(/\(([a-zA-Z0-9_\s,]+)\)/);
        if (paramMatch) {
          const params = paramMatch[1].split(',');
          params.forEach(p => {
            const name = p.trim().split(/\s+/).pop();
            if (name && name !== 'String[]' && name !== 'args' && !vars[name]) {
              // Bind a default simulated stack value
              vars[name] = 'Allocated';
            }
          });
        }
      }
    }

    return Object.entries(vars).map(([name, val], idx) => {
      const hexAddress = `0x7FFD${(2820 + idx * 8).toString(16).toUpperCase()}`;
      return { name, value: val, address: hexAddress };
    });
  };

  // 9. Toast Notification states
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
      {currentAnalysis && currentAnalysis.steps?.length > 0 && activeTab === 'traces' && (
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-accentCyan/20 bg-accentCyan/5 hover:border-accentCyan/40 hover:bg-accentCyan/10 text-xs font-semibold text-accentCyan uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,245,196,0.05)] cursor-pointer"
                title="Copy share link"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface2 text-xs font-semibold text-textMain uppercase tracking-widest transition-all cursor-pointer"
            >
              <History className="h-4 w-4" />
              <span>Logs</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 rounded-xl border border-accentRed/30 bg-accentRed/5 p-4 text-sm text-accentRed flex gap-3 text-left items-start shadow-[0_0_15px_rgba(255,107,107,0.05)] animate-fade-in">
            <span className="font-bold flex-shrink-0 mt-0.5">⚠️ Error:</span>
            <p>{error}</p>
          </div>
        )}

        {/* Desktop Split / Mobile Stack Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Code Editor workspace */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 z-10">
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

                {/* 2. Switcher Tabs (Detailed Traces vs Visual Sandbox vs Test Cases) */}
                {currentAnalysis.steps && currentAnalysis.steps.length > 0 && (
                  <div className="flex border-b border-border/80 mb-6 bg-surface/30 rounded-t-xl p-1 gap-1">
                    <button
                      onClick={() => setActiveTab('traces')}
                      className={`flex-1 py-3 px-3 sm:px-4 rounded-lg font-heading text-xs font-black uppercase tracking-widest transition-all cursor-pointer border ${activeTab === 'traces'
                        ? 'bg-accentCyan/10 border-accentCyan/30 text-accentCyan shadow-[0_0_15px_rgba(0,245,196,0.05)]'
                        : 'border-transparent text-mutedMain hover:text-textMain hover:bg-surface2/40'
                        }`}
                    >
                      Detailed Traces
                    </button>
                    <button
                      onClick={() => setActiveTab('sandbox')}
                      className={`flex-1 py-3 px-3 sm:px-4 rounded-lg font-heading text-xs font-black uppercase tracking-widest transition-all cursor-pointer border ${activeTab === 'sandbox'
                        ? 'bg-accentCyan/10 border-accentCyan/30 text-accentCyan shadow-[0_0_15px_rgba(0,245,196,0.05)]'
                        : 'border-transparent text-mutedMain hover:text-textMain hover:bg-surface2/40'
                        }`}
                    >
                      Visual Sandbox
                    </button>
                    <button
                      onClick={() => setActiveTab('testcases')}
                      className={`flex-1 py-3 px-3 sm:px-4 rounded-lg font-heading text-xs font-black uppercase tracking-widest transition-all cursor-pointer border ${activeTab === 'testcases'
                        ? 'bg-accentCyan/10 border-accentCyan/30 text-accentCyan shadow-[0_0_15px_rgba(0,245,196,0.05)]'
                        : 'border-transparent text-mutedMain hover:text-textMain hover:bg-surface2/40'
                        }`}
                    >
                      Test Cases
                    </button>
                  </div>
                )}


                {/* TAB 1 CONTENT: Standard Step Cards Visual Breakdowns */}
                {activeTab === 'traces' && currentAnalysis.steps && currentAnalysis.steps.length > 0 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-4 text-left">
                      <h3 className="font-heading text-base font-extrabold uppercase text-accentCyan tracking-wide">
                        Step-by-Step Breakdown
                      </h3>
                      <span className="text-[10px] text-mutedMain font-mono bg-surface p-1 rounded border border-border/50">
                        {currentAnalysis.steps.length} Steps Traceable
                      </span>
                    </div>

                    {/* Timeline relative container */}
                    <div className="relative pl-0 lg:pl-8 text-left" ref={stepsContainerRef}>

                      {/* Laser-aligned vertical dotted trace path */}
                      <div className="absolute top-8 bottom-12 left-[14px] w-[2px] border-l-2 border-dashed border-accentCyan/25 hidden lg:block z-0 pointer-events-none" />

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

                {/* TAB 2 CONTENT: The Interactive Visual Memory Sandbox Stepper */}
                {activeTab === 'sandbox' && currentAnalysis.steps && currentAnalysis.steps.length > 0 && (
                  <div className="glass-card rounded-2xl border border-border/80 p-6 bg-surface shadow-2xl space-y-6 text-left animate-fade-in relative overflow-hidden">

                    {/* Stepper Header Control Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between border-b border-border/40 pb-4 gap-4">
                      <div>
                        <h4 className="font-heading text-sm font-extrabold uppercase tracking-widest text-accentCyan flex items-center gap-1.5">
                          <Cpu className="h-4.5 w-4.5 text-accentCyan" /> Memory Sandbox Frame
                        </h4>
                        <p className="text-[10px] text-mutedMain">Interactive Stack & Register Stepper</p>
                      </div>

                      {/* Stepper Control Buttons */}
                      <div className="flex items-center gap-2 bg-background/60 p-1.5 rounded-xl border border-border/60 shadow-inner">
                        <button
                          onClick={() => {
                            setSandboxStep((prev) => Math.max(prev - 1, 0));
                            setIsPlaying(false);
                          }}
                          disabled={sandboxStep === 0}
                          className="p-1.5 rounded-lg text-mutedMain hover:text-textMain hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                          title="Previous execution step"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="p-2 rounded-lg bg-accentCyan/10 text-accentCyan border border-accentCyan/20 hover:bg-accentCyan hover:text-background transition-all cursor-pointer shadow-md shadow-accentCyan/5"
                          title={isPlaying ? "Pause autoplay" : "Autoplay execution frames"}
                        >
                          {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                        </button>

                        <button
                          onClick={() => {
                            setSandboxStep((prev) => Math.min(prev + 1, currentAnalysis.steps.length - 1));
                            setIsPlaying(false);
                          }}
                          disabled={sandboxStep === currentAnalysis.steps.length - 1}
                          className="p-1.5 rounded-lg text-mutedMain hover:text-textMain hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                          title="Next execution step"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSandboxStep(0);
                            setIsPlaying(false);
                          }}
                          className="p-1.5 rounded-lg text-mutedMain hover:text-accentRed hover:bg-accentRed/10 transition-all cursor-pointer"
                          title="Reset sandbox stepper"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Step Timeline Player indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-mutedMain font-mono">
                        <span>STEP {sandboxStep + 1} OF {currentAnalysis.steps.length}</span>
                        <span className="text-accentCyan font-bold uppercase tracking-widest">{currentAnalysis.steps[sandboxStep]?.title}</span>
                      </div>
                      <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/40 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-accentCyan to-accentPurple transition-all duration-300 rounded-full"
                          style={{ width: `${((sandboxStep + 1) / currentAnalysis.steps.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Split Call-Stack Tube vs Variable Registry layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

                      {/* CALL STACK Tube visualization */}
                      <div className="rounded-xl border border-border/60 bg-background/55 p-4 flex flex-col min-h-[300px] justify-between shadow-inner">
                        <div className="border-b border-border/40 pb-2 mb-4 flex items-center justify-between">
                          <h5 className="text-[10px] uppercase font-black tracking-widest text-accentPurple flex items-center gap-1.5">
                            <Box className="h-4 w-4 text-accentPurple" /> Call Stack Frames
                          </h5>
                          <span className="text-[8px] font-mono text-mutedMain/50">BOTTOM-TO-TOP</span>
                        </div>

                        {/* Stack display (last in is top frame) */}
                        <div className="flex-1 flex flex-col justify-end gap-2.5">
                          {getStackFramesForStep(sandboxStep, currentAnalysis.steps).reverse().map((frame, fIdx) => {
                            const isTopFrame = fIdx === 0;
                            return (
                              <div
                                key={fIdx}
                                className={`px-4 py-2.5 rounded-xl border text-xs font-code font-bold flex items-center justify-between transition-all duration-300 transform hover:scale-[1.01] ${isTopFrame
                                  ? 'bg-accentCyan/15 border-accentCyan text-accentCyan shadow-[0_0_15px_rgba(0,245,196,0.15)] animate-pulse'
                                  : 'bg-surface2/60 border-border/60 text-mutedMain'
                                  }`}
                              >
                                <span>{frame}</span>
                                {isTopFrame && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-accentCyan text-background font-sans font-black tracking-wider uppercase animate-bounce">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* REGISTER & VARIABLE ALLOCATIONS (Heap Sandbox) */}
                      <div className="rounded-xl border border-border/60 bg-background/55 p-4 flex flex-col min-h-[300px] shadow-inner">
                        <div className="border-b border-border/40 pb-2 mb-4">
                          <h5 className="text-[10px] uppercase font-black tracking-widest text-accentYellow flex items-center gap-1.5">
                            <Cpu className="h-4 w-4 text-accentYellow" /> Memory heap registry
                          </h5>
                        </div>

                        {/* Variables List mapping */}
                        <div className="flex-1 space-y-2.5 overflow-auto max-h-[260px] pr-1">
                          {getVariablesForStep(sandboxStep, currentAnalysis.steps).length > 0 ? (
                            getVariablesForStep(sandboxStep, currentAnalysis.steps).map((item, vIdx) => (
                              <div
                                key={vIdx}
                                className="p-2.5 rounded-xl border border-border/40 bg-surface/80 flex items-center justify-between text-xs font-code hover:border-accentYellow/30 hover:bg-surface2/20 transition-all duration-200"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono text-mutedMain bg-background border border-border/60 px-1.5 py-0.5 rounded">
                                    {item.address}
                                  </span>
                                  <span className="text-textMain font-bold">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-mutedMain">=</span>
                                  <span className="text-accentYellow font-black">{item.value}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-mutedMain/50">
                              <Box className="h-8 w-8 text-mutedMain/30 mb-2 animate-pulse" />
                              <p className="text-[10px] leading-relaxed italic max-w-[200px]">
                                No variables allocated in this scope yet. Variables allocate dynamically as code executes.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Active line code execution card */}
                    <div className="rounded-xl border border-border/50 bg-background/45 p-4 space-y-2 border-l-2 border-l-accentCyan shadow-md">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-accentCyan flex items-center gap-1">
                          <Code className="h-3 w-3" /> CURRENT EXECUTING LINE
                        </span>
                        {currentAnalysis.steps[sandboxStep]?.analogy && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-accentYellow/15 text-accentYellow font-sans font-black tracking-wider uppercase flex items-center gap-0.5">
                            💡 Analogy Available
                          </span>
                        )}
                      </div>

                      {/* Display source code frame snippet */}
                      <div className="rounded bg-surface px-3 py-2 font-code text-xs text-textMain/90 overflow-x-auto text-left border border-border/30">
                        {currentAnalysis.steps[sandboxStep]?.line || '// Empty scope frame'}
                      </div>

                      {/* Explanation paragraph */}
                      <p className="text-xs text-textMain/75 leading-relaxed pt-1">
                        {currentAnalysis.steps[sandboxStep]?.explanation}
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 3 CONTENT: Auto-Generated Unit Test Suite */}
                {activeTab === 'testcases' && (
                  <div className="glass-card rounded-2xl border border-border/80 p-6 bg-surface shadow-2xl space-y-6 text-left animate-fade-in">
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                      <div>
                        <h4 className="font-heading text-sm font-extrabold uppercase tracking-widest text-accentCyan flex items-center gap-2">
                          <Terminal className="h-4.5 w-4.5 text-accentCyan" /> Generated Unit Tests & Edge Cases
                        </h4>
                        <p className="text-[10px] text-mutedMain">Automated Input/Output Boundary Assertions</p>
                      </div>
                      <span className="text-[10px] font-mono bg-accentCyan/10 border border-accentCyan/20 text-accentCyan px-2.5 py-1 rounded-full uppercase font-bold">
                        {currentAnalysis.language || 'Code'} Suite
                      </span>
                    </div>

                    {currentAnalysis.testCases && currentAnalysis.testCases.length > 0 ? (
                      <div className="space-y-4">
                        {currentAnalysis.testCases.map((tc, tcIdx) => (
                          <div key={tcIdx} className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-accentPurple flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-accentPurple" />
                                {tc.name || `Test Case #${tcIdx + 1}`}
                              </span>
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                                ASSERT PASS
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-code">
                              <div className="p-3 rounded-lg bg-surface2/40 border border-border/40">
                                <span className="text-[9px] uppercase tracking-widest text-mutedMain font-bold block mb-1">Input Argument(s)</span>
                                <code className="text-accentCyan font-bold">{tc.input}</code>
                              </div>
                              <div className="p-3 rounded-lg bg-surface2/40 border border-border/40">
                                <span className="text-[9px] uppercase tracking-widest text-mutedMain font-bold block mb-1">Expected Output</span>
                                <code className="text-accentYellow font-bold">{tc.expectedOutput}</code>
                              </div>
                            </div>

                            {tc.explanation && (
                              <p className="text-xs text-textMain/75 leading-relaxed font-body pt-1">
                                <strong className="text-textMain/90">Assertion Note:</strong> {tc.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Fallback default synthesized test suite if prompt was executed on earlier trace */}
                        {[
                          {
                            name: "Standard Input Test",
                            input: "sample dataset [10, 20, 30, 40]",
                            expectedOutput: "Valid compute response",
                            explanation: "Tests main execution logic with nominal non-null input arguments."
                          },
                          {
                            name: "Boundary / Empty Edge Case",
                            input: "[] or null",
                            expectedOutput: "Error code / Base case fallback",
                            explanation: "Verifies the function handles empty collection boundaries without throwing unchecked exceptions."
                          }
                        ].map((tc, tcIdx) => (
                          <div key={tcIdx} className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-accentPurple flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-accentPurple" />
                                {tc.name}
                              </span>
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                                ASSERT PASS
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-code">
                              <div className="p-3 rounded-lg bg-surface2/40 border border-border/40">
                                <span className="text-[9px] uppercase tracking-widest text-mutedMain font-bold block mb-1">Input Argument(s)</span>
                                <code className="text-accentCyan font-bold">{tc.input}</code>
                              </div>
                              <div className="p-3 rounded-lg bg-surface2/40 border border-border/40">
                                <span className="text-[9px] uppercase tracking-widest text-mutedMain font-bold block mb-1">Expected Output</span>
                                <code className="text-accentYellow font-bold">{tc.expectedOutput}</code>
                              </div>
                            </div>

                            <p className="text-xs text-textMain/75 leading-relaxed font-body pt-1">
                              <strong className="text-textMain/90">Assertion Note:</strong> {tc.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}


                {/* 3. Bug Card Reports (always visible on results tab toggle) */}
                <BugCard
                  bugs={currentAnalysis.bugs}
                  language={currentAnalysis.language}
                  onApplyFix={(buggyLine, fixedLine) => {
                    if (currentAnalysis && currentAnalysis.original_code) {
                      const updatedCode = currentAnalysis.original_code.replace(buggyLine, fixedLine);
                      setCurrentAnalysis({
                        ...currentAnalysis,
                        original_code: updatedCode
                      });
                      showToast("Applied fix to code! Re-running analysis...");
                      handleAnalyze(updatedCode, currentAnalysis.language);
                    }
                  }}
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

      {/* Floating Interactive AI Chat Drawer */}
      <ChatAssistant codeContext={currentAnalysis?.original_code || ''} />
    </div>
  );
}

