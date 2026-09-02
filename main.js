// Mobile Menu Toggle
const burger = document.querySelector('.burger');
const overlay = document.querySelector('.overlay');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-sign-in');

function toggleMenu() {
    const isExpanded = burger.getAttribute('aria-expanded') === 'true';

    burger.setAttribute('aria-expanded', !isExpanded);
    overlay.hidden = isExpanded;
    mobileMenu.hidden = isExpanded;
    document.body.classList.toggle('menu-open', !isExpanded);
}

function closeMenu() {
    burger.setAttribute('aria-expanded', 'false');
    overlay.hidden = true;
    mobileMenu.hidden = true;
    document.body.classList.remove('menu-open');
}

burger?.addEventListener('click', toggleMenu);
overlay?.addEventListener('click', closeMenu);

mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        closeMenu();
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 720) {
        closeMenu();
    }
});

// Counter Animation
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function animateCounter(element, target, decimals, suffix, duration, startDelay) {
    const valueElement = element.querySelector('.stat-value');
    const suffixElement = element.querySelector('.stat-suffix');
    let startTime = null;

    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;

        if (elapsed < startDelay) {
            requestAnimationFrame(animate);
            return;
        }

        const progress = Math.min((elapsed - startDelay) / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const currentValue = easedProgress * target;

        valueElement.textContent = currentValue.toFixed(decimals);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            suffixElement.textContent = suffix;
        }
    }

    requestAnimationFrame(animate);
}

// Intersection Observer for Stats
const stats = document.querySelectorAll('.stat');
const statsObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                entry.target.dataset.animated = 'true';

                const target = parseFloat(entry.target.dataset.target);
                const suffix = entry.target.dataset.suffix;
                const decimals = parseInt(entry.target.dataset.decimals);
                const duration = 1500 + index * 80;
                const startDelay = 480 + index * 90;

                animateCounter(entry.target, target, decimals, suffix, duration, startDelay);
            }
        });
    },
    { threshold: 0.25 }
);

stats.forEach(stat => statsObserver.observe(stat));

// Prevent video right-click
const video = document.querySelector('.bg-video');
video?.addEventListener('contextmenu', (e) => e.preventDefault());
