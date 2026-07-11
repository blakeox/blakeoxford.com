import { trackEvent } from '../../../lib/analytics';

export type CommandCenterOpenSource = 'shortcut' | 'nav' | 'api' | 'unknown';

export type CommandCenterHandoffSource =
  | 'result_row'
  | 'ask_banner'
  | 'ask_tab'
  | 'empty_state'
  | 'ask_panel'
  | 'prefix';

export const commandCenterEvents = {
  open: (source: CommandCenterOpenSource) =>
    trackEvent('command_center_open', { source }),

  close: () => trackEvent('command_center_close'),

  modeChange: (mode: 'find' | 'ask') => trackEvent('command_center_mode', { mode }),

  searchResults: (data: {
    query_length: number;
    result_count: number;
    backend: string;
    semantic_hit_count?: number;
    top_score?: number;
  }) => trackEvent('command_center_search', data),

  resultClick: (data: { kind: string; href: string }) =>
    trackEvent('command_center_result_click', {
      kind: data.kind,
      href_path: (() => {
        try {
          return new URL(data.href, window.location.origin).pathname;
        } catch {
          return data.href.slice(0, 120);
        }
      })(),
    }),

  askHandoff: (data: {
    source: CommandCenterHandoffSource;
    query_length: number;
    item_kind?: string;
    auto_send: boolean;
  }) => trackEvent('command_center_ask_handoff', data),
};
