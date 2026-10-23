import { useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

export interface DragOptions {
  /** Deltas in data units; y grows upward. */
  onDrag(dx: number, dy: number): void;
  /** Data units moved per arrow-key press. */
  step: number;
  /** Converts a pointer movement in screen pixels into data units. Defaults to pixels with y flipped. */
  pxToData?(dxPx: number, dyPx: number): [number, number];
  label: string;
  valueText: string;
  disabled?: boolean;
}

/** Props for a draggable SVG handle: pointer drag plus arrow keys. */
export function useDrag({ onDrag, step, pxToData = (x, y) => [x, -y], label, valueText, disabled }: DragOptions) {
  const last = useRef<{ x: number; y: number } | null>(null);

  return {
    tabIndex: disabled ? -1 : 0,
    role: 'slider',
    'aria-label': label,
    'aria-valuetext': valueText,
    className: 'viz-handle',
    onPointerDown(e: PointerEvent<SVGElement>) {
      if (disabled) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      last.current = { x: e.clientX, y: e.clientY };
    },
    onPointerMove(e: PointerEvent<SVGElement>) {
      if (!last.current) return;
      const [dx, dy] = pxToData(e.clientX - last.current.x, e.clientY - last.current.y);
      last.current = { x: e.clientX, y: e.clientY };
      onDrag(dx, dy);
    },
    onPointerUp() {
      last.current = null;
    },
    onPointerCancel() {
      last.current = null;
    },
    onKeyDown(e: KeyboardEvent<SVGElement>) {
      if (disabled) return;
      const moves: Record<string, [number, number]> = {
        ArrowRight: [step, 0],
        ArrowLeft: [-step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
      };
      const m = moves[e.key];
      if (!m) return;
      e.preventDefault();
      onDrag(m[0], m[1]);
    },
  };
}
