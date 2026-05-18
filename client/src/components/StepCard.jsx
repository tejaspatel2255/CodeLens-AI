import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Lightbulb, Copy, Check, Sparkles, Volume2, VolumeX } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/tokyo-night-dark.css';

const cardVariants = {
  hidden: { opacity: 0, y: 35 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

export default function StepCard({ stepData, language, index }) {
  const { step, line, title, explanation, backend, analogy } = stepData;
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const codeRef = useRef(null);

  // Stop any active narration when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Cancel other playing sounds
    window.speechSynthesis.cancel();

    if (!explanation) return;

    // Compose custom natural readout flow
    let speakText = `Step ${step}. ${title || 'Execution step details'}. ${explanation.replace(/[{}[\]"']/g, '').trim()}`;
    if (analogy) {
      speakText += `. To understand this, think of it like: ${analogy.replace(/[{}[\]"']/g, '').trim()}`;
    }

    const utterance = new SpeechSynthesisUtterance(speakText);
    
    // Choose natural-sounding English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('en-') &&
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft'))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.05; // Slightly faster for student pacing
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Apply highlight.js syntax coloring on load/render
  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.className = '';
      if (language) {
        codeRef.current.classList.add(`language-${language.toLowerCase()}`);
      }
      hljs.highlightElement(codeRef.current);
    }
  }, [line, language]);

  // Code Copy Helper
  const handleCopy = () => {
    if (!line) return;
    navigator.clipboard.writeText(line);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={cardVariants}
      className="glass-card w-full rounded-2xl p-6 relative overflow-visible mb-8 group border border-border/60 hover:border-accentCyan/35 text-left lg:pl-12"
    >
      {/* Background glow orb on hover */}
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-accentCyan/5 blur-xl group-hover:bg-accentCyan/10 transition-colors pointer-events-none" />

      {/* Step Badge positioned absolute left on desktop to sit exactly on the timeline line */}
      <div className="flex items-center justify-between mb-4 lg:mb-2">
        
        {/* Step Indicator Badge */}
        <div className="flex items-center gap-3 lg:absolute lg:-left-[18px] lg:top-[24px] lg:z-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accentCyan via-background to-accentPurple p-[1px] shadow-[0_0_15px_rgba(0,245,196,0.15)] group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(0,245,196,0.35)] transition-all duration-300">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-background font-heading text-xs font-black text-accentCyan group-hover:text-accentPurple transition-colors duration-300">
              {step}
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-mutedMain font-bold lg:hidden">
            Execution Step
          </span>
        </div>

        {/* Language Badge (displayed absolute right) */}
        {language && (
          <span className="px-2.5 py-0.5 rounded-full border border-border/80 bg-surface2/60 text-[9px] uppercase font-code tracking-widest text-accentCyan ml-auto lg:absolute lg:right-6 lg:top-6">
            {language}
          </span>
        )}
      </div>

      {/* Step Title Header */}
      <div className="mb-4">
        <h4 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-textMain/90 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-accentCyan animate-pulse group-hover:text-accentPurple transition-colors" /> {title || 'Execution Step Details'}
        </h4>
        <span className="text-[9px] font-mono text-mutedMain/50 block mt-0.5 lg:hidden">
          STEP #{step}
        </span>
      </div>

      {/* Interactive Syntax Highlighted Code Block */}
      <div className="relative mb-5 rounded-xl bg-surface2/80 border border-border/40 p-4 font-code text-sm">
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 p-1.5 rounded-md bg-background/80 hover:bg-surface border border-border/30 text-mutedMain hover:text-textMain transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
          title="Copy line of code"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-accentCyan" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <pre className="overflow-x-auto pr-8">
          <code ref={codeRef} className="hljs block text-left">
            {line || '// No active execution line'}
          </code>
        </pre>
      </div>

      {/* Step Info Content */}
      <div className="space-y-4 font-body">
        <div>
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
            <h5 className="text-[10px] uppercase font-bold tracking-widest text-mutedMain/80">
              What happens
            </h5>
            {/* Contextual Speak Button */}
            <button
              onClick={handleSpeak}
              className={`p-1.5 rounded-lg border text-mutedMain hover:text-textMain hover:bg-surface2 transition-all cursor-pointer flex items-center gap-1.5 ${
                isSpeaking 
                  ? 'bg-accentPurple/20 border-accentPurple text-accentPurple shadow-[0_0_12px_rgba(124,109,250,0.15)]' 
                  : 'border-transparent bg-transparent hover:border-border/40'
              }`}
              title={isSpeaking ? "Stop voice narration" : "Listen to step narration & analogy"}
            >
              {isSpeaking ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-accentPurple" />
                  <span className="flex items-center gap-0.5 px-0.5">
                    <span className="voice-wave-bar voice-wave-bar-1 text-accentPurple"></span>
                    <span className="voice-wave-bar voice-wave-bar-2 text-accentPurple"></span>
                    <span className="voice-wave-bar voice-wave-bar-3 text-accentPurple"></span>
                  </span>
                </>
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-textMain/75 leading-relaxed font-body">
            {explanation}
          </p>
        </div>

        {/* Under the Hood Component block */}
        {backend && (
          <div className="rounded-xl bg-surface2/40 border border-border/30 p-4 flex gap-3.5 items-start transition-all group-hover:bg-surface2/60">
            <div className="p-2 rounded-lg bg-accentPurple/10 text-accentPurple border border-accentPurple/20 flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(124,109,250,0.1)]">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-accentPurple mb-1 flex items-center gap-1">
                Under the Hood <span className="text-[9px] text-mutedMain/60 font-normal font-sans tracking-normal uppercase">(CPU registers & Stack)</span>
              </h5>
              <p className="text-xs text-textMain/80 leading-relaxed font-body">
                {backend}
              </p>
            </div>
          </div>
        )}

        {/* Think of it like analogy block */}
        {analogy && (
          <div className="rounded-xl bg-accentYellow/5 border border-accentYellow/10 p-4 flex gap-3.5 items-start">
            <div className="p-2 rounded-lg bg-accentYellow/10 text-accentYellow border border-accentYellow/20 flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(255,217,61,0.1)]">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-accentYellow mb-1">
                Think of it like
              </h5>
              <p className="text-xs text-textMain/80 italic leading-relaxed font-body">
                {analogy}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
