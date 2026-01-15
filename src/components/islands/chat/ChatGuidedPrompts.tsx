/**
 * ChatGuidedPrompts component
 * Displays guided prompt suggestions for new users
 */
import { GUIDED_PROMPTS } from '../../../lib/chat';
import type { ChatGuidedPromptsProps } from './types';

export function ChatGuidedPrompts({ visible, onSelectPrompt }: ChatGuidedPromptsProps) {
	if (!visible) return null;

	return (
		<div className="border-b border-[color:var(--border)]/20 bg-[color:var(--surface-subtle)]/20 px-4 py-3 text-[0.75rem] text-[color:var(--fg)]/70">
			<div className="flex flex-col gap-0.5">
				<span className="uppercase tracking-wide text-[0.7rem] text-[color:var(--fg)]/45">Jump in</span>
				<span className="text-[color:var(--fg)]/60">Choose a suggested prompt to get a rich, sourced answer.</span>
			</div>
			<div className="mt-3 grid gap-2 sm:grid-cols-2">
				{GUIDED_PROMPTS.map((prompt) => (
					<button
						key={prompt.id}
						type="button"
						className="group flex h-full flex-col items-start gap-2 rounded-2xl border border-[color:var(--border)]/30 bg-[color:var(--surface)]/70 px-3 py-3 text-left transition hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--surface)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50"
						onClick={() => onSelectPrompt(prompt.prompt)}
						title={prompt.prompt}
					>
						<span className="inline-flex size-8 items-center justify-center rounded-full bg-[color:var(--accent)]/10 text-base">
							{prompt.icon}
						</span>
						<span className="text-sm font-semibold text-[color:var(--fg)] group-hover:text-[color:var(--accent-strong)]">{prompt.label}</span>
						<span className="text-[0.7rem] text-[color:var(--fg)]/65">{prompt.description}</span>
					</button>
				))}
			</div>
		</div>
	);
}
