(() => {
  function initContactFinal() {
    const root = document.getElementById('contact');
    if (!root) return;

    const toast = root.querySelector('.contact-toast');
    const copyBtns = Array.from(root.querySelectorAll('[data-copy]'));
    const form = root.querySelector('#contactForm');
    if (copyBtns.length === 0) return;

    let toastTimer = 0;
    function showToast(text) {
      if (!toast) return;
      toast.textContent = text;
      toast.classList.add('show');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1600);
    }

    copyBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const value = btn.getAttribute('data-copy') || '';
        if (!value) return;

        try {
          await navigator.clipboard.writeText(value);
          showToast('Copied email');
        } catch {
          // Fallback for older browsers
          const ta = document.createElement('textarea');
          ta.value = value;
          ta.setAttribute('readonly', '');
          ta.style.position = 'absolute';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showToast('Copied email');
        }
      });
    });

    // Form submits via Formspree (HTML action/method). We only show a tiny UX hint.
    if (form) {
      form.addEventListener('submit', () => {
        showToast('Sending...');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initContactFinal);
})();
