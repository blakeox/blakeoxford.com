import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PhotoCarousel.astro', () => {
  const filePath = resolve(__dirname, '../../src/components/composites/PhotoCarousel.astro');
  const content = readFileSync(filePath, 'utf8');

  it('is a decorative marquee region with mobile and desktop tracks', () => {
    expect(content).toContain('role="region"');
    expect(content).toContain('aria-label="Travel and work photo gallery"');
    expect(content).toContain('photo-carousel-track--x');
    expect(content).toContain('photo-carousel-track--up');
    expect(content).toContain('photo-carousel-track--down');
    expect(content).toContain('md:hidden');
    expect(content).toContain('hidden');
    expect(content).toContain('md:flex');
  });

  it('uses authored thematic columns and seamless doubled loops', () => {
    expect(content).toContain('workImages');
    expect(content).toContain('travelImages');
    expect(content).toContain('lifeImages');
    expect(content).toMatch(/function loop/);
    expect(content).not.toContain('Math.random()');
    expect(content).not.toContain('seededShuffle');
  });

  it('pauses motion for reduced-motion, hover, and an explicit control', () => {
    expect(content).toContain('prefers-reduced-motion');
    expect(content).toContain('animation-play-state: paused');
    expect(content).toContain('data-carousel-pause');
    expect(content).toContain('data-paused');
  });

  it('does not claim prev/next controls or fake hover zoom', () => {
    expect(content).not.toMatch(/prev-btn|next-btn|carousel-controls/);
    expect(content).not.toContain('hover:scale-105');
  });
});
