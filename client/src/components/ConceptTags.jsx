import React from 'react';

const COLORS_LIST = [
  'bg-accentCyan/10 border-accentCyan/30 text-accentCyan hover:border-accentCyan/55 shadow-[0_0_10px_rgba(0,245,196,0.02)]',
  'bg-accentPurple/10 border-accentPurple/30 text-accentPurple hover:border-accentPurple/55 shadow-[0_0_10px_rgba(124,109,250,0.02)]',
  'bg-accentYellow/10 border-accentYellow/30 text-accentYellow hover:border-accentYellow/55 shadow-[0_0_10px_rgba(255,217,61,0.02)]',
  'bg-accentRed/10 border-accentRed/30 text-accentRed hover:border-accentRed/55 shadow-[0_0_10px_rgba(255,107,107,0.02)]'
];

export default function ConceptTags({ concepts = [] }) {
  if (!concepts || concepts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {concepts.map((concept, index) => {
        const colorStyle = COLORS_LIST[index % COLORS_LIST.length];
        return (
          <span
            key={index}
            className={`px-3 py-1 text-xs rounded-lg border font-semibold uppercase tracking-wider transition-all duration-300 select-none ${colorStyle}`}
          >
            {concept}
          </span>
        );
      })}
    </div>
  );
}
