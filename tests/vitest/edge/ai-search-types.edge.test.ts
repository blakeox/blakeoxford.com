import { describe, expect, it } from 'vitest';
import { parseHistory, parsePageContext } from '../../../functions/routes/ai-search/types';

describe('AI search request bounds', () => {
  it('bounds history entry size and total context', () => {
    const history = parseHistory(
      Array.from({ length: 12 }, (_, index) => ({
        role: index % 2 ? 'assistant' : 'user',
        content: `${index}-${'x'.repeat(2500)}`,
      }))
    );

    expect(history).toHaveLength(6);
    expect(history.every((entry) => entry.content.length <= 2000)).toBe(true);
    expect(history.reduce((total, entry) => total + entry.content.length, 0)).toBeLessThanOrEqual(
      12000
    );
  });

  it('bounds page context fields', () => {
    const context = parsePageContext({
      title: 't'.repeat(500),
      pathname: 'p'.repeat(500),
      url: 'u'.repeat(500),
    });

    expect(context?.title).toHaveLength(240);
    expect(context?.pathname).toHaveLength(240);
    expect(context?.url).toHaveLength(240);
  });
});
