/* Services section — GSAP entrance + icon micro-interactions.
   Replaces the generic CSS scroll-reveal with a characterful staggered rise
   (slight overshoot), icons that pop in, and a hover bounce on each icon.
   Fully gated by prefers-reduced-motion via gsap.matchMedia(). */
import gsap from 'gsap';

const section = document.getElementById('servicios');

if (section) {
  const cards = gsap.utils.toArray<HTMLElement>('[data-svc-card]');
  const icons = gsap.utils.toArray<HTMLElement>('[data-svc-icon]');
  const mm = gsap.matchMedia();

  // Motion path: hide → animate in on scroll-into-view, plus hover delight.
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.set(cards, { autoAlpha: 0, y: 50, scale: 0.95 });
    gsap.set(icons, { scale: 0, rotation: -45 });

    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      const tl = gsap.timeline();
      tl.to(cards, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.75,
        ease: 'back.out(1.4)',
        stagger: { each: 0.09, from: 'start' },
      }).to(
        icons,
        {
          scale: 1,
          rotation: 0,
          duration: 0.55,
          ease: 'back.out(2.2)',
          stagger: { each: 0.09, from: 'start' },
        },
        '-=0.55'
      );
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            play();
            io.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(section);

    // Hover bounce on the icon (fine pointers only — touch keeps it calm).
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      cards.forEach((card) => {
        const icon = card.querySelector<HTMLElement>('[data-svc-icon]');
        if (!icon) return;
        card.addEventListener('pointerenter', () =>
          gsap.to(icon, { scale: 1.12, rotation: 8, duration: 0.4, ease: 'back.out(3)' })
        );
        card.addEventListener('pointerleave', () =>
          gsap.to(icon, { scale: 1, rotation: 0, duration: 0.4, ease: 'power2.out' })
        );
      });
    }

    // Cleanup if the query stops matching (e.g. user enables reduced motion).
    return () => {
      gsap.set([...cards, ...icons], { clearProps: 'all' });
    };
  });
}
