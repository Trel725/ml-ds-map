import { useEffect } from 'react';
import { useApp } from './StoreContext';

const DISMISS_AFTER_MS = 4000;

export function Notice() {
  const notice = useApp((s) => s.notice);
  const dismiss = useApp((s) => s.dismissNotice);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(dismiss, DISMISS_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [notice, dismiss]);

  return (
    <div role="status" aria-live="polite">
      {notice && (
        <div className="notice" data-testid="notice">
          {notice}
        </div>
      )}
    </div>
  );
}
