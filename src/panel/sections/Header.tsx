import type { Node } from '../../data/schema';

const LAYER_NAMES = {
  foundations: 'Foundations',
  math: 'Math',
  core: 'Core concept',
  algorithms: 'Algorithm',
  problems: 'Problem',
  tools: 'Tool',
} as const;

export function Header({ node, groupLabel }: { node: Node; groupLabel?: string }) {
  return (
    <header className="panel-header">
      <p className="panel-where">
        {LAYER_NAMES[node.layer]}
        {groupLabel && node.layer !== 'tools' ? `, ${groupLabel}` : ''}
      </p>
      <h2>{node.label}</h2>
      <p className="panel-oneliner">{node.oneLiner}</p>
    </header>
  );
}
