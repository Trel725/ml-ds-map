import type { VizId } from '../../viz/ids';
import { VizSection } from '../../viz/VizSection';

/** Keyed by node, so switching nodes never shows the previous node's visualization. */
export function VizSlot({ nodeId, vizId }: { nodeId: string; vizId: VizId }) {
  return <VizSection vizId={vizId} key={nodeId} />;
}
