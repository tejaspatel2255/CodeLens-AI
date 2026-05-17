import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Cpu, Search, Bug, LayoutGrid } from 'lucide-react';

const MESSAGES = [
  { text: "Scanning code structure...", icon: Search, color: "text-accentCyan" },
  { text: "Mapping execution flow...", icon: LayoutGrid, color: "text-accentPurple" },
  { text: "Detecting bugs & syntax issues...", icon: Bug, color: "text-accentRed" },
  { text: "Building step-by-step breakdown...", icon: Cpu, color: "text-accentYellow" },
  { text: "Almost ready...", icon: Sparkles, color: "text-accentCyan" }
];

export default function LoadingAnimation() {
  const [index, setIndex] = useState(0);

  // Cycle messages every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const ActiveIcon = MESSAGES[index].icon;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md">
      {/* Background radial glow */}
      <div className="absolute h-96 w-96 rounded-full bg-accentCyan/5 blur-[120px] animate-pulse-glow" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-md">
        
        {/* Glowing Orb Animation */}
        <div className="relative flex h-24 w-24 items-center justify-center mb-10">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accentCyan via-accentPurple to-accentYellow opacity-30 blur-md animate-spin" style={{ animationDuration: '6s' }} />
          <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center border border-border">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ rotate: -45, scale: 0.7, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 45, scale: 0.7, opacity: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 12 }}
                className={MESSAGES[index].color}
              >
                <ActiveIcon className="h-8 w-8" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* AI Branding */}
        <span className="font-heading text-xs font-bold uppercase tracking-widest text-accentCyan mb-2 flex items-center gap-1.5 justify-center">
          <Sparkles className="h-3 w-3 animate-pulse" /> CodeLens AI Explainer
        </span>

        {/* Message crossfader */}
        <div className="h-8 mb-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-textMain font-heading text-lg font-extrabold tracking-wide"
            >
              {MESSAGES[index].text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-64 h-1.5 rounded-full bg-border/60 overflow-hidden relative border border-border/20 shadow-inner">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 14,
              ease: "easeInOut",
              repeat: Infinity
            }}
            className="h-full bg-gradient-to-r from-accentCyan via-accentPurple to-accentYellow rounded-full shadow-[0_0_10px_rgba(0,245,196,0.5)]"
          />
        </div>

        {/* Action description info */}
        <p className="text-xs text-mutedMain/70 mt-6 max-w-[280px]">
          Our LLM model (Llama-3.3-70b) is breaking down lines of code and building memory traces...
        </p>
      </div>
    </div>
  );
}
