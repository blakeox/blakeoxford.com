import { describe, expect, it } from 'vitest';

import {
  formatPageContextLabel,
  withPageContext,
  type PageContext,
} from '../../src/lib/chat/pageContext';

describe('pageContext helpers', () => {
  const context: PageContext = {
    url: 'https://blakeoxford.com/projects/microsoft-fabric/',
    title: 'Microsoft Fabric',
    pathname: '/projects/microsoft-fabric/',
  };

  it('labels home as Home', () => {
    expect(
      formatPageContextLabel({
        url: 'https://blakeoxford.com/',
        title: 'Blake Oxford',
        pathname: '/',
      }),
    ).toBe('Home');
  });

  it('uses page title for deep pages', () => {
    expect(formatPageContextLabel(context)).toBe('Microsoft Fabric');
  });

  it('frames queries with page context', () => {
    expect(withPageContext('What is this about?', context)).toContain('Microsoft Fabric');
    expect(withPageContext('What is this about?', context)).toContain('What is this about?');
  });

  it('leaves queries alone without context', () => {
    expect(withPageContext('Hello', null)).toBe('Hello');
  });
});
