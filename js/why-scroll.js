(() => {
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initWhyChooseMe() {
    const root = document.querySelector('[data-why2]');
    if (!root) return;

    const cards = Array.from(root.querySelectorAll('[data-why2-card]'));
    if (cards.length === 0) return;

    const stepsWrap = document.querySelector('[data-why2-steps]');
    const stepBtns = stepsWrap ? Array.from(stepsWrap.querySelectorAll('[data-why2-step]')) : [];
    const section = document.getElementById('why-choose-me');

    function setActive(index) {
      const i = clamp(index, 0, cards.length - 1);
      cards.forEach((c, idx) => c.classList.toggle('is-active', idx === i));
      stepBtns.forEach((b, idx) => b.classList.toggle('is-active', idx === i));

      if (section) {
        const denom = Math.max(1, cards.length - 1);
        section.style.setProperty('--why2-progress', String(i / denom));
      }
    }

    // Only change state on hover/focus of the pills (no scroll-based changes).
    stepBtns.forEach((btn) => {
      const idx = Number(btn.getAttribute('data-why2-step') || '0');

      btn.addEventListener('mouseenter', () => setActive(idx));
      btn.addEventListener('focusin', () => setActive(idx));

      // Optional: clicking can scroll to the related card without changing any other behavior.
      btn.addEventListener('click', () => {
        const card = cards[clamp(idx, 0, cards.length - 1)];
        if (!card) return;
        card.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
      });
    });

    // Also allow hovering/focusing the cards to update the pills/progress.
    cards.forEach((card, idx) => {
      card.addEventListener('mouseenter', () => setActive(idx));
      card.addEventListener('focusin', () => setActive(idx));
    });

    // Default selection (does not auto-change while scrolling).
    setActive(0);
  }

  document.addEventListener('DOMContentLoaded', initWhyChooseMe);
})();
