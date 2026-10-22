/**
 * FlexCarousel.js — High-performance ES Module WebGL implementation
 * of the <FlexCarousel /> component from React Bits.
 *
 * Built on ogl with custom shaders, refractive liquid glass lens,
 * interactive card focus, spring physics damping, and dynamic captions.
 */

import { Renderer, Program, Mesh, Triangle, Plane, Texture, RenderTarget } from 'ogl';

const photo = id => `https://images.unsplash.com/${id}?w=1200&q=80&auto=format&fit=max`;

export const DEFAULT_ITEMS = [
  {
    src: photo('photo-1737071371043-761e02b1ef95'),
    alt: 'An iridescent chrome sculpture of a head',
    title: 'Iridescence'
  },
  {
    src: photo('photo-1693645325828-62cd35c8da8f'),
    alt: 'A person in dark clothes standing in front of a white backdrop',
    title: 'White Room'
  },
  { src: photo('photo-1739056238917-d89cd05c48d5'), alt: 'A twisted chrome form on black', title: 'Liquid Metal' },
  { src: photo('photo-1747191092806-c7da11881986'), alt: 'A clay bust shown in profile', title: 'Clay Study' },
  { src: photo('photo-1605034313761-73ea4a0cfbf3'), alt: 'Black and white low top sneakers', title: 'Low Tops' },
  { src: photo('photo-1495462911434-be47104d70fa'), alt: 'A woman in a wide black hat', title: 'Brim' },
  {
    src: photo('photo-1786835568925-20cd20007ed0'),
    alt: 'Three swirling shapes in white, gold and silver on grey',
    title: 'Three Forms'
  },
  { src: photo('photo-1770249196550-ff6c641165cb'), alt: 'A chrome humanoid sculpture', title: 'Automaton' },
  {
    src: photo('photo-1787181875088-087d612262a7'),
    alt: 'A black textured sculpture with an opening at its center',
    title: 'Obsidian'
  },
  {
    src: photo('photo-1770062422885-2dfcbe8fb65b'),
    alt: 'A woman in a white shirt crouching on a dark set',
    title: 'Poise'
  },
  { src: photo('photo-1726910133626-9b573eca70ff'), alt: 'Black curved shapes stacked like a fan', title: 'Fins' },
  { src: photo('photo-1604854574958-59047362c165'), alt: 'A white plaster bust on a black table', title: 'Plaster' }
];

export const NASA_SCIENTIST_ITEMS = [
  {
    src: "https://images.unsplash.com/photo-1581093577421-f561a654a353?auto=format&fit=crop&w=1200&q=80",
    alt: "Katherine Johnson calculating lunar orbital trajectories",
    title: "Katherine Johnson",
    subtitle: "Orbital Mechanics & Apollo Trajectory Specialist",
    era: "1953 – 1986",
    mission: "Project Mercury • Apollo 11 • Space Shuttle",
    field: "Orbital Trajectories & Celestial Navigation",
    bio: "Katherine Johnson's historic mathematical calculations formed the celestial backbone of America's first crewed spaceflights. Her hand-derived equations for synodic periods and orbital rendezvous verified John Glenn's Friendship 7 orbit and mapped Apollo 11's translunar injection corridor to the lunar surface.",
    quote: "“Like what you do, and then you will do your best. We mapped celestial trajectories before silicon computers could think.”",
    impact: "Authored landmark 1960 research establishing pinpoint lunar return coordinates."
  },
  {
    src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    alt: "Deep space observation and cosmic radio communication telemetry",
    title: "Dr. Carl Sagan",
    subtitle: "Planetary Scientist & Voyager Golden Record Architect",
    era: "1960 – 1996",
    mission: "Voyager 1 & 2 • Mariner 9 • Viking Mars",
    field: "Planetary Science & Astrobiology",
    bio: "A titan of cosmic communication, Carl Sagan decoded the runaway greenhouse physics of Venus and designed the interstellar Golden Record message aboard Voyager. He galvanized humanity to perceive Earth as a fragile 'pale blue dot' suspended in a sunbeam across the infinite void.",
    quote: "“The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.”",
    impact: "Directed planetary atmospheric models and humanity's first interstellar messages."
  },
  {
    src: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    alt: "Deep cosmic nebula captured by orbital space observatory",
    title: "Dr. Nancy Grace Roman",
    subtitle: "Chief of Astronomy • 'Mother of Hubble Space Telescope'",
    era: "1959 – 1979",
    mission: "Hubble Space Telescope • Orbiting Observatories",
    field: "Space-Based Optical Observatories",
    bio: "As NASA's foundational Chief of Astronomy, Dr. Roman convinced Congress and the international scientific community that optical observatories had to rise above atmospheric turbulence. Her architectural vision gave birth to the Hubble Space Telescope, unveiling deepest cosmic dawn.",
    quote: "“I was told from early childhood that women could not be scientists. I simply chose not to listen.”",
    impact: "Secured foundational engineering grants that realized orbital optical astrophysics."
  },
  {
    src: "https://images.unsplash.com/photo-1614727187346-ec3a009092b0?auto=format&fit=crop&w=1200&q=80",
    alt: "Astronaut scientist conducting EVA research outside space station",
    title: "Dr. Eugene Shoemaker",
    subtitle: "Founder of Planetary Geology & Apollo Lunar Trainer",
    era: "1960 – 1997",
    mission: "Apollo Lunar Field Training • Clementine",
    field: "Astrogeology & Meteoritic Impacts",
    bio: "Gene Shoemaker synthesized terrestrial geology with extraterrestrial impact dynamics, creating astrogeology. He trained Apollo astronauts in field geology across Arizona volcanic fields and co-discovered Comet Shoemaker-Levy 9 colliding with Jupiter. He is the sole human buried on the Moon.",
    quote: "“The history of life on Earth has been punctuated by cosmic collisions from the dark void.”",
    impact: "Trained Apollo astronauts to select and return 842 pounds of prime lunar samples."
  },
  {
    src: "https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=1200&q=80",
    alt: "Deep space stellar core and event horizon imaging telemetry",
    title: "Dr. Katie Bouman",
    subtitle: "Computational Imaging • First Direct Black Hole Image (EHT)",
    era: "2016 – Present",
    mission: "Event Horizon Telescope • Messier 87* & Sgr A*",
    field: "Computational Astrophysics & Interferometry",
    bio: "Dr. Bouman developed the CHIRP algorithmic imaging pipeline that reconciled petabytes of synchronized atomic-clock radio data collected from telescopes across Chile, Hawaii, and the South Pole, producing the first direct visual evidence of a supermassive black hole's shadow in Messier 87.",
    quote: "“No one person made this image. It required the synchrony of scientists and antennas across the entire globe.”",
    impact: "Synthesized planet-scale synthetic aperture arrays to resolve event horizons."
  },
  {
    src: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200&q=80",
    alt: "Saturn V rocket launch propelled by guidance software",
    title: "Margaret Hamilton",
    subtitle: "Director of Software Engineering • Apollo 11 Flight Code",
    era: "1965 – 1976",
    mission: "Apollo 8 through 17 Guidance Computers",
    field: "Asynchronous Software Architecture",
    bio: "Leading MIT's software team, Margaret Hamilton coined 'software engineering' and built the Apollo onboard flight computer. During Apollo 11's lunar descent, radar overload threatened catastrophic abort; her priority-scheduling architecture gracefully shed low-priority tasks, allowing Neil Armstrong to land.",
    quote: "“There was no second chance. The code had to be completely resilient against unexpected human error.”",
    impact: "Invented asynchronous priority-interrupt computing that saved the Apollo 11 landing."
  },
  {
    src: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=1200&q=80",
    alt: "Earth atmospheric horizon and planetary rotation boundary",
    title: "Dr. Vera Rubin",
    subtitle: "Astrophysicist • Pioneer of Dark Matter & Galactic Rotation",
    era: "1960 – 2016",
    mission: "Galactic Velocity Surveys • Rubin Observatory",
    field: "Galactic Dynamics & Dark Matter Physics",
    bio: "Measuring the orbital velocity of outer stars in spiral galaxies, Vera Rubin discovered they moved as fast as inner stars, in direct conflict with Newtonian gravitation. Her immaculate spectroscopic curves gave the world its first decisive observational evidence that invisible dark matter halos govern galaxy rotation.",
    quote: "“We peered into the outer galactic rim and realized the universe is dominated by matter we cannot see.”",
    impact: "Established galactic flat rotation curves, driving modern cosmological mass models."
  },
  {
    src: "https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?auto=format&fit=crop&w=1200&q=80",
    alt: "Milky Way infrared galaxy core spectroscopy study",
    title: "Dr. James E. Webb",
    subtitle: "Cosmic Visionary & NASA Space Science Administrator",
    era: "1961 – 1968",
    mission: "Mercury • Gemini • Apollo & Planetary Probes",
    field: "Space Science Architecture & Program Governance",
    bio: "Under Webb's visionary tenure, NASA evolved from a geopolitical race into a powerhouse of scientific inquiry. He insisted that human lunar missions be paired with robotic planetary probes and space science grants, cementing the framework that produced the flagship James Webb Space Telescope.",
    quote: "“We are not merely sending astronauts into orbit; we are forging humanity's enduring capacity for exploration.”",
    impact: "Launched over 75 landmark space science missions establishing orbital astronomy."
  },
  {
    src: "https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1200&q=80",
    alt: "High-altitude astronomical observatory dome under starry night sky",
    title: "Dr. Subrahmanyan Chandrasekhar",
    subtitle: "Nobel Laureate • Stellar Evolution & Chandra Observatory",
    era: "1930 – 1995",
    mission: "Chandra X-Ray Observatory • Relativistic Physics",
    field: "Theoretical Astrophysics & Degenerate Matter",
    bio: "At age 19, Chandrasekhar calculated that white dwarf stars have an absolute relativistic mass limit (1.44 solar masses). Above this boundary, electron degeneracy pressure fails, forcing collapse into neutron stars or black holes. His discovery won the Nobel Prize and inspired the Chandra X-Ray Observatory.",
    quote: "“Science is a search for truth, and mathematical elegance is nature’s signature across cosmic scale.”",
    impact: "Formulated the Chandrasekhar Limit governing stellar supernova collapses."
  },
  {
    src: "https://images.unsplash.com/photo-1517976487502-5f65f3f98c8c?auto=format&fit=crop&w=1200&q=80",
    alt: "Orbital ascent trajectory and booster stage tracking",
    title: "Dr. Sally Ride",
    subtitle: "Astrophysicist & First American Woman Astronaut in Orbit",
    era: "1978 – 2012",
    mission: "STS-7 • STS-41-G Challenger • Rogers Commission",
    field: "Astrophysics, Free Electron Lasers & Remote Sensing",
    bio: "With a doctorate in physics investigating interstellar medium X-ray scattering, Sally Ride became the first American woman to venture into space in 1983. Operating the Shuttle's Canadarm to deploy and retrieve satellites, she went on to draft NASA's visionary Leadership and America's Future in Space report.",
    quote: "“When you're sitting on top of a rocket preparing for launch, all that matters is the fundamental physics.”",
    impact: "Spearheaded NASA's Earth observation mission blueprints and national science literacy."
  },
  {
    src: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=1200&q=80",
    alt: "Deep horizon exploration across celestial landscape",
    title: "Dr. Kip Thorne",
    subtitle: "Theoretical Physicist • LIGO Gravitational Wave Detection",
    era: "1968 – Present",
    mission: "LIGO / Virgo Gravitational Wave Observatories",
    field: "General Relativity & Spacetime Curvature",
    bio: "Co-founding the LIGO laboratory, Kip Thorne dedicated half a century to testing Einstein's general relativity. In 2015, LIGO made history by detecting spacetime ripples generated by two colliding black holes 1.3 billion light years away, earning Thorne the 2017 Nobel Prize in Physics.",
    quote: "“Gravitational waves are pristine vibrations in the fabric of space-time, whispering secrets from the dark universe.”",
    impact: "Demonstrated direct laser interferometric detection of cataclysmic black hole mergers."
  },
  {
    src: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
    alt: "Planetary magnetic boundary and pulsar radio pulse survey",
    title: "Dr. Jocelyn Bell Burnell",
    subtitle: "Radio Astronomer • Discovery of Pulsars and Neutron Stars",
    era: "1967 – Present",
    mission: "Interplanetary Scintillation Array • Pulsar Physics",
    field: "High-Energy Transient Radio Astronomy",
    bio: "While examining miles of chart-recorder outputs from Cambridge's radio telescope array, Jocelyn Bell detected an unclassifiable 1.33-second rhythmic pulse. Her discovery of pulsars—rapidly rotating neutron stars—provided the first physical confirmation of matter compressed to nuclear density.",
    quote: "“I noticed a bit of anomalous 'scruff' on the analog chart that didn’t belong. True discovery requires relentless curiosity.”",
    impact: "Discovered pulsars, providing the cosmic clocks now utilized in interstellar navigation."
  }
];

export const BEND_PRESETS = {
  liquid: {
    lensWidth: 0.74,
    lensHeight: 1.18,
    tilt: 62,
    roundness: 1,
    bend: 0.34,
    reach: 0.38,
    curl: 'twist',
    dispersion: 0.45,
    liquid: 0,
    followCursor: false
  },
  ribbon: {
    lensWidth: 0.8,
    lensHeight: 0.8,
    tilt: 0,
    roundness: 1,
    bend: 0.34,
    reach: 0.34,
    curl: 'twist',
    dispersion: 0.4,
    liquid: 0,
    followCursor: false
  },
  vortex: {
    lensWidth: 0.7,
    lensHeight: 0.95,
    tilt: 30,
    roundness: 1,
    bend: 0.46,
    reach: 0.3,
    curl: 'twist',
    dispersion: 0.5,
    liquid: 0,
    followCursor: false
  },
  arch: {
    lensWidth: 0.8,
    lensHeight: 0.8,
    tilt: 0,
    roundness: 1,
    bend: 0.3,
    reach: 0.36,
    curl: 'rise',
    dispersion: 0.4,
    liquid: 0,
    followCursor: false
  }
};

const FIT_ASPECT = { portrait: 0.75, square: 1, landscape: 4 / 3 };
const TAPS = 12;
const PIXEL_BUDGET = 4.5e6;
const INTRO_DURATION = { rise: 2.1, bloom: 1.6, spin: 2.2, deal: 1.5, fade: 0.35 };

const wrap = (value, size) => ((((value + size / 2) % size) + size) % size) - size / 2;
const clamp01 = value => Math.min(Math.max(value, 0), 1);
const easeOut = value => 1 - Math.pow(1 - clamp01(value), 3);
const easeOutQuint = value => 1 - Math.pow(1 - clamp01(value), 5);
const easeInOut = value => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const cardVertex = `#version 300 es
in vec3 position;
in vec2 uv;
uniform vec4 uRect;
uniform vec2 uResolution;
out vec2 vUv;
out vec2 vLocal;
void main() {
  vUv = uv;
  vLocal = vec2(position.x, -position.y) * uRect.zw;
  vec2 px = uRect.xy + vLocal;
  gl_Position = vec4(px.x / uResolution.x * 2.0 - 1.0, 1.0 - px.y / uResolution.y * 2.0, 0.0, 1.0);
}
`;

const cardFragment = `#version 300 es
precision highp float;
uniform sampler2D tMap;
uniform vec2 uSize;
uniform vec2 uImage;
uniform float uRadius;
uniform float uAlpha;
uniform float uReady;
uniform float uShift;
uniform float uDpr;
uniform vec3 uPlaceholder;
in vec2 vUv;
in vec2 vLocal;
out vec4 fragColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  float sd = roundedBox(vLocal, uSize * 0.5, min(uRadius, min(uSize.x, uSize.y) * 0.5));
  float mask = clamp(0.5 - sd * uDpr, 0.0, 1.0);
  vec2 local = vLocal / uSize + 0.5;
  float cardAspect = uSize.x / uSize.y;
  float imageAspect = uImage.x / max(uImage.y, 1.0);
  vec2 scale = imageAspect > cardAspect ? vec2(cardAspect / imageAspect, 1.0) : vec2(1.0, imageAspect / cardAspect);
  scale /= 1.08;
  vec2 uv = vec2(local.x, 1.0 - local.y);
  uv = (uv - 0.5) * scale + 0.5;
  uv.x += uShift * (1.0 - scale.x) * 0.5;
  vec3 image = texture(tMap, uv).rgb;
  vec3 color = mix(uPlaceholder, image, uReady);
  float alpha = mask * uAlpha;
  fragColor = vec4(color * alpha, alpha);
}
`;

const lensVertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const lensFragment = `#version 300 es
precision highp float;
uniform sampler2D tScene;
uniform vec2 uResolution;
uniform float uDpr;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uAngle;
uniform float uExponent;
uniform float uInner;
uniform float uOuter;
uniform float uFlow;
uniform float uCurl;
uniform float uDispersion;
uniform float uStrength;
uniform float uSceneAlpha;
out vec4 fragColor;

void main() {
  vec2 frag = gl_FragCoord.xy / uDpr;
  vec2 uv = frag / uResolution;
  vec2 rel = frag - vec2(uCenter.x, uResolution.y - uCenter.y);
  float ca = cos(uAngle);
  float sa = sin(uAngle);
  vec2 local = vec2(ca * rel.x + sa * rel.y, -sa * rel.x + ca * rel.y);
  vec2 k = max(abs(local) / uHalf, vec2(1e-5));
  float nd = pow(pow(k.x, uExponent) + pow(k.y, uExponent), 1.0 / uExponent);
  vec2 grad = pow(k, vec2(uExponent - 1.0)) * sign(local) / uHalf * pow(nd, 1.0 - uExponent);
  float glen = max(length(grad), 1e-6);
  float edge = (nd - 1.0) / glen;
  vec2 outward = grad / glen;
  vec2 normal = vec2(ca * outward.x - sa * outward.y, sa * outward.x + ca * outward.y);
  vec2 along = vec2(-normal.y, normal.x);

  float t = clamp((edge + uInner) / (uInner + uOuter), 0.0, 1.0);
  float ramp = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  float slope = 16.0 * t * t * (1.0 - t) * (1.0 - t);
  float reachX = rel.x / (uResolution.x * 0.5);
  float side = smoothstep(0.02, 0.3, abs(reachX)) * (uCurl == 0.0 ? sign(reachX) : uCurl);
  float lift = ramp * side * uFlow * uStrength;
  vec2 swirl = along * along.y * side * slope * uFlow * uStrength * 0.35;
  vec2 drift = vec2(0.0, -lift) - swirl;
  vec2 shifted = uv + drift / uResolution;

  vec2 texels = uResolution * uDpr;
  vec2 gx = dFdx(shifted);
  vec2 gy = dFdy(shifted);
  gx *= min(1.0, 3.0 / max(length(gx * texels), 1e-4));
  gy *= min(1.0, 3.0 / max(length(gy * texels), 1e-4));

  vec4 color = textureGrad(tScene, shifted, gx, gy);
  vec2 spread = vec2(0.0, side * slope * uFlow * uStrength) / uResolution * uDispersion;
  float spreadPx = length(spread * texels);
  if (color.a > 0.002 && spreadPx > 0.25) {
    vec3 base = color.rgb / color.a;
    vec3 sumColor = vec3(0.0);
    vec3 sumWeight = vec3(0.0);
    for (int i = 0; i < ${TAPS}; i++) {
      float s = (float(i) + 0.5) / float(${TAPS});
      vec4 c = textureGrad(tScene, shifted + spread * (s - 0.5), gx, gy);
      vec3 w = max(1.0 - abs(vec3(s) - vec3(0.15, 0.5, 0.85)) * 2.6, 0.0) * c.a;
      sumColor += c.rgb * (w / max(c.a, 0.002));
      sumWeight += w;
    }
    vec3 split = mix(base, sumColor / max(sumWeight, vec3(1e-4)), clamp(sumWeight * 2.0, 0.0, 1.0));
    color.rgb = mix(color.rgb, clamp(split, 0.0, 1.0) * color.a, smoothstep(0.25, 1.5, spreadPx));
  }

  fragColor = color * uSceneAlpha;
}
`;

export class VanillaFlexCarousel {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) return;

    this.options = options;
    this.list = options.items && options.items.length ? options.items : DEFAULT_ITEMS;
    this.preset = options.preset || 'liquid';
    this.intro = options.intro || 'rise';
    this.cardHeight = options.cardHeight ?? 0.5;
    this.gap = options.gap ?? 12;
    this.radius = options.radius ?? 0;
    this.fit = options.fit || 'natural';
    this.squeeze = options.squeeze ?? 0.2;
    this.focusOnClick = options.focusOnClick !== false;
    this.autoplay = Boolean(options.autoplay);
    this.interval = options.interval ?? 4;
    this.captions = options.captions !== false;
    this.captureWheel = options.captureWheel !== false;
    this.rotation = options.rotation !== undefined ? options.rotation : (window.innerWidth < 900 ? -12 : -20);
    this.onChange = options.onChange;
    this.onSelect = options.onSelect;

    const base = BEND_PRESETS[this.preset] || BEND_PRESETS.liquid;
    const pick = (val, key) => (val === undefined || val === null ? base[key] : val);

    this.settings = {
      intro: this.intro,
      cardHeight: this.cardHeight,
      gap: this.gap,
      radius: this.radius,
      fit: this.fit,
      lensWidth: pick(options.lensWidth, 'lensWidth'),
      lensHeight: pick(options.lensHeight, 'lensHeight'),
      tilt: pick(options.tilt, 'tilt'),
      roundness: pick(options.roundness, 'roundness'),
      bend: pick(options.bend, 'bend'),
      reach: pick(options.reach, 'reach'),
      curl: pick(options.curl, 'curl'),
      dispersion: pick(options.dispersion, 'dispersion'),
      liquid: pick(options.liquid, 'liquid'),
      followCursor: pick(options.followCursor, 'followCursor'),
      squeeze: this.squeeze,
      focusOnClick: this.focusOnClick,
      autoplay: this.autoplay,
      interval: this.interval,
      captureWheel: this.captureWheel
    };

    this.active = 0;
    this.revealed = false;
    this.focusOpen = false;

    this.initDOM();
    this.initWebGL();
  }

  initDOM() {
    this.container.classList.add('flex-carousel');
    if (this.options.className) {
      this.container.className += ' ' + this.options.className;
    }
    this.container.style.setProperty('--flex-carousel-half', `${Math.min(Math.max(this.cardHeight, 0.05), 1) * 50}%`);
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-roledescription', 'carousel');
    this.container.setAttribute('aria-label', this.options.ariaLabel || 'NASA Scientists Image carousel');
    this.container.setAttribute('tabindex', '0');

    if (this.captions) {
      this.captionEl = document.createElement('div');
      this.captionEl.className = 'flex-carousel__caption';
      this.captionEl.setAttribute('aria-hidden', 'true');
      this.captionEl.style.display = 'none';

      this.titleWrapEl = document.createElement('span');
      this.titleWrapEl.className = 'flex-carousel__title';

      this.titleTextEl = document.createElement('span');
      this.titleTextEl.className = 'flex-carousel__title-text';
      this.titleWrapEl.appendChild(this.titleTextEl);

      this.subtitleEl = document.createElement('span');
      this.subtitleEl.className = 'flex-carousel__subtitle';
      this.titleWrapEl.appendChild(this.subtitleEl);

      this.captionEl.appendChild(this.titleWrapEl);

      this.countEl = document.createElement('span');
      this.countEl.className = 'flex-carousel__count';

      this.digitsEl = document.createElement('span');
      this.digitsEl.className = 'flex-carousel__digits';

      this.reels = [];
      for (let d = 0; d < 2; d++) {
        const digitSpan = document.createElement('span');
        digitSpan.className = 'flex-carousel__digit';
        const reel = document.createElement('span');
        reel.className = 'flex-carousel__reel';
        for (let n = 0; n <= 9; n++) {
          const numSpan = document.createElement('span');
          numSpan.textContent = n;
          reel.appendChild(numSpan);
        }
        digitSpan.appendChild(reel);
        this.digitsEl.appendChild(digitSpan);
        this.reels.push(reel);
      }

      const slash = document.createElement('span');
      slash.className = 'flex-carousel__slash';
      slash.textContent = '/';

      this.totalEl = document.createElement('span');
      this.totalEl.textContent = String(this.list.length).padStart(2, '0');

      this.countEl.appendChild(this.digitsEl);
      this.countEl.appendChild(slash);
      this.countEl.appendChild(this.totalEl);
      this.captionEl.appendChild(this.countEl);

      this.container.appendChild(this.captionEl);

      this.liveEl = document.createElement('div');
      this.liveEl.className = 'flex-carousel__live';
      this.liveEl.setAttribute('aria-live', 'polite');
      this.liveEl.setAttribute('aria-atomic', 'true');
      this.container.appendChild(this.liveEl);

      this.updateCaptionUI(0);
    }
  }

  updateCaptionUI(index) {
    if (!this.captions) return;
    const current = this.list[index] || this.list[0];
    if (!current) return;

    if (this.titleTextEl) {
      this.titleTextEl.textContent = current.title || current.alt || '';
    }
    if (this.subtitleEl) {
      if (current.subtitle) {
        this.subtitleEl.textContent = current.subtitle;
        this.subtitleEl.style.display = 'inline-block';
      } else {
        this.subtitleEl.textContent = '';
        this.subtitleEl.style.display = 'none';
      }
    }

    const valStr = String(index + 1).padStart(2, '0');
    if (this.reels && this.reels[0]) {
      this.reels[0].style.transform = `translateY(${-Number(valStr[0]) * 10}%)`;
    }
    if (this.reels && this.reels[1]) {
      this.reels[1].style.transform = `translateY(${-Number(valStr[1]) * 10}%)`;
    }

    if (this.liveEl) {
      const label = current.title || current.alt || `Image ${index + 1}`;
      this.liveEl.textContent = `${label}, ${index + 1} of ${this.list.length}`;
    }
  }

  initWebGL() {
    const container = this.container;
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false
    });
    const gl = renderer.gl;
    if (!renderer.isWebgl2) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return;
    }
    this.renderer = renderer;
    this.gl = gl;

    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.setAttribute('aria-hidden', 'true');
    container.prepend(canvas);
    this.canvas = canvas;

    const cardProgram = new Program(gl, {
      vertex: cardVertex,
      fragment: cardFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tMap: { value: new Texture(gl) },
        uRect: { value: [0, 0, 1, 1] },
        uResolution: { value: [1, 1] },
        uSize: { value: [1, 1] },
        uImage: { value: [1, 1] },
        uRadius: { value: 16 },
        uAlpha: { value: 1 },
        uReady: { value: 0 },
        uShift: { value: 0 },
        uDpr: { value: 1 },
        uPlaceholder: { value: [0.5, 0.5, 0.5] }
      }
    });
    cardProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const cardMesh = new Mesh(gl, { geometry: new Plane(gl), program: cardProgram });

    const target = new RenderTarget(gl, {
      width: 2,
      height: 2,
      depth: false,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      magFilter: gl.LINEAR
    });

    const lensUniforms = {
      tScene: { value: target.texture },
      uResolution: { value: [1, 1] },
      uDpr: { value: 1 },
      uCenter: { value: [0, 0] },
      uHalf: { value: [1, 1] },
      uAngle: { value: 0 },
      uExponent: { value: 2 },
      uInner: { value: 60 },
      uOuter: { value: 80 },
      uFlow: { value: 0 },
      uCurl: { value: 0 },
      uDispersion: { value: 0 },
      uStrength: { value: 0 },
      uSceneAlpha: { value: 0 }
    };
    const lensMesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, {
        vertex: lensVertex,
        fragment: lensFragment,
        uniforms: lensUniforms,
        depthTest: false,
        depthWrite: false
      })
    });

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const anisotropy = renderer.getExtension('EXT_texture_filter_anisotropic') ? 8 : 0;

    let slots = [];
    let width = 1;
    let height = 1;
    let pos = 0;
    let vel = 0;
    let goal = 0;
    let mode = 'spring';
    let wheelAt = 0;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    let alive = true;
    let dirty = true;
    let activeIndex = -1;
    let interactedAt = -Infinity;
    let autoplayAt = performance.now();
    let hasFocus = false;
    let deform = 0;
    let deformVel = 0;
    let layout = null;
    let resnap = false;
    let hover = '';
    let lift = 1;
    let energy = 0;
    let lastPos = 0;
    const lens = { x: 0, y: 0, vx: 0, vy: 0, ready: false };
    const pointer = {
      x: 0,
      y: 0,
      over: false,
      down: false,
      id: -1,
      startX: 0,
      startY: 0,
      startPos: 0,
      dragging: false,
      touch: false,
      samples: []
    };
    const introState = { kind: 'none', t: 0, running: false, done: false, readyAt: 0 };
    const focus = { index: -1, pending: -1, t: 0, v: 0, target: 0 };
    let instances = [];

    const loadSlot = (item, index) => {
      const texture = new Texture(gl, {
        generateMipmaps: true,
        minFilter: gl.LINEAR_MIPMAP_LINEAR,
        magFilter: gl.LINEAR,
        anisotropy
      });
      const slot = {
        item,
        index,
        texture,
        aspect: 0.8,
        loaded: false,
        failed: false,
        ready: 0,
        color: [0.5, 0.5, 0.5],
        image: [1, 1],
        dispose: () => {}
      };
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => {
        if (!alive || !slots.includes(slot)) return;
        texture.image = image;
        texture.update();
        slot.image = [image.naturalWidth || 1, image.naturalHeight || 1];
        slot.aspect = slot.image[0] / slot.image[1];
        try {
          const probe = document.createElement('canvas');
          probe.width = 8;
          probe.height = 8;
          const ctx = probe.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(image, 0, 0, 8, 8);
            const data = ctx.getImageData(0, 0, 8, 8).data;
            const avg = [0, 0, 0];
            for (let i = 0; i < data.length; i += 4) {
              avg[0] += data[i];
              avg[1] += data[i + 1];
              avg[2] += data[i + 2];
            }
            slot.color = avg.map(v => v / 64 / 255);
          }
        } catch {
          slot.color = [0.5, 0.5, 0.5];
        }
        slot.loaded = true;
        dirty = true;
        start();
      };
      image.onerror = () => {
        if (!alive) return;
        slot.failed = true;
        dirty = true;
        start();
      };
      image.src = item.src;
      slot.dispose = () => {
        image.onload = null;
        image.onerror = null;
        gl.deleteTexture(texture.texture);
      };
      return slot;
    };

    const setItems = next => {
      slots.forEach(slot => slot.dispose());
      slots = next.map(loadSlot);
      activeIndex = -1;
      layout = null;
      resnap = true;
      focus.target = 0;
      focus.t = 0;
      focus.v = 0;
      focus.pending = -1;
      this.focusOpen = false;
      if (this.countEl) this.countEl.removeAttribute('data-hidden');
      introState.readyAt = performance.now();
      dirty = true;
      start();
    };

    const metrics = s => {
      const cardH = Math.max(24, s.cardHeight * height);
      const fixed = FIT_ASPECT[s.fit];
      const widths = slots.map(slot => (fixed || slot.aspect) * cardH);
      const centers = [];
      let cursor = 0;
      for (let i = 0; i < widths.length; i++) {
        centers.push(cursor + widths[i] / 2);
        cursor += widths[i] + s.gap;
      }
      return { cardH, widths, centers, gap: s.gap, loop: Math.max(cursor, 1) };
    };

    const nearest = (m, at) => {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < m.centers.length; i++) {
        const dist = Math.abs(wrap(m.centers[i] - at, m.loop));
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      return best;
    };

    const snapPoint = (m, at) => {
      const i = nearest(m, at);
      return at + wrap(m.centers[i] - at, m.loop);
    };

    const remap = (from, to, at) => {
      const i = nearest(from, at);
      const offset = wrap(at - from.centers[i], from.loop);
      const cycles = Math.round((at - offset - from.centers[i]) / from.loop);
      return cycles * to.loop + to.centers[i] + offset * (to.widths[i] / from.widths[i]);
    };

    const step = (m, delta) => {
      let at = snapPoint(m, goal);
      let index = nearest(m, at);
      const n = m.centers.length;
      for (let k = 0; k < Math.abs(delta); k++) {
        const next = (index + (delta > 0 ? 1 : n - 1)) % n;
        const distance =
          delta > 0
            ? m.widths[index] / 2 + m.gap + m.widths[next] / 2
            : -(m.widths[next] / 2 + m.gap + m.widths[index] / 2);
        at += distance;
        index = next;
      }
      goal = at;
      mode = 'spring';
      dirty = true;
      start();
    };

    const goTo = (m, index) => {
      const i = ((index % m.centers.length) + m.centers.length) % m.centers.length;
      goal = goal + wrap(m.centers[i] - goal, m.loop);
      mode = 'spring';
      dirty = true;
      start();
    };

    const openFocus = index => {
      focus.index = index;
      focus.pending = -1;
      focus.target = 1;
      this.focusOpen = true;
      if (this.countEl) this.countEl.setAttribute('data-hidden', '');
      dirty = true;
      start();
    };

    const closeFocus = () => {
      focus.pending = -1;
      if (focus.target === 0) return false;
      focus.target = 0;
      this.focusOpen = false;
      if (this.countEl) this.countEl.removeAttribute('data-hidden');
      dirty = true;
      start();
      return true;
    };

    const skipIntro = () => {
      if (introState.running) introState.t = 1;
    };

    const introEffects = () => {
      const t = introState.running ? introState.t : introState.done ? 1 : 0;
      const e = { sceneAlpha: 1, strength: 1, card: null };
      if (!introState.done && !introState.running) {
        e.sceneAlpha = 0;
        e.strength = 0;
        return e;
      }
      if (t >= 1) return e;
      const kind = introState.kind;
      if (kind === 'rise') {
        e.strength = easeInOut((t - 0.3) / 0.65);
        e.card = rel => {
          const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.34;
          const local = clamp01((t - delay) / 0.6);
          return {
            alpha: clamp01(local * 4),
            x: 0,
            y: (1 - easeOutQuint(local)) * height * 0.62,
            scale: 0.5 + 0.5 * easeInOut((local - 0.18) / 0.82)
          };
        };
      } else if (kind === 'bloom') {
        e.strength = easeInOut((t - 0.2) / 0.8);
        e.card = rel => {
          const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.25;
          const local = easeOut((t - delay) / 0.55);
          return { alpha: local, x: 0, y: 0, scale: 0.92 + 0.08 * local };
        };
      } else if (kind === 'spin') {
        e.sceneAlpha = easeOut(t / 0.25);
        e.strength = easeOut((t - 0.55) / 0.45);
      } else if (kind === 'deal') {
        e.strength = easeOut((t - 0.45) / 0.5);
        e.card = rel => {
          const spread = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.3;
          const local = easeOut((t - 0.12 - spread) / 0.5);
          return { alpha: easeOut((t - spread) / 0.12), x: -rel * (1 - local), y: 0, scale: 1 };
        };
      } else {
        e.sceneAlpha = easeOut(t);
        e.strength = easeOut(t);
      }
      return e;
    };

    const beginIntro = (s, m) => {
      const kind = reducedMotion && s.intro !== 'none' ? 'fade' : s.intro;
      introState.kind = INTRO_DURATION[kind] ? kind : 'none';
      introState.running = introState.kind !== 'none';
      introState.done = !introState.running;
      introState.t = 0;
      if (introState.done) {
        this.revealed = true;
        if (this.captionEl) this.captionEl.style.display = 'flex';
      }
      if (introState.kind === 'spin') {
        const distance = m.loop * 1.6 + width;
        pos = goal + distance;
        vel = -distance * 3;
        mode = 'spring';
      }
    };

    const resize = () => {
      if (this.options && this.options.rotation === undefined) {
        this.rotation = window.innerWidth < 900 ? -12 : -20;
      }
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      renderer.dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)));
      renderer.setSize(width, height);
      target.setSize(Math.max(2, Math.round(width * renderer.dpr)), Math.max(2, Math.round(height * renderer.dpr)));
      lensUniforms.tScene.value = target.texture;
      dirty = true;
      start();
    };

    const frame = now => {
      raf = 0;
      if (!alive) return;
      const s = this.settings;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      if (!s || !slots.length) {
        if (visible) raf = requestAnimationFrame(frame);
        return;
      }

      const m = metrics(s);
      const n = slots.length;
      let animating = false;

      if (resnap) {
        goal = snapPoint(m, goal);
        pos = goal;
        vel = 0;
        resnap = false;
      } else if (layout && layout.loop !== m.loop) {
        pos = remap(layout, m, pos);
        goal = remap(layout, m, goal);
        pointer.startPos = pos + (pointer.x - pointer.startX);
        animating = true;
      }
      layout = m;

      if (!introState.running && !introState.done) {
        const allSettled = slots.every(slot => slot.loaded || slot.failed);
        if (allSettled || now - introState.readyAt > 3500) {
          goal = snapPoint(m, goal);
          pos = goal;
          beginIntro(s, m);
        }
      }
      if (introState.running) {
        introState.t = Math.min(1, introState.t + dt / (INTRO_DURATION[introState.kind] || 1));
        if (introState.t >= 1) {
          introState.running = false;
          introState.done = true;
          this.revealed = true;
          if (this.captionEl) this.captionEl.style.display = 'flex';
        }
        animating = true;
      }

      if (mode === 'wheel' && now - wheelAt > 150) {
        goal = snapPoint(m, goal);
        mode = 'spring';
      }
      if (!pointer.dragging) {
        const spinning = introState.running && introState.kind === 'spin';
        const stiffness = spinning ? 9 : mode === 'wheel' ? 80 : 55;
        const damping = 2 * Math.sqrt(stiffness);
        const steps = Math.ceil(dt / (1 / 240));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          const acc = stiffness * (goal - pos) - damping * vel;
          vel += acc * h;
          pos += vel * h;
        }
        if (Math.abs(goal - pos) < 0.05 && Math.abs(vel) < 0.5) {
          pos = goal;
          vel = 0;
        } else {
          animating = true;
        }
      } else {
        animating = true;
      }

      if (Math.abs(pos) > m.loop * 8) {
        const shift = Math.round(pos / m.loop) * m.loop;
        pos -= shift;
        goal -= shift;
        pointer.startPos -= shift;
      }

      const current = nearest(m, pos);
      if (current !== activeIndex) {
        activeIndex = current;
        this.active = current;
        this.updateCaptionUI(current);
        this.onChange?.(current, this.list[current]);
      }

      if (focus.pending >= 0 && mode === 'spring' && Math.abs(goal - pos) < 1.5 && Math.abs(vel) < 30) {
        if (current === focus.pending) openFocus(current);
        else focus.pending = -1;
      }

      if (
        s.autoplay &&
        !reducedMotion &&
        introState.done &&
        focus.target === 0 &&
        focus.t < 0.01 &&
        !pointer.over &&
        !pointer.down &&
        !hasFocus &&
        mode === 'spring' &&
        Math.abs(goal - pos) < 1 &&
        now - interactedAt > 3000 &&
        now - autoplayAt > s.interval * 1000
      ) {
        autoplayAt = now;
        step(m, 1);
      }
      if (s.autoplay && !reducedMotion) animating = true;

      const travel = Math.abs(pos - lastPos) / dt;
      lastPos = pos;
      const energyTarget = reducedMotion ? 0 : Math.min(travel / 2600, 1);
      energy += (energyTarget - energy) * (1 - Math.exp(-dt / (energyTarget > energy ? 0.07 : 0.35)));
      if (energy > 0.001) animating = true;
      const liquidAmount = reducedMotion ? 0 : s.liquid;
      const push = Math.max(-1, Math.min(1, vel / 2200));
      const deformStiffness = 120;
      const deformDamping = 2 * Math.sqrt(deformStiffness) * 0.32;
      deformVel += (deformStiffness * (push - deform) - deformDamping * deformVel) * dt;
      deform += deformVel * dt;
      if (Math.abs(deform) > 0.0005 || Math.abs(deformVel) > 0.005) animating = true;

      const focusStiffness = 64;
      focus.v += (focusStiffness * (focus.target - focus.t) - 2 * Math.sqrt(focusStiffness) * focus.v) * dt;
      focus.t += focus.v * dt;
      if (Math.abs(focus.target - focus.t) < 0.0005 && Math.abs(focus.v) < 0.001) {
        focus.t = focus.target;
        focus.v = 0;
      } else {
        animating = true;
      }
      const focusAmount = clamp01(focus.t);
      const focusEase = easeInOut(focusAmount);
      const focusW = focus.index >= 0 && focus.index < n ? m.widths[focus.index] : m.cardH;
      const focusScale = Math.max(1, Math.min(1.3, (height * 0.84) / m.cardH, (width * 0.92) / focusW));
      const nextLift = 1 + (focusScale - 1) * focusEase;
      if (Math.abs(nextLift - lift) > 0.0005) {
        lift = nextLift;
        container.style.setProperty('--flex-carousel-lift', lift.toFixed(4));
      }

      const effects = introEffects();

      const homeX = width / 2;
      const homeY = height / 2;
      const follow = s.followCursor && pointer.over && !pointer.dragging && !pointer.touch && focus.target === 0;
      const aimX = follow ? pointer.x : homeX;
      const aimY = follow ? pointer.y : homeY;
      if (!lens.ready) {
        lens.x = homeX;
        lens.y = homeY;
        lens.ready = true;
      }
      const lensK = 110;
      const lensC = 2 * Math.sqrt(lensK) * 0.8;
      lens.vx += (lensK * (aimX - lens.x) - lensC * lens.vx) * dt;
      lens.vy += (lensK * (aimY - lens.y) - lensC * lens.vy) * dt;
      lens.x += lens.vx * dt;
      lens.y += lens.vy * dt;
      if (Math.abs(aimX - lens.x) + Math.abs(aimY - lens.y) > 0.2 || Math.abs(lens.vx) + Math.abs(lens.vy) > 0.5)
        animating = true;

      const cardH = m.cardH;
      let halfW = (s.lensWidth * width) / 2;
      let halfH = (s.lensHeight * width) / 2;
      const squash = Math.abs(deform) * liquidAmount;
      halfW *= 1 + squash * 0.16;
      halfH *= 1 - squash * 0.08;
      const lensX = lens.x - deform * 14 * liquidAmount;

      for (let i = 0; i < n; i++) {
        const slot = slots[i];
        if (slot.loaded && slot.ready < 1) {
          slot.ready = Math.min(1, slot.ready + dt / 0.45);
          animating = true;
        }
      }

      const waiting = !introState.done;
      if (dirty || animating || pointer.dragging) {
        dirty = false;
        instances = [];
        const dpr = renderer.dpr;
        cardProgram.uniforms.uResolution.value = [width, height];
        cardProgram.uniforms.uDpr.value = dpr;
        cardProgram.uniforms.uRadius.value = s.radius;
        const shrink = 1 - clamp01(s.squeeze) * energy;
        const draws = [];
        for (let i = 0; i < n; i++) {
          const w = m.widths[i];
          const baseRel = wrap(m.centers[i] - pos, m.loop);
          for (let k = -3; k <= 3; k++) {
            const rel = baseRel + k * m.loop;
            if (Math.abs(rel) - w / 2 > width + 40) continue;
            const fx = effects.card ? effects.card(rel) : null;
            let x = homeX + rel + (fx ? fx.x : 0);
            let scale = shrink * (fx ? fx.scale : 1);
            let alpha = fx ? fx.alpha : 1;
            if (focusAmount > 0) {
              if (i === focus.index && Math.abs(rel) < w) {
                scale *= 1 + (focusScale - 1) * focusEase;
              } else {
                const order = Math.min(Math.abs(rel) / width, 1) * 0.25;
                const part = easeInOut(focusAmount * 1.25 - order);
                x += Math.sign(rel) * part * width * 0.7;
                alpha *= 1 - part;
              }
            }
            const cw = w * scale;
            if (alpha <= 0.001 || x + cw / 2 < -40 || x - cw / 2 > width + 40) continue;
            draws.push({ i, rel, x, y: homeY + (fx ? fx.y : 0), cw, ch: cardH * scale, alpha });
          }
        }
        draws.sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel));
        let first = true;
        for (const draw of draws) {
          const slot = slots[draw.i];
          cardProgram.uniforms.tMap.value = slot.texture;
          cardProgram.uniforms.uRect.value = [draw.x, draw.y, draw.cw + 2, draw.ch + 2];
          cardProgram.uniforms.uSize.value = [draw.cw, draw.ch];
          cardProgram.uniforms.uImage.value = slot.image;
          cardProgram.uniforms.uAlpha.value = draw.alpha;
          cardProgram.uniforms.uReady.value = slot.ready;
          cardProgram.uniforms.uShift.value = reducedMotion ? 0 : Math.max(-1, Math.min(1, draw.rel / (width * 0.75)));
          cardProgram.uniforms.uPlaceholder.value = slot.color;
          renderer.render({ scene: cardMesh, target, clear: first });
          first = false;
          instances.push({
            index: draw.i,
            x0: draw.x - draw.cw / 2,
            x1: draw.x + draw.cw / 2,
            y0: draw.y - draw.ch / 2,
            y1: draw.y + draw.ch / 2
          });
        }
        if (first) {
          renderer.bindFramebuffer(target);
          gl.viewport(0, 0, target.width, target.height);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        renderer.bindFramebuffer();
        target.texture.bind();
        gl.generateMipmap(gl.TEXTURE_2D);

        lensUniforms.uResolution.value = [width, height];
        lensUniforms.uDpr.value = dpr;
        lensUniforms.uCenter.value = [lensX, lens.y];
        lensUniforms.uHalf.value = [Math.max(halfW, 1), Math.max(halfH, 1)];
        lensUniforms.uAngle.value = (s.tilt * Math.PI) / 180;
        lensUniforms.uExponent.value = 2 + Math.pow(1 - clamp01(s.roundness), 1.5) * 10;
        const spanW = Math.max(halfW, 1);
        const spanH = Math.max(halfH, 1);
        const inner = Math.max(4, s.reach * (spanW + spanH) * 0.5);
        lensUniforms.uInner.value = inner;
        lensUniforms.uOuter.value = inner * 1.6;
        lensUniforms.uFlow.value = s.bend * (spanW + spanH) * 0.45;
        lensUniforms.uCurl.value = s.curl === 'rise' ? 1 : s.curl === 'fall' ? -1 : 0;
        lensUniforms.uDispersion.value = s.dispersion * 0.12 * (1 + Math.abs(deform) * liquidAmount * 1.2);
        lensUniforms.uStrength.value = effects.strength * (1 - focusEase);
        lensUniforms.uSceneAlpha.value = effects.sceneAlpha;
        renderer.render({ scene: lensMesh });
      }

      let nextHover = '';
      if (pointer.over && !pointer.dragging && introState.done && s.focusOnClick) {
        const hit = instances.find(
          inst => pointer.x >= inst.x0 && pointer.x <= inst.x1 && pointer.y >= inst.y0 && pointer.y <= inst.y1
        );
        if (focus.target > 0) nextHover = 'close';
        else if (hit) nextHover = 'open';
      }
      if (nextHover !== hover) {
        hover = nextHover;
        if (hover) container.setAttribute('data-hover', hover);
        else container.removeAttribute('data-hover');
      }

      if (visible && (animating || waiting || dirty || pointer.down)) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || !visible || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const localPoint = e => {
      const rect = container.getBoundingClientRect();
      const rot = this.rotation || 0;
      if (!rot) {
        return [e.clientX - rect.left, e.clientY - rect.top];
      }
      const rad = (rot * Math.PI) / 180;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);
      const lx = dx * cos - dy * sin + width / 2;
      const ly = dx * sin + dy * cos + height / 2;
      return [lx, ly];
    };

    const onPointerDown = e => {
      if (e.button !== undefined && e.button > 0) return;
      skipIntro();
      const [x, y] = localPoint(e);
      pointer.down = true;
      pointer.id = e.pointerId;
      pointer.touch = e.pointerType === 'touch';
      pointer.startX = x;
      pointer.startY = y;
      pointer.x = x;
      pointer.y = y;
      pointer.startPos = pos;
      pointer.dragging = false;
      pointer.samples = [{ x, t: performance.now() }];
      interactedAt = performance.now();
      if (Math.abs(vel) > 40) {
        goal = pos;
        vel = 0;
      }
      dirty = true;
      start();
    };

    const onPointerMove = e => {
      const [x, y] = localPoint(e);
      pointer.x = x;
      pointer.y = y;
      pointer.over = true;
      if (pointer.down && e.pointerId === pointer.id) {
        const dx = x - pointer.startX;
        const dy = y - pointer.startY;
        const slop = pointer.touch ? 10 : 5;
        if (!pointer.dragging) {
          if (pointer.touch && Math.abs(dy) > slop && Math.abs(dy) > Math.abs(dx)) {
            pointer.down = false;
            return;
          }
          if (Math.abs(dx) > slop) {
            pointer.dragging = true;
            pointer.startX = x;
            pointer.startPos = pos;
            closeFocus();
            try {
              container.setPointerCapture(e.pointerId);
            } catch {
              pointer.dragging = true;
            }
            container.setAttribute('data-dragging', '');
          }
        }
        if (pointer.dragging) {
          pos = pointer.startPos - (x - pointer.startX);
          goal = pos;
          vel = 0;
          const now = performance.now();
          pointer.samples.push({ x, t: now });
          while (pointer.samples.length > 2 && now - pointer.samples[0].t > 100) pointer.samples.shift();
        }
      }
      dirty = true;
      start();
    };

    const onPointerUp = e => {
      if (!pointer.down || e.pointerId !== pointer.id) return;
      pointer.down = false;
      container.removeAttribute('data-dragging');
      const s = this.settings;
      if (!s) return;
      const m = metrics(s);
      interactedAt = performance.now();
      if (pointer.dragging) {
        pointer.dragging = false;
        const now = performance.now();
        const first = pointer.samples[0];
        const lastSample = pointer.samples[pointer.samples.length - 1];
        let velocity = 0;
        if (first && lastSample && lastSample.t > first.t && now - lastSample.t < 70) {
          velocity = -((lastSample.x - first.x) / (lastSample.t - first.t)) * 1000;
        }
        vel = velocity;
        const landing = snapPoint(m, pos + velocity * 0.32);
        goal = landing;
        if (Math.abs(velocity) > 400 && Math.abs(landing - pos) < 1) step(m, velocity > 0 ? 1 : -1);
        mode = 'spring';
        start();
        return;
      }
      if (closeFocus()) return;
      const [x, y] = localPoint(e);
      const hit = instances.find(inst => x >= inst.x0 && x <= inst.x1 && y >= inst.y0 && y <= inst.y1);
      if (!hit) return;
      if (hit.index === activeIndex && Math.abs(goal - pos) < 2) {
        this.onSelect?.(hit.index, this.list[hit.index]);
        if (s.focusOnClick) openFocus(hit.index);
      } else {
        const rel = (hit.x0 + hit.x1) / 2 - width / 2;
        goal = snapPoint(m, pos + rel);
        mode = 'spring';
        if (s.focusOnClick) focus.pending = hit.index;
        start();
      }
    };

    const onPointerLeave = () => {
      pointer.over = false;
      dirty = true;
      start();
    };

    const onPointerCancel = () => {
      pointer.down = false;
      pointer.dragging = false;
      container.removeAttribute('data-dragging');
      const s = this.settings;
      if (!s) return;
      goal = snapPoint(metrics(s), pos);
      mode = 'spring';
      start();
    };

    const onWheel = e => {
      const s = this.settings;
      if (!s || e.ctrlKey) return;
      let dx = e.deltaX;
      let dy = e.deltaY;
      if (e.shiftKey && Math.abs(dx) < Math.abs(dy)) {
        dx = dy;
        dy = 0;
      }
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? height : 1;
      const horizontal = Math.abs(dx) > Math.abs(dy);
      if (!horizontal && !s.captureWheel) return;
      e.preventDefault();
      skipIntro();
      interactedAt = performance.now();
      if (closeFocus()) return;
      const delta = Math.max(-120, Math.min(120, (horizontal ? dx : dy) * unit));
      goal += delta * 1.25;
      mode = 'wheel';
      wheelAt = performance.now();
      start();
    };

    const onKeyDown = e => {
      const s = this.settings;
      if (!s) return;
      const m = metrics(s);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        skipIntro();
        closeFocus();
        interactedAt = performance.now();
        step(m, 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        skipIntro();
        closeFocus();
        interactedAt = performance.now();
        step(m, -1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        closeFocus();
        goTo(m, 0);
      } else if (e.key === 'End') {
        e.preventDefault();
        closeFocus();
        goTo(m, slots.length - 1);
      } else if (e.key === 'Escape') {
        if (closeFocus()) e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (closeFocus() || activeIndex < 0) return;
        this.onSelect?.(activeIndex, this.list[activeIndex]);
        if (s.focusOnClick) openFocus(activeIndex);
      }
    };

    const onFocus = () => {
      hasFocus = true;
    };
    const onBlur = () => {
      hasFocus = false;
    };
    const onVisibility = () => {
      if (!document.hidden) start();
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointerleave', onPointerLeave);
    container.addEventListener('pointercancel', onPointerCancel);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('keydown', onKeyDown);
    container.addEventListener('focus', onFocus);
    container.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    intersectionObserver.observe(container);

    this.internal = {
      wake: () => {
        dirty = true;
        start();
      },
      setItems,
      step: delta => {
        const s = this.settings;
        if (s) step(metrics(s), delta);
      },
      goTo: index => {
        const s = this.settings;
        if (s) goTo(metrics(s), index);
      },
      destroy: () => {
        alive = false;
        visible = false;
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        container.removeEventListener('pointerdown', onPointerDown);
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerup', onPointerUp);
        container.removeEventListener('pointerleave', onPointerLeave);
        container.removeEventListener('pointercancel', onPointerCancel);
        container.removeEventListener('wheel', onWheel);
        container.removeEventListener('keydown', onKeyDown);
        container.removeEventListener('focus', onFocus);
        container.removeEventListener('blur', onBlur);
        document.removeEventListener('visibilitychange', onVisibility);
        slots.forEach(slot => slot.dispose());
        slots = [];
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        if (this.captionEl && this.captionEl.parentNode) this.captionEl.parentNode.removeChild(this.captionEl);
        if (this.liveEl && this.liveEl.parentNode) this.liveEl.parentNode.removeChild(this.liveEl);
      }
    };

    resize();
    setItems(this.list);
  }

  setItems(newItems) {
    this.list = newItems && newItems.length ? newItems : DEFAULT_ITEMS;
    if (this.totalEl) this.totalEl.textContent = String(this.list.length).padStart(2, '0');
    this.internal?.setItems(this.list);
  }

  next() {
    this.internal?.step(1);
  }

  prev() {
    this.internal?.step(-1);
  }

  goTo(index) {
    this.internal?.goTo(index);
  }

  destroy() {
    this.internal?.destroy();
  }
}

export default function FlexCarousel(container, options) {
  return new VanillaFlexCarousel(container, options);
}
