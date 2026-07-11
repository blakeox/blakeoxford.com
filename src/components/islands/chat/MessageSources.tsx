/**
 * MessageSources — compact source row aligned with Find/Ask overlay language.
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
import { SECTION_LABEL } from '../../../features/overlay/overlayStyles';
import type { ChatMessage, Source } from './types';

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

const chip =
	'focus-ring-interactive inline-flex max-w-full items-center truncate rounded-full border border-border/50 px-2.5 py-1 text-xxs text-muted-foreground transition hover:border-accent/40 hover:text-accent';

export const CitationLinks = memo(function CitationLinks({
	sources,
	messageId,
	handleOpenPrimarySource,
}: CitationLinksProps) {
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<span className={SECTION_LABEL}>Cited</span>
			{sources.map((source, index) => (
				<button
					key={`${messageId}-citation-${index}`}
					type="button"
					className={`${chip} border-accent/30 text-accent`}
					onClick={() => handleOpenPrimarySource(source.url)}
				>
					[{index + 1}]
				</button>
			))}
		</div>
	);
});

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
		<div className="mt-0.5 flex w-full max-w-[92%] flex-col gap-1.5 text-xs" aria-label="Referenced sources">
			<div className="flex flex-wrap items-center gap-1.5">
				<span className={SECTION_LABEL}>Sources</span>
				{primarySource?.collection ? (
					<span className="rounded-full border border-border/40 px-2 py-0.5 text-xxs capitalize text-subtle-foreground">
						{primarySource.collection}
					</span>
				) : null}
				{primarySource && primarySourceTitle ? (
					<a
						href={primarySource.url}
						target={primaryLinkTarget}
						rel={primaryLinkRel}
						className={`${chip} text-accent`}
					>
						{primarySourceTitle}
					</a>
				) : null}
				{totalSources > 1 && !showAllSources ? (
					<span className="text-xxs text-subtle-foreground">+{totalSources - 1}</span>
				) : null}
				<button
					type="button"
					className={chip}
					onClick={() => toggleExpandedSource(message.id)}
				>
					{showAllSources ? 'Hide' : totalSources > 1 ? `All ${totalSources}` : 'Details'}
				</button>
			</div>
			{showAllSources ? (
				<ExpandedSourcesList
					sources={sources}
					messageId={message.id}
					siteHostname={siteHostname}
					expandedIndividualSources={expandedIndividualSources}
					sourceRefs={sourceRefs}
					toggleIndividualSource={toggleIndividualSource}
				/>
			) : null}
		</div>
	);
});

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
		<ul className="flex flex-col gap-1.5">
			{sources.map((source, index) => {
				const sourceKey = `${messageId}-${index}`;
				const expanded = Boolean(expandedIndividualSources[sourceKey]);
				const title = decodeMimeEncodedWords(decodeHtmlEntities(source.title || source.url));
				let isExternal: boolean;
				try {
					const parsed = source.url.startsWith('http')
						? new URL(source.url)
						: new URL(source.url, `https://${siteHostname}`);
					isExternal = parsed.hostname !== siteHostname;
				} catch {
					isExternal = !source.url.startsWith('/');
				}
				const snippet = source.snippet ? cleanSnippet(source.snippet) : '';
								const relevance =
									typeof source.score === 'number' ? getRelevanceExplanation(source.score) : null;

								return (
									<li key={sourceKey} className="rounded-lg border border-border/50 bg-surface-subtle/50 px-3 py-2">
										<div className="flex items-start gap-2">
											<span className="mt-0.5 text-xxs text-subtle-foreground">[{index + 1}]</span>
											<div className="min-w-0 flex-1">
												<a
													ref={(el) => {
														if (!sourceRefs.current) return;
														if (el) sourceRefs.current[index] = el;
													}}
													href={source.url}
													target={isExternal ? '_blank' : undefined}
													rel={isExternal ? 'noreferrer' : undefined}
													className="block truncate text-sm font-medium text-accent hover:underline"
												>
													{title}
												</a>
												{relevance ? (
													<p className={`mt-0.5 text-xxs ${relevance.color}`}>{relevance.text}</p>
												) : null}
								{source.publishedAt ? (
									<p className="mt-0.5 text-xxs text-subtle-foreground">
										{formatPublishedDate(source.publishedAt)}
									</p>
								) : null}
								{snippet ? (
									<button
										type="button"
										className="mt-1 text-left text-xxs text-muted-foreground hover:text-foreground"
										onClick={() => toggleIndividualSource(sourceKey)}
									>
										{expanded ? snippet : `${snippet.slice(0, 120)}${snippet.length > 120 ? '…' : ''}`}
									</button>
								) : null}
							</div>
						</div>
					</li>
				);
			})}
		</ul>
	);
}
