import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeAll } from 'vitest';

// ESM __dirname shim
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../../src/components/CoinFlipImage.astro');
let content: string;

describe('CoinFlipImage.astro file', () => {
  beforeAll(() => {
    content = fs.readFileSync(filePath, 'utf-8');
  });

  it('should render dynamic front and back image src and alt bindings', () => {
    expect(content).toContain('src={frontSrc}');
    expect(content).toContain('alt={alt}');
    expect(content).toContain('src={backSrc}');
    expect(content).toContain('alt={altBack}');
  });

  it('should include aria-pressed and live region for accessibility', () => {
    expect(content).toContain('aria-pressed="false"');
    expect(content).toContain('aria-live="polite"');
    expect(content).toContain('id={uniqueId + \'-live\'}');
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

  it('should attach keyboard and click event listeners in script', () => {
    expect(content).toContain("root.addEventListener('keydown'");
    expect(content).toContain("root.addEventListener('click'");
    expect(content).toContain("root.addEventListener('blur'");
  });
});
