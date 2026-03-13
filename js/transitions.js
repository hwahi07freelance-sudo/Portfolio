/**
 * Reveal System
 * .reveal and .reveal-load elements
 * Default: animate once
 * With .reveal-recurring: animate every time it enters view
 */
function initScrollReveal() {
    const allRevealElements = document.querySelectorAll('.reveal, .reveal-load');

    const observerOptions = {
        threshold: 0.12, // Trigger when 12% is visible
        rootMargin: '0px 0px -20px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const isRecurring = entry.target.classList.contains('reveal-recurring');

            if (entry.isIntersecting) {
                // Add class with a tiny delay to ensure smooth hardware acceleration
                requestAnimationFrame(() => {
                    entry.target.classList.add('reveal-visible');
                });

                // If not recurring, stop observing after it's shown once
                if (!isRecurring) {
                    observer.unobserve(entry.target);
                }
            } else {
                // For recurring elements, remove the class when it leaves the viewport
                if (isRecurring) {
                    entry.target.classList.remove('reveal-visible');
                }
            }
        });
    }, observerOptions);

    allRevealElements.forEach(el => {
        observer.observe(el);
    });
}

// Global exposure for dynamic content
window.initScrollReveal = initScrollReveal;

document.addEventListener('DOMContentLoaded', initScrollReveal);
