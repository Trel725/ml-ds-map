import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useStore } from 'zustand';
import type { Graph } from '../graph/graph';
import type { AppActions, AppState, AppStore } from './store';

const Ctx = createContext<{ store: AppStore; graph: Graph } | null>(null);

export function StoreProvider({ store, graph, children }: { store: AppStore; graph: Graph; children: ReactNode }) {
  return <Ctx.Provider value={{ store, graph }}>{children}</Ctx.Provider>;
}

function useCtx() {
  const c = useContext(Ctx);
  if (!c) throw new Error('StoreProvider is missing');
  return c;
}

export function useApp<T>(selector: (s: AppState & AppActions) => T): T {
  return useStore(useCtx().store, selector);
}

export function useGraph(): Graph {
  return useCtx().graph;
}

export function useAppStore(): AppStore {
  return useCtx().store;
}
