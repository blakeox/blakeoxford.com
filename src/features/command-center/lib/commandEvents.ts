export const COMMAND_CENTER_OPEN = 'command-center:open';
export const COMMAND_CENTER_CLOSE = 'command-center:close';
export const COMMAND_CENTER_TOGGLE = 'command-center:toggle';

export function openCommandCenter(): void {
  window.dispatchEvent(new CustomEvent(COMMAND_CENTER_OPEN));
}

export function closeCommandCenter(): void {
  window.dispatchEvent(new CustomEvent(COMMAND_CENTER_CLOSE));
}

export function toggleCommandCenter(): void {
  window.dispatchEvent(new CustomEvent(COMMAND_CENTER_TOGGLE));
}
