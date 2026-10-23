import { useApp, useGraph } from './StoreContext';

export function Breadcrumb() {
  const graph = useGraph();
  const crumbs = useApp((s) => s.breadcrumb);
  const current = useApp((s) => (s.selection?.kind === 'node' ? s.selection.id : null));
  const select = useApp((s) => s.select);
  if (crumbs.length === 0) return null;
  return (
    <nav aria-label="Recent" className="breadcrumb">
      {crumbs.map((id) => (
        <button
          key={id}
          type="button"
          className="crumb"
          aria-current={id === current ? 'page' : undefined}
          onClick={() => select({ kind: 'node', id }, { reveal: true })}
        >
          {graph.nodesById.get(id)?.label ?? id}
        </button>
      ))}
    </nav>
  );
}
