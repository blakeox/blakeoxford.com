import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { isRuntimeSurfaceEnabled, runtimeSurfaceFlags } from '@/lib/runtimeSurfaceFlags';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('runtime interactive surfaces', () => {
  it('defaults both surfaces on and supports explicit fail-safe disable values', () => {
    expect(runtimeSurfaceFlags).toEqual({
      siteSearch: true,
      aiAssistant: true,
      conversationPresence: false,
    });
    expect(isRuntimeSurfaceEnabled(undefined)).toBe(true);
    expect(isRuntimeSurfaceEnabled('true')).toBe(true);
    for (const value of ['false', '0', 'off', 'disabled']) {
      expect(isRuntimeSurfaceEnabled(value)).toBe(false);
    }
  });

  it('keeps Search and Ask React loading event-driven', () => {
    const search = fs.readFileSync(
      path.join(root, 'src/components/features/search/SearchOverlay.astro'),
      'utf8'
    );
    const chat = fs.readFileSync(
      path.join(root, 'src/components/composites/AIChatWidget.astro'),
      'utf8'
    );

    expect(search).toContain('data-state="closed"');
    expect(search).toContain("import('@/features/command-center/commandCenterLoader')");
    expect(search).not.toContain('client:only="react"');
    expect(chat).toContain('data-ai-launcher');
    expect(chat).toContain("import('@/features/chat/chatLoader')");
    expect(chat).not.toContain('client:only="react"');
  });

  it('keeps visible fallback links behind independent kill switches', () => {
    const layout = fs.readFileSync(path.join(root, 'src/layouts/BaseLayout.astro'), 'utf8');

    expect(layout).toContain('runtimeSurfaceFlags.siteSearch');
    expect(layout).toContain('runtimeSurfaceFlags.aiAssistant');
    expect(layout).toContain('data-runtime-fallback="site-search"');
    expect(layout).toContain('data-runtime-fallback="ai-assistant"');
  });
});
