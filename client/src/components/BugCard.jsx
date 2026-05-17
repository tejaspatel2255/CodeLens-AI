import React, { useEffect, useRef, useState } from 'react';
import { Bug, CheckCircle, ShieldAlert, Sparkles, Copy, Check } from 'lucide-react';
import hljs from 'highlight.js';
import confetti from 'canvas-confetti';

export default function BugCard({ bugs = [], language }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Trigger confetti if clean code (no bugs)
  useEffect(() => {
    if (bugs && bugs.length === 0) {
      // Trigger a clean-code celebration
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 10 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        // confetti from sides
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [bugs]);

  // Syntax highlighting for code blocks inside bugs
  const BugCodeBlock = ({ codeText, isFix }) => {
    const codeRef = useRef(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
      if (codeRef.current) {
        codeRef.current.className = '';
        if (language) {
          codeRef.current.classList.add(`language-${language.toLowerCase()}`);
        }
        hljs.highlightElement(codeRef.current);
      }
    }, [codeText]);

    const handleCopy = () => {
      if (!codeText) return;
      navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className={`relative rounded-xl border p-4 font-code text-xs sm:text-sm mt-2 bg-surface2/60 ${
        isFix ? 'border-emerald-500/30' : 'border-rose-500/30'
      }`}>
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 p-1.5 rounded-md bg-background/80 hover:bg-surface border border-border/30 text-mutedMain hover:text-textMain transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
          title="Copy code snippet"
        >
          {copied ? <Check className="h-3 w-3 text-accentCyan" /> : <Copy className="h-3 w-3" />}
        </button>
        <pre className="overflow-x-auto pr-8">
          <code ref={codeRef} className="hljs block text-left">
            {codeText}
          </code>
        </pre>
      </div>
    );
  };

  // 1. Pristine / Clean Code Banner State
  if (!bugs || bugs.length === 0) {
    return (
      <div className="glass-card w-full rounded-2xl p-8 relative overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-surface mb-8 group shadow-[0_0_30px_rgba(16,185,129,0.08)]">
        {/* Floating gradient circles */}
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-all duration-300" />
        
        <div className="flex flex-col items-center text-center max-w-xl mx-auto z-10 relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] mb-4">
            <CheckCircle className="h-7 w-7 animate-bounce" />
          </div>
          
          <h3 className="font-heading text-lg font-black tracking-wide text-emerald-400 uppercase flex items-center gap-1.5 justify-center">
            <Sparkles className="h-4 w-4 text-emerald-400" /> No Bugs Detected!
          </h3>
          
          <p className="mt-2 text-sm text-textMain/80 leading-relaxed font-body">
            Excellent job! Our static analyzer and AI scanned your code structure and did not flag any syntax errors, operational bugs, or runtime exceptions. Your code is pristine and ready to run!
          </p>
        </div>
      </div>
    );
  }

  // 2. Bugs Found State
  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center gap-3 text-left">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          <Bug className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-extrabold text-rose-400 uppercase tracking-wide">
            Bugs & Issues Scan
          </h3>
          <p className="text-xs text-mutedMain">
            Found {bugs.length} {bugs.length === 1 ? 'issue' : 'issues'} that could cause compilation or runtime failures.
          </p>
        </div>
      </div>

      {/* Render list of bugs */}
      {bugs.map((bug, index) => (
        <div 
          key={index}
          className="glass-card w-full rounded-2xl p-6 border border-rose-500/30 bg-gradient-to-br from-rose-950/10 to-surface relative overflow-hidden group shadow-[0_0_20px_rgba(244,63,94,0.05)] text-left"
        >
          {/* Card Accent Glow */}
          <div className="absolute top-0 left-0 w-[4px] h-full bg-rose-500" />
          
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span className="text-xs font-black uppercase tracking-widest text-rose-400">
              Defect #{index + 1}
            </span>
          </div>

          <div className="space-y-4">
            {/* 1. Issue Explanation */}
            <div>
              <h4 className="text-sm font-extrabold text-textMain/90 uppercase tracking-wide mb-1">
                The Issue
              </h4>
              <p className="text-sm text-textMain/75 leading-relaxed font-body">
                {bug.issue}
              </p>
            </div>

            {/* 2. Buggy Code Block vs Fixed Block */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
                  Buggy Code Line
                </span>
                <BugCodeBlock codeText={bug.line} isFix={false} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  Suggested Correction
                </span>
                <BugCodeBlock codeText={bug.fix} isFix={true} />
              </div>
            </div>

            {/* 3. Reason description */}
            {bug.why && (
              <div className="pt-2">
                <h5 className="text-xs font-extrabold text-accentCyan uppercase tracking-wide mb-1">
                  Why this Fix Works
                </h5>
                <p className="text-xs text-textMain/80 font-body leading-relaxed bg-surface2/30 rounded-lg p-3 border border-border/40">
                  {bug.why}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
