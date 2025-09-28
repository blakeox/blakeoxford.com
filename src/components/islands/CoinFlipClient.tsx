import React from 'react';
import CoinFlipInteraction from './CoinFlipInteraction';

interface Props {
  rootId: string;
  innerId: string;
  liveRegionId: string;
  flipOnClick: boolean;
}

/**
 * SSR guard wrapper for CoinFlipInteraction.
 * Prevents React hooks from running during SSR while allowing client hydration.
 */
export default function CoinFlipClient(props: Props) {
  if (typeof window === 'undefined') return null;
  return <CoinFlipInteraction {...props} />;
}
