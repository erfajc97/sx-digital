/* Services gallery — scroll-driven "product card" showcase.
   Desktop (+motion): the section pins and the row of cards scrolls
   horizontally as you scroll vertically (containerAnimation), with a progress
   bar and parallax on each card's artwork. Mobile / reduced-motion: native
   horizontal swipe (scroll-snap). Gated by gsap.matchMedia(). */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

const gallery = document.getElementById('svc-gallery');
const track = document.getElementById('svc-track');

if (gallery && track) {
  const mm = gsap.matchMedia();

  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.registerPlugin(ScrollTrigger);

    // Swap from native swipe to pinned/horizontal layout.
    gallery.classList.add('svc-gallery--pinned');
    track.classList.remove('overflow-x-auto', 'snap-x', 'snap-mandatory');
    track.classList.add('svc-track--static');

    const progress = document.getElementById('svc-progress');
    const getDist = () => Math.max(0, track.scrollWidth - window.innerWidth);

    // Vertical scroll → horizontal travel (ease "none" is required).
    const tween = gsap.to(track, {
      x: () => -getDist(),
      ease: 'none',
      scrollTrigger: {
        trigger: gallery,
        pin: true,
        start: 'top top',
        end: () => '+=' + getDist(),
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => progress && gsap.set(progress, { scaleX: self.progress }),
      },
    });

    // Parallax the big watermark icon inside each card as it crosses the view.
    gsap.utils.toArray<HTMLElement>('.svc-card').forEach((card) => {
      const art = card.querySelector<HTMLElement>('.svc-art');
      if (!art) return;
      gsap.fromTo(
        art,
        { xPercent: 14 },
        {
          xPercent: -14,
          ease: 'none',
          scrollTrigger: {
            containerAnimation: tween,
            trigger: card,
            start: 'left right',
            end: 'right left',
            scrub: true,
          },
        }
      );
    });

    return () => {
      gallery.classList.remove('svc-gallery--pinned');
      track.classList.add('overflow-x-auto', 'snap-x', 'snap-mandatory');
      track.classList.remove('svc-track--static');
      gsap.set(track, { clearProps: 'x' });
    };
  });
}
