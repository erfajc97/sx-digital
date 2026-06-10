/* Services gallery — scroll-driven slideshow.
   Desktop (+motion): the section pins and, as you scroll, the service cards
   appear ONE BY ONE (each rises/fades in as the previous leaves) until the
   last one is shown, then the pin releases and you continue to the next
   section. Mobile / reduced-motion: native horizontal swipe (scroll-snap).
   Gated by gsap.matchMedia(). */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

const gallery = document.getElementById('svc-gallery');
const track = document.getElementById('svc-track');

if (gallery && track) {
  const mm = gsap.matchMedia();

  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.registerPlugin(ScrollTrigger);

    const cards = gsap.utils.toArray<HTMLElement>('.svc-card');
    const dots = gsap.utils.toArray<HTMLElement>('.svc-dot');
    const spacer = track.querySelector<HTMLElement>('.svc-spacer');
    if (spacer) spacer.style.display = 'none';

    // Pinned full-screen stage; stack every card dead-centre.
    gallery.classList.add('svc-gallery--pinned');
    track.classList.remove('overflow-x-auto', 'snap-x', 'snap-mandatory');
    track.style.display = 'contents'; // let the cards position against the gallery

    gsap.set(cards, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      xPercent: -50,
      yPercent: -50,
      autoAlpha: 0,
      y: 70,
      scale: 0.94,
    });
    gsap.set(cards[0], { autoAlpha: 1, y: 0, scale: 1 });

    const setActiveDot = (idx: number) =>
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    setActiveDot(0);

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: gallery,
        pin: true,
        start: 'top top',
        end: () => '+=' + (cards.length - 1) * window.innerHeight * 0.85,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => setActiveDot(Math.round(self.progress * (cards.length - 1))),
      },
    });

    for (let i = 1; i < cards.length; i++) {
      tl.to(cards[i - 1], { autoAlpha: 0, y: -60, scale: 0.92, duration: 1 });
      tl.fromTo(
        cards[i],
        { autoAlpha: 0, y: 70, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1 },
        '<0.15'
      );
    }

    return () => {
      gallery.classList.remove('svc-gallery--pinned');
      track.classList.add('overflow-x-auto', 'snap-x', 'snap-mandatory');
      track.style.removeProperty('display');
      if (spacer) spacer.style.removeProperty('display');
      gsap.set(cards, { clearProps: 'all' });
      dots.forEach((d) => d.classList.remove('is-active'));
    };
  });
}
