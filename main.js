/* ==============================================================
   INFINITE VOID — NASA SPACE APPS 2026
   Main JS: Smooth Video Player + 2-Screen Snap (Video -> Astronauts)
   ============================================================== */
import * as THREE from 'three';
import { initUnifiedLanyardStage } from './lanyardStage.js?v=20261021k';
import { VanillaInfiniteMenu } from './InfiniteMenu.js?v=20261021s';

// ─── 1. STARFIELD BACKGROUND ─────────────────────────────────
class Starfield {
  constructor() {
    this.canvas = document.getElementById('starfield');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.mx = 0; this.my = 0; this.tmx = 0; this.tmy = 0;
    this.resize();
    this.create();
    this.listen();
    this.draw();
  }
  resize() {
    this.w = this.canvas.width = window.innerWidth;
    this.h = this.canvas.height = window.innerHeight;
  }
  create() {
    this.stars = [];
    const n = Math.min(250, Math.floor((this.w * this.h) / 5000));
    for (let i = 0; i < n; i++) {
      this.stars.push({
        x: Math.random() * this.w, y: Math.random() * this.h,
        z: Math.random() * 2 + 0.3, r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.7 + 0.3, s: Math.random() * 0.015 + 0.004,
        p: Math.random() * Math.PI * 2,
        c: Math.random() > 0.35 ? '#fff' : (Math.random() > 0.5 ? '#00f0ff' : '#38bdf8'),
      });
    }
  }
  listen() {
    window.addEventListener('resize', () => { this.resize(); this.create(); });
    window.addEventListener('mousemove', (e) => {
      this.tmx = (e.clientX - this.w / 2) * 0.03;
      this.tmy = (e.clientY - this.h / 2) * 0.03;
    });
  }
  draw() {
    this.mx += (this.tmx - this.mx) * 0.05;
    this.my += (this.tmy - this.my) * 0.05;
    this.ctx.clearRect(0, 0, this.w, this.h);
    for (const s of this.stars) {
      s.p += s.s;
      const alpha = Math.max(0.1, s.a + Math.sin(s.p) * 0.3);
      this.ctx.beginPath();
      this.ctx.arc(s.x - this.mx * s.z, s.y - this.my * s.z, s.r * s.z * 0.65, 0, Math.PI * 2);
      this.ctx.fillStyle = s.c;
      this.ctx.globalAlpha = alpha;
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
    requestAnimationFrame(() => this.draw());
  }
}

// ─── 2. TACTICAL SCI-FI AUDIO SYNTHESIZER (Web Audio API) ──────
class TacticalAudio {
  constructor() {
    this.ctx = null;
  }
  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playBeep(freq = 980, duration = 0.06, type = 'sine') {
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
  playScanSweep() {
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.07, this.ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {}
  }
  playCommsBurst() {
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const tones = [980, 1320, 880, 1540];
      tones.forEach((freq, idx) => {
        setTimeout(() => {
          this.playBeep(freq, 0.05, 'triangle');
        }, idx * 75);
      });
    } catch (e) {}
  }
}

// ─── 3. VIDEO PLAYER & 4-PHASE TRANSITIONS (Video 1 -> Encounter -> Video 2 -> Video 3) ──
class VideoStoryApp {
  constructor() {
    this.screen           = document.getElementById('frame-screen');
    this.video            = document.getElementById('scene-video');
    this.video2           = document.getElementById('scene-video-2');
    this.video3           = document.getElementById('scene-video-3');
    this.imageMeet        = document.getElementById('scene-image-meet');
    this.videoSection     = document.getElementById('video-screen-phase');
    this.imageSection     = document.getElementById('image-screen-phase');
    this.videoSection2    = document.getElementById('video-screen-phase-2');
    this.videoSection3    = document.getElementById('video-screen-phase-3');
    this.exitBtn          = document.getElementById('frame-exit-btn');
    this.launchBtn        = document.getElementById('btn-launch');
    this.heroVideo        = document.getElementById('hero-bg-video');
    this.titleVideo       = document.getElementById('title-mask-video');
    this.audioBtn         = document.getElementById('audio-toggle-btn');
    this.audioIcon        = document.getElementById('audio-icon');

    this.sfx = new TacticalAudio();

    if (!this.video || !this.screen) return;

    this.isOpen = false;
    this.isMuted = false;
    this.activeVideo = this.video;

    this.init();
  }

  init() {
    // Launch button: opens full laptop screen overlay and plays video 1
    if (this.launchBtn) {
      this.launchBtn.addEventListener('click', () => this.open());
    }

    // Exit button
    if (this.exitBtn) {
      this.exitBtn.addEventListener('click', () => this.close());
    }

    // Synchronize hero background video and title masked video playhead
    if (this.heroVideo && this.titleVideo) {
      this.heroVideo.muted = true;
      this.titleVideo.muted = true;
      this.heroVideo.play().catch(() => {});
      this.titleVideo.play().catch(() => {});

      // Smooth synchronization without decoder seek-thrashing
      let lastSync = 0;
      const syncHeroVideos = () => {
        const now = performance.now();
        if (now - lastSync < 1000) return; // Check at most once per second
        if (Math.abs(this.titleVideo.currentTime - this.heroVideo.currentTime) > 0.4) {
          this.titleVideo.currentTime = this.heroVideo.currentTime;
          lastSync = now;
        }
      };
      this.heroVideo.addEventListener('timeupdate', syncHeroVideos);
      this.heroVideo.addEventListener('play', () => {
        this.titleVideo.currentTime = this.heroVideo.currentTime;
        this.titleVideo.play().catch(() => {});
      });
      this.heroVideo.addEventListener('pause', () => {
        this.titleVideo.pause();
      });
      this.heroVideo.addEventListener('seeked', () => {
        this.titleVideo.currentTime = this.heroVideo.currentTime;
      });
    }

    // Click on video to toggle play / pause
    this.video.addEventListener('click', () => {
      this.togglePlayPause(this.video);
    });
    if (this.video2) {
      this.video2.addEventListener('click', () => {
        this.togglePlayPause(this.video2);
      });
    }
    if (this.video3) {
      this.video3.addEventListener('click', () => {
        this.togglePlayPause(this.video3);
      });
    }

    // Audio toggle button
    if (this.audioBtn) {
      this.audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleAudio();
      });
    }

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        this.close();
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayPause(this.activeVideo || this.video);
      } else if (e.key === 'm' || e.key === 'M') {
        this.toggleAudio();
      }
    });

    // Screen intersection observer for automatic play/pause across phases
    // Phase 1: Video 1 | Phase 2: Encounter Image | Phase 3: Video 2 | Phase 4: Video 3 (Scene 10)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!this.isOpen) return;
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (entry.target === this.videoSection) {
              if (this.video2) this.video2.pause();
              if (this.video3) this.video3.pause();
              this.activeVideo = this.video;
              this.safePlay(this.video);
            } else if (entry.target === this.imageSection) {
              // Middle screen: pause all videos
              this.video.pause();
              if (this.video2) this.video2.pause();
              if (this.video3) this.video3.pause();
              this.activeVideo = null;
            } else if (entry.target === this.videoSection2) {
              // Video 2 screen
              this.video.pause();
              if (this.video3) this.video3.pause();
              this.activeVideo = this.video2;
              if (this.video2) {
                this.safePlay(this.video2);
              }
            } else if (entry.target === this.videoSection3) {
              // Video 3 (Scene 10) screen
              this.video.pause();
              if (this.video2) this.video2.pause();
              this.activeVideo = this.video3;
              if (this.video3) {
                this.safePlay(this.video3);
              }
            }
          }
        });
      }, { root: this.screen, threshold: 0.5 });

      if (this.videoSection) observer.observe(this.videoSection);
      if (this.imageSection) observer.observe(this.imageSection);
      if (this.videoSection2) observer.observe(this.videoSection2);
      if (this.videoSection3) observer.observe(this.videoSection3);
    }
  }

  safePlay(videoEl) {
    if (!videoEl) return;
    videoEl.muted = this.isMuted;
    const p = videoEl.play();
    if (p !== undefined) {
      p.catch(() => {
        videoEl.muted = true;
        this.isMuted = true;
        if (this.audioIcon) this.audioIcon.textContent = '🔇';
        if (this.audioBtn) this.audioBtn.classList.add('muted');
        videoEl.play().catch(() => {});
      });
    }
  }

  toggleAudio() {
    this.isMuted = !this.isMuted;
    this.video.muted = this.isMuted;
    if (this.video2) this.video2.muted = this.isMuted;
    if (this.video3) this.video3.muted = this.isMuted;

    if (this.audioBtn) {
      this.audioBtn.classList.toggle('muted', this.isMuted);
    }
    if (this.audioIcon) {
      this.audioIcon.textContent = this.isMuted ? '🔇' : '🔊';
    }
  }

  togglePlayPause(videoEl) {
    const target = videoEl || this.video;
    if (!target) return;
    if (target.ended) {
      target.currentTime = 0;
      this.safePlay(target);
    } else if (target.paused) {
      this.safePlay(target);
    } else {
      target.pause();
    }
  }

  open() {
    this.isOpen = true;
    this.screen.classList.remove('hidden');
    this.screen.scrollTop = 0;
    this.activeVideo = this.video;

    // Pause hero background video and title masked video to save bandwidth/resources
    if (this.heroVideo) {
      this.heroVideo.pause();
    }
    if (this.titleVideo) {
      this.titleVideo.pause();
    }

    // Reset and start Scene 1 video playback
    this.video.currentTime = 0;
    this.video.muted = false;
    this.video.volume = 1.0;
    if (this.video2) {
      this.video2.currentTime = 0;
      this.video2.muted = false;
      this.video2.volume = 1.0;
      this.video2.pause();
    }
    if (this.video3) {
      this.video3.currentTime = 0;
      this.video3.muted = false;
      this.video3.volume = 1.0;
      this.video3.pause();
    }
    this.isMuted = false;
    if (this.audioIcon) this.audioIcon.textContent = '🔊';
    if (this.audioBtn) this.audioBtn.classList.remove('muted');

    requestAnimationFrame(() => {
      this.screen.classList.add('visible');
      document.body.style.overflow = 'hidden';
      this.safePlay(this.video);
    });

    if (this.scrollCue) this.scrollCue.classList.remove('hide');
  }

  close() {
    this.isOpen = false;
    this.video.pause();
    if (this.video2) this.video2.pause();
    if (this.video3) this.video3.pause();
    if (this.heroVideo) {
      this.heroVideo.play().catch(() => {});
    }
    if (this.titleVideo) {
      this.titleVideo.play().catch(() => {});
    }
    this.screen.classList.remove('visible');
    document.body.style.overflow = '';
    setTimeout(() => this.screen.classList.add('hidden'), 400);
  }
}

// ─── 4. APP INIT & LOADING SCREEN ─────────────────────────────
function initLoadingScreen() {
  const loader = document.getElementById('loading-screen');
  if (!loader) return;

  const dismiss = () => {
    if (loader.dataset.dismissed) return;
    loader.dataset.dismissed = 'true';
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 850);
  };

  // Allow the astronaut animation to run smoothly for at least 1.4s on load
  if (document.readyState === 'complete') {
    setTimeout(dismiss, 1400);
  } else {
    window.addEventListener('load', () => {
      setTimeout(dismiss, 1400);
    });
  }

  // Fallback safety timeout
  setTimeout(dismiss, 3500);
}

// ─── 5. 20 NASA MISSIONS WITH DISCARDED EQUIPMENT (MOON & MARS) ─
const NASA_RELIC_MISSIONS = [
  {
    name: 'Surveyor 1',
    year: '1966',
    body: 'Moon',
    site: 'Ocean of Storms (2.474° S, 43.339° W)',
    img: 'public/assets/missions/surveyor3.jpg',
    relics: ['Tripod Lander Frame', 'Radar Altimeter Antenna', 'Survey Television Camera', 'Solid Retro-Rocket Casing'],
    desc: 'The first American spacecraft to achieve a soft touchdown on the extraterrestrial regolith. Its aluminum frame and telemetry systems remain intact in the Ocean of Storms.'
  },
  {
    name: 'Lunar Orbiter 1',
    year: '1966',
    body: 'Moon',
    site: 'Farside Impact Basin (6.70° N, 162.0° E)',
    img: 'public/assets/missions/surveyor3.jpg',
    relics: ['Impact Spacecraft Debris', 'Dual-lens Imaging Package', 'High-gain Dish Antenna'],
    desc: 'Intentionally crashed into the lunar farside on October 29, 1966, to prevent telemetry interference with future missions after mapping Apollo landing candidates.'
  },
  {
    name: 'Surveyor 3',
    year: '1967',
    body: 'Moon',
    site: 'Ocean of Storms (3.015° S, 23.418° W)',
    img: 'public/assets/missions/surveyor3.jpg',
    relics: ['Robotic Lander Frame', 'Soil Mechanics Surface Sampler', 'Television Camera Mount', 'Retro Engine'],
    desc: 'Soft-landed in April 1967. In 1969, Apollo 12 astronauts Pete Conrad and Alan Bean landed nearby, inspected its discarded chassis, and retrieved its camera for Earth testing.'
  },
  {
    name: 'Apollo 11',
    year: '1969',
    body: 'Moon',
    site: 'Sea of Tranquility (0.674° N, 23.473° E)',
    img: 'public/assets/missions/apollo11.jpg',
    relics: ['Eagle Descent Stage with Ladder', 'Passive Seismic Experiment (PSE)', 'Laser Ranging Retroreflector (LRRR)', 'Lunar TV Camera', 'Discarded PLSS Backpacks'],
    desc: 'Humanity’s first crewed landing site. When Neil Armstrong and Buzz Aldrin departed in Eagle’s ascent module, the gold-mylar descent stage and historic science packages remained behind.'
  },
  {
    name: 'Apollo 12',
    year: '1969',
    body: 'Moon',
    site: 'Ocean of Storms (3.012° S, 23.422° W)',
    img: 'public/assets/missions/apollo11.jpg',
    relics: ['Intrepid Descent Stage', 'ALSEP Central Station', 'Solar Wind Spectrometer', 'Suprathermal Ion Detector', 'SNAP-27 Radioisotope Generator'],
    desc: 'Achieved pinpoint touchdown within walking distance of Surveyor 3. The Intrepid descent stage and complete nuclear-powered ALSEP science station remain on the surface.'
  },
  {
    name: 'Apollo 14',
    year: '1971',
    body: 'Moon',
    site: 'Fra Mauro Highlands (3.645° S, 17.471° W)',
    img: 'public/assets/missions/apollo11.jpg',
    relics: ['Antares Descent Stage', 'Modular Equipment Transporter (MET "Rickshaw")', 'Active Seismic Experiment Mortars', 'Charged Particle Detector'],
    desc: 'Alan Shepard and Edgar Mitchell explored the rugged Fra Mauro formation, leaving behind the two-wheeled handcart MET, the Antares descent base, and scientific sensors.'
  },
  {
    name: 'Apollo 15',
    year: '1971',
    body: 'Moon',
    site: 'Hadley Rille (26.132° N, 3.634° E)',
    img: 'public/assets/missions/lunar_rover.jpg',
    relics: ['Falcon Descent Stage', 'Lunar Roving Vehicle (LRV-001)', 'Heat Flow Probes', 'Fallen Astronaut Memorial Figurine'],
    desc: 'The debut of the electric Lunar Roving Vehicle. LRV-001 was parked facing the ascent module to broadcast liftoff back to Earth, remaining permanently parked by Hadley Rille.'
  },
  {
    name: 'Apollo 16',
    year: '1972',
    body: 'Moon',
    site: 'Descartes Highlands (8.973° S, 15.498° E)',
    img: 'public/assets/missions/lunar_rover.jpg',
    relics: ['Orion Descent Stage', 'Lunar Roving Vehicle (LRV-002)', 'Far Ultraviolet Camera/Spectrograph', 'Active Seismic Geophones'],
    desc: 'Explored lunar volcanic highlands. The astronauts drove LRV-002 over 26 kilometers before parking it in the Descartes regolith where it now stands as an enduring monument.'
  },
  {
    name: 'Apollo 17',
    year: '1972',
    body: 'Moon',
    site: 'Taurus-Littrow Valley (20.191° N, 30.772° E)',
    img: 'public/assets/missions/lunar_rover.jpg',
    relics: ['Challenger Descent Stage', 'Lunar Roving Vehicle (LRV-003)', 'Surface Electrical Properties Transmitter', 'Lunar Atmospheric Composition Experiment'],
    desc: 'The final Apollo lunar landing. Gene Cernan and Harrison Schmitt logged 35 kilometers in LRV-003; its taped fender repair and chassis remain poised beneath the Taurus-Littrow massif.'
  },
  {
    name: 'Viking 1 Lander',
    year: '1976',
    body: 'Mars',
    site: 'Chryse Planitia (22.48° N, 49.97° W)',
    img: 'public/assets/missions/viking1.jpg',
    relics: ['Hexagonal Automated Lander Deck', 'Surface Sampling Robotic Arm', 'SNAP-19 RTG Generators', 'Discarded Aeroshell Heat Shield & Chute'],
    desc: 'The first successful long-duration operational lander on Mars. Viking 1 returned weather and soil biology data for 6 years before communications ceased in November 1982.'
  },
  {
    name: 'Viking 2 Lander',
    year: '1976',
    body: 'Mars',
    site: 'Utopia Planitia (47.97° N, 225.74° W)',
    img: 'public/assets/missions/viking1.jpg',
    relics: ['Surface Lander Chassis', 'Seismometer Package', 'Gas Chromatograph-Mass Spectrometer', 'Jettisoned Entry Backshell'],
    desc: 'Touched down in the boulder-strewn plains of Utopia Planitia, operating until 1980. Its robotic scoop trenches and RTG nuclear power unit rest quietly in the Martian permafrost.'
  },
  {
    name: 'Mars Pathfinder',
    year: '1997',
    body: 'Mars',
    site: 'Ares Vallis (19.33° N, 33.55° W)',
    img: 'public/assets/missions/pathfinder.jpg',
    relics: ['Carl Sagan Memorial Lander Base', 'Sojourner 6-wheeled Microrover', 'Deflated Airbag Petals', 'Jettisoned Parachute & Backshell'],
    desc: 'Pioneered airbag landings and robotic microrover traversal on Mars. The unfolded tetrahedral lander and Sojourner microrover permanently rest in the ancient Ares Vallis flood channel.'
  },
  {
    name: 'Mars Polar Lander',
    year: '1999',
    body: 'Mars',
    site: 'Planum Australe (76.1° S, 195.3° W)',
    img: 'public/assets/missions/pathfinder.jpg',
    relics: ['Impacted Lander Structure', 'Deep Space 2 Soil Microprobes', 'Solar Panel Debris'],
    desc: 'Lost during atmospheric entry near the Martian south pole. The spacecraft structure and its dual Deep Space 2 penetrator microprobes rest on the layered polar deposits.'
  },
  {
    name: 'Spirit Rover (MER-A)',
    year: '2004',
    body: 'Mars',
    site: 'Gusev Crater (14.568° S, 175.473° E)',
    img: 'public/assets/missions/opportunity.jpg',
    relics: ['Spirit 6-wheeled Mars Exploration Rover', 'Columbia Memorial Station Lander Base', 'Ejected Heat Shield & Parachute'],
    desc: 'Traveled over 7.7 kilometers exploring the basaltic floor of Gusev Crater. In 2009, it became embedded in soft sand at Troy, where its solar-powered rover chassis now rests.'
  },
  {
    name: 'Opportunity Rover (MER-B)',
    year: '2004',
    body: 'Mars',
    site: 'Meridiani Planum (1.946° S, 354.473° E)',
    img: 'public/assets/missions/opportunity.jpg',
    relics: ['Opportunity Rover', 'Challenger Memorial Station Base', 'Heat Shield Impact Shards & Springs', 'Jettisoned Backshell'],
    desc: 'Traversed 45.16 kilometers across Meridiani Planum over 14.5 years, discovering definitive proof of past liquid water on Mars. Permanently stationed in Perseverance Valley.'
  },
  {
    name: 'Phoenix Mars Lander',
    year: '2008',
    body: 'Mars',
    site: 'Vastitas Borealis (68.218° N, 234.251° E)',
    img: 'public/assets/missions/pathfinder.jpg',
    relics: ['Octagonal Fixed Lander Deck', 'Robotic Digging Trench Arm', 'Surface Stereo Imager Mast', 'Aeroshell & Heat Shield'],
    desc: 'Landed in the Martian arctic plains to confirm water ice just beneath the surface. With the onset of Martian winter, freezing carbon dioxide ice encased its stationary deck.'
  },
  {
    name: 'LCROSS Centaur',
    year: '2009',
    body: 'Moon',
    site: 'Cabeus Crater (84.9° S, 45.5° W)',
    img: 'public/assets/missions/surveyor3.jpg',
    relics: ['Centaur Upper Rocket Stage Impactor', 'Shepherding Spacecraft Impact Debris'],
    desc: 'Intentionally impacted into the permanently shadowed polar crater Cabeus at 9,000 km/h, excavating a plume that definitively verified water ice in the Moon’s deep craters.'
  },
  {
    name: 'Curiosity Descent Stage',
    year: '2012',
    body: 'Mars',
    site: 'Gale Crater (4.589° S, 137.441° E)',
    img: 'public/assets/missions/opportunity.jpg',
    relics: ['Rocket Sky Crane Descent Stage', 'Titanium Heat Shield & Ballast Tungsten Weights', 'Supersonic Parachute & Backshell'],
    desc: 'After lowering the 1-ton Curiosity rover to the Martian floor via sky crane cables, the rocket descent stage flew 650 meters away and impacted safely in the Gale Crater plains.'
  },
  {
    name: 'LADEE Orbiter',
    year: '2014',
    body: 'Moon',
    site: 'Sundman V Crater (10.8° N, 91.6° W)',
    img: 'public/assets/missions/surveyor3.jpg',
    relics: ['Lunar Atmosphere and Dust Environment Explorer Chassis', 'Neutral Mass Spectrometer Debris'],
    desc: 'Studied the ultra-thin lunar exosphere and dust before a planned high-speed impact into the eastern rim of Sundman V crater at the conclusion of its orbital mission.'
  },
  {
    name: 'Perseverance & Ingenuity',
    year: '2021',
    body: 'Mars',
    site: 'Jezero Crater (18.38° N, 77.58° E)',
    img: 'public/assets/missions/opportunity.jpg',
    relics: ['Sky Crane Rocket Descent Stage', 'Jettisoned Supersonic Parachute & Backshell', 'Titanium Entry Heat Shield', 'Ingenuity Helicopter (Retired at Neretva Vallis)'],
    desc: 'The sky crane and backshell debris rest outside Jezero Crater. The Ingenuity Mars helicopter logged 72 historic powered flights before retiring as a monument in January 2024.'
  }
];

class VanillaOptionWheel {
  constructor(rootEl, options = {}) {
    this.root = rootEl;
    if (!this.root) return;

    this.items = options.items || [];
    this.defaultSelected = options.defaultSelected || 0;
    this.textColor = options.textColor || '#7b8898';
    this.activeColor = options.activeColor || '#ffffff';
    this.side = options.side || 'left';
    this.fontSize = options.fontSize || 2.6; // rem
    this.spacing = options.spacing || 1.35;
    this.curve = options.curve !== undefined ? options.curve : 1.0;
    this.tilt = options.tilt !== undefined ? options.tilt : 6.0;
    this.blur = options.blur !== undefined ? options.blur : 2.0;
    this.fade = options.fade !== undefined ? options.fade : 0.25;
    this.minOpacity = options.minOpacity !== undefined ? options.minOpacity : 0.05;
    this.smoothing = options.smoothing !== undefined ? options.smoothing : 200;
    this.inset = options.inset !== undefined ? options.inset : 30;
    this.loop = options.loop || false;
    this.draggable = options.draggable !== undefined ? options.draggable : true;
    this.onChange = options.onChange || null;

    this.pos = this.defaultSelected;
    this.target = this.defaultSelected;
    this.selectedIndex = this.defaultSelected;
    this.lastTime = 0;
    this.rafId = null;
    this.drag = null;
    this.dragMoved = false;
    this.itemEls = [];
    this.wheelTimer = null;
    this.sfx = new TacticalAudio();

    this.initDOM();
    this.bindEvents();
    this.applyTarget(this.defaultSelected, true);
  }

  initDOM() {
    this.root.className = `option-wheel${this.side === 'right' ? ' option-wheel--right' : ''}`;
    this.root.tabIndex = 0;
    this.root.setAttribute('role', 'listbox');
    this.root.setAttribute('aria-label', 'Historic missions option wheel');

    this.root.style.setProperty('--ow-text-color', this.textColor);
    this.root.style.setProperty('--ow-active-color', this.activeColor);
    this.root.style.setProperty('--ow-font-size', `${this.fontSize}rem`);
    this.root.style.setProperty('--ow-inset', `${this.inset}px`);

    this.root.innerHTML = '';
    this.itemEls = [];

    this.items.forEach((label, idx) => {
      const el = document.createElement('div');
      el.className = `option-wheel__item${idx === this.defaultSelected ? ' option-wheel__item--selected' : ''}`;
      el.setAttribute('role', 'option');
      el.setAttribute('aria-selected', idx === this.defaultSelected ? 'true' : 'false');
      el.textContent = label;
      el.addEventListener('click', () => this.handleItemClick(idx));
      this.root.appendChild(el);
      this.itemEls.push(el);
    });
  }

  getRowHeight() {
    const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const fs = parseFloat(getComputedStyle(this.root).getPropertyValue('--ow-font-size')) || this.fontSize;
    return Math.max(fs * this.spacing * remPx, 1);
  }

  runFrame(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const tau = Math.max(this.smoothing, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let next = this.pos + (this.target - this.pos) * k;
    const settled = Math.abs(this.target - next) < 0.001;
    if (settled) next = this.target;
    this.pos = next;

    const n = this.items.length;
    const rowH = this.getRowHeight();
    const mirror = this.side === 'right' ? -1 : 1;
    const tiltRad = (this.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? rowH / tiltRad : 0;

    for (let i = 0; i < n; i++) {
      const el = this.itemEls[i];
      if (!el) continue;
      let d = i - next;
      if (this.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const dist = Math.abs(d);
      let x = 0;
      let y = d * rowH;
      let rot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * this.curve;
        rot = (mirror * ang * 180) / Math.PI;
      }
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      el.style.opacity = String(Math.max(this.minOpacity, 1 - dist * this.fade));
      el.style.filter = this.blur > 0 ? `blur(${(dist * this.blur).toFixed(2)}px)` : 'none';
      el.style.setProperty('--ow-p', Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
    }

    if (!settled) {
      this.rafId = requestAnimationFrame(t => this.runFrame(t));
    } else {
      this.rafId = null;
    }
  }

  startLoop() {
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(t => this.runFrame(t));
  }

  applyTarget(val, snap) {
    const count = this.items.length;
    let v = val;
    if (!this.loop) {
      v = Math.min(Math.max(v, 0), Math.max(count - 1, 0));
    }
    if (snap) v = Math.round(v);
    this.target = v;

    const idx = ((Math.round(v) % count) + count) % count;
    if (idx !== this.selectedIndex) {
      this.selectedIndex = idx;
      this.itemEls.forEach((el, i) => {
        el.classList.toggle('option-wheel__item--selected', i === idx);
        el.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      });
      if (this.onChange) this.onChange(idx, this.items[idx]);
      this.playTick();
    }
    this.startLoop();
  }

  playTick() {
    try {
      this.sfx.playBeep(1350, 0.028, 'triangle');
    } catch (e) {}
  }

  handleItemClick(idx) {
    if (this.dragMoved) return;
    const count = this.items.length;
    const cur = this.target;
    let d = idx - (((cur % count) + count) % count);
    if (this.loop && count > 1) {
      if (d > count / 2) d -= count;
      else if (d < -count / 2) d += count;
    }
    this.applyTarget(cur + d, true);
  }

  bindEvents() {
    // Wheel event
    this.root.addEventListener('wheel', e => {
      e.preventDefault();
      const step = e.deltaY > 0 ? 1 : -1;
      this.applyTarget(Math.round(this.target) + step, true);
    }, { passive: false });

    // Pointer Dragging
    this.root.addEventListener('pointerdown', e => {
      if (!this.draggable) return;
      this.drag = { y: e.clientY, start: this.target, id: e.pointerId };
      this.dragMoved = false;
      this.root.classList.add('option-wheel--dragging');
    });

    this.root.addEventListener('pointermove', e => {
      if (!this.drag) return;
      const dy = e.clientY - this.drag.y;
      if (!this.dragMoved && Math.abs(dy) > 4) {
        this.dragMoved = true;
        try {
          this.root.setPointerCapture(this.drag.id);
        } catch (err) {}
      }
      if (this.dragMoved) {
        const rowH = this.getRowHeight();
        this.applyTarget(this.drag.start - dy / rowH, false);
      }
    });

    const onPointerEnd = () => {
      if (!this.drag) return;
      this.drag = null;
      this.root.classList.remove('option-wheel--dragging');
      if (this.dragMoved) {
        this.applyTarget(this.target, true);
      }
    };

    this.root.addEventListener('pointerup', onPointerEnd);
    this.root.addEventListener('pointercancel', onPointerEnd);

    // Keyboard controls
    this.root.addEventListener('keydown', e => {
      let delta = null;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') delta = -1;
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') delta = 1;
      if (delta == null) return;
      e.preventDefault();
      this.applyTarget(Math.round(this.target) + delta, true);
    });
  }
}

function updateMissionShowcase(idx) {
  const mission = NASA_RELIC_MISSIONS[idx];
  if (!mission) return;

  const bgImage = document.getElementById('missions-bg-image');
  const heading = document.getElementById('mission-heading');
  const subheading = document.getElementById('mission-subheading');
  const paragraph = document.getElementById('mission-paragraph');

  if (bgImage) {
    const cleanImg = mission.img.replace(/^(\.\/)?public\//, '');
    bgImage.style.backgroundImage = `url('/${cleanImg}'), url('${mission.img}')`;
  }

  if (heading) {
    heading.textContent = mission.name.toUpperCase();
  }

  if (subheading) {
    subheading.textContent = `${mission.body} • ${mission.site} (${mission.year})`;
  }

  if (paragraph) {
    paragraph.textContent = mission.desc;
  }
}

function initMissionsPage() {
  const root = document.getElementById('option-wheel-root');
  if (!root) return;

  const itemNames = NASA_RELIC_MISSIONS.map(m => m.name);

  window.missionsOptionWheel = new VanillaOptionWheel(root, {
    items: itemNames,
    defaultSelected: 3, // Start on Apollo 11
    textColor: '#7b8898',
    activeColor: '#ffffff',
    side: 'left',
    fontSize: 2.6,
    spacing: 1.35,
    curve: 1.0,
    tilt: 6.0,
    blur: 2.0,
    fade: 0.25,
    smoothing: 200,
    inset: 30,
    loop: false,
    draggable: true,
    onChange: (index) => {
      updateMissionShowcase(index);
    }
  });

  updateMissionShowcase(3);
}

function initInfiniteMenuPage() {
  const root = document.getElementById('infinite-menu-root');
  if (!root) return;

  const items = NASA_RELIC_MISSIONS.map(m => {
    const cleanImg = m.img.replace(/^(\.\/)?/, '');
    const cleanSite = m.site.split('(')[0].trim();
    return {
      image: cleanImg,
      title: m.name.toUpperCase(),
      description: `${m.body.toUpperCase()} • ${cleanSite} (${m.year}) — ${m.desc.length > 120 ? m.desc.slice(0, 118) + '...' : m.desc}`,
      link: '#experience'
    };
  });

  window.infiniteMenu = new VanillaInfiniteMenu(root, {
    items,
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
    theme: 'dark',
    accentColor: '#ffffff',
    onItemClick: (item, idx) => {
      const launchBtn = document.getElementById('btn-launch');
      if (launchBtn) launchBtn.click();
    }
  });

  // Wire scroll hint button to smoothly go to team section
  const scrollHint = document.getElementById('infinite-menu-scrollhint');
  if (scrollHint) {
    scrollHint.addEventListener('click', () => {
      const teamSection = document.getElementById('team-section');
      if (teamSection) teamSection.scrollIntoView({ behavior: 'smooth' });
    });
    scrollHint.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const teamSection = document.getElementById('team-section');
        if (teamSection) teamSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

/* ==============================================================
   VANILLA STAGGERED MENU (GSAP Powered Port of @react-bits)
   ============================================================== */
class VanillaStaggeredMenu {
  constructor(options = {}) {
    this.wrapper = document.getElementById('staggered-menu');
    if (!this.wrapper) return;

    this.position = options.position || 'right';
    this.colors = options.colors || ['#00f0ff', '#081a36'];
    this.menuButtonColor = options.menuButtonColor || '#ffffff';
    this.openMenuButtonColor = options.openMenuButtonColor || '#00f0ff';
    this.changeMenuColorOnOpen = options.changeMenuColorOnOpen !== false;
    this.accentColor = options.accentColor || '#00f0ff';

    this.isOpen = false;
    this.busy = false;

    this.panel = document.getElementById('staggered-menu-panel');
    this.preLayersContainer = document.getElementById('sm-prelayers');
    this.preLayers = this.preLayersContainer
      ? Array.from(this.preLayersContainer.querySelectorAll('.sm-prelayer'))
      : [];
    this.toggleBtn = document.getElementById('sm-toggle-btn');
    this.icon = document.getElementById('sm-icon');
    this.plusH = document.getElementById('sm-plus-h');
    this.plusV = document.getElementById('sm-plus-v');

    this.openTl = null;
    this.closeTween = null;
    this.spinTween = null;
    this.colorTween = null;
    this.itemEntranceTween = null;

    this.init();
  }

  init() {
    if (typeof gsap === 'undefined') {
      setTimeout(() => this.init(), 50);
      return;
    }

    const offscreen = this.position === 'left' ? -100 : 100;
    gsap.set([this.panel, ...this.preLayers], { xPercent: offscreen, opacity: 1 });
    if (this.preLayersContainer) {
      gsap.set(this.preLayersContainer, { xPercent: 0, opacity: 1 });
    }
    if (this.plusH) gsap.set(this.plusH, { transformOrigin: '50% 50%', rotate: 0 });
    if (this.plusV) gsap.set(this.plusV, { transformOrigin: '50% 50%', rotate: 90 });
    if (this.icon) gsap.set(this.icon, { rotate: 0, transformOrigin: '50% 50%' });
    if (this.toggleBtn) gsap.set(this.toggleBtn, { color: this.menuButtonColor });

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    const closeMark = this.wrapper ? this.wrapper.querySelector('.sm-close-mark') : null;
    if (closeMark) {
      closeMark.addEventListener('click', (e) => {
        if (this.isOpen) {
          e.stopPropagation();
          this.close();
        }
      });
    }

    // Close on click outside
    document.addEventListener('mousedown', (e) => {
      if (!this.isOpen) return;
      if (
        this.panel && !this.panel.contains(e.target) &&
        this.toggleBtn && !this.toggleBtn.contains(e.target)
      ) {
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Handle menu nav links
    const links = this.wrapper.querySelectorAll('.sm-panel-item');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#experience' || link.id === 'sm-nav-experience') {
          e.preventDefault();
          this.close();
          const launchBtn = document.getElementById('btn-launch');
          if (launchBtn) launchBtn.click();
        } else if (href && href.startsWith('#demo')) {
          e.preventDefault();
          this.close();
        } else if (href && href.startsWith('#')) {
          this.close();
        }
      });
    });
  }

  buildOpenTimeline() {
    if (!this.panel) return null;

    this.openTl?.kill();
    this.closeTween?.kill();
    this.closeTween = null;
    this.itemEntranceTween?.kill();

    const itemEls = Array.from(this.panel.querySelectorAll('.sm-panel-itemLabel'));
    const socialTitle = this.panel.querySelector('.sm-socials-title');
    const socialLinks = Array.from(this.panel.querySelectorAll('.sm-socials-link'));

    const offscreen = this.position === 'left' ? -100 : 100;
    const layerStates = this.preLayers.map(el => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) {
      gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    }
    if (socialTitle) {
      gsap.set(socialTitle, { opacity: 0 });
    }
    if (socialLinks.length) {
      gsap.set(socialLinks, { y: 25, opacity: 0 });
    }

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(
      this.panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 0.9,
          ease: 'power4.out',
          stagger: { each: 0.08, from: 'start' }
        },
        itemsStart
      );
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.35;
      if (socialTitle) {
        tl.to(
          socialTitle,
          {
            opacity: 1,
            duration: 0.45,
            ease: 'power2.out'
          },
          socialsStart
        );
      }
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: 'opacity' });
            }
          },
          socialsStart + 0.04
        );
      }
    }

    this.openTl = tl;
    return tl;
  }

  playOpen() {
    if (this.busy) return;
    this.busy = true;
    const tl = this.buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        this.busy = false;
      });
      tl.play(0);
    } else {
      this.busy = false;
    }
  }

  playClose() {
    this.openTl?.kill();
    this.openTl = null;
    this.itemEntranceTween?.kill();

    if (!this.panel) return;
    const all = [...this.preLayers, this.panel];
    this.closeTween?.kill();
    const offscreen = this.position === 'left' ? -100 : 100;
    this.closeTween = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(this.panel.querySelectorAll('.sm-panel-itemLabel'));
        if (itemEls.length) {
          gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        }
        const socialTitle = this.panel.querySelector('.sm-socials-title');
        const socialLinks = Array.from(this.panel.querySelectorAll('.sm-socials-link'));
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
        this.busy = false;
      }
    });
  }

  animateIcon(opening) {
    if (!this.icon) return;
    this.spinTween?.kill();
    if (opening) {
      this.spinTween = gsap.to(this.icon, { rotate: 225, duration: 0.75, ease: 'power4.out', overwrite: 'auto' });
    } else {
      this.spinTween = gsap.to(this.icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
    }
  }

  animateColor(opening) {
    if (!this.toggleBtn) return;
    this.colorTween?.kill();
    if (this.changeMenuColorOnOpen) {
      const targetColor = opening ? this.openMenuButtonColor : this.menuButtonColor;
      this.colorTween = gsap.to(this.toggleBtn, {
        color: targetColor,
        delay: 0.15,
        duration: 0.3,
        ease: 'power2.out'
      });
    } else {
      gsap.set(this.toggleBtn, { color: this.menuButtonColor });
    }
  }

  toggle() {
    const target = !this.isOpen;
    this.isOpen = target;
    this.wrapper.setAttribute('data-open', target ? 'true' : '');
    if (!target) this.wrapper.removeAttribute('data-open');
    if (this.toggleBtn) this.toggleBtn.setAttribute('aria-expanded', target ? 'true' : 'false');
    if (this.panel) this.panel.setAttribute('aria-hidden', target ? 'false' : 'true');

    if (target) {
      this.playOpen();
    } else {
      this.playClose();
    }
    this.animateIcon(target);
    this.animateColor(target);
  }

  close() {
    if (this.isOpen) {
      this.isOpen = false;
      this.wrapper.removeAttribute('data-open');
      if (this.toggleBtn) this.toggleBtn.setAttribute('aria-expanded', 'false');
      if (this.panel) this.panel.setAttribute('aria-hidden', 'true');
      this.playClose();
      this.animateIcon(false);
      this.animateColor(false);
    }
  }
}

// ─── 6. FULL-SCREEN 1-PAGE SNAP NAVIGATION (Hero -> Missions -> Relics Sphere -> Team) ──
class FullPageSectionController {
  constructor() {
    this.sections = [
      document.getElementById('hero-page'),
      document.getElementById('missions-page'),
      document.getElementById('infinite-menu-page'),
      document.getElementById('team-section')
    ].filter(Boolean);

    if (this.sections.length === 0) return;

    this.currentIndex = 0;
    this.isAnimating = false;
    this.animTimeout = null;

    this.detectInitialSection();
    this.bindEvents();
  }

  detectInitialSection() {
    const hash = window.location.hash;
    const targetIdx = this.sections.findIndex(s => '#' + s.id === hash);
    this.currentIndex = targetIdx !== -1 ? targetIdx : 0;
    // Snap directly on initial load
    setTimeout(() => {
      this.goTo(this.currentIndex, false);
    }, 100);
  }

  goTo(index, smooth = true) {
    if (index < 0 || index >= this.sections.length) return;
    this.currentIndex = index;
    this.isAnimating = true;

    const targetSection = this.sections[index];
    const targetTop = targetSection.offsetTop;

    window.scrollTo({
      top: targetTop,
      behavior: smooth ? 'smooth' : 'auto'
    });

    const hash = '#' + targetSection.id;
    if (window.location.hash !== hash) {
      history.replaceState(null, null, hash);
    }

    if (this.animTimeout) clearTimeout(this.animTimeout);
    this.animTimeout = setTimeout(() => {
      this.isAnimating = false;
    }, smooth ? 650 : 50);
  }

  next() {
    if (this.currentIndex < this.sections.length - 1) {
      this.goTo(this.currentIndex + 1, true);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1, true);
    }
  }

  bindEvents() {
    // 1 scroll down = move to next screen; 1 scroll up = move to previous screen
    window.addEventListener('wheel', (e) => {
      const frameScreen = document.getElementById('frame-screen');
      if (frameScreen && !frameScreen.classList.contains('hidden')) return;

      const currentSection = this.sections[this.currentIndex];

      // When on missions-page (option wheel), scrolling spins missions!
      if (currentSection && currentSection.id === 'missions-page' && window.missionsOptionWheel) {
        const wheel = window.missionsOptionWheel;
        // If scrolling up while at top of missions list, navigate back to Hero
        if (e.deltaY < -40 && wheel.selectedIndex <= 0) {
          e.preventDefault();
          this.prev();
          return;
        }
        // If scrolling down while at bottom of missions list, navigate to 3D Infinite Menu
        if (e.deltaY > 40 && wheel.selectedIndex >= wheel.items.length - 1) {
          e.preventDefault();
          this.next();
          return;
        }

        // Spin the option wheel to change missions, images, and text
        e.preventDefault();
        const step = e.deltaY > 0 ? 1 : -1;
        wheel.applyTarget(Math.round(wheel.target) + step, true);
        return;
      }

      // Allow option wheel to spin internally if cursor is over it
      if (e.target && e.target.closest('#option-wheel-root')) return;

      e.preventDefault();

      if (this.isAnimating) return;

      if (Math.abs(e.deltaY) > 20) {
        if (e.deltaY > 0) {
          this.next();
        } else {
          this.prev();
        }
      }
    }, { passive: false });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      const frameScreen = document.getElementById('frame-screen');
      if (frameScreen && !frameScreen.classList.contains('hidden')) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        if (this.currentIndex < this.sections.length - 1) {
          e.preventDefault();
          this.next();
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        if (this.currentIndex > 0) {
          e.preventDefault();
          this.prev();
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.goTo(0, true);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.goTo(this.sections.length - 1, true);
      }
    });

    // Touch swipe navigation for mobile & tablets
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      const frameScreen = document.getElementById('frame-screen');
      if (frameScreen && !frameScreen.classList.contains('hidden')) return;
      if (e.target && e.target.closest('#team-lanyard-stage')) return;
      if (e.target && e.target.closest('.infinite-menu__canvas')) return;

      if (e.changedTouches.length === 1) {
        const diff = touchStartY - e.changedTouches[0].clientY;
        if (Math.abs(diff) > 40) {
          const currentSection = this.sections[this.currentIndex];
          if (currentSection && currentSection.id === 'missions-page' && window.missionsOptionWheel) {
            const wheel = window.missionsOptionWheel;
            if (diff < 0 && wheel.selectedIndex <= 0) {
              this.prev();
              return;
            }
            if (diff > 0 && wheel.selectedIndex >= wheel.items.length - 1) {
              this.next();
              return;
            }
            const step = diff > 0 ? 1 : -1;
            wheel.applyTarget(Math.round(wheel.target) + step, true);
            return;
          }
          if (diff > 0) this.next();
          else this.prev();
        }
      }
    }, { passive: true });

    // Menu links navigation
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href').replace('#', '');
        const targetIndex = this.sections.findIndex(s => s.id === targetId);
        if (targetIndex !== -1) {
          e.preventDefault();
          this.goTo(targetIndex, true);
        }
      });
    });

    // Resize sync: stay snapped to current section
    window.addEventListener('resize', () => {
      if (!this.isAnimating) {
        this.goTo(this.currentIndex, false);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  new Starfield();
  new VideoStoryApp();
  initMissionsPage();
  initInfiniteMenuPage();
  new VanillaStaggeredMenu({
    position: 'right',
    colors: ['#252836', '#111218'],
    accentColor: '#ffffff',
    menuButtonColor: '#ffffff',
    openMenuButtonColor: '#ffffff',
    changeMenuColorOnOpen: false
  });
  initUnifiedLanyardStage();
  new FullPageSectionController();

  console.log('🚀 Infinite Void — Video & Lunar Crew Engine Active.');
});
