import { SUGGESTION_CHIP, SUGGESTION_CHIP_ACCENT } from './overlayStyles';

type SuggestionChipProps = {
  label: string;
  onClick: () => void;
  accent?: boolean;
};

export function SuggestionChip({ label, onClick, accent = false }: SuggestionChipProps) {
  return (
    <button
      type="button"
      className={accent ? SUGGESTION_CHIP_ACCENT : SUGGESTION_CHIP}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
