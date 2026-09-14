import { TypingDots } from './TypingDots';

export default function TypingIndicator() {
  return (
    <div className="px-4 py-2 text-sm text-muted-foreground" aria-hidden="true">
      <TypingDots label="" variant="streaming" />
      <span className="sr-only">Typing</span>
    </div>
  );
}
