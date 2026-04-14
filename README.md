# Academic IDE: Regular Expression & Automata Research Tool

Academic IDE is a high-fidelity, interactive environment designed for students and researchers of **Theory of Automata and Formal Languages (TAFL)**. It provides a robust suite of tools for exploring Regular Expressions (RE), visualizing Finite Automata, and verifying formal language properties with step-by-step algorithmic transparency.


## 🚀 Features

### 1. RE Explorer & Construction
Convert Regular Expressions into visual automata using industry-standard algorithms.
- **Thompson's Construction**: Watch the step-by-step transformation of RE tokens into a Non-deterministic Finite Automaton (NFA).
- **Powerset Construction**: Visualize the NFA to DFA conversion process using ε-closure and state-set mapping.
- **Hopcroft's Algorithm**: Observe DFA minimization through iterative partition refinement.

### 2. Membership & Testing
- **Real-time Testing**: Validate strings against your constructed DFA.
- **String Generation**: Automatically generate valid strings accepted by the current language (up to defined complexity limits).

### 3. Equivalence Verifier
- **Formal Verification**: Compare two different Regular Expressions to determine if they describe the same language.
- **Counter-example Generation**: If two expressions are not equivalent, the engine performs a Breadth-First Search (BFS) to find the shortest string that differentiates them.

### 4. Interactive Visualizer
- **D3.js Powered**: High-performance, force-directed graphs for automaton visualization.
- **State Highlighting**: Visual feedback during algorithm execution steps.

### 5. AI-Powered Documentation
- Integrated documentation system powered by **Gemini AI** to help students understand complex TAFL concepts like Kleene Star, Union, and Concatenation.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4 (Cyber-grid aesthetic)
- **Animations**: Motion (framer-motion)
- **Visualization**: D3.js
- **AI**: Google Gemini API (@google/genai)
- **Icons**: Lucide React

## 📂 Project Structure

```text
src/
├── components/
│   ├── AutomatonVisualizer.tsx  # D3.js rendering logic
│   ├── Explorer.tsx             # RE to NFA/DFA workbench
│   ├── Verifier.tsx             # Equivalence testing UI
│   └── Documentation.tsx        # AI-assisted learning center
├── lib/
│   ├── REEngine.ts              # Core automata algorithms
│   └── ConstructionEngine.ts    # Step-by-step generator logic
└── App.tsx                      # Main layout and navigation
