/**
 * Folder.js — High-performance Vanilla JS ES Module implementation
 * of the <Folder /> component from React Bits.
 *
 * Provides buttery-smooth 3D flap & book modes, spring-damped physics,
 * pointer tilt parallax, interactive document zoom, and drag-and-drop.
 */

const TAU = Math.PI * 2;
const STEP = 1 / 240;
const MAX_ITEMS = 6;

const PILE_TURN = [0.5, -1.1, 1.5, -0.7, 1.2, -1.6];
const BOOK_REST = [
  { x: 0.14, y: -0.004, r: 1.4 },
  { x: 0.115, y: 0.008, r: -1.1 },
  { x: 0.09, y: 0, r: 0.6 }
];
const BOOK_PEEK = [
  { x: 0.27, y: -0.016, r: 4.5 },
  { x: 0.2, y: 0.014, r: 1.2 },
  { x: 0.14, y: 0, r: -1.2 }
];
const FLAP_REST = [
  { x: 0.16, rise: 0, r: 3 },
  { x: -0.17, rise: 0.05, r: -3.5 },
  { x: 0, rise: 0.1, r: 0.5 },
  { x: 0.25, rise: 0.08, r: 5 },
  { x: -0.25, rise: 0.09, r: -5.5 },
  { x: 0.08, rise: 0.12, r: 1.5 }
];
const SPREAD_TURN = [4, -5, 3, -6, 5, -3];
const SPREAD_DROP = [0.03, -0.04, 0.05, -0.02, 0.04, -0.05];
const DROP_TURN = [-6, 4, -3, 7, -5, 3];
const BOOK_ANGLES = { open: -180, receive: -24, peek: -13, rest: 0 };
const FLAP_ANGLES = { open: -64, receive: -30, peek: -15, rest: 0 };
const LAYERS = { out: 50, drag: 80, focus: 90 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseColor = (() => {
  let context = null;
  const cache = new Map();
  return (value, fallback = [255, 255, 255]) => {
    if (!value) return fallback;
    const key = String(value);
    if (cache.has(key)) return cache.get(key);
    let rgb = fallback;
    if (typeof document !== 'undefined') {
      context ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      if (context) {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = '#ffffff';
        context.fillStyle = key;
        context.fillRect(0, 0, 1, 1);
        rgb = Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
      }
    }
    cache.set(key, rgb);
    return rgb;
  };
})();

const mixRgb = (rgb, target, amount) => rgb.map((channel, i) => Math.round(channel + (target[i] - channel) * amount));
const rgbString = rgb => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
const luma = rgb => (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;

const multiply = (a, b) => {
  const out = new Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        a[row] * b[col * 4] + a[4 + row] * b[col * 4 + 1] + a[8 + row] * b[col * 4 + 2] + a[12 + row] * b[col * 4 + 3];
    }
  }
  return out;
};

const chain = (...list) => list.reduce(multiply);
const move = (x, y, z = 0) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
const stretch = (x, y) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const turnX = degrees => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
};

const turnY = degrees => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
};

const turnZ = degrees => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};

const toCss = m => `matrix3d(${m.map(v => (Math.abs(v) < 1e-7 ? 0 : Number(v.toFixed(6)))).join(', ')})`;

const measureFolder = (book, scale, labelWidth, hasLabel, tabPosition) => {
  const w = (book ? 180 : 224) * scale;
  const h = (book ? 232 : 176) * scale;
  const tabH = 20 * scale;
  const r = 12 * scale;
  const shoulder = tabH * 0.75;
  const frontTop = book ? tabH : tabH + h * 0.3;
  const corners = book ? [0, r, r, 0] : [r, r, r, r];
  const maxTab = w - corners[0] - corners[1] - shoulder * 2 - 10 * scale;
  const tabW = clamp(hasLabel ? labelWidth + 14 * scale + shoulder : w * 0.34, Math.min(w * 0.3, maxTab), maxTab);
  const tabX =
    tabPosition === 'left'
      ? corners[0] + 5 * scale + shoulder
      : tabPosition === 'center'
        ? (w - tabW) / 2
        : w - corners[1] - 5 * scale - shoulder - tabW;
  const docW = book ? w * 0.82 : w * 0.82;
  return {
    book,
    scale,
    w,
    h,
    tabH,
    r,
    shoulder,
    corners,
    tabW,
    tabX,
    frontTop,
    frontH: tabH + h - frontTop,
    docW,
    docH: docW * (book ? 1.28 : 1.25)
  };
};

const backPath = g => {
  const { w, h, tabX, tabW, tabH, shoulder } = g;
  const [tl, tr, br, bl] = g.corners;
  const top = tabH;
  const bottom = tabH + h;
  return [
    `M 0 ${top + tl}`,
    `Q 0 ${top} ${tl} ${top}`,
    `L ${tabX - shoulder} ${top}`,
    `C ${tabX} ${top} ${tabX} 0 ${tabX + shoulder} 0`,
    `L ${tabX + tabW - shoulder} 0`,
    `C ${tabX + tabW} 0 ${tabX + tabW} ${top} ${tabX + tabW + shoulder} ${top}`,
    `L ${w - tr} ${top}`,
    `Q ${w} ${top} ${w} ${top + tr}`,
    `L ${w} ${bottom - br}`,
    `Q ${w} ${bottom} ${w - br} ${bottom}`,
    `L ${bl} ${bottom}`,
    `Q 0 ${bottom} 0 ${bottom - bl}`,
    'Z'
  ].join(' ');
};

const placeFlap = (rank, count, phase, layout, g, pointer) => {
  const rest = FLAP_REST[rank] ?? FLAP_REST[FLAP_REST.length - 1];
  const floor = g.tabH + g.h - 5 * g.scale - g.docH / 2;
  const mid = (count - 1) / 2;
  if (phase === 'open') {
    const lift = -g.h * 0.32;
    if (count === 1) {
      return {
        x: g.w / 2,
        y: lift,
        z: 15,
        r: 0,
        ry: 0,
        s: 1.08
      };
    }
    // Symmetrical 3-file fan out: rank 0 (left), rank 1 (center), rank 2 (right)
    const t = count > 1 ? (rank - mid) / (mid || 1) : 0;
    const offset = t * (g.docW * 0.44);
    const tilt = t * 6;
    return {
      x: g.w / 2 + offset,
      y: lift + Math.abs(t) * 4 * g.scale,
      z: rank * 8 + 10,
      r: tilt,
      ry: 0,
      s: 1.04
    };
  }
  const part = phase === 'receive' ? 1.7 : phase === 'peek' ? 1.3 : 1;
  const x = g.w / 2 + rest.x * g.w * part;
  if (phase === 'rest') return { x, y: floor - rest.rise * g.h, z: 0, r: rest.r, ry: 0, s: 1 };
  const near = phase === 'peek' && pointer != null ? Math.max(0, 1 - Math.abs(pointer - x) / (g.w * 0.32)) : 0;
  const rise = rest.rise + (phase === 'receive' ? 0.03 : 0.1);
  return { x, y: floor - rise * g.h - near * near * g.h * 0.09, z: 0, r: rest.r * 1.6, ry: 0, s: 1 };
};

const placeBook = (rank, count, phase, layout, g) => {
  const pileX = g.w / 2;
  const pileY = g.frontTop + g.frontH / 2;
  if (phase === 'open') {
    if (layout === 'row') {
      const gap = 10 * g.scale;
      const fit = Math.min(0.8, (g.w * 1.86 - gap * (count - 1)) / (count * g.docW));
      const step = g.docW * fit + gap;
      return { x: g.w / 2 + (rank - (count - 1) / 2) * step, y: pileY, z: 0, r: 0, ry: 0, s: fit };
    }
    if (layout === 'stack') {
      const fit = 0.74;
      const strip = Math.min(26 * g.scale, (g.h * 0.36) / Math.max(1, count - 1));
      const top = g.frontTop + 14 * g.scale + (count - 1) * strip;
      return { x: g.w, y: top + (g.docH * fit) / 2 - rank * strip, z: 0, r: 0, ry: 0, s: fit };
    }
    const fit = count > 4 ? 0.58 : count > 3 ? 0.64 : 0.72;
    const span = count === 2 ? g.w : Math.min(g.w * 1.3, g.w * 0.6 * (count - 1));
    const x = count > 1 ? span / 2 - (rank * span) / (count - 1) : g.w * 0.5;
    return { x: g.w / 2 + x, y: pileY + SPREAD_DROP[rank] * g.h, z: 0, r: SPREAD_TURN[rank], ry: 0, s: fit };
  }
  const offsets = phase === 'rest' ? BOOK_REST : BOOK_PEEK;
  const offset = offsets[rank] ?? { x: 0.06, y: 0, r: PILE_TURN[rank] ?? 0 };
  return {
    x: pileX + offset.x * g.w,
    y: pileY + offset.y * g.h + rank * 0.8 * g.scale,
    z: 0,
    r: offset.r,
    ry: 0,
    s: 1
  };
};

/**
 * VanillaFolder — High-performance Vanilla JS ES Module implementation
 */
export class VanillaFolder {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) return;

    this.options = Object.assign(
      {
        items: [],
        label: 'RESEARCH',
        color: '#3d8bff',
        paperColor: '#ffffff',
        mode: 'flap',
        variant: 'glass',
        layout: 'spread',
        size: 0.68,
        openOn: 'click',
        defaultOpen: false,
        draggable: true,
        zoomOnClick: true,
        peek: true,
        intro: false,
        tilt: 0.2,
        bounce: 0.15,
        speed: 1.2,
        frost: 0.25,
        closeOnOutsideClick: true,
        theme: 'dark',
        className: ''
      },
      options
    );

    this.isOpen = Boolean(this.options.defaultOpen);
    this.items = (this.options.items || []).slice(0, MAX_ITEMS);
    this.count = this.items.length;
    this.scale = Math.max(0.3, Number(this.options.size) || 1);
    this.book = this.options.mode === 'book';

    this.initDOM();
    this.initPhysics();
  }

  initDOM() {
    const { label, color, paperColor, tabPosition, variant, theme, draggable, className } = this.options;
    const rgb = parseColor(color, [61, 139, 255]);
    const paper = parseColor(paperColor, [255, 255, 255]);
    const backTone = mixRgb(rgb, [0, 0, 0], 0.16);
    const insideTop = rgbString(mixRgb(rgb, [0, 0, 0], 0.08));
    const insideBottom = rgbString(backTone);

    // Initial label measurement approximation
    const approxLabelWidth = label ? label.length * 8 * this.scale : 0;
    this.g = measureFolder(this.book, this.scale, approxLabelWidth, Boolean(label), tabPosition);
    const total = this.g.tabH + this.g.h;
    const shape = backPath(this.g);

    // Create root element
    this.root = document.createElement('div');
    this.root.className = `folder-root ${className}`.trim();
    this.root.setAttribute('data-mode', this.book ? 'book' : 'flap');
    this.root.setAttribute('data-variant', variant);
    this.root.setAttribute('data-theme', theme);
    if (draggable) this.root.setAttribute('data-draggable', '');
    if (this.isOpen) this.root.setAttribute('data-open', '');

    // CSS variables
    const vars = {
      '--folder-rgb': rgb.join(', '),
      '--folder-base': rgbString(rgb),
      '--folder-front-top': rgbString(mixRgb(rgb, [255, 255, 255], 0.12)),
      '--folder-front-bottom': rgbString(mixRgb(rgb, [0, 0, 0], 0.06)),
      '--folder-inside-top': insideTop,
      '--folder-inside-bottom': insideBottom,
      '--folder-tab-ink': luma(backTone) > 0.6 ? 'rgba(0, 0, 0, 0.72)' : 'rgba(255, 255, 255, 0.92)',
      '--folder-paper': rgbString(paper),
      '--folder-paper-ink': rgbString(mixRgb(paper, [0, 0, 0], 0.11)),
      '--folder-paper-ink-strong': rgbString(mixRgb(paper, [0, 0, 0], 0.28)),
      '--folder-paper-text': rgbString(mixRgb(paper, [0, 0, 0], 0.72)),
      '--folder-w': `${this.g.w}px`,
      '--folder-h': `${this.g.h}px`,
      '--folder-tab-h': `${this.g.tabH}px`,
      '--folder-front-y': `${this.g.frontTop}px`,
      '--folder-front-h': `${this.g.frontH}px`,
      '--folder-r': `${this.g.r}px`,
      '--folder-front-radius': this.book ? `0 ${this.g.r}px ${this.g.r}px 0` : `${this.g.r}px`,
      '--folder-doc-w': `${this.g.docW}px`,
      '--folder-doc-h': `${this.g.docH}px`,
      '--folder-frost': `${(1.5 + clamp(this.options.frost, 0, 1) * 10) * this.scale}px`,
      '--folder-depth': `${Math.round(Math.max(this.g.w, this.g.h) * 5)}px`,
      '--folder-scale': this.scale
    };
    Object.entries(vars).forEach(([k, v]) => this.root.style.setProperty(k, v));

    // Stage
    this.stage = document.createElement('div');
    this.stage.className = 'folder-stage';
    this.stage.setAttribute('role', 'button');
    this.stage.setAttribute('tabindex', '0');
    this.stage.setAttribute('aria-expanded', String(this.isOpen));
    this.stage.setAttribute('aria-label', label ? `${label} folder` : 'Folder');

    // Ground layer
    this.groundRef = document.createElement('span');
    this.groundRef.className = 'folder-layer folder-ground';
    this.groundRef.setAttribute('aria-hidden', 'true');
    this.stage.appendChild(this.groundRef);

    if (this.book) {
      this.castRef = document.createElement('span');
      this.castRef.className = 'folder-layer folder-cast';
      this.castRef.setAttribute('aria-hidden', 'true');
      this.stage.appendChild(this.castRef);
    }

    // Back layer
    this.backRef = document.createElement('div');
    this.backRef.className = 'folder-layer folder-back';
    this.backRef.setAttribute('aria-hidden', 'true');

    const backFill = document.createElement('div');
    backFill.className = 'folder-back-fill';
    backFill.style.clipPath = `path('${shape}')`;
    if (this.book) {
      const gutter = document.createElement('span');
      gutter.className = 'folder-gutter';
      backFill.appendChild(gutter);
    }
    this.backRef.appendChild(backFill);

    const backRim = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    backRim.setAttribute('class', 'folder-back-rim');
    backRim.setAttribute('width', String(this.g.w));
    backRim.setAttribute('height', String(total));
    backRim.setAttribute('viewBox', `0 0 ${this.g.w} ${total}`);
    const focusPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    focusPath.setAttribute('class', 'folder-focus');
    focusPath.setAttribute('d', shape);
    backRim.appendChild(focusPath);
    this.backRef.appendChild(backRim);

    if (label) {
      this.tabLabel = document.createElement('span');
      this.tabLabel.className = 'folder-tab-text';
      this.tabLabel.style.left = `${this.g.tabX}px`;
      this.tabLabel.style.width = `${this.g.tabW}px`;
      this.tabLabel.textContent = label;
      this.backRef.appendChild(this.tabLabel);
    }
    this.stage.appendChild(this.backRef);

    // Items (Documents)
    this.itemRefs = [];
    this.items.forEach((item, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'folder-layer folder-item';
      itemEl.setAttribute('data-folder-item', String(index));
      itemEl.setAttribute('tabindex', '-1');

      if (typeof item === 'object' && item.image) {
        itemEl.innerHTML = `
          <div class="folder-photo">
            <img src="${item.image}" alt="${item.alt || item.title || ''}" draggable="false" />
          </div>
        `;
      } else {
        const title = typeof item === 'object' ? item.title || '' : String(item);
        const desc = typeof item === 'object' ? item.description || '' : '';
        const url = typeof item === 'object' ? item.url || '' : '';
        const tag = typeof item === 'object' ? item.tag || 'NASA ARCHIVE' : 'NASA ARCHIVE';

        itemEl.innerHTML = `
          <div class="folder-doc">
            ${title ? `<span class="folder-doc-title">${title}</span>` : `<span class="folder-doc-heading"></span>`}
            ${desc ? `<span class="folder-doc-text">${desc}</span>` : ''}
            <span class="folder-doc-line" style="width: 92%;"></span>
            <span class="folder-doc-line" style="width: 84%;"></span>
            <span class="folder-doc-line" style="width: 88%;"></span>
            <span class="folder-doc-block"></span>
            <span class="folder-doc-line" style="width: 80%;"></span>
            <span class="folder-doc-line" style="width: 62%;"></span>
          </div>
        `;

        if (url) {
          itemEl.style.cursor = 'pointer';
          itemEl.setAttribute('title', `Click to open citation: ${title}`);
        }
      }

      this.stage.appendChild(itemEl);
      this.itemRefs.push(itemEl);
    });

    if (this.book) {
      this.shadeRef = document.createElement('span');
      this.shadeRef.className = 'folder-layer folder-shade';
      this.shadeRef.setAttribute('aria-hidden', 'true');
      this.stage.appendChild(this.shadeRef);
    }

    // Front flap layer
    this.frontRef = document.createElement('div');
    this.frontRef.className = 'folder-layer folder-front';
    this.frontRef.setAttribute('data-face', 'outer');
    this.frontRef.setAttribute('aria-hidden', 'true');

    const faceOuter = document.createElement('div');
    faceOuter.className = 'folder-face folder-face-outer';
    this.frontRef.appendChild(faceOuter);

    if (this.book) {
      const faceInner = document.createElement('div');
      faceInner.className = 'folder-face folder-face-inner';
      const innerGutter = document.createElement('span');
      innerGutter.className = 'folder-inner-gutter';
      faceInner.appendChild(innerGutter);
      this.frontRef.appendChild(faceInner);
    }
    this.stage.appendChild(this.frontRef);

    // Measure element for tab text
    if (label) {
      this.measureRef = document.createElement('span');
      this.measureRef.className = 'folder-tab-text folder-measure';
      this.measureRef.setAttribute('aria-hidden', 'true');
      this.measureRef.textContent = label;
      this.root.appendChild(this.measureRef);
    }

    this.root.appendChild(this.stage);
    this.container.appendChild(this.root);
  }

  initPhysics() {
    const root = this.root;
    const stage = this.stage;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const spring = value => ({ value, velocity: 0 });
    const integrate = (item, target, omega, zeta, dt) => {
      const k = omega * omega;
      const d = 2 * zeta * omega;
      const steps = Math.max(1, Math.ceil(dt / STEP));
      const step = dt / steps;
      for (let i = 0; i < steps; i++) {
        item.velocity += (k * (target - item.value) - d * item.velocity) * step;
        item.value += item.velocity * step;
      }
      return Math.abs(target - item.value) > 0.01 || Math.abs(item.velocity) > 0.01;
    };
    const snap = (item, value) => {
      item.value = value;
      item.velocity = 0;
    };

    const state = {
      raf: 0,
      last: 0,
      ready: false,
      hovered: false,
      pressed: false,
      pointerX: 0,
      pointerY: 0,
      deskX: 0,
      deskY: 0,
      hoveredItem: -1,
      phase: 'rest',
      previous: 'rest',
      changedAt: 0,
      front: spring(0),
      rx: spring(0),
      ry: spring(0),
      lift: spring(0),
      squash: spring(1),
      items: [],
      focus: -1,
      drag: null,
      receiving: false,
      receiveUntil: 0,
      suppressClick: false,
      dropCount: 0,
      intro: { phase: 'done', start: 0, opening: false },
      anchor: spring(0),
      appear: 1
    };

    while (state.items.length < this.count) {
      state.items.push({
        x: spring(0),
        y: spring(0),
        z: spring(0),
        r: spring(0),
        ry: spring(0),
        s: spring(1),
        hover: spring(0),
        mx: spring(0),
        my: spring(0),
        alpha: spring(1),
        place: 'inside',
        rank: 0,
        layer: 'inside',
        elevated: false,
        insertUntil: 0,
        insertFrom: null,
        outX: 0,
        outY: 0,
        outR: 0,
        outS: 1,
        outOrder: 0,
        localX: 0,
        localY: 0,
        fresh: true
      });
    }

    const s = {
      open: this.isOpen,
      layout: this.options.layout,
      openOn: this.options.openOn,
      peek: this.options.peek,
      intro: this.options.intro,
      draggable: this.options.draggable,
      zoomOnClick: this.options.zoomOnClick,
      closeOnOutsideClick: this.options.closeOnOutsideClick,
      tilt: clamp(this.options.tilt, 0, 1.5),
      bounce: clamp(this.options.bounce, 0, 1),
      speed: clamp(this.options.speed, 0.2, 3),
      count: this.count,
      depth: Math.round(Math.max(this.g.w, this.g.h) * 5),
      g: this.g
    };
    this.settings = s;

    const shiftOf = () => (s.g.book ? (s.g.w / 2) * clamp(-state.front.value / 180, 0, 1) : 0);

    const toDesk = (clientX, clientY) => {
      const box = root.getBoundingClientRect();
      const kx = root.offsetWidth / (box.width || 1);
      const ky = root.offsetHeight / (box.height || 1);
      return [(clientX - box.left) * kx, (clientY - box.top) * ky];
    };

    const overFolder = (x, y) => {
      const shift = shiftOf();
      if (s.g.book) {
        const left = state.front.value < -90 ? shift - s.g.w : shift;
        return x >= left && x <= shift + s.g.w && y >= s.g.tabH * 0.5 && y <= s.g.tabH + s.g.h;
      }
      return x >= 0 && x <= s.g.w && y >= 0 && y <= s.g.tabH + s.g.h;
    };

    const phaseOf = time => {
      if (s.open) return 'open';
      if (state.receiving || time < state.receiveUntil) return 'receive';
      if (s.peek && state.hovered && !state.drag?.active) return 'peek';
      return 'rest';
    };

    const place = (rank, inside, phase) => {
      if (s.g.book) return placeBook(rank, inside, phase, s.layout, s.g);
      const pointer = state.hovered ? ((state.pointerX + 1) / 2) * s.g.w : null;
      return placeFlap(rank, inside, phase, s.layout, s.g, pointer);
    };

    const write = () => {
      const { w, h, tabH, frontTop, frontH, docW, docH, scale, book: isBook } = s.g;
      const pivotX = w / 2;
      const pivotY = tabH + h / 2;
      const theta = state.front.value;
      const angle = (theta * Math.PI) / 180;
      const unfold = isBook ? clamp(-theta / 180, 0, 1) : 0;
      const shift = (w / 2) * unfold * (1 - state.anchor.value);
      const zoom = (1 + state.lift.value * 0.012) * state.squash.value * (0.94 + 0.06 * state.appear);

      root.style.opacity = state.appear < 0.999 ? state.appear.toFixed(3) : '';
      const desk = chain(
        move(pivotX, pivotY),
        turnX(state.rx.value),
        turnY(state.ry.value),
        stretch(zoom, zoom),
        move(-pivotX, -pivotY)
      );
      const folder = multiply(desk, move(shift, 0));
      const flipped = isBook ? theta < -90 : theta < -20;
      const frontZ = flipped ? '15' : '40';

      if (this.backRef) {
        this.backRef.style.transform = toCss(folder);
        this.backRef.style.setProperty('--folder-gutter', unfold.toFixed(3));
        this.backRef.style.setProperty(
          '--folder-label',
          (isBook ? 1 : 1 - clamp((-theta - 18) / 26, 0, 1)).toFixed(3)
        );
      }

      const frontMatrix = isBook
        ? chain(folder, move(0, frontTop, 2 * scale * (1 - unfold)), turnY(theta))
        : chain(folder, move(0, tabH + h, 2 * scale), turnX(theta), move(0, -frontH));
      const facing = isBook
        ? Math.sin(angle) * -0.42 + Math.cos(angle) * 0.9
        : Math.sin(angle) * 0.5 + Math.cos(angle) * 0.86;
      const light = (flipped ? -facing : facing) / (isBook ? 0.9 : 0.86);
      const glint = clamp((light - 1) * 0.9, 0, 0.18);
      const dim = clamp((1 - light) * (isBook ? 0.5 : 0.22), 0, 0.5);

      if (this.frontRef) {
        this.frontRef.style.transform = toCss(frontMatrix);
        this.frontRef.style.zIndex = frontZ;
        this.frontRef.dataset.face = flipped ? 'inner' : 'outer';
        this.frontRef.style.setProperty('--folder-glint', glint.toFixed(3));
        this.frontRef.style.setProperty('--folder-dim', dim.toFixed(3));
      }

      const rise = isBook ? Math.max(0, Math.sin(-angle)) : 0;
      if (this.groundRef) {
        this.groundRef.style.transform = toCss(multiply(folder, move(0, isBook ? tabH : tabH + h)));
        this.groundRef.style.opacity = (0.75 + state.lift.value * 0.25).toFixed(3);
      }

      const outs = state.items
        .map((item, index) => [item, index])
        .filter(([item]) => item.layer === 'out')
        .sort((a, b) => a[0].outOrder - b[0].outOrder)
        .map(([, index]) => index);

      state.items.forEach((item, index) => {
        const node = this.itemRefs[index];
        const z = 3 * scale + item.z.value + item.hover.value * 26 * scale;
        const matrix = chain(
          desk,
          move(item.x.value + item.mx.value, item.y.value + item.my.value, z),
          turnY(item.ry.value),
          turnZ(item.r.value),
          stretch(item.s.value, item.s.value),
          move(-docW / 2, -docH / 2)
        );
        let layer = (state.phase === 'open' || s.open) ? (50 + item.rank) : (10 + s.count - item.rank);
        if (state.hoveredItem === index) layer = 70;
        if (item.layer === 'out') layer = LAYERS.out + outs.indexOf(index);
        if (item.layer === 'drag') layer = LAYERS.drag;
        if (item.layer === 'focus') layer = 180;

        if (node) {
          node.style.transform = toCss(matrix);
          node.style.zIndex = String(layer);
          node.style.setProperty('--folder-lift', clamp(item.hover.value, 0, 2.4).toFixed(3));
          node.style.opacity = item.alpha.value < 0.995 ? Math.max(0, item.alpha.value).toFixed(3) : '';
          if (state.focus === index) {
            node.classList.add('is-focused');
          } else {
            node.classList.remove('is-focused');
          }
        }
      });
    };

    const frame = now => {
      state.raf = 0;
      const time = now / 1000;
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
      state.last = now;
      const zeta = reduce ? 1 : 1 - 0.72 * s.bounce;
      const frontOmega = TAU * (s.g.book ? 1.55 : 2) * s.speed;
      const itemOmega = TAU * 2.1 * s.speed;
      const soft = TAU * 1.6 * s.speed;
      const phase = phaseOf(time);

      if (phase !== state.phase) {
        state.previous = state.phase;
        state.phase = phase;
        state.changedAt = now;
      }
      const elapsed = (now - state.changedAt) / 1000;
      let busy = time < state.receiveUntil;

      const ranks = [];
      state.items.forEach((item, index) => {
        if (item.place === 'inside') ranks.push(index);
      });
      const inside = ranks.length;
      ranks.forEach((index, rank) => {
        state.items[index].rank = rank;
      });
      if (state.focus >= 0 && phase !== 'open' && state.items[state.focus]?.place === 'inside') state.focus = -1;

      const frontTarget = (s.g.book ? BOOK_ANGLES : FLAP_ANGLES)[phase];

      if (!state.ready) {
        state.ready = true;
        snap(state.front, frontTarget);
        snap(state.anchor, 0);
        state.items.forEach(item => {
          const slot = place(item.rank, inside, phase);
          snap(item.x, slot.x);
          snap(item.y, slot.y);
          snap(item.z, slot.z);
          snap(item.r, slot.r);
          snap(item.ry, slot.ry);
          snap(item.s, slot.s);
          snap(item.alpha, 1);
          snap(item.hover, 0);
          item.fresh = false;
        });
      }

      busy = integrate(state.front, frontTarget, frontOmega, zeta, dt) || busy;
      const restitution = 0.2 + 0.35 * s.bounce;
      if (s.g.book && state.front.value < -180) {
        state.front.value = -360 - state.front.value;
        state.front.velocity = -state.front.velocity * restitution;
      } else if (state.front.value > 0) {
        state.front.value = -state.front.value;
        state.front.velocity = -state.front.velocity * restitution;
      }

      const engaged = state.hovered && !reduce;
      busy = integrate(state.rx, engaged ? -state.pointerY * 8 * s.tilt : 0, soft, 1, dt) || busy;
      busy = integrate(state.ry, engaged ? state.pointerX * 10 * s.tilt : 0, soft, 1, dt) || busy;
      busy = integrate(state.lift, state.hovered && phase !== 'open' ? 1 : 0, soft, 1, dt) || busy;
      busy = integrate(state.squash, state.pressed ? 0.975 : 1, TAU * 3.2, 0.6, dt) || busy;

      const hover = state.hoveredItem;
      const focusScale = clamp(((s.g.tabH + s.g.h) * 1.35) / s.g.docH, 1.45, 2.2);
      const focusY = s.g.book ? s.g.tabH + s.g.h / 2 : -s.g.h * 0.36;

      state.items.forEach((item, index) => {
        let target;
        let omega = itemOmega;
        let damping = zeta;
        let lift = 0;
        let magnet = false;

        if (state.focus === index) {
          target = { x: s.g.w / 2, y: focusY, z: 80 * s.g.scale, r: 0, ry: 0, s: focusScale };
          lift = 2.4;
          item.layer = 'focus';
        } else if (item.place === 'out') {
          target = { x: item.outX, y: item.outY, z: 0, r: item.outR, ry: 0, s: item.outS };
          lift = hover === index ? 1 : 0.15;
          magnet = hover === index;
          item.layer = 'out';
        } else {
          target = place(item.rank, inside, phase);
          item.layer = 'inside';
          if (phase === 'open') {
            if (hover === index) {
              target = { ...target, y: target.y - 6 * s.g.scale, r: target.r * 0.2, ry: 0, s: target.s * 1.05 };
              lift = 1;
              magnet = true;
            } else {
              lift = 0.2;
            }
          }
        }

        busy = integrate(item.x, target.x, omega, damping, dt) || busy;
        busy = integrate(item.y, target.y, omega, damping, dt) || busy;
        busy = integrate(item.z, target.z, itemOmega, zeta, dt) || busy;
        busy = integrate(item.r, target.r, omega, damping, dt) || busy;
        busy = integrate(item.ry, target.ry, itemOmega, zeta, dt) || busy;
        busy = integrate(item.s, target.s, itemOmega, zeta, dt) || busy;
        busy = integrate(item.hover, lift, itemOmega, zeta, dt) || busy;
        busy = integrate(item.alpha, (state.focus >= 0 && state.focus !== index) ? 0.3 : 1, TAU * 3 * s.speed, 1, dt) || busy;
        busy = integrate(item.mx, magnet ? item.localX * 7 * s.g.scale : 0, soft, 0.85, dt) || busy;
        busy = integrate(item.my, magnet ? item.localY * 7 * s.g.scale : 0, soft, 0.85, dt) || busy;
      });

      write();
      if (busy) state.raf = requestAnimationFrame(frame);
      else state.last = 0;
    };

    const wake = () => {
      if (!state.raf) state.raf = requestAnimationFrame(frame);
    };

    const toggle = () => {
      if (state.focus >= 0) {
        state.focus = -1;
        wake();
        return;
      }
      this.isOpen = !this.isOpen;
      s.open = this.isOpen;
      if (this.isOpen) root.setAttribute('data-open', '');
      else root.removeAttribute('data-open');
      stage.setAttribute('aria-expanded', String(this.isOpen));
      if (typeof this.options.onOpenChange === 'function') {
        this.options.onOpenChange(this.isOpen);
      }
      wake();
    };

    // Pointer events on root
    root.addEventListener('pointermove', event => {
      const box = root.getBoundingClientRect();
      state.pointerX = clamp(((event.clientX - box.left) / box.width) * 2 - 1, -1.5, 1.5);
      state.pointerY = clamp(((event.clientY - box.top) / box.height) * 2 - 1, -1.5, 1.5);
      const target = event.target.closest?.('[data-folder-item]');
      const index = target && root.contains(target) ? Number(target.getAttribute('data-folder-item')) : -1;
      state.hoveredItem = index;
      if (target && index >= 0) {
        const rect = target.getBoundingClientRect();
        const item = state.items[index];
        if (item) {
          item.localX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
          item.localY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
        }
      }
      if (!state.hovered) {
        state.hovered = true;
        if (s.openOn === 'hover') {
          this.isOpen = true;
          s.open = true;
          root.setAttribute('data-open', '');
        }
      }
      wake();
    });

    root.addEventListener('pointerleave', () => {
      state.hovered = false;
      state.pressed = false;
      state.hoveredItem = -1;
      if (s.openOn === 'hover') {
        this.isOpen = false;
        s.open = false;
        root.removeAttribute('data-open');
      }
      wake();
    });

    stage.addEventListener('click', e => {
      // 1. If direct link or button clicked: ONLY then navigate to external URL!
      const linkEl = e.target.closest('a, .folder-doc-link-btn, .folder-doc-url-pill, .folder-doc-link-pill');
      if (linkEl) {
        e.stopPropagation();
        const href = linkEl.getAttribute('href') || linkEl.dataset.url;
        if (href) {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      // 2. If clicking on a document card when folder is open: navigate directly to reference!
      const itemEl = e.target.closest('[data-folder-item]');
      if (itemEl && (s.open || state.items[Number(itemEl.getAttribute('data-folder-item'))]?.place === 'out')) {
        const idx = Number(itemEl.getAttribute('data-folder-item'));
        e.stopPropagation();
        const clickedItem = this.items[idx];

        if (typeof this.options.onItemClick === 'function') {
          this.options.onItemClick(clickedItem, idx);
        }

        if (clickedItem && clickedItem.url) {
          window.open(clickedItem.url, '_blank', 'noopener,noreferrer');
        } else if (s.zoomOnClick) {
          state.focus = state.focus === idx ? -1 : idx;
          wake();
        }
        return;
      }

      // 3. Otherwise: toggle folder open/close (pops up folder when closed)
      toggle();
    });

    stage.addEventListener('keydown', e => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    document.addEventListener('pointerdown', e => {
      if (!root.contains(e.target)) {
        if (state.focus >= 0) {
          state.focus = -1;
          wake();
        }
        if (s.open && s.closeOnOutsideClick) {
          this.isOpen = false;
          s.open = false;
          root.removeAttribute('data-open');
          stage.setAttribute('aria-expanded', 'false');
          wake();
        }
      }
    });

    wake();
  }
}

/**
 * Curated 8 Technical Research Dossiers matching NASA Space Apps,
 * Moon & Mars Discarded Relics, Extreme Astrobiology, and Lunar Exploration.
 */
export const RESEARCH_DOSSIERS = [
  {
    id: 'nasa-archives',
    tab: 'Archives',
    title: 'NASA Archives',
    year: 'NSSDCA • Open Data',
    color: '#00f0ff', // Neon Cyan
    variant: 'glass',
    docs: [
      {
        title: 'NSSDCA Master Catalog',
        description: 'NASA definitive spacecraft & telemetry repository.',
        url: 'https://nssdc.gsfc.nasa.gov/'
      },
      {
        title: 'Planetary Protection',
        description: 'COSPAR international planetary stewardship protocols.',
        url: 'https://science.nasa.gov/solar-system/planetary-protection/'
      },
      {
        title: 'NASA Open Data Portal',
        description: 'Public orbital mechanics & surface mission data.',
        url: 'https://data.nasa.gov/'
      }
    ]
  },
  {
    id: 'apollo-missions',
    tab: 'Apollo',
    title: 'Apollo Missions',
    year: '1969 – 1972',
    color: '#38bdf8', // Neon Sky Blue
    variant: 'glass',
    docs: [
      {
        title: 'Apollo Lunar Modules',
        description: 'Descent stages preserved at Apollo landing sites.',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C'
      },
      {
        title: 'Tranquility Base Heritage',
        description: 'Apollo 11 first crewed landing telemetry record.',
        url: 'https://science.nasa.gov/mission/apollo-11/'
      },
      {
        title: 'Lunar Ascent Impacts',
        description: 'Seismic calibration impacts on lunar crust.',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-031C'
      }
    ]
  },
  {
    id: 'lunar-surface',
    tab: 'Moon Rovers',
    title: 'Lunar Surface',
    year: '1971 – 1977',
    color: '#7aa7ff', // Space Blue
    variant: 'glass',
    docs: [
      {
        title: 'Lunar Roving Vehicles',
        description: 'Apollo 15, 16 & 17 electric LRVs on lunar plains.',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C'
      },
      {
        title: 'ALSEP Scientific Stations',
        description: 'Surface geophysical instruments active through 1977.',
        url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C'
      },
      {
        title: 'Laser Retroreflectors',
        description: 'Corner-cube prism arrays measuring Moon orbit.',
        url: 'https://science.nasa.gov/mission/apollo-14/'
      }
    ]
  },
  {
    id: 'surveyor-fleet',
    tab: 'Surveyors',
    title: 'Surveyor Fleet',
    year: '1966 – 2013',
    color: '#2dd4bf', // Cyan Mint
    variant: 'glass',
    docs: [
      {
        title: 'Surveyor Soft Landers',
        description: 'Robotic probes proving soft lunar surface landings.',
        url: 'https://science.nasa.gov/mission/surveyor-3/'
      },
      {
        title: 'LADEE Atmosphere Orbiter',
        description: 'Pristine lunar exosphere and dust investigation.',
        url: 'https://science.nasa.gov/mission/ladee/'
      },
      {
        title: 'GRAIL Gravity Probes',
        description: 'Twin orbiters mapping lunar sub-surface density.',
        url: 'https://science.nasa.gov/mission/grail/'
      }
    ]
  },
  {
    id: 'mars-pioneers',
    tab: 'Pathfinder',
    title: 'Mars Pioneers',
    year: '1976 – 1997',
    color: '#ff5722', // Martian Orange-Red
    variant: 'glass',
    docs: [
      {
        title: 'Sojourner Microrover',
        description: 'First rover on Mars resting in Ares Vallis.',
        url: 'https://science.nasa.gov/mission/mars-pathfinder/'
      },
      {
        title: 'Carl Sagan Station',
        description: 'Pathfinder landing base and atmospheric sensors.',
        url: 'https://science.nasa.gov/mission/mars-pathfinder/'
      },
      {
        title: 'Viking 1 & 2 Landers',
        description: 'First operational scientific stations on Mars.',
        url: 'https://science.nasa.gov/mission/viking-1/'
      }
    ]
  },
  {
    id: 'mars-rovers',
    tab: 'Mars Rovers',
    title: 'Mars Exploration',
    year: '2004 – 2024',
    color: '#fb923c', // Solar Amber
    variant: 'glass',
    docs: [
      {
        title: 'Spirit & Opportunity',
        description: 'Twin geologists discovering ancient water clues.',
        url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/'
      },
      {
        title: 'Opportunity Marathon',
        description: 'Historic 28-mile traverse across Meridiani Planum.',
        url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/'
      },
      {
        title: 'Ingenuity Helicopter',
        description: 'First aerial flight on another world (72 sorties).',
        url: 'https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/'
      }
    ]
  },
  {
    id: 'mars-science',
    tab: 'Mars Science',
    title: 'Phoenix & InSight',
    year: '2008 – 2022',
    color: '#e11d48', // Crimson Rose
    variant: 'glass',
    docs: [
      {
        title: 'Phoenix Polar Lander',
        description: 'Direct sampling of water ice in Martian arctic.',
        url: 'https://science.nasa.gov/mission/phoenix/'
      },
      {
        title: 'InSight Seismic Station',
        description: 'Marsquake detector mapping planetary interior.',
        url: 'https://science.nasa.gov/mission/insight/'
      },
      {
        title: 'EDL Descent Hardware',
        description: 'Supersonic parachutes & backshells cataloged.',
        url: 'https://science.nasa.gov/mission/mars-2020-perseverance/'
      }
    ]
  },
  {
    id: 'deep-space',
    tab: 'Deep Space',
    title: 'Deep Space Relics',
    year: '1972 – 2018',
    color: '#a855f7', // Cosmic Violet
    variant: 'glass',
    docs: [
      {
        title: 'Dawn Spacecraft',
        description: 'Permanent orbit around dwarf planet Ceres.',
        url: 'https://science.nasa.gov/mission/dawn/'
      },
      {
        title: 'NEAR Shoemaker',
        description: 'First probe to orbit and softly land on asteroid Eros.',
        url: 'https://science.nasa.gov/mission/near-shoemaker/'
      },
      {
        title: 'Pioneers (10 & 11)',
        description: 'Interstellar probes continuing on outward paths beyond our solar system.',
        url: 'https://science.nasa.gov/mission/pioneer-10/'
      }
    ]
  }
];

export default VanillaFolder;
