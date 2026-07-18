import CoinFlipInteraction from './CoinFlipInteraction';

interface Props {
  rootId: string;
  liveRegionId: string;
  flipOnClick: boolean;
}

/**
 * Client-only coin flip interaction. Mount with `client:only="react"` —
 * no SSR null guard (that caused hydration mismatches).
 */
export default function CoinFlipClient(props: Props) {
  return <CoinFlipInteraction {...props} />;
}
