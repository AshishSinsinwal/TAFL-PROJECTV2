/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Explorer from "./components/Explorer";
import Verifier from "./components/Verifier";
import Documentation from "./components/Documentation";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Code2, CheckCircle2, BookOpen } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("explorer");

  const menuItems = [
    { id: "explorer", label: "RE Explorer", icon: Code2 },
    { id: "verifier", label: "Equivalence Verifier", icon: CheckCircle2 },
    { id: "docs", label: "Documentation", icon: BookOpen },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "explorer":
        return <Explorer />;
      case "verifier":
        return <Verifier />;
      case "docs":
        return <Documentation setActiveTab={setActiveTab} />;
      default:
        return <Explorer />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg text-slate-200 overflow-hidden cyber-grid">
      {/* Top bar with Navigation */}
      <header className="h-20 border-b border-border/50 flex items-center px-8 justify-between z-50 bg-bg/40 backdrop-blur-2xl shrink-0">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(92,225,230,0.4)] group-hover:shadow-[0_0_25px_rgba(92,225,230,0.6)] transition-all duration-300">
              <Terminal className="text-bg w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-[0.15em] text-white leading-none uppercase">Academic IDE</h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold mt-1.5">Research Grade Tool</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                  activeTab === item.id
                    ? "bg-accent/15 text-accent shadow-[inset_0_0_10px_rgba(92,225,230,0.1)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface/40"
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-accent drop-shadow-[0_0_5px_rgba(92,225,230,0.5)]" : "text-slate-500"}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top bar subtle gradient */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
