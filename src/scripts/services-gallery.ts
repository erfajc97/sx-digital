/* Services — "View-Master" reel. Desktop (+motion): the section pins and a
   circular reel of media frames rotates as you scroll; the frame reaching the
   viewer position (left, next to the text) grows into focus while the
   informative text on the left cross-fades to match. Mobile / reduced-motion:
   native swipe carousel. Gated by gsap.matchMedia(). */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

const reel = document.getElementById('svc-reel');

if (reel) {
  const mm = gsap.matchMedia();

  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.registerPlugin(ScrollTrigger);

    const frames = gsap.utils.toArray<HTMLElement>('.reel-frame');
    const texts = gsap.utils.toArray<HTMLElement>('.reel-text');
    const N = frames.length;
    const STEP = 360 / N;
    const RADIUS = 210; // orbit radius (px)
    const VIEWER = 180; // active angle — left of the wheel, toward the text
    let active = -1;

    // Position every frame around the circle for a given rotation offset.
    const layout = (offset: number) => {
      frames.forEach((f, i) => {
        const angle = VIEWER + i * STEP + offset;
        // angular distance from the viewer slot (0..180)
        const d = Math.abs((((angle - VIEWER) % 360) + 540) % 360 - 180);
        const t = 1 - Math.min(d, 140) / 140; // 1 at viewer → 0 far away
        const scale = 0.6 + t * 0.62; // 0.6 … 1.22
        f.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateX(${RADIUS}px) rotate(${-angle}deg) scale(${scale})`;
        f.style.opacity = (0.25 + t * 0.75).toFixed(3);
        f.style.zIndex = String(Math.round(t * 100));
      });
    };

    const setText = (idx: number) => {
      if (idx === active) return;
      active = idx;
      texts.forEach((tx, i) => gsap.to(tx, { autoAlpha: i === idx ? 1 : 0, duration: 0.4, ease: 'power2.out' }));
    };

    layout(0);
    setText(0);

    ScrollTrigger.create({
      trigger: reel,
      pin: true,
      start: 'top top',
      end: () => '+=' + (N - 1) * window.innerHeight * 0.7,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        layout(-self.progress * (N - 1) * STEP);
        setText(Math.round(self.progress * (N - 1)));
      },
    });

    return () => {
      frames.forEach((f) => {
        f.style.removeProperty('transform');
        f.style.removeProperty('opacity');
        f.style.removeProperty('z-index');
      });
      gsap.set(texts, { clearProps: 'all' });
    };
  });
}
