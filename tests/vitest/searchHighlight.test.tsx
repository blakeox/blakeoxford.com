import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { HighlightText } from '../../src/features/command-center/components/CommandResultRow';

afterEach(cleanup);
describe('search match emphasis', () => {
  it('highlights the AI acronym without emphasizing letters inside unrelated words', () => {
    const text = 'Explainable finance makes AI adoption safer';
    const { container } = render(<HighlightText text={text} query="ai" />);
    expect(container.textContent).toBe(text);
    expect([...container.querySelectorAll('mark')].map((node) => node.textContent)).toEqual(['AI']);
  });
  it('retains meaningful longer partial matches', () => {
    const { container } = render(
      <HighlightText text="Workflows and automation" query="workflow automation" />
    );
    expect([...container.querySelectorAll('mark')].map((node) => node.textContent)).toEqual([
      'Workflow',
      'automation',
    ]);
  });
  it('treats punctuation in the query as literal text', () => {
    const { container } = render(<HighlightText text="A .+ query" query=".+" />);
    expect([...container.querySelectorAll('mark')].map((node) => node.textContent)).toEqual(['.+']);
  });
});
