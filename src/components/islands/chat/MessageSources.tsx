/**
 * MessageSources - Renders source citations, expandable source lists, and metadata
 *
 * @component
 * @category Islands/Chat
 * @subcategory Source Display
 *
 * @description
 * A collection of memoized React components for displaying AI chat sources with citations,
 * relevance scores, snippets, and metadata. Provides expandable source lists with lazy
 * loading, keyboard navigation, and responsive design.
 *
 * Exports three main components:
 * - CitationLinks: Inline citation badges [1] [2] [3]
 * - SourcesList: Primary source + expandable full source list
 * - Internal helpers for expanded source details
 *
 * @example Citation links
 * ```tsx
 * <CitationLinks
 *   sources={message.sources}
 *   messageId={message.id}
 *   handleOpenPrimarySource={(url) => window.open(url)}
 * />
 * ```
 *
 * @example Full sources list
 * ```tsx
 * <SourcesList
 *   message={message}
 *   sources={message.sources}
 *   showAllSources={isExpanded}
 *   primarySource={sources[0]}
 *   primarySourceTitle="Blog Post Title"
 *   totalSources={sources.length}
 *   siteHostname="blakeoxford.com"
 *   expandedIndividualSources={expandedState}
 *   sourceRefs={sourceRefsArray}
 *   toggleExpandedSource={(id) => setExpanded(!isExpanded)}
 *   toggleIndividualSource={(key) => toggleSource(key)}
 * />
 * ```
 *
 * @accessibility
 * - Sources container uses aria-label="Referenced sources"
 * - Citation buttons have keyboard focus and ARIA attributes
 * - External links use target="_blank" with rel="noopener noreferrer"
 * - Expandable sections announce state changes
 * - Relevance scores have explanatory tooltips
 *
 * @performance
 * - All components wrapped in React.memo
 * - Conditional rendering for expanded states
 * - LazyLoad for source snippets
 * - String utilities decode HTML entities once
 */
import { memo, type RefObject } from 'react';
import {
	cleanSnippet,
	getRelevanceExplanation,
} from '../../../lib/chat';
import {
	decodeHtmlEntities,
	decodeMimeEncodedWords,
	formatPublishedDate,
} from '../../../lib/string-utils';
import type { ChatMessage, Source } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CitationLinksProps {
	sources: Source[];
	messageId: string;
	handleOpenPrimarySource: (url: string) => void;
}

interface SourcesListProps {
	message: ChatMessage;
	sources: Source[];
	showAllSources: boolean;
	primarySource: Source | null;
	primarySourceTitle: string | null;
	primaryLinkTarget: string | undefined;
	primaryLinkRel: string | undefined;
	totalSources: number;
	siteHostname: string;
	expandedIndividualSources: Record<string, boolean>;
	sourceRefs: RefObject<HTMLAnchorElement[]>;
	toggleExpandedSource: (messageId: string) => void;
	toggleIndividualSource: (sourceKey: string) => void;
}

// ─── Citation Links Component ─────────────────────────────────────────────────

export const CitationLinks = memo(function CitationLinks({
	sources,
	messageId,
	handleOpenPrimarySource,
}: CitationLinksProps) {
	return (
		<div className="flex flex-wrap items-center gap-2 text-[0.65rem] text-[color:var(--fg)]/60">
			<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Cited</span>
			{sources.map((source, index) => (
				<button
					key={`${messageId}-citation-${index}`}
					type="button"
					className="rounded-full border border-[color:var(--accent)]/30 px-2 py-0.5 text-[color:var(--accent)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]"
					onClick={() => handleOpenPrimarySource(source.url)}
				>
					[{index + 1}]
				</button>
			))}
		</div>
	);
});

// ─── Sources List Component ───────────────────────────────────────────────────

export const SourcesList = memo(function SourcesList({
	message,
	sources,
	showAllSources,
	primarySource,
	primarySourceTitle,
	primaryLinkTarget,
	primaryLinkRel,
	totalSources,
	siteHostname,
	expandedIndividualSources,
	sourceRefs,
	toggleExpandedSource,
	toggleIndividualSource,
}: SourcesListProps) {
	return (
		<div className="mt-1 flex flex-col gap-2 text-xs" aria-label="Referenced sources">
			<div className="flex flex-wrap items-center gap-2">
				<span className="uppercase tracking-wide text-[color:var(--fg)]/50">Sources</span>
				{primarySource && primarySourceTitle && (
					<a
						href={primarySource.url}
						target={primaryLinkTarget}
						rel={primaryLinkRel}
						className="max-w-full min-w-0 break-words whitespace-normal rounded-full border border-[color:var(--border)]/40 px-2.5 py-0.5 text-left text-[0.65rem] leading-tight text-[color:var(--accent)] transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]"
					>
						{primarySourceTitle}
					</a>
				)}
				{totalSources > 1 && !showAllSources && (
					<span className="text-[color:var(--fg)]/50">+{totalSources - 1} more</span>
				)}
				<button
					type="button"
					className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 px-2.5 py-0.5 text-[0.65rem] text-[color:var(--fg)]/65 transition hover:border-[color:var(--accent)]/40 hover:text-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]/40"
					onClick={() => toggleExpandedSource(message.id)}
				>
					{showAllSources ? 'Hide details' : totalSources > 1 ? `Show all (${totalSources})` : 'Show details'}
				</button>
			</div>
			{showAllSources && (
				<ExpandedSourcesList
					sources={sources}
					messageId={message.id}
					siteHostname={siteHostname}
					expandedIndividualSources={expandedIndividualSources}
					sourceRefs={sourceRefs}
					toggleIndividualSource={toggleIndividualSource}
				/>
			)}
		</div>
	);
});

// ─── Expanded Sources List ────────────────────────────────────────────────────

function ExpandedSourcesList({
	sources,
	messageId,
	siteHostname,
	expandedIndividualSources,
	sourceRefs,
	toggleIndividualSource,
}: {
	sources: Source[];
	messageId: string;
	siteHostname: string;
	expandedIndividualSources: Record<string, boolean>;
	sourceRefs: RefObject<HTMLAnchorElement[]>;
	toggleIndividualSource: (sourceKey: string) => void;
}) {
	return (
		<ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
			{sources.map((source, index) => {
				const relevance = typeof source.score === 'number' ? Math.round(Math.min(Math.max(source.score, 0), 1) * 100) : null;
				const title = decodeMimeEncodedWords(decodeHtmlEntities(source.title || ''));
				const displayTitle = title || decodeMimeEncodedWords(decodeHtmlEntities(source.url));
				const snippetSource = source.summary || source.snippet || '';
				const snippet = snippetSource ? cleanSnippet(snippetSource) : '';
				const publishedLabel = formatPublishedDate(source.publishedAt ?? undefined);
				const sourceKey = `${messageId}-source-${index}`;
				const isExpanded = expandedIndividualSources[sourceKey];
				const relevanceInfo = relevance !== null ? getRelevanceExplanation(relevance) : null;

				const isExternalLink = (() => {
					try {
						const parsed = source.url.startsWith('http')
							? new URL(source.url)
							: new URL(source.url, `https://${siteHostname}`);
						return parsed.hostname !== siteHostname;
					} catch {
						return !source.url.startsWith('/');
					}
				})();
				const linkTarget = isExternalLink ? '_blank' : undefined;
				const linkRel = isExternalLink ? 'noreferrer' : undefined;

				return (
					<li
						key={sourceKey}
						className="group w-full rounded-2xl border border-[color:var(--border)]/40 bg-gradient-to-br from-[color:var(--surface-subtle)]/40 to-[color:var(--surface)]/20 px-4 py-3 text-left text-[color:var(--fg)]/80 shadow-sm transition hover:border-[color:var(--accent)]/60 hover:bg-[color:var(--surface)]/60 hover:shadow-md"
					>
						<div className="flex items-start gap-3">
							<div className="flex shrink-0 items-center gap-2">
								<span className="inline-flex size-6 items-center justify-center rounded-full bg-[color:var(--accent)]/15 text-xs font-bold text-[color:var(--accent)]">{index + 1}</span>
								{source.icon && <span className="shrink-0 text-xl" aria-hidden="true">{source.icon}</span>}
							</div>
							<div className="min-w-0 flex-1">
								<a
									ref={(element) => {
										if (element) sourceRefs.current.push(element);
									}}
									href={source.url}
									tabIndex={0}
									target={linkTarget}
									rel={linkRel}
									className="block font-medium text-[color:var(--accent)] underline decoration-dotted underline-offset-2 transition group-hover:text-[color:var(--accent-strong)]"
								>
									{displayTitle}
								</a>
								<SourceMetadata
									source={source}
									relevance={relevance}
									publishedLabel={publishedLabel}
									isExternalLink={isExternalLink}
								/>
								{(relevanceInfo || snippet) && (
									<SourceDetails
										relevanceInfo={relevanceInfo}
										snippet={snippet}
										isExpanded={isExpanded}
										sourceKey={sourceKey}
										toggleIndividualSource={toggleIndividualSource}
									/>
								)}
							</div>
						</div>
					</li>
				);
			})}
		</ul>
	);
}

// ─── Source Metadata Component ────────────────────────────────────────────────

function SourceMetadata({
	source,
	relevance,
	publishedLabel,
	isExternalLink,
}: {
	source: Source;
	relevance: number | null;
	publishedLabel: string | null;
	isExternalLink: boolean;
}) {
	return (
		<div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.65rem] text-[color:var(--fg)]/60">
			{source.collection && (
				<span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--accent)]/15 px-2.5 py-0.5 font-semibold text-[color:var(--accent-strong)]">
					{source.collection === 'blog' && '📝'}
					{source.collection === 'projects' && '🚀'}
					{source.collection !== 'blog' && source.collection !== 'projects' && '📄'}
					{source.collection}
				</span>
			)}
			{relevance !== null && (
				<span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold ${
					relevance >= 90
						? 'bg-[color:var(--color-success-subtle)] text-[color:var(--color-success-dark)] dark:text-[color:var(--color-success-light)]'
						: relevance >= 75
						? 'bg-[color:var(--color-info)]/10 text-[color:var(--color-info-dark)] dark:text-[color:var(--color-info-light)]'
						: relevance >= 60
						? 'bg-[color:var(--color-accent)]/10 text-[color:var(--accent-strong)]'
						: 'bg-[color:var(--color-warning-subtle)] text-[color:var(--color-warning-dark)] dark:text-[color:var(--color-warning-light)]'
				}`}>
					<svg className="size-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
					</svg>
					{relevance}% match
				</span>
			)}
			{publishedLabel && (
				<time className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/60 px-2.5 py-0.5" dateTime={source.publishedAt ?? undefined}>
					<svg className="size-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
					</svg>
					{publishedLabel}
				</time>
			)}
			{isExternalLink && (
				<span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--surface)]/40 px-2.5 py-0.5 text-[color:var(--fg)]/50">
					External
					<svg className="size-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 5h7.06m0 0v7.06m0-7.06-8.12 8.12" />
					</svg>
				</span>
			)}
		</div>
	);
}

// ─── Source Details Component ─────────────────────────────────────────────────

function SourceDetails({
	relevanceInfo,
	snippet,
	isExpanded,
	sourceKey,
	toggleIndividualSource,
}: {
	relevanceInfo: ReturnType<typeof getRelevanceExplanation> | null;
	snippet: string;
	isExpanded: boolean;
	sourceKey: string;
	toggleIndividualSource: (key: string) => void;
}) {
	return (
		<div className="mt-2">
			{relevanceInfo && !isExpanded && (
				<div className={`flex items-start gap-2 rounded-lg border border-[color:var(--border)]/20 bg-[color:var(--surface)]/20 px-3 py-2 text-[0.65rem] ${relevanceInfo.color}`}>
					<span className="text-sm" aria-hidden="true">{relevanceInfo.icon}</span>
					<span className="flex-1 leading-relaxed">{relevanceInfo.text}</span>
				</div>
			)}

			{(snippet || relevanceInfo) && (
				<button
					type="button"
					onClick={() => toggleIndividualSource(sourceKey)}
					className="mt-1.5 inline-flex items-center gap-1 text-[0.65rem] text-[color:var(--accent)] transition hover:text-[color:var(--accent-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--accent)]/40"
				>
					<svg
						className={`size-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
						focusable="false"
					>
						<path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
					</svg>
					{isExpanded ? 'Hide details' : 'Show details'}
				</button>
			)}

			{/* Expanded Details */}
			{isExpanded && (
				<div className="mt-2 space-y-2">
					{relevanceInfo && (
						<div className={`flex items-start gap-2 rounded-lg border border-[color:var(--border)]/20 bg-[color:var(--surface)]/20 px-3 py-2 text-[0.65rem] ${relevanceInfo.color}`}>
							<span className="text-sm" aria-hidden="true">{relevanceInfo.icon}</span>
							<div className="flex-1">
								<div className="font-medium">Why this source?</div>
								<div className="mt-0.5 leading-relaxed">{relevanceInfo.text}</div>
							</div>
						</div>
					)}
					{snippet && (
						<p className="rounded-lg border border-[color:var(--border)]/20 bg-[color:var(--surface)]/30 px-3 py-2 text-xs leading-relaxed text-[color:var(--fg)]/70">
							<span className="font-medium text-[color:var(--fg)]/50">Preview: </span>
							{snippet}
						</p>
					)}
				</div>
			)}
		</div>
	);
}
