/* Scroll-driven 3D fan carousel for the Work section — vanilla port of the
   card-stack idea. The active card is driven by scroll progress through a tall,
   pinned track (GSAP-style scrub, no library). Desktop + motion only; on mobile
   or reduced-motion the static grid fallback is shown instead. */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lg = window.matchMedia('(min-width: 1024px)');

const track = document.getElementById('work-track');
const stage = document.getElementById('work-fan');
const grid = document.getElementById('work-grid');
const dotsWrap = document.getElementById('work-dots');

if (track && stage && !reduce) {
  const cards = Array.from(stage.querySelectorAll<HTMLElement>('.work-card'));
  const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll<HTMLButtonElement>('button')) : [];
  const N = cards.length;

  // Fan geometry
  const overlap = 0.46;
  const spreadDeg = 40;
  const maxOffset = 2;
  const stepDeg = spreadDeg / maxOffset;
  const depthPx = 130;
  const tiltXDeg = 11;
  const activeScale = 1.05;
  const inactiveScale = 0.9;
  const activeLiftPx = 18;

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  let W = 440;
  let spacing = 240;
  let raf = 0;
  let enabled = false;

  const sizeCards = () => {
    const sw = stage.clientWidth || 1000;
    W = Math.round(clamp(sw * 0.42, 260, 460));
    const H = Math.round(W * 0.66);
    spacing = W * (1 - overlap);
    cards.forEach((c) => {
      c.style.width = `${W}px`;
      c.style.height = `${H}px`;
    });
    stage.style.height = `${H + 70}px`;
  };

  const layout = () => {
    raf = 0;
    const rect = track.getBoundingClientRect();
    const scrollable = track.offsetHeight - window.innerHeight;
    const progress = clamp(-rect.top / Math.max(1, scrollable), 0, 1);
    const activeFloat = progress * (N - 1);

    cards.forEach((c, i) => {
      const off = i - activeFloat;
      const abs = Math.abs(off);
      const t = clamp(1 - abs, 0, 1); // 1 at center, 0 once a full step away
      const x = off * spacing;
      const y = abs * 8 - activeLiftPx * t;
      const z = -abs * depthPx;
      const rotateZ = off * stepDeg;
      const rotateX = tiltXDeg * (1 - t);
      const scale = inactiveScale + (activeScale - inactiveScale) * t;
      c.style.transform = `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) translateZ(${z}px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${scale})`;
      c.style.opacity = abs > maxOffset + 0.6 ? '0' : '1';
      c.style.zIndex = String(Math.round(100 - abs * 10));
    });

    const activeIdx = clamp(Math.round(activeFloat), 0, N - 1);
    dots.forEach((d, i) => d.setAttribute('aria-current', i === activeIdx ? 'true' : 'false'));
  };

  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(layout);
  };
  const onResize = () => {
    sizeCards();
    layout();
  };

  const enable = () => {
    if (enabled) return;
    enabled = true;
    grid?.classList.add('hidden');
    track.classList.remove('hidden');
    sizeCards();
    layout();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
  };
  const disable = () => {
    if (!enabled) return;
    enabled = false;
    grid?.classList.remove('hidden');
    track.classList.add('hidden');
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
  };

  const apply = () => (lg.matches ? enable() : disable());
  apply();
  lg.addEventListener('change', apply);

  // Dots → scroll to that card
  dots.forEach((d, i) => {
    d.addEventListener('click', () => {
      const rectTop = track.getBoundingClientRect().top + window.scrollY;
      const scrollable = track.offsetHeight - window.innerHeight;
      window.scrollTo({ top: rectTop + (i / (N - 1)) * scrollable, behavior: 'smooth' });
    });
  });
}

/* Mobile swipe carousel: sync the position dots with horizontal scroll and
   let dots scroll to a card. Independent of the desktop fan above so it works
   on every viewport that shows the carousel (lg just hides the dots). */
const carousel = document.querySelector<HTMLElement>('.work-carousel');
const mdotsWrap = document.getElementById('work-mobile-dots');
if (carousel && mdotsWrap) {
  const items = Array.from(carousel.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.tagName === 'ARTICLE'
  );
  const mdots = Array.from(mdotsWrap.querySelectorAll<HTMLButtonElement>('button'));
  let raf = 0;

  const update = () => {
    raf = 0;
    const center = carousel.scrollLeft + carousel.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    items.forEach((el, i) => {
      const c = el.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(c - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    mdots.forEach((d, i) => d.setAttribute('aria-current', i === best ? 'true' : 'false'));
  };

  carousel.addEventListener(
    'scroll',
    () => {
      if (!raf) raf = requestAnimationFrame(update);
    },
    { passive: true }
  );

  mdots.forEach((d, i) => {
    d.addEventListener('click', () => {
      const el = items[i];
      if (!el) return;
      carousel.scrollTo({
        left: el.offsetLeft - (carousel.clientWidth - el.offsetWidth) / 2,
        behavior: 'smooth',
      });
    });
  });
}
