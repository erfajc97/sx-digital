/* v2 progressive enhancements — all dependency-free, transform/opacity only,
   reduced-motion safe, deferred so they never compete with hero LCP.
   - count-up on [data-countup] (final value already in the DOM, crawlable)
   - pointer 3D tilt on [data-tilt] (hover + fine pointer only)
   - lazy-attach + autoplay the hero <video> (poster is the LCP fallback) */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = Boolean(
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
);

/* -------------------------------------------------- count-up ----------- */
function initCountUp() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-countup]'));
  if (!els.length || prefersReduced) return; // final value stays in the DOM

  const parse = (raw: string) => {
    const m = raw.match(/^(\D*)([\d.,]+)(.*)$/);
    if (!m) return null;
    const [, prefix, numStr, suffix] = m;
    const target = parseFloat(numStr.replace(/,/g, ''));
    if (Number.isNaN(target)) return null;
    const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
    const grouping = numStr.includes(',') || target >= 1000;
    return { prefix, suffix, target, decimals, grouping, raw };
  };

  const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

  const run = (el: HTMLElement) => {
    const info = parse((el.dataset.countup || el.textContent || '').trim());
    if (!info) return;
    const fmt = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
      useGrouping: info.grouping,
    });
    const duration = 900;
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const p = Math.min((now - start) / duration, 1);
      const val = info.target * easeOutQuart(p);
      el.textContent = info.prefix + fmt.format(val) + info.suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = info.raw; // snap to the exact original string
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          run(e.target as HTMLElement);
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  els.forEach((el) => io.observe(el));
}

/* -------------------------------------------------- pointer tilt ------- */
function initTilt() {
  if (prefersReduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const MAX = 4; // degrees — subtle depth, not a toy

  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    let rect: DOMRect | null = null;
    let raf = 0;
    let lastX = 0;
    let lastY = 0;

    const write = () => {
      raf = 0;
      if (!rect) return;
      const px = (lastX - rect.left) / rect.width - 0.5;
      const py = (lastY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--tx', `${(px * MAX).toFixed(2)}deg`);
      el.style.setProperty('--ty', `${(-py * MAX).toFixed(2)}deg`);
    };

    el.addEventListener('pointerenter', () => {
      rect = el.getBoundingClientRect();
      el.style.willChange = 'transform';
    });
    el.addEventListener('pointermove', (ev) => {
      lastX = ev.clientX;
      lastY = ev.clientY;
      if (!raf) raf = requestAnimationFrame(write);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--tx', '0deg');
      el.style.setProperty('--ty', '0deg');
      el.style.willChange = 'auto';
      rect = null;
    });
  });
}

/* -------------------------------------------------- spotlight ---------- */
function initSpotlight() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((el) => {
    let rect: DOMRect | null = null;
    let raf = 0;
    let x = 0;
    let y = 0;

    const write = () => {
      raf = 0;
      if (!rect) return;
      el.style.setProperty('--mx', `${((x - rect.left) / rect.width) * 100}%`);
      el.style.setProperty('--my', `${((y - rect.top) / rect.height) * 100}%`);
    };

    el.addEventListener('pointerenter', () => (rect = el.getBoundingClientRect()));
    el.addEventListener('pointermove', (ev) => {
      x = ev.clientX;
      y = ev.clientY;
      if (!raf) raf = requestAnimationFrame(write);
    });
    el.addEventListener('pointerleave', () => (rect = null));
  });
}

/* -------------------------------------------------- hero video --------- */
function initHeroVideo() {
  const video = document.querySelector<HTMLVideoElement>('.hero-video');
  if (!video || prefersReduced || saveData) return; // poster stays as the fallback

  const attach = () => {
    video.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach((s) => {
      if (!s.src) s.src = s.dataset.src || '';
    });
    video.load();
    video.play().catch(() => {
      /* autoplay blocked — poster remains */
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          attach();
          io.disconnect();
        }
      });
    },
    { rootMargin: '200px' }
  );
  io.observe(video);
}

/* -------------------------------------------------- boot --------------- */
function boot() {
  initHeroVideo(); // attach early-ish; still gated + lazy
  const idle =
    (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ||
    ((cb: () => void) => window.setTimeout(cb, 200));
  idle(() => {
    initCountUp();
    initTilt();
    initSpotlight();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
