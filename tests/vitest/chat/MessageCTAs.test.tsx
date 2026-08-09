import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  MatchedCTA,
  FollowUpSuggestions,
  ContextualCTAs,
} from '../../../src/features/chat/components/MessageCTAs';
import type { ChatMessage, Source } from '../../../src/features/chat/types';
import { autoragEvents } from '../../../src/lib/analytics';

// Mock analytics - factory function to avoid hoisting issues
vi.mock('../../../src/lib/analytics', () => ({
  autoragEvents: {
    ctaClick: vi.fn(),
  },
}));

// Mock chat utilities with actual CTA logic - inline to avoid hoisting issues
vi.mock('../../../src/lib/chat', () => ({
  CONTEXTUAL_CTAS: [
    {
      id: 'hire-me',
      condition: (query: string) => /hire|work|collaborate/i.test(query),
      icon: '💼',
      message: 'Interested in hiring Blake for your next project?',
      ctaText: "Let's work together",
      ctaLink: '/contact',
    },
    {
      id: 'explore-projects',
      condition: (query: string) => /project|work|portfolio/i.test(query),
      icon: '🚀',
      message: "Want to see more of Blake's work?",
      ctaText: 'Explore projects',
      ctaLink: '/projects',
    },
  ],
  generateContextualCTAs: (sources: any[], hostname: string, messagesCount: number) => {
    const ctas = [];
    if (sources.some((s) => s.collection === 'projects')) {
      ctas.push({
        label: 'View all projects',
        url: '/projects',
        type: 'projects',
        icon: '🚀',
      });
    }
    if (messagesCount >= 5) {
      ctas.push({
        label: 'Contact Blake',
        url: '/contact',
        type: 'contact',
        icon: '💼',
      });
    }
    return ctas;
  },
}));

describe('MatchedCTA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseMessage: ChatMessage = {
    id: 'test-msg-1',
    role: 'assistant',
    content: 'Test answer',
    timestamp: new Date().toISOString(),
    sources: [],
  };

  const mockMessages: ChatMessage[] = [
    {
      id: 'user-msg-1',
      role: 'user',
      content: 'I want to hire you',
      timestamp: new Date().toISOString(),
      sources: [],
    },
    baseMessage,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render CTA when query matches condition', () => {
    render(<MatchedCTA message={baseMessage} messages={mockMessages} sources={[]} />);

    expect(
      screen.getByText('Interested in hiring Blake for your next project?')
    ).toBeInTheDocument();
    expect(screen.getByText("Let's work together")).toBeInTheDocument();
  });

  it('should not render CTA when query does not match any condition', () => {
    const nonMatchingMessages: ChatMessage[] = [
      {
        id: 'user-msg-2',
        role: 'user',
        content: 'What is TypeScript?',
        timestamp: new Date().toISOString(),
        sources: [],
      },
      baseMessage,
    ];

    const { container } = render(
      <MatchedCTA message={baseMessage} messages={nonMatchingMessages} sources={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render explore projects CTA for project-related queries', () => {
    const projectMessages: ChatMessage[] = [
      {
        id: 'user-msg-3',
        role: 'user',
        content: 'Tell me about your projects',
        timestamp: new Date().toISOString(),
        sources: [],
      },
      baseMessage,
    ];

    render(<MatchedCTA message={baseMessage} messages={projectMessages} sources={[]} />);

    expect(screen.getByText("Want to see more of Blake's work?")).toBeInTheDocument();
    expect(screen.getByText('Explore projects')).toBeInTheDocument();
  });

  it('should render an accessible CTA link', () => {
    render(<MatchedCTA message={baseMessage} messages={mockMessages} sources={[]} />);

    expect(screen.getByRole('link', { name: "Let's work together" })).toBeInTheDocument();
  });

  it('should have correct link href', () => {
    render(<MatchedCTA message={baseMessage} messages={mockMessages} sources={[]} />);

    const ctaLink = screen.getByText("Let's work together");
    expect(ctaLink).toHaveAttribute('href', '/contact');
  });

  it('should track analytics on CTA click', () => {
    // Mock window object
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost' },
      writable: true,
    });

    render(<MatchedCTA message={baseMessage} messages={mockMessages} sources={[]} />);

    const ctaLink = screen.getByText("Let's work together");
    fireEvent.click(ctaLink);

    expect(autoragEvents.ctaClick).toHaveBeenCalledWith({
      type: 'quality-suggestion',
    });
  });
});

describe('FollowUpSuggestions', () => {
  const mockSetInputValue = vi.fn();
  const mockSendQuery = vi.fn();

  const projectSources: Source[] = [
    {
      url: 'https://example.com/project-1',
      title: 'E-Commerce Platform',
      collection: 'projects',
      snippet: 'A modern e-commerce solution',
      score: 0.95,
    },
  ];

  const blogSources: Source[] = [
    {
      url: 'https://example.com/blog-1',
      title: 'TypeScript Best Practices',
      collection: 'blog',
      snippet: 'Learn TypeScript patterns',
      score: 0.9,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate project follow-up suggestion', () => {
    render(
      <FollowUpSuggestions
        sources={projectSources}
        setInputValue={mockSetInputValue}
        sendQuery={mockSendQuery}
      />
    );

    expect(screen.getByRole('button', { name: 'More on this project' })).toBeInTheDocument();
  });

  it('should generate blog follow-up suggestion', () => {
    render(
      <FollowUpSuggestions
        sources={blogSources}
        setInputValue={mockSetInputValue}
        sendQuery={mockSendQuery}
      />
    );

    expect(screen.getByRole('button', { name: 'Related writing' })).toBeInTheDocument();
  });

  it('should not render when no suggestions available', () => {
    const { container } = render(
      <FollowUpSuggestions
        sources={[]}
        setInputValue={mockSetInputValue}
        sendQuery={mockSendQuery}
      />
    );

    // Check for suggestion chips container
    const chips = container.querySelectorAll('button');
    expect(chips.length).toBe(0);
  });

  it('should render accessible suggestion controls', () => {
    render(
      <FollowUpSuggestions
        sources={projectSources}
        setInputValue={mockSetInputValue}
        sendQuery={mockSendQuery}
      />
    );

    expect(screen.getByRole('button', { name: 'More on this project' })).toBeInTheDocument();
  });
});

describe('ContextualCTAs', () => {
  const projectSources: Source[] = [
    {
      url: 'https://example.com/project-1',
      title: 'Test Project',
      collection: 'projects',
      snippet: 'Project description',
      score: 0.92,
    },
  ];

  it('should render project CTA when project sources present', () => {
    render(
      <ContextualCTAs sources={projectSources} siteHostname="example.com" messagesCount={2} />
    );

    expect(screen.getByText('View all projects')).toBeInTheDocument();
  });

  it('should render contact CTA after 5+ messages', () => {
    render(<ContextualCTAs sources={[]} siteHostname="example.com" messagesCount={6} />);

    expect(screen.getByText('Contact Blake')).toBeInTheDocument();
  });

  it('should render multiple CTAs when conditions met', () => {
    render(
      <ContextualCTAs sources={projectSources} siteHostname="example.com" messagesCount={10} />
    );

    expect(screen.getByText('View all projects')).toBeInTheDocument();
    expect(screen.getByText('Contact Blake')).toBeInTheDocument();
  });

  it('should not render CTAs when no conditions met', () => {
    const { container } = render(
      <ContextualCTAs sources={[]} siteHostname="example.com" messagesCount={2} />
    );

    const links = container.querySelectorAll('a');
    expect(links.length).toBe(0);
  });

  it('should have correct link hrefs', () => {
    render(
      <ContextualCTAs sources={projectSources} siteHostname="example.com" messagesCount={6} />
    );

    const projectLink = screen.getByText('View all projects').closest('a');
    const contactLink = screen.getByText('Contact Blake').closest('a');

    expect(projectLink).toHaveAttribute('href', '/projects');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });
});
