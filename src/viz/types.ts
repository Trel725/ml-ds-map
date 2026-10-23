import type { FC } from 'react';

export interface VizModule {
  /** One sentence shown above the visual. */
  takeaway: string;
  /** One-sentence text alternative; also the fallback if the visual fails. */
  altText: string;
  Component: FC;
}
