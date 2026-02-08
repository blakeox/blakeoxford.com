import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageContent, QualityIndicator } from '../../../src/components/islands/chat/MessageContent';
import type { ChatMessage } from '../../../src/components/islands/chat/types';

// Mock quality-utils
vi.mock('../../../src/lib/quality-utils', () => ({
	getConfidenceIndicator: (score: number) => {
		if (score >= 80) return { label: 'High confidence', emoji: '✅', color: 'text-green-600' };
		if (score >= 60) return { label: 'Medium confidence', emoji: '⚠️', color: 'text-yellow-600' };
		return { label: 'Low confidence', emoji: '❌', color: 'text-red-600' };
	},
	getCitationHealthIndicator: (health: number) => {
		if (health >= 80) return { label: 'Excellent', icon: '💎', color: 'text-blue-600', description: 'High quality sources' };
		if (health >= 60) return { label: 'Good', icon: '👍', color: 'text-green-600', description: 'Good quality sources' };
		return { label: 'Fair', icon: '📌', color: 'text-yellow-600', description: 'Fair quality sources' };
	},
}));

describe('MessageContent', () => {
	const baseChatMessage: ChatMessage = {
		id: 'test-message-1',
		role: 'assistant',
		content: 'This is a test message.',
		timestamp: new Date().toISOString(),
		sources: [],
	};

	describe('Basic Rendering', () => {
		it('should render message content', () => {
			render(
				<MessageContent
					message={baseChatMessage}
					isStreaming={false}
					isAssistant={true}
					bubbleContent="Hello, world!"
					totalSources={0}
					messageTextClasses="text-gray-900"
				/>
			);

			expect(screen.getByText('Hello, world!')).toBeInTheDocument();
		});

		it('should render user message without quality indicators', () => {
			render(
				<MessageContent
					message={baseChatMessage}
					isStreaming={false}
					isAssistant={false}
					bubbleContent="User question"
					totalSources={0}
					messageTextClasses="text-gray-900"
				/>
			);

			expect(screen.getByText('User question')).toBeInTheDocument();
			expect(screen.queryByText(/confidence/i)).not.toBeInTheDocument();
		});

		it('should apply custom message text classes', () => {
			render(
				<MessageContent
					message={baseChatMessage}
					isStreaming={false}
					isAssistant={true}
					bubbleContent="Styled message"
					totalSources={0}
					messageTextClasses="text-blue-500 font-bold"
				/>
			);

			const messageElement = screen.getByText('Styled message');
			expect(messageElement).toHaveClass('text-blue-500', 'font-bold');
		});
	});

	describe('Streaming State', () => {
		it('should display streaming indicator during streaming', () => {
			render(
				<MessageContent
					message={baseChatMessage}
					isStreaming={true}
					isAssistant={true}
					bubbleContent="Partial message..."
					totalSources={0}
					messageTextClasses="text-gray-900"
				/>
			);

expect(screen.getByText('Assistant is responding')).toBeInTheDocument();
			expect(screen.getByText('Partial message...')).toBeInTheDocument();
		});

		it('should display "Thinking…" when assistant message has no content and not streaming', () => {
			render(
				<MessageContent
					message={baseChatMessage}
					isStreaming={false}
					isAssistant={true}
					bubbleContent=""
					totalSources={0}
					messageTextClasses="text-gray-900"
				/>
			);

			expect(screen.getByText('Thinking…')).toBeInTheDocument();
		});

		it('should not display streaming indicator when not streaming', () => {
			render(
				<MessageContent
					message={baseChatMessage}
					isStreaming={false}
					isAssistant={true}
					bubbleContent="Complete message"
					totalSources={0}
					messageTextClasses="text-gray-900"
				/>
			);

			expect(screen.queryByLabelText('Assistant is responding')).not.toBeInTheDocument();
		});

		it('should have accessible live region for streaming indicator', () => {
			render(
				<MessageContent
					message={baseChatMessage}
					isStreaming={true}
					isAssistant={true}
					bubbleContent="Streaming..."
					totalSources={0}
					messageTextClasses="text-gray-900"
				/>
			);

		const srOnlyText = screen.getByText('Assistant is responding');
		const liveRegion = srOnlyText.closest('[aria-live]');
		expect(liveRegion).toHaveAttribute('aria-live', 'polite');
	});
});

describe('Quality Indicators', () => {
	it('should display quality indicator for completed assistant message', () => {
		const messageWithQuality: ChatMessage = {
			...baseChatMessage,
			qualityScore: 85,
		};

		render(
			<MessageContent
				message={messageWithQuality}
				isStreaming={false}
				isAssistant={true}
				bubbleContent="Quality response"
				totalSources={3}
				messageTextClasses="text-gray-900"
			/>
		);

		expect(screen.getByText('High confidence')).toBeInTheDocument();
		expect(screen.getByText('85/100')).toBeInTheDocument();
	});

	it('should not display quality indicator during streaming', () => {
			const messageWithQuality: ChatMessage = {
				...baseChatMessage,
				qualityScore: 85,
			};

			render(
				<MessageContent
					message={messageWithQuality}
					isStreaming={true}
					isAssistant={true}
					bubbleContent="Streaming with quality..."
					totalSources={0}
					messageTextClasses="text-gray-900"
				/>
			);

			expect(screen.queryByText('High confidence')).not.toBeInTheDocument();
		});

		it('should not display quality indicator for user messages', () => {
			const messageWithQuality: ChatMessage = {
				...baseChatMessage,
				qualityScore: 85,
			};

			render(
				<MessageContent
					message={messageWithQuality}
					isStreaming={false}
					isAssistant={false}
					bubbleContent="User message"
					totalSources={0}
					messageTextClasses="text-gray-900"
				/>
			);

			expect(screen.queryByText('High confidence')).not.toBeInTheDocument();
		});
	});
});

describe('QualityIndicator', () => {
	const baseMessage: ChatMessage = {
		id: 'test-quality-1',
		role: 'assistant',
		content: 'Test content',
		timestamp: new Date().toISOString(),
		sources: [],
		qualityScore: 75,
	};

	it('should display quality score and label', () => {
		render(<QualityIndicator message={baseMessage} totalSources={0} />);

		expect(screen.getByText('Medium confidence')).toBeInTheDocument();
		expect(screen.getByText('75/100')).toBeInTheDocument();
	});

	it('should display citation health when available with sources', () => {
		const messageWithCitationHealth: ChatMessage = {
			...baseMessage,
			citationHealth: 85,
		};

		render(<QualityIndicator message={messageWithCitationHealth} totalSources={3} />);

		expect(screen.getByText('Excellent')).toBeInTheDocument();
	});

	it('should not display citation health when no sources', () => {
		const messageWithCitationHealth: ChatMessage = {
			...baseMessage,
			citationHealth: 85,
		};

		render(<QualityIndicator message={messageWithCitationHealth} totalSources={0} />);

		expect(screen.queryByText('Excellent')).not.toBeInTheDocument();
	});

	it('should have accessible labels for quality metrics', () => {
		const messageWithBoth: ChatMessage = {
			...baseMessage,
			qualityScore: 90,
			citationHealth: 95,
		};

		render(<QualityIndicator message={messageWithBoth} totalSources={5} />);

		expect(screen.getByLabelText('Quality: High confidence')).toBeInTheDocument();
		expect(screen.getByLabelText('Citation health: Excellent')).toBeInTheDocument();
	});

	it('should display tooltips for quality metrics', () => {
		const messageWithQuality: ChatMessage = {
			...baseMessage,
			qualityScore: 88,
			citationHealth: 92,
		};

		render(<QualityIndicator message={messageWithQuality} totalSources={4} />);

		const scoreElement = screen.getByTitle('Response quality score: 88/100');
		expect(scoreElement).toBeInTheDocument();

		const healthElement = screen.getByTitle('High quality sources');
		expect(healthElement).toBeInTheDocument();
	});
});
