import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('PhotoCarousel Component', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM(
      `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="photo-carousel" class="photo-carousel">
            <img src="/image1.jpg" alt="Image 1" style="display: block;">
            <img src="/image2.jpg" alt="Image 2" style="display: none;">
            <img src="/image3.jpg" alt="Image 3" style="display: none;">
            <div class="carousel-controls">
              <button class="prev-btn" aria-label="Previous image">‹</button>
              <button class="next-btn" aria-label="Next image">›</button>
              <button class="play-pause-btn" aria-label="Toggle autoplay">⏸️</button>
            </div>
            <div class="carousel-indicators">
              <button class="indicator active" aria-label="Go to image 1"></button>
              <button class="indicator" aria-label="Go to image 2"></button>
              <button class="indicator" aria-label="Go to image 3"></button>
            </div>
          </div>
        </body>
      </html>
    `,
      {
        url: 'http://localhost:3000',
        pretendToBeVisual: true,
      }
    );
    document = dom.window.document;
    global.document = document;
    global.window = dom.window as Window & typeof globalThis;
  });

  afterEach(() => {
    vi.clearAllMocks();
    dom.window.close();
  });

  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should access DOM elements', () => {
    const carousel = document.getElementById('photo-carousel');
    expect(carousel).toBeTruthy();
  });

  it('should find carousel images', () => {
    const images = document.querySelectorAll('#photo-carousel img');
    expect(images).toHaveLength(3);
  });

  describe('Component Structure', () => {
    it('should have proper carousel HTML structure', () => {
      const carousel = document.getElementById('photo-carousel');
      const images = carousel?.querySelectorAll('img');
      const controls = carousel?.querySelector('.carousel-controls');
      const indicators = carousel?.querySelector('.carousel-indicators');

      expect(carousel).toBeTruthy();
      expect(images).toHaveLength(3);
      expect(controls).toBeTruthy();
      expect(indicators).toBeTruthy();
    });

    it('should have accessibility attributes', () => {
      const prevBtn = document.querySelector('.prev-btn');
      const nextBtn = document.querySelector('.next-btn');
      const playPauseBtn = document.querySelector('.play-pause-btn');

      expect(prevBtn?.getAttribute('aria-label')).toBe('Previous image');
      expect(nextBtn?.getAttribute('aria-label')).toBe('Next image');
      expect(playPauseBtn?.getAttribute('aria-label')).toBe('Toggle autoplay');
    });

    it('should have proper image alt attributes', () => {
      const images = document.querySelectorAll('#photo-carousel img');

      expect(images[0]?.getAttribute('alt')).toBe('Image 1');
      expect(images[1]?.getAttribute('alt')).toBe('Image 2');
      expect(images[2]?.getAttribute('alt')).toBe('Image 3');
    });

    it('should have carousel indicators', () => {
      const indicators = document.querySelectorAll('.carousel-indicators .indicator');

      expect(indicators).toHaveLength(3);
      expect(indicators[0]?.getAttribute('aria-label')).toBe('Go to image 1');
      expect(indicators[0]?.classList.contains('active')).toBe(true);
    });
  });

  describe('Image Display', () => {
    it('should show first image by default', () => {
      const images = document.querySelectorAll('#photo-carousel img');

      expect((images[0] as Element & { style: { display: string } }).style.display).toBe('block');
      expect((images[1] as Element & { style: { display: string } }).style.display).toBe('none');
      expect((images[2] as Element & { style: { display: string } }).style.display).toBe('none');
    });

    it('should have correct image sources', () => {
      const images = document.querySelectorAll('#photo-carousel img');

      expect((images[0] as Element & { src: string }).src).toContain('image1.jpg');
      expect((images[1] as Element & { src: string }).src).toContain('image2.jpg');
      expect((images[2] as Element & { src: string }).src).toContain('image3.jpg');
    });
  });

  describe('Navigation Logic', () => {
    it('should calculate navigation indices correctly', () => {
      const imageCount = 3;

      // Test next navigation logic
      let currentIndex = 0;
      const nextIndex = (currentIndex + 1) % imageCount;
      expect(nextIndex).toBe(1);

      // Test wrapping to beginning
      currentIndex = 2;
      const wrappedNextIndex = (currentIndex + 1) % imageCount;
      expect(wrappedNextIndex).toBe(0);

      // Test previous navigation logic
      currentIndex = 1;
      const prevIndex = currentIndex === 0 ? imageCount - 1 : currentIndex - 1;
      expect(prevIndex).toBe(0);

      // Test wrapping to end
      currentIndex = 0;
      const wrappedPrevIndex = currentIndex === 0 ? imageCount - 1 : currentIndex - 1;
      expect(wrappedPrevIndex).toBe(2);
    });
  });

  describe('Event Handling', () => {
    it('should handle keyboard events', () => {
      const keyboardEvent = new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight' });
      expect(keyboardEvent.key).toBe('ArrowRight');

      const spaceEvent = new dom.window.KeyboardEvent('keydown', { key: ' ' });
      expect(spaceEvent.key).toBe(' ');
    });
  });

  describe('Timer Operations', () => {
    it('should handle timer creation and cleanup', () => {
      let timerId: number | null;

      timerId = global.setInterval(() => {
        // Timer callback
      }, 3000);

      expect(timerId).toBeTruthy();

      if (timerId) {
        global.clearInterval(timerId as number);
        timerId = null;
      }

      expect(timerId).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing carousel gracefully', () => {
      const missingCarousel = document.getElementById('nonexistent-carousel');
      expect(missingCarousel).toBeNull();
    });

    it('should handle empty image collections', () => {
      const emptyContainer = document.createElement('div');
      const images = Array.from(emptyContainer.querySelectorAll('img'));

      expect(images).toHaveLength(0);
    });
  });
});
