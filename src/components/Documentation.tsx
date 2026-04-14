import { Book, Code, Zap, Layers, HelpCircle } from "lucide-react";

interface DocumentationProps {
  setActiveTab: (tab: string) => void;
}

export default function Documentation({ setActiveTab }: DocumentationProps) {
  const sections = [
    {
      title: "Regular Expressions",
      icon: Code,
      content: "A regular expression (RE) is a sequence of characters that specifies a search pattern in text. In formal language theory, they describe regular languages, which are the simplest class of languages in the Chomsky hierarchy."
    },
    {
      title: "Thompson's Construction",
      icon: Zap,
      content: "An algorithm that transforms a regular expression into an equivalent non-deterministic finite automaton (NFA). It works by recursively building NFAs for each sub-expression and joining them with epsilon transitions."
    },
    {
      title: "DFA Minimization",
      icon: Layers,
      content: "The process of transforming a given DFA into an equivalent DFA that has the minimum number of states. This IDE uses Hopcroft's algorithm, which partitions states into equivalence classes based on their transition behavior."
    },
    {
      title: "Equivalence Testing",
      icon: HelpCircle,
      content: "Two regular expressions are equivalent if they define the same language. This is verified by comparing their minimized DFAs. If the minimized DFAs are isomorphic, the expressions are equivalent."
    }
  ];

  const operators = [
    { symbol: "*", name: "Kleene Star", example: "a*", desc: "Zero or more 'a's" },
    { symbol: "+", name: "Plus", example: "a+", desc: "One or more 'a's" },
    { symbol: "|", name: "Union", example: "a|b", desc: "Either 'a' or 'b'" },
    { symbol: "?", name: "Optional", example: "a?", desc: "Zero or one 'a'" },
    { symbol: "ε", name: "Epsilon", example: "ε", desc: "The empty string" },
    { symbol: "( )", name: "Grouping", example: "(ab)*", desc: "Treats 'ab' as a unit" },
  ];

  return (
    <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
      <header className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-3 tracking-[0.1em] uppercase">Documentation</h2>
        <p className="text-slate-400 font-medium">Master the theoretical foundations and algorithms powering the Academic IDE.</p>
      </header>

      <div className="max-w-6xl mx-auto space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section) => (
            <div key={section.title} className="glass-panel p-8 hover:border-accent/40 hover:shadow-[0_0_20px_rgba(92,225,230,0.05)] transition-all duration-500 group">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors duration-500">
                  <section.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide uppercase">{section.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <section className="space-y-8">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent flex items-center gap-3">
            <Book className="w-5 h-5" />
            Operator Reference Manual
          </h3>
          <div className="glass-panel overflow-hidden border-border/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface/40 border-b border-border/50">
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Symbol</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Name</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Example</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {operators.map((op) => (
                  <tr key={op.symbol} className="hover:bg-accent/5 transition-all duration-300 group">
                    <td className="px-8 py-5 font-mono text-accent font-bold text-lg group-hover:drop-shadow-[0_0_5px_rgba(92,225,230,0.5)] transition-all">{op.symbol}</td>
                    <td className="px-8 py-5 text-sm text-slate-200 font-bold tracking-wide">{op.name}</td>
                    <td className="px-8 py-5 font-mono text-xs text-secondary font-bold">{op.example}</td>
                    <td className="px-8 py-5 text-sm text-slate-400 font-medium leading-relaxed">{op.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="glass-panel p-12 bg-accent/5 border-accent/20 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-[100px] -mt-48 pointer-events-none" />
          
          <div className="relative z-10">
            <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">Ready to begin your research?</h4>
            <p className="text-slate-400 mb-10 max-w-lg mx-auto font-medium">Head over to the RE Explorer to start designing, analyzing, and visualizing your own formal languages.</p>
            <button 
              onClick={() => setActiveTab("explorer")}
              className="btn-primary"
            >
              Initialize Explorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
