export const COMMAND_CENTER_OPEN = 'command-center:open';
export const COMMAND_CENTER_CLOSE = 'command-center:close';
export const COMMAND_CENTER_TOGGLE = 'command-center:toggle';

export type CommandCenterOpenDetail = {
  query?: string;
};

export function openCommandCenter(query?: string): void {
  const detail: CommandCenterOpenDetail | undefined =
    typeof query === 'string' && query.trim() ? { query: query.trim() } : undefined;
  window.dispatchEvent(new CustomEvent(COMMAND_CENTER_OPEN, { detail }));
}

export function closeCommandCenter(): void {
  window.dispatchEvent(new CustomEvent(COMMAND_CENTER_CLOSE));
}

export function toggleCommandCenter(): void {
  window.dispatchEvent(new CustomEvent(COMMAND_CENTER_TOGGLE));
}
