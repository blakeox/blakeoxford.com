import { afterEach, describe, expect, it } from 'vitest';
import { isolateModal } from '@/utils/modalIsolation';

afterEach(() => document.body.replaceChildren());

describe('modal background isolation', () => {
  it('isolates sibling branches while preserving the modal, its backdrop, and prior inert state', () => {
    const main = document.createElement('main');
    const alreadyInert = document.createElement('section');
    alreadyInert.setAttribute('inert', '');
    const mount = document.createElement('div');
    const root = document.createElement('div');
    const backdrop = document.createElement('button');
    const panel = document.createElement('div');
    root.append(backdrop, panel);
    mount.append(root);
    document.body.append(main, alreadyInert, mount);
    const release = isolateModal(root);
    expect(main.hasAttribute('inert')).toBe(true);
    expect(panel.closest('[inert]')).toBeNull();
    expect(backdrop.closest('[inert]')).toBeNull();
    release();
    release();
    expect(main.hasAttribute('inert')).toBe(false);
    expect(alreadyInert.hasAttribute('inert')).toBe(true);
  });

  it('keeps shared background isolated until the last owner releases it', () => {
    const main = document.createElement('main');
    const root = document.createElement('div');
    document.body.append(main, root);
    const first = isolateModal(root);
    const second = isolateModal(root);
    first();
    expect(main.hasAttribute('inert')).toBe(true);
    second();
    expect(main.hasAttribute('inert')).toBe(false);
  });
});
