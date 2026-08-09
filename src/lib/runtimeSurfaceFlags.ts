/**
 * Build-time kill switches for optional interactive surfaces.
 *
 * Defaults stay enabled so a normal build preserves the public experience.
 * Operators can set the independent PUBLIC_* flag to false, 0, off, or
 * disabled to remove the surface and leave its fallback links in place.
 */
export function isRuntimeSurfaceEnabled(value: string | undefined): boolean {
  return !['0', 'false', 'off', 'disabled'].includes(value?.trim().toLowerCase() ?? '');
}

export const runtimeSurfaceFlags = {
  siteSearch: isRuntimeSurfaceEnabled(import.meta.env.PUBLIC_ENABLE_SITE_SEARCH),
  aiAssistant: isRuntimeSurfaceEnabled(import.meta.env.PUBLIC_ENABLE_AI_ASSISTANT),
  conversationPresence: import.meta.env.PUBLIC_ENABLE_CONVERSATION_PRESENCE === 'true',
} as const;
