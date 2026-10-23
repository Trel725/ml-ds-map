import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { createSearch } from '../graph/search';
import type { SearchResult } from '../graph/search';
import { useApp, useGraph } from './StoreContext';

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

/** ARIA combobox over node labels and synonyms. `/` focuses it from anywhere. */
export function Search() {
  const graph = useGraph();
  const select = useApp((s) => s.select);
  const search = useMemo(() => createSearch(graph.content.nodes), [graph]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results: SearchResult[] = useMemo(() => search(query), [search, query]);
  const open = results.length > 0 && !dismissed;

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pick = (r: SearchResult | undefined) => {
    if (!r) return;
    select({ kind: 'node', id: r.id }, { reveal: true });
    setQuery('');
    setActive(-1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!results.length) return;
      e.preventDefault();
      setDismissed(false);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((a) => (a + step + results.length) % results.length);
    } else if (e.key === 'Enter') {
      if (!open) return;
      e.preventDefault();
      pick(results[active >= 0 ? active : 0]);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setDismissed(true);
      setActive(-1);
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;
  const groupLabel = (id: string) => graph.groupsById.get(id)?.label ?? '';

  return (
    <div className="search">
      <input
        ref={input}
        type="search"
        role="combobox"
        aria-label="Search"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        placeholder="Search topics  ( / )"
        value={query}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(-1);
          setDismissed(false);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setDismissed(true)}
        onFocus={() => setDismissed(false)}
      />
      <ul id={listId} role="listbox" aria-label="Search results" className="search-results" hidden={!open}>
        {open &&
          results.map((r, i) => (
            <li
              key={r.id}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              className="search-option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(r)}
              onMouseEnter={() => setActive(i)}
            >
              <span className="option-label">{r.label}</span>
              <span className="option-group">{groupLabel(r.group)}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
