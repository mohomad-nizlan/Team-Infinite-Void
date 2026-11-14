/**
 * DriftWall.js — High-performance Vanilla JS ES Module implementation
 * of the <DriftWall /> component from React Bits.
 *
 * 100% faithful to the React original with rock-solid hover stability:
 * 3D perspective plane, damped pointer parallax, smooth alternating column drift,
 * and butter-smooth tile lifting with zero jitter/shiver.
 */

export const NASA_INSIDE_ITEMS = [
  {
    image: 'https://images-assets.nasa.gov/image/jsc2026e019925/jsc2026e019925~medium.jpg',
    title: 'Mission Control SER • Houston',
    desc: 'Science Evaluation Room at Johnson Space Center',
    href: 'https://www.nasa.gov/johnson/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/jsc2025e057255/jsc2025e057255~medium.jpg',
    title: 'Artemis Flight Control Room',
    desc: 'Christopher C. Kraft Jr. Mission Control Center',
    href: 'https://www.nasa.gov/johnson/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001412/GSFC_20171208_Archive_e001412~medium.jpg',
    title: 'Goddard High-Bay Cleanroom',
    desc: 'JWST Optical Telescope assembly fixture & crane',
    href: 'https://www.nasa.gov/goddard/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/PIA26169/PIA26169~medium.jpg',
    title: 'JPL Spacecraft Cleanroom',
    desc: 'CADRE Autonomous Rover assembly at Pasadena',
    href: 'https://www.jpl.nasa.gov/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/52234055969_a34da4ec30_o/52234055969_a34da4ec30_o~medium.jpg',
    title: 'Neutral Buoyancy Lab Suit-Up',
    desc: 'Astronaut EVA spacesuit prep at the 6.2M-gallon pool',
    href: 'https://www.nasa.gov/johnson/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/CEB_0283/CEB_0283~medium.jpg',
    title: 'Marshall Twin Control Rooms',
    desc: 'LUCA & LESA Lunar Lander operations consoles',
    href: 'https://www.nasa.gov/marshall/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/GRC-2016-C-02363/GRC-2016-C-02363~medium.jpg',
    title: 'Ultra-High Vacuum Chamber',
    desc: '500°C Venus environment testing at NASA Glenn',
    href: 'https://www.nasa.gov/glenn/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/KSC-20170511-PH_LCH01_0040/KSC-20170511-PH_LCH01_0040~medium.jpg',
    title: 'Armstrong O&C High Bay',
    desc: 'Orion crew module cleanroom integration at Kennedy',
    href: 'https://www.nasa.gov/kennedy/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/PIA26584/PIA26584~medium.jpg',
    title: 'High Bay 1 Cleanroom • JPL',
    desc: 'NEO Surveyor asteroid hunter telescope assembly',
    href: 'https://www.jpl.nasa.gov/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/jsc2026e021212/jsc2026e021212~medium.jpg',
    title: 'White Flight Control Consoles',
    desc: 'Senior Science Officer consoles at Mission Control',
    href: 'https://www.nasa.gov/johnson/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/0700060/0700060~medium.jpg',
    title: 'NBL Deep Training Tank',
    desc: 'Astronauts submerged with full-scale ISS modules',
    href: 'https://www.nasa.gov/johnson/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/EC94-42878-1/EC94-42878-1~medium.jpg',
    title: 'Dryden Blue Mission Control',
    desc: 'Western Aeronautical Test Range telemetry station',
    href: 'https://www.nasa.gov/armstrong/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/PIA22201/PIA22201~medium.jpg',
    title: 'InSight Mars Cleanroom Bay',
    desc: 'Solar array illumination & deployment verification',
    href: 'https://www.jpl.nasa.gov/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/jsc2025e070712/jsc2025e070712~medium.jpg',
    title: 'Orion Evaluation Room (MER)',
    desc: 'Flight simulation & deep space telemetry monitoring',
    href: 'https://www.nasa.gov/johnson/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000156/GSFC_20171208_Archive_e000156~medium.jpg',
    title: 'Webb Clean Tent Transporter',
    desc: 'Cleanroom transit canopy at NASA Goddard',
    href: 'https://www.nasa.gov/goddard/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/jsc2025e077817/jsc2025e077817~medium.jpg',
    title: 'AxEMU Lunar Spacesuit Lab',
    desc: 'Dual next-gen Artemis suit runs in Houston waters',
    href: 'https://www.nasa.gov/johnson/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/GRC-1968-C-02344/GRC-1968-C-02344~medium.jpg',
    title: 'Zero-G Drop Tower Facility',
    desc: '450-foot microgravity vacuum shaft cleanroom',
    href: 'https://www.nasa.gov/glenn/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/jsc2018e093536/jsc2018e093536~medium.jpg',
    title: 'EVA Simulation Chamber',
    desc: 'Commercial crew spacewalk training at JSC',
    href: 'https://www.nasa.gov/johnson/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/CEB_0257/CEB_0257~medium.jpg',
    title: 'Huntsville Operations Center',
    desc: 'Real-time telemetry consoles at NASA Marshall',
    href: 'https://www.nasa.gov/marshall/'
  },
  {
    image: 'https://images-assets.nasa.gov/image/jsc2025e085695/jsc2025e085695~medium.jpg',
    title: 'Subaquatic Regolith Testbed',
    desc: 'Simulated lunar surface training at NBL Houston',
    href: 'https://www.nasa.gov/johnson/'
  }
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const columnFactor = (index, variance) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

export class VanillaDriftWall {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) return;

    this.items = options.items || NASA_INSIDE_ITEMS;
    this.columns = options.columns ?? 5;
    this.tileWidth = options.tileWidth ?? 220;
    this.tileHeight = options.tileHeight ?? 144;
    this.gap = options.gap ?? 18;
    this.radius = options.radius ?? 14;
    this.tilt = options.tilt ?? 16;
    this.turn = options.turn ?? -14;
    this.roll = options.roll ?? 0;
    this.perspective = options.perspective ?? 1200;
    this.depth = options.depth ?? 120;
    this.speed = options.speed ?? 38;
    this.direction = options.direction ?? 'up';
    this.variance = options.variance ?? 0.45;
    this.parallax = options.parallax ?? 0.65;
    this.pauseOnHover = options.pauseOnHover ?? true; // Smooth pausing on hover eliminates cursor slip
    this.lift = options.lift ?? 66;
    this.fade = options.fade ?? 0.6;
    this.dim = options.dim ?? 0.55;
    this.grayscale = options.grayscale ?? false;
    this.overlayColor = options.overlayColor ?? '#060010';

    this.containerHeight = this.container.clientHeight || 600;
    this.reduced = prefersReducedMotion();

    this.plane = null;
    this.trackEls = [];
    this.offsets = [];
    this.velocities = [];
    this.baseVelocities = [];
    this.columnMeta = [];
    this.columnItems = [];

    this.hoveredCol = -1;
    this.wallHovered = false;
    this.pointer = { x: 0, y: 0 };
    this.pointerDamped = { x: 0, y: 0 };
    this.lastTs = null;
    this.rafId = null;
    this.activeId = null;

    this.init();
  }

  init() {
    this.applyCssVars();
    this.buildColumns();
    this.render();
    this.bindEvents();
    this.startAnimation();
  }

  applyCssVars() {
    this.container.classList.add('drift-wall');
    if (this.reduced) this.container.classList.add('drift-wall--reduced');
    this.container.setAttribute('role', 'group');
    this.container.setAttribute('aria-label', 'Drifting wall of NASA facility tiles');

    const vars = {
      '--dw-tile-w': `${this.tileWidth}px`,
      '--dw-tile-h': `${this.tileHeight}px`,
      '--dw-gap': `${this.gap}px`,
      '--dw-radius': `${this.radius}px`,
      '--dw-perspective': `${this.perspective}px`,
      '--dw-lift': `${this.lift}px`,
      '--dw-dim': this.dim,
      '--dw-gray': this.grayscale ? 1 : 0,
      '--dw-overlay': this.overlayColor,
      '--dw-edge': `${Math.max(0, (1 - this.fade) * 100)}%`
    };

    for (const [key, val] of Object.entries(vars)) {
      this.container.style.setProperty(key, val);
    }
  }

  buildColumns() {
    const cols = Array.from({ length: this.columns }, () => []);
    this.items.forEach((item, i) => cols[i % this.columns].push(item));
    this.columnItems = cols.map(col => (col.length ? col : this.items.slice(0, 1)));

    const unit = this.tileHeight + this.gap;
    this.columnMeta = this.columnItems.map(col => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(2, Math.ceil((this.containerHeight * 1.6) / copyHeight) + 1);
      return { copyHeight, copies };
    });

    const dirSign = this.direction === 'up' ? 1 : -1;
    this.baseVelocities = this.columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return this.speed * columnFactor(c, this.variance) * dirSign * altSign;
    });

    this.offsets = this.columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
    this.velocities = this.columnItems.map(() => 0);
  }

  render() {
    this.container.innerHTML = '';

    const plane = document.createElement('div');
    plane.className = 'drift-wall__plane';
    this.plane = plane;

    this.trackEls = [];

    this.columnItems.forEach((col, c) => {
      const meta = this.columnMeta[c];
      const colEl = document.createElement('div');
      colEl.className = 'drift-wall__col';

      const trackEl = document.createElement('div');
      trackEl.className = 'drift-wall__track';

      for (let copyIndex = 0; copyIndex < meta.copies; copyIndex++) {
        col.forEach((item, itemIndex) => {
          const tileId = `${c}-${copyIndex}-${itemIndex}`;
          const tileEl = this.createTileElement(item, tileId, c);
          trackEl.appendChild(tileEl);
        });
      }

      colEl.appendChild(trackEl);
      plane.appendChild(colEl);
      this.trackEls.push(trackEl);
    });

    this.container.appendChild(plane);
  }

  createTileElement(item, id, colIndex) {
    const isAnchor = Boolean(item.href);
    const tile = document.createElement(isAnchor ? 'a' : 'div');
    tile.className = 'drift-wall__tile';
    tile.setAttribute('data-tile-id', id);
    tile.setAttribute('data-col', colIndex);
    tile.setAttribute('tabindex', '0');

    if (isAnchor) {
      tile.href = item.href;
      tile.target = '_blank';
      tile.rel = 'noreferrer noopener';
    } else {
      tile.setAttribute('role', 'button');
      tile.setAttribute('aria-label', item.title || 'NASA Facility');
    }

    const inner = document.createElement('span');
    inner.className = 'drift-wall__inner';

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title || 'NASA Facility';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    img.onerror = () => {
      img.style.display = 'none';
      inner.style.background = 'linear-gradient(135deg, #0b1120 0%, #172554 100%)';
    };

    const overlay = document.createElement('span');
    overlay.className = 'drift-wall__overlay';
    overlay.setAttribute('aria-hidden', 'true');

    inner.appendChild(img);
    inner.appendChild(overlay);

    if (item.title) {
      const caption = document.createElement('span');
      caption.className = 'drift-wall__caption';
      caption.textContent = item.title;
      inner.appendChild(caption);
    }

    tile.appendChild(inner);

    // Direct element hover tracking — 100% immune to 3D raycast misses and oscillation!
    tile.addEventListener('pointerenter', () => {
      this.activate(id, colIndex);
    });

    tile.addEventListener('pointerleave', (e) => {
      const toEl = e.relatedTarget;
      // Only release if the pointer leaves to something that is NOT another tile
      if (!toEl || !toEl.closest || !toEl.closest('[data-tile-id]')) {
        this.release();
      }
    });

    tile.addEventListener('focus', () => this.activate(id, colIndex));
    tile.addEventListener('blur', () => this.release());

    return tile;
  }

  applyPlaneTransform(px, py) {
    if (!this.plane) return;
    this.plane.style.transform =
      `translate(-50%, -50%) scale(1.18) ` +
      `rotateX(${this.tilt + py}deg) rotateY(${this.turn + px}deg) rotateZ(${this.roll}deg) ` +
      `translateZ(${-this.depth}px)`;
  }

  startAnimation() {
    const animate = (ts) => {
      if (this.lastTs === null) this.lastTs = ts;
      const dt = Math.min(0.05, Math.max(0, ts - this.lastTs) / 1000);
      this.lastTs = ts;

      const maxTilt = this.parallax * 8;
      const targetX = this.pointer.x * maxTilt;
      const targetY = -this.pointer.y * maxTilt;
      const damp = 1 - Math.exp(-dt / 0.12);
      this.pointerDamped.x += (targetX - this.pointerDamped.x) * damp;
      this.pointerDamped.y += (targetY - this.pointerDamped.y) * damp;
      this.applyPlaneTransform(this.pointerDamped.x, this.pointerDamped.y);

      if (!this.reduced) {
        for (let c = 0; c < this.trackEls.length; c++) {
          const meta = this.columnMeta[c];
          if (!meta) continue;

          // Smooth pause on hover prevents tiles from sliding away while inspecting
          const paused = this.wallHovered && this.pauseOnHover;
          const factor = paused ? 0 : (this.hoveredCol === c ? 0 : 1);
          const target = this.baseVelocities[c] * factor;

          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.28 : 0.35));
          this.velocities[c] += (target - this.velocities[c]) * ease;
          let next = (this.offsets[c] ?? 0) + this.velocities[c] * dt;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          this.offsets[c] = next;

          const el = this.trackEls[c];
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
        }
      } else {
        for (let c = 0; c < this.trackEls.length; c++) {
          const el = this.trackEls[c];
          if (el) el.style.transform = `translate3d(0, ${-(this.offsets[c] ?? 0)}px, 0)`;
        }
      }

      this.rafId = requestAnimationFrame(animate);
    };

    this.rafId = requestAnimationFrame(animate);
  }

  activate(id, index) {
    if (this.activeId === id) return;
    this.release();
    this.activeId = id;
    this.hoveredCol = index;

    const targetTile = this.container.querySelector(`[data-tile-id="${id}"]`);
    if (targetTile) targetTile.classList.add('is-active');
  }

  release() {
    if (this.activeId) {
      const prevTile = this.container.querySelector(`[data-tile-id="${this.activeId}"]`);
      if (prevTile) prevTile.classList.remove('is-active');
    }
    this.activeId = null;
    this.hoveredCol = -1;
  }

  bindEvents() {
    this.onPointerMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      if (!rect) return;

      if (this.parallax > 0 && !this.reduced) {
        this.pointer = {
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5
        };
      }
      // Note: No elementFromPoint calling here. Tile-level pointerenter handles hover without jitter!
    };

    this.onPointerEnter = () => {
      this.wallHovered = true;
    };

    this.onPointerLeave = () => {
      this.wallHovered = false;
      this.pointer = { x: 0, y: 0 };
      this.release();
    };

    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerenter', this.onPointerEnter);
    this.container.addEventListener('pointerleave', this.onPointerLeave);

    // ResizeObserver
    this.ro = new ResizeObserver(([entry]) => {
      const newHeight = entry.contentRect.height || 600;
      if (Math.abs(newHeight - this.containerHeight) > 50) {
        this.containerHeight = newHeight;
        this.buildColumns();
        this.render();
      }
    });
    this.ro.observe(this.container);

    // Reduced motion media query
    this.mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onMqChange = (e) => {
      this.reduced = e.matches;
      this.container.classList.toggle('drift-wall--reduced', this.reduced);
    };
    this.mq.addEventListener('change', this.onMqChange);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.ro) this.ro.disconnect();
    if (this.mq) this.mq.removeEventListener('change', this.onMqChange);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerenter', this.onPointerEnter);
    this.container.removeEventListener('pointerleave', this.onPointerLeave);
  }
}
