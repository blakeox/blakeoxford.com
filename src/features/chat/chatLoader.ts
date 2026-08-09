import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import AIChatIsland from './AIChatIsland';

const roots = new WeakMap<HTMLElement, Root>();

/** Mount the Ask surface into its server-rendered trigger shell on first use. */
export function mountAIChat(root: HTMLElement): void {
  if (roots.has(root)) return;
  const reactRoot = createRoot(root);
  roots.set(root, reactRoot);
  reactRoot.render(createElement(AIChatIsland));
}
