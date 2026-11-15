/* ==============================================================
   INFINITE VOID — NASA SPACE APPS 2026
   Main JS: Smooth Video Player + 2-Screen Snap (Video -> Astronauts)
   ============================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { initUnifiedLanyardStage } from './lanyardStage.js?v=20261115_rivishani_new';
import { VanillaInfiniteMenu } from './InfiniteMenu.js?v=20261021t';
import { VanillaDriftWall, NASA_INSIDE_ITEMS } from './DriftWall.js?v=20261022a';
import { VanillaFlexCarousel, NASA_SCIENTIST_ITEMS } from './FlexCarousel.js?v=20261022f';
import { VanillaFolder, RESEARCH_DOSSIERS } from './Folder.js?v=20261115_topics_and_click';
import { VanillaSplashCursor } from './SplashCursor.js?v=20261023a';

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
    window.videoStoryApp = this;

    if (!this.video || !this.screen) return;

    this.isOpen = false;
    this.isMuted = false;
    this.activeVideo = this.video;

    this.init();
  }

  init() {
    // Explore button (id="btn-launch"): pushes smoothly to the below missions section
    if (this.launchBtn) {
      this.launchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.fullPageController) {
          window.fullPageController.goTo(1, true);
        } else {
          const missions = document.getElementById('missions-page');
          if (missions) missions.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Exit button
    if (this.exitBtn) {
      this.exitBtn.addEventListener('click', () => this.close());
    }

    // Play hero background video (stencil overlay reveals video only inside INFINITE VOID text)
    if (this.heroVideo) {
      this.heroVideo.muted = true;
      this.heroVideo.playsInline = true;
      this.heroVideo.play().catch(() => {});
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

// ─── 5. 21 NASA MISSIONS WITH DISCARDED EQUIPMENT (MOON & MARS) ─
const NASA_RELIC_MISSIONS = [
  {
    "name": "Apollo 11",
    "year": "1969",
    "body": "Moon",
    "site": "Sea of Tranquility",
    "status": "Crew returned; descent stage and surface instruments remain",
    "img": "public/assets/missions/apollo11.jpg",
    "relics": [
      "Eagle Lunar Module Descent Stage",
      "Passive Seismic Experiment (PSE)",
      "Laser Ranging Retroreflector (LRRR)",
      "Lunar Surface TV Camera",
      "Discarded PLSS Life-Support Backpacks"
    ],
    "desc": "The first mission to land humans on the Moon. Neil Armstrong and Buzz Aldrin explored the Sea of Tranquility, leaving behind the Eagle lunar module's descent stage and scientific instruments.",
    "purpose": "The central objective was to land astronauts on the Moon and bring them safely to Earth. The crew also had to test surface procedures, gather rock and soil samples, take photographs and deploy simple scientific experiments without taking unacceptable risks during a short stay. Apollo 11 was therefore both an engineering demonstration and a scientific expedition. The science emphasized the Moon's interior, the Earth-Moon distance and material exposed to the solar wind. The solar-wind collection foil was taken back to Earth for analysis; it should not be presented as an abandoned artifact.",
    "equipment_text": "Eagle's descent stage, complete with landing legs, ladder and descent engine, forms the largest surviving structure at the landing site. The Early Apollo Scientific Experiments Package (EASEP) left a passive seismic experiment and a laser-ranging retroreflector on the ground. The astronauts also left selected tools, packaging and other mission hardware after deciding what needed to return in the ascent stage. The returned lunar samples, photographs and solar-wind foil are not abandoned equipment. The reflector is especially important because it is passive: it does not need electricity to return laser light sent from Earth.",
    "reason_discard": "The descent stage was intentionally left behind because its job was finished after touchdown. Eagle's ascent stage carried the crew back to lunar orbit; lifting the entire vehicle would have required much more fuel. Surface instruments were deliberately deployed to operate or remain after the astronauts departed. Other objects were not retrieved because payload mass, time and crew safety were tightly limited. Apollo 11's left-behind hardware is therefore mostly planned mission architecture, not a pile of malfunctioning machines. The seismic package stopped transmitting long ago, but the reflective array did not become useless when powered operations ended.",
    "scientific_value": "Apollo 11 proved crewed landing and ascent systems, returned the first carefully documented human-collected lunar samples and established reference observations of the lunar surface. Its passive seismometer detected lunar vibrations and helped begin the systematic study of moonquakes. The laser reflector enabled exceptionally precise ranging measurements of the Earth-Moon distance, lunar motion and aspects of the Moon's interior. Lunar samples continue to be studied with instruments that did not exist in 1969. The landing site also serves as an engineering case study in surface operations, dust, thermal protection and human work in low gravity.",
    "future_value": "Apollo 11's legacy will inform how future crews protect historically significant landing sites while operating new equipment nearby. Retroreflector observations can be combined with newer laser-ranging stations to test lunar dynamical models. Images from orbit can help map disturbances and evaluate how old hardware survives radiation, dust and thermal cycling. Any proposal to revisit or sample the historic equipment would require heritage protection, planetary-science justification and careful mission planning. For a website exhibit, separate items that still have passive scientific utility from objects that simply remain as physical evidence of exploration."
  },
  {
    "name": "Apollo 12",
    "year": "1969",
    "body": "Moon",
    "site": "Ocean of Storms",
    "status": "Crew returned; Intrepid descent stage and ALSEP remain",
    "img": "public/assets/missions/apollo12.jpg",
    "relics": [
      "Intrepid Descent Stage Base",
      "Apollo Lunar Surface Experiments Package (ALSEP)",
      "SNAP-27 Radioisotope Thermoelectric Generator",
      "Solar Wind Spectrometer",
      "Surveyor 3 Components Left at Site"
    ],
    "desc": "Apollo 12 achieved a precision landing in the Ocean of Storms. Astronauts visited Surveyor 3, collected parts for study, and left behind the Intrepid descent stage and ALSEP experiments.",
    "purpose": "The mission aimed to demonstrate more accurate landing guidance, extend geologic fieldwork and deploy an Apollo Lunar Surface Experiments Package (ALSEP) for longer-term measurements. Visiting Surveyor 3 added a new test: engineers wanted to understand how materials and hardware had changed after years in the lunar environment. Apollo 12 also studied the local geology of the Ocean of Storms and collected samples for Earth laboratories. Unlike Apollo 11, it deployed a larger scientific station with multiple instruments linked to a central transmitter, beginning a more sustained era of automated lunar observations.",
    "equipment_text": "The principal surface remains include Intrepid's descent stage and the ALSEP central station with its seismic, magnetic-field, solar-wind and charged-particle instruments. Cabling, antenna structures, deployment hardware and selected tools also stayed. Importantly, Apollo 12 did not abandon Surveyor 3's entire camera: astronauts removed and returned its television camera and other parts, including the soil scoop. The remainder of the Surveyor chassis remained at the site. After leaving the surface, Intrepid's ascent stage was deliberately sent to strike the Moon so its impact could be recorded by the newly deployed seismometer.",
    "reason_discard": "Apollo lunar modules separated by design: the descent stage served as a platform and launch pad, while the ascent stage carried the crew away. ALSEP instruments were deliberately left to transmit after the astronauts returned home. The controlled descent of the ascent stage was not an accident or ordinary littering; it was a planned seismic calibration event. Surveyor components were selectively retrieved because a complete spacecraft was too large to bring back, while small representative pieces could reveal effects of radiation, temperature cycles and surface dust. The experiment station continued operating long after the visit, until the Apollo ALSEP network was shut down in 1977.",
    "scientific_value": "Apollo 12 made precision targeting a proven technique, valuable for reaching scientifically interesting or safe landing zones. Its samples improved interpretations of volcanic lunar maria and the timing of the Moon's early history. The Surveyor 3 inspection created a unique materials-science experiment: hardware previously exposed to lunar conditions could be examined in Earth laboratories. Seismic, magnetic and plasma measurements contributed to the first coordinated geophysical picture of the Moon. A deliberately generated impact wave also helped scientists study the way energy propagated through lunar rock, adding information about subsurface structure.",
    "future_value": "A future mission can use Apollo 12 to study the long-term survival of electronics, coatings and structures in vacuum and abrasive regolith. The combined Surveyor-Apollo location could become an important protected heritage zone and a reference for high-resolution orbital imaging. ALSEP archives can be reprocessed with modern methods and compared with measurements by new lunar instruments. The mission is also an excellent teaching example of scientific continuity: one robot prepared the way for humans, humans retrieved parts of the robot, and another automated station carried on investigating after they left. The site should be studied without assuming old hardware is available for unrestricted removal."
  },
  {
    "name": "Apollo 14",
    "year": "1971",
    "body": "Moon",
    "site": "Fra Mauro region",
    "status": "Crew returned; Antares descent stage, ALSEP and handcart remain",
    "img": "public/assets/missions/apollo14.jpg",
    "relics": [
      "Antares Descent Stage",
      "Modular Equipment Transporter (MET Handcart)",
      "Active Seismic Experiment Thumper & Mortars",
      "Charged Particle Lunar Environment Experiment",
      "Laser Ranging Retroreflector (LRRR)"
    ],
    "desc": "Apollo 14 explored the Fra Mauro highlands to uncover the Moon's ancient history. Astronauts collected rocks and left behind the Antares descent stage, seismic instruments, and a laser reflector.",
    "purpose": "The main scientific goal was to investigate material associated with the giant Imbrium impact basin and improve knowledge of the Moon's ancient crust. Mission planners also wanted further experience with longer extravehicular activities, geologic sampling and extended scientific deployments. Astronauts set up the Apollo Lunar Surface Experiments Package, including seismic experiments, and placed a laser ranging reflector. Field documentation mattered: collecting a rock is only scientifically useful when its location and geological setting are properly recorded. Apollo 14 therefore balanced exploration, experiment deployment and the practical realities of walking across uneven terrain.",
    "equipment_text": "The Antares descent stage, its landing gear and unused lower-stage hardware stayed on the Moon. The MET handcart was left after the excursions. Apollo 14's deployed ALSEP equipment included a passive seismic experiment, active seismic sources and other particle or atmospheric sensors; a separate laser-ranging retroreflector also remains. Instruments were arranged at a distance from the lunar module and connected to a central station by cables. Small deployment items, paths and footprints are part of the site record. Rock and soil specimens carried home should not be included in the abandoned-equipment list.",
    "reason_discard": "The lander descent stage was never meant to take off; Antares's ascent stage was the return vehicle. The handcart and surface instruments would have consumed scarce ascent mass and had no purpose on the return journey. ALSEP was intentionally left to work beyond the crew's visit, though powered operation was finite. Apollo 14's ALSEP eventually failed in the 1970s, and the larger network was shut down in 1977. The passive laser reflector is different from a powered instrument: it can be used for laser ranging without batteries or an active transmitter. The Moon's severe temperature changes and dust were important constraints on all deployed hardware.",
    "scientific_value": "Fra Mauro samples helped scientists investigate impact processes and the evolution of the lunar crust. The seismometers, together with instruments at other Apollo sites, supported analysis of internal lunar structure and moonquake activity. The active seismic work and the experiment package improved understanding of the upper regolith and deeper materials. The reflector contributes to precise Earth-Moon distance measurements and tests of lunar motion. Apollo 14 also provided operational lessons about route planning, astronaut fatigue and manual transport, making the unsuccessful-to-complete portions of its field traverse informative rather than merely disappointing.",
    "future_value": "Modern geological mapping can link Apollo 14's photographs, sample records and orbital observations to reconstruct the traverse more accurately. Future crews can learn from the handcart's strengths and limitations when designing small utility vehicles and exploration tools. The landing site has high heritage value, especially because artifacts, experiment positions and footprints preserve a complete fieldwork story. Laser ranging may continue to use the reflector as part of a multi-site network. For your website, the MET makes a memorable visual artifact: a simple human-powered vehicle left on the Moon after helping the crew carry the tools of discovery."
  },
  {
    "name": "Apollo 15",
    "year": "1971",
    "body": "Moon",
    "site": "Hadley-Apennine",
    "status": "Crew returned; Falcon descent stage, first lunar rover and ALSEP remain",
    "img": "public/assets/missions/apollo15.jpg",
    "relics": [
      "Falcon Descent Stage",
      "Lunar Roving Vehicle 1 (LRV-001)",
      "ALSEP Heat Flow Probe",
      "Passive Seismic Station",
      "Lunar Surface Magnetometer"
    ],
    "desc": "Apollo 15 introduced the first Lunar Roving Vehicle, allowing astronauts to explore farther across the Moon. The rover, Falcon descent stage, and scientific instruments remain at Hadley-Apennine.",
    "purpose": "Apollo 15's purpose was to expand exploration range and collect samples from different geological settings rather than only the immediate landing zone. The crew studied possible volcanic deposits, ancient highland rocks and the structure of Hadley Rille. They deployed ALSEP experiments to measure seismic activity, heat flow, magnetic fields and the near-surface environment. The mission also tested improved spacesuits, longer stays, rover navigation, remote scientific equipment and a more ambitious program of observations from lunar orbit. Engineering and geology were tightly connected: the rover was a means of reaching better science, not an end in itself.",
    "equipment_text": "Left on the lunar ground were the Falcon descent stage, the first LRV with its wheels, batteries, antennas and frame, and the deployed ALSEP instruments. These included a heat-flow probe, seismometer and instruments to investigate magnetism and charged particles, linked to a surface station. Rover-mounted gear and some tools remained in place after mission operations. Other equipment had different fates: cameras, film and collected specimens returned with the astronauts; orbital hardware was separate from surface remains. The three lunar rovers on the Moon come specifically from Apollo 15, 16 and 17, not from all six landing missions.",
    "reason_discard": "The rover was designed for use on the Moon and had no practical route back to Earth. Bringing it home would have displaced the much more valuable sample mass and would have exceeded constraints of the small ascent vehicle. Likewise, the descent stage acted as a launch platform and was intentionally left where it landed. ALSEP instruments were installed to continue transmitting after departure, then eventually ceased operation as components aged and the network was retired in 1977. The final parking position of the rover is therefore evidence of a completed field expedition, not a stranded vehicle that could simply have driven home.",
    "scientific_value": "Apollo 15 returned varied rock samples, including ancient highland material, and deepened scientific understanding of lunar volcanism, impact history and crustal evolution. Its heat-flow and seismic data added information about the Moon's internal energy and structure. Geological descriptions tied to measured locations helped make later laboratory analyses meaningful. The rover demonstrated that mobile astronauts could cover a much wider range than foot travel alone, increasing scientific return per day on the surface. The mission was also important for orbital observations and for testing coordination between human field exploration and remotely operating instruments.",
    "future_value": "Future lunar expeditions can use the preserved vehicle as an engineering reference for battery systems, wheels, suspension and dust exposure. The Hadley-Apennine site is a historical laboratory for comparing detailed astronaut records with modern orbital terrain models. Archived heat-flow measurements and sample results can provide context for new investigations of the Moon's thermal evolution. The old rover itself is a protected heritage object, not a ready-to-reuse resource. A strong website feature would let visitors compare a map of the rover's traverse with science stops, recovered samples and the exact types of equipment that still remain at the landing site."
  },
  {
    "name": "Apollo 16",
    "year": "1972",
    "body": "Moon",
    "site": "Descartes Highlands",
    "status": "Crew returned; Orion descent stage, second lunar rover and ALSEP remain",
    "img": "public/assets/missions/apollo16.jpg",
    "relics": [
      "Orion Descent Stage",
      "Lunar Roving Vehicle 2 (LRV-002)",
      "Active Seismic Mortar Package",
      "Far UV Camera / Spectrograph",
      "Damaged Heat-Flow Cable Hardware"
    ],
    "desc": "Apollo 16 explored the Descartes Highlands, revealing important clues about ancient lunar impacts. Its astronauts left behind the Orion descent stage, a lunar rover, and scientific equipment.",
    "purpose": "The scientific objective was to investigate whether the highlands contained volcanic rocks, as some pre-landing interpretations suggested, or materials created by impacts. The crew collected and documented samples from multiple locations and deployed an ALSEP to study the lunar interior and environment. Apollo 16 also tested further rover operations, including navigation, geology at distance from the lander and the relationship between imagery, observations and physical samples. A proposed heat-flow experiment became an important lesson in the fragility of scientific cabling during operations near active astronauts and a complex lunar module.",
    "equipment_text": "Orion's descent stage, Apollo 16's LRV and the ALSEP central station with deployed instruments remain. The science package included passive and active seismic experiments and a surface magnetometer. Heat-flow equipment was deployed, but its cable was accidentally broken during surface activity, preventing the planned measurement; the failed hardware remained at the site. The rover, connected equipment, landing hardware and small surface items preserve a record of the expedition. Returned moonrocks and orbital photography are scientific products, not equipment discarded on the Moon.",
    "reason_discard": "The descent stage and rover were left intentionally because they were not built to return and carrying them would have required more propellant and storage capacity. The experiments were also meant to stay and produce data after the crew's departure. The broken heat-flow cable is a distinct category: it was an unintended operational failure rather than planned end-of-life disposal. Apollo 16's crew and controllers adapted the work plan, continuing other science safely. The passive and active seismic data formed part of the broader ALSEP record, while the instrument network was ultimately discontinued once mission priorities, aging equipment and operating costs changed.",
    "scientific_value": "Samples from the Descartes area showed abundant impact-generated material rather than the expected widespread volcanic deposits. This changed geological interpretations of the lunar highlands and helped scientists understand how giant impacts shaped the early Moon. ALSEP data contributed to studies of seismic waves, magnetism and near-surface conditions. The rover made it possible to sample places far enough apart to test competing hypotheses about regional geology. Even the heat-flow cable incident is scientifically and technically valuable: it demonstrates how astronaut movement, equipment placement and environmental constraints affect data quality on remote surfaces.",
    "future_value": "Apollo 16 offers practical lessons for modern field robotics, cable routing and protection of sensitive instruments during construction or science operations. Its geological record can be revisited with better orbital maps and laboratory techniques, testing how the highland terrain formed. The site contains a rare combination of successful mobile exploration and a documented equipment failure, which can help designers build more fault-tolerant experiments. Its stationary rover and descent stage are historical resources that should be respected during any proposed return. A website could let students compare what mission planners expected to find with what the astronaut-collected rocks actually revealed."
  },
  {
    "name": "Apollo 17",
    "year": "1972",
    "body": "Moon",
    "site": "Taurus-Littrow Valley",
    "status": "Crew returned; Challenger descent stage, third lunar rover and ALSEP remain",
    "img": "public/assets/missions/apollo17.jpg",
    "relics": [
      "Challenger Descent Stage",
      "Lunar Roving Vehicle 3 (LRV-003)",
      "Traverse Gravimeter Experiment (TGE)",
      "Lunar Surface Gravimeter",
      "Lunar Atmospheric Composition Experiment"
    ],
    "desc": "The final Apollo mission to land humans on the Moon explored the Taurus-Littrow Valley. Astronauts left behind the Challenger descent stage, the third lunar rover, and scientific instruments.",
    "purpose": "The mission aimed to maximize geological investigation while conducting long-term geophysical experiments. Astronauts examined valley floors, mountain slopes and boulder fields to understand volcanism, impacts and the Moon's ancient crust. They deployed ALSEP instruments to investigate seismic behavior, thermal properties and the thin lunar exosphere. Apollo 17 also used advanced photography, orbital observations and carefully planned traverse stops. Its extended stay provided a test of how astronauts, rovers and science teams could work together in a demanding environment when every minute, watt of power and kilogram of equipment mattered.",
    "equipment_text": "Challenger's descent stage and the third LRV remain on the surface, along with ALSEP hardware and its connecting cables. The experiment array included heat-flow measurements, a lunar surface gravimeter, seismic-profile work and an atmospheric composition investigation. The rover carried a television camera that permitted people on Earth to watch the lunar module's departure, after which the rover remained parked. Smaller deployment tools and other non-return items stayed in the area. Samples, selected cameras and the ascent crew returned to Earth; those should not be described as abandoned material.",
    "reason_discard": "The descent stage and rover were designed as one-way surface hardware. The ascent stage was the only part required to lift the astronauts from the Moon, so recovering the larger structures would have undermined the entire mission design. Experiments were intentionally left to collect information after the surface crew departed. Some equipment later stopped because of technical limitations and the wider ALSEP network was commanded off in 1977. Apollo 17's artifacts are not evidence of an emergency ending; they represent a planned transfer from active fieldwork to remote scientific monitoring and, finally, a historic resting place.",
    "scientific_value": "Apollo 17 supplied a broad geological collection that continues to inform lunar chronology, volcanic processes, impact history and the nature of the crust. Orange soil revealed important details of ancient volcanic eruptions, while the variety of sample settings supported interpretations of regional history. Surface gravimetry, seismic, atmospheric and thermal experiments contributed to the Apollo geophysical record. The long rover traverses showed how scientific return grows when people can visit several contrasting terrains and record the context of each sample. Results remain relevant whenever new instruments make it possible to ask different questions of archived data and returned rocks.",
    "future_value": "Future Moon missions can compare Apollo 17's detailed traverse records with modern orbital imaging and may use its rock collection as a baseline for new research. Studies of the old rover and descent stage could someday inform knowledge of long-duration exposure, subject to preservation rules. The mission is a model for integrating trained field geologists with vehicles and instruments, a lesson relevant to future crewed exploration. Its landing site should be treated as a cultural and scientific heritage area. For your website, show how the rover's route connects specific rock finds, equipment stops and the final parked location of the vehicle."
  },
  {
    "name": "Surveyor 1",
    "year": "1966",
    "body": "Moon",
    "site": "Ocean of Storms, near Flamsteed crater",
    "status": "Successful landing; inactive lander remains",
    "img": "public/assets/missions/surveyor1.jpg",
    "relics": [
      "Tripod Lander Spacecraft Chassis",
      "Surveyor Television Camera & Steerable Mirror",
      "Planar Array High-Gain Antenna",
      "Radar Altimeter & Doppler Velocity Sensors",
      "Three Honeycomb Aluminum Crushable Footpads"
    ],
    "desc": "Surveyor 1 became the first American spacecraft to achieve a successful soft landing on the Moon. Its cameras photographed the lunar surface, and its silent lander remains in the Ocean of Storms.",
    "purpose": "NASA's Surveyor program was created to remove major uncertainties before a crewed Apollo landing. Surveyor 1 tested whether a spacecraft could decelerate, descend safely, remain upright and communicate from the Moon. Its television system documented the landing environment, while engineering data measured how well the machine handled touchdown and the extreme lunar temperature cycle. The purpose was not to return a sample or carry a human. It was to demonstrate a repeatable landing technique and produce close-up evidence that future lunar modules could operate on a real, unknown surface.",
    "equipment_text": "The complete Surveyor 1 lander is the main abandoned artifact: three footpads and legs, a central spacecraft frame, communications antenna, solar panels, propellant-system structures and a television camera. Touchdown marks in the soil and the relationship of the feet to the terrain are part of the surviving site. Surveyor 1 did not carry the soil-sampling arm later seen on Surveyor 3 and 7; describing such a scoop as abandoned here would be inaccurate. Its imager returned thousands of photographs, but the images exist in archives on Earth, while the camera assembly stayed on the spacecraft.",
    "reason_discard": "The lander was never designed to lift off after reaching the lunar surface. It was a one-way technology demonstrator, so remaining on the Moon was the planned result of a successful landing, not a disposal mistake. Solar power allowed operations for a time, but communications eventually ended in January 1967. Long lunar nights and changing thermal conditions limited what the system could endure. Sending a separate spacecraft to bring back the probe would have required a complex recovery mission with little benefit compared with using the images and engineering data already transmitted to Earth.",
    "scientific_value": "Surveyor 1 validated the essential landing sequence of retrorocket braking, controlled descent and a gentle touchdown. Its photographs demonstrated that the surface could support the landing gear, helping challenge earlier fears that a spacecraft might sink into deep lunar dust. The mission supplied information about local rock distribution, terrain, surface reflectivity and thermal behavior. It also created a body of engineering evidence that made the Apollo lunar landing program less uncertain. It is important to label the achievement precisely: first successful U.S. soft landing on the Moon, not the first soft landing of any nation.",
    "future_value": "Surveyor 1 is a baseline for comparing early spacecraft design with modern robotic landing technology. High-resolution lunar-orbiter images can be compared with older camera views to assess site stability, shadows and visible surface disturbances. Future engineering research might use carefully planned observations to investigate decades of exposure to radiation, micrometeorites and sharp temperature changes. Any physical visit would also raise preservation questions, because the spacecraft represents a turning point in robotic exploration. A useful website interaction would let visitors trace the three phases of its journey: high-speed approach, soft landing and long silent residence."
  },
  {
    "name": "Surveyor 2",
    "year": "1966",
    "body": "Moon",
    "site": "Southeast of Copernicus crater, approximate impact region",
    "status": "Failed landing; impact debris likely remains",
    "img": "public/assets/missions/surveyor2.jpg",
    "relics": [
      "Surveyor 2 Spacecraft Impact Debris",
      "Vernier Thruster Engine Cluster",
      "Solid-Propellant Retrorocket Motor Casing",
      "Television Camera Subassembly Remains",
      "Crushed Tubular Aluminum Landing Gear"
    ],
    "desc": "Surveyor 2 attempted to land on the Moon but lost control after a thruster malfunction. The spacecraft crashed into the lunar surface, leaving debris and valuable engineering lessons.",
    "purpose": "Surveyor 2's assigned purpose was to demonstrate another safe lunar landing and obtain images of the surface. Repeatability was a vital requirement: one lucky touchdown would not prove that the technology could reliably support Apollo. The mission was intended to validate the guidance, control and propulsion systems during a new flight while expanding knowledge of lunar terrain. A television imaging system was carried as part of the lander. Because the spacecraft never reached a working state on the surface, its planned scientific observations were not completed.",
    "equipment_text": "The spacecraft itself, including the camera, descent hardware, frame, landing legs and control system, was lost during impact. The exact shape and distribution of debris at the presumed impact region have not been established by a surface inspection. The name Surveyor 2 refers to a complete probe, not a detached scientific package that astronauts later recovered. No functioning surface experiment station was established. On a website, illustrate this with an image of the spacecraft's prelaunch design and a clearly labeled conceptual impact sequence rather than showing an invented photograph of intact wreckage.",
    "reason_discard": "The immediate cause of mission failure was a thruster that did not ignite during the midcourse maneuver, placing the probe in an uncontrolled spin. With attitude control lost, the descent system could not achieve its intended landing conditions. Communications ceased around the final phase of approach, and the probe crashed in September 1966. The remains were not deliberately set down as a historical monument. They are the physical result of an unsuccessful robotic landing attempt. NASA did not attempt recovery because a retrieval mission to the Moon was far beyond the mission's scope.",
    "scientific_value": "Although Surveyor 2 did not return lunar surface science, its failure carried substantial engineering value. The sequence demonstrated how a single propulsion or control problem can affect an entire landing architecture. Engineers could study the telemetry, fault response and limits of commanding an increasingly distant spacecraft in real time. The lessons contributed to the reliability mindset used in subsequent Surveyor flights and in broader landing-system design. The mission should not be described as a complete success, but equally should not be treated as scientifically meaningless: preventing similar failures is an important form of technical progress.",
    "future_value": "Future robotic landers can learn from Surveyor 2 when designing redundant control systems, fault detection and recovery strategies. Comparing its fate with Surveyor 1 highlights that guidance software, sensors and thrusters must work as a coordinated system. The crash site may one day be studied from orbit or, if justified, at close range; however, the position and condition of individual debris items should not be stated as known without evidence. This mission also offers a compelling educational story about how engineers respond to unexpected faults and how a failed spacecraft can advance the safety of later explorers."
  },
  {
    "name": "Surveyor 3",
    "year": "1967",
    "body": "Moon",
    "site": "Ocean of Storms",
    "status": "Inactive lander remains; camera and scoop returned by Apollo 12",
    "img": "public/assets/missions/surveyor3.jpg",
    "relics": [
      "Surveyor 3 Spacecraft Frame & Landing Legs",
      "Solar Panel & High-Gain Antenna Mast",
      "Vernier Engines & Propellant Tanks",
      "Surface Sampler Deployment Arm Base",
      "TV Camera Mounting Bracket (Camera Retr. by Apollo 12)"
    ],
    "desc": "Surveyor 3 landed in the Ocean of Storms and used a mechanical scoop to investigate lunar soil. In 1969, Apollo 12 astronauts visited the abandoned lander and returned its camera to Earth.",
    "purpose": "Surveyor 3 aimed to validate soft landing, characterize the soil and provide close-up surface photographs before humans arrived. The robotic scoop was particularly important because pictures alone cannot reveal whether a layer of dust is firm, loose or strong enough to bear a vehicle's weight. Controllers commanded the arm to scrape, dig and press on the ground while the television camera recorded the results. This gave Apollo engineers practical evidence about soil mechanics and provided scientists with a new way to investigate another world's surface without returning physical samples.",
    "equipment_text": "The remaining artifact is Surveyor 3's central chassis, landing structure, propulsion and support hardware at its crater site. Its complete original instrument set is no longer present. Apollo 12 astronauts removed the television camera and other pieces, including the soil scoop, and returned them to Earth. Their retrieval was a deliberate scientific collection activity. Remaining hardware shows how a Surveyor lander was built and positioned on the surface, while Apollo 12's nearby Intrepid descent stage provides a second visible spacecraft in the same historical area. Treat these as two distinct missions sharing one landscape.",
    "reason_discard": "Surveyor 3 was a one-way lander, so remaining on the Moon was part of its original mission plan. It ceased communicating in May 1967 after its successful surface investigation. The camera and soil scoop did not remain abandoned forever: astronauts removed them in November 1969 to study damage, dust and material changes after prolonged exposure. The rest was left because its recovery would add large mass and risk without comparable scientific value. The chassis is therefore not simply a forgotten wreck; it became both an engineering monument and the center of an unprecedented robotic-human return visit.",
    "scientific_value": "Mechanical sampling established that the lunar regolith could support a landing vehicle and showed how soil responded when disturbed. Surveyor 3's imagery and scoop tests contributed directly to safe Apollo operations. The returned hardware gave engineers physical evidence about surface aging, thermal stresses and lunar dust on spacecraft components. Its unusual bouncing landing also provided information about guidance and touchdown behavior. The site's importance is especially strong because multiple independent measurements connect it to the same location: Surveyor telemetry, lunar photographs, Apollo 12 observations and later orbital images.",
    "future_value": "Surveyor 3 offers a model for how future explorers might revisit older robotic hardware to investigate long-duration exposure, if such research is scientifically justified and heritage protections are respected. The existing laboratory record from the recovered camera and scoop can be reexamined with modern materials-analysis methods. Educators can compare an untouched lander, a partially retrieved lander and a deliberately left Apollo descent stage without confusing the categories. A website map could link the Apollo 12 landing location with the Surveyor 3 crater and explain which components returned to Earth and which remain on the Moon."
  },
  {
    "name": "Surveyor 4",
    "year": "1967",
    "body": "Moon",
    "site": "Near planned Sinus Medii target; impact location not confirmed",
    "status": "Lost before landing; spacecraft likely destroyed at impact",
    "img": "public/assets/missions/surveyor4.jpg",
    "relics": [
      "Surveyor 4 Descent Stage & Main Bus Debris",
      "Mechanical Surface-Sampler Claw Hardware",
      "Television Visual System Electronics",
      "Main Solid Retrorocket Motor Debris",
      "Attitude Control Gas Jets & Guidance Unit"
    ],
    "desc": "Surveyor 4 was designed to photograph and examine the Moon's surface. Communication was lost shortly before landing, and the spacecraft is believed to have crashed, leaving its final condition unknown.",
    "purpose": "The mission's objective was to make a controlled soft landing in the central lunar region and investigate the surface with a television camera and a mechanical sampler. Its sampling mechanism included a magnetic feature intended to help evaluate properties of surface materials. NASA was learning to land repeatedly and gather data from different terrain. Surveyor 4 would have added another direct measurement of lunar soil strength and would have shown how a slightly different landing site compared with earlier successes. These plans were never completed because communication was lost during descent.",
    "equipment_text": "Surveyor 4 carried a television camera, a mechanical surface-sampler claw, landing legs, descent hardware, control systems and communications equipment. Unlike Surveyor 3, it never returned surface imagery or a successful series of scoop experiments. Whatever material survived the presumed impact is not documented as an intact, easily locatable machine. Illustrations should distinguish the known preflight configuration from the unknown condition of the wreck. The camera and sampler belong on the equipment list because they were on the lost spacecraft, not because scientists saw them working on the lunar surface.",
    "reason_discard": "NASA records indicate that signals ceased about two and a half minutes before the planned landing, near the end of the major braking phase. A possible retro-rocket explosion was considered, but the complete physical failure sequence was not observed and remains uncertain. The equipment was effectively lost through mission failure, not intentionally parked on the Moon. No rescue or retrieval was possible. The phrase 'reason for discard' should therefore be interpreted carefully: the spacecraft did not become obsolete after a successful mission; it was lost during an attempted landing, and the exact state of its remains is unknown.",
    "scientific_value": "Surveyor 4 provided little of the intended lunar surface science, but its telemetry and loss of communication were relevant to spacecraft engineering. Investigating the failed descent helped teams review propulsion reliability, braking sequences and the transition from approach to final touchdown. Contrasting the unsuccessful flights of Surveyor 2 and 4 with the successful landers underscores why space programs need multiple test missions and transparent failure analysis. Its scientific value is mostly indirect: the information available to engineers before communications ended could guide changes to later procedures and designs.",
    "future_value": "Modern landers can draw lessons from the need for multiple independent measures of vehicle health during critical descent. Better sensors, telemetry, onboard autonomy and fault-tolerant propulsion are all relevant themes, though modern technology should not be credited to this mission alone. Future imaging might improve knowledge of a suspected impact site if sufficient location evidence exists, but no precise surviving wreck layout should be invented. An interactive exhibit can show the descent timeline and end at a question mark, teaching visitors that honest uncertainty is part of space exploration and that absence of a final image matters."
  },
  {
    "name": "Surveyor 5",
    "year": "1967",
    "body": "Moon",
    "site": "Sea of Tranquility",
    "status": "Successful landing; inactive chemistry-capable lander remains",
    "img": "public/assets/missions/surveyor5.jpg",
    "relics": [
      "Surveyor 5 Lander Body & Landing Legs",
      "Alpha-Scattering Surface Chemistry Sensor",
      "Surveyor Television Camera & Electronics",
      "Footpad Magnets & Erosion Gauges",
      "High-Gain Planar Array Antenna"
    ],
    "desc": "Surveyor 5 successfully landed in the Sea of Tranquility and analyzed the chemical composition of lunar soil. Its lander, television camera, and scientific instruments remain on the Moon.",
    "purpose": "Surveyor 5 was built to test reliable soft landing and to move beyond photography into chemical analysis of the lunar surface. Scientists wanted evidence about the elements present in the regolith, which could help identify the materials making up the Moon's dark plains. The mission also collected engineering information about landing behavior, camera operation and the ability of scientific instruments to function in vacuum. A successful data return was especially valuable while NASA was planning the types of geologic samples and instrument packages that astronauts would soon carry to the Moon.",
    "equipment_text": "The lander remains with its television imaging system, alpha-scattering surface chemistry instrument, supporting electronics, landing legs and footpads, communications equipment and solar-power structures. Magnets associated with its footpads were part of studies of magnetic material in lunar soil. The alpha-scattering instrument was positioned to analyze the surface rather than to return a sample. No astronauts retrieved Surveyor 5 components. The physical machine remains in place, while its imagery, chemistry measurements and telemetry survive in data archives on Earth. Be careful not to confuse its equipment with the later Apollo ALSEP packages.",
    "reason_discard": "Surveyor 5 was always intended to remain on the Moon after a one-way landing. Its science operations ended in December 1967, long before hardware could have been brought back by a crewed mission. The propulsion leak threatened the spacecraft before it reached the surface, but it was not the eventual reason the successfully landed instrument was left behind. A key distinction is therefore between a serious in-flight problem that was overcome and a planned end of operations after the vehicle completed its work. Surface recovery was not included in the mission's resources or architecture.",
    "scientific_value": "Surveyor 5 provided the first in-situ chemical analysis of lunar soil and evidence supporting a basaltic composition of the lunar mare. The result strengthened interpretations that the dark plains were related to volcanic processes and helped planners anticipate what astronauts might find. Its safe landing after a thruster-system problem also showed the value of flexible mission operations and engineering judgment. Combining chemical results with images and landing performance provided more useful science than any one instrument alone. The spacecraft helped bridge the gap between visual reconnaissance and the direct sampling used on later Apollo missions.",
    "future_value": "Future missions can compare Surveyor 5's relatively simple surface chemistry instrument with modern spectrometers and sampling laboratories, illustrating how much measurement capability has advanced. Its landing success despite a problem is relevant to fault-tolerant descent planning and onboard autonomy. A protected close-up inspection of the old spacecraft could potentially inform how solar panels, lenses and mechanical joints survive long exposure, although such a visit has not been assumed or scheduled. Website visitors could explore a split view: what the camera saw, what the chemical analyzer measured and why those results mattered for the first human lunar landings."
  },
  {
    "name": "Surveyor 6",
    "year": "1967",
    "body": "Moon",
    "site": "Sinus Medii, central lunar nearside",
    "status": "Successful landing and short hop; inactive lander remains",
    "img": "public/assets/missions/surveyor6.jpg",
    "relics": [
      "Surveyor 6 Lander Chassis (Post-Hop Position)",
      "Alpha-Scattering In-Situ Instrument",
      "Television Camera Subassembly",
      "Footpad Magnetic Flux Detectors",
      "Dual Touchdown Ground Disturbance Footprints"
    ],
    "desc": "Surveyor 6 landed near the center of the Moon's visible side and performed chemical experiments. It later made a short powered hop to another landing position, where the spacecraft remains today.",
    "purpose": "The mission aimed to confirm landing capability in a new area of the Moon and collect images and compositional data. Its alpha-scattering instrument analyzed material near the lander, while cameras mapped the surrounding terrain. NASA also wanted to learn how the spacecraft's landing system affected the soil and how the ground responded when the engines operated close to the surface. The experimental hop was an engineering investigation rather than a return journey: it did not place Surveyor 6 in lunar orbit or take it back toward Earth.",
    "equipment_text": "Surveyor 6 remains as a complete robotic lander with an imaging system, alpha-scattering instrument, footpad magnets, descent thrusters, solar panels and communications equipment. Its two touchdown positions and the disturbed regolith around them are relevant parts of the site, though the final position is the place where the hardware rests. The instrument package was integrated into the lander and not an independently deployed Apollo-style science station. The probe did not carry a Surveyor 3-style soil-sampling claw; its chemistry experiment used a different measurement technique. Mission images and telemetry are retained on Earth.",
    "reason_discard": "The vehicle was designed for a one-way flight to the Moon and did not have the systems needed to return to Earth. The short hop deliberately used available propulsion to investigate movement and dust disturbance after the science mission was underway. Once operations ended in December 1967, the lander stayed at its final surface position. This is a planned retirement rather than a crash. Surveyor 6's equipment still represents an intriguing boundary between a fixed lander and a mobile spacecraft: it could move a little, but was not a reusable surface transportation system.",
    "scientific_value": "Surveyor 6 returned extensive lunar photography and chemical measurements that helped characterize a central nearside site. The short powered relocation created a natural experiment in surface response to rocket exhaust and gave engineers direct evidence of controllable liftoff and repeat touchdown under lunar gravity. Such observations mattered for later ascent stages and for understanding how exhaust can redistribute lunar dust. The combination of chemistry, imagery and motion experiments demonstrated the benefits of making a robotic system flexible enough to gather data beyond its simplest original assignment.",
    "future_value": "As more spacecraft land near scientific stations, plume-surface interactions and dust contamination remain practical concerns. Surveyor 6's hop provides historical data for these questions, although modern missions operate at different scales. Comparisons with orbital images and numerical models could add detail to how small thrusters disturb regolith. Its final lander position is also a heritage marker of an early extraterrestrial takeoff. A strong website animation would show the first landing, the carefully controlled hop and the final stationary location, clearly explaining that the spacecraft never left the Moon."
  },
  {
    "name": "Surveyor 7",
    "year": "1968",
    "body": "Moon",
    "site": "Near Tycho crater, lunar highlands",
    "status": "Successful landing; inactive lander and science tools remain",
    "img": "public/assets/missions/surveyor7.jpg",
    "relics": [
      "Surveyor 7 Highland Lander Structure",
      "Surface-Sampler Mechanical Digging Arm",
      "Alpha-Scattering Highland Chemical Instrument",
      "Television Camera with Polarizing Filters",
      "Stereoscopic & Dust-Detection Mirrors"
    ],
    "desc": "The final Surveyor mission explored rugged terrain near Tycho Crater. Its cameras, soil sampler, and scientific instruments helped scientists understand the lunar highlands before falling silent.",
    "purpose": "The mission's purpose was to study highland surface composition and physical properties while demonstrating landing capability away from the smooth mare plains. Its television camera recorded the landscape, and its surface sampler could scrape soil and manipulate material near the vehicle. An alpha-scattering experiment investigated chemical composition. Magnets and mirrors provided additional ways to study dust and other properties. Surveyor 7 also helped scientists compare regions that had different geological histories, an essential step in moving from a few landing-site observations toward a more complete understanding of the Moon.",
    "equipment_text": "The probe's three-legged body, television camera, robotic surface-sampler scoop, alpha-scattering instrument, footpad magnets and stereoscopic or dust-detection mirrors all remained with the inactive lander. Its surface experiment tools were not removed by an Apollo crew. The deployed arm and landing-gear contact marks are part of the local physical record. Because Surveyor 7 carried more equipment than several predecessors, it is a useful website example of an early compact multi-instrument robot. The returned scientific results are digital and photographic data; the scientific instruments themselves remain on the Moon.",
    "reason_discard": "Surveyor 7 had no plan to return to orbit or Earth. After landing in January 1968 it operated through its surface investigation and the mission concluded in February. The instruments were left because the spacecraft was a one-way lander, not because each component had independently failed. Its ending was part of the broader program transition: Surveyor had provided enough data and experience for upcoming human expeditions. The spacecraft's stationary presence in the highlands marks an intentionally completed robotic mission rather than a vehicle that became lost after landing.",
    "scientific_value": "Surveyor 7 supplied rare pre-Apollo chemical and mechanical observations of the lunar highlands. By comparing its measurements with those from maria sites, scientists gained better evidence that lunar terrain was not uniform in composition or texture. The probe's tools also showed that remote manipulation and sampling could produce valuable data without human hands at the site. Its pictures documented boulders, slopes and surface features near a major impact crater. Together with other Surveyors, the mission helped reduce the uncertainty of choosing landing systems, experiment designs and crew activities for Apollo.",
    "future_value": "Future lunar science can reexamine Surveyor 7's archived imagery and chemistry with modern digital processing and geological maps. Its highlands location makes it especially relevant when comparing robotic observations with Apollo 16's later highland exploration. The stationary lander provides a potential subject for long-term materials-exposure research, but a direct visit should be considered only within appropriate heritage and science safeguards. For students, the mission can anchor a comparison between mare and highland geology: two very different landscapes examined using related robotic technologies just before people began walking on the Moon."
  },
  {
    "name": "Pathfinder & Sojourner",
    "year": "1997",
    "body": "Mars",
    "site": "Ares Vallis",
    "status": "Lander and rover inactive on the Martian surface",
    "img": "public/assets/missions/pathfinder.jpg",
    "relics": [
      "Sojourner Micro-Rover Chassis & 6 Wheels",
      "Carl Sagan Memorial Station Base",
      "Alpha Proton X-Ray Spectrometer (APXS)",
      "Deflated Landing Airbag Petal Assembly",
      "Atmospheric Structure Instrument / Meteorology Mast"
    ],
    "desc": "Mars Pathfinder delivered Sojourner, the first rover to explore another planet. The small robot examined Martian rocks and soil before communication ended, leaving the rover and lander in Ares Vallis.",
    "purpose": "Pathfinder's main purpose was to demonstrate a lower-cost way to reach Mars and operate a rover. It also investigated geology, rock chemistry and weather at a site shaped by ancient floods. Sojourner used an alpha proton X-ray spectrometer to analyze elements in rocks and soil, while the lander's cameras and meteorology instruments recorded the surrounding environment. Engineers studied autonomous hazard avoidance, communications between rover and lander, and the behavior of wheels on Martian soil. The mission showed how an apparently simple mobile platform could make a lander substantially more useful.",
    "equipment_text": "The Sojourner rover, with its six wheels, cameras, chassis and alpha proton X-ray spectrometer, remains in the Ares Vallis area. The stationary Pathfinder lander, later named the Carl Sagan Memorial Station, also remains with its cameras, antennas, solar panels and meteorological sensors. Landing airbags and deployment hardware are associated with the site. The rover depended on the lander for communication with Earth; it was not designed to communicate independently across interplanetary distances. These machines should be presented as a linked pair of artifacts rather than separate, unrelated spacecraft that happened to land together.",
    "reason_discard": "The lander and rover were never designed for retrieval. Sojourner had a short planned lifetime, yet operated for about 83 days rather than just the seven originally expected for the rover. The last signal from the Pathfinder lander was received on September 27, 1997; subsequent attempts to restore communication failed. The precise final operational condition of the rover cannot be independently checked because it relied on the lander as its relay. The mission ended successfully after exceeding its planned durations. Its equipment remained because getting it back from Mars would require an entirely separate sample-return-like mission.",
    "scientific_value": "The mission returned images, weather information and chemical measurements that improved understanding of the Ares Vallis environment. Sojourner's results showed variation among rocks and soil and tested how well a small robot could place an instrument against targets. Wheel tracks and mobility experiments helped scientists interpret soil strength and surface texture. Most importantly, Pathfinder provided practical proof of a lander-rover system, influencing later designs for mobile Mars science. The spacecraft's ability to operate longer than intended also demonstrated the value of conservative engineering margins and flexible mission planning.",
    "future_value": "Future Mars missions can learn from Pathfinder's communications architecture, compact rover design and airbag-assisted landing method, even when using different technologies. The site is a historical reference for how small robots interact with an unfamiliar surface. Modern orbital imagery and terrain models can place the landing region in a broader geological context. Its archived scientific measurements remain useful when comparing different Martian environments over time. For your website, show Sojourner as a small explorer orbiting a fixed home base: the lander was the communications lifeline, and both artifacts are now part of the same abandoned-but-not-forgotten story."
  },
  {
    "name": "Spirit Rover",
    "year": "2004",
    "body": "Mars",
    "site": "Gusev crater, final position at Troy",
    "status": "Inactive rover; last communication in 2010",
    "img": "public/assets/missions/spirit.jpg",
    "relics": [
      "Spirit Rover Chassis & Six-Wheel Rocker-Bogie",
      "Pancam & Navcam Panoramic Mast Head",
      "Instrument Deployment Arm (IDD)",
      "Miniature Thermal Emission Spectrometer (Mini-TES)",
      "Rock Abrasion Tool (RAT) & Spectrometers"
    ],
    "desc": "Spirit explored Gusev Crater, discovering evidence of ancient water-related activity on Mars. After becoming trapped in soft soil, the rover eventually lost communication and remains at its final location.",
    "purpose": "Spirit's principal aim was to search for geological evidence that liquid water had affected Mars in the past. It examined rocks with panoramic and microscopic cameras, a thermal infrared spectrometer, a Mössbauer spectrometer, an alpha particle X-ray spectrometer and a rock abrasion tool. Engineers also wanted to test long-distance robotic driving, navigation and survival under solar-powered conditions. The twin-rover design allowed scientists to compare very different parts of Mars: Spirit in Gusev crater and Opportunity at Meridiani Planum. Spirit's mission evolved as discoveries and unexpected terrain changed the day's science plan.",
    "equipment_text": "Spirit itself is the main abandoned object: a six-wheeled solar-powered rover with cameras on a mast, a robotic instrument arm, an abrasion tool, spectrometers, electronics and communications antennas. The rover remained at its final position with its science equipment attached. Landing-system components and shielding hardware from its entry, descent and landing also reached Mars, but should not all be shown as a single pile beside the rover; the landing architecture deployed them at different times and locations. Spirit's samples were analyzed in place and were not transported to Earth.",
    "reason_discard": "The immediate operational challenge was entrapment in soft ground, which prevented further driving and compromised the rover's ability to position its solar panels for winter sunlight. Spirit had survived many Martian seasons, but low available power and winter conditions eventually ended communication. NASA attempted to regain contact before formally concluding the mission in 2011. This is not a case of a rover deliberately parked at a chosen museum spot; its final site was determined by a mobility problem compounded by energy constraints. The rover had already exceeded the planned mission lifetime many times over.",
    "scientific_value": "Spirit found strong evidence of ancient water-related alteration, including hydrated minerals and silica-rich deposits in the Columbia Hills area. These observations helped show that Mars had hosted multiple environments where water interacted with rocks. Its long traverse documented changes in geology across plains, slopes and hills that a stationary lander could never have visited. Engineers also learned how wheel wear, soil mechanics and steep terrain affect robotic mobility. The failed final escape attempts added useful data about how to recognize, model and respond to soft, deceptive ground on another planet.",
    "future_value": "Spirit's science record can be reinterpreted alongside newer orbital mineral maps and results from later Mars rovers. The rover's final predicament informs wheel design, route risk assessment, autonomous hazard detection and contingency planning. A future mission could in theory image or approach the site, but no recovery should be presented as planned. The inactive rover is also a historical monument to how far early solar-powered Mars vehicles could travel. A website should make its ending nuanced: Spirit did not simply 'run out of curiosity'; it continued investigating until a physical obstacle and dwindling power ended an exceptionally long scientific career."
  },
  {
    "name": "Opportunity Rover",
    "year": "2004",
    "body": "Mars",
    "site": "Meridiani Planum; final site Perseverance Valley",
    "status": "Inactive rover; last communication June 2018",
    "img": "public/assets/missions/opportunity.jpg",
    "relics": [
      "Opportunity Rover Chassis & Solar Arrays",
      "Endurance & Victoria Crater Traverse Tracks",
      "Pancam Mast Assembly & Microscopic Imager",
      "Mössbauer & Alpha Particle X-Ray Spectrometer",
      "Rock Abrasion Tool (RAT) Diamond Wheels"
    ],
    "desc": "Designed for a 90-day mission, Opportunity explored Mars for nearly fifteen years. It discovered strong evidence of ancient water before a massive dust storm ended its mission in 2018.",
    "purpose": "Opportunity's primary goal was to investigate whether Mars had once hosted water and potentially habitable environments. The rover was equipped to read landscapes, photograph rocks closely, measure mineral and elemental composition and grind away weathered surfaces. It used cameras, a miniature thermal emission spectrometer, a Mössbauer spectrometer, an alpha particle X-ray spectrometer, a microscopic imager and a rock abrasion tool. Mission planners expected modest local exploration; the long-lasting vehicle instead became a traveling laboratory that connected many different geological sites across tens of kilometers.",
    "equipment_text": "The six-wheeled rover remains at Perseverance Valley with its solar arrays, panoramic camera mast, navigation cameras, robotic arm, spectrometers and abrasion tool. These instruments are on the vehicle rather than abandoned as separate research stations. Entry, descent and landing hardware was also left on Mars at associated landing locations, but should not be confused with the rover's final resting point years later. Opportunity returned images and measurements, not sealed rock samples for collection on Earth. Its wheel tracks, where preserved, are also evidence of the extraordinary route it followed across the planet.",
    "reason_discard": "Opportunity's final communications loss coincided with a massive dust storm that blocked the light needed by its solar panels. Without enough energy, the vehicle could not reliably heat itself, recharge its batteries or maintain communication. NASA conducted an extended recovery campaign but eventually stopped attempts. Opportunity's abandonment was therefore an end-of-life event caused by environmental and power conditions, not a deliberate decision to leave a still-working vehicle at a planned parking place. Its long journey had already demonstrated that careful planning and the right environmental conditions could extend a robot's productive life well beyond its original design.",
    "scientific_value": "Opportunity established compelling evidence of past water on Mars, including minerals and sedimentary features associated with wet environments. Its investigations helped differentiate ancient acidic conditions from later settings that may have been more hospitable to microbial life. Observations made across its long route linked rocks of different ages and geological processes. The mission set major distance and endurance benchmarks for travel on another world. It also provided extensive engineering records about dust deposition, cleaning events, wheel wear, power management and aging equipment, all important for understanding how a Mars rover survives year after year.",
    "future_value": "Opportunity's science archive remains a resource for planetary geologists, especially when placed beside orbital maps and newer rover measurements. Its mechanical history offers lessons for long-duration surface mobility, and its abrupt dust-related ending is a case study in power resilience. Future explorers might observe its resting place, but its historical value and uncertain condition should prevent fictional claims that it can be restarted. For a website, make visitors travel along Opportunity's path, watching discoveries accumulate until Perseverance Valley. The final screen can distinguish mission completion in 2019 from the last radio contact in June 2018."
  },
  {
    "name": "Viking 1 Lander",
    "year": "1976",
    "body": "Mars",
    "site": "Chryse Planitia",
    "status": "Inactive stationary lander; communication lost in 1982",
    "img": "public/assets/missions/viking1.jpg",
    "relics": [
      "Viking 1 Hexagonal Lander Body & 3 Footpads",
      "Two SNAP-19 Radioisotope Thermoelectric Generators",
      "Surface Sampler Robotic Boom & Collector Head",
      "Gas Chromatograph-Mass Spectrometer (GCMS)",
      "Biology Experiment Instrument Suite (PR, LR, GEX)"
    ],
    "desc": "Viking 1 achieved the first fully successful American landing on Mars and searched for possible signs of microbial life. Its lander, robotic arm, cameras, and scientific laboratory remain in Chryse Planitia.",
    "purpose": "Viking 1 was designed to investigate Mars as a possible home for life and to understand its physical environment. Its robotic arm collected soil for three biology experiments and a gas chromatograph mass spectrometer. Cameras photographed the landing site; meteorology sensors measured winds, temperature and pressure; chemistry and other investigations tested the properties of the soil. An orbiting companion mapped surface features and helped support the overall mission. These were complementary elements, so a website should distinguish the lander that remains on the ground from the orbiter that did not descend to the same site.",
    "equipment_text": "The abandoned surface hardware includes Viking 1's fixed lander body, landing legs, robotic sample arm, cameras, soil-testing laboratory, gas chromatograph mass spectrometer, weather sensors and two radioisotope thermoelectric generators. Entry, descent and landing hardware also reached Mars, but not all remained attached to the station. The orbiter and lander were separate spacecraft after deployment; saying that the entire Viking 1 mission is 'parked at Chryse Planitia' would be misleading. The radioactive generators supplied electrical power by converting heat to electricity and were not open nuclear reactors.",
    "reason_discard": "The Viking lander was designed to remain at its landing location and had no ascent or return capability. It carried a radioisotope power source, so it did not depend on sunlight in the way later solar-powered rovers did. Its final operational loss was unusual: NASA records attribute the end of contact in November 1982 to a faulty command rather than a sudden Martian dust storm. Attempts to restore contact were unsuccessful. The stationary hardware consequently became inactive after many years of productive service. Recovery was not part of the mission architecture and would require a future spacecraft expressly designed to reach it.",
    "scientific_value": "Viking 1 transformed Mars exploration by providing sustained surface images, atmospheric observations, chemistry and direct biological tests. The life-detection results were complex and remain a subject of scientific discussion; they did not establish that Mars hosts living microorganisms. The failure to find a straightforward biological answer influenced later missions to study habitability, organics and the history of water with more context. Viking surface chemistry and weather data supplied a reference against which later landers and rovers could be compared. The mission also proved that long-lived, radioisotope-powered laboratories could survive on Mars.",
    "future_value": "The lander and its archived results remain valuable as researchers develop new interpretations of Martian soil chemistry and more sophisticated life-detection instruments. Viking's experiment design teaches an essential lesson: a surprising signal is not proof of biology unless nonbiological explanations can be tested. Future robotic missions may use Viking-era weather and surface images as historical comparisons. The lander's fixed location is a heritage resource and a reminder of the logistical difficulty of Mars return trips. An interactive website could invite students to examine several possible explanations for the original experiments rather than giving an unsupported yes-or-no answer about life."
  },
  {
    "name": "Viking 2 Lander",
    "year": "1976",
    "body": "Mars",
    "site": "Utopia Planitia",
    "status": "Inactive stationary lander; operation ended in 1980",
    "img": "public/assets/missions/viking2.jpg",
    "relics": [
      "Viking 2 Lander Body & Three Footpads",
      "Two SNAP-19 Radioisotope Power Units",
      "Biology Package & Gas Chromatograph (GCMS)",
      "Surface Sampler Robotic Collector Boom",
      "Meteorology Sensor Boom (Winds & Temperature)"
    ],
    "desc": "Viking 2 explored Utopia Planitia, studying Martian soil, weather, and possible biological activity. Its scientific instruments operated for years before the lander became a silent artifact on Mars.",
    "purpose": "Viking 2's purpose was to investigate Mars from a second landing region and to complement Viking 1's results. Its experiments examined chemical properties and possible biological reactions in soil samples, measured local meteorology and produced panoramic surface images. The accompanying orbiter supplied atmospheric and terrain observations and helped provide mission-wide context. By placing comparable instruments at two different Martian sites, NASA could ask whether unusual chemistry or climate measurements were locally specific or more widespread. This comparative design was one of Viking's most powerful scientific features.",
    "equipment_text": "The Utopia Planitia lander contains its stationary platform and legs, two surface cameras, remotely commanded sampling arm, internal biological laboratory, chemical-analysis instruments, weather package and radioisotope thermoelectric generators. Descent and protective hardware were also left on Mars, but should be distinguished from the landed platform. Viking 2's orbiter remained a different spacecraft in orbit after releasing the lander; it is not an artifact sitting beside the stationary laboratory. The presence of scientific equipment in a lander does not mean it is still powered or capable of collecting data today.",
    "reason_discard": "Viking 2 landed for a one-way surface mission, so the planned end-state was a stationary robot left on Mars. Its surface operations ended in April 1980 after an extended period of work, while its orbiter's operations had ended earlier because of spacecraft-system limitations. The lander did not drive away, and it had no launch system. Over time every remote station encounters practical limits in communications, power, instrument health and mission support. Viking 2's inactive state should be explained as the conclusion of a long-duration program rather than describing it as discarded immediately after it touched down.",
    "scientific_value": "Viking 2's pictures and surface observations revealed a landscape and environmental conditions different from those encountered by Viking 1. Its soil biology experiments produced ambiguous chemical reactions that did not constitute a confirmed detection of life. Weather measurements, soil chemistry and orbital imaging expanded the scientific baseline for Mars. Results from both Viking landers strongly shaped how later missions investigated organics, habitability and the effects of oxidizing Martian soil. The companion orbiters also provided a powerful global imaging record, helping scientists choose targets and interpret later landing sites.",
    "future_value": "The value of Viking 2 today is partly comparative. Old weather and chemistry data can be studied with models that incorporate decades of later discoveries, while images of the northern plains remain useful for regional context. The paired Viking sites help students understand why scientists repeat experiments under different conditions. Engineering records from its prolonged operation support future thinking about stationary laboratories, radioisotope power and instrument aging. If future missions ever approach the lander, scientific and heritage considerations would need to guide any close inspection. The website story should clearly separate the 1976 landing from the 1980 end of surface operations."
  },
  {
    "name": "Phoenix Mars Lander",
    "year": "2008",
    "body": "Mars",
    "site": "Vastitas Borealis, Martian arctic",
    "status": "Inactive lander; power lost approaching winter",
    "img": "public/assets/missions/phoenix.jpg",
    "relics": [
      "Phoenix Polar Lander Chassis & Footpads",
      "Robotic Excavation Arm & Trenching Scoop",
      "Thermal & Evolved Gas Analyzer (TEGA)",
      "Microscopy, Electrochemistry & Conductivity Analyzer",
      "Two Bio-Barrier Octagonal Solar Arrays"
    ],
    "desc": "Phoenix explored the Martian Arctic and confirmed water ice beneath the surface. As winter approached, the solar-powered lander lost energy, leaving its robotic digging arm and laboratory behind.",
    "purpose": "The mission focused on the history of Martian water and the chemical environment that might support or hinder life. Phoenix used a robotic arm to collect icy soil and deliver material to the Thermal and Evolved Gas Analyzer and the Microscopy, Electrochemistry and Conductivity Analyzer. Cameras inspected the surface, while meteorology instruments tracked atmospheric conditions. The goal was not to detect living organisms directly or travel large distances. Instead, it was to understand the properties of an ice-rich landscape and how water, salts, soil and climate interact on the northern plains.",
    "equipment_text": "The lander remains with its surface frame and legs, solar panels, robotic arm and scoop, cameras, laboratory ovens, chemistry equipment and meteorological instruments. The arm could dig into regolith but could not return samples to Earth; soil was analyzed inside the stationary craft. Landing-related components also reached the surface. The site contains a shallow area disturbed by excavation, although its exact appearance may have changed with frost and seasonal deposition. Phoenix's solar panels are part of the inactive spacecraft, not detachable wings that flew away. The equipment is distinct from InSight, a later lander based on a related design.",
    "reason_discard": "Phoenix was intentionally built as a one-way lander with a limited operational window in the arctic summer. As local sunlight declined, the solar-powered craft could no longer count on enough energy for normal operation and thermal protection. Communication ended in early November 2008; the increasingly severe northern winter prevented a return to routine science. NASA later determined that the lander had not survived to resume operations. Its equipment was left because recovery was never planned and because the very environment it studied eventually made further activity impossible. This is an environmental end-of-life story rather than a failure to find the intended science target.",
    "scientific_value": "Phoenix provided direct evidence of water ice beneath the northern Martian surface and reported findings such as perchlorate salts and the character of local soil chemistry. It also observed weather phenomena and collected an unusually detailed record of arctic atmospheric conditions. These measurements helped refine understanding of Mars's water cycle, ice-rich soils and the chemical constraints facing potential biology. Phoenix illustrated the scientific power of a stationary robotic laboratory when the most important samples are immediately below it. Its results inform questions about volatile materials, surface habitability and the influence of seasonal frost.",
    "future_value": "Phoenix's findings are useful when planning missions to icy locations, especially for understanding water availability, sample handling, corrosive salts and the challenges of extreme seasonal power loss. Future engineers may design longer-lived polar hardware using different energy and thermal strategies. Archived Phoenix results can be compared with orbital observations of northern frost and ice. The inactive lander is also a reminder that finding water does not mean an environment is automatically habitable or safe for humans. A website exhibit could animate the declining sunlight as the mission proceeds, showing why the same seasonal conditions that make the site scientifically valuable also made it difficult to survive."
  },
  {
    "name": "InSight Mars Lander",
    "year": "2018",
    "body": "Mars",
    "site": "Elysium Planitia",
    "status": "Inactive lander; mission ended in December 2022",
    "img": "public/assets/missions/insight.jpg",
    "relics": [
      "InSight Geophysical Lander Platform",
      "Seismic Experiment for Interior Structure (SEIS)",
      "Wind and Thermal Shield (WTS Domed Enclosure)",
      "Heat Flow and Physical Properties Package (HP3 Mole)",
      "Twin Circular UltraFlex Solar Arrays"
    ],
    "desc": "InSight studied the interior of Mars by detecting marsquakes with a sensitive seismometer. Dust gradually covered its solar panels, ending the mission in 2022 and leaving its instruments on the surface.",
    "purpose": "The main purpose was to investigate Mars's internal structure and the processes that formed rocky planets. The Seismic Experiment for Interior Structure (SEIS) measured ground motion. The Heat Flow and Physical Properties Package (HP3) was intended to measure heat escaping from below the surface, while radio tracking studied planetary rotation and interior properties. Weather and magnetic observations helped interpret seismic signals. These are different questions from searching for fossils or taking photographs of distant rocks: InSight studied the hidden planet beneath its landing site.",
    "equipment_text": "The abandoned surface equipment includes the InSight platform, two circular solar arrays, cameras, robotic Instrument Deployment Arm, SEIS instrument and its protective wind-and-thermal shield, plus the HP3 thermal probe and associated support system. Its radio-science equipment was part of the spacecraft. The HP3 self-hammering probe, often called the mole, could not penetrate as deeply as intended because Martian soil behaved unexpectedly; this failed measurement capability is a specific equipment issue. It should not be described as an instrument that successfully reached its target depth. Landing components also reached Mars elsewhere in the descent sequence.",
    "reason_discard": "InSight remained in place by design. Its final mission-ending problem was the gradual reduction of electrical power as fine Martian dust covered the solar panels. Operators managed the diminishing energy budget and eventually lost communication in December 2022. The heat-flow mole's problems were a separate scientific and engineering setback that occurred while the rest of the lander continued to collect valuable data. The lander's solar arrays did not suddenly disappear or break free; they became less effective at gathering sunlight. Recovery or relocation was never part of the mission, and no powered restart has been established.",
    "scientific_value": "InSight recorded more than a thousand seismic events, allowing scientists to estimate properties of Mars's crust, mantle and core. Its measurements established a new field of planetary seismology beyond Earth and the Moon. The mission also detected signals from impacts and showed how planetary interiors can be studied from distant surface stations. The failure of HP3 to reach its planned depth did not invalidate the seismic data. Instead, it exposed how difficult it is to predict soil friction and mechanical behavior on another world. InSight's combination of successful measurements and partial instrument failure made it both scientifically productive and technically instructive.",
    "future_value": "Future researchers can reprocess InSight's quake catalog using improved models and compare it with seismic stations that may eventually be deployed elsewhere on Mars. Engineers can use the mole experience to test instruments in more realistic soils and design better methods of anchoring and penetrating regolith. The dust-related power loss informs solar-array planning and contingency strategies for long-lived missions. The station itself is a heritage marker of the first dedicated modern Mars interior observatory. A website should visually connect a small instrument resting on the surface with the vast crust, mantle and core it helped scientists infer far below."
  },
  {
    "name": "Ingenuity Mars Helicopter",
    "year": "2021",
    "body": "Mars",
    "site": "Jezero crater, final flight area",
    "status": "Flight ended after rotor damage in January 2024",
    "img": "public/assets/missions/ingenuity.jpg",
    "relics": [
      "Ingenuity Carbon-Fiber Rotor Blades & Hub",
      "Solar Panel & Lithium-Ion Energy Cells",
      "Avionics & Autonomous Visual Navigation Pod",
      "Four Lightweight Carbon-Composite Landing Legs",
      "Surface Color & Horizon Scout Cameras"
    ],
    "desc": "Ingenuity made history as the first aircraft to achieve powered flight on another planet. After completing 72 flights, rotor-blade damage ended its flying mission in 2024, leaving it permanently grounded on Mars.",
    "purpose": "The helicopter's first objective was to demonstrate that controlled flight was possible in Mars's extremely thin atmosphere. It used rapidly spinning counter-rotating blades, lightweight materials, autonomous flight control, cameras and a compact power system to manage flight without real-time joystick control from Earth. Once the initial demonstration succeeded, the team expanded operations to include scouting, new flight profiles and studies of aerodynamic limits. Ingenuity did not have the full suite of geological instruments carried by Perseverance; its principal scientific and engineering contribution was to show what aerial mobility could add to planetary exploration.",
    "equipment_text": "The remaining artifact is the complete small helicopter with its airframe, counter-rotating rotor system, solar panel, battery, cameras, sensors and landing legs. The damaged blades are an essential part of its final condition. Ingenuity had been delivered by Perseverance and later operated independently as an aircraft, but it used the rover as a communications relay. The final resting location is not where Perseverance originally set it down in 2021; Ingenuity traveled between flight sites over the years. The helicopter is grounded, and no credible description should show it flying again after the reported rotor damage.",
    "reason_discard": "The final flight ended with damaged rotor blades, leaving the aircraft unable to satisfy the mechanical demands of safe flight. The mission was formally concluded in January 2024 after greatly exceeding expectations. The craft did not run out of curiosity, and the end was not simply an ordinary retirement with fully functional rotors. Without an available means of field repair, a flight-capable recovery was not practical. Its communications also depended on the broader mission system. The visible message for a website is precise: flight ended because hardware was damaged, whereas the broader engineering data already collected remained a major success.",
    "scientific_value": "Ingenuity demonstrated that autonomous rotorcraft can operate in Mars's thin air, an achievement that required new approaches to aerodynamic design, navigation and flight planning. The aircraft provided imagery from perspectives unavailable to ground vehicles and helped test possible reconnaissance roles for future missions. Its long campaign produced evidence about repeated flight, navigation sensors and changing environmental conditions. Exceeding the planned five flights by such a large margin showed how a technology demonstration can mature into an operational experiment. The mission also illuminated challenges of landing-site texture, obstacle detection and mechanical stress over long use.",
    "future_value": "Future Mars rotorcraft could carry more capable instruments or survey difficult terrain before larger robotic vehicles approach it. Ingenuity's recorded flights, rotor dynamics and final damage can guide improved designs, but they should not be presented as proof that every terrain or weather condition is safe for flight. The stationary helicopter represents a historically significant first. Educators can compare early aviation on Earth with its distant counterpart, while being clear that Ingenuity was built for a very different atmosphere and level of autonomy. A good website visualization would count the flights from one through 72, then explain exactly why its flying career ended."
  },
  {
    "name": "Dawn Spacecraft",
    "year": "2007",
    "body": "Deep Space",
    "site": "Orbit around dwarf planet Ceres",
    "status": "Inactive spacecraft remains in Ceres orbit",
    "img": "public/assets/missions/dawn.jpg",
    "relics": [
      "Dawn Main Spacecraft Bus Structure",
      "Three NSTAR Xenon Ion Propulsion Engines",
      "Visible and Infrared Mapping Spectrometer (VIR)",
      "Gamma Ray and Neutron Detector (GRaND)",
      "Dual 8.3-Meter Solar Array Wings"
    ],
    "desc": "Dawn explored asteroid Vesta and dwarf planet Ceres, revealing details about the early solar system. After exhausting its fuel supply in 2018, the spacecraft became inactive and remains in orbit around Ceres.",
    "purpose": "The mission's scientific goal was to understand the early solar system by comparing two bodies that evolved in different ways. Dawn mapped landscapes, measured composition and gravity, and investigated how internal heat, water-bearing minerals and impacts shaped each world. Its three main scientific instruments included a framing camera, a visible and infrared mapping spectrometer and a gamma-ray and neutron detector. Dawn's unusual propulsion system was central to the plan: ion engines allowed the same spacecraft to visit Vesta, leave and then enter orbit around Ceres, something difficult to achieve with conventional chemical propulsion alone.",
    "equipment_text": "The abandoned object is Dawn itself, still traveling as an artificial satellite of Ceres. Its large solar arrays, ion thrusters, cameras, spectrometers, communications antenna and internal spacecraft systems remain attached to the vehicle. No Dawn lander or rover was left on either Vesta or Ceres, and it would be inaccurate to describe the spacecraft as resting on Ceres's soil. The craft's orbital motion continues even though it is not operating as a scientific observatory. Its last orbit was chosen with planetary protection in mind rather than as an uncontrolled drop to the surface.",
    "reason_discard": "Dawn's mission ended when its hydrazine supply for attitude-control thrusters was exhausted in October 2018. Without adequate orientation control, it could no longer reliably point its solar arrays toward the Sun or its antenna toward Earth. This distinction matters: the spacecraft used xenon in ion engines for major travel, but hydrazine for the pointing control required to keep working at the end. Communication was lost and NASA declared the mission finished in November 2018. Dawn was intentionally left in a stable orbit designed to avoid a near-term impact with Ceres, protecting a world of scientific interest from contamination.",
    "scientific_value": "Dawn showed that Vesta and Ceres preserve very different chapters of planetary formation. Vesta helped scientists study differentiation, impacts and the structure of a rocky protoplanet. Ceres revealed water-related geology, salts, ice and evidence of recent or potentially continuing geologic processes. Bright deposits in places such as Occator crater changed interpretations of small, cold worlds. Maps of gravity, mineral composition and surface features allow researchers to connect internal structure with visible geology. Dawn also proved the scientific reach of solar-electric ion propulsion on a complex multi-destination exploration mission.",
    "future_value": "Dawn's datasets continue to influence plans for studying dwarf planets, water-rich asteroids and the chemistry of the early solar system. Its long-term orbit may preserve the spacecraft as a silent monument, although orbital evolution over very long times should not be guessed without modeling. Designers can learn from its efficient propulsion and the vulnerability of operations when attitude-control fuel is exhausted. It is also a clear case for planetary protection: intentionally avoiding impact can preserve a scientifically sensitive surface. On your website, place Dawn in an orbit animation around Ceres rather than beside a surface landing pin."
  },
  {
    "name": "NEAR Shoemaker",
    "year": "1996",
    "body": "Deep Space",
    "site": "Surface of asteroid 433 Eros",
    "status": "Inactive spacecraft rests on Eros",
    "img": "public/assets/missions/near.jpg",
    "relics": [
      "NEAR Spacecraft Bus Resting on Eros Surface",
      "Multispectral Imager (MSI)",
      "Near-Infrared Spectrograph (NIS)",
      "X-Ray / Gamma-Ray Spectrometer (XGRS)",
      "Laser Rangefinder (NLR) & Magnetometer"
    ],
    "desc": "NEAR Shoemaker became the first spacecraft to orbit an asteroid and later landed on 433 Eros. It collected valuable scientific data before falling silent, leaving its instruments resting on the asteroid.",
    "purpose": "The principal purpose was to investigate Eros's geology, shape, gravity, composition and internal properties, while also gathering data during a flyby of asteroid Mathilde. Scientists wanted to understand the makeup of small bodies and how impacts and surface processes shape them. NEAR carried cameras, a laser rangefinder, an X-ray and gamma-ray spectrometer, a near-infrared spectrograph and a magnetometer. Orbiting Eros allowed measurements at different distances and geometries. The final controlled descent provided an opportunity to study the surface from extremely close range, beyond the spacecraft's original orbital design objectives.",
    "equipment_text": "The spacecraft itself is the left-behind equipment: bus structure, solar arrays, communications system, camera, spectrometers, laser rangefinder, magnetometer and other support electronics. NEAR Shoemaker was not equipped with the landing legs and sample-handling gear of a purpose-built surface lander. Its successful touchdown was therefore notable, but should not be misrepresented as deployment of a rover or an asteroid sampling laboratory. Its final surface position is associated with the landing sequence; precise small-scale details of its current physical condition are not established by a later close-up visit. The science returned before and shortly after touchdown is preserved on Earth.",
    "reason_discard": "The mission's principal orbital tasks were complete when NASA elected to attempt a controlled touchdown. Rather than being discarded because an instrument suddenly failed, the vehicle was repurposed for a final high-risk but scientifically useful maneuver. It continued operating after contact, then ceased communicating in late February 2001 amid the cold conditions. There was no ascent system or planned recovery vehicle, and the object had no means to leave Eros. A website should distinguish between this purposeful final landing and an uncontrolled crash: the surprising success was part of the mission's final scientific achievement.",
    "scientific_value": "NEAR Shoemaker created detailed maps and measurements of Eros, giving scientists a much clearer picture of an irregular asteroid's composition, terrain and gravity. Its orbital observations of craters, boulders and surface texture helped reveal how small bodies respond to impacts and retain loose debris in low gravity. The asteroid flyby and Eros campaign strengthened models of the building blocks from which planets formed. The descent produced an unusual close-range dataset. The mission also demonstrated that navigating around and operating near a very small, irregular world requires techniques different from traditional Earth or planetary orbits.",
    "future_value": "Asteroid exploration today draws on lessons from NEAR about small-body navigation, orbital dynamics and close-proximity operations. Its design and terminal landing can be compared with later asteroid missions that deliberately sample or touch surfaces. The spacecraft is a historical artifact on Eros, but there is no basis for assuming it could be repaired or reused. Archived imagery and composition data remain important when comparing asteroids with meteorites and with future spacecraft observations. For a website, the most memorable transition is from the careful orbital mapping phase to a descent that turned the orbiter itself into the final object on the landscape."
  },
  {
    "name": "Pioneer 10",
    "year": "1972",
    "body": "Deep Space",
    "site": "Outbound path beyond the giant planets",
    "status": "Radio-silent spacecraft continuing away from the Sun",
    "img": "public/assets/missions/pioneer10.jpg",
    "relics": [
      "Pioneer 10 Spacecraft & 2.74m Parabolic Dish",
      "Gold-Anodized Aluminum Plaque with Message",
      "Four SNAP-19 Radioisotope Generators",
      "Geiger Tube Telescope & Cosmic Ray Telescope",
      "Imaging Photopolarimeter Optical Assembly"
    ],
    "desc": "Pioneer 10 became the first spacecraft to travel through the asteroid belt and closely explore Jupiter. Its final signal reached Earth in 2003, and the silent probe continues traveling through deep space.",
    "purpose": "The mission was designed to investigate Jupiter and the space between the inner and outer planets. Its instruments measured magnetic fields, charged particles, cosmic rays, meteoroids, ultraviolet emissions and other aspects of the environment; an imaging photopolarimeter provided observations of Jupiter and its atmosphere. It also tested whether a spacecraft could safely cross the asteroid belt and operate through Jupiter's intense radiation environment. The mission used radioisotope thermoelectric generators to provide electric power far from the Sun, where solar energy was a less practical primary power source for spacecraft of that generation.",
    "equipment_text": "The surviving hardware is Pioneer 10 itself: spacecraft bus, antenna dish, science instruments, propulsion and attitude-control elements, radioisotope power generators and its small engraved Pioneer plaque. No camera or scientific package was left on Jupiter, and the probe never landed there. Its antenna and transmitter are silent from Earth's perspective because communication ceased; that does not mean the whole structure has been physically destroyed. The plaque is an intentional message about human origins, carried along as the spacecraft travels through the outer reaches of the solar system. It is part of the spacecraft, not a separately deposited object.",
    "reason_discard": "Pioneer 10's mission outlasted its original schedule by decades, but the radioisotope power system weakened as the radioactive material decayed and electrical output fell. Communication became extremely faint across the growing distance, and the last signal was received in January 2003. Engineers tried later listening attempts without reestablishing contact. The spacecraft was not 'thrown away' after a failed landing; it followed a one-way escape trajectory that did not include return, servicing or capture. Its position and future path can be modeled, but no active navigation or current functioning should be claimed without new evidence.",
    "scientific_value": "Pioneer 10 provided the first direct exploration of Jupiter's vicinity and helped characterize its radiation belts, magnetosphere and surrounding space. That information influenced the design of later spacecraft and the interpretation of giant-planet environments. The voyage also demonstrated long-distance tracking, use of radioisotope power and interplanetary navigation beyond Mars. Its continued operations offered data about the solar environment across increasing distances from the Sun. The mission represented an engineering and scientific step from planetary flybys toward the much more distant deep-space missions that followed.",
    "future_value": "Pioneer 10's long-range history remains a reference for low-power communication, radioisotope-system aging and the problems of tracking objects far from Earth. Its plaque raises valuable questions about messages intended for unknown future finders and the human desire to leave records beyond Earth. No future retrieval is planned, and its outbound route should not be confused with an orbit around Jupiter. The satellite-like debris language used for near-Earth objects does not fit this deep-space probe well: it is better understood as an inert, historically important emissary. An interactive website could visualize the fading signal delay and growing Earth-spacecraft distance."
  },
  {
    "name": "Pioneer 11",
    "year": "1973",
    "body": "Deep Space",
    "site": "Outbound path after Jupiter and Saturn",
    "status": "Radio-silent spacecraft continuing outward",
    "img": "public/assets/missions/pioneer11.jpg",
    "relics": [
      "Pioneer 11 Spacecraft Bus & Parabolic Reflector",
      "Humanity's Pioneer Plaque Message",
      "SNAP-19 RTG Power Supply Units",
      "Fluxgate Magnetometer & Plasma Analyzer",
      "Infrared Radiometer Optical Assembly"
    ],
    "desc": "Pioneer 11 explored Jupiter and became the first spacecraft to fly past Saturn. Communication ended in 1995, but the spacecraft continues its journey away from the Sun, carrying a message from humanity.",
    "purpose": "The mission aimed to expand giant-planet exploration from Jupiter to Saturn and assess the hazards and physical properties of these distant environments. Instruments investigated radiation, energetic particles, magnetic fields, plasma, meteoroid environments and planetary atmospheres. Imaging and infrared measurements helped characterize the planets and their surroundings. Mission navigators used a Jupiter encounter to send the spacecraft onward toward Saturn, showing the value of gravity-assisted trajectories. Pioneer 11 also offered an early look at Saturn's rings and system before the more ambitious Voyager and Cassini spacecraft arrived.",
    "equipment_text": "Pioneer 11 retains its main spacecraft structure, large communications antenna, attached science instruments, radioisotope electrical generators and the engraved Pioneer plaque. The plaque, like Pioneer 10's, identifies a human origin through simple diagrams and symbols. Pioneer 11 did not leave a lander on Jupiter or Saturn, and no part of the main spacecraft is known to have been deposited on either planet. Its discarded status means it is no longer under active radio control, not that it sits somewhere on a solid planetary surface. Its exact future trajectory should be expressed cautiously rather than implying it is already at a known destination star.",
    "reason_discard": "The spacecraft had no plan to return to Earth and was designed for long-distance, one-way scientific travel. By the mid-1990s, spacecraft power and communications constraints had made continued operations impractical. NASA lost routine contact in September 1995 and received a final brief set of engineering data in November. The remaining hardware continued through space under the motion established by its trajectory, without active operation. This was an expected limitation of a very long mission, not evidence that the spacecraft had crashed or that a planetary gravity assist had stranded it.",
    "scientific_value": "Pioneer 11 provided humanity's first close reconnaissance of Saturn and helped refine understanding of the planet's rings, magnetic environment and atmospheric properties. It also gathered important data at Jupiter and demonstrated navigation over an extended interplanetary route. Measurements of particles, radiation and fields helped scientists interpret the outer solar system before later missions gathered more detailed datasets. For engineers, the spacecraft was part of the transition from isolated planetary flybys toward multi-target outer-planet exploration. Its continued operation beyond the initial encounters provided further information about the space environment far from the Sun.",
    "future_value": "Pioneer 11 remains significant for the history of gravity-assisted navigation, long-lived spacecraft operation and early giant-planet science. Its results can be compared with later observations from Voyager and Cassini to show how knowledge grows across generations of missions. Power-management and antenna-tracking lessons are useful for future far-distance robotic exploration. As with Pioneer 10, the physical craft is not realistically recoverable with current mission plans and should not be described as awaiting a return crew. A website can show two outward paths branching apart after Jupiter, emphasizing why Pioneer 10 and Pioneer 11 deserve separate stories."
  },
  {
    "name": "Kepler Space Telescope",
    "year": "2009",
    "body": "Deep Space",
    "site": "Earth-trailing orbit around the Sun",
    "status": "Retired telescope continues orbiting the Sun",
    "img": "public/assets/missions/kepler.jpg",
    "relics": [
      "0.95m Aperture Schmidt Telescope Optics",
      "42-CCD Science Focal Plane Array (95 Megapixels)",
      "Solar Array Panels & Heat Radiator Panels",
      "Reaction Wheels Assembly (Failed & Retired)",
      "Cold-Gas Thrusters & Spacecraft Bus Structure"
    ],
    "desc": "Kepler revolutionized astronomy by discovering thousands of planets beyond our solar system. After running out of fuel in 2018, the telescope was retired and continues traveling silently in orbit around the Sun.",
    "purpose": "Kepler's purpose was to discover exoplanets using the transit method. When a planet crosses in front of its star from our viewpoint, the star dims by a tiny amount; repeated measurements can reveal a planet's orbital period and approximate size. A precision photometer and telescope monitored the brightness of many stars with exceptional stability. Scientists also investigated how frequently Earth-size planets might occur and what the distribution of planetary systems says about planet formation. Later K2 observations continued planetary research and broadened the range of astrophysical studies made possible by the spacecraft's photometric data.",
    "equipment_text": "The abandoned hardware is the Kepler spacecraft itself, including the telescope optics, photometer, sunshade, spacecraft bus, communications antenna, solar panels, thrusters and attitude-control systems. It was not a lander and deposited no instruments on the Moon, Mars or a newly discovered exoplanet. Its safe orbit is around the Sun, not a graveyard orbit immediately around Earth. No separate probe is known to have detached to visit a planetary surface. The data archive, including light curves and planet-candidate analyses, survives on Earth and is not the same thing as the inactive physical telescope.",
    "reason_discard": "Kepler's original precision pointing was affected by reaction-wheel failures, but engineers repurposed the mission as K2 using a different pointing strategy. That innovation extended scientific work for years. Ultimately the remaining fuel for necessary spacecraft orientation and operations ran out in 2018, so continued accurate observations and communications could not be sustained. NASA retired the craft in place rather than attempting an impossible recovery or risking uncontrolled operations. Kepler's loss was not a crash. The spacecraft remains on a solar orbit safely separated from Earth, while the discoveries made during its operational lifetime continue to be examined.",
    "scientific_value": "Kepler provided evidence that planets are common around other stars, with thousands of confirmed discoveries associated with its data and many more candidates studied. Its precise brightness measurements revealed a wide variety of planet sizes, orbital periods and system architectures. The same archive supported research on stellar oscillations, flares and other astrophysical phenomena. Kepler changed exoplanet science from a search for unusual individual worlds into a statistical study of planetary populations. It also demonstrated the scientific value of stable, long-duration observations and of reusing a spacecraft creatively after serious hardware limitations arose.",
    "future_value": "Kepler's future value lies primarily in its data and the methods it inspired. Researchers can reanalyze light curves with new algorithms, combine them with observations from later telescopes and revisit planet candidates as better measurements become available. The mission provides an excellent case study in spacecraft adaptation through K2 and in making the best possible science before consumables are exhausted. Its inactive body remains an orbital artifact, not surface waste. A website could visualize a tiny brightness dip in a star's light and contrast the telescope's silent physical state with the continuing discovery potential of its data archive."
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
    window.videoStoryApp = this;

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
    const curIdx = ((Math.round(cur) % count) + count) % count;
    if (idx === curIdx) {
      // Already selected or clicked active item — navigate to mission detail page
      window.location.href = `mission-detail.html?mission=${idx}`;
      return;
    }
    let d = idx - curIdx;
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

window.updateMissionShowcase = updateMissionShowcase;
window.NASA_RELIC_MISSIONS = NASA_RELIC_MISSIONS;

function updateMissionShowcase(idx) {
  const mission = NASA_RELIC_MISSIONS[idx];
  if (!mission) return;
  window._currentMissionIdx = idx;

  const bgImage = document.getElementById('missions-bg-image');
  const heading = document.getElementById('mission-heading');
  const subheading = document.getElementById('mission-subheading');
  const paragraph = document.getElementById('mission-paragraph');

  if (bgImage) {
    const cleanImg = mission.img.replace(/^(\.\/)?public\//, '');
    bgImage.style.backgroundImage = `url('/${cleanImg}')`;
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
    defaultSelected: 0, // Start on Apollo 11
    textColor: '#7b8898',
    activeColor: '#ffffff',
    side: 'left',
    fontSize: 2.05,
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

  updateMissionShowcase(0);

  // Preload all 26 mission images so wheel transitions are instant and seamless
  NASA_RELIC_MISSIONS.forEach(m => {
    if (m.img) {
      const preload = new Image();
      preload.src = `/${m.img.replace(/^(\.\/)?public\//, "")}`;
    }
  });

  // Wire up the ENTER MISSION button to open mission-detail.html
  const enterBtn = document.getElementById('mission-enter-btn');
  if (enterBtn) {
    enterBtn.onclick = () => {
      const idx = window._currentMissionIdx !== undefined ? window._currentMissionIdx : 0;
      window.location.href = `mission-detail.html?mission=${idx}`;
    };
  }

  // Also allow clicking the large mission heading to navigate directly
  const headingEl = document.getElementById('mission-heading');
  if (headingEl) {
    headingEl.style.cursor = 'pointer';
    headingEl.title = 'Click to open full mission dossier';
    headingEl.onclick = () => {
      const idx = window._currentMissionIdx !== undefined ? window._currentMissionIdx : 0;
      window.location.href = `mission-detail.html?mission=${idx}`;
    };
  }
}

// ─── CELESTIAL BODIES: SPACE MATERIALS & DISCOVERIES ─────────
const CELESTIAL_BODIES_DISCOVERIES = [
  // 0. The Sun (Centerpiece)
  {
    name: 'The Sun',
    material: 'THE SUN — G-Type Main-Sequence Star & Solar Dynamo',
    discovery: 'The central star of our solar system containing 99.86% of its mass. Its core thermonuclear fusion of hydrogen into helium powers solar radiation, solar winds, and sustains planetary atmospheres.',
    image: 'public/assets/celestial/sun.jpg'
  },
  // 1. Earth (Immediate neighbor to the Sun)
  {
    name: 'Earth',
    material: 'EARTH — Habitable Oasis & Dynamic Biosphere',
    discovery: 'Our home world in the circumstellar habitable zone. Features a protective nitrogen-oxygen atmosphere, vast liquid water oceans, and a dynamic geomagnetic field powered by its molten core.',
    image: 'public/assets/celestial/earth.jpg'
  },
  // 2. Mars (Immediate neighbor to the Sun)
  {
    name: 'Mars',
    material: 'MARS — Iron Oxide Crust & Olympus Mons Volcano',
    discovery: 'The fourth planet from the Sun, named the Red Planet for its iron oxide surface. Home to ancient dry river valleys, massive shield volcanoes, and sub-surface water ice explored by NASA rovers.',
    image: 'public/assets/celestial/mars.jpg'
  },
  // 3. The Moon
  {
    name: 'The Moon',
    material: 'THE MOON — Anorthosite Highlands & Basaltic Maria',
    discovery: "Earth's natural satellite, orbiting at 384,400 km. Its surface preserves billions of years of impact craters, volcanic maria, and cold-trap volatile water deposits in polar craters.",
    image: 'public/assets/celestial/moon.jpg'
  },
  // 4. Jupiter
  {
    name: 'Jupiter',
    material: 'JUPITER — Giant Gas Vortex & Metallic Hydrogen Core',
    discovery: 'The largest planet in our solar system, more than twice the mass of all other planets combined. Known for the Great Red Spot anticyclonic storm and dozens of moons including oceanic Europa.',
    image: 'public/assets/celestial/jupiter.jpg'
  },
  // 5. Saturn
  {
    name: 'Saturn',
    material: 'SATURN — Water-Ice Ring System & Hexagonal Polar Jet',
    discovery: 'Famous for its dazzling system of icy planetary rings spanning thousands of kilometers, yet only meters thick. Its atmosphere features a persistent hexagonal vortex at its north pole.',
    image: 'public/assets/celestial/saturn.jpg'
  },
  // 6. Europa
  {
    name: 'Europa',
    material: 'EUROPA — Global Subsurface Ocean & Chaotic Ice Rafts',
    discovery: "Jupiter's ice-crusted moon harboring a deep global ocean of liquid saltwater beneath a 20 km ice shell. Gravitational tidal flexing generates internal heat, making it a prime candidate for astrobiology.",
    image: 'public/assets/celestial/europa.jpg'
  },
  // 7. Asteroid Belt
  {
    name: 'Asteroid Belt',
    material: 'ASTEROID BELT — Primordial Planetesimals & Chondrites',
    discovery: 'A circumstellar debris disc located between Mars and Jupiter containing millions of rocky asteroids and dwarf planet Ceres, preserving primordial remnants from planetary accretion 4.6 billion years ago.',
    image: 'public/assets/celestial/asteroid.jpg'
  },
  // 8. Cosmic Nebula
  {
    name: 'Cosmic Nebula',
    material: 'STELLAR NEBULA — Ionized Hydrogen & Star nurseries',
    discovery: 'Vast interstellar clouds of dust, hydrogen, and helium gases. These nebular clouds collapse under gravity to form embryonic protostars and planetary systems throughout the Milky Way.',
    image: 'public/assets/celestial/nebula.jpg'
  },
  // 9. Black Hole
  {
    name: 'Black Hole',
    material: 'BLACK HOLE — Relativistic Gravitational Singularity',
    discovery: 'Spacetime regions of immense gravitational attraction where escape velocity exceeds light speed. Matter spiraling into accretion disks radiates high-energy X-rays while bending nearby light paths.',
    image: 'public/assets/celestial/blackhole.jpg'
  },
  // 10. Mercury
  {
    name: 'Mercury',
    material: 'MERCURY — Iron Core Giant & Extreme Thermal Exosphere',
    discovery: 'The smallest planet and closest to the Sun. It experiences extreme temperature swings between 430°C and -180°C, and possesses an unusually large metallic iron core spanning 85% of its radius.',
    image: 'public/assets/celestial/mercury.jpg'
  },
  // 11. Venus
  {
    name: 'Venus',
    material: 'VENUS — Supercritical CO₂ & Runaway Greenhouse Effect',
    discovery: "Earth's twin in size and density, wrapped in reflective clouds of toxic sulfuric acid and a crushing 92-bar atmosphere. Intense greenhouse warming drives surface temperatures above 465°C.",
    image: 'public/assets/celestial/venus.jpg'
  },
  // 12. Neptune
  {
    name: 'Neptune',
    material: 'NEPTUNE — Methane-Rich Atmosphere & Supersonic Storms',
    discovery: 'The outermost ice giant planet, glowing vivid blue due to atmospheric methane. Neptune experiences the most violent windstorms in the solar system, with speeds exceeding 2,100 km/h.',
    image: 'public/assets/celestial/neptune.jpg'
  }
];

function initInfiniteMenuPage() {
  const root = document.getElementById('infinite-menu-root');
  if (!root) return;

  const items = CELESTIAL_BODIES_DISCOVERIES.map(c => {
    return {
      image: c.image,
      title: c.name.toUpperCase(),
      description: `<span class="celestial-mat-badge">${c.material}</span><span class="celestial-disc-text">${c.discovery}</span>`
    };
  });

  window.infiniteMenu = new VanillaInfiniteMenu(root, {
    items,
    count: 144,
    tileSize: 0.64,
    roundness: 0.22,
    zoom: 1.65,
    pullBack: 1,
    stretch: 0.6,
    inertia: 0.6,
    autoplay: 0,
    grayscale: false,
    dim: 0.4,
    intro: true,
    showInfo: true,
    theme: 'dark',
    accentColor: '#ffffff',
    onItemClick: (item, idx) => {
      // In-place selection and centering without external navigation
      console.log('Selected Celestial Body:', item?.title, idx);
    }
  });
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
          if (window.videoStoryApp) {
            window.videoStoryApp.open();
          }
        } else if (href && href.startsWith('#demo')) {
          e.preventDefault();
          this.close();
        } else if (href && href.startsWith('#')) {
          e.preventDefault();
          this.close();
          const targetSection = document.querySelector(href);
          if (targetSection && window.fullPageController) {
            const idx = window.fullPageController.sections.indexOf(targetSection);
            if (idx !== -1) {
              window.fullPageController.goTo(idx, true);
            }
          }
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

// ─── 6. FULL-SCREEN 1-PAGE SNAP NAVIGATION (Hero -> Missions -> Relics Sphere -> Team -> Scientists -> Inside NASA) ──
class FullPageSectionController {
  constructor() {
    this.sections = [
      document.getElementById('hero-page'),
      document.getElementById('missions-page'),
      document.getElementById('infinite-menu-page'),
      document.getElementById('why-us'),
      document.getElementById('scientists-section'),
      document.getElementById('inside-nasa-section'),
      document.getElementById('research-section'),
      document.getElementById('team-section')
    ].filter(Boolean);

    if (this.sections.length === 0) return;

    window.fullPageController = this;
    this.currentIndex = 0;
    this.isAnimating = false;
    this.animTimeout = null;

    this.initObserver();
    this.detectInitialSection();
    this.bindEvents();
  }

  initObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const isWhyUs = entry.target.id === 'why-us';
        const ratioNeeded = isWhyUs ? 0.2 : 0.5;
        if (entry.isIntersecting && entry.intersectionRatio >= ratioNeeded) {
          const idx = this.sections.indexOf(entry.target);
          if (idx !== -1 && !this.isAnimating) {
            this.currentIndex = idx;
            const hash = '#' + entry.target.id;
            if (window.location.hash !== hash) {
              history.replaceState(null, null, hash);
            }
          }
          if (entry.target.id === 'team-section') {
            window.jangleTeamCards?.(1.15);
          }
        }
      });
    }, { threshold: [0.2, 0.5] });

    this.sections.forEach(s => observer.observe(s));
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
    const isPrev = index < this.currentIndex;
    this.currentIndex = index;
    this.isAnimating = true;

    const targetSection = this.sections[index];
    let targetTop = targetSection.offsetTop;

    if (targetSection.id === 'why-us' && isPrev) {
      targetTop = targetSection.offsetTop + targetSection.offsetHeight - window.innerHeight;
    }



    window.scrollTo({
      top: targetTop,
      behavior: smooth ? 'smooth' : 'auto'
    });

    const hash = '#' + targetSection.id;
    if (window.location.hash !== hash) {
      history.replaceState(null, null, hash);
    }

    if (targetSection.id === 'team-section') {
      setTimeout(() => window.jangleTeamCards?.(1.15), smooth ? 280 : 50);
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
    window.addEventListener('hashchange', () => {
      this.detectInitialSection();
    });

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

      // If cursor is over the FlexCarousel, let it handle wheel events natively (cycling cards)
      if (e.target && e.target.closest('.flex-carousel')) return;



      // Smooth controlled scroll through why-us section
      const overWhyUs = (e.target && e.target.closest('#why-us')) || (currentSection && currentSection.id === 'why-us');
      if (overWhyUs) {
      // When cursor is over why-us-steps-scroll, let user scroll vertically through 1, 2, 3...
      const stepsScroll = e.target && e.target.closest('#why-us-steps-scroll');
      if (stepsScroll) {
        const atTop = stepsScroll.scrollTop <= 4;
        const atBottom = stepsScroll.scrollTop + stepsScroll.clientHeight >= stepsScroll.scrollHeight - 4;
        if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) {
          // Allow natural scroll inside steps container
          return;
        }
      }
        const currentScroll = window.scrollY || window.pageYOffset || 0;
        const sectionTop = currentSection.offsetTop;
        const sectionHeight = currentSection.offsetHeight;
        const viewportHeight = window.innerHeight;
        const maxScroll = Math.max(0, sectionTop + sectionHeight - viewportHeight);
        const atTop = currentScroll <= sectionTop + 20;
        const atBottom = currentScroll >= maxScroll - 20;

        if (e.deltaY > 0) {
          if (!atBottom) {
            e.preventDefault();
            const scrollStep = Math.min(Math.max(Math.abs(e.deltaY) * 1.5, 140), 280);
            const targetScroll = Math.min(currentScroll + scrollStep, maxScroll);
            window.scrollTo({
              top: targetScroll,
              behavior: 'smooth'
            });
            return;
          } else {
            e.preventDefault();
            this.next();
            return;
          }
        } else if (e.deltaY < 0) {
          if (!atTop) {
            e.preventDefault();
            const scrollStep = Math.min(Math.max(Math.abs(e.deltaY) * 1.5, 140), 280);
            const targetScroll = Math.max(currentScroll - scrollStep, sectionTop);
            window.scrollTo({
              top: targetScroll,
              behavior: 'smooth'
            });
            return;
          } else {
            e.preventDefault();
            this.prev();
            return;
          }
        }
      }

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
      if (e.target && e.target.closest('.flex-carousel')) return;

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

// ─── 7. NASA SCIENTISTS SECTION (React Bits FlexCarousel • Editorial Blog Synchronization) ───
function initScientistsSection() {
  const container = document.getElementById('scientists-flex-carousel');
  if (!container) return;

  const entryEl = document.getElementById('scientist-dynamic-entry');
  const fieldEl = document.getElementById('scientist-dynamic-field');
  const nameEl = document.getElementById('scientist-dynamic-name');
  const roleEl = document.getElementById('scientist-dynamic-role');
  const bioEl = document.getElementById('scientist-dynamic-bio');
  const eraEl = document.getElementById('scientist-dynamic-era');
  const missionEl = document.getElementById('scientist-dynamic-mission');
  const quoteEl = document.getElementById('scientist-dynamic-quote');
  const quoteAuthorEl = document.getElementById('scientist-dynamic-quote-author');
  const impactEl = document.getElementById('scientist-dynamic-impact');
  const progressFill = document.getElementById('scientist-progress-fill');
  const prevBtn = document.getElementById('scientists-prev-btn');
  const nextBtn = document.getElementById('scientists-next-btn');

  let activeIndex = -1;
  const totalItems = NASA_SCIENTIST_ITEMS.length;

  function updateScientistBlogUI(idx, item) {
    if (idx === activeIndex || !item) return;
    activeIndex = idx;

    const progressPct = ((idx + 1) / totalItems) * 100;
    if (progressFill) {
      progressFill.style.width = `${progressPct.toFixed(1)}%`;
    }

    const animatedTargets = [nameEl, roleEl, bioEl, eraEl, missionEl, quoteEl, quoteAuthorEl, impactEl, fieldEl].filter(Boolean);

    if (window.gsap && animatedTargets.length) {
      window.gsap.to(animatedTargets, {
        opacity: 0,
        y: -4,
        duration: 0.16,
        stagger: 0.012,
        onComplete: () => {
          if (entryEl) entryEl.textContent = `LOG ${String(idx + 1).padStart(2, '0')} // ${String(totalItems).padStart(2, '0')}`;
          if (fieldEl) fieldEl.textContent = (item.field || 'ASTROPHYSICS').toUpperCase();
          if (nameEl) nameEl.textContent = item.title || '';
          if (roleEl) roleEl.textContent = item.subtitle || '';
          if (bioEl) bioEl.textContent = item.bio || '';
          if (eraEl) eraEl.textContent = item.era || '1960 – PRESENT';
          if (missionEl) missionEl.textContent = item.mission || 'NASA DEEP SPACE';
          if (quoteEl) quoteEl.textContent = item.quote || '';
          if (quoteAuthorEl) quoteAuthorEl.textContent = item.title ? `— ${item.title}` : '';
          if (impactEl) impactEl.textContent = item.impact || '';

          window.gsap.fromTo(animatedTargets,
            { opacity: 0, y: 5 },
            { opacity: 1, y: 0, duration: 0.26, stagger: 0.015, ease: 'power2.out' }
          );
        }
      });
    } else {
      if (entryEl) entryEl.textContent = `LOG ${String(idx + 1).padStart(2, '0')} // ${String(totalItems).padStart(2, '0')}`;
      if (fieldEl) fieldEl.textContent = (item.field || 'ASTROPHYSICS').toUpperCase();
      if (nameEl) nameEl.textContent = item.title || '';
      if (roleEl) roleEl.textContent = item.subtitle || '';
      if (bioEl) bioEl.textContent = item.bio || '';
      if (eraEl) eraEl.textContent = item.era || '1960 – PRESENT';
      if (missionEl) missionEl.textContent = item.mission || 'NASA DEEP SPACE';
      if (quoteEl) quoteEl.textContent = item.quote || '';
      if (quoteAuthorEl) quoteAuthorEl.textContent = item.title ? `— ${item.title}` : '';
      if (impactEl) impactEl.textContent = item.impact || '';
    }
  }

  // Initialize compact FlexCarousel: very small cards so maximum images are visible at once
  const carousel = new VanillaFlexCarousel(container, {
    items: NASA_SCIENTIST_ITEMS,
    preset: 'liquid',
    intro: 'rise',
    cardHeight: window.innerWidth < 768 ? 0.35 : 0.28,
    gap: 5,
    radius: 8,
    squeeze: 0.06,
    rotation: window.innerWidth < 900 ? -10 : -18,
    focusOnClick: true,
    captions: false,
    autoplay: true,
    interval: 5.0,
    captureWheel: true,
    onChange: (idx, item) => {
      updateScientistBlogUI(idx, item);
    }
  });

  // Interactive navigation buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      carousel.prev();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      carousel.next();
    });
  }

  // Initial sync with first item
  updateScientistBlogUI(0, NASA_SCIENTIST_ITEMS[0]);

  window.scientistsCarousel = carousel;
}

// ─── 8. INSIDE NASA HIGH-BAY & MISSION CONTROL DRIFT WALL (React Bits DriftWall) ───
function initInsideNasaSection() {
  const container = document.getElementById('drift-wall-root');
  if (!container) return;

  new VanillaDriftWall(container, {
    items: NASA_INSIDE_ITEMS,
    columns: window.innerWidth > 1400 ? 5 : 4,
    tileWidth: 220,
    tileHeight: 144,
    gap: 18,
    radius: 14,
    tilt: 16,
    turn: -14,
    roll: 0,
    perspective: 1200,
    depth: 120,
    speed: 36,
    direction: 'up',
    variance: 0.45,
    parallax: 0.65,
    pauseOnHover: true,
    lift: 66,
    fade: 0.6,
    dim: 0.55,
    grayscale: false,
    overlayColor: '#060010'
  });
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
  initScientistsSection();
  initInsideNasaSection();
  initResearchSection();
  window.initWhyUsSection?.();
  new FullPageSectionController();

  // Mount React Bits SplashCursor strictly in Hero Section with dark blue flame styling
  try {
    const heroPage = document.getElementById('hero-page');
    if (heroPage) {
      window.splashCursor = new VanillaSplashCursor(heroPage, {
        colors: [
          '#020b42', // Deep dark midnight blue base
          '#001a75', // Dark royal flame
          '#002ecb', // Intense cobalt flame
          '#0044ff', // Electric blue flame core
          '#001899', // Deep sapphire flame
          '#0033d4'  // Vivid blue flame crest
        ],
        rainbow: false,
        colorSpeed: 0.8,
        intensity: 1.35,
        size: 1.05,
        force: 1.3,
        swirl: 4.5,
        trail: 1.15,
        momentum: 1.0,
        shading: 0.92,
        glow: 0.35,
        clickSplash: true,
        intro: true,
        contained: true,
        zIndex: 15,
        theme: 'dark'
      });
    }
  } catch (err) {
    console.warn('SplashCursor initialization notice:', err);
  }

  console.log('🚀 Infinite Void — Video & Lunar Crew Engine Active.');
});

// ─── 10. OUR REFERENCES (React Bits Folder Integration • 8 Dossiers, 4 Per Row) ───
function initResearchSection() {
  const gridRoot = document.getElementById('research-grid-root');
  if (!gridRoot) return;

  gridRoot.innerHTML = '';

  RESEARCH_DOSSIERS.forEach((dossier, idx) => {
    const item = document.createElement('div');
    item.className = 'research-item';

    // Folder mount stage
    const folderStage = document.createElement('div');
    folderStage.className = 'research-folder-stage';
    folderStage.id = `folder-stage-${idx}`;
    item.appendChild(folderStage);

    // Metadata directly below folder: Project Title & Scope/Year
    const meta = document.createElement('div');
    meta.className = 'research-dossier-meta';
    meta.innerHTML = `
      <h3 class="research-dossier-title" title="${dossier.title}">${dossier.title}</h3>
      <span class="research-dossier-year" style="color: ${dossier.color};">${dossier.year}</span>
    `;
    item.appendChild(meta);

    gridRoot.appendChild(item);

    // Mount VanillaFolder instance calibrated to fit 100% on a single screen
    new VanillaFolder(folderStage, {
      items: dossier.docs,
      label: dossier.tab,
      mode: 'flap',
      variant: dossier.variant || 'glass',
      layout: 'spread',
      color: dossier.color,
      paperColor: '#ffffff',
      tabPosition: 'right',
      openOn: 'click',
      size: 0.52,
      frost: 0.25,
      tilt: 0.45,
      bounce: 0.35,
      speed: 1.0,
      peek: true,
      draggable: true,
      zoomOnClick: false,
      theme: 'dark',
      onItemClick: (item, index) => {
        // Document clicked - navigation handled directly by VanillaFolder
      },
      onOpenChange: (open) => {
        try {
          if (window.tacticalAudio) {
            window.tacticalAudio.playBeep(open ? 1150 : 720, 0.04);
          }
        } catch (e) {}
      }
    });
  });
}
