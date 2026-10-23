/** Every localStorage access goes through here. Nothing in this file throws. */
export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export const KEYS = {
  theme: 'mlmap.theme',
  expandedGroups: 'mlmap.expandedGroups',
  visited: 'mlmap.visited',
} as const;

export function browserStorage(): KV | null {
  try {
    const s = window.localStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

export function readString(kv: KV | null, key: string): string | null {
  try {
    return kv?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeString(kv: KV | null, key: string, value: string): void {
  try {
    kv?.setItem(key, value);
  } catch {
    // storage full or blocked: the app works without it
  }
}

export function readJson<T>(kv: KV | null, key: string, guard: (v: unknown) => v is T): T | null {
  const raw = readString(kv, key);
  if (raw === null) return null;
  try {
    const v: unknown = JSON.parse(raw);
    return guard(v) ? v : null;
  } catch {
    return null;
  }
}

export function writeJson(kv: KV | null, key: string, value: unknown): void {
  writeString(kv, key, JSON.stringify(value));
}
