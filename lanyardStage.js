/* ==============================================================
   INFINITE VOID — MINIMALIST BLACK & WHITE LANYARD ENGINE
   Clean black & white badge cards matching reference design
   Front: White card, subtle logo, @handle, B&W portrait, Name below
   Back:  Assigned Crew Role (Team Leader, Coding, Researcher, Speaker)
   Strap: Pure dark woven strap (#111111), polished silver clamp
   Single continuous 3D WebGL scene with 6 cards in 1 row & full overlap
   ============================================================== */

import * as THREE from 'three';

// ── Configuration Constants (Exact from React Bits) ──────────
const CARD_SIZES = {
  portrait: [1.6, 2.25],
  landscape: [2.25, 1.6]
};
const ANCHORS = { left: 0.27, center: 0.5, right: 0.73 };
const THICKNESS = 0.018;
const BEVEL = 0.007;
const JOINTS = 4;
const NODE_WEIGHT = 1 / 0.05;
const MAX_STEP = 1 / 960;
const ITERATIONS = 2;
const SAMPLES = 72;
const FOV = 24;
const STRAP_WIDTH = 0.36;
const RING_RADIUS = 0.095;
const RING_TUBE = 0.0135;
const EYELET_RADIUS = 0.036;
const CLAMP_BODY = 0.15;
const FACE_WIDTH = 1200;

const FINISHES = {
  glossy: { roughness: 0.38, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, foil: 0, anisotropy: 0 },
  matte: { roughness: 0.85, metalness: 0, clearcoat: 0, clearcoatRoughness: 0.6, foil: 0, anisotropy: 0 },
  holographic: { roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, foil: 1, anisotropy: 0 },
  metallic: { roughness: 0.36, metalness: 0.75, clearcoat: 0.5, clearcoatRoughness: 0.18, foil: 0, anisotropy: 0.7 }
};

const BAND_COLUMNS = [0, 0.07, 0.93, 1];
const BAND_BEND = [-0.95, -0.28, 0.28, 0.95];
const FLIP_SPIN = 9;

const METALS = {
  silver: { color: '#d9dce2', roughness: 0.16 },
  gold: { color: '#e4b965', roughness: 0.20 },
  graphite: { color: '#4d4f55', roughness: 0.28 }
};

// ── Math & Color Helpers ─────────────────────────────────────
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (a, b, t) => a + (b - a) * t;

const parseColor = (value, fallback) => {
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return fallback;
    ctx.fillStyle = '#000000';
    ctx.fillStyle = value;
    const resolved = ctx.fillStyle;
    if (resolved.startsWith('#')) {
      const n = parseInt(resolved.slice(1), 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    const parts = resolved.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return fallback;
    return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255];
  } catch {
    return fallback;
  }
};

const luminance = rgb => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
const toCss = (rgb, alpha = 1) =>
  `rgba(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)}, ${alpha})`;

const seeded = start => {
  let state = start >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const traceRoundedRect = (path, x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const k = r * 0.4477;
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.bezierCurveTo(x + width - k, y, x + width, y + k, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.bezierCurveTo(x + width, y + height - k, x + width - k, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.bezierCurveTo(x + k, y + height, x, y + height - k, x, y + height - r);
  path.lineTo(x, y + r);
  path.bezierCurveTo(x, y + k, x + k, y, x + r, y);
};

const loadImage = (cache, url) => {
  if (!url) return Promise.resolve(null);
  if (cache.has(url)) return cache.get(url);
  const promise = new Promise(resolve => {
    const clean = url.replace(/^(\.\/|\/)/, '');
    const withoutPublic = clean.replace(/^public\//, '');
    const candidates = Array.from(new Set([
      url,
      '/' + withoutPublic,
      withoutPublic,
      'public/' + withoutPublic,
      './public/' + withoutPublic,
      'assets/' + withoutPublic.replace(/^assets\//, ''),
      '/assets/' + withoutPublic.replace(/^assets\//, '')
    ]));

    let idx = 0;
    const tryNext = () => {
      if (idx >= candidates.length) return resolve(null);
      const u = candidates[idx++];
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => tryNext();
      image.src = u;
    };
    tryNext();
  });
  cache.set(url, promise);
  return promise;
};

// ── Geometries ───────────────────────────────────────────────
const cardLayout = (orientation, cornerRadius) => {
  const [width, height] = CARD_SIZES[orientation] || CARD_SIZES.portrait;
  const radius = mix(0.03, Math.min(width, height) * 0.2, clamp(cornerRadius, 0, 1));
  const slot = { width: 0.34, height: 0.07, y: height / 2 - 0.13 };
  const ringY = height / 2 - 0.055;
  return { width, height, radius, slot, ringY, hangY: ringY + RING_RADIUS };
};

const buildCardGeometry = layout => {
  const { width, height, radius, slot } = layout;
  const outline = new THREE.Shape();
  traceRoundedRect(
    outline,
    -width / 2 + BEVEL,
    -height / 2 + BEVEL,
    width - BEVEL * 2,
    height - BEVEL * 2,
    Math.max(radius - BEVEL, 0.005)
  );
  const hole = new THREE.Path();
  traceRoundedRect(
    hole,
    -slot.width / 2 - BEVEL,
    slot.y - slot.height / 2 - BEVEL,
    slot.width + BEVEL * 2,
    slot.height + BEVEL * 2,
    slot.height / 2 + BEVEL
  );
  outline.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(outline, {
    depth: THICKNESS,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 5,
    curveSegments: 24
  });
  body.translate(0, 0, -THICKNESS / 2);
  const face = new THREE.ShapeGeometry(outline, 24);
  const position = face.getAttribute('position');
  const uv = face.getAttribute('uv');
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) + width / 2) / width, (position.getY(i) + height / 2) / height);
  }
  uv.needsUpdate = true;

  // Back face: correct UV orientation so text reads normally from left to right
  const backFace = new THREE.ShapeGeometry(outline, 24);
  const backPos = backFace.getAttribute('position');
  const backUv = backFace.getAttribute('uv');
  for (let i = 0; i < backPos.count; i++) {
    backUv.setXY(i, (backPos.getX(i) + width / 2) / width, (backPos.getY(i) + height / 2) / height);
  }
  backUv.needsUpdate = true;

  return { body, face, backFace };
};

const buildClampGeometry = width => {
  const shape = new THREE.Shape();
  const w = width * 1.16;
  traceRoundedRect(shape, -w / 2 + 0.014, -CLAMP_BODY / 2 + 0.014, w - 0.028, CLAMP_BODY - 0.028, 0.024);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 6,
    curveSegments: 10
  });
  geometry.translate(0, 0, -0.01);
  return geometry;
};

const buildBandGeometry = count => {
  const columns = BAND_COLUMNS.length;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * columns * 2), 2));
  const index = [];
  for (let i = 0; i < count - 1; i++) {
    for (let c = 0; c < columns - 1; c++) {
      const a = i * columns + c;
      index.push(a, a + columns, a + 1, a + 1, a + columns, a + columns + 1);
    }
  }
  geometry.setIndex(index);
  return geometry;
};

// ── Environment & Textures ───────────────────────────────────
const buildEnvironment = renderer => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.04, 0.04, 0.045);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const materials = [];
  const panel = (intensity, position, scale, rotation = 0) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(intensity, intensity, intensity),
      side: THREE.DoubleSide
    });
    materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(scale[0], scale[1], 1);
    mesh.lookAt(0, 0, 0);
    mesh.rotateZ(rotation);
    scene.add(mesh);
  };
  panel(2.6, [0, 4.5, 8], [9, 4]);
  panel(6, [-5.5, 0.5, 7], [0.9, 14]);
  panel(4, [5, -0.5, 8], [0.6, 14]);
  panel(3.5, [0, -1, 9], [24, 0.35], Math.PI / 3);
  panel(2.5, [1, 2.5, 9], [24, 0.2], Math.PI / 3);
  panel(1.4, [0, 6, -6], [12, 4]);
  panel(0.5, [0, -7, 1], [16, 6]);
  panel(0.9, [8, 0, -2], [4, 10]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  geometry.dispose();
  materials.forEach(material => material.dispose());
  return target;
};

const makeCanvasTexture = (canvas, anisotropy) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
};

const buildGrainTexture = () => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const random = seeded(7);
  const field = Float32Array.from({ length: size * size }, () => random());
  const height = (x, y) => {
    let sum = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) sum += field[((y + j + size) % size) * size + ((x + i + size) % size)];
    }
    return (sum / 9) * 1.6;
  };
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = height((x - 1 + size) % size, y) - height((x + 1) % size, y);
      const ny = height(x, (y - 1 + size) % size) - height(x, (y + 1) % size);
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      image.data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      image.data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 7);
  return texture;
};

const buildWeaveTexture = () => {
  const size = 128;
  const threads = 8;
  const random = seeded(19);
  const fiber = Float32Array.from({ length: size * size }, () => random());
  const profile = f => Math.sqrt(Math.max(0, 1 - 4 * f * f));
  const height = (x, y) => {
    const px = ((x % size) + size) % size;
    const py = ((y % size) + size) % size;
    const u = (px / size) * threads;
    const v = (py / size) * threads;
    const cu = Math.floor(u);
    const cv = Math.floor(v);
    const fu = u - cu - 0.5;
    const fv = v - cv - 0.5;
    const lift = (cu + cv) % 2 === 0;
    const warp = profile(fu) * (0.55 + 0.45 * Math.cos(fv * Math.PI * (lift ? 1 : 0.6)));
    const weft = profile(fv) * (0.55 + 0.45 * Math.cos(fu * Math.PI * (lift ? 0.6 : 1)));
    return (lift ? Math.max(warp, weft * 0.7) : Math.max(weft, warp * 0.7)) + fiber[py * size + px] * 0.08;
  };
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (height(x - 1, y) - height(x + 1, y)) * 1.6;
      const ny = (height(x, y - 1) - height(x, y + 1)) * 1.6;
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
};

// ── Vibrant Blue Woven Strap ("the tie give the blue color ok") ──
const paintStrap = (canvas, image, color) => {
  const across = 256;
  const along = 512;
  canvas.width = across;
  canvas.height = along;
  const ctx = canvas.getContext('2d');
  if (!ctx) return along / across;

  // Rich Electric Blue / Space Navy gradient
  const grad = ctx.createLinearGradient(0, 0, across, 0);
  grad.addColorStop(0, '#002244');
  grad.addColorStop(0.12, '#0066cc');
  grad.addColorStop(0.5, '#00d4ff');
  grad.addColorStop(0.88, '#0066cc');
  grad.addColorStop(1, '#002244');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, across, along);

  // Outer electric cyan edge borders
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(0, 0, 12, along);
  ctx.fillRect(across - 12, 0, 12, along);

  // Contrasting white safety stitching
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let y = 0; y < along; y += 14) {
    ctx.fillRect(20, y, 4, 7);
    ctx.fillRect(across - 24, y, 4, 7);
  }

  // Authentic diagonal fabric weave texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  for (let y = 0; y < along; y += 4) {
    ctx.fillRect(0, y, across, 2);
  }
  return along / across;
};

// ── FRONT CARD PAINTER: Image Fully Covers the Card ───────────
function drawCardFront(canvas, img) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // Crisp white base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // The image must fully cover the card edge-to-edge
  if (img) {
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }
}

// Helper: Canvas 2D rounded rectangle
function drawCanvasRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawInstagramIcon(ctx, cx, cy, size) {
  const r = size / 2;
  ctx.save();
  // Clean pill touch button base
  ctx.fillStyle = '#f3f4f6';
  drawCanvasRoundedRect(ctx, cx - r - 18, cy - r - 18, size + 36, size + 36, size * 0.32);
  ctx.fill();

  // Subtle button border
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
  drawCanvasRoundedRect(ctx, cx - r - 18, cy - r - 18, size + 36, size + 36, size * 0.32);
  ctx.stroke();

  // Instagram camera outer frame
  ctx.lineWidth = size * 0.096;
  ctx.strokeStyle = '#0a0a0a';
  drawCanvasRoundedRect(ctx, cx - r, cy - r, size, size, size * 0.28);
  ctx.stroke();

  // Center camera lens
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
  ctx.stroke();

  // Flash dot
  ctx.beginPath();
  ctx.arc(cx + size * 0.25, cy - size * 0.25, size * 0.065, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0a';
  ctx.fill();
  ctx.restore();
}

function drawLinkedInIcon(ctx, cx, cy, size) {
  const r = size / 2;
  ctx.save();
  // Clean pill touch button base
  ctx.fillStyle = '#f3f4f6';
  drawCanvasRoundedRect(ctx, cx - r - 18, cy - r - 18, size + 36, size + 36, size * 0.32);
  ctx.fill();

  // Subtle button border
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
  drawCanvasRoundedRect(ctx, cx - r - 18, cy - r - 18, size + 36, size + 36, size * 0.32);
  ctx.stroke();

  // LinkedIn solid badge
  ctx.fillStyle = '#0a0a0a';
  drawCanvasRoundedRect(ctx, cx - r, cy - r, size, size, size * 0.24);
  ctx.fill();

  // 'in' text in crisp white
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(size * 0.68)}px "Space Grotesk", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '0px';
  ctx.fillText('in', cx, cy + size * 0.02);
  ctx.restore();
}

// ── BACK CARD PAINTER: Big Bold Typography, Socials & Barcode ──
function drawCardBack(canvas, member) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // Crisp pure white card back
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Subtle clean card inner perimeter frame
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.lineWidth = 4;
  drawCanvasRoundedRect(ctx, 45, 45, w - 90, h - 90, 48);
  ctx.stroke();

  // 1. Team Name: INFINITE VOID (Huge, bold, maximum legibility)
  ctx.fillStyle = '#050505';
  ctx.font = '900 160px "Space Grotesk", "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '10px';
  ctx.fillText('INFINITE VOID', w / 2, 380);

  // Cyan & Black dual accent line
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(w / 2 - 320, 465, 640, 8);
  ctx.fillStyle = '#050505';
  ctx.fillRect(w / 2 - 50, 463, 100, 12);

  // 2. Position / Role (Huge, bold, maximum legibility)
  ctx.fillStyle = '#050505';
  ctx.font = '800 135px "Space Grotesk", "Rajdhani", sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText(member.role.toUpperCase(), w / 2, 590);

  // 3. Social Icons: Instagram & LinkedIn below position (Much larger and prominent)
  const iconSize = 200;
  const iconY = 850;
  const instaX = 410;
  const linkedX = 790;

  drawInstagramIcon(ctx, instaX, iconY, iconSize);
  drawLinkedInIcon(ctx, linkedX, iconY, iconSize);

  // Crisp readable labels below icons
  ctx.fillStyle = 'rgba(5, 5, 5, 0.9)';
  ctx.font = '800 44px "Space Grotesk", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('INSTAGRAM', instaX, 995);
  ctx.fillText('LINKEDIN', linkedX, 995);

  // 4. Barcode below socials
  const barY = 1110;
  const barH = 290;
  const rng = seeded(member.index * 777 + 99);
  let curX = 140;
  ctx.fillStyle = '#050505';
  while (curX < w - 140) {
    const barW = Math.floor(rng() * 11 + 4);
    const gap = Math.floor(rng() * 10 + 4);
    ctx.fillRect(curX, barY, barW, barH);
    curX += barW + gap;
  }

  // Security pass ID text below barcode
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.font = '600 34px "Space Grotesk", monospace';
  ctx.letterSpacing = '6px';
  ctx.fillText(`SEC-ID // IV-${member.id.toUpperCase()}-2026`, w / 2, 1460);
}

// ── Physics Simulation (Exact from React Bits) ───────────────
const createSimulation = () => {
  const vectors = () => Array.from({ length: JOINTS + 1 }, () => new THREE.Vector3());
  return {
    nodes: vectors(),
    previous: vectors(),
    velocities: vectors(),
    lengths: new Float64Array(JOINTS),
    impulses: new Float64Array(JOINTS),
    rest: 1,
    anchor: new THREE.Vector3(),
    body: {
      position: new THREE.Vector3(),
      previous: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      previousQuaternion: new THREE.Quaternion(),
      angular: new THREE.Vector3(),
      mass: 1,
      inverseInertia: new THREE.Vector3(1, 1, 1),
      hang: new THREE.Vector3()
    },
    grab: null,
    turn: 0,
    twist: 0,
    twistRaw: 0,
    calm: 0
  };
};

const scratch = {
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
  c: new THREE.Vector3(),
  d: new THREE.Vector3(),
  e: new THREE.Vector3(),
  f: new THREE.Vector3(),
  g: new THREE.Vector3(),
  pin: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  r: new THREE.Quaternion()
};

const applyInverseInertia = (body, vector, out) => {
  scratch.r.copy(body.quaternion).invert();
  out.copy(vector).applyQuaternion(scratch.r);
  out.set(out.x * body.inverseInertia.x, out.y * body.inverseInertia.y, out.z * body.inverseInertia.z);
  return out.applyQuaternion(body.quaternion);
};

const rotateBody = (q, w) => {
  const { x: qx, y: qy, z: qz, w: qw } = q;
  q.x += 0.5 * (w.x * qw + w.y * qz - w.z * qy);
  q.y += 0.5 * (w.y * qw + w.z * qx - w.x * qz);
  q.z += 0.5 * (w.z * qw + w.x * qy - w.y * qx);
  q.w += 0.5 * (-w.x * qx - w.y * qy - w.z * qz);
  q.normalize();
};

const bodyWeight = (body, r, normal) => {
  const rn = scratch.c.crossVectors(r, normal);
  return 1 / body.mass + rn.dot(applyInverseInertia(body, rn, scratch.d));
};

const pushBody = (body, r, impulse) => {
  body.position.addScaledVector(impulse, 1 / body.mass);
  rotateBody(body.quaternion, applyInverseInertia(body, scratch.e.crossVectors(r, impulse), scratch.f));
};

const solveSegment = (sim, i, h, physics) => {
  const { nodes, body } = sim;
  const a = nodes[i];
  const wa = i === 0 ? 0 : NODE_WEIGHT;
  const last = i === JOINTS - 1;
  const r = scratch.g;
  let b = nodes[i + 1];
  if (last) {
    r.copy(body.hang).applyQuaternion(body.quaternion);
    b = scratch.b.copy(body.position).add(r);
  }
  const delta = scratch.a.subVectors(b, a);
  const length = delta.length();
  const stretch = length - sim.rest;
  if (stretch <= 0 || length < 1e-9) return;
  const normal = delta.divideScalar(length);
  const wb = last ? bodyWeight(body, r, normal) : NODE_WEIGHT;
  const rate = (length - sim.lengths[i]) / h;
  const tension =
    physics.hold * Math.tanh((physics.stiffness * stretch) / physics.hold) +
    physics.spring * stretch +
    physics.bandDamping * Math.max(0, rate);
  const room = tension * h * h - sim.impulses[i];
  if (room <= 0) return;
  const lambda = Math.min(stretch / (wa + wb), room);
  sim.impulses[i] += lambda;
  if (wa) a.addScaledVector(normal, lambda * wa);
  if (last) pushBody(body, r, normal.multiplyScalar(-lambda));
  else b.addScaledVector(normal, -lambda * wb);
};

const solvePin = (body, grab, target) => {
  const r = scratch.g.copy(grab.local).applyQuaternion(body.quaternion);
  const delta = scratch.a.copy(target).sub(body.position).sub(r);
  const distance = delta.length();
  if (distance < 1e-9) return;
  const normal = delta.divideScalar(distance);
  const lambda = distance / bodyWeight(body, r, normal);
  pushBody(body, r, normal.multiplyScalar(lambda));
};

const placeHanging = (sim, layout, intro) => {
  const { nodes, previous, velocities, body, anchor } = sim;
  nodes[0].copy(anchor);
  for (let i = 1; i <= JOINTS; i++) {
    nodes[i].copy(nodes[i - 1]);
    if (intro) nodes[i].x += sim.rest;
    else nodes[i].y -= sim.rest;
  }
  body.quaternion.identity();
  if (intro) body.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  body.hang.set(0, layout.hangY, 0);
  const offset = scratch.a.copy(body.hang).applyQuaternion(body.quaternion);
  body.position.copy(nodes[JOINTS]).sub(offset);
  body.previous.copy(body.position);
  body.previousQuaternion.copy(body.quaternion);
  body.velocity.set(0, 0, 0);
  body.angular.set(0, 0, 0);
  for (let i = 0; i <= JOINTS; i++) {
    previous[i].copy(nodes[i]);
    velocities[i].set(0, 0, 0);
  }
  sim.lengths.fill(sim.rest);
  sim.turn = 0;
  sim.twist = 0;
  sim.twistRaw = 0;
  sim.calm = 0;
};

const configureSimulation = (sim, layout, length) => {
  sim.rest = length / JOINTS;
  const { width, height } = layout;
  const body = sim.body;
  const t = THICKNESS + BEVEL * 2;
  body.mass = 1;
  body.inverseInertia.set(
    12 / (height * height + t * t),
    12 / (width * width + t * t),
    12 / (width * width + height * height)
  );
  body.hang.set(0, layout.hangY, 0);
};

const stepSimulation = (sim, dt, physics, time) => {
  const steps = Math.max(1, Math.ceil(dt / MAX_STEP - 1e-6));
  const h = dt / steps;
  const { nodes, previous, velocities, body } = sim;
  const windX = physics.breeze * (Math.sin(time * 0.53) * 0.7 + Math.sin(time * 1.31 + 1.7) * 0.3) * 3;
  const windZ = physics.breeze * Math.sin(time * 0.37 + 0.6) * 2;
  const grab = sim.grab;
  const pin = scratch.pin;
  const nodeDrag = Math.exp(-physics.nodeDrag * h);
  const linearDrag = Math.exp(-physics.linearDrag * h);
  const angularDrag = Math.exp(-physics.angularDrag * h);

  for (let s = 0; s < steps; s++) {
    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i];
      v.y -= physics.gravity * h;
      v.x += windX * h;
      v.z += windZ * h;
      previous[i].copy(nodes[i]);
      nodes[i].addScaledVector(v, h);
    }

    body.previous.copy(body.position);
    body.previousQuaternion.copy(body.quaternion);
    const q = body.quaternion;
    if (grab) {
      const turn = scratch.q.copy(grab.rotation).multiply(scratch.r.copy(q).invert());
      if (turn.w < 0) turn.set(-turn.x, -turn.y, -turn.z, -turn.w);
      const torque = scratch.a.set(turn.x, turn.y, turn.z).multiplyScalar(2 * physics.grip);
      torque.addScaledVector(body.angular, -physics.gripDamping);
      body.angular.addScaledVector(applyInverseInertia(body, torque, scratch.b), h);
    }
    const up = scratch.a.set(0, 1, 0).applyQuaternion(q);
    const front = scratch.b.set(-up.x * up.z, -up.y * up.z, 1 - up.z * up.z);
    if (front.lengthSq() > 1e-3) {
      const facing = scratch.d.set(0, 0, 1).applyQuaternion(q);
      const raw = Math.atan2(scratch.e.crossVectors(front, facing).dot(up), front.dot(facing));
      let turned = raw - sim.twistRaw;
      if (turned > Math.PI) turned -= Math.PI * 2;
      else if (turned < -Math.PI) turned += Math.PI * 2;
      sim.twist += turned;
      sim.twistRaw = raw;
    }
    if (!grab) {
      const spin = body.angular.dot(up);
      body.angular.addScaledVector(up, (physics.twist * (sim.turn - sim.twist) - physics.twistDamping * spin) * h);
    }
    body.velocity.y -= physics.gravity * h;
    body.velocity.x += windX * 0.35 * h;
    body.velocity.z += windZ * 0.35 * h;
    body.position.addScaledVector(body.velocity, h);
    rotateBody(body.quaternion, scratch.f.copy(body.angular).multiplyScalar(h));

    sim.impulses.fill(0);
    if (grab) pin.lerpVectors(grab.from, grab.target, (s + 1) / steps);
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      for (let i = 0; i < JOINTS; i++) solveSegment(sim, i, h, physics);
      if (grab) solvePin(body, grab, pin);
    }

    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i].subVectors(nodes[i], previous[i]).divideScalar(h).multiplyScalar(nodeDrag);
      v.multiplyScalar(1 / (1 + physics.nodeAir * v.length() * h));
    }
    body.velocity.subVectors(body.position, body.previous).divideScalar(h);
    const dq = scratch.q.copy(body.previousQuaternion).invert().premultiply(body.quaternion);
    body.angular.set(dq.x, dq.y, dq.z).multiplyScalar((2 / h) * (dq.w < 0 ? -1 : 1));

    const normal = scratch.a.set(0, 0, 1).applyQuaternion(body.quaternion);
    const across = body.velocity.dot(normal);
    const along = scratch.b.copy(body.velocity).addScaledVector(normal, -across);
    along.multiplyScalar(1 / (1 + physics.air * along.length() * h));
    body.velocity
      .copy(along)
      .addScaledVector(normal, across / (1 + physics.broadside * Math.abs(across) * h))
      .multiplyScalar(linearDrag);
    body.angular.multiplyScalar(angularDrag / (1 + physics.spinAir * body.angular.length() * h));
    if (body.velocity.lengthSq() > 3600) body.velocity.setLength(60);
    if (body.angular.lengthSq() > 1600) body.angular.setLength(40);

    nodes[JOINTS].copy(body.hang).applyQuaternion(body.quaternion).add(body.position);
    for (let i = 0; i < JOINTS; i++) sim.lengths[i] = nodes[i].distanceTo(nodes[i + 1]);
  }

  if (grab) grab.from.copy(grab.target);

  let energy = body.velocity.lengthSq() + body.angular.lengthSq() * 0.3;
  for (let i = 1; i < JOINTS; i++) energy += velocities[i].lengthSq() * 0.05;
  sim.calm = energy < 2e-4 ? sim.calm + dt : 0;
};

// ==============================================================
// ── MASTER: Unified 3D Lanyard Stage (6 Cards in 1 Row) ───────
// ==============================================================
export function initUnifiedLanyardStage() {
  const stage = document.getElementById('team-lanyard-stage');
  if (!stage) return;
  stage.innerHTML = '';

  // 1. Single WebGL Renderer (Shared for all 6 cards)
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    console.error('WebGL renderer init error:', err);
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const canvas = renderer.domElement;
  canvas.className = 'team-stage-canvas';
  canvas.setAttribute('aria-label', 'Interactive 3D Team Lanyard Badges');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.cursor = 'default';
  canvas.style.touchAction = 'none';
  stage.appendChild(canvas);

  // 2. Unified Scene, HDRI Environment & Realistic Lighting
  const scene = new THREE.Scene();
  const environment = buildEnvironment(renderer);
  scene.environment = environment.texture;

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(-2.5, 4, 6);
  const fillLight = new THREE.DirectionalLight(0x00f0ff, 0.7);
  fillLight.position.set(3, -1, 4);
  const topLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
  topLight.position.set(0.5, 4.5, 8);
  const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(keyLight, fillLight, topLight, ambLight);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  camera.position.set(0, 0, 14);
  camera.lookAt(0, 0, 0);

  const anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  const grain = buildGrainTexture();
  const weave = buildWeaveTexture();
  const imageCache = new Map();
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  // 3. Team Member Data (6 Cards: Same image for all 6, names on card, assigned positions)
  const MEMBERS = [
    {
      id: 'rifa',
      name: 'Rifa',
      role: 'Team Lead',
      handle: '@rifa',
      front: '/assets/reference_badge.png?v=20261021j',
      strap: '#0077ff',
      color: '#ffffff',
      metal: 'silver',
      finish: 'glossy',
      instagram: 'https://www.instagram.com/rifa.teamlead',
      linkedin: 'https://www.linkedin.com/in/rifa-teamlead'
    },
    {
      id: 'rashini',
      name: 'Rashini',
      role: 'Coding',
      handle: '@rashini',
      front: '/assets/reference_badge.png?v=20261021j',
      strap: '#0077ff',
      color: '#ffffff',
      metal: 'silver',
      finish: 'glossy',
      instagram: 'https://www.instagram.com/rashini.dev',
      linkedin: 'https://www.linkedin.com/in/rashini-coding'
    },
    {
      id: 'atheeqa',
      name: 'Atheeqa',
      role: 'Coding',
      handle: '@atheeqa',
      front: '/assets/reference_badge.png?v=20261021j',
      strap: '#0077ff',
      color: '#ffffff',
      metal: 'silver',
      finish: 'glossy',
      instagram: 'https://www.instagram.com/atheeqa.dev',
      linkedin: 'https://www.linkedin.com/in/atheeqa-coding'
    },
    {
      id: 'nizlan',
      name: 'Nizlan',
      role: 'Researcher',
      handle: '@nizlan',
      front: '/assets/reference_badge.png?v=20261021j',
      strap: '#0077ff',
      color: '#ffffff',
      metal: 'silver',
      finish: 'glossy',
      instagram: 'https://www.instagram.com/nizlan.cosmic',
      linkedin: 'https://www.linkedin.com/in/mohomad-nizlan'
    },
    {
      id: 'byon',
      name: 'Byon',
      role: 'Researcher',
      handle: '@byon',
      front: '/assets/reference_badge.png?v=20261021j',
      strap: '#0077ff',
      color: '#ffffff',
      metal: 'silver',
      finish: 'glossy',
      instagram: 'https://www.instagram.com/byon.research',
      linkedin: 'https://www.linkedin.com/in/byon-void'
    },
    {
      id: 'Luqman',
      name: 'Luqman',
      role: 'Speaker',
      handle: '@luqman',
      front: '/assets/reference_badge.png?v=20261021j',
      strap: '#0077ff',
      color: '#ffffff',
      metal: 'silver',
      finish: 'glossy',
      instagram: 'https://www.instagram.com/lukman.speaker',
      linkedin: 'https://www.linkedin.com/in/lukman-speaker'
    }
  ];

  // 4. Build 6 Cards with Exact Shaders & Geometry
  const cards = MEMBERS.map((opts, index) => {
    opts.index = index;
    const layout = cardLayout('portrait', 0.3);
    const geometry = buildCardGeometry(layout);

    const frontCanvas = document.createElement('canvas');
    const backCanvas = document.createElement('canvas');
    const strapCanvas = document.createElement('canvas');
    const frontTexture = makeCanvasTexture(frontCanvas, anisotropy);
    const backTexture = makeCanvasTexture(backCanvas, anisotropy);
    const strapTexture = makeCanvasTexture(strapCanvas, anisotropy);
    strapTexture.wrapS = THREE.ClampToEdgeWrapping;
    strapTexture.wrapT = THREE.RepeatWrapping;

    const frontMaterial = new THREE.MeshPhysicalMaterial({
      map: frontTexture,
      normalMap: grain,
      normalScale: new THREE.Vector2(0.04, 0.04)
    });
    const backMaterial = new THREE.MeshPhysicalMaterial({
      map: backTexture,
      normalMap: grain,
      normalScale: new THREE.Vector2(0.04, 0.04)
    });

    const edgeMaterial = new THREE.MeshPhysicalMaterial();
    const metalMaterial = new THREE.MeshStandardMaterial({ metalness: 1 });
    const bandMaterial = new THREE.MeshPhysicalMaterial({
      map: strapTexture,
      normalMap: weave,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughness: 0.55,
      metalness: 0.05,
      sheen: 1,
      sheenRoughness: 0.35,
      sheenColor: new THREE.Color(0x00d4ff),
      side: THREE.DoubleSide
    });

    const finish = FINISHES[opts.finish] || FINISHES.glossy;
    frontMaterial.roughness = finish.roughness;
    frontMaterial.metalness = finish.metalness;
    frontMaterial.clearcoat = finish.clearcoat;
    frontMaterial.clearcoatRoughness = finish.clearcoatRoughness;
    frontMaterial.anisotropy = finish.anisotropy;

    // Back face: Matte white card with zero glare so text is 100% crisp & visible
    backMaterial.roughness = 0.95;
    backMaterial.metalness = 0;
    backMaterial.clearcoat = 0;
    backMaterial.anisotropy = finish.anisotropy;

    // Pure white card edge ("card must be white man")
    edgeMaterial.color.set('#ffffff');
    edgeMaterial.roughness = 0.3;
    edgeMaterial.metalness = 0;
    edgeMaterial.clearcoat = 1;
    edgeMaterial.clearcoatRoughness = 0.08;

    const metalLook = METALS[opts.metal] || METALS.silver;
    metalMaterial.color.set(metalLook.color);
    metalMaterial.roughness = metalLook.roughness;

    let tileRatio = 2;
    const repaintStrap = () => {
      tileRatio = paintStrap(strapCanvas, null, parseColor(opts.strap, [0, 0.85, 1]));
      strapTexture.needsUpdate = true;
    };
    repaintStrap();

    // Paint Front & Back
    let frontImageObj = null;
    const paintCardFaces = (img) => {
      if (img) frontImageObj = img;
      const width = FACE_WIDTH;
      const height = Math.round((FACE_WIDTH * layout.height) / layout.width);
      if (frontCanvas.width !== width || frontCanvas.height !== height) {
        frontCanvas.width = width;
        frontCanvas.height = height;
        backCanvas.width = width;
        backCanvas.height = height;
      }
      drawCardFront(frontCanvas, frontImageObj, opts);
      drawCardBack(backCanvas, opts);
      frontTexture.needsUpdate = true;
      backTexture.needsUpdate = true;
    };
    paintCardFaces(null);

    loadImage(imageCache, opts.front).then(img => {
      if (img) paintCardFaces(img);
    });

    const cardGroup = new THREE.Group();
    const bodyMesh = new THREE.Mesh(geometry.body, edgeMaterial);
    const frontMesh = new THREE.Mesh(geometry.face, frontMaterial);
    const backMesh = new THREE.Mesh(geometry.backFace, backMaterial);
    frontMesh.position.z = THICKNESS / 2 + BEVEL + 0.0006;
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -(THICKNESS / 2 + BEVEL + 0.0006);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 18, 72), metalMaterial);
    ring.rotation.y = Math.PI / 2 - 0.7;
    ring.position.set(0, layout.ringY, 0);

    cardGroup.add(bodyMesh, frontMesh, backMesh, ring);
    scene.add(cardGroup);

    const strapScale = STRAP_WIDTH * 0.65;
    const clampGroup = new THREE.Group();
    const clampMesh = new THREE.Mesh(buildClampGeometry(strapScale), metalMaterial);
    clampMesh.position.y = EYELET_RADIUS + CLAMP_BODY / 2 - 0.004;
    const eyelet = new THREE.Mesh(new THREE.TorusGeometry(EYELET_RADIUS, 0.0105, 14, 40), metalMaterial);
    clampGroup.add(clampMesh, eyelet);
    scene.add(clampGroup);

    const bandGeometry = buildBandGeometry(SAMPLES);
    const band = new THREE.Mesh(bandGeometry, bandMaterial);
    band.frustumCulled = false;
    scene.add(band);

    const sim = createSimulation();
    const controls = [];
    const mouth = new THREE.Vector3();
    const tuck = new THREE.Vector3();
    const curve = new THREE.CatmullRomCurve3(controls, false, 'centripetal');
    const points = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
    const sides = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
    const bends = BAND_BEND.map(angle => [Math.cos(angle), Math.sin(angle)]);
    const work = {
      tangent: new THREE.Vector3(),
      toCamera: new THREE.Vector3(),
      basis: new THREE.Matrix4(),
      up: new THREE.Vector3(),
      across: new THREE.Vector3(),
      facing: new THREE.Vector3(),
      end: new THREE.Vector3()
    };

    // Dynamic band stretching and torsion (Exact from React Bits)
    const updateBand = () => {
      const hang = sim.nodes[JOINTS];
      const reach = EYELET_RADIUS + CLAMP_BODY + 0.05;
      let guide = JOINTS - 1;
      while (guide > 0 && sim.nodes[guide].distanceTo(hang) < reach * 1.1) guide--;
      const axis = work.up.subVectors(sim.nodes[guide], hang);
      if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0).applyQuaternion(sim.body.quaternion);
      axis.normalize();
      mouth.copy(hang).addScaledVector(axis, reach);
      tuck.copy(hang).addScaledVector(axis, EYELET_RADIUS + CLAMP_BODY * 0.35);
      controls.length = 0;
      for (let i = 0; i <= guide; i++) controls.push(sim.nodes[i]);
      controls.push(mouth, tuck);
      curve.updateArcLengths();
      for (let i = 0; i < SAMPLES; i++) curve.getPointAt(i / (SAMPLES - 1), points[i]);
      const length = curve.getLength();
      const held = 1 - mouth.distanceTo(tuck) / Math.max(length, 0.001);
      const position = bandGeometry.getAttribute('position');
      const normal = bandGeometry.getAttribute('normal');
      const uv = bandGeometry.getAttribute('uv');
      const columns = BAND_COLUMNS.length;
      const restLength = sim.rest * JOINTS;
      const repeats = restLength / (strapScale * tileRatio);
      const width = strapScale / Math.pow(Math.max(1, length / Math.max(restLength, 0.001)), 0.35);
      const { tangent, toCamera, across, facing } = work;

      for (let i = 0; i < SAMPLES; i++) {
        tangent.subVectors(points[Math.min(SAMPLES - 1, i + 1)], points[Math.max(0, i - 1)]);
        if (tangent.lengthSq() < 1e-12) tangent.set(0, -1, 0);
        tangent.normalize();
        toCamera.subVectors(camera.position, points[i]).normalize();
        const side = sides[i].crossVectors(toCamera, tangent);
        if (side.lengthSq() < 1e-10) side.copy(i > 0 ? sides[i - 1] : scratch.a.set(1, 0, 0));
        side.normalize();
        if (i > 0 && side.dot(sides[i - 1]) < 0) side.negate();
        const angle = -sim.twist * Math.pow(Math.min(1, i / (SAMPLES - 1) / held), 1.3);
        facing.crossVectors(tangent, side);
        across.copy(side).multiplyScalar(Math.cos(angle)).addScaledVector(facing, Math.sin(angle));
        facing.crossVectors(tangent, across);
        const p = points[i];
        const v = (1 - i / (SAMPLES - 1)) * repeats;
        for (let c = 0; c < columns; c++) {
          const k = i * columns + c;
          const offset = (BAND_COLUMNS[c] - 0.5) * width;
          const [bendCos, bendSin] = bends[c];
          position.setXYZ(k, p.x + across.x * offset, p.y + across.y * offset, p.z + across.z * offset);
          normal.setXYZ(
            k,
            facing.x * bendCos + across.x * bendSin,
            facing.y * bendCos + across.y * bendSin,
            facing.z * bendCos + across.z * bendSin
          );
          uv.setXY(k, BAND_COLUMNS[c], v);
        }
      }
      work.end.copy(across);
      position.needsUpdate = true;
      normal.needsUpdate = true;
      uv.needsUpdate = true;

      across.copy(work.end).addScaledVector(axis, -work.end.dot(axis)).normalize();
      facing.crossVectors(across, axis).normalize();
      work.basis.makeBasis(across, axis, facing);
      clampGroup.quaternion.setFromRotationMatrix(work.basis);
      clampGroup.position.copy(hang);
    };

    const getPhysics = () => {
      const gravity = 40 * clamp(1, 0, 3);
      const weight = Math.max(gravity, 20);
      const springy = clamp(0.5, 0, 1);
      const settle = clamp(0.5, 0, 1);
      return {
        gravity,
        hold: weight * mix(2.2, 5.5, springy),
        stiffness: weight * 10 * JOINTS,
        spring: weight * mix(0.1, 0.4, springy) * JOINTS,
        bandDamping: weight * mix(0.3, 0.08, springy) * JOINTS,
        linearDrag: 0.25 * Math.pow(16, settle),
        angularDrag: 0.5 * Math.pow(12, settle),
        air: 0.15,
        broadside: 0.5,
        spinAir: 0.03,
        nodeDrag: 2,
        nodeAir: 0.2,
        twist: 30,
        twistDamping: 3,
        grip: 40,
        gripDamping: 6,
        breeze: reducedMotion ? 0 : clamp(0.35, 0, 1)
      };
    };

    return {
      id: opts.id,
      index,
      opts,
      layout, sim,
      cardGroup, bodyMesh, frontMesh, backMesh, ring,
      clampGroup, band, updateBand, getPhysics,
      frontMaterial, backMaterial, edgeMaterial, metalMaterial, bandMaterial,
      repaintFaces: () => paintCardFaces(frontImageObj),
      placed: false,
      calm: 0,
      time: index * 1.15
    };
  });

  // Re-render card faces once webfonts are fully loaded for razor-sharp typography
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      cards.forEach(card => card.repaintFaces?.());
    });
  }

  // 5. Stage Layout & Responsive 1-Row Camera Framing (All 6 cards in 1 row on ANY screen)
  const updateStageLayout = () => {
    const rect = stage.getBoundingClientRect();
    const stageW = Math.max(1, rect.width || stage.clientWidth || window.innerWidth);
    const stageH = Math.max(1, rect.height || stage.clientHeight || 580);
    renderer.setSize(stageW, stageH, false);

    const aspect = stageW / stageH;
    camera.aspect = aspect;

    // Minimum scene width to comfortably contain all 6 cards in 1 row without clipping
    const minRowSceneWidth = 7.5;
    const baseHeight = 4.6;
    const viewHeight = Math.max(baseHeight, minRowSceneWidth / aspect);
    const viewWidth = viewHeight * aspect;

    const camDist = (viewHeight / 2) / Math.tan((FOV * Math.PI) / 360);
    camera.position.set(0, -0.25, camDist);
    camera.lookAt(0, -0.25, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    // Keep a little gap (very small gap) between leftmost/rightmost cards and the screen borders
    const cardHalfWidth = 0.8;
    const smallBorderGap = Math.min(0.32, Math.max(0.18, viewWidth * 0.022));
    const edgeMargin = cardHalfWidth + smallBorderGap;
    const usableWidth = viewWidth - edgeMargin * 2;
    const cardSpacing = usableWidth / 5;
    const totalRowSpan = cardSpacing * 5;
    const startX = -totalRowSpan / 2;

    const anchorY = viewHeight / 2 - 0.05;
    const strapLen = Math.max(0.68, viewHeight * 0.18);

    const originLabels = document.querySelectorAll('.tie-origin-label');

    cards.forEach((card, i) => {
      const anchorX = startX + i * cardSpacing;
      // Staggered resting Z so cards overlap gracefully without Z-fighting
      const zOffset = (i % 2 === 0 ? 0.05 : -0.05);

      card.sim.anchor.set(anchorX, anchorY, zOffset);
      configureSimulation(card.sim, card.layout, strapLen);

      // Precisely pin the name on top of the origin of the tie
      if (originLabels[i]) {
        const p = scratch.a.copy(card.sim.anchor).project(camera);
        const screenX = ((p.x + 1) / 2) * stageW;
        originLabels[i].style.left = `${screenX}px`;
      }

      if (!card.placed) {
        // Intro drop-and-swing from horizontal angle
        placeHanging(card.sim, card.layout, !reducedMotion);
        card.placed = true;
      }
    });
  };

  // 6. Unified Pointer Interaction: Full Dragging, Overlapping & Flipping
  let activeGrab = null;
  let pressInfo = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const getHitCard = (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const targets = [];
    cards.forEach(card => {
      targets.push(
        { card, mesh: card.frontMesh },
        { card, mesh: card.backMesh },
        { card, mesh: card.bodyMesh }
      );
    });

    const intersects = raycaster.intersectObjects(targets.map(t => t.mesh), false);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const match = targets.find(t => t.mesh === hit.object);
      return { hit, card: match.card };
    }
    return null;
  };

  const flipCard = (card, point) => {
    const body = card.sim.body;
    const up = scratch.a.set(0, 1, 0).applyQuaternion(body.quaternion);
    let direction = card.sim.turn > 0 ? -1 : 1;
    if (card.sim.turn === 0) {
      const away = point ? scratch.c.subVectors(point, camera.position).normalize() : new THREE.Vector3(0, 0, -1);
      direction = point ? (scratch.b.subVectors(point, body.position).cross(away).dot(up) < 0 ? -1 : 1) : 1;
    }
    card.sim.turn = card.sim.turn === 0 ? Math.PI * direction : 0;
    body.angular.addScaledVector(up, FLIP_SPIN * direction);
    card.calm = 0;
    startLoop();
  };

  const highlightNameplate = (index) => {
    const items = document.querySelectorAll('.tie-origin-label');
    items.forEach((item, i) => {
      if (i === index) {
        item.style.color = '#00f0ff';
        item.style.transform = 'translateX(-50%) translateY(-2px)';
      } else {
        item.style.color = '#ffffff';
        item.style.transform = 'translateX(-50%) translateY(0)';
      }
    });
  };

  // Helper: check if raycast hit an Instagram or LinkedIn icon on the card back
  const checkSocialHit = (hit, card) => {
    if (!hit || !hit.uv || !card || hit.object !== card.backMesh) return null;
    const canvasWidth = 1200;
    const canvasHeight = Math.round((1200 * card.layout.height) / card.layout.width);
    const cx = hit.uv.x * canvasWidth;
    const cy = (1 - hit.uv.y) * canvasHeight;

    // Instagram button: center (410, 850), size 200 + pill base + label
    // Range: x in [270, 550], y in [710, 1040]
    if (cx >= 270 && cx <= 550 && cy >= 710 && cy <= 1040) {
      return { type: 'instagram', url: card.opts.instagram };
    }

    // LinkedIn button: center (790, 850), size 200 + pill base + label
    // Range: x in [650, 930], y in [710, 1040]
    if (cx >= 650 && cx <= 930 && cy >= 710 && cy <= 1040) {
      return { type: 'linkedin', url: card.opts.linkedin };
    }

    return null;
  };

  const onPointerDown = (e) => {
    if (e.button > 0) return;
    const match = getHitCard(e);
    if (!match) return;

    const { hit, card } = match;
    // Elevate grabbed card forward in Z so it layers on top of neighboring cards while dragged
    card.sim.body.position.z += 0.28;

    const invQ = card.sim.body.quaternion.clone().invert();
    const local = hit.point.clone().sub(card.sim.body.position).applyQuaternion(invQ);

    card.sim.grab = {
      local,
      rotation: card.sim.body.quaternion.clone(),
      reach: hit.distance,
      from: hit.point.clone(),
      target: hit.point.clone()
    };

    activeGrab = { card, reach: hit.distance };
    pressInfo = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
      point: hit.point.clone(),
      hit,
      card
    };

    highlightNameplate(card.index);
    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    if (activeGrab) {
      if (pressInfo && Math.hypot(e.clientX - pressInfo.x, e.clientY - pressInfo.y) > 8) {
        pressInfo = null;
      }
      raycaster.ray.at(activeGrab.reach, activeGrab.card.sim.grab.target);
      return;
    }

    if (e.pointerType === 'touch') return;
    const match = getHitCard(e);
    if (match) {
      highlightNameplate(match.card.index);
      const social = checkSocialHit(match.hit, match.card);
      if (social) {
        canvas.style.cursor = 'pointer';
        canvas.title = `Open ${match.card.opts.name}'s ${social.type === 'instagram' ? 'Instagram' : 'LinkedIn'}`;
      } else {
        canvas.style.cursor = 'grab';
        canvas.removeAttribute('title');
      }
    } else {
      canvas.style.cursor = 'default';
      canvas.removeAttribute('title');
    }
  };

  const onPointerUp = (e) => {
    if (activeGrab) {
      const card = activeGrab.card;
      // Quick tap/click: check if social link was clicked, else flip card
      if (pressInfo && performance.now() - pressInfo.time < 450) {
        const social = checkSocialHit(pressInfo.hit, card);
        if (social && social.url) {
          window.open(social.url, '_blank', 'noopener,noreferrer');
        } else {
          flipCard(card, pressInfo.point);
        }
      }
      card.sim.grab = null;
      activeGrab = null;
      pressInfo = null;
      canvas.releasePointerCapture?.(e.pointerId);
    }
    const match = getHitCard(e);
    if (match && e.pointerType !== 'touch') {
      const social = checkSocialHit(match.hit, match.card);
      canvas.style.cursor = social ? 'pointer' : 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
  };

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const match = getHitCard(e.touches[0]);
    if (match) e.preventDefault();
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('lostpointercapture', onPointerUp);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });

  // Hook up name clicks so clicking a name on top of tie origin flips that card!
  document.querySelectorAll('.tie-origin-label').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index, 10);
      if (cards[idx]) {
        flipCard(cards[idx], null);
        highlightNameplate(idx);
      }
    });
  });

  // 7. Single 60fps Loop
  let raf = 0, lastTime = performance.now();
  let isIntersecting = true;

  const tick = (now) => {
    raf = 0;
    const dt = Math.min(1 / 30, Math.max(1 / 240, (now - lastTime) / 1000));
    lastTime = now;

    let anyActive = false;

    cards.forEach(card => {
      card.time += dt;
      const phys = card.getPhysics();
      stepSimulation(card.sim, dt, phys, card.time);

      const b = card.sim.body;
      if (!Number.isFinite(b.position.x + b.position.y + b.position.z + b.quaternion.w)) {
        card.sim.grab = null;
        placeHanging(card.sim, card.layout, false);
      }

      card.cardGroup.position.copy(b.position);
      card.cardGroup.quaternion.copy(b.quaternion);
      card.updateBand();

      const isCalm = (phys.breeze === 0 && !card.sim.grab &&
        b.velocity.lengthSq() + b.angular.lengthSq() * 0.3 < 2e-4);
      card.calm = isCalm ? card.calm + dt : 0;
      if (card.calm < 1.2 || card.sim.grab || phys.breeze > 0) {
        anyActive = true;
      }
    });

    renderer.render(scene, camera);

    if (anyActive || isIntersecting) {
      raf = requestAnimationFrame(tick);
    }
  };

  const startLoop = () => {
    if (raf) return;
    lastTime = performance.now();
    raf = requestAnimationFrame(tick);
  };

  // 8. Lifecycle & Observers
  const ro = new ResizeObserver(updateStageLayout);
  ro.observe(stage);
  window.addEventListener('resize', updateStageLayout);
  window.addEventListener('orientationchange', updateStageLayout);

  const io = new IntersectionObserver(([entry]) => {
    isIntersecting = entry.isIntersecting;
    if (isIntersecting) startLoop();
  });
  io.observe(stage);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) startLoop();
  });

  updateStageLayout();
  startLoop();
}
