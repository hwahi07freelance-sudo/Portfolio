(() => {
  function initFooter() {
    const y = document.querySelectorAll('[data-footer-year]');
    if (!y || y.length === 0) return;
    const year = String(new Date().getFullYear());
    y.forEach((el) => (el.textContent = year));
  }

  document.addEventListener('DOMContentLoaded', initFooter);
})();

