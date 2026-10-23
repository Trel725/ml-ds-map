import { useEffect, useMemo, useRef } from 'react';
import { useApp, useGraph } from '../app/StoreContext';
import { layout } from '../layout/layout';
import { GroupNode } from './GroupNode';
import { Lanes } from './Lanes';
import { NodeShape } from './NodeShape';
import { ToolsRail } from './ToolsRail';
import { useZoom } from './useZoom';

export function MapView() {
  const graph = useGraph();
  const zoomLevel = useApp((s) => s.zoomLevel);
  const expanded = useApp((s) => s.expandedGroups);
  const selection = useApp((s) => s.selection);
  const focusRequest = useApp((s) => s.focusRequest);
  const toggleGroup = useApp((s) => s.toggleGroup);
  const select = useApp((s) => s.select);
  const clearSelection = useApp((s) => s.clearSelection);
  const explore = useApp((s) => s.explore);

  const { groups, nodes } = graph.content;
  const lay = useMemo(() => layout(groups, nodes, expanded), [groups, nodes, expanded]);
  const laneGroups = useMemo(() => groups.filter((g) => lay.groupBoxes.has(g.id)), [groups, lay]);
  const tools = useMemo(() => nodes.filter((n) => n.kind === 'tool'), [nodes]);

  const svgRef = useRef<SVGSVGElement>(null);
  const viewportRef = useRef<SVGGElement>(null);
  const { fit, fitReadable, centerOn } = useZoom(svgRef, viewportRef, lay);

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

  const selectedId = selection?.kind === 'node' ? selection.id : null;
  const showGroups = zoomLevel !== 'layers';

  return (
    <section className="map-area" aria-label="Concept map">
      <svg ref={svgRef} className="map" onClick={() => clearSelection()}>
        <g ref={viewportRef} className="viewport">
          <Lanes lay={lay} prominent={!showGroups} />
          {showGroups && (
            <>
              {laneGroups.map((g) => (
                <GroupNode
                  key={g.id}
                  group={g}
                  box={lay.groupBoxes.get(g.id)!}
                  memberCount={graph.membersByGroup.get(g.id)?.length ?? 0}
                  onToggle={() => toggleGroup(g.id)}
                />
              ))}
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
                    onActivate={() => select({ kind: 'node', id: n.id })}
                  />
                );
              })}
              <ToolsRail
                tools={tools}
                lay={lay}
                isFaded={() => false}
                isHighlighted={() => false}
                selectedId={selectedId}
                onSelect={(id) => select({ kind: 'node', id })}
              />
            </>
          )}
        </g>
      </svg>
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
