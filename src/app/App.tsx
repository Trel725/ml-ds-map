import content from 'virtual:content';

export function App() {
  return (
    <header>
      <h1>ML Concept Map</h1>
      <p>{content.nodes.length} nodes</p>
    </header>
  );
}
