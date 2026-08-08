import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGenerate } from '../hooks/useGenerate';
import { useApp } from '../context/AppContext';
import { Code, Terminal, Play, ArrowRight, Lightbulb, Check, Server, FileCode2, Copy } from 'lucide-react';
import LoadingAnimation from '../components/LoadingAnimation';

export default function Generate() {
  const { user } = useApp();
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const { loading, error, generate, setError } = useGenerate();
  const navigate = useNavigate();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Sign in required to generate code!");
      setTimeout(() => navigate('/auth?mode=login'), 2000);
      return;
    }
    const data = await generate(question, language);
    if (data) {
      setResult(data);
    }
  };

  const handleAnalyzeGeneratedCode = () => {
    if (result && result.code) {
      // Store the generated code temporarily in localStorage to populate the analyze editor
      localStorage.setItem('codelens_draft_code', result.code);
      localStorage.setItem('codelens_draft_lang', result.language || language || 'javascript');
      navigate('/analyze');
    }
  };

  const handleCopy = () => {
    if (result && result.code) {
      navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full py-12 bg-background text-left">
      {/* Background glow graphics */}
      <div className="absolute h-96 w-96 rounded-full bg-accentPurple/2 blur-[120px] top-20 left-10 pointer-events-none" />
      <div className="absolute h-96 w-96 rounded-full bg-accentCyan/2 blur-[120px] bottom-10 right-10 pointer-events-none" />

      {loading && <LoadingAnimation />}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-border/40 pb-8">
          <div>
            <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wide flex items-center gap-2">
              <FileCode2 className="h-6 w-6 sm:h-7 sm:w-7 text-accentPurple shrink-0" /> <span>Code Generator</span>
            </h1>
            <p className="text-xs text-mutedMain mt-1">
              Ask a programming question with constraints, and AI will generate optimized code.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-accentRed/30 bg-accentRed/5 p-4 text-sm text-accentRed flex gap-3 text-left items-start shadow-sm">
            <span className="font-bold flex-shrink-0 mt-0.5">⚠️ Error:</span>
            <p>{error}</p>
          </div>
        )}

        {result?.warning && (
          <div className="mb-6 rounded-xl border border-accentYellow/30 bg-accentYellow/5 p-4 text-sm text-accentYellow flex gap-3 text-left items-start shadow-sm">
            <span className="font-bold flex-shrink-0 mt-0.5">ℹ️ Note:</span>
            <p>{result.warning}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-2xl border border-border/80 bg-surface p-6 shadow-xl">
              <h3 className="font-heading text-lg font-black uppercase tracking-widest text-textMain mb-4">
                Constraint Builder
              </h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-mutedMain">
                    Programming Language (Optional)
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g. Python, Java, C++"
                    className="w-full px-4 py-3 rounded-xl border border-border/80 bg-background font-body text-xs text-textMain placeholder:text-mutedMain/50 focus:border-accentPurple/50 focus:shadow-[0_0_12px_rgba(124,109,250,0.15)] outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-mutedMain">
                    Problem Question & Constraints
                  </label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="E.g. Write a function to reverse a linked list. Constraint: O(1) space complexity."
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl border border-border/80 bg-background font-body text-xs text-textMain placeholder:text-mutedMain/50 focus:border-accentPurple/50 focus:shadow-[0_0_12px_rgba(124,109,250,0.15)] outline-none transition-all resize-none font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accentPurple to-accentCyan text-background font-heading text-xs font-black uppercase tracking-wider shadow-lg shadow-accentPurple/10 hover:shadow-accentPurple/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Server className="h-4 w-4" />
                  <span>Generate Code</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Output Viewer */}
          <div className="lg:col-span-7">
            {result ? (
              <div className="space-y-6 animate-fade-in">
                {/* Result Meta */}
                <div className="glass-card rounded-2xl border border-border/80 bg-surface p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <h3 className="font-heading text-base font-black uppercase tracking-widest text-accentCyan flex items-center gap-2">
                      <Code className="h-5 w-5" /> Generated Source Code
                    </h3>
                    <span className="px-3 py-1 rounded-md border border-accentPurple/20 bg-accentPurple/10 text-[10px] uppercase font-code tracking-widest text-accentPurple font-bold">
                      {result.language || language || 'Auto'}
                    </span>
                  </div>

                  <div className="rounded-xl bg-background border border-border/50 p-4 overflow-x-auto relative group">
                    <button
                      onClick={handleCopy}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-surface border border-border/60 text-mutedMain hover:text-accentCyan hover:bg-surface2 transition-all opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer"
                      title="Copy Code"
                    >
                      {copied ? <Check className="h-4 w-4 text-accentCyan" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <pre className="font-code text-xs text-textMain/90 whitespace-pre-wrap">
                      <code>{result.code}</code>
                    </pre>
                  </div>

                  {result.explanation && (
                    <div className="pt-4 border-t border-border/40 text-sm text-textMain/85 leading-relaxed flex gap-3">
                      <Lightbulb className="h-5 w-5 text-accentYellow flex-shrink-0 mt-0.5" />
                      <p>{result.explanation}</p>
                    </div>
                  )}

                  {result.complexity && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
                      <div className="bg-surface2/50 rounded-xl p-3 border border-border/40">
                        <span className="block text-[9px] uppercase font-bold tracking-widest text-mutedMain mb-1">Time Complexity</span>
                        <span className="font-code text-accentCyan font-bold text-sm">{result.complexity.time}</span>
                      </div>
                      <div className="bg-surface2/50 rounded-xl p-3 border border-border/40">
                        <span className="block text-[9px] uppercase font-bold tracking-widest text-mutedMain mb-1">Space Complexity</span>
                        <span className="font-code text-accentPurple font-bold text-sm">{result.complexity.space}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-border/40">
                    <button
                      onClick={handleAnalyzeGeneratedCode}
                      className="w-full py-3 rounded-xl border border-accentCyan/30 bg-accentCyan/10 hover:bg-accentCyan hover:text-background text-accentCyan font-heading text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,245,196,0.05)]"
                    >
                      <Terminal className="h-4 w-4" />
                      <span>Send to Analyzer Sandbox</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-border p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
                <div className="h-16 w-16 rounded-2xl bg-surface2 border border-border/60 flex items-center justify-center text-mutedMain/40 mb-6 shadow-inner animate-pulse-glow">
                  <Terminal className="h-8 w-8 text-mutedMain/60" />
                </div>
                
                <h3 className="font-heading text-lg font-extrabold text-textMain/90 uppercase tracking-wide">
                  Waiting for Constraints
                </h3>
                
                <p className="text-sm text-mutedMain mt-2 max-w-sm leading-relaxed font-body">
                  Enter your coding problem on the left and specify your constraints. The AI will output a fully tailored solution right here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
