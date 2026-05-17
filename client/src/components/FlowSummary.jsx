import React from 'react';
import { Network, Zap, Sparkles } from 'lucide-react';
import ConceptTags from './ConceptTags';

export default function FlowSummary({ flow, concepts = [], optimizations = [] }) {
  return (
    <div className="glass-card w-full rounded-2xl p-6 border border-border/80 bg-surface shadow-2xl mb-8 relative text-left">
      {/* Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accentPurple/10 border border-accentPurple/25 text-accentPurple shadow-[0_0_15px_rgba(124,109,250,0.15)]">
          <Network className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-extrabold text-accentPurple uppercase tracking-wide">
            Execution Flow Summary
          </h3>
          <p className="text-xs text-mutedMain">
            Overview of control flow and algorithmic behaviors.
          </p>
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
