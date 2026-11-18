/* Black Friday 2026 offer — single source for the /black-friday landing
   and the homepage banner. Edit here if anything changes.

   Margin logic: the discount is paid for by what we get back — a 50 %
   upfront payment (cash before the slow December), a commitment by 30 Nov
   (closes the pipeline fast), a capped number of slots (the discount can't
   eat the whole quarter) and a minimum project size (small jobs don't go
   out at a loss). */
export const blackFriday = {
  headline: '−20 % en tu proyecto de IA o web a medida',
  deadline: 'lunes 30 de noviembre',
  conditions:
    'Para proyectos desde 1.200 € (o $1,200 USD) confirmados con un 50 % por adelantado antes de esa fecha y que arranquen antes del 31 de enero. El anticipo se descuenta del total.',
  // Real limit: after each signed project, raise `slotsTaken` and redeploy.
  // At 10 the landing switches to "offer closed" and the banner disappears.
  slotsTotal: 10,
  slotsTaken: 0,
  // End of Monday 30 Nov, Madrid time. After this the landing shows the
  // closed state and the banner hides itself in the browser, even without
  // a redeploy.
  endsAt: '2026-12-01T00:00:00+01:00',
  href: '/black-friday/',
};

export const bfSlotsLeft = Math.max(0, blackFriday.slotsTotal - blackFriday.slotsTaken);

export const bfSlotsLabel =
  blackFriday.slotsTaken === 0
    ? `Solo ${blackFriday.slotsTotal} plazas`
    : `Quedan ${bfSlotsLeft} de ${blackFriday.slotsTotal} plazas`;

/** Closed at build time (sold out or past the deadline). */
export const bfClosedAtBuild = bfSlotsLeft === 0 || Date.now() >= Date.parse(blackFriday.endsAt);
