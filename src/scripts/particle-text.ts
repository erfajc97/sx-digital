/* Particle text effect — vanilla port (no React).
   Adapted from the 21st.dev "ParticleTextEffect":
   - transparent fading trails (destination-out) so it composites over the video
   - brand colors only (white / cobalt), no rainbow
   - auto-fit font so Spanish words fit
   - pauses when off-screen or tab hidden; disabled under reduced-motion */

interface Vec {
  x: number;
  y: number;
}

const COBALT = { r: 96, g: 132, b: 255 };
const WHITE = { r: 245, g: 247, b: 250 };

class Particle {
  pos: Vec = { x: 0, y: 0 };
  vel: Vec = { x: 0, y: 0 };
  acc: Vec = { x: 0, y: 0 };
  target: Vec = { x: 0, y: 0 };
  closeEnoughTarget = 100;
  maxSpeed = 1;
  maxForce = 0.1;
  particleSize = 4;
  isKilled = false;
  startColor = { r: 0, g: 0, b: 0 };
  targetColor = { r: 0, g: 0, b: 0 };
  colorWeight = 0;
  colorBlendRate = 0.01;

  move() {
    let proximityMult = 1;
    const d = Math.hypot(this.pos.x - this.target.x, this.pos.y - this.target.y);
    if (d < this.closeEnoughTarget) proximityMult = d / this.closeEnoughTarget;

    const tt = { x: this.target.x - this.pos.x, y: this.target.y - this.pos.y };
    const m = Math.hypot(tt.x, tt.y);
    if (m > 0) {
      tt.x = (tt.x / m) * this.maxSpeed * proximityMult;
      tt.y = (tt.y / m) * this.maxSpeed * proximityMult;
    }
    const steer = { x: tt.x - this.vel.x, y: tt.y - this.vel.y };
    const sm = Math.hypot(steer.x, steer.y);
    if (sm > 0) {
      steer.x = (steer.x / sm) * this.maxForce;
      steer.y = (steer.y / sm) * this.maxForce;
    }
    this.acc.x += steer.x;
    this.acc.y += steer.y;
    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.acc.x = 0;
    this.acc.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.colorWeight < 1) this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1);
    const c = {
      r: Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight),
      g: Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight),
      b: Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight),
    };
    ctx.fillStyle = `rgb(${c.r}, ${c.g}, ${c.b})`;
    ctx.fillRect(this.pos.x, this.pos.y, this.particleSize, this.particleSize);
  }

  kill(w: number, h: number) {
    if (this.isKilled) return;
    const p = randomEdge(w / 2, h / 2, (w + h) / 2);
    this.target.x = p.x;
    this.target.y = p.y;
    this.startColor = blend(this.startColor, this.targetColor, this.colorWeight);
    this.targetColor = { r: 0, g: 0, b: 0 };
    this.colorWeight = 0;
    this.isKilled = true;
  }
}

function blend(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, w: number) {
  return {
    r: a.r + (b.r - a.r) * w,
    g: a.g + (b.g - a.g) * w,
    b: a.b + (b.b - a.b) * w,
  };
}

function randomEdge(x: number, y: number, mag: number): Vec {
  const rx = Math.random() * 1000;
  const ry = Math.random() * 500;
  const dir = { x: rx - x, y: ry - y };
  const m = Math.hypot(dir.x, dir.y);
  if (m > 0) {
    dir.x = (dir.x / m) * mag;
    dir.y = (dir.y / m) * mag;
  }
  return { x: x + dir.x, y: y + dir.y };
}

export function initParticleText(canvas: HTMLCanvasElement, words: string[]) {
  const W = 1100;
  const H = 340;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const particles: Particle[] = [];
  const pixelSteps = 6;
  let frame = 0;
  let wordIndex = 0;
  let raf = 0;
  let running = false;

  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const octx = off.getContext('2d')!;

  const fitFont = (word: string) => {
    let size = 200;
    octx.font = `bold ${size}px Arial`;
    const maxW = W * 0.92;
    const maxH = H * 0.74;
    while (size > 20 && (octx.measureText(word).width > maxW || size > maxH)) {
      size -= 4;
      octx.font = `bold ${size}px Arial`;
    }
    return size;
  };

  const setWord = (word: string, color: { r: number; g: number; b: number }) => {
    octx.clearRect(0, 0, W, H);
    const size = fitFont(word);
    octx.fillStyle = 'white';
    octx.font = `bold ${size}px Arial`;
    octx.textAlign = 'left';
    octx.textBaseline = 'middle';
    octx.fillText(word, 8, H / 2);

    const pixels = octx.getImageData(0, 0, W, H).data;
    const coords: number[] = [];
    for (let i = 0; i < pixels.length; i += pixelSteps * 4) coords.push(i);
    for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [coords[i], coords[j]] = [coords[j], coords[i]];
    }

    let idx = 0;
    for (const ci of coords) {
      if (pixels[ci + 3] <= 0) continue;
      const x = (ci / 4) % W;
      const y = Math.floor(ci / 4 / W);
      let p: Particle;
      if (idx < particles.length) {
        p = particles[idx];
        p.isKilled = false;
        idx++;
      } else {
        p = new Particle();
        const rp = randomEdge(W / 2, H / 2, (W + H) / 2);
        p.pos.x = rp.x;
        p.pos.y = rp.y;
        p.maxSpeed = Math.random() * 6 + 4;
        p.maxForce = p.maxSpeed * 0.05;
        p.particleSize = Math.random() * 1.5 + 1.5;
        p.colorBlendRate = Math.random() * 0.0275 + 0.0025;
        particles.push(p);
      }
      p.startColor = blend(p.startColor, p.targetColor, p.colorWeight);
      p.targetColor = color;
      p.colorWeight = 0;
      p.target.x = x;
      p.target.y = y;
    }
    for (let i = idx; i < particles.length; i++) particles[i].kill(W, H);
  };

  const tick = () => {
    // fade existing pixels toward transparent (motion-blur trails over the video)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.move();
      p.draw(ctx);
      if (p.isKilled && (p.pos.x < -50 || p.pos.x > W + 50 || p.pos.y < -50 || p.pos.y > H + 50)) {
        particles.splice(i, 1);
      }
    }

    frame++;
    if (frame % 220 === 0) {
      wordIndex = (wordIndex + 1) % words.length;
      setWord(words[wordIndex], wordIndex % 2 === 0 ? WHITE : COBALT);
    }
    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
  };

  setWord(words[0], WHITE);
  start();

  // Pause when off-screen (perf)
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0.01 }
    );
    io.observe(canvas);
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}

// Auto-init from the DOM
const el = document.getElementById('hero-particles') as HTMLCanvasElement | null;
if (el) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let words: string[] = [];
  try {
    words = JSON.parse(el.dataset.words || '[]');
  } catch {
    /* keep empty */
  }
  if (!reduce && words.length) {
    el.classList.remove('hidden');
    el.style.display = 'block';
    // keep the heading for SEO / screen-readers, just hide it visually
    const fb = document.getElementById('hero-fallback');
    if (fb) fb.classList.add('sr-only');
    initParticleText(el, words);
  }
}
