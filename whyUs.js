/**
 * Why Trust Our Company Section Interactivity
 * Exact MaskContainer implementation from D:\gulf-talents\src\components\ui\svg-mask-effect.tsx
 * The pure-white circular spotlight sits at z-0 behind children.
 * Text with mix-blend-mode: difference automatically inverts over the pure-white spotlight:
 * - White text (#ffffff) XOR White (#ffffff) = Pure Black (#000000)
 * - Cyan/Blue text (#29ABE2) XOR White (#ffffff) = Vivid Orange (#d6541d)
 */

class WhyUsController {
  constructor() {
    this.container = document.getElementById('why-us');
    if (!this.container) return;

    this.maskContainer = this.container.querySelector('.why-us-mask-container');
    this.spotlightLayer = this.container.querySelector('.why-us-spotlight-layer');

    this.isHovered = false;
    this.isMobile = window.innerWidth < 640;
    this.size = 10;
    this.revealSize = 550;

    this.mousePosition = { x: -9999, y: -9999 };
    this.currentPos = { x: -9999, y: -9999 };
    this.currentSize = this.isMobile ? 0 : this.size;

    this.initResize();
    this.initMaskEffect();
    this.initScrollReveal();
  }

  initResize() {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 640;
    }, { passive: true });
  }

  initMaskEffect() {
    const el = this.maskContainer;
    if (!el || !this.spotlightLayer) return;

    const updatePosition = (clientX, clientY) => {
      const rect = el.getBoundingClientRect();
      this.mousePosition.x = clientX - rect.left;
      this.mousePosition.y = clientY - rect.top;
    };

    el.addEventListener('mousemove', (e) => {
      updatePosition(e.clientX, e.clientY);
    });

    el.addEventListener('mouseenter', (e) => {
      this.isHovered = true;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.mousePosition.x = x;
      this.mousePosition.y = y;
      // Snap position immediately on enter so it doesn't fly in from offscreen
      if (this.currentPos.x < -9000 || !this.currentPos.x) {
        this.currentPos.x = x;
        this.currentPos.y = y;
      }
    });

    el.addEventListener('mouseleave', () => {
      this.isHovered = false;
    });

    el.addEventListener('touchstart', (e) => {
      this.isHovered = true;
      if (e.touches.length > 0) {
        const rect = el.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        this.mousePosition.x = x;
        this.mousePosition.y = y;
        this.currentPos.x = x;
        this.currentPos.y = y;
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    el.addEventListener('touchend', () => {
      this.isHovered = false;
    });

    el.addEventListener('touchcancel', () => {
      this.isHovered = false;
    });

    // Smooth animation loop matching Framer Motion transitions:
    // - maskSize:     0.3s easeInOut  => lerp factor ~0.18
    // - maskPosition: 0.15s linear   => lerp factor ~0.4 (fast, near-instant tracking)
    const tick = () => {
      const actualRevealSize = this.isMobile ? this.revealSize * 0.55 : this.revealSize;
      const actualIdleSize   = this.isMobile ? 0 : this.size;
      const targetSize       = this.isHovered ? actualRevealSize : actualIdleSize;

      // Size: slow easeInOut (0.3s feel)
      this.currentSize += (targetSize - this.currentSize) * 0.18;

      // Position: fast linear tracking (0.15s feel) — only move when hovered
      if (this.isHovered) {
        this.currentPos.x += (this.mousePosition.x - this.currentPos.x) * 0.4;
        this.currentPos.y += (this.mousePosition.y - this.currentPos.y) * 0.4;
      }

      const posX    = Math.round(this.currentPos.x - this.currentSize / 2);
      const posY    = Math.round(this.currentPos.y - this.currentSize / 2);
      const sizeVal = Math.round(this.currentSize);

      const posStr  = `${posX}px ${posY}px`;
      const sizeStr = `${sizeVal}px ${sizeVal}px`;

      this.spotlightLayer.style.webkitMaskPosition = posStr;
      this.spotlightLayer.style.maskPosition       = posStr;
      this.spotlightLayer.style.webkitMaskSize     = sizeStr;
      this.spotlightLayer.style.maskSize           = sizeStr;

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  initScrollReveal() {
    const reveals = this.container.querySelectorAll('.why-us-reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach((el) => observer.observe(el));
  }
}

// Global initialization helper
function initWhyUsSection() {
  if (window.whyUsController) return;
  window.whyUsController = new WhyUsController();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWhyUsSection);
} else {
  initWhyUsSection();
}
