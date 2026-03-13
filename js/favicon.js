(() => {
  // Generate a crisp "HMW7" PNG favicon at runtime for browsers/platforms that
  // don't use SVG favicons for taskbar/pinned icons.
  function setFaviconPng(text) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#0b0c0e');
    grad.addColorStop(1, '#14161a');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, size, size, 28);
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 2;
    roundRect(ctx, 10, 10, size - 20, size - 20, 24);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 44px system-ui, -apple-system, Segoe UI, Arial, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillText(text, size / 2, size / 2 + 4);

    const href = canvas.toDataURL('image/png');

    let link = document.querySelector('link[rel="icon"][type="image/png"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      document.head.appendChild(link);
    }
    link.href = href;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  document.addEventListener('DOMContentLoaded', () => setFaviconPng('HMW7'));
})();

