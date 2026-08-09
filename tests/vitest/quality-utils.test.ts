import { afterEach, describe, expect, it, vi } from 'vitest';
import { evaluateResponseWithLLM } from '@/lib/quality-utils';

describe('quality scoring privacy contract', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not make a second AI request for evaluation', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(
      evaluateResponseWithLLM('private question', 'bounded answer', [])
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
