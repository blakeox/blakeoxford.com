import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatRelativeDate } from '../../src/lib/string-utils';
import { CommandTitleSuggestions } from '../../src/features/command-center/components/CommandTitleSuggestions';
import type { CommandItem } from '../../src/features/command-center/types';

describe('formatRelativeDate', () => {
  it('returns relative labels for recent dates', () => {
    const today = new Date().toISOString();
    expect(formatRelativeDate(today)).toBe('Today');

    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    expect(formatRelativeDate(yesterday)).toBe('Yesterday');
  });
});

describe('CommandTitleSuggestions', () => {
  const items: CommandItem[] = [
    {
      id: '/projects/microsoft-fabric/',
      kind: 'project',
      title: 'Microsoft Fabric',
      subtitle: 'Analytics',
      href: '/projects/microsoft-fabric/',
      tags: ['fabric'],
      source: 'local',
    },
    {
      id: '/projects/other/',
      kind: 'project',
      title: 'Other Work',
      subtitle: '',
      href: '/projects/other/',
      tags: [],
      source: 'local',
    },
  ];

  it('shows matching titles for partial queries', () => {
    render(<CommandTitleSuggestions query="fab" items={items} onSelect={() => undefined} />);
    expect(screen.getByText('Microsoft Fabric')).toBeInTheDocument();
    expect(screen.queryByText('Other Work')).not.toBeInTheDocument();
  });

  it('hides when the query is too short', () => {
    const { container } = render(
      <CommandTitleSuggestions query="f" items={items} onSelect={() => undefined} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
