import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useApp, useGraph } from '../app/StoreContext';
import { visibleEdges, visualId } from '../graph/visibleEdges';
import { layout } from '../layout/layout';
import type { Box } from '../layout/layout';
import { EdgeLayer } from './EdgeLayer';
import { EdgeMarkers } from './EdgeMarkers';
import { EdgeTooltip } from './EdgeTooltip';
import { navCandidates, navNeighbors, pickInDirection } from './edgeNav';
import type { Direction } from './edgeNav';
import type { TooltipState } from './EdgeTooltip';
import { GroupNode } from './GroupNode';
import { Lanes } from './Lanes';
import { NodeShape } from './NodeShape';
import { ToolsRail } from './ToolsRail';
import { useZoom } from './useZoom';

const ARROWS: Partial<Record<string, Direction>> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

/** Focuses the drawn node; false when it is not rendered yet. */
const focusNode = (svg: SVGSVGElement | null, id: string) => {
  const el = svg?.querySelector<SVGGElement>(`[data-node-id="${id}"]`);
  el?.focus();
  return el != null;
};

export function MapView() {
  const graph = useGraph();
  const zoomLevel = useApp((s) => s.zoomLevel);
  const expanded = useApp((s) => s.expandedGroups);
  const selection = useApp((s) => s.selection);
  const focusRequest = useApp((s) => s.focusRequest);
  const highlight = useApp((s) => s.highlight);
  const toggleGroup = useApp((s) => s.toggleGroup);
  const select = useApp((s) => s.select);
  const clearSelection = useApp((s) => s.clearSelection);
  const explore = useApp((s) => s.explore);
  const expandGroups = useApp((s) => s.expandGroups);

  const { groups, nodes } = graph.content;
  const lay = useMemo(() => layout(groups, nodes, expanded), [groups, nodes, expanded]);
  const laneGroups = useMemo(() => groups.filter((g) => lay.groupBoxes.has(g.id)), [groups, lay]);
  const tools = useMemo(() => nodes.filter((n) => n.kind === 'tool'), [nodes]);

  const { edges, related } = useMemo(() => {
    const extra = new Set([...highlight.ids].filter((id) => graph.edgesById.has(id)));
    return visibleEdges(graph, selection, expanded, extra);
  }, [graph, selection, expanded, highlight]);
  const highlightNodes = useMemo(() => new Set([...highlight.ids].filter((id) => graph.nodesById.has(id))), [graph, highlight]);
  const focusing = selection !== null || highlight.ids.size > 0;
  const lit = useMemo(() => {
    const s = new Set(related);
    for (const id of highlightNodes) s.add(visualId(graph, id, expanded));
    return s;
  }, [graph, related, highlightNodes, expanded]);
  const nodeFaded = (id: string) => focusing && !lit.has(visualId(graph, id, expanded));
  const groupFaded = (id: string) =>
    focusing && !lit.has(id) && !(graph.membersByGroup.get(id) ?? []).some((n) => lit.has(n.id));
  const groupHighlighted = (id: string) => (graph.membersByGroup.get(id) ?? []).some((n) => highlightNodes.has(n.id));

  /** The drawn shape's box, so edges end at what the eye sees (circles sit at the left of their cell). */
  const boxOf = (vid: string): Box | undefined => {
    const pos = lay.nodePositions.get(vid);
    if (pos?.visible) {
      const kind = graph.nodesById.get(vid)?.kind;
      if (kind === 'foundation' || kind === 'math') return { x: pos.x + 4, y: pos.y + 4, w: pos.h - 8, h: pos.h - 8 };
      return { x: pos.x, y: pos.y + 4, w: pos.w, h: pos.h - 8 };
    }
    return lay.toolPositions.get(vid) ?? lay.groupBoxes.get(vid);
  };

  const [tip, setTip] = useState<TooltipState | null>(null);
  useEffect(() => setTip(null), [selection, expanded]);

  const svgRef = useRef<SVGSVGElement>(null);
  const viewportRef = useRef<SVGGElement>(null);
  const { fit, fitReadable, centerOn } = useZoom(svgRef, viewportRef, lay);

  // Coming back from the list view, the selection's groups may still be closed: open them so it is drawn.
  useEffect(() => {
    if (!selection) return;
    const edge = selection.kind === 'edge' ? graph.edgesById.get(selection.id) : undefined;
    const ids = edge ? [edge.from, edge.to] : [selection.id];
    const closed = ids.flatMap((id) => {
      const n = graph.nodesById.get(id);
      return n && n.kind !== 'tool' && !expanded.has(n.group) ? [n.group] : [];
    });
    if (closed.length > 0) expandGroups(closed);
    // Only on mount: later collapses are the user's choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Frame the map once on mount; later layout changes keep the user's pan and zoom.
  const framed = useRef(false);
  useEffect(() => {
    if (framed.current) return;
    framed.current = true;
    fitReadable();
  }, [fitReadable]);

  useEffect(() => {
    if (!focusRequest) return;
    const id = focusRequest.id;
    const node = graph.nodesById.get(id);
    const pos = lay.nodePositions.get(id);
    const box =
      (pos?.visible ? pos : undefined) ??
      lay.toolPositions.get(id) ??
      (node ? lay.groupBoxes.get(node.group) : undefined) ??
      lay.groupBoxes.get(id);
    if (box) centerOn(box);
    // Only a new request should move the view, not every layout change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest?.nonce]);

  // Arrow keys follow the selected node's edges: they move focus among it and its neighbors.
  const [announce, setAnnounce] = useState('');
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => setAnnounce(''), [selection]);
  // A neighbor whose group just opened is focused once the new layout renders it.
  useEffect(() => {
    if (pendingFocus.current && focusNode(svgRef.current, pendingFocus.current)) pendingFocus.current = null;
  }, [lay]);

  const onArrow = (e: KeyboardEvent<SVGSVGElement>) => {
    const dir = ARROWS[e.key];
    if (!dir || selection?.kind !== 'node') return;
    const fromId = (e.target as Element).closest('[data-node-id]')?.getAttribute('data-node-id');
    const neighbors = navNeighbors(graph, selection.id);
    if (!fromId || (fromId !== selection.id && !neighbors.some((n) => n.nodeId === fromId))) return;
    e.preventDefault();
    const { candidates, groupsToOpen } = navCandidates(graph, selection.id, expanded);
    if (groupsToOpen.length > 0) expandGroups(groupsToOpen);
    const to = pickInDirection(fromId, candidates, dir);
    if (!to) return;
    const edgeId = neighbors.find((n) => n.nodeId === to)?.edgeId;
    setAnnounce(edgeId ? (graph.edgesById.get(edgeId)?.sentence ?? '') : '');
    if (focusNode(svgRef.current, to)) pendingFocus.current = null;
    else pendingFocus.current = to;
  };

  const selectedId = selection?.kind === 'node' ? selection.id : null;
  const showGroups = zoomLevel !== 'layers';

  return (
    <section className="map-area" aria-label="Concept map">
      <svg ref={svgRef} className="map" onClick={() => clearSelection()} onKeyDown={onArrow}>
        <g ref={viewportRef} className="viewport">
          <EdgeMarkers />
          <Lanes lay={lay} prominent={!showGroups} />
          {showGroups && (
            <>
              {laneGroups.map((g) => (
                <GroupNode
                  key={g.id}
                  group={g}
                  box={lay.groupBoxes.get(g.id)!}
                  memberCount={graph.membersByGroup.get(g.id)?.length ?? 0}
                  faded={groupFaded(g.id)}
                  highlighted={groupHighlighted(g.id)}
                  onToggle={() => toggleGroup(g.id)}
                />
              ))}
              {/* Above group boxes, below nodes. */}
              <EdgeLayer
                graph={graph}
                edges={edges}
                boxOf={boxOf}
                onSelect={(id) => select({ kind: 'edge', id })}
                onHover={(lines, at) => setTip(lines && at ? { lines, ...at } : null)}
              />
              {nodes.map((n) => {
                const pos = lay.nodePositions.get(n.id);
                if (!pos?.visible) return null;
                return (
                  <NodeShape
                    key={n.id}
                    node={n}
                    box={pos}
                    from={lay.groupBoxes.get(n.group)}
                    selected={selectedId === n.id}
                    faded={nodeFaded(n.id)}
                    highlighted={highlightNodes.has(n.id)}
                    onActivate={() => select({ kind: 'node', id: n.id })}
                  />
                );
              })}
              <ToolsRail
                tools={tools}
                lay={lay}
                isFaded={nodeFaded}
                isHighlighted={(id) => highlightNodes.has(id)}
                selectedId={selectedId}
                onSelect={(id) => select({ kind: 'node', id })}
              />
            </>
          )}
        </g>
      </svg>
      <EdgeTooltip tip={tip} />
      <p className="visually-hidden" data-testid="nav-announce" aria-live="polite">
        {announce}
      </p>
      <div className="map-controls">
        {showGroups ? (
          <button type="button" className="button" onClick={fit} aria-label="Fit map to screen">
            Fit
          </button>
        ) : (
          <div className="explore">
            <p>Six layers, from the math you already know at the bottom up to the problems people solve at the top.</p>
            <button type="button" className="button button-primary" onClick={explore}>
              Explore the map
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
