import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

// ESM __dirname shim
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../../src/components/composites/CoinFlipImage.astro');
let content: string;

describe('CoinFlipImage.astro file', () => {
  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should render responsive front/back images with srcsets and alt bindings', () => {
    // Picture sources for AVIF/WebP
    expect(content).toContain('srcset={frontAvifSet}');
    expect(content).toContain('srcset={frontWebpSet}');
    expect(content).toContain('srcset={backAvifSet}');
    expect(content).toContain('srcset={backWebpSet}');
    // Default <img> src chosen via helper for front/back
    expect(content).toContain('src={pickDefaultSrc(frontKey)}');
    expect(content).toContain('src={pickDefaultSrc(backKey)}');
    // Alt text bindings
    expect(content).toContain('alt={alt}');
    expect(content).toContain('alt={altBack}');
  });

  it('should include aria-pressed and live region for accessibility', () => {
    expect(content).toContain('aria-pressed="false"');
    expect(content).toContain('aria-live="polite"');
    expect(content).toContain("id={uniqueId + '-live'}");
  });

  it('should bind flip axis and click behavior', () => {
    expect(content).toContain('data-flip-axis={axis}');
    expect(content).toContain('data-flip-on-click={flipOnClick}');
  });

  it('should apply inline styles for transition duration and timing function', () => {
    expect(content).toContain('transition-duration:${duration}ms');
    expect(content).toContain('transition-timing-function:${ease}');
    expect(content).toContain('transition-duration:${multiFlipDuration}ms');
    expect(content).toContain('transition-timing-function:${multiEase}');
  });

  it('should be enhanced via island runtime', () => {
    expect(content).toContain('coin-flip');
  });
});
