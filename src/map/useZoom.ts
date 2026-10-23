import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
import type { ZoomBehavior, ZoomTransform } from 'd3-zoom';
import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { Box, Layout } from '../layout/layout';

const DURATION_MS = 250;
const MARGIN = 24;
const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
/** Smallest scale at which 13 px labels stay legible. */
const READABLE_SCALE = 0.9;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/** Pan and zoom with d3-zoom; React owns every element, d3 only writes the viewport transform. */
export function useZoom(
  svgRef: RefObject<SVGSVGElement | null>,
  viewportRef: RefObject<SVGGElement | null>,
  lay: Pick<Layout, 'width' | 'height'>,
): { fit(): void; fitReadable(): void; centerOn(box: Box): void } {
  const behavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const frame = useRef(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .on('zoom', (e: { transform: ZoomTransform }) => {
        viewportRef.current?.setAttribute('transform', e.transform.toString());
      });
    behavior.current = z;
    const sel = select(svg);
    sel.call(z).on('dblclick.zoom', null);
    return () => {
      sel.on('.zoom', null);
      behavior.current = null;
    };
  }, [svgRef, viewportRef]);

  const animateTo = useCallback(
    (target: ZoomTransform) => {
      const svg = svgRef.current;
      const z = behavior.current;
      if (!svg || !z) return;
      const sel = select(svg);
      cancelAnimationFrame(frame.current);
      const from = (svg as SVGSVGElement & { __zoom?: ZoomTransform }).__zoom ?? zoomIdentity;
      if (prefersReducedMotion()) {
        z.transform(sel, target);
        return;
      }
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION_MS);
        const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        const k = from.k + (target.k - from.k) * e;
        const x = from.x + (target.x - from.x) * e;
        const y = from.y + (target.y - from.y) * e;
        z.transform(sel, zoomIdentity.translate(x, y).scale(k));
        if (t < 1) frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    },
    [svgRef],
  );

  const fit = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width: vw, height: vh } = svg.getBoundingClientRect();
    if (!vw || !vh) return;
    const k = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min((vw - 2 * MARGIN) / lay.width, (vh - 2 * MARGIN) / lay.height)));
    animateTo(zoomIdentity.translate((vw - lay.width * k) / 2, (vh - lay.height * k) / 2).scale(k));
  }, [svgRef, lay.width, lay.height, animateTo]);

  /** Like fit, but never shrinks labels below a readable size; wide maps anchor at their left edge. */
  const fitReadable = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width: vw, height: vh } = svg.getBoundingClientRect();
    if (!vw || !vh) return;
    const fitK = Math.min((vw - 2 * MARGIN) / lay.width, (vh - 2 * MARGIN) / lay.height);
    const k = Math.min(1.2, Math.max(READABLE_SCALE, fitK));
    const x = lay.width * k + 2 * MARGIN <= vw ? (vw - lay.width * k) / 2 : MARGIN;
    const y = Math.max(MARGIN, (vh - lay.height * k) / 2);
    animateTo(zoomIdentity.translate(x, y).scale(k));
  }, [svgRef, lay.width, lay.height, animateTo]);

  const centerOn = useCallback(
    (box: Box) => {
      const svg = svgRef.current;
      if (!svg) return;
      const { width: vw, height: vh } = svg.getBoundingClientRect();
      const current = (svg as SVGSVGElement & { __zoom?: ZoomTransform }).__zoom ?? zoomIdentity;
      const k = Math.max(current.k, 0.8);
      animateTo(zoomIdentity.translate(vw / 2 - (box.x + box.w / 2) * k, vh / 2 - (box.y + box.h / 2) * k).scale(k));
    },
    [svgRef, animateTo],
  );

  return { fit, fitReadable, centerOn };
}
