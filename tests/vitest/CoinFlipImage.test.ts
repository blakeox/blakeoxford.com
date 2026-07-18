import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../../src/components/composites/CoinFlipImage.astro');
let content: string;

describe('CoinFlipImage.astro', () => {
  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('renders responsive front/back pictures with srcsets and alt bindings', () => {
    expect(content).toContain('srcset={frontAvifSet}');
    expect(content).toContain('srcset={frontWebpSet}');
    expect(content).toContain('srcset={backAvifSet}');
    expect(content).toContain('srcset={backWebpSet}');
    expect(content).toContain('src={pickDefaultSrc(frontKey)}');
    expect(content).toContain('src={pickDefaultSrc(backKey)}');
    expect(content).toContain('alt={alt}');
    expect(content).toContain('alt={altBack}');
  });

  it('drives flip state via data-flipped and announces via live region', () => {
    expect(content).toContain('data-flipped="false"');
    expect(content).toContain('aria-pressed="false"');
    expect(content).toContain('aria-live="polite"');
    expect(content).toContain('data-flip-axis={axis}');
    expect(content).toContain('data-flip-on-click');
  });

  it('uses CSS custom properties for motion timing instead of inline transform', () => {
    expect(content).toContain('--coin-duration');
    expect(content).toContain('--coin-multi-duration');
    expect(content).not.toContain('transition-duration:${duration}ms');
  });

  it('mounts the client island for click toggling', () => {
    expect(content).toContain('CoinFlipClient');
    expect(content).toContain('client:only="react"');
  });
});
