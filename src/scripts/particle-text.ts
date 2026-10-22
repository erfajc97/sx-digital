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

const WHITE = 'rgb(245, 247, 250)';
const STEP_MS = 1000 / 60; // speeds/forces/fades are tuned per 1/60 s

class Particle {
  pos: Vec = { x: 0, y: 0 };
  vel: Vec = { x: 0, y: 0 };
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

  /** Advance by `k` sixtieths of a second (k = 0.5 on a 120 Hz frame, 2 on
      a 30 fps one), so every frame moves the particle by exactly the time
      that passed — no every-other-frame stepping on 120 Hz screens. Plain
      scalars on purpose: allocating vectors here meant ~360k short-lived
      objects/s on a phone, and the GC pauses showed as hitches. */
  step(k: number) {
    const dx = this.target.x - this.pos.x;
    const dy = this.target.y - this.pos.y;
    const d = Math.hypot(dx, dy);
    // desired velocity: full speed, braking linearly inside closeEnoughTarget
    const speed = this.maxSpeed * (d < this.closeEnoughTarget ? d / this.closeEnoughTarget : 1);
    let sx = (d > 0 ? (dx / d) * speed : 0) - this.vel.x;
    let sy = (d > 0 ? (dy / d) * speed : 0) - this.vel.y;
    // Cap the steering force (don't force it to max): forcing it made every
    // particle overshoot and buzz around its letter.
    const sm = Math.hypot(sx, sy);
    if (sm > this.maxForce) {
      sx = (sx / sm) * this.maxForce;
      sy = (sy / sm) * this.maxForce;
    }
    this.vel.x += sx * k;
    this.vel.y += sy * k;
    this.pos.x += this.vel.x * k;
    this.pos.y += this.vel.y * k;

    const fade = this.fadeRate * k;
    if (this.isKilled) this.alpha = Math.max(this.alpha - fade, 0);
    else if (this.alpha < 1) this.alpha = Math.min(this.alpha + fade, 1);
  }

  /** Caller sets the fill colour once per frame; only alpha changes here. */
  draw(ctx: CanvasRenderingContext2D) {
    if (this.alpha <= 0) return;
    ctx.globalAlpha = this.alpha;
    ctx.fillRect(this.pos.x, this.pos.y, this.particleSize, this.particleSize);
  }

  /** Not needed by the next word: drift a little and fade out where it is
      (flying off to the canvas edges left a scattered cloud over the word). */
  kill() {
    if (this.isKilled) return;
    this.target.x = this.pos.x + (Math.random() - 0.5) * 60;
    this.target.y = this.pos.y + (Math.random() - 0.5) * 40;
    this.fadeRate = Math.max(this.fadeRate, 0.06);
    this.isKilled = true;
  }
}

export function initParticleText(canvas: HTMLCanvasElement, words: string[]) {
  const W = 1100;
  const H = 340;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const particles: Particle[] = [];
  // One particle every `pixelSteps` text pixels (~5k per word on desktop).
  // On phones this 1100px canvas is shown ~3x smaller, so sample sparser and
  // draw bigger dots there: same look, ~45% of the particles to move.
  const narrow = canvas.clientWidth > 0 && canvas.clientWidth < 700;
  const pixelSteps = narrow ? 26 : 12;
  const sizeBoost = narrow ? 1.8 : 1;
  let last = 0; // previous frame timestamp
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
  // CPU-backed: reading pixels back from a GPU canvas is slow on Safari
  const octx = off.getContext('2d', { willReadFrequently: true })!;

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

  const spawn = (t: Vec, spreadX: number, spreadY: number) => {
    const p = new Particle();
    p.pos.x = t.x + (Math.random() - 0.5) * spreadX;
    p.pos.y = t.y + (Math.random() - 0.5) * spreadY;
    p.target.x = t.x;
    p.target.y = t.y;
    // 6–15 px/step with short paths: every word reads in well under a second
    p.maxSpeed = Math.random() * 9 + 6;
    p.maxForce = p.maxSpeed * 0.05;
    p.particleSize = (Math.random() * 1.5 + 1.5) * sizeBoost;
    p.fadeRate = Math.random() * 0.06 + 0.08;
    particles.push(p);
  };

  /** Re-shape the particles into `word`. Particles and target points are
      both ordered left → right and paired proportionally, so each particle
      only travels to the matching part of the next word (short paths → the
      word reads clearly almost at once instead of crossing the whole canvas
      as a cloud). Spare particles fade out in place; missing ones appear on
      their letter. `first`: the opening word forms from scattered particles. */
  /** Rasterise `word` and sample its target points, left → right. */
  const sample = (word: string): Vec[] => {
    octx.clearRect(0, 0, W, H);
    const size = fitFont(word);
    octx.fillStyle = 'white';
    octx.font = FONT(size);
    octx.textAlign = 'left';
    octx.textBaseline = 'middle';
    octx.fillText(word, 8, H / 2);

    const pixels = octx.getImageData(0, 0, W, H).data;
    const targets: Vec[] = [];
    for (let i = 0; i < pixels.length; i += pixelSteps * 4) {
      if (pixels[i + 3] > 0) targets.push({ x: (i / 4) % W, y: Math.floor(i / 4 / W) });
    }
    return targets.sort((a, b) => a.x - b.x);
  };

  // Every word is sampled ahead of time (one per idle slot, while the intro
  // plays), so a word change never rasterises + reads pixels mid-animation —
  // that read cost a dropped frame or two right at each transition.
  const cache = new Map<string, Vec[]>();
  const targetsFor = (word: string) => {
    let t = cache.get(word);
    if (!t) cache.set(word, (t = sample(word)));
    return t;
  };
  // (Safari has no requestIdleCallback: space the samples out instead)
  const idle = (fn: () => void, i: number) =>
    'requestIdleCallback' in window
      ? window.requestIdleCallback(fn, { timeout: 1000 })
      : window.setTimeout(fn, 60 + i * 120);
  const warm = () => words.forEach((w, i) => idle(() => targetsFor(w), i));

  const setWord = (word: string, first = false) => {
    const targets = targetsFor(word);

    const alive = particles.filter((p) => !p.isKilled).sort((a, b) => a.pos.x - b.pos.x);
    const n = targets.length;
    const m = alive.length;
    // first word: particles converge from up to ±200px — a visible arrival
    // that still reads in ~0,5 s; later words travel short paths instead
    const spreadX = first ? 400 : 40;
    const spreadY = first ? 240 : 30;

    if (m >= n) {
      // more particles than points: spread the pick evenly, fade the rest
      let next = 0;
      for (let j = 0; j < m; j++) {
        const p = alive[j];
        if (next < n && j >= Math.floor((next * m) / n)) {
          p.target.x = targets[next].x;
          p.target.y = targets[next].y;
          next++;
        } else p.kill();
      }
    } else {
      // fewer particles than points: each takes an evenly spaced point, the
      // gaps between them are filled by new particles born on their letter
      const taken = new Uint8Array(n);
      for (let j = 0; j < m; j++) {
        const ti = Math.floor((j * n) / m);
        alive[j].target.x = targets[ti].x;
        alive[j].target.y = targets[ti].y;
        taken[ti] = 1;
      }
      for (let i = 0; i < n; i++) if (!taken[i]) spawn(targets[i], spreadX, spreadY);
    }
  };

  const tick = (now: number) => {
    // Fully clear every frame (no motion-blur trail) so no rectangular haze /
    // "container" ever builds up over the video — only the live particles show.
    ctx.clearRect(0, 0, W, H);

    // Move by the real time since the last frame (in 1/60 s units): smooth on
    // 120 Hz, same speed at 30 fps. Capped so a stall doesn't teleport dots.
    const k = (last ? Math.min(now - last, 50) : STEP_MS) / STEP_MS;
    last = now;

    ctx.fillStyle = WHITE;
    let keep = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.step(k);
      // drop fully-faded killed particles, or ones that drifted far off-canvas
      if (
        p.isKilled &&
        (p.alpha <= 0 || p.pos.x < -50 || p.pos.x > W + 50 || p.pos.y < -50 || p.pos.y > H + 50)
      ) {
        continue;
      }
      p.draw(ctx);
      particles[keep++] = p;
    }
    particles.length = keep; // in-place compaction (no O(n²) splices)
    ctx.globalAlpha = 1;

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
    last = 0; // and no catch-up for the time spent paused
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
    // start halfway through the gate's 0,7 s fade-out, so the particles'
    // arrival happens in view rather than behind the fading intro
    window.addEventListener('solvyx:intro-done', () => window.setTimeout(begin, 350), {
      once: true,
    });
    window.setTimeout(begin, 6000); // never leave the headline blank
  }

  // Sample with Clash Display, not the Arial fallback: warm the cache once the
  // font is ready. If it only arrives after the first word formed, drop the
  // Arial samples and re-shape the current word once (never when it was
  // already loaded — a needless re-shape scrambles a word that's settled).
  const FONT_SPEC = '700 200px "Clash Display"';
  if (document.fonts && 'load' in document.fonts && !document.fonts.check(FONT_SPEC)) {
    document.fonts.load(FONT_SPEC).then(() => {
      cache.clear();
      if (ready) setWord(words[wordIndex]);
      warm();
    });
  } else warm();

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
