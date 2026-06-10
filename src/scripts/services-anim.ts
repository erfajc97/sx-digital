/* Services section — GSAP. A dramatic 3D entrance (cards unfold into place),
   cursor-following magnetic 3D tilt, depth lift on hover, and icon pops.
   Fully gated by prefers-reduced-motion via gsap.matchMedia(). */
import gsap from 'gsap';

const section = document.getElementById('servicios');

if (section) {
  const cards = gsap.utils.toArray<HTMLElement>('[data-svc-card]');
  const icons = gsap.utils.toArray<HTMLElement>('[data-svc-icon]');
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // Hidden + folded back in 3D before reveal.
    gsap.set(cards, { transformPerspective: 1000, transformOrigin: 'center' });
    gsap.set(cards, { autoAlpha: 0, y: 80, rotationX: -45, scale: 0.9 });
    gsap.set(icons, { autoAlpha: 0, scale: 0, rotation: -60 });

    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      gsap
        .timeline()
        .to(cards, {
          autoAlpha: 1,
          y: 0,
          rotationX: 0,
          scale: 1,
          duration: 0.95,
          ease: 'expo.out',
          stagger: { each: 0.1, from: 'center', grid: 'auto' },
        })
        .to(
          icons,
          {
            autoAlpha: 1,
            scale: 1,
            rotation: 0,
            duration: 0.6,
            ease: 'back.out(2.5)',
            stagger: { each: 0.08, from: 'center' },
          },
          '-=0.6'
        );
    };

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (play(), io.disconnect())),
      { threshold: 0.15 }
    );
    io.observe(section);

    // Magnetic cursor-following 3D tilt + depth lift (fine pointers only).
    const cleanups: Array<() => void> = [];
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const MAX = 9; // deg
      cards.forEach((card) => {
        const rotX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
        const rotY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
        const icon = card.querySelector<HTMLElement>('[data-svc-icon]');
        let rect: DOMRect | null = null;

        const onEnter = () => {
          rect = card.getBoundingClientRect();
          gsap.to(card, { y: -8, z: 40, duration: 0.4, ease: 'power3.out' });
          if (icon) gsap.to(icon, { scale: 1.12, duration: 0.4, ease: 'back.out(3)' });
        };
        const onMove = (e: PointerEvent) => {
          if (!rect) rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          rotY(px * MAX);
          rotX(-py * MAX);
        };
        const onLeave = () => {
          rect = null;
          rotX(0);
          rotY(0);
          gsap.to(card, { y: 0, z: 0, duration: 0.5, ease: 'power3.out' });
          if (icon) gsap.to(icon, { scale: 1, duration: 0.4, ease: 'power2.out' });
        };

        card.addEventListener('pointerenter', onEnter);
        card.addEventListener('pointermove', onMove);
        card.addEventListener('pointerleave', onLeave);
        cleanups.push(() => {
          card.removeEventListener('pointerenter', onEnter);
          card.removeEventListener('pointermove', onMove);
          card.removeEventListener('pointerleave', onLeave);
        });
      });
    }

    return () => {
      cleanups.forEach((fn) => fn());
      gsap.set([...cards, ...icons], { clearProps: 'all' });
    };
  });
}
