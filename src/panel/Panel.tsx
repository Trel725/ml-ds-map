import { useEffect, useRef } from 'react';
import { useApp } from '../app/StoreContext';
import { EdgePanel } from './EdgePanel';
import { NodePanel } from './NodePanel';
import { Welcome } from './Welcome';
import './panel.css';

export function Panel() {
  const selection = useApp((s) => s.selection);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.scrollTo?.({ top: 0 });
  }, [selection?.kind, selection?.id]);

  return (
    <aside className="panel-area" aria-label="Details" ref={ref}>
      {!selection && <Welcome />}
      {selection?.kind === 'node' && <NodePanel key={selection.id} nodeId={selection.id} />}
      {selection?.kind === 'edge' && <EdgePanel key={selection.id} edgeId={selection.id} />}
    </aside>
  );
}
