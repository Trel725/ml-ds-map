import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import content from 'virtual:content';
import { App } from './app/App';
import { startHashSync } from './app/router';
import { browserStorage } from './app/storage';
import { createAppStore } from './app/store';
import { StoreProvider } from './app/StoreContext';
import { buildGraph } from './graph/graph';
import './app/theme.css';
import './map/map.css';

const graph = buildGraph(content);
const store = createAppStore(graph, browserStorage());
startHashSync(store, graph, window);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider store={store} graph={graph}>
      <App />
    </StoreProvider>
  </StrictMode>,
);
