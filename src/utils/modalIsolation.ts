/** Make sibling branches inert while keeping a modal's controls and backdrop usable. */
const owners = new Map<HTMLElement, { count: number; originallyInert: boolean }>();

export function isolateModal(root: HTMLElement): () => void {
  const isolated: HTMLElement[] = [];
  let branch: HTMLElement = root;
  while (branch.parentElement) {
    const parent = branch.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (
        sibling === branch ||
        !(sibling instanceof HTMLElement) ||
        ['SCRIPT', 'STYLE', 'LINK'].includes(sibling.tagName)
      )
        continue;
      const owner = owners.get(sibling) ?? {
        count: 0,
        originallyInert: sibling.hasAttribute('inert'),
      };
      owner.count += 1;
      owners.set(sibling, owner);
      sibling.setAttribute('inert', '');
      isolated.push(sibling);
    }
    if (parent === document.body) break;
    branch = parent;
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const element of isolated) {
      const owner = owners.get(element);
      if (!owner || --owner.count > 0) continue;
      if (!owner.originallyInert) element.removeAttribute('inert');
      owners.delete(element);
    }
  };
}
