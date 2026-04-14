import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RotateCcw, Info, Zap, Layers, ListTree, Cpu, Pause, SkipBack, SkipForward } from "lucide-react";
import { REEngine, Automaton } from "../lib/REEngine";
import { ConstructionEngine, ConstructionStep } from "../lib/ConstructionEngine";
import AutomatonVisualizer from "./AutomatonVisualizer";

export default function Explorer() {
  const [expression, setExpression] = useState("a(b|c)*");
  const [nfa, setNfa] = useState<Automaton | null>(null);
  const [dfa, setDfa] = useState<Automaton | null>(null);
  const [validStrings, setValidStrings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Construction Mode State
  const [steps, setSteps] = useState<ConstructionStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1500);
  const [showConstruction, setShowConstruction] = useState(false);

  const currentStep = steps[currentStepIdx];

  const operators = [
    { label: "*", value: "*", description: "Kleene Star (0 or more)" },
    { label: "+", value: "+", description: "Plus (1 or more)" },
    { label: "|", value: "|", description: "Union (OR)" },
    { label: "?", value: "?", description: "Optional (0 or 1)" },
    { label: "ε", value: "ε", description: "Epsilon (Empty string)" },
    { label: "( )", value: "()", description: "Grouping" },
    { label: "[a-z]", value: "[a-z]", description: "Lowercase range" },
    { label: "[0-9]", value: "[0-9]", description: "Numeric range" },
  ];

  useEffect(() => {
    try {
      const newNfa = REEngine.parseToNFA(expression);
      const newDfa = REEngine.minimizeDFA(REEngine.nfaToDFA(newNfa));
      const strings = REEngine.generateStrings(newDfa, 12);
      
      setNfa(newNfa);
      setDfa(newDfa);
      setValidStrings(strings);
      setError(null);

      // Update construction steps
      const gen = ConstructionEngine.thompsonSteps(expression);
      const newSteps = Array.from(gen);
      setSteps(newSteps);
      setCurrentStepIdx(0);
    } catch (e) {
      setError("Invalid Regular Expression");
      setNfa(null);
      setDfa(null);
      setValidStrings([]);
      setSteps([]);
    }
  }, [expression]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && currentStepIdx < steps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIdx(prev => prev + 1);
      }, playbackSpeed);
    } else if (currentStepIdx === steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIdx, steps.length, playbackSpeed]);

  const handleOperatorClick = (op: string) => {
    if (op === "()") {
      setExpression(prev => prev + "()");
    } else {
      setExpression(prev => prev + op);
    }
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
      <header className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-3 tracking-[0.1em] uppercase">RE Explorer</h2>
        <p className="text-slate-400 font-medium">Design and analyze regular expressions with research-grade precision.</p>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Editor Area */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="glass-panel p-8 relative overflow-hidden group/panel">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/panel:bg-accent/10 transition-all duration-500" />
            
            <div className="flex items-center justify-between mb-6">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2.5">
                <Terminal className="w-4 h-4" />
                Expression Input
              </label>
              <button 
                onClick={() => setExpression("")}
                className="text-slate-500 hover:text-accent transition-all duration-300 hover:rotate-180"
                title="Clear Input"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                className={`w-full bg-bg/40 backdrop-blur-md border-2 ${error ? 'border-error/40 shadow-[0_0_15px_rgba(248,113,113,0.1)]' : 'border-border'} text-3xl font-mono px-6 py-6 rounded-2xl focus:outline-none focus:border-accent/50 focus:shadow-[0_0_25px_rgba(92,225,230,0.15)] transition-all duration-300`}
                placeholder="Enter RE (e.g., a(b|c)*)"
              />
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-8 left-2 text-[10px] text-error font-bold uppercase tracking-widest"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {operators.map((op) => (
                <button
                  key={op.label}
                  onClick={() => handleOperatorClick(op.value)}
                  className="group relative px-4 py-2.5 bg-bg/30 border border-border hover:border-accent/40 hover:bg-accent/5 rounded-xl transition-all duration-300 cursor-pointer"
                >
                  <span className="text-sm font-mono text-slate-400 group-hover:text-accent group-hover:drop-shadow-[0_0_5px_rgba(92,225,230,0.5)]">{op.label}</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-surface/95 backdrop-blur-md text-[10px] text-white rounded-lg border border-border opacity-0 group-hover:opacity-100 pointer-events-none w-max max-w-[150px] text-center z-50 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 font-bold tracking-wider shadow-2xl">
                    {op.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Thompson Construction Visualization */}
          <div className="glass-panel overflow-hidden flex flex-col group">
            <div className="p-8 border-b border-border/50 flex items-center justify-between bg-surface/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-[inset_0_0_10px_rgba(92,225,230,0.1)]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wider uppercase">Thompson Construction</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">NFA Generation Sequence</p>
                </div>
              </div>
              <button
                onClick={() => setShowConstruction(!showConstruction)}
                className="btn-secondary text-[10px] uppercase tracking-[0.2em] px-5 py-2.5"
              >
                {showConstruction ? 'Deactivate Visualizer' : 'Activate Visualizer'}
              </button>
            </div>

            <AnimatePresence>
              {showConstruction && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-8 space-y-8">
                    <div className="h-[450px] relative rounded-2xl overflow-hidden border border-border/30 bg-bg/20">
                      {currentStep && (
                        <AutomatonVisualizer 
                          automaton={currentStep.automaton}
                          highlightedStates={currentStep.highlightedStates}
                          highlightedTransitions={currentStep.highlightedTransitions}
                          height={450}
                        />
                      )}
                      
                      {/* Playback Controls Overlay */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-bg/60 backdrop-blur-xl p-2 rounded-2xl border border-border/50 shadow-2xl">
                        <button
                          onClick={() => { setCurrentStepIdx(0); setIsPlaying(false); }}
                          className="p-2.5 rounded-xl hover:bg-surface/60 text-slate-400 hover:text-accent transition-all duration-300 cursor-pointer"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => { setCurrentStepIdx(prev => Math.max(0, prev - 1)); setIsPlaying(false); }}
                          className="p-2.5 rounded-xl hover:bg-surface/60 text-slate-400 hover:text-accent transition-all duration-300 cursor-pointer"
                        >
                          <SkipBack className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-12 h-12 rounded-xl bg-accent text-bg flex items-center justify-center hover:brightness-110 hover:shadow-[0_0_15px_rgba(92,225,230,0.4)] transition-all duration-300 cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>
                        <button
                          onClick={() => { setCurrentStepIdx(prev => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }}
                          className="p-2.5 rounded-xl hover:bg-surface/60 text-slate-400 hover:text-accent transition-all duration-300 cursor-pointer"
                        >
                          <SkipForward className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="glass-panel p-6 bg-accent/5 border-accent/20 flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0 shadow-[inset_0_0_10px_rgba(92,225,230,0.1)]">
                        <Info className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Step {currentStepIdx + 1} of {steps.length}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold">{Math.round(((currentStepIdx + 1) / steps.length) * 100)}% Complete</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">{currentStep?.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language Membership Gallery */}
          <div className="glass-panel p-8 group">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-8 flex items-center gap-3">
              <ListTree className="w-4 h-4" />
              Language Membership Gallery
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {validStrings.map((str, idx) => (
                  <motion.div
                    key={`${str}-${idx}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-bg/30 border border-border p-4 rounded-xl flex items-center justify-center font-mono text-sm text-slate-300 hover:border-accent/40 hover:bg-accent/5 hover:shadow-[0_0_15px_rgba(92,225,230,0.05)] transition-all duration-300 group/item"
                  >
                    <span className="group-hover/item:text-accent transition-colors duration-300">{str}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {validStrings.length === 0 && !error && (
                <p className="col-span-full text-center py-12 text-slate-500 italic text-sm font-medium">
                  No strings generated for this expression.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebars */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Complexity Analysis */}
          <div className="glass-panel p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-3xl -mr-12 -mt-12" />
            
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary mb-8 flex items-center gap-3">
              <Zap className="w-4 h-4" />
              Complexity Analysis
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center group/stat">
                <span className="text-sm text-slate-400 font-medium group-hover/stat:text-slate-300 transition-colors">NFA States</span>
                <span className="text-sm font-mono font-bold text-white bg-surface/50 px-3 py-1 rounded-lg border border-border/50 group-hover/stat:border-secondary/30 transition-all">{nfa?.states.size || 0}</span>
              </div>
              <div className="flex justify-between items-center group/stat">
                <span className="text-sm text-slate-400 font-medium group-hover/stat:text-slate-300 transition-colors">DFA States (Min)</span>
                <span className="text-sm font-mono font-bold text-white bg-surface/50 px-3 py-1 rounded-lg border border-border/50 group-hover/stat:border-secondary/30 transition-all">{dfa?.states.size || 0}</span>
              </div>
              <div className="flex justify-between items-center group/stat">
                <span className="text-sm text-slate-400 font-medium group-hover/stat:text-slate-300 transition-colors">Alphabet Size</span>
                <span className="text-sm font-mono font-bold text-white bg-surface/50 px-3 py-1 rounded-lg border border-border/50 group-hover/stat:border-secondary/30 transition-all">{dfa?.alphabet.size || 0}</span>
              </div>
              <div className="pt-6 border-t border-border/50">
                <div className="flex items-start gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  <Info className="w-4 h-4 text-secondary shrink-0" />
                  <span>Scan Time Complexity: O(n) where n is input length</span>
                </div>
              </div>
            </div>
          </div>

          {/* State Transition Map */}
          <div className="glass-panel p-8">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-8 flex items-center gap-3">
              <Layers className="w-4 h-4" />
              State Transition Map
            </h3>
            <div className="max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="pb-4 text-[10px] uppercase text-slate-500 font-bold tracking-[0.2em]">From</th>
                    <th className="pb-4 text-[10px] uppercase text-slate-500 font-bold tracking-[0.2em]">Sym</th>
                    <th className="pb-4 text-[10px] uppercase text-slate-500 font-bold tracking-[0.2em]">To</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {dfa?.transitions.map((t, idx) => (
                    <tr key={idx} className="border-b border-border/30 hover:bg-accent/5 transition-all duration-300 group/row">
                      <td className="py-4 text-slate-300 group-hover/row:text-white transition-colors">
                        <span className="bg-surface/50 px-2 py-1 rounded border border-border/30 mr-2">q{t.from}</span>
                        {dfa.startState === t.from && <span className="text-[8px] text-accent font-bold tracking-tighter">START</span>}
                        {dfa.acceptStates.has(t.from) && <span className="text-[8px] text-success font-bold tracking-tighter ml-1">ACC</span>}
                      </td>
                      <td className="py-4">
                        <span className="text-accent font-bold bg-accent/10 px-2 py-1 rounded border border-accent/20">{t.symbol}</span>
                      </td>
                      <td className="py-4 text-slate-300 group-hover/row:text-white transition-colors">
                        <span className="bg-surface/50 px-2 py-1 rounded border border-border/30">q{t.to}</span>
                      </td>
                    </tr>
                  ))}
                  {(!dfa || dfa.transitions.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-500 italic font-medium">
                        No transitions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Terminal({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
