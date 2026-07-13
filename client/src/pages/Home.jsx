import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles, Terminal, Bug, Cpu, Layers, ChevronRight, HelpCircle, ArrowRight, ShieldCheck, Star } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 16 }
  }
};

// Interactive Demo Mockup States
const SIMULATED_STEPS = [
  {
    step: 1,
    line: "def factorial(n):\n    if n == 0:\n        return 1",
    activeLines: [1, 2],
    title: "Function Invocations",
    explanation: "The computer receives factorial(3). It checks if n is 0. Since n is 3, it skips the base case and schedules a multiplication.",
    stack: ["factorial(3)  [n = 3]"],
    heap: "factorial(3) call allocated on stack frame.",
    analogy: "Think of it like opening a nested Russian doll. You can't see the tiny doll inside without opening the outer ones first."
  },
  {
    step: 2,
    line: "    return n * factorial(n - 1)",
    activeLines: [4],
    title: "Call Stack Recursion",
    explanation: "To solve factorial(3), the CPU must solve factorial(2), which requires factorial(1), and then factorial(0). The calls stack up in memory.",
    stack: [
      "factorial(1)  [n = 1]",
      "factorial(2)  [n = 2]",
      "factorial(3)  [n = 3]"
    ],
    heap: "Multiple frames pushed onto Call Stack. Stack Pointer decrements.",
    analogy: "You are writing down a list of helper tasks to do. You can't complete the main task until the helpers finish their jobs."
  },
  {
    step: 3,
    line: "        return 1",
    activeLines: [3],
    title: "Base Case Hits & Collapses",
    explanation: "factorial(0) is hit. It immediately returns 1. The Call Stack now collapses, multiplying results back up: 1 * 1 * 2 * 3 = 6.",
    stack: [],
    heap: "Stack frames popped. Return values stored in CPU registers. Memory released.",
    analogy: "You finally reached the smallest Russian doll! Now you close them all back up, recording the sizes as you go."
  }
];

export default function Home() {
  const [demoStep, setDemoStep] = useState(0);

  // Auto-advance simulated step every 6 seconds if user doesn't interact
  useEffect(() => {
    const timer = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % SIMULATED_STEPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const activeDemo = SIMULATED_STEPS[demoStep];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden flex flex-col justify-between">
      
      {/* Background Graphic Layers */}
      <div className="absolute inset-0 bg-background z-0" />
      <div className="bg-grid-lines z-0" />

      {/* Rotating Fluid Mesh Backdrops */}
      <div className="absolute top-[8%] left-[5%] h-[400px] w-[400px] rounded-full bg-accentCyan/8 blur-[130px] animate-orb-float-1 pointer-events-none z-0" />
      <div className="absolute bottom-[12%] right-[2%] h-[500px] w-[500px] rounded-full bg-accentPurple/8 blur-[140px] animate-orb-float-2 pointer-events-none z-0" />
      <div className="absolute bottom-[2%] left-[25%] h-[380px] w-[380px] rounded-full bg-accentYellow/5 blur-[100px] animate-orb-float-3 pointer-events-none z-0" />

      {/* Master Hero Grid */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24 flex-grow flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline & CTA Copy */}
          <div className="lg:col-span-6 text-left space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="space-y-6"
            >
              {/* Premium Glow Badge */}
              <motion.div 
                variants={itemVariants} 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accentCyan/30 bg-accentCyan/5 text-[10px] sm:text-xs font-heading font-extrabold uppercase tracking-widest text-accentCyan"
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-accentCyan" />
                <span>Next-Gen Explainer & Debugger</span>
              </motion.div>

              {/* Spectacular Headline */}
              <motion.h1
                variants={itemVariants}
                className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-5xl leading-tight text-textMain"
              >
                Understand Code <br />
                <span className="bg-gradient-to-r from-accentCyan via-textMain to-accentPurple bg-clip-text text-transparent">
                  Like Never Before
                </span>
              </motion.h1>

              {/* Premium Subtitle */}
              <motion.p
                variants={itemVariants}
                className="text-sm sm:text-base text-mutedMain max-w-lg leading-relaxed font-body"
              >
                Paste your code, and watch it transform into an interactive execution tree. Trace memory cycles on the Call Stack, enjoy real-world analogies, and fix buggy logic instantly.
              </motion.p>

              {/* Glowing CTA button matrix */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Link
                  to="/analyze"
                  className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-heading text-xs font-extrabold uppercase tracking-widest text-background bg-accentCyan hover:opacity-95 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,245,196,0.2)] hover:shadow-[0_0_35px_rgba(0,245,196,0.45)] w-full sm:w-auto"
                >
                  <span>Start Debugging</span>
                  <Play className="h-3.5 w-3.5 fill-background transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/history"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl border border-border bg-surface hover:bg-surface2 hover:border-accentCyan/30 text-xs font-heading font-extrabold uppercase tracking-widest text-textMain transition-all w-full sm:w-auto"
                >
                  <span>View Sessions</span>
                </Link>
              </motion.div>

              {/* Tiny Trust Review Line */}
              <motion.div 
                variants={itemVariants}
                className="flex items-center gap-2 pt-2 text-[10px] text-mutedMain uppercase tracking-wider font-semibold"
              >
                <div className="flex text-accentYellow">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-accentYellow" />)}
                </div>
                <span>Free static compiler & explanation scans</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column: Simulated Interactive Debug Preview Player */}
          <div className="lg:col-span-6 w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.2 }}
              className="glass-card rounded-2xl border border-border p-5 bg-surface/85 relative overflow-hidden shadow-2xl"
            >
              {/* Header player bar */}
              <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4">
                <div className="flex items-center gap-2 text-left">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80"></span>
                    <span className="h-3 w-3 rounded-full bg-amber-500/80"></span>
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <span className="ml-2 font-code text-xs text-accentCyan flex items-center gap-1">
                    <Terminal className="h-3.5 w-3.5" /> factorial.py
                  </span>
                </div>

                {/* Step tabs selection */}
                <div className="flex items-center gap-1.5 bg-surface2/60 px-2 py-1 rounded-lg border border-border/60">
                  {SIMULATED_STEPS.map((stepObj, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDemoStep(idx)}
                      className={`h-5 px-2 rounded text-[10px] font-heading font-black transition-all ${
                        demoStep === idx 
                          ? 'bg-accentCyan text-background shadow-[0_0_10px_rgba(0,245,196,0.3)]' 
                          : 'text-mutedMain hover:text-textMain'
                      }`}
                    >
                      {stepObj.step}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code visual highlights */}
              <div className="rounded-xl bg-surface2/80 border border-border/40 p-4 font-code text-xs sm:text-sm text-left mb-4 overflow-hidden relative min-h-[105px]">
                <pre className="text-textMain/90 select-none">
                  {SIMULATED_STEPS[0].line.split('\n').map((lineText, lIdx) => {
                    const isLineActive = activeDemo.activeLines.includes(lIdx + 1);
                    return (
                      <div 
                        key={lIdx} 
                        className={`transition-colors duration-300 py-0.5 px-2 rounded ${
                          isLineActive 
                            ? 'bg-accentCyan/15 text-accentCyan font-bold border-l-2 border-accentCyan -ml-2' 
                            : ''
                        }`}
                      >
                        {lineText}
                      </div>
                    );
                  })}
                </pre>
              </div>

              {/* Interactive explanations box */}
              <div className="space-y-3.5 text-left border-t border-border/50 pt-4">
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-widest text-accentCyan mb-1">
                    {activeDemo.title}
                  </h4>
                  <p className="text-xs text-textMain/80 leading-relaxed min-h-[50px] font-body">
                    {activeDemo.explanation}
                  </p>
                </div>

                {/* Under the hood memory stack representation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface2/40 border border-border/40 p-3 min-h-[92px]">
                    <h5 className="text-[10px] uppercase font-black tracking-widest text-accentPurple mb-1.5 flex items-center gap-1">
                      <Cpu className="h-3 w-3" /> Call Stack
                    </h5>
                    {activeDemo.stack.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {activeDemo.stack.map((stackLine, sIdx) => (
                          <div key={sIdx} className="text-[10px] font-code bg-surface px-1.5 py-0.5 rounded border border-border/60 text-textMain/85">
                            {stackLine}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] italic text-mutedMain/60 leading-relaxed">
                        Stack frame popped! Returns value.
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-accentYellow/5 border border-accentYellow/10 p-3 min-h-[92px]">
                    <h5 className="text-[10px] uppercase font-black tracking-widest text-accentYellow mb-1">
                       Think of it like
                    </h5>
                    <p className="text-[10px] text-textMain/80 italic font-body leading-relaxed">
                      {activeDemo.analogy}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>


        {/* Feature showcase grid */}
        <div className="mt-28 pb-16">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-wide uppercase">
              Engineered For Learning
            </h2>
            <p className="text-xs sm:text-sm text-mutedMain mt-2">
              Deep conceptual scanning wrapped in beautiful user experiences.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Layers,
                title: "Step-by-Step Tracing",
                desc: "Every logical section of your code parsed into discrete stages. Perfect for tracing looping structures and complex conditional blocks.",
                color: "text-accentCyan bg-accentCyan/10 border-accentCyan/20"
              },
              {
                icon: Bug,
                title: "Precision Bug Scanning",
                desc: "Captures syntactical bugs, structural errors, or arithmetic bugs instantly. Compare buggy lines directly against Suggested Corrections.",
                color: "text-accentRed bg-accentRed/10 border-accentRed/20"
              },
              {
                icon: Cpu,
                title: "Under-the-Hood Details",
                desc: "Demystifies compilation behavior. Learn how the CPU interacts, registers variables, handles frames on the Call Stack, and manages memory.",
                color: "text-accentPurple bg-accentPurple/10 border-accentPurple/20"
              }
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass-card rounded-2xl p-6 border border-border text-left hover:border-accentCyan/25 group"
              >
                <div className={`p-3 rounded-xl border flex-shrink-0 w-fit mb-5 transition-transform duration-300 group-hover:scale-105 ${feat.color}`}>
                  <feat.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-base font-extrabold uppercase text-textMain/90 tracking-wide mb-2.5">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-mutedMain font-body leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer copyright */}
      <footer className="relative z-10 w-full border-t border-border/30 py-6 text-center text-[10px] text-mutedMain/50 uppercase tracking-widest font-semibold bg-background">
        © 2026 CodeLens AI. Built for students and developers.
      </footer>
    </div>
  );
}
