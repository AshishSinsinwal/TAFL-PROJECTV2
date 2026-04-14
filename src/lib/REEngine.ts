/**
 * Regular Expression Engine for TAFL IDE
 * Implements:
 * - Thompson's Construction (RE -> NFA)
 * - Powerset Construction (NFA -> DFA)
 * - Hopcroft's Algorithm (DFA Minimization)
 * - Membership Testing
 * - Equivalence Verification
 */

export type State = number;

export interface Transition {
  from: State;
  to: State;
  symbol: string | null; // null represents epsilon
}

export interface Automaton {
  states: Set<State>;
  alphabet: Set<string>;
  transitions: Transition[];
  startState: State;
  acceptStates: Set<State>;
}

export class REEngine {
  private static stateCounter = 0;

  private static newState(): State {
    return this.stateCounter++;
  }

  /**
   * Parses a basic regular expression into an NFA using Thompson's construction.
   * Supported: *, +, |, ?, (), [a-z], [0-9], epsilon (ε)
   */
  static parseToNFA(re: string): Automaton {
    this.stateCounter = 0;
    const tokens = this.tokenize(re);
    const postfix = this.toPostfix(tokens);
    return this.buildNFA(postfix);
  }

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
    
    // Add explicit concatenation operator '.'
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
    const precedence: Record<string, number> = {
      '|': 1,
      '.': 2,
      '*': 3,
      '+': 3,
      '?': 3
    };

    for (const token of tokens) {
      if (token === '(') {
        stack.push(token);
      } else if (token === ')') {
        while (stack.length > 0 && stack[stack.length - 1] !== '(') {
          output.push(stack.pop()!);
        }
        stack.pop();
      } else if (precedence[token]) {
        while (
          stack.length > 0 &&
          stack[stack.length - 1] !== '(' &&
          precedence[stack[stack.length - 1]] >= precedence[token]
        ) {
          output.push(stack.pop()!);
        }
        stack.push(token);
      } else {
        output.push(token);
      }
    }
    while (stack.length > 0) {
      output.push(stack.pop()!);
    }
    return output;
  }

  private static buildNFA(postfix: string[]): Automaton {
    const stack: Automaton[] = [];

    for (const token of postfix) {
      if (token === '*') {
        const a = stack.pop()!;
        stack.push(this.kleeneStar(a));
      } else if (token === '+') {
        const a = stack.pop()!;
        stack.push(this.plus(a));
      } else if (token === '?') {
        const a = stack.pop()!;
        stack.push(this.optional(a));
      } else if (token === '|') {
        const b = stack.pop()!;
        const a = stack.pop()!;
        stack.push(this.union(a, b));
      } else if (token === '.') {
        const b = stack.pop()!;
        const a = stack.pop()!;
        stack.push(this.concat(a, b));
      } else {
        stack.push(this.basicNFA(token));
      }
    }

    return stack[0] || this.basicNFA('ε');
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

    return {
      states: new Set([s1, s2]),
      alphabet,
      transitions,
      startState: s1,
      acceptStates: new Set([s2])
    };
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
    for (const acceptState of a.acceptStates) {
      transitions.push({ from: acceptState, to: s2, symbol: null });
    }
    for (const acceptState of b.acceptStates) {
      transitions.push({ from: acceptState, to: s2, symbol: null });
    }
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
    return {
      states: new Set([...a.states, s1, s2]),
      alphabet: a.alphabet,
      transitions,
      startState: s1,
      acceptStates: new Set([s2])
    };
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
    return {
      states: new Set([...a.states, s1, s2]),
      alphabet: a.alphabet,
      transitions,
      startState: s1,
      acceptStates: new Set([s2])
    };
  }

  private static optional(a: Automaton): Automaton {
    const s1 = this.newState();
    const s2 = this.newState();
    const transitions = [
      ...a.transitions,
      { from: s1, to: a.startState, symbol: null },
      { from: s1, to: s2, symbol: null }
    ];
    for (const acceptState of a.acceptStates) {
      transitions.push({ from: acceptState, to: s2, symbol: null });
    }
    return {
      states: new Set([...a.states, s1, s2]),
      alphabet: a.alphabet,
      transitions,
      startState: s1,
      acceptStates: new Set([s2])
    };
  }

  /**
   * Converts NFA to DFA using powerset construction.
   */
  static nfaToDFA(nfa: Automaton): Automaton {
    const dfaStates: string[] = [];
    const dfaTransitions: Transition[] = [];
    const dfaAcceptStates = new Set<number>();
    
    const startClosure = this.epsilonClosure(new Set([nfa.startState]), nfa);
    const startKey = Array.from(startClosure).sort().join(',');
    dfaStates.push(startKey);
    
    const queue = [startKey];
    const visited = new Set([startKey]);
    const stateMap = new Map<string, number>();
    stateMap.set(startKey, 0);
    
    let stateCounter = 0;
    
    while (queue.length > 0) {
      const currentKey = queue.shift()!;
      const currentStates = new Set(currentKey.split(',').map(Number));
      const currentDFAState = stateMap.get(currentKey)!;
      
      // Check if it's an accept state
      if (Array.from(currentStates).some(s => nfa.acceptStates.has(s))) {
        dfaAcceptStates.add(currentDFAState);
      }
      
      for (const symbol of nfa.alphabet) {
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
          
          if (!visited.has(nextKey)) {
            visited.add(nextKey);
            stateCounter++;
            stateMap.set(nextKey, stateCounter);
            queue.push(nextKey);
          }
          
          dfaTransitions.push({
            from: currentDFAState,
            to: stateMap.get(nextKey)!,
            symbol
          });
        }
      }
    }
    
    return {
      states: new Set(Array.from(stateMap.values())),
      alphabet: nfa.alphabet,
      transitions: dfaTransitions,
      startState: 0,
      acceptStates: dfaAcceptStates
    };
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

  /**
   * Minimizes DFA using Hopcroft's algorithm.
   */
  static minimizeDFA(dfa: Automaton): Automaton {
    if (dfa.states.size === 0) return dfa;

    // Partition states into accept and non-accept
    const nonAccept = new Set(Array.from(dfa.states).filter(s => !dfa.acceptStates.has(s)));
    const accept = new Set(dfa.acceptStates);
    
    let partitions: Set<number>[] = [];
    if (nonAccept.size > 0) partitions.push(nonAccept);
    if (accept.size > 0) partitions.push(accept);
    
    let changed = true;
    while (changed) {
      changed = false;
      const nextPartitions: Set<number>[] = [];
      
      for (const p of partitions) {
        if (p.size <= 1) {
          nextPartitions.push(p);
          continue;
        }
        
        const splitMap = new Map<string, Set<number>>();
        for (const s of p) {
          const behavior: string[] = [];
          for (const symbol of dfa.alphabet) {
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
        
        if (splitMap.size > 1) changed = true;
        nextPartitions.push(...Array.from(splitMap.values()));
      }
      partitions = nextPartitions;
    }
    
    // Build minimized DFA
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
    
    return {
      states: new Set(partitions.keys()),
      alphabet: dfa.alphabet,
      transitions: minTransitions,
      startState: stateMap.get(dfa.startState)!,
      acceptStates: minAcceptStates
    };
  }

  static testMembership(dfa: Automaton, input: string): boolean {
    let current = dfa.startState;
    for (const char of input) {
      const transition = dfa.transitions.find(t => t.from === current && t.symbol === char);
      if (!transition) return false;
      current = transition.to;
    }
    return dfa.acceptStates.has(current);
  }

  static generateStrings(dfa: Automaton, limit: number = 10, maxLength: number = 8): string[] {
    const result: string[] = [];
    const queue: { state: number; path: string }[] = [{ state: dfa.startState, path: '' }];
    const visited = new Set<string>();
    
    while (queue.length > 0 && result.length < limit) {
      const { state, path } = queue.shift()!;
      
      if (dfa.acceptStates.has(state)) {
        if (!result.includes(path)) result.push(path === '' ? 'ε' : path);
      }
      
      if (path.length >= maxLength) continue;
      
      for (const symbol of dfa.alphabet) {
        const transition = dfa.transitions.find(t => t.from === state && t.symbol === symbol);
        if (transition) {
          const nextPath = path + symbol;
          const key = `${transition.to}:${nextPath}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({ state: transition.to, path: nextPath });
          }
        }
      }
    }
    return result;
  }

  static areEquivalent(re1: string, re2: string): { equivalent: boolean; counterExample?: string } {
    const dfa1 = this.minimizeDFA(this.nfaToDFA(this.parseToNFA(re1)));
    const dfa2 = this.minimizeDFA(this.nfaToDFA(this.parseToNFA(re2)));
    
    // Check if they have the same alphabet (or if one is a subset of the other, we should consider the union)
    const alphabet = new Set([...dfa1.alphabet, ...dfa2.alphabet]);
    
    // BFS to find a counter-example
    const queue: { s1: number | null; s2: number | null; path: string }[] = [
      { s1: dfa1.startState, s2: dfa2.startState, path: '' }
    ];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const { s1, s2, path } = queue.shift()!;
      
      const isAccept1 = s1 !== null && dfa1.acceptStates.has(s1);
      const isAccept2 = s2 !== null && dfa2.acceptStates.has(s2);
      
      if (isAccept1 !== isAccept2) {
        return { equivalent: false, counterExample: path === '' ? 'ε' : path };
      }
      
      if (path.length > 15) continue; // Safety limit

      for (const symbol of alphabet) {
        const nextS1 = s1 !== null ? dfa1.transitions.find(t => t.from === s1 && t.symbol === symbol)?.to ?? null : null;
        const nextS2 = s2 !== null ? dfa2.transitions.find(t => t.from === s2 && t.symbol === symbol)?.to ?? null : null;
        
        const key = `${nextS1}:${nextS2}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ s1: nextS1, s2: nextS2, path: path + symbol });
        }
      }
    }
    
    return { equivalent: true };
  }
}
