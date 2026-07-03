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
    trackEvent('Command Center Open', { source }),

  close: () => trackEvent('Command Center Close'),

  modeChange: (mode: 'find' | 'ask') => trackEvent('Command Center Mode', { mode }),

  searchResults: (data: {
    query_length: number;
    result_count: number;
    backend: string;
  }) => trackEvent('Command Center Search', data),

  resultClick: (data: { kind: string; href: string }) =>
    trackEvent('Command Center Result Click', data),

  askHandoff: (data: {
    source: CommandCenterHandoffSource;
    query_length: number;
    item_kind?: string;
    auto_send: boolean;
  }) => trackEvent('Command Center Ask Handoff', data),
};
