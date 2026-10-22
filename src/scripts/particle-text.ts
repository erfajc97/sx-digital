/* Particle text effect — vanilla port (no React).
   Adapted from the 21st.dev "ParticleTextEffect":
   - transparent fading trails (destination-out) so it composites over the video
   - all-white particles that FADE in/out via alpha (no opaque black squares,
     so no visible rectangular "box" forms over the video)
   - auto-fit font so Spanish words fit
   - pauses when off-screen or tab hidden; disabled under reduced-motion */

interface Vec {
  x: number;
  y: number;
}

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
  /** 0 → invisible, 1 → fully visible. Particles fade in when forming a word
      and fade out when killed, so they never appear as solid dark squares. */
  alpha = 0;
  fadeRate = 0.04;

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
    const targetA = this.isKilled ? 0 : 1;
    if (this.alpha < targetA) this.alpha = Math.min(this.alpha + this.fadeRate, 1);
    else if (this.alpha > targetA) this.alpha = Math.max(this.alpha - this.fadeRate, 0);
    if (this.alpha <= 0) return;
    ctx.fillStyle = `rgba(${WHITE.r}, ${WHITE.g}, ${WHITE.b}, ${this.alpha})`;
    ctx.fillRect(this.pos.x, this.pos.y, this.particleSize, this.particleSize);
  }

  kill(w: number, h: number) {
    if (this.isKilled) return;
    const p = randomEdge(w / 2, h / 2, (w + h) / 2);
    this.target.x = p.x;
    this.target.y = p.y;
    this.isKilled = true;
  }
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
  // Time on screen per word, in ms (time-based so 120 Hz screens don't cycle
  // twice as fast as 60 Hz ones).
  const WORD_MS = 3700;
  let wordSince = 0;
  let wordIndex = 0;
  let raf = 0;
  let running = false;
  let ready = false; // false until the intro gate is out of the way

  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const octx = off.getContext('2d')!;

  // Sample the brand display face (Clash Display) so the formed words carry the
  // brand identity instead of generic Arial. Arial stays as the fallback until
  // the woff2 is ready (see the document.fonts guard below).
  const FONT = (size: number) => `700 ${size}px "Clash Display", Arial, sans-serif`;

  const fitFont = (word: string) => {
    let size = 200;
    octx.font = FONT(size);
    const maxW = W * 0.92;
    const maxH = H * 0.74;
    while (size > 20 && (octx.measureText(word).width > maxW || size > maxH)) {
      size -= 4;
      octx.font = FONT(size);
    }
    return size;
  };

  /** `burst`: new particles spawn around their target and fade in fast, so
      the first word reads in well under a second instead of flying in from
      the canvas edges. */
  const setWord = (word: string, burst = false) => {
    octx.clearRect(0, 0, W, H);
    const size = fitFont(word);
    octx.fillStyle = 'white';
    octx.font = FONT(size);
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
        p.isKilled = false; // fade back in toward the new target
        idx++;
      } else {
        p = new Particle();
        if (burst) {
          p.pos.x = x + (Math.random() - 0.5) * 160;
          p.pos.y = y + (Math.random() - 0.5) * 120;
        } else {
          const rp = randomEdge(W / 2, H / 2, (W + H) / 2);
          p.pos.x = rp.x;
          p.pos.y = rp.y;
        }
        // 6–15 px/frame: each word reads in ~1,4 s (first one ~0,8 s) out of
        // its 3,7 s on screen; slower and the next word starts before this one
        // has finished forming.
        p.maxSpeed = Math.random() * 9 + 6;
        p.maxForce = p.maxSpeed * 0.05;
        p.particleSize = Math.random() * 1.5 + 1.5;
        p.fadeRate = burst ? Math.random() * 0.04 + 0.06 : Math.random() * 0.03 + 0.02;
        particles.push(p);
      }
      p.target.x = x;
      p.target.y = y;
    }
    for (let i = idx; i < particles.length; i++) particles[i].kill(W, H);
  };

  const tick = (now: number) => {
    // Fully clear every frame (no motion-blur trail) so no rectangular haze /
    // "container" ever builds up over the video — only the live particles show.
    ctx.clearRect(0, 0, W, H);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.move();
      p.draw(ctx);
      // remove fully-faded killed particles, or ones that drifted far off-canvas
      if (
        p.isKilled &&
        (p.alpha <= 0 || p.pos.x < -50 || p.pos.x > W + 50 || p.pos.y < -50 || p.pos.y > H + 50)
      ) {
        particles.splice(i, 1);
      }
    }

    if (!wordSince) wordSince = now;
    else if (now - wordSince >= WORD_MS) {
      wordSince = now;
      wordIndex = (wordIndex + 1) % words.length;
      setWord(words[wordIndex]);
    }
    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running || !ready) return;
    running = true;
    wordSince = 0; // back in view → current word gets its full time again
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
  };

  // Form the first word only once the hero is actually visible, and give it
  // its full on-screen time before cycling to the next one.
  const begin = () => {
    if (ready) return;
    ready = true;
    setWord(words[wordIndex], true);
    start();
  };
  const gate = document.getElementById('intro-gate');
  if (!gate || document.documentElement.dataset.intro === 'done') begin();
  else {
    window.addEventListener('solvyx:intro-done', begin, { once: true });
    window.setTimeout(begin, 6000); // never leave the headline blank
  }

  // Re-sample the current word once Clash Display is actually loaded, so it
  // doesn't stay in the Arial fallback if the font arrives late.
  if (document.fonts && 'load' in document.fonts) {
    document.fonts
      .load('700 200px "Clash Display"')
      .then(() => ready && setWord(words[wordIndex]));
  }

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
