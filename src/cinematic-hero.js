import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// ─── Config ────────────────────────────────────────────────────────────────
const SCROLL_MULTIPLIER = 4;     // hero occupies 4 × 100vh of scroll space
const SCRUB              = 0.8;  // GSAP scrub smoothing (lower = more responsive)
const SNOW_COUNT         = 80;
const MAX_MEM_FRAMES     = 60;   // sliding-window frame cap

// ─── Frame URLs via Vite glob ───────────────────────────────────────────────
const frameModules = import.meta.glob('/src/animation/*.png', {
  query: '?url', import: 'default', eager: true,
});
const frameUrls = Object.keys(frameModules).sort().map(k => frameModules[k]);
const TOTAL_FRAMES = frameUrls.length;

// ─── DOM refs ───────────────────────────────────────────────────────────────
const canvas      = document.getElementById('hero-canvas');
const snowCanvas  = document.getElementById('snow-canvas');
const ctx         = canvas.getContext('2d', { alpha: false });
const sCtx        = snowCanvas.getContext('2d');
const loadingBar  = document.getElementById('hero-loading-bar');
const loadingFill = document.getElementById('hero-loading-fill');

// ─── State ──────────────────────────────────────────────────────────────────
const images   = new Map();   // index → HTMLImageElement
let loadedCount   = 0;
let targetFrame   = 0;
let currentFrame  = 0;
let lastFrame     = -1;

// ─── Resize ─────────────────────────────────────────────────────────────────
function resizeCanvases() {
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width  = w; canvas.height  = h;
  snowCanvas.width = w; snowCanvas.height = h;
}
resizeCanvases();
window.addEventListener('resize', resizeCanvases);

// ─── Cover-fit draw ──────────────────────────────────────────────────────────
function drawCover(c, img) {
  if (!img || !img.complete || !img.naturalWidth) return;
  const cW = c.canvas.width, cH = c.canvas.height;
  const iW = img.naturalWidth,  iH = img.naturalHeight;
  const s  = Math.max(cW / iW, cH / iH);
  c.drawImage(img, (cW - iW * s) / 2, (cH - iH * s) / 2, iW * s, iH * s);
}

function renderFrame(idx) {
  const i = Math.max(0, Math.min(TOTAL_FRAMES - 1, idx));
  let img = images.get(i);
  if (!img || !img.complete) {
    for (let d = 1; d < TOTAL_FRAMES; d++) {
      if (images.get(i - d)?.complete) { img = images.get(i - d); break; }
      if (images.get(i + d)?.complete) { img = images.get(i + d); break; }
    }
  }
  if (!img?.complete) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCover(ctx, img);
}

// ─── Frame loading ───────────────────────────────────────────────────────────
function loadFrame(index) {
  if (images.has(index)) return Promise.resolve();
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { images.set(index, img); loadedCount++; onProgress(); resolve(); };
    img.onerror = () => { loadedCount++; onProgress(); resolve(); };
    img.src = frameUrls[index];
  });
}

function onProgress() {
  const p = loadedCount / TOTAL_FRAMES;
  if (loadingFill) loadingFill.style.width = `${p * 100}%`;
  if (p >= 1 && loadingBar) {
    gsap.to(loadingBar, { opacity: 0, duration: 0.6, delay: 0.3,
      onComplete: () => { loadingBar.style.display = 'none'; } });
  }
}

function evict(center) {
  if (images.size <= MAX_MEM_FRAMES) return;
  const far = [...images.keys()]
    .sort((a, b) => Math.abs(b - center) - Math.abs(a - center));
  far.slice(MAX_MEM_FRAMES).forEach(k => images.delete(k));
}

async function preloadAllFrames() {
  await loadFrame(0);
  renderFrame(0);
  // First 24 frames eagerly (guarantee smooth intro)
  const first = Array.from({ length: Math.min(24, TOTAL_FRAMES) }, (_, i) => i + 1);
  await Promise.all(first.map(loadFrame));
  // Rest in batches of 8
  const BATCH = 8;
  for (let i = 25; i < TOTAL_FRAMES; i += BATCH) {
    const batch = Array.from({ length: Math.min(BATCH, TOTAL_FRAMES - i) }, (_, k) => i + k);
    await Promise.all(batch.map(loadFrame));
    evict(Math.round(currentFrame));
    await new Promise(r => setTimeout(r, 16)); // yield
  }
}

// ─── Snowfall ────────────────────────────────────────────────────────────────
const flakes = Array.from({ length: SNOW_COUNT }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  r: Math.random() * 2.2 + 0.4,
  vy: Math.random() * 0.7 + 0.2,
  vx: (Math.random() - 0.5) * 0.3,
  op: Math.random() * 0.55 + 0.08,
  wb: Math.random() * Math.PI * 2,
  ws: (Math.random() - 0.5) * 0.018,
}));

function tickSnow() {
  const w = snowCanvas.width, h = snowCanvas.height;
  sCtx.clearRect(0, 0, w, h);
  for (const f of flakes) {
    f.wb += f.ws;
    f.x  += f.vx + Math.sin(f.wb) * 0.25;
    f.y  += f.vy;
    if (f.y > h + 8)  { f.y = -8;  f.x = Math.random() * w; }
    if (f.x < -8)       f.x = w + 8;
    if (f.x > w + 8)    f.x = -8;
    sCtx.beginPath();
    sCtx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    sCtx.fillStyle = `rgba(215,232,255,${f.op})`;
    sCtx.fill();
  }
}

// ─── RAF loop ────────────────────────────────────────────────────────────────
function loop() {
  requestAnimationFrame(loop);
  currentFrame += (targetFrame - currentFrame) * 0.1;
  const fi = Math.round(currentFrame);
  if (fi !== lastFrame) { renderFrame(fi); lastFrame = fi; }
  tickSnow();
}

// ─── Lenis + ScrollTrigger ────────────────────────────────────────────────────
let lenisInstance = null;

export function getLenis() { return lenisInstance; }

function initScroll() {
  const lenis = new Lenis({
    duration: 0.9,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
  });
  lenisInstance = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Hero overlay entrance
  gsap.fromTo('.hero-text-inner',
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 1.6, ease: 'power3.out', delay: 0.4 }
  );

  // Frame scrub
  ScrollTrigger.create({
    trigger: '.hero-scene',
    start: 'top top',
    end: `+=${window.innerHeight * SCROLL_MULTIPLIER}`,
    scrub: SCRUB,
    onUpdate(self) {
      targetFrame = self.progress * (TOTAL_FRAMES - 1);
      evict(Math.round(targetFrame));
    },
  });

  // Fade overlay text mid-scroll
  gsap.to('.hero-text-inner', {
    scrollTrigger: {
      trigger: '.hero-scene',
      start: `top+=${window.innerHeight * 2.8} top`,
      end:   `top+=${window.innerHeight * 3.6} top`,
      scrub: 1,
    },
    opacity: 0,
    y: -30,
  });
}

// ─── Boot ────────────────────────────────────────────────────────────────────
export function initCinematicHero() {
  loop();
  initScroll();
  preloadAllFrames();
}
