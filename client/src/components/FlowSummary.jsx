import React, { useState, useEffect } from 'react';
import { Network, Zap, Sparkles, Volume2, VolumeX, GraduationCap } from 'lucide-react';
import ConceptTags from './ConceptTags';

export default function FlowSummary({ flow, concepts = [], optimizations = [], steps = [] }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeakingDetailed, setIsSpeakingDetailed] = useState(false);

  // Stop any active speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // 1. QUICK SUMMARY NARRATOR
  const handleSpeak = () => {
    if (isSpeakingDetailed) {
      window.speechSynthesis.cancel();
      setIsSpeakingDetailed(false);
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    if (!flow) return;

    const cleanText = flow.replace(/[{}[\]"']/g, '').trim();
    const announcement = `Here is the execution flow summary: ${cleanText}`;

    const utterance = new SpeechSynthesisUtterance(announcement);
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('en-') &&
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft'))
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // 2. DETAILED LINE-BY-LINE TUTOR MONOLOGUE
  const handleSpeakDetailed = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (isSpeakingDetailed) {
      window.speechSynthesis.cancel();
      setIsSpeakingDetailed(false);
      return;
    }

    window.speechSynthesis.cancel();
    if (!steps || steps.length === 0) return;

    // Structure a highly detailed tutoring narration
    let monologue = `Welcome to the CodeLens AI detailed walkthrough. Let's analyze this program together. `;
    
    if (flow) {
      monologue += `At a high level, the execution flow is as follows: ${flow.replace(/[{}[\]"']/g, '')}. `;
    }

    if (concepts && concepts.length > 0) {
      const names = concepts.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
      if (names.length > 0) {
        monologue += `The key computer science concepts found in this snippet include: ${names.join(', ')}. `;
      }
    }

    monologue += `Now, let's step through the logical execution sequence of the code. `;

    // Read top 5 active execution steps for precise engagement
    const speakSteps = steps.slice(0, 5);
    speakSteps.forEach((s, idx) => {
      const cleanLine = (s.line || '').replace(/[{}[\]"']/g, '').trim();
      const cleanExpl = (s.explanation || '').trim();
      monologue += `Step ${idx + 1}. In ${s.title || 'execution frame'}, on statement: ${cleanLine}. ${cleanExpl} `;
    });

    if (steps.length > 5) {
      monologue += `Following this, there are ${steps.length - 5} subsequent cycles that evaluate parameters inside your call stack frames. `;
    }

    if (optimizations && optimizations.length > 0) {
      monologue += `To make your execution more optimal, I highly recommend this performance tip: ${optimizations[0].replace(/[{}[\]"']/g, '')}. `;
    }

    monologue += `Walkthrough complete. Happy debugging!`;

    const utterance = new SpeechSynthesisUtterance(monologue);
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('en-') &&
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft'))
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 0.95; // Slightly slower, tutoring pace
    utterance.pitch = 1.05;

    utterance.onend = () => setIsSpeakingDetailed(false);
    utterance.onerror = () => setIsSpeakingDetailed(false);

    setIsSpeakingDetailed(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="glass-card w-full rounded-2xl p-6 border border-border/80 bg-surface shadow-2xl mb-8 relative text-left">
      
      {/* Title Header with interactive Speaker Toggle */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accentPurple/10 border border-accentPurple/25 text-accentPurple shadow-[0_0_15px_rgba(124,109,250,0.15)]">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-extrabold text-accentPurple uppercase tracking-wide">
              Execution Flow Summary
            </h3>
            <p className="text-xs text-mutedMain font-medium">
              Overview of control flow and algorithmic behaviors.
            </p>
          </div>
        </div>

        {/* Audio Explainer Buttons bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Button 1: Quick Flow Summary */}
          {flow && (
            <button
              onClick={handleSpeak}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-heading font-black uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-lg hover:scale-102 active:scale-98 ${
                isSpeaking
                  ? 'bg-accentPurple/25 border-accentPurple text-accentPurple shadow-[0_0_20px_rgba(124,109,250,0.25)] animate-pulse'
                  : 'bg-surface2/60 border-border/80 text-mutedMain hover:text-textMain hover:border-accentPurple/40 hover:shadow-[0_0_12px_rgba(124,109,250,0.08)]'
              }`}
              title={isSpeaking ? "Mute audio tutor" : "Narrate overall control flow"}
            >
              <Volume2 className="h-4 w-4" />
              <span>{isSpeaking ? "Narrating..." : "Narrate Flow"}</span>
            </button>
          )}

          {/* Button 2: Detailed Tutor Walkthrough */}
          {steps && steps.length > 0 && (
            <button
              onClick={handleSpeakDetailed}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-heading font-black uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-lg hover:scale-102 active:scale-98 ${
                isSpeakingDetailed
                  ? 'bg-accentCyan/25 border-accentCyan text-accentCyan shadow-[0_0_20px_rgba(0,245,196,0.25)] animate-pulse'
                  : 'bg-surface2/60 border-border/80 text-mutedMain hover:text-textMain hover:border-accentCyan/40 hover:shadow-[0_0_12px_rgba(0,245,196,0.08)]'
              }`}
              title={isSpeakingDetailed ? "Mute detailed tutor" : "Listen to line-by-line detailed explanation"}
            >
              <GraduationCap className="h-4 w-4" />
              <span>{isSpeakingDetailed ? "Tutor Speaking..." : "Detailed AI Tutor"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. Execution Flow Blockquote */}
        {flow && (
          <div className="relative pl-5 border-l-2 border-accentPurple bg-accentPurple/5 rounded-r-xl p-4 shadow-sm border border-border/20">
            <span className="absolute -left-1.5 -top-1 bg-background text-accentPurple text-[10px] font-black uppercase tracking-wider px-1">
              Trace
            </span>
            <blockquote className="text-sm font-body text-textMain/85 italic leading-relaxed">
              "{flow}"
            </blockquote>
          </div>
        )}

        {/* 2. Core Concepts Section */}
        {concepts && concepts.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-accentCyan mb-2.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accentCyan" /> Scanned Core Concepts
            </h4>
            <ConceptTags concepts={concepts} />
          </div>
        )}

        {/* 3. Suggested Optimizations Section */}
        {optimizations && optimizations.length > 0 && (
          <div className="pt-2 border-t border-border/40">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-accentYellow mb-3 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-accentYellow fill-accentYellow/10" /> Suggested Performance Optimizations
            </h4>
            <ul className="space-y-2.5">
              {optimizations.map((tip, index) => (
                <li 
                  key={index}
                  className="flex gap-3 text-sm text-textMain/80 leading-relaxed font-body"
                >
                  <div className="mt-1 flex h-4.5 w-4.5 items-center justify-center rounded bg-accentYellow/10 text-accentYellow flex-shrink-0">
                    <Zap className="h-3 w-3 fill-accentYellow" />
                  </div>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
