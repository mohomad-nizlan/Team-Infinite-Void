/* ==============================================================
   INFINITE VOID — NASA SPACE APPS 2026
   Main JS: Smooth Video Player + 2-Screen Snap (Video -> Astronauts)
   ============================================================== */

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

// ─── 3. VIDEO PLAYER & 3-PHASE TRANSITIONS (Video 1 -> Astronauts -> Video 2) ──
class VideoStoryApp {
  constructor() {
    this.screen           = document.getElementById('frame-screen');
    this.video            = document.getElementById('scene-video');
    this.video2           = document.getElementById('scene-video-2');
    this.imageMeet        = document.getElementById('scene-image-meet');
    this.videoSection     = document.getElementById('video-screen-phase');
    this.imageSection     = document.getElementById('image-screen-phase');
    this.videoSection2    = document.getElementById('video-screen-phase-2');
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
        if (this.videoSection2 && this.screen.scrollTop > window.innerHeight * 1.5) {
          if (this.video2) this.togglePlayPause(this.video2);
        } else if (this.screen.scrollTop < window.innerHeight * 0.5) {
          this.togglePlayPause(this.video);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        this.toggleAudio();
      }
    });

    // Screen intersection observer for automatic play/pause across the 3 phases
    // Phase 1: Video 1 | Phase 2: Encounter Image | Phase 3: Video 2
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!this.isOpen) return;
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (entry.target === this.videoSection) {
              if (this.video2) this.video2.pause();
              this.safePlay(this.video);
            } else if (entry.target === this.imageSection) {
              // Middle screen: pause both videos
              this.video.pause();
              if (this.video2) this.video2.pause();
            } else if (entry.target === this.videoSection2) {
              // Bottom screen: pause video 1 and play video 2
              this.video.pause();
              if (this.video2) {
                this.safePlay(this.video2);
              }
            }
          }
        });
      }, { root: this.screen, threshold: 0.5 });

      if (this.videoSection) observer.observe(this.videoSection);
      if (this.imageSection) observer.observe(this.imageSection);
      if (this.videoSection2) observer.observe(this.videoSection2);
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

// ─── 3. APP INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  new Starfield();
  new VideoStoryApp();

  console.log('🚀 Infinite Void — Video & Lunar Crew Engine Active.');
});
