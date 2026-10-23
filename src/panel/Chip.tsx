import { useApp, useGraph } from '../app/StoreContext';

/** A button naming a node (or group); picking it selects and reveals that node. `label` overrides the shown text. */
export function Chip({ nodeId, testId, label: labelOverride }: { nodeId: string; testId: string; label?: string }) {
  const graph = useGraph();
  const select = useApp((s) => s.select);
  const expandGroups = useApp((s) => s.expandGroups);
  const node = graph.nodesById.get(nodeId);
  const group = node ? undefined : graph.groupsById.get(nodeId);
  const layer = node?.layer ?? group?.layer ?? 'tools';
  const label = labelOverride ?? node?.label ?? (group ? `${group.label} (group)` : nodeId);

  return (
    <button
      type="button"
      className="chip"
      data-testid={testId}
      data-node-ref={nodeId}
      style={{ ['--chip' as string]: `var(--layer-${layer}-strong)` }}
      onClick={() => (node ? select({ kind: 'node', id: nodeId }, { reveal: true }) : expandGroups([nodeId]))}
    >
      {label}
    </button>
  );
}
