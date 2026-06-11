/* Services — "View-Master" reel, desktop AND mobile.
   The section pins and a circular reel of media frames rotates tied to the
   native scroll (scrub — the finger/wheel stays in control, no hijacking).
   The frame reaching the viewer slot grows into focus while the informative
   text cross-fades to match. Desktop: text left, wheel right, viewer at the
   wheel's left. Mobile: text top, wheel below, viewer at the wheel's top.
   Reduced-motion (any size): the reel is hidden by CSS and a plain swipe
   carousel is shown instead. */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

const reel = document.getElementById('svc-reel');

if (reel) {
  const mm = gsap.matchMedia();

  const buildReel = (RADIUS: number, VIEWER: number, perStep: number, scaleSpan: number) => {
    gsap.registerPlugin(ScrollTrigger);

    const frames = gsap.utils.toArray<HTMLElement>('.reel-frame');
    const texts = gsap.utils.toArray<HTMLElement>('.reel-text');
    const N = frames.length;
    const STEP = 360 / N;
    let active = -1;

    // Position every frame around the circle for a given rotation offset.
    const layout = (offset: number) => {
      frames.forEach((f, i) => {
        const angle = VIEWER + i * STEP + offset;
        // angular distance from the viewer slot (0..180)
        const d = Math.abs(((((angle - VIEWER) % 360) + 540) % 360) - 180);
        const t = 1 - Math.min(d, 140) / 140; // 1 at viewer → 0 far away
        const scale = 0.6 + t * scaleSpan; // 0.6 … (0.6 + span)
        f.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateX(${RADIUS}px) rotate(${-angle}deg) scale(${scale})`;
        f.style.opacity = (0.25 + t * 0.75).toFixed(3);
        f.style.zIndex = String(Math.round(t * 100));
      });
    };

    const setText = (idx: number) => {
      if (idx === active) return;
      active = idx;
      texts.forEach((tx, i) =>
        gsap.to(tx, { autoAlpha: i === idx ? 1 : 0, duration: 0.4, ease: 'power2.out' })
      );
    };

    layout(0);
    setText(0);

    ScrollTrigger.create({
      trigger: reel,
      pin: true,
      start: 'top top',
      end: () => '+=' + (N - 1) * window.innerHeight * perStep,
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
  };

  // Desktop: wheel on the right, viewer slot on its LEFT (angle 180°).
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () =>
    buildReel(210, 180, 0.7, 0.62)
  );

  // Mobile/tablet: wheel below the text, viewer slot at the TOP (angle 270°).
  // Smaller radius + gentler focus scale so the orbit fits a phone viewport
  // and the top frame never climbs into the text/chips above.
  mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () =>
    buildReel(112, 270, 0.55, 0.5)
  );
}
