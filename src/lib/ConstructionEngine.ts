import { Automaton, State, Transition } from "./REEngine";

export interface ConstructionStep {
  automaton: Automaton;
  description: string;
  highlightedStates?: Set<State>;
  highlightedTransitions?: number[];
  type: 'thompson' | 'powerset' | 'hopcroft';
  partitions?: Set<number>[];
}

export class ConstructionEngine {
  private static stateCounter = 0;

  private static newState(): State {
    return this.stateCounter++;
  }

  /**
   * Thompson's Construction with steps
   */
  static *thompsonSteps(re: string): Generator<ConstructionStep> {
    this.stateCounter = 0;
    const tokens = this.tokenize(re);
    const postfix = this.toPostfix(tokens);
    
    const stack: Automaton[] = [];
    
    yield {
      automaton: { states: new Set(), alphabet: new Set(), transitions: [], startState: -1, acceptStates: new Set() },
      description: `Starting Thompson's construction for: ${re}. Postfix expression: ${postfix.join(' ')}`,
      type: 'thompson'
    };

    for (const token of postfix) {
      let result: Automaton;
      let desc = "";

      if (token === '*') {
        const a = stack.pop()!;
        result = this.kleeneStar(a);
        desc = "Applied Kleene Star (*) operator";
      } else if (token === '+') {
        const a = stack.pop()!;
        result = this.plus(a);
        desc = "Applied Plus (+) operator";
      } else if (token === '?') {
        const a = stack.pop()!;
        result = this.optional(a);
        desc = "Applied Optional (?) operator";
      } else if (token === '|') {
        const b = stack.pop()!;
        const a = stack.pop()!;
        result = this.union(a, b);
        desc = `Applied Union (|) operator on ${a.startState} and ${b.startState}`;
      } else if (token === '.') {
        const b = stack.pop()!;
        const a = stack.pop()!;
        result = this.concat(a, b);
        desc = `Applied Concatenation (.) operator on ${a.startState} and ${b.startState}`;
      } else {
        result = this.basicNFA(token);
        desc = `Created basic NFA for symbol: ${token}`;
      }

      stack.push(result);
      
      yield {
        automaton: this.cloneAutomaton(result),
        description: desc,
        type: 'thompson'
      };
    }
  }

  /**
   * Powerset Construction with steps
   */
  static *powersetSteps(nfa: Automaton): Generator<ConstructionStep> {
    const dfaTransitions: Transition[] = [];
    const dfaAcceptStates = new Set<number>();
    
    const startClosure = this.epsilonClosure(new Set([nfa.startState]), nfa);
    const startKey = Array.from(startClosure).sort().join(',');
    
    const stateMap = new Map<string, number>();
    stateMap.set(startKey, 0);
    
    const queue = [startKey];
    const visited = new Set([startKey]);
    
    let stateCounter = 0;

    yield {
      automaton: { 
        states: new Set([0]), 
        alphabet: nfa.alphabet, 
        transitions: [], 
        startState: 0, 
        acceptStates: new Set() 
      },
      description: `Initial state 0 created from ε-closure of NFA start state {${nfa.startState}}: {${startKey}}`,
      type: 'powerset',
      highlightedStates: new Set([0])
    };

    while (queue.length > 0) {
      const currentKey = queue.shift()!;
      const currentStates = new Set(currentKey.split(',').map(Number));
      const currentDFAState = stateMap.get(currentKey)!;
      
      if (Array.from(currentStates).some(s => nfa.acceptStates.has(s))) {
        dfaAcceptStates.add(currentDFAState);
      }
      
      for (const symbol of Array.from(nfa.alphabet).sort()) {
        const nextStates = new Set<number>();
        for (const s of currentStates) {
          for (const t of nfa.transitions) {
            if (t.from === s && t.symbol === symbol) {
              nextStates.add(t.to);
            }
          }
        }
        
        if (nextStates.size > 0) {
          const closure = this.epsilonClosure(nextStates, nfa);
          const nextKey = Array.from(closure).sort().join(',');
          
          let isNew = false;
          if (!visited.has(nextKey)) {
            visited.add(nextKey);
            stateCounter++;
            stateMap.set(nextKey, stateCounter);
            queue.push(nextKey);
            isNew = true;
          }
          
          const nextDFAState = stateMap.get(nextKey)!;
          dfaTransitions.push({
            from: currentDFAState,
            to: nextDFAState,
            symbol
          });

          yield {
            automaton: {
              states: new Set(Array.from(stateMap.values())),
              alphabet: nfa.alphabet,
              transitions: [...dfaTransitions],
              startState: 0,
              acceptStates: new Set(dfaAcceptStates)
            },
            description: `${isNew ? 'New' : 'Existing'} DFA state ${nextDFAState} reached from state ${currentDFAState} on symbol '${symbol}'. NFA states: {${nextKey}}`,
            type: 'powerset',
            highlightedStates: new Set([nextDFAState]),
            highlightedTransitions: [dfaTransitions.length - 1]
          };
        }
      }
    }
  }

  /**
   * Hopcroft's Algorithm with steps
   */
  static *hopcroftSteps(dfa: Automaton): Generator<ConstructionStep> {
    if (dfa.states.size === 0) return;

    const nonAccept = new Set(Array.from(dfa.states).filter(s => !dfa.acceptStates.has(s)));
    const accept = new Set(dfa.acceptStates);
    
    let partitions: Set<number>[] = [];
    if (nonAccept.size > 0) partitions.push(nonAccept);
    if (accept.size > 0) partitions.push(accept);

    yield {
      automaton: dfa,
      description: `Initial partitions: Non-Accepting {${Array.from(nonAccept).join(',')}} and Accepting {${Array.from(accept).join(',')}}`,
      type: 'hopcroft',
      partitions: [...partitions]
    };
    
    let changed = true;
    let iteration = 1;
    while (changed) {
      changed = false;
      const nextPartitions: Set<number>[] = [];
      
      for (let i = 0; i < partitions.length; i++) {
        const p = partitions[i];
        if (p.size <= 1) {
          nextPartitions.push(p);
          continue;
        }
        
        const splitMap = new Map<string, Set<number>>();
        for (const s of p) {
          const behavior: string[] = [];
          for (const symbol of Array.from(dfa.alphabet).sort()) {
            const transition = dfa.transitions.find(t => t.from === s && t.symbol === symbol);
            if (transition) {
              const targetPartitionIdx = partitions.findIndex(part => part.has(transition.to));
              behavior.push(`${symbol}:${targetPartitionIdx}`);
            } else {
              behavior.push(`${symbol}:-1`);
            }
          }
          const key = behavior.sort().join('|');
          if (!splitMap.has(key)) splitMap.set(key, new Set());
          splitMap.get(key)!.add(s);
        }
        
        if (splitMap.size > 1) {
          changed = true;
          const newParts = Array.from(splitMap.values());
          nextPartitions.push(...newParts);
          
          yield {
            automaton: dfa,
            description: `Iteration ${iteration}: Partition {${Array.from(p).join(',')}} split into ${newParts.map(np => '{' + Array.from(np).join(',') + '}').join(', ')}`,
            type: 'hopcroft',
            partitions: [...nextPartitions, ...partitions.slice(i + 1)]
          };
        } else {
          nextPartitions.push(p);
        }
      }
      partitions = nextPartitions;
      iteration++;
    }

    // Final step: Show minimized DFA
    const stateMap = new Map<number, number>();
    partitions.forEach((p, i) => {
      for (const s of p) stateMap.set(s, i);
    });
    
    const minTransitions: Transition[] = [];
    const minAcceptStates = new Set<number>();
    
    partitions.forEach((p, i) => {
      const representative = Array.from(p)[0];
      if (dfa.acceptStates.has(representative)) minAcceptStates.add(i);
      
      for (const symbol of dfa.alphabet) {
        const t = dfa.transitions.find(trans => trans.from === representative && trans.symbol === symbol);
        if (t) {
          minTransitions.push({
            from: i,
            to: stateMap.get(t.to)!,
            symbol
          });
        }
      }
    });

    yield {
      automaton: {
        states: new Set(partitions.keys()),
        alphabet: dfa.alphabet,
        transitions: minTransitions,
        startState: stateMap.get(dfa.startState)!,
        acceptStates: minAcceptStates
      },
      description: "Final minimized DFA constructed from partitions.",
      type: 'hopcroft'
    };
  }

  // Helper methods copied and adapted from REEngine
  private static tokenize(re: string): string[] {
    const tokens: string[] = [];
    for (let i = 0; i < re.length; i++) {
      const char = re[i];
      if (char === '[' && re.indexOf(']', i) !== -1) {
        const end = re.indexOf(']', i);
        tokens.push(re.substring(i, end + 1));
        i = end;
      } else {
        tokens.push(char);
      }
    }
    
    const result: string[] = [];
    const operators = new Set(['|', '*', '+', '?', '(', ')']);
    for (let i = 0; i < tokens.length; i++) {
      const t1 = tokens[i];
      result.push(t1);
      if (i + 1 < tokens.length) {
        const t2 = tokens[i + 1];
        if (
          t1 !== '(' && t1 !== '|' &&
          t2 !== ')' && t2 !== '|' && t2 !== '*' && t2 !== '+' && t2 !== '?'
        ) {
          result.push('.');
        }
      }
    }
    return result;
  }

  private static toPostfix(tokens: string[]): string[] {
    const output: string[] = [];
    const stack: string[] = [];
    const precedence: Record<string, number> = { '|': 1, '.': 2, '*': 3, '+': 3, '?': 3 };

    for (const token of tokens) {
      if (token === '(') stack.push(token);
      else if (token === ')') {
        while (stack.length > 0 && stack[stack.length - 1] !== '(') output.push(stack.pop()!);
        stack.pop();
      } else if (precedence[token]) {
        while (stack.length > 0 && stack[stack.length - 1] !== '(' && precedence[stack[stack.length - 1]] >= precedence[token]) {
          output.push(stack.pop()!);
        }
        stack.push(token);
      } else output.push(token);
    }
    while (stack.length > 0) output.push(stack.pop()!);
    return output;
  }

  private static basicNFA(symbol: string): Automaton {
    const s1 = this.newState();
    const s2 = this.newState();
    const alphabet = new Set<string>();
    const transitions: Transition[] = [];

    if (symbol === 'ε') {
      transitions.push({ from: s1, to: s2, symbol: null });
    } else if (symbol.startsWith('[') && symbol.endsWith(']')) {
      const range = symbol.slice(1, -1);
      if (range.includes('-')) {
        const [start, end] = range.split('-');
        for (let i = start.charCodeAt(0); i <= end.charCodeAt(0); i++) {
          const char = String.fromCharCode(i);
          alphabet.add(char);
          transitions.push({ from: s1, to: s2, symbol: char });
        }
      } else {
        for (const char of range) {
          alphabet.add(char);
          transitions.push({ from: s1, to: s2, symbol: char });
        }
      }
    } else {
      alphabet.add(symbol);
      transitions.push({ from: s1, to: s2, symbol });
    }

    return { states: new Set([s1, s2]), alphabet, transitions, startState: s1, acceptStates: new Set([s2]) };
  }

  private static concat(a: Automaton, b: Automaton): Automaton {
    const transitions = [...a.transitions, ...b.transitions];
    for (const acceptState of a.acceptStates) {
      transitions.push({ from: acceptState, to: b.startState, symbol: null });
    }
    return {
      states: new Set([...a.states, ...b.states]),
      alphabet: new Set([...a.alphabet, ...b.alphabet]),
      transitions,
      startState: a.startState,
      acceptStates: b.acceptStates
    };
  }

  private static union(a: Automaton, b: Automaton): Automaton {
    const s1 = this.newState();
    const s2 = this.newState();
    const transitions = [
      ...a.transitions,
      ...b.transitions,
      { from: s1, to: a.startState, symbol: null },
      { from: s1, to: b.startState, symbol: null }
    ];
    for (const acceptState of a.acceptStates) transitions.push({ from: acceptState, to: s2, symbol: null });
    for (const acceptState of b.acceptStates) transitions.push({ from: acceptState, to: s2, symbol: null });
    return {
      states: new Set([...a.states, ...b.states, s1, s2]),
      alphabet: new Set([...a.alphabet, ...b.alphabet]),
      transitions,
      startState: s1,
      acceptStates: new Set([s2])
    };
  }

  private static kleeneStar(a: Automaton): Automaton {
    const s1 = this.newState();
    const s2 = this.newState();
    const transitions = [
      ...a.transitions,
      { from: s1, to: a.startState, symbol: null },
      { from: s1, to: s2, symbol: null }
    ];
    for (const acceptState of a.acceptStates) {
      transitions.push({ from: acceptState, to: a.startState, symbol: null });
      transitions.push({ from: acceptState, to: s2, symbol: null });
    }
    return { states: new Set([...a.states, s1, s2]), alphabet: a.alphabet, transitions, startState: s1, acceptStates: new Set([s2]) };
  }

  private static plus(a: Automaton): Automaton {
    const s1 = this.newState();
    const s2 = this.newState();
    const transitions = [
      ...a.transitions,
      { from: s1, to: a.startState, symbol: null }
    ];
    for (const acceptState of a.acceptStates) {
      transitions.push({ from: acceptState, to: a.startState, symbol: null });
      transitions.push({ from: acceptState, to: s2, symbol: null });
    }
    return { states: new Set([...a.states, s1, s2]), alphabet: a.alphabet, transitions, startState: s1, acceptStates: new Set([s2]) };
  }

  private static optional(a: Automaton): Automaton {
    const s1 = this.newState();
    const s2 = this.newState();
    const transitions = [
      ...a.transitions,
      { from: s1, to: a.startState, symbol: null },
      { from: s1, to: s2, symbol: null }
    ];
    for (const acceptState of a.acceptStates) transitions.push({ from: acceptState, to: s2, symbol: null });
    return { states: new Set([...a.states, s1, s2]), alphabet: a.alphabet, transitions, startState: s1, acceptStates: new Set([s2]) };
  }

  private static epsilonClosure(states: Set<number>, nfa: Automaton): Set<number> {
    const closure = new Set(states);
    const stack = Array.from(states);
    while (stack.length > 0) {
      const s = stack.pop()!;
      for (const t of nfa.transitions) {
        if (t.from === s && t.symbol === null && !closure.has(t.to)) {
          closure.add(t.to);
          stack.push(t.to);
        }
      }
    }
    return closure;
  }

  private static cloneAutomaton(a: Automaton): Automaton {
    return {
      states: new Set(a.states),
      alphabet: new Set(a.alphabet),
      transitions: [...a.transitions],
      startState: a.startState,
      acceptStates: new Set(a.acceptStates)
    };
  }
}
