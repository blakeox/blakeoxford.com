import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HighlightText } from '../../src/features/command-center/components/CommandResultRow';

describe('HighlightText', () => {
  it('highlights each query token independently', () => {
    render(<HighlightText text="Microsoft Fabric automation guide" query="fabric auto" />);
    const marks = screen.getAllByText(/fabric|auto/i);
    // "Fabric" and "auto" (from automation) should be marked
    expect(marks.some((el) => el.tagName === 'MARK' && /fabric/i.test(el.textContent || ''))).toBe(
      true
    );
    expect(marks.some((el) => el.tagName === 'MARK' && /auto/i.test(el.textContent || ''))).toBe(
      true
    );
  });

  it('returns plain text when the query is empty', () => {
    const { container } = render(<HighlightText text="Microsoft Fabric" query="  " />);
    expect(container.textContent).toBe('Microsoft Fabric');
    expect(container.querySelector('mark')).toBeNull();
  });
});
