import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, ArrowRightLeft, AlertCircle, Info } from "lucide-react";
import { REEngine } from "../lib/REEngine";

export default function Verifier() {
  const [reA, setReA] = useState("a(b|c)*");
  const [reB, setReB] = useState("ab*|ac*");
  const [result, setResult] = useState<{ equivalent: boolean; counterExample?: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = () => {
    setIsVerifying(true);
    setError(null);
    
    // Artificial delay for "Engine" feel
    setTimeout(() => {
      try {
        const res = REEngine.areEquivalent(reA, reB);
        setResult(res);
      } catch (e) {
        setError("One or both expressions are invalid.");
        setResult(null);
      } finally {
        setIsVerifying(false);
      }
    }, 600);
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
      <header className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-3 tracking-[0.1em] uppercase">Equivalence Verifier</h2>
        <p className="text-slate-400 font-medium">Compare two regular expressions to verify formal language equivalence.</p>
      </header>

      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="flex-1 w-full space-y-3 group">
            <label className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold ml-1">Expression A</label>
            <input
              type="text"
              value={reA}
              onChange={(e) => setReA(e.target.value)}
              className="w-full bg-bg/40 backdrop-blur-md border border-border text-xl font-mono px-6 py-5 rounded-2xl focus:outline-none focus:border-accent/50 focus:shadow-[0_0_20px_rgba(92,225,230,0.1)] transition-all duration-300"
              placeholder="e.g., (a|b)*"
            />
          </div>

          <div className="hidden lg:flex justify-center pt-8">
            <div className="w-12 h-12 rounded-full bg-surface/40 border border-border flex items-center justify-center text-slate-500 shadow-inner group-hover:text-accent transition-colors duration-500">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
          </div>

          <div className="flex-1 w-full space-y-3 group">
            <label className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold ml-1">Expression B</label>
            <input
              type="text"
              value={reB}
              onChange={(e) => setReB(e.target.value)}
              className="w-full bg-bg/40 backdrop-blur-md border border-border text-xl font-mono px-6 py-5 rounded-2xl focus:outline-none focus:border-accent/50 focus:shadow-[0_0_20px_rgba(92,225,230,0.1)] transition-all duration-300"
              placeholder="e.g., a*b*"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleVerify}
            disabled={isVerifying || !reA || !reB}
            className="btn-primary flex items-center gap-3 px-10 py-4 text-sm"
          >
            {isVerifying ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <RotateCcw className="w-5 h-5" />
                </motion.div>
                Verifying Engine...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Verify Equivalence
              </>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-panel p-8 border-error/30 bg-error/5 flex items-center gap-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center text-error shrink-0">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-error font-bold uppercase tracking-widest text-sm mb-1">Verification Error</h4>
                <p className="text-sm text-slate-400 font-medium">{error}</p>
              </div>
            </motion.div>
          )}

          {result && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`glass-panel p-10 border-2 relative overflow-hidden ${
                result.equivalent ? "border-success/30 bg-success/5" : "border-error/30 bg-error/5"
              }`}
            >
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] -mr-32 -mt-32 opacity-20 ${
                result.equivalent ? "bg-success" : "bg-error"
              }`} />
              
              <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl ${
                  result.equivalent ? "bg-success/20 text-success shadow-success/10" : "bg-error/20 text-error shadow-error/10"
                }`}>
                  {result.equivalent ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className={`text-4xl font-bold mb-3 tracking-tighter ${result.equivalent ? "text-success" : "text-error"}`}>
                    {result.equivalent ? "EQUIVALENT" : "NOT EQUIVALENT"}
                  </h3>
                  <p className="text-slate-300 leading-relaxed font-medium max-w-2xl">
                    {result.equivalent 
                      ? "Both expressions define the exact same regular language. Their minimized DFAs are isomorphic, confirming structural and functional identity."
                      : "These expressions define different languages. There exists at least one string that is accepted by one but rejected by the other, proving non-equivalence."}
                  </p>
                </div>

                {!result.equivalent && result.counterExample && (
                  <div className="w-full md:w-auto glass-panel p-6 bg-bg/60 border-error/20 rounded-2xl">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-error font-bold mb-3">Counter-example</p>
                    <div className="font-mono text-2xl text-white bg-error/10 px-6 py-3 rounded-xl border border-error/20 shadow-[inset_0_0_15px_rgba(248,113,113,0.1)]">
                      {result.counterExample === "" ? "ε (empty)" : result.counterExample}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-panel p-8 bg-secondary/5 border-secondary/20 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary/40 group-hover:bg-secondary transition-colors duration-500" />
          <div className="flex gap-6">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Verification Methodology</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                The engine utilizes a research-grade pipeline: Thompson's construction for NFA generation, powerset construction for DFA conversion, and Hopcroft's algorithm for state minimization. Equivalence is verified through a state-space search for distinguishing strings, ensuring mathematical certainty in the results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RotateCcw({ className }: { className?: string }) {
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
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
