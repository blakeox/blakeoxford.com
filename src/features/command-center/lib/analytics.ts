import { trackEvent } from '../../../lib/analytics';

export type CommandCenterOpenSource = 'shortcut' | 'nav' | 'api' | 'unknown';

export type CommandCenterHandoffSource =
  'result_row' | 'ask_banner' | 'ask_tab' | 'empty_state' | 'ask_panel' | 'prefix';

export const commandCenterEvents = {
  open: (source: CommandCenterOpenSource) => trackEvent('command_center_open', { source }),

  close: () => trackEvent('command_center_close'),

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

  filterChange: (category: string) => trackEvent('command_center_filter', { category }),

  recentClick: (query_length: number) =>
    trackEvent('command_center_recent_click', { query_length }),

  suggestionClick: (source: 'empty_chip' | 'title_autocomplete' | 'destination') =>
    trackEvent('command_center_suggestion_click', { source }),

  emptyImpression: (query_length: number) => trackEvent('command_center_empty', { query_length }),

  copyLink: (kind: string) => trackEvent('command_center_copy_link', { kind }),

  tagDrillIn: (tag_length: number) => trackEvent('command_center_tag', { tag_length }),

  askHandoff: (data: {
    source: CommandCenterHandoffSource;
    query_length: number;
    item_kind?: string;
    auto_send: boolean;
  }) => trackEvent('command_center_ask_handoff', data),
};
