/**
 * InfiniteMenu.js — High-performance Vanilla JS WebGL2 implementation
 * of the <InfiniteMenu /> component from React Bits.
 *
 * Fully reactive, zero external dependencies, 100% faithful to the React original.
 */

const VERTEX = `#version 300 es
in vec2 aCorner;
in vec4 aTile;
uniform vec4 uOrientation;
uniform mat4 uProjection;
uniform float uCamera;
uniform float uRadius;
uniform float uTileRadius;
uniform vec4 uSpin;
uniform float uStretch;
uniform float uShift;
out vec2 vUv;
out float vFront;
out float vItem;

vec3 rotate(vec4 q, vec3 v) {
  vec3 t = 2.0 * cross(q.xyz, v);
  return v + q.w * t + cross(q.xyz, t);
}

void main() {
  vec3 center = normalize(rotate(uOrientation, aTile.xyz));
  vec3 reference = abs(center.y) > 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
  vec3 tangent = normalize(cross(reference, center));
  vec3 bitangent = cross(center, tangent);
  float front = max(center.z, 0.0);
  vec3 offset = (tangent * aCorner.x + bitangent * aCorner.y) * uTileRadius * mix(0.5, 1.0, front);
  vec3 motion = cross(uSpin.xyz, center);
  float sweep = length(motion);
  if (sweep > 0.0001) {
    vec3 direction = motion / sweep;
    float amount = min(0.9, uSpin.w * uStretch * 0.12) * sweep;
    offset += direction * dot(offset, direction) * amount;
  }
  vec3 world = normalize(center * uRadius + offset) * uRadius * (1.0 + 0.003 * center.z);
  gl_Position = uProjection * vec4(world.xy, world.z - uCamera, 1.0);
  gl_Position.y += uShift * gl_Position.w;
  vUv = aCorner;
  vFront = center.z;
  vItem = aTile.w;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uAtlas;
uniform float uCells;
uniform float uInset;
uniform float uRoundness;
uniform float uGrayscale;
uniform float uDim;
uniform float uReveal;
uniform vec3 uPlaceholder;
uniform vec3 uTone;
in vec2 vUv;
in float vFront;
in float vItem;
out vec4 outColor;

void main() {
  float corner = clamp(uRoundness, 0.0, 1.0);
  vec2 q = abs(vUv) - (1.0 - corner);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - corner;
  float aa = max(fwidth(d), 0.0001);
  float mask = 1.0 - smoothstep(-aa, aa, d);
  float alpha = mask * smoothstep(0.02, 0.4, vFront) * uReveal;
  if (alpha < 0.002) discard;
  vec2 cell = vec2(mod(vItem, uCells), floor(vItem / uCells));
  vec2 local = vec2(vUv.x, -vUv.y) * 0.5 + 0.5;
  vec4 sampled = texture(uAtlas, (cell + uInset + local * (1.0 - 2.0 * uInset)) / uCells);
  vec3 color = mix(uPlaceholder, sampled.rgb, sampled.a);
  float focus = smoothstep(0.93, 0.997, vFront);
  float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(color, vec3(gray), uGrayscale * (1.0 - focus));
  color = mix(color, uTone, uDim * (1.0 - focus));
  outColor = vec4(color * alpha, alpha);
}`;

const GRID = 12;
const RADIUS = 2;
const FOV = (30 * Math.PI) / 180;
const FRONT = [0, 0, 1];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = v => {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
};
const quatMultiply = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
];
const quatAxisAngle = (axis, angle) => {
  const s = Math.sin(angle / 2);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
};
const quatNormalize = q => {
  const length = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / length, q[1] / length, q[2] / length, q[3] / length];
};
const rotate = (q, v) => {
  const t = cross(q, v).map(value => value * 2);
  const u = cross(q, t);
  return [v[0] + q[3] * t[0] + u[0], v[1] + q[3] * t[1] + u[1], v[2] + q[3] * t[2] + u[2]];
};

const sphere = count => {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / count;
    const ring = Math.sqrt(1 - y * y);
    return [Math.cos(golden * i) * ring, y, Math.sin(golden * i) * ring];
  });
};

const luminance = hex => {
  if (!hex || typeof hex !== 'string') return 0;
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.replace(/./g, c => c + c) : value.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return 0;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const ARROW_SVG = `
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path
    d="M7 17L17 7M17 7H9M17 7V15"
    stroke="currentColor"
    strokeWidth="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
`;

export class VanillaInfiniteMenu {
  constructor(container, options = {}) {
    this.root = container;
    if (!this.root) throw new Error('InfiniteMenu container not found');

    this.options = {
      items: [],
      count: 160,
      tileSize: 0.63,
      roundness: 0.2,
      zoom: 1.65,
      pullBack: 1,
      stretch: 0.6,
      inertia: 0.6,
      autoplay: 3,
      grayscale: true,
      dim: 0.5,
      intro: true,
      showInfo: true,
      renderInfo: null,
      theme: 'dark',
      accentColor: null,
      backgroundColor: null,
      onActiveChange: null,
      onItemClick: null,
      className: '',
      ...options
    };

    this.items = this.options.items || [];
    this.active = 0;
    this.moving = true;
    this.layoutMode = 'side';
    this.alive = true;

    this.initDOM();
    this.initGL();
  }

  get settings() {
    return {
      count: clamp(Math.round(this.options.count), 6, 400),
      tileSize: clamp(this.options.tileSize, 0.2, 1.2),
      roundness: clamp(this.options.roundness, 0, 1),
      zoom: clamp(this.options.zoom, 0.2, 4),
      pullBack: clamp(this.options.pullBack, 0, 3),
      stretch: clamp(this.options.stretch, 0, 3),
      inertia: clamp(this.options.inertia, 0, 1),
      autoplay: Math.max(0, this.options.autoplay),
      grayscale: this.options.grayscale !== false,
      dim: clamp(this.options.dim ?? 0.5, 0, 1),
      intro: this.options.intro !== false,
      theme: this.options.theme === 'light' ? 'light' : 'dark'
    };
  }

  initDOM() {
    this.root.className = `infinite-menu${this.options.className ? ` ${this.options.className}` : ''}`;
    this.root.tabIndex = 0;
    this.root.setAttribute('role', 'group');
    this.root.setAttribute('aria-roledescription', 'carousel');
    this.root.setAttribute('aria-label', 'Infinite menu');

    const ink = this.settings.theme === 'light' ? '#120f17' : '#ffffff';
    const accent = this.options.accentColor || ink;
    const onAccent = luminance(accent) > 0.5 ? '#120f17' : '#ffffff';

    if (this.options.backgroundColor) {
      this.root.style.backgroundColor = this.options.backgroundColor;
    }
    this.root.style.setProperty('--infinite-menu-text', ink);
    this.root.style.setProperty('--infinite-menu-accent', accent);
    this.root.style.setProperty('--infinite-menu-on-accent', onAccent);
    this.root.style.setProperty(
      '--infinite-menu-shadow',
      this.settings.theme === 'light' ? '0 2px 18px rgba(255, 255, 255, 0.7)' : '0 2px 18px rgba(0, 0, 0, 0.65)'
    );

    this.root.innerHTML = `
      <canvas class="infinite-menu__canvas"></canvas>
      <div class="infinite-menu__info" data-moving="true" data-layout="side">
        <h2 class="infinite-menu__title"></h2>
        <p class="infinite-menu__description"></p>
        <button type="button" class="infinite-menu__action" aria-label="Open">
          ${ARROW_SVG}
        </button>
      </div>
    `;

    this.canvas = this.root.querySelector('.infinite-menu__canvas');
    this.infoEl = this.root.querySelector('.infinite-menu__info');
    this.titleEl = this.root.querySelector('.infinite-menu__title');
    this.descEl = this.root.querySelector('.infinite-menu__description');
    this.actionEl = this.root.querySelector('.infinite-menu__action');

    this.actionEl.addEventListener('click', (e) => this.handleActionClick(e));
  }

  initGL() {
    const gl = this.canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) {
      console.warn('WebGL2 not supported for InfiniteMenu');
      return;
    }
    this.gl = gl;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    this.program = program;

    const uniforms = {};
    for (const name of [
      'uOrientation',
      'uProjection',
      'uCamera',
      'uRadius',
      'uTileRadius',
      'uSpin',
      'uStretch',
      'uShift',
      'uAtlas',
      'uCells',
      'uInset',
      'uRoundness',
      'uGrayscale',
      'uDim',
      'uReveal',
      'uPlaceholder',
      'uTone'
    ]) {
      uniforms[name] = gl.getUniformLocation(program, name);
    }
    this.uniforms = uniforms;

    const corners = [];
    const indices = [];
    for (let y = 0; y <= GRID; y++) {
      for (let x = 0; x <= GRID; x++) corners.push((x / GRID) * 2 - 1, (y / GRID) * 2 - 1);
    }
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const i = y * (GRID + 1) + x;
        indices.push(i, i + 1, i + GRID + 1, i + 1, i + GRID + 2, i + GRID + 1);
      }
    }
    this.indicesCount = indices.length;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    this.vao = vao;

    const cornerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(corners), gl.STATIC_DRAW);
    const cornerLocation = gl.getAttribLocation(program, 'aCorner');
    gl.enableVertexAttribArray(cornerLocation);
    gl.vertexAttribPointer(cornerLocation, 2, gl.FLOAT, false, 0, 0);
    this.cornerBuffer = cornerBuffer;

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    this.indexBuffer = indexBuffer;

    const tileBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tileBuffer);
    const tileLocation = gl.getAttribLocation(program, 'aTile');
    gl.enableVertexAttribArray(tileLocation);
    gl.vertexAttribPointer(tileLocation, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(tileLocation, 1);
    this.tileBuffer = tileBuffer;
    gl.bindVertexArray(null);

    const atlasTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    gl.uniform1i(uniforms.uAtlas, 0);
    this.atlasTexture = atlasTexture;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.reduce = reduce;
    this.atlas = { canvas: document.createElement('canvas'), cells: 1, cell: 512, request: 0, dirty: false };
    this.drag = { active: false, id: -1, x: 0, y: 0, dx: 0, dy: 0, moved: 0, start: 0 };
    this.state = {
      width: 1,
      height: 1,
      tiles: [],
      assign: [],
      count: 0,
      orientation: quatNormalize([0.08, -0.3, 0, 1]),
      axis: [0, 1, 0],
      speed: this.settings.intro && !reduce ? 3.2 : 0,
      camera: 0,
      target: -1,
      front: 0,
      shown: -1,
      moving: true,
      reveal: 0,
      hovered: false,
      focused: false,
      idle: 0,
      settle: 0,
      tilePx: 0,
      layout: 'side',
      shift: 0,
      started: false
    };

    this.raf = 0;
    this.timer = 0;
    this.last = 0;
    this.visible = true;

    this.bindEvents();
    this.loadItems(this.items);
    this.resize();
    this.wake();
  }

  layout() {
    const s = this.settings;
    if (s.count === this.state.count) return;
    this.state.count = s.count;
    this.state.tiles = sphere(s.count);
    const totalItems = Math.max(1, this.items.length);
    const usage = new Array(totalItems).fill(0);
    this.state.assign = this.state.tiles.map(() => -1);

    this.state.tiles.forEach((tile, i) => {
      const near = this.state.tiles
        .map((other, j) => [j === i ? -2 : dot(tile, other), j])
        .sort((a, b) => b[0] - a[0])
        .slice(0, 6)
        .map(([, j]) => this.state.assign[j]);
      let pick = -1;
      for (let k = 0; k < totalItems; k++) {
        const candidate = (i + k) % totalItems;
        if (near.includes(candidate)) continue;
        if (pick < 0 || usage[candidate] < usage[pick]) pick = candidate;
      }
      if (pick < 0) pick = i % totalItems;
      this.state.assign[i] = pick;
      usage[pick] += 1;
    });

    const data = new Float32Array(s.count * 4);
    this.state.tiles.forEach((tile, i) => data.set([tile[0], tile[1], tile[2], this.state.assign[i]], i * 4));
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tileBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

    let first = -1;
    let firstZ = -2;
    this.state.tiles.forEach((tile, i) => {
      const z = rotate(this.state.orientation, tile)[2];
      if (this.state.assign[i] === 0 && z > firstZ) {
        firstZ = z;
        first = i;
      }
    });
    this.state.target = first;
  }

  uploadAtlas() {
    this.atlas.dirty = false;
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.atlasTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.atlas.canvas);
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
  }

  loadItems(list) {
    this.items = list || [];
    const request = ++this.atlas.request;
    const total = Math.max(1, this.items.length);
    this.atlas.cells = Math.ceil(Math.sqrt(total));
    this.atlas.cell = clamp(Math.floor(4096 / this.atlas.cells), 64, 512);
    this.atlas.canvas.width = this.atlas.cells * this.atlas.cell;
    this.atlas.canvas.height = this.atlas.cells * this.atlas.cell;
    const ctx = this.atlas.canvas.getContext('2d');
    ctx?.clearRect(0, 0, this.atlas.canvas.width, this.atlas.canvas.height);
    this.uploadAtlas();
    this.state.count = 0;
    this.layout();

    let pending = this.items.length;
    if (!pending) this.state.started = true;

    this.items.forEach((item, index) => {
      const image = new Image();
      // Allow relative or absolute path loading
      if (item?.image && (item.image.startsWith('http://') || item.image.startsWith('https://'))) {
        image.crossOrigin = 'anonymous';
      }
      image.decoding = 'async';
      const done = () => {
        pending -= 1;
        if (pending <= 0) this.state.started = true;
        this.wake();
      };
      image.onload = () => {
        if (!this.alive || request !== this.atlas.request || !ctx) return;
        const size = this.atlas.cell;
        const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        const x = (index % this.atlas.cells) * size;
        const y = Math.floor(index / this.atlas.cells) * size;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, size, size);
        ctx.clip();
        ctx.drawImage(image, x + (size - width) / 2, y + (size - height) / 2, width, height);
        ctx.restore();
        this.atlas.dirty = true;
        done();
      };
      image.onerror = () => {
        if (!this.alive || request !== this.atlas.request) return;
        done();
      };
      image.src = item?.image ?? '';
    });
  }

  tileRadius() {
    return 0.5 * RADIUS * Math.sqrt((4 * Math.PI) / Math.max(1, this.state.count)) * this.settings.tileSize;
  }

  restDistance() {
    const s = this.settings;
    const aspect = this.state.width / this.state.height;
    const span = Math.tan(FOV / 2) * Math.min(1, aspect);
    return RADIUS + this.tileRadius() / (0.46 * s.zoom * span);
  }

  measure() {
    const rest = this.restDistance();
    const radius = (this.tileRadius() / ((rest - RADIUS) * Math.tan(FOV / 2))) * (this.state.height / 2);
    const rounded = Math.round(radius);
    if (rounded !== this.state.tilePx) {
      this.state.tilePx = rounded;
      this.root.style.setProperty('--infinite-menu-tile', `${rounded}px`);
    }
    const mode = this.state.width / 2 - radius < 120 ? 'stacked' : 'side';
    if (mode !== this.state.layout) {
      this.state.layout = mode;
      this.layoutMode = mode;
      if (this.infoEl) this.infoEl.setAttribute('data-layout', mode);
    }
  }

  nearest() {
    let best = 0;
    let bestZ = -2;
    for (let i = 0; i < this.state.tiles.length; i++) {
      const z = rotate(this.state.orientation, this.state.tiles[i])[2];
      if (z > bestZ) {
        bestZ = z;
        best = i;
      }
    }
    return best;
  }

  neighbor(from, direction) {
    const origin = rotate(this.state.orientation, this.state.tiles[from]);
    let best = -1;
    let bestScore = Infinity;
    for (let i = 0; i < this.state.tiles.length; i++) {
      if (i === from) continue;
      const c = rotate(this.state.orientation, this.state.tiles[i]);
      if (c[2] < 0) continue;
      const dx = c[0] - origin[0];
      const dy = c[1] - origin[1];
      const length = Math.hypot(dx, dy);
      if (length < 0.0001) continue;
      const align = (dx * direction[0] + dy * direction[1]) / length;
      if (align < 0.55) continue;
      const score = length * (2.2 - align);
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  }

  goTo(index) {
    if (index < 0) return;
    this.state.target = index;
    this.state.speed = 0;
    this.state.idle = 0;
    this.wake();
  }

  pick(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    const span = Math.tan(FOV / 2);
    const x = (((clientX - rect.left) / rect.width) * 2 - 1) * aspect;
    const y = 1 - ((clientY - rect.top) / rect.height) * 2 - this.state.shift;
    const radius = this.tileRadius();
    let best = -1;
    let bestDistance = Infinity;
    for (let i = 0; i < this.state.tiles.length; i++) {
      const c = rotate(this.state.orientation, this.state.tiles[i]);
      if (c[2] < 0.2) continue;
      const depth = this.state.camera - c[2] * RADIUS;
      const sx = (c[0] * RADIUS) / (depth * span);
      const sy = (c[1] * RADIUS) / (depth * span);
      const reach = (radius * (0.5 + 0.5 * c[2])) / (depth * span);
      const distance = Math.hypot(sx - x, sy - y);
      if (distance < reach && distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    return best;
  }

  activate(index) {
    const list = this.items;
    if (!list.length) return;
    const itemIndex = (this.state.assign[index] ?? 0) % list.length;
    const item = list[itemIndex];
    if (this.options.onItemClick) {
      this.options.onItemClick(item, itemIndex);
    } else if (item?.link) {
      if (item.link.startsWith('#')) {
        const targetEl = document.querySelector(item.link);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.open(item.link, item.link.startsWith('http') ? '_blank' : '_self', 'noopener');
      }
    }
  }

  report() {
    const list = this.items;
    const index = list.length ? (this.state.assign[this.state.front] ?? 0) % list.length : 0;
    if (!this.state.moving && index !== this.state.shown) {
      this.state.shown = index;
      this.active = index;
      this.updateOverlay(list[index], index);
      if (this.options.onActiveChange) {
        this.options.onActiveChange(list[index], index);
      }
    }
  }

  updateOverlay(item, index) {
    if (!this.options.showInfo || !item) {
      if (this.infoEl) this.infoEl.style.display = 'none';
      return;
    }
    if (this.infoEl) this.infoEl.style.display = 'block';

    if (this.titleEl) {
      this.titleEl.textContent = item.title || '';
    }
    if (this.descEl) {
      this.descEl.innerHTML = item.description || '';
    }
    if (this.actionEl) {
      const label = item.title ? `Open ${item.title}` : 'Open';
      this.actionEl.setAttribute('aria-label', label);
      if (item.link) {
        this.actionEl.setAttribute('data-link', item.link);
      } else {
        this.actionEl.removeAttribute('data-link');
      }
    }
    this.root.setAttribute('aria-label', item.title || 'Infinite menu');
  }

  handleActionClick(e) {
    const current = this.items.length ? this.items[this.active % this.items.length] : null;
    if (!current) return;
    if (this.options.onItemClick) {
      this.options.onItemClick(current, this.active % this.items.length);
      if (!current.link) e.preventDefault();
    } else if (current.link) {
      if (current.link.startsWith('#')) {
        e.preventDefault();
        const targetEl = document.querySelector(current.link);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.open(current.link, current.link.startsWith('http') ? '_blank' : '_self', 'noopener');
      }
    }
  }

  frame(now) {
    this.raf = 0;
    if (!this.alive || !this.visible) return;
    const s = this.settings;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;

    this.layout();
    if (this.atlas.dirty) this.uploadAtlas();
    if (this.state.started) this.state.reveal = Math.min(1, this.state.reveal + dt / (this.reduce ? 0.01 : 0.7));
    const minSide = Math.min(this.state.width, this.state.height);

    if (this.drag.active) {
      if (this.drag.dx || this.drag.dy) {
        const length = Math.hypot(this.drag.dx, this.drag.dy);
        const angle = (length / minSide) * 2.6;
        const axis = normalize([this.drag.dy, this.drag.dx, 0]);
        this.state.orientation = quatNormalize(quatMultiply(quatAxisAngle(axis, angle), this.state.orientation));
        const blend = 1 - Math.exp(-dt * 30);
        this.state.axis = normalize(this.state.axis.map((value, i) => value + (axis[i] - value) * blend));
        this.state.speed += (angle / dt - this.state.speed) * blend;
        this.drag.dx = 0;
        this.drag.dy = 0;
      } else {
        this.state.speed *= Math.exp(-dt * 14);
      }
    } else {
      if (this.state.speed > 0.0005) {
        this.state.orientation = quatNormalize(
          quatMultiply(quatAxisAngle(this.state.axis, this.state.speed * dt), this.state.orientation)
        );
        this.state.speed *= Math.exp(-dt * (6 - 5 * s.inertia));
      } else {
        this.state.speed = 0;
      }
      const goal = this.state.target >= 0 ? this.state.target : this.nearest();
      const current = rotate(this.state.orientation, this.state.tiles[goal]);
      const angle = Math.acos(clamp(dot(current, FRONT), -1, 1));
      const pull = clamp(1 - this.state.speed / 1.4, 0, 1);
      if (angle > 0.0002 && pull > 0) {
        const axis = cross(current, FRONT);
        const step = angle * (1 - Math.exp(-dt * (this.state.target >= 0 ? 6 : 8))) * pull;
        if (Math.hypot(axis[0], axis[1], axis[2]) > 1e-6) {
          this.state.orientation = quatNormalize(quatMultiply(quatAxisAngle(normalize(axis), step), this.state.orientation));
        }
      } else if (this.state.target >= 0 && this.state.speed === 0) {
        this.state.target = -1;
      }
      this.state.front = goal;
    }

    const settledAngle = Math.acos(clamp(rotate(this.state.orientation, this.state.tiles[this.state.front])[2], -1, 1));
    const moving = this.drag.active || this.state.speed > 0.08 || settledAngle > 0.01;
    if (moving !== this.state.moving) {
      this.state.moving = moving;
      this.moving = moving;
      if (this.infoEl) this.infoEl.setAttribute('data-moving', moving ? 'true' : 'false');
    }
    this.state.settle += ((moving ? 0 : 1) - this.state.settle) * (1 - Math.exp(-dt * (moving ? 10 : 3)));
    if (!moving) this.report();

    const rest = this.restDistance();
    const pullAmount = clamp(this.drag.active ? 1 : this.state.speed / 2.2, 0, 1);
    const target = rest + s.pullBack * pullAmount * RADIUS * 1.25 + (1 - this.state.reveal) * RADIUS * 1.5;
    if (!this.state.camera) this.state.camera = target + RADIUS;
    this.state.camera += (target - this.state.camera) * (1 - Math.exp(-dt * 4.5));

    if (s.autoplay > 0 && !moving && !this.state.hovered && !this.state.focused && !this.reduce) {
      this.state.idle += dt;
      if (this.state.idle >= s.autoplay) {
        this.state.idle = 0;
        this.goTo(this.neighbor(this.state.front, [1, 0]));
      }
    } else {
      this.state.idle = 0;
    }

    this.measure();
    const shiftTarget = this.state.layout === 'stacked' ? Math.min(0.3, 72 / this.state.height) : 0;
    this.state.shift += (shiftTarget - this.state.shift) * (1 - Math.exp(-dt * 6));
    this.render();

    const busy =
      moving ||
      Math.abs(target - this.state.camera) > 0.001 ||
      Math.abs((this.state.layout === 'stacked' ? Math.min(0.3, 72 / this.state.height) : 0) - this.state.shift) > 0.0005 ||
      Math.abs((moving ? 0 : 1) - this.state.settle) > 0.002 ||
      this.state.reveal < 1 ||
      this.atlas.dirty ||
      !this.state.started;
    if (busy) this.raf = requestAnimationFrame(t => this.frame(t));
    else {
      this.last = 0;
      if (s.autoplay > 0 && !this.state.hovered && !this.state.focused && !this.reduce) {
        clearTimeout(this.timer);
        this.timer = window.setTimeout(() => this.wake(), Math.max(16, (s.autoplay - this.state.idle) * 1000));
      }
    }
  }

  render() {
    const gl = this.gl;
    if (!gl) return;
    const s = this.settings;
    const aspect = this.state.width / this.state.height;
    const f = 1 / Math.tan(FOV / 2);
    const near = 0.05;
    const far = 50;
    const projection = new Float32Array([
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) / (near - far),
      -1,
      0,
      0,
      (2 * far * near) / (near - far),
      0
    ]);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);

    const [qx, qy, qz, qw] = this.state.orientation;
    gl.uniform4f(this.uniforms.uOrientation, qx, qy, qz, qw);
    gl.uniformMatrix4fv(this.uniforms.uProjection, false, projection);
    gl.uniform1f(this.uniforms.uCamera, this.state.camera);
    gl.uniform1f(this.uniforms.uRadius, RADIUS);
    gl.uniform1f(this.uniforms.uTileRadius, this.tileRadius());
    gl.uniform4f(this.uniforms.uSpin, this.state.axis[0], this.state.axis[1], this.state.axis[2], this.reduce ? 0 : this.state.speed);
    gl.uniform1f(this.uniforms.uStretch, s.stretch);
    gl.uniform1f(this.uniforms.uShift, this.state.shift);
    gl.uniform1f(this.uniforms.uCells, this.atlas.cells);
    gl.uniform1f(this.uniforms.uInset, 2 / this.atlas.cell);
    gl.uniform1f(this.uniforms.uRoundness, s.roundness);
    gl.uniform1f(this.uniforms.uGrayscale, s.grayscale ? 1 : 0);
    gl.uniform1f(this.uniforms.uDim, s.dim * (0.45 + 0.55 * this.state.settle));
    gl.uniform1f(this.uniforms.uReveal, this.state.reveal);

    if (s.theme === 'light') {
      gl.uniform3f(this.uniforms.uPlaceholder, 0.9, 0.9, 0.91);
      gl.uniform3f(this.uniforms.uTone, 1, 1, 1);
    } else {
      gl.uniform3f(this.uniforms.uPlaceholder, 0.13, 0.12, 0.15);
      gl.uniform3f(this.uniforms.uTone, 0.04, 0.035, 0.05);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    gl.bindVertexArray(this.vao);
    gl.drawElementsInstanced(gl.TRIANGLES, this.indicesCount, gl.UNSIGNED_SHORT, 0, this.state.tiles.length);
    gl.bindVertexArray(null);
  }

  wake() {
    clearTimeout(this.timer);
    if (this.raf || !this.alive || !this.visible) return;
    this.raf = requestAnimationFrame(t => this.frame(t));
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.state.width = Math.max(1, this.root.clientWidth);
    this.state.height = Math.max(1, this.root.clientHeight);
    this.canvas.width = Math.round(this.state.width * dpr);
    this.canvas.height = Math.round(this.state.height * dpr);
    if (!this.raf) this.render();
    this.wake();
  }

  bindEvents() {
    const canvas = this.canvas;
    const root = this.root;

    this.onPointerDown = event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      canvas.setPointerCapture?.(event.pointerId);
      this.drag.active = true;
      this.drag.id = event.pointerId;
      this.drag.x = event.clientX;
      this.drag.y = event.clientY;
      this.drag.dx = 0;
      this.drag.dy = 0;
      this.drag.moved = 0;
      this.drag.start = performance.now();
      this.state.target = -1;
      this.wake();
    };

    this.onPointerMove = event => {
      if (!this.drag.active || event.pointerId !== this.drag.id) return;
      const dx = event.clientX - this.drag.x;
      const dy = event.clientY - this.drag.y;
      this.drag.x = event.clientX;
      this.drag.y = event.clientY;
      this.drag.dx += dx;
      this.drag.dy += dy;
      this.drag.moved += Math.hypot(dx, dy);
      this.wake();
    };

    this.onPointerUp = event => {
      if (!this.drag.active || event.pointerId !== this.drag.id) return;
      this.drag.active = false;
      canvas.releasePointerCapture?.(event.pointerId);
      if (this.drag.moved < 6 && performance.now() - this.drag.start < 450) {
        const index = this.pick(event.clientX, event.clientY);
        if (index >= 0) {
          this.activate(index);
        }
      }
      this.wake();
    };

    this.onKeyDown = event => {
      const directions = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
      if (directions[event.key]) {
        event.preventDefault();
        this.goTo(this.neighbor(this.state.target >= 0 ? this.state.target : this.state.front, directions[event.key]));
      } else if (event.key === 'Enter' && (event.target === root || event.target === canvas)) {
        event.preventDefault();
        this.activate(this.state.front);
      }
    };

    this.onEnter = () => {
      this.state.hovered = true;
    };
    this.onLeave = () => {
      this.state.hovered = false;
      this.wake();
    };
    this.onFocusIn = () => {
      this.state.focused = true;
    };
    this.onFocusOut = event => {
      if (root.contains(event.relatedTarget)) return;
      this.state.focused = false;
      this.wake();
    };

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    root.addEventListener('keydown', this.onKeyDown);
    root.addEventListener('pointerenter', this.onEnter);
    root.addEventListener('pointerleave', this.onLeave);
    root.addEventListener('focusin', this.onFocusIn);
    root.addEventListener('focusout', this.onFocusOut);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(root);

    this.visibilityObserver = new IntersectionObserver(entries => {
      this.visible = entries.some(entry => entry.isIntersecting);
      if (this.visible) {
        this.last = 0;
        this.wake();
      }
    });
    this.visibilityObserver.observe(root);
  }

  destroy() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.timer);

    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.root.removeEventListener('keydown', this.onKeyDown);
    this.root.removeEventListener('pointerenter', this.onEnter);
    this.root.removeEventListener('pointerleave', this.onLeave);
    this.root.removeEventListener('focusin', this.onFocusIn);
    this.root.removeEventListener('focusout', this.onFocusOut);

    this.resizeObserver?.disconnect();
    this.visibilityObserver?.disconnect();

    const gl = this.gl;
    if (gl) {
      gl.deleteTexture(this.atlasTexture);
      gl.deleteBuffer(this.cornerBuffer);
      gl.deleteBuffer(this.indexBuffer);
      gl.deleteBuffer(this.tileBuffer);
      gl.deleteVertexArray(this.vao);
      gl.deleteProgram(this.program);
    }
    this.root.innerHTML = '';
  }
}

export function mountInfiniteMenu(container, options = {}) {
  return new VanillaInfiniteMenu(container, options);
}

export default VanillaInfiniteMenu;
