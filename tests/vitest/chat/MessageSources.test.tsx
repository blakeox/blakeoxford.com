import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { filterDisplaySources, MessageSources } from '../../../src/components/islands/chat/MessageSources';
import type { Source } from '../../../src/components/islands/chat/types';

const sources: Source[] = [
	{ title: 'Microsoft Fabric', url: '/projects/microsoft-fabric/', score: 0.91 },
	{ title: 'Bank Projections', url: '/projects/bank-projections-modeling/', score: 0.72 },
	{ title: 'Hello World', url: '/hello/', score: 0.4 },
];

describe('filterDisplaySources', () => {
	it('keeps the top strong matches and drops weak scores', () => {
		const visible = filterDisplaySources(sources, 2);
		expect(visible).toHaveLength(2);
		expect(visible[0]?.title).toBe('Microsoft Fabric');
		expect(visible.map((s) => s.title)).not.toContain('Hello World');
	});
});

describe('MessageSources', () => {
	it('renders up to two titled citation links', () => {
		render(
			<MessageSources
				sources={sources}
				messageId="msg-1"
				siteHostname="blakeoxford.com"
				sourceRefs={createRef<HTMLAnchorElement[]>()}
			/>,
		);

		expect(screen.getByRole('link', { name: 'Microsoft Fabric' })).toHaveAttribute(
			'href',
			'/projects/microsoft-fabric/',
		);
		expect(screen.getByRole('link', { name: 'Bank Projections' })).toBeInTheDocument();
		expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
		expect(screen.getByText('+1 more cited')).toBeInTheDocument();
	});

	it('calls onOpenSource when a citation is clicked', () => {
		const onOpenSource = vi.fn();
		render(
			<MessageSources
				sources={sources.slice(0, 1)}
				messageId="msg-2"
				siteHostname="blakeoxford.com"
				onOpenSource={onOpenSource}
			/>,
		);

		screen.getByRole('link', { name: 'Microsoft Fabric' }).click();
		expect(onOpenSource).toHaveBeenCalledWith('/projects/microsoft-fabric/');
	});

	it('returns null when there are no sources', () => {
		const { container } = render(
			<MessageSources sources={[]} messageId="msg-3" siteHostname="blakeoxford.com" />,
		);
		expect(container).toBeEmptyDOMElement();
	});
});
