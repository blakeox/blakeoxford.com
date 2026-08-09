import { createElement, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import CommandCenter from './CommandCenter';

type CommandCenterProps = { mountRoot?: HTMLElement };

const roots = new WeakMap<HTMLElement, Root>();

/** Mount the search surface into its server-rendered trigger shell on first use. */
export function mountCommandCenter(root: HTMLElement): void {
  if (roots.has(root)) return;
  const reactRoot = createRoot(root);
  roots.set(root, reactRoot);
  reactRoot.render(
    createElement(CommandCenter as ComponentType<CommandCenterProps>, { mountRoot: root })
  );
}
