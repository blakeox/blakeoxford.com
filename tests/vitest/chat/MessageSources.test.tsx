import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CitationLinks, SourcesList } from '../../../src/components/islands/chat/MessageSources';
import type { ChatMessage, Source } from '../../../src/components/islands/chat/types';

// Mock chat utilities
vi.mock('../../../src/lib/chat', () => ({
	cleanSnippet: (snippet: string) => snippet.trim(),
	getRelevanceExplanation: (score: number) => {
		if (score >= 80) return 'Highly relevant to your query';
		if (score >= 60) return 'Moderately relevant';
		return 'Somewhat relevant';
	},
}));

// Mock string utilities
vi.mock('../../../src/lib/string-utils', () => ({
	decodeHtmlEntities: (text: string) => text,
	decodeMimeEncodedWords: (text: string) => text,
	formatPublishedDate: (date?: string) => (date ? 'Jan 1, 2024' : ''),
}));

describe('CitationLinks', () => {
	const mockSources: Source[] = [
		{
			url: 'https://example.com/1',
			title: 'Source 1',
			snippet: 'First source snippet',
			score: 0.95,
		},
		{
			url: 'https://example.com/2',
			title: 'Source 2',
			snippet: 'Second source snippet',
			score: 0.85,
		},
		{
			url: 'https://example.com/3',
			title: 'Source 3',
			snippet: 'Third source snippet',
			score: 0.75,
		},
	];

	it('should render citation buttons for all sources', () => {
		const handleOpen = vi.fn();

		render(<CitationLinks sources={mockSources} messageId="test-msg-1" handleOpenPrimarySource={handleOpen} />);

		expect(screen.getByText('[1]')).toBeInTheDocument();
		expect(screen.getByText('[2]')).toBeInTheDocument();
		expect(screen.getByText('[3]')).toBeInTheDocument();
	});

	it('should call handleOpenPrimarySource when citation clicked', () => {
		const handleOpen = vi.fn();

		render(<CitationLinks sources={mockSources} messageId="test-msg-1" handleOpenPrimarySource={handleOpen} />);

		fireEvent.click(screen.getByText('[1]'));
		expect(handleOpen).toHaveBeenCalledWith('https://example.com/1');

		fireEvent.click(screen.getByText('[2]'));
		expect(handleOpen).toHaveBeenCalledWith('https://example.com/2');
	});

	it('should render "Cited" label', () => {
		const handleOpen = vi.fn();

		render(<CitationLinks sources={mockSources} messageId="test-msg-1" handleOpenPrimarySource={handleOpen} />);

		expect(screen.getByText('Cited')).toBeInTheDocument();
	});

	it('should render no citations when sources array is empty', () => {
		const handleOpen = vi.fn();

		render(<CitationLinks sources={[]} messageId="test-msg-1" handleOpenPrimarySource={handleOpen} />);

		expect(screen.queryByText('[1]')).not.toBeInTheDocument();
	});
});

describe('SourcesList', () => {
	const mockMessage: ChatMessage = {
		id: 'test-message-1',
		role: 'assistant',
		content: 'Test message content',
		timestamp: new Date().toISOString(),
		sources: [],
	};

	const mockSources: Source[] = [
		{
			url: 'https://example.com/article',
			title: 'Test Article',
			snippet: 'This is a test article snippet',
			score: 0.92,
			collection: 'blog',
		},
		{
			url: 'https://example.com/project',
			title: 'Test Project',
			snippet: 'This is a test project snippet',
			score: 0.88,
			collection: 'projects',
		},
	];

	const mockProps = {
		message: mockMessage,
		sources: mockSources,
		showAllSources: false,
		primarySource: mockSources[0],
		primarySourceTitle: 'Test Article',
		primaryLinkTarget: '_blank' as const,
		primaryLinkRel: 'noopener noreferrer',
		totalSources: 2,
		siteHostname: 'example.com',
		expandedIndividualSources: {},
		sourceRefs: { current: [] as HTMLAnchorElement[] }, // Initialize with empty array
		toggleExpandedSource: vi.fn(),
		toggleIndividualSource: vi.fn(),
	};

	it('should render primary source link', () => {
		render(<SourcesList {...mockProps} />);

		const primaryLink = screen.getByText('Test Article');
		expect(primaryLink).toBeInTheDocument();
		expect(primaryLink).toHaveAttribute('href', 'https://example.com/article');
	});

	it('should display "+X more" when multiple sources and not expanded', () => {
		render(<SourcesList {...mockProps} />);

		expect(screen.getByText('+1 more')).toBeInTheDocument();
	});

	it('should not display "+X more" when only one source', () => {
		render(
			<SourcesList
				{...mockProps}
				sources={[mockSources[0]]}
				totalSources={1}
			/>
		);

		expect(screen.queryByText('+1 more')).not.toBeInTheDocument();
	});

	it('should toggle expanded sources when button clicked', () => {
		const toggleExpanded = vi.fn();

		render(<SourcesList {...mockProps} toggleExpandedSource={toggleExpanded} />);

		fireEvent.click(screen.getByText('Show all (2)'));
		expect(toggleExpanded).toHaveBeenCalledWith('test-message-1');
	});

	it('should display "Hide details" when sources are expanded', async () => {
		const { container: _container } = render(<SourcesList {...mockProps} showAllSources={true} />);

		const button = await screen.findByText('Hide details');
		expect(button).toBeInTheDocument();
	});

	it('should display "Show details" for single source when collapsed', () => {
		render(
			<SourcesList
				{...mockProps}
				sources={[mockSources[0]]}
				totalSources={1}
				showAllSources={false}
			/>
		);

		expect(screen.getByText('Show details')).toBeInTheDocument();
	});

	it('should use external link attributes for primary source', () => {
		render(<SourcesList {...mockProps} />);

		const link = screen.getByText('Test Article');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('should have accessible "Sources" label', () => {
		render(<SourcesList {...mockProps} />);

		expect(screen.getByLabelText('Referenced sources')).toBeInTheDocument();
	});

	it('should not render primary source link when primarySource is null', () => {
		render(
			<SourcesList
				{...mockProps}
				primarySource={null}
				primarySourceTitle={null}
			/>
		);

		expect(screen.queryByText('Test Article')).not.toBeInTheDocument();
	});

	it('should display expanded sources list when showAllSources is true', async () => {
		render(<SourcesList {...mockProps} showAllSources={true} />);

		// Wait for component to render - sourceRefs needs to initialize
		await screen.findByText('Hide details');
		
		// Check that expanded list container is rendered
		const sourcesList = screen.getByRole('list');
		expect(sourcesList).toBeInTheDocument();
	});
});
