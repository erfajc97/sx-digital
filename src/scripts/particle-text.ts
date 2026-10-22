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
const STEP_MS = 1000 / 60; // physics is tuned per 60 Hz step

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
    // Cap the steering force (don't force it to max): forcing it made every
    // particle overshoot and buzz around its letter, so words took ~1 s to
    // settle into something readable.
    if (sm > this.maxForce) {
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

  /** One 60 Hz simulation step: steer toward the target and fade in/out. */
  step() {
    this.move();
    const targetA = this.isKilled ? 0 : 1;
    if (this.alpha < targetA) this.alpha = Math.min(this.alpha + this.fadeRate, 1);
    else if (this.alpha > targetA) this.alpha = Math.max(this.alpha - this.fadeRate, 0);
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
  let pending = 0; // simulation steps owed to real time
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
      their letter. `first`: the opening word appears already formed. */
  const setWord = (word: string, first = false) => {
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
    targets.sort((a, b) => a.x - b.x);

    const alive = particles.filter((p) => !p.isKilled).sort((a, b) => a.pos.x - b.pos.x);
    const n = targets.length;
    const m = alive.length;
    const spreadX = first ? 12 : 40;
    const spreadY = first ? 8 : 30;

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

    // Advance the simulation by real elapsed time (in 60 Hz steps), so a phone
    // that drops to 30 fps still forms the word in the same time, and a 120 Hz
    // screen doesn't run it twice as fast. Cap the catch-up so a slow device
    // skips ahead instead of spiralling.
    pending += (last ? Math.min(now - last, 100) : STEP_MS) / STEP_MS;
    last = now;
    let steps = 0;
    while (pending >= 1 && steps < 4) {
      pending -= 1;
      steps++;
    }
    if (steps === 4) pending = 0;

    ctx.fillStyle = WHITE;
    let keep = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      for (let s = 0; s < steps; s++) p.step();
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
    pending = 0;
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

  // Re-sample the current word only if Clash Display arrives AFTER the word
  // was formed in the Arial fallback. Never when it's already loaded: a
  // re-sample reshuffles every particle to a random spot on another letter,
  // which made the first word take ~1,4 s to read instead of settling at once.
  const FONT_SPEC = '700 200px "Clash Display"';
  if (document.fonts && 'load' in document.fonts && !document.fonts.check(FONT_SPEC)) {
    document.fonts.load(FONT_SPEC).then(() => ready && setWord(words[wordIndex]));
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
