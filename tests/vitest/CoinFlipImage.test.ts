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

  it('supports optional hover multi-spin without a striped edge layer', () => {
    expect(content).toContain("data-multi={flipMultipleTimes ? 'true' : 'false'}");
    expect(content).toContain('rotateY(900deg)');
    expect(content).not.toContain('coin-flip-edge');
    expect(content).not.toContain('repeating-linear-gradient');
  });

  it('binds interaction with a vanilla script instead of a React island', () => {
    expect(content).toContain('data-bo-coin');
    expect(content).toContain('astro:page-load');
    expect(content).not.toContain('CoinFlipClient');
    expect(content).not.toContain('client:only');
  });

  it('defers the back face and shows a flip affordance', () => {
    expect(content).toContain('loading="lazy"');
    expect(content).toContain('data-coin-back');
    expect(content).toContain('coin-flip-hint');
    expect(content).toContain('data-hint');
  });
});
