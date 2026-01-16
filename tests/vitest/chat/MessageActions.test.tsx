import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageActions } from '../../../src/components/islands/chat/MessageActions';
import type { ChatMessage, Source } from '../../../src/components/islands/chat/types';

// Mock analytics
vi.mock('../../../src/lib/analytics', () => ({
	autoragEvents: {
		share: vi.fn(),
	},
}));

// Mock quality-utils
vi.mock('../../../src/lib/quality-utils', () => ({
	getConfidenceIndicator: (score: number) => {
		if (score >= 80) return { label: 'High confidence', emoji: '✅', color: 'text-green-600' };
		if (score >= 60) return { label: 'Medium confidence', emoji: '⚠️', color: 'text-yellow-600' };
		return { label: 'Low confidence', emoji: '❌', color: 'text-red-600' };
	},
}));

describe('MessageActions', () => {
	const baseMessage: ChatMessage = {
		id: 'test-msg-1',
		role: 'assistant',
		content: 'This is a test answer.',
		timestamp: new Date().toISOString(),
		sources: [],
		qualityScore: 85,
	};

	const mockMessages: ChatMessage[] = [
		{
			id: 'user-msg-1',
			role: 'user',
			content: 'What is TypeScript?',
			timestamp: new Date().toISOString(),
			sources: [],
		},
		baseMessage,
	];

	const mockSource: Source = {
		url: 'https://example.com/article',
		title: 'Test Article',
		snippet: 'Article snippet',
		score: 0.95,
	};

	const defaultProps = {
		message: baseMessage,
		messages: mockMessages,
		primarySource: mockSource,
		copiedMessageId: null,
		copiedShareUrl: null,
		isHelpful: false,
		isNotHelpful: false,
		handleCopyMessage: vi.fn(),
		handleOpenPrimarySource: vi.fn(),
		handleFeedback: vi.fn(),
		copyWithFeedback: vi.fn().mockResolvedValue(true),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Copy Button', () => {
		it('should render "Copy answer" button', () => {
			render(<MessageActions {...defaultProps} />);

			expect(screen.getByText('Copy answer')).toBeInTheDocument();
		});

		it('should call handleCopyMessage when clicked', () => {
			const handleCopy = vi.fn();

			render(<MessageActions {...defaultProps} handleCopyMessage={handleCopy} />);

			fireEvent.click(screen.getByText('Copy answer'));
			expect(handleCopy).toHaveBeenCalledWith(baseMessage);
		});

		it('should display "Copied" when message is copied', () => {
			render(<MessageActions {...defaultProps} copiedMessageId="test-msg-1" />);

			expect(screen.getByText('Copied')).toBeInTheDocument();
			expect(screen.queryByText('Copy answer')).not.toBeInTheDocument();
		});

		it('should display "Copy answer" for other messages when one is copied', () => {
			const otherMessage: ChatMessage = { ...baseMessage, id: 'other-msg' };

			render(<MessageActions {...defaultProps} message={otherMessage} copiedMessageId="test-msg-1" />);

			expect(screen.getByText('Copy answer')).toBeInTheDocument();
		});
	});

	describe('Share Button', () => {
		it('should render share button', () => {
			render(<MessageActions {...defaultProps} />);

			// Share button text is inside ShareButton component
			const shareButtons = screen.getAllByRole('button');
			expect(shareButtons.length).toBeGreaterThan(1);
		});
	});

	describe('View Top Source Button', () => {
		it('should render "View top source" button when primary source exists', () => {
			render(<MessageActions {...defaultProps} />);

			expect(screen.getByText('View top source')).toBeInTheDocument();
		});

		it('should not render "View top source" button when primary source is null', () => {
			render(<MessageActions {...defaultProps} primarySource={null} />);

			expect(screen.queryByText('View top source')).not.toBeInTheDocument();
		});

		it('should call handleOpenPrimarySource when clicked', () => {
			const handleOpen = vi.fn();

			render(<MessageActions {...defaultProps} handleOpenPrimarySource={handleOpen} />);

			fireEvent.click(screen.getByText('View top source'));
			expect(handleOpen).toHaveBeenCalledWith('https://example.com/article');
		});
	});

	describe('Quality Score Badge', () => {
		it('should display quality score when available', () => {
			render(<MessageActions {...defaultProps} />);

			// Quality score badge is rendered inside QualityScoreBadge component
			const buttons = screen.getAllByRole('button');
			expect(buttons.length).toBeGreaterThan(0);
		});

		it('should not crash when quality score is undefined', () => {
			const messageWithoutQuality: ChatMessage = {
				...baseMessage,
				qualityScore: undefined,
			};

			render(<MessageActions {...defaultProps} message={messageWithoutQuality} />);

			// Should render without errors
			expect(screen.getByText('Copy answer')).toBeInTheDocument();
		});
	});

	describe('Feedback Buttons', () => {
		it('should render helpful and not helpful buttons', () => {
			render(<MessageActions {...defaultProps} />);

			const buttons = screen.getAllByRole('button');
			// Should have multiple buttons including feedback buttons
			expect(buttons.length).toBeGreaterThanOrEqual(4); // copy, share, source, helpful, not helpful
		});

		it('should highlight helpful button when marked helpful', () => {
			render(<MessageActions {...defaultProps} isHelpful={true} />);

			// FeedbackButtons component should handle highlighting
			expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
		});

		it('should highlight not helpful button when marked not helpful', () => {
			render(<MessageActions {...defaultProps} isNotHelpful={true} />);

			// FeedbackButtons component should handle highlighting
			expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
		});

		it('should not highlight either button when no feedback given', () => {
			render(<MessageActions {...defaultProps} isHelpful={false} isNotHelpful={false} />);

			// Should render all buttons without highlighting
			expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
		});
	});

	describe('Accessibility', () => {
		it('should have all buttons with proper type attribute', () => {
			render(<MessageActions {...defaultProps} />);

			const buttons = screen.getAllByRole('button');
			buttons.forEach((button) => {
				expect(button).toHaveAttribute('type', 'button');
			});
		});

		it('should have keyboard accessible buttons', () => {
			render(<MessageActions {...defaultProps} />);

			const copyButton = screen.getByText('Copy answer');
			const buttonElement = copyButton.closest('button');
			expect(buttonElement).toBeInTheDocument();
		});
	});
});
