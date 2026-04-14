import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Automaton, State } from '../lib/REEngine';

interface AutomatonVisualizerProps {
  automaton: Automaton;
  highlightedStates?: Set<State>;
  highlightedTransitions?: number[];
  partitions?: Set<number>[];
  width?: number;
  height?: number;
}

export default function AutomatonVisualizer({ 
  automaton, 
  highlightedStates, 
  highlightedTransitions,
  partitions,
  width = 800,
  height = 400
}: AutomatonVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const partitionColors = [
    'rgba(92, 225, 230, 0.2)', // Cyber Cyan
    'rgba(157, 123, 255, 0.2)', // Academic Violet
    'rgba(74, 222, 128, 0.2)',  // Green
    'rgba(248, 113, 113, 0.2)', // Red
    'rgba(250, 204, 21, 0.2)',  // Yellow
    'rgba(251, 146, 60, 0.2)',  // Orange
  ];

  useEffect(() => {
    if (!svgRef.current || !automaton.states.size) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodes = Array.from(automaton.states).map(id => {
      const partitionIdx = partitions?.findIndex(p => p.has(id));
      return {
        id,
        isStart: id === automaton.startState,
        isAccept: automaton.acceptStates.has(id),
        isHighlighted: highlightedStates?.has(id),
        partitionColor: partitionIdx !== undefined && partitionIdx !== -1 ? partitionColors[partitionIdx % partitionColors.length] : null
      };
    });

    const links = automaton.transitions.map((t, index) => ({
      source: t.from,
      target: t.to,
      label: t.symbol === null ? 'ε' : t.symbol,
      isHighlighted: highlightedTransitions?.includes(index)
    }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Arrowhead marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#5ce1e6')
      .style('stroke', 'none');

    const link = svg.append('g')
      .selectAll('path')
      .data(links)
      .enter().append('path')
      .attr('stroke', d => d.isHighlighted ? '#4ade80' : '#5ce1e6')
      .attr('stroke-width', d => d.isHighlighted ? 3 : 1.5)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)');

    const linkText = svg.append('g')
      .selectAll('text')
      .data(links)
      .enter().append('text')
      .attr('fill', '#5ce1e6')
      .attr('font-size', '12px')
      .attr('font-family', 'JetBrains Mono')
      .attr('text-anchor', 'middle')
      .text(d => d.label);

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => d.partitionColor || (d.isHighlighted ? 'rgba(74, 222, 128, 0.2)' : '#131b2e'))
      .attr('stroke', d => d.isHighlighted ? '#4ade80' : (d.partitionColor ? d.partitionColor.replace('0.2', '1') : '#5ce1e6'))
      .attr('stroke-width', 2);

    // Double circle for accept states
    node.filter(d => d.isAccept)
      .append('circle')
      .attr('r', 16)
      .attr('fill', 'none')
      .attr('stroke', d => d.isHighlighted ? '#4ade80' : '#5ce1e6')
      .attr('stroke-width', 1);

    // Start arrow
    node.filter(d => d.isStart)
      .append('path')
      .attr('d', 'M -40 0 L -25 0')
      .attr('stroke', '#5ce1e6')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    node.append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('font-family', 'JetBrains Mono')
      .text(d => d.id);

    simulation.on('tick', () => {
      link.attr('d', (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // Self-loop
        if (d.source.id === d.target.id) {
          const x1 = d.source.x;
          const y1 = d.source.y;
          return `M ${x1} ${y1} C ${x1-40} ${y1-40}, ${x1+40} ${y1-40}, ${x1} ${y1}`;
        }
        
        return `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`;
      });

      linkText
        .attr('x', (d: any) => {
          if (d.source.id === d.target.id) return d.source.x;
          return (d.source.x + d.target.x) / 2;
        })
        .attr('y', (d: any) => {
          if (d.source.id === d.target.id) return d.source.y - 45;
          return (d.source.y + d.target.y) / 2 - 10;
        });

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [automaton, highlightedStates, highlightedTransitions, partitions, width, height]);

  return (
    <div className="w-full h-full bg-bg/30 rounded-xl border border-border overflow-hidden relative">
      <svg 
        ref={svgRef} 
        width={width} 
        height={height} 
        className="w-full h-full cursor-move"
      />
      <div className="absolute top-4 right-4 flex flex-col sm:flex-row gap-3 sm:gap-6 text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold bg-bg/60 backdrop-blur-xl p-3 rounded-xl border border-border/50 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full border border-accent shadow-[0_0_5px_rgba(92,225,230,0.3)]" />
          State
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full border-2 border-accent shadow-[0_0_5px_rgba(92,225,230,0.3)]" />
          Accept
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success/20 border border-success shadow-[0_0_5px_rgba(74,222,128,0.3)]" />
          Highlighted
        </div>
      </div>
    </div>
  );
}
