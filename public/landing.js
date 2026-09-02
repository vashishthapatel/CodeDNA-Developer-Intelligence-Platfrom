// API Configuration — auto-switches: localhost for npm run dev, Worker for pages.dev
const API_BASE = location.hostname.includes('pages.dev') ? 'https://code-dna.vashishthapatel2005.workers.dev/api/v1' : 'http://localhost:8080/api/v1';

// Keys used for the GitHub connection. The token is held in this browser only —
// it is sent to api.github.com, and to the CodeDNA backend when one is running.
const GH_TOKEN_KEY = 'gh_token';
const GH_USER_KEY = 'gh_user';
const GH_CONNECTED_AT_KEY = 'gh_connected_at';

// OAuth — public client id only; the secret never leaves the backend.
const GITHUB_OAUTH_CLIENT_ID = 'Ov23liozfUubDI7kfWVD';
const GITHUB_OAUTH_REDIRECT  = location.hostname.includes('pages.dev') ? 'https://codedna-developer-intelligence-platfrom.pages.dev/auth-callback.html' : 'http://localhost:5173/auth-callback.html';
const GITHUB_OAUTH_SCOPE     = 'repo,read:user,read:org';

// State
let githubUser = null;

// Tells the stylesheet that scroll-reveal is live. Without it every
// `[data-reveal]` element stays fully visible, so the page survives no-JS.
// Sticky header elevation on scroll
function initHeaderScroll() {
  const headerEl = document.querySelector('.header');
  if (!headerEl) return;
  const onScroll = () => headerEl.classList.toggle('is-scrolled', (window.scrollY || document.documentElement.scrollTop) > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeaderScroll);
} else {
  initHeaderScroll();
}

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

// Stats and reveal are static — no IntersectionObserver / RAF.

// Modal Functions — OAuth-only (PAT card removed)
const githubModal = document.getElementById('githubModal');
const githubStatus = document.getElementById('githubStatus');
const githubConnected = document.getElementById('githubConnected');
const githubConnectGrid = document.getElementById('githubConnectGrid');
const githubScopesNote = document.querySelector('.gh-scopes-note');
const ghOauthBtn = document.getElementById('ghOauthBtn');

function showGithubModal() {
    if (!githubModal) return;
    githubModal.hidden = false;
    githubModal.removeAttribute('hidden');
    document.body.classList.add('menu-open');
    setStatus('');

    if (githubUser) {
        renderConnected(githubUser);
    } else {
        if (githubConnectGrid) githubConnectGrid.hidden = false;
        if (githubScopesNote) githubScopesNote.hidden = false;
        githubConnected.hidden = true;
    }
}

function closeModal() {
    if (!githubModal) return;
    githubModal.hidden = true;
    document.body.classList.remove('menu-open');
}

/**
 * @param {string} message
 * @param {'error'|'ok'|'busy'|''} kind
 */
function setStatus(message, kind = '') {
    if (!githubStatus) return;
    githubStatus.textContent = message;
    githubStatus.className = kind ? `form-status is-${kind}` : 'form-status';
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', closeModal);
});

document.getElementById('githubModalClose')?.addEventListener('click', closeModal);

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

/** Paint the connected panel. Does not redirect. */
function renderConnected(profile) {
    const avatar = document.getElementById('githubAvatar');
    avatar.src = profile.avatarUrl;
    avatar.alt = `${profile.login} on GitHub`;
    document.getElementById('githubHandle').textContent = profile.name;

    const parts = [`@${profile.login}`, `${profile.repoCount} repositories`];
    if (profile.privateRepos) parts.push(`${profile.privateRepos} private`);
    document.getElementById('githubMeta').textContent = parts.join(' · ');

    if (githubConnectGrid) githubConnectGrid.hidden = true;
    if (githubScopesNote) githubScopesNote.hidden = true;
    githubConnected.hidden = false;
}

function disconnectGithub() {
    localStorage.removeItem(GH_TOKEN_KEY);
    localStorage.removeItem(GH_USER_KEY);
    localStorage.removeItem(GH_CONNECTED_AT_KEY);
    githubUser = null;
    if (githubConnectGrid) githubConnectGrid.hidden = false;
    if (githubScopesNote) githubScopesNote.hidden = false;
    githubConnected.hidden = true;
    setStatus('Disconnected. The GitHub connection was removed from this browser.', 'ok');
    updateConnectButtons();
}

document.getElementById('githubForget')?.addEventListener('click', disconnectGithub);

/** Reflect the connection in the two nav CTAs. */
function updateConnectButtons() {
    const label = githubUser ? `@${githubUser.login}` : 'Connect with GitHub';
    document.querySelectorAll('#connectGithubBtn, #mobileConnectGithubBtn').forEach(btn => {
        const span = btn.querySelector('.connect-gh-label');
        if (span) span.textContent = label;
        btn.setAttribute('aria-label', githubUser ? `GitHub connected as ${githubUser.login}` : 'Connect with GitHub');
        btn.classList.toggle('is-connected', !!githubUser);
    });
}

// -- OAuth helpers: backend authorize URL, direct GitHub fallback --------------
async function fetchAuthorizeUrlFromBackend() {
    const bases = [API_BASE, 'http://localhost:8081/api/v1'];
    for (const base of bases) {
        try {
            const r = await fetch(base + '/auth/github/authorize', { headers: { 'Accept': 'application/json' } });
            if (!r.ok) continue;
            const j = await r.json().catch(() => ({}));
            const url = j.url || j.authorizeUrl || j.authorize_url;
            if (url) return url;
        } catch {}
    }
    return null;
}

function buildDirectAuthorizeUrl() {
    if (!GITHUB_OAUTH_CLIENT_ID) return null;
    const u = new URL('https://github.com/login/oauth/authorize');
    u.searchParams.set('client_id', GITHUB_OAUTH_CLIENT_ID);
    u.searchParams.set('redirect_uri', GITHUB_OAUTH_REDIRECT);
    u.searchParams.set('scope', GITHUB_OAUTH_SCOPE);
    try {
        const st = Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem('gh_oauth_state', st);
        u.searchParams.set('state', st);
    } catch {}
    return u.toString();
}

async function backendIsUp() {
    const urls = [API_BASE.replace('/api/v1', '') + '/actuator/health', 'http://localhost:8081/actuator/health'];
    for (const u of urls) {
        try {
            const r = await fetch(u, { method: 'GET' });
            if (r.ok) return true;
        } catch {}
    }
    return false;
}

/**
 * OAuth-first connect: if the backend is reachable, redirect to GitHub via the
 * backend's authorize URL (or a direct URL built from the public client id).
 * Shows the OAuth modal otherwise.
 * @returns {Promise<boolean>} true if a redirect was started
 */
async function beginOAuthOrFallback() {
    try {
        const up = await backendIsUp();
        if (up) {
            const url = (await fetchAuthorizeUrlFromBackend()) || buildDirectAuthorizeUrl();
            if (url) { window.location.href = url; return true; }
        }
    } catch {}
    showGithubModal();
    return false;
}

// -- modal OAuth button (centered hero) -------------------------------
ghOauthBtn?.addEventListener('click', async () => {
    const label = ghOauthBtn.querySelector('.connect-gh-label');
    const orig = label ? label.textContent : '';
    try {
        if (label) label.textContent = 'Redirecting…';
        ghOauthBtn.disabled = true;
        const url = (await fetchAuthorizeUrlFromBackend()) || buildDirectAuthorizeUrl();
        if (url) { window.location.href = url; return; }
        setStatus('Could not reach the auth backend. Is it running on :8081?', 'error');
    } finally {
        ghOauthBtn.disabled = false;
        if (label) label.textContent = orig || 'Connect with GitHub';
    }
});

// Button Event Listeners — always open the OAuth modal
document.querySelectorAll('#connectGithubBtn, #mobileConnectGithubBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        if (githubUser) { window.location.href = '/app.html#/'; return; }
        showGithubModal();
    });
});

/** Either straight into the dashboard, or show connect modal. */
async function startConnectFlow(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (githubUser) { window.location.href = '/app.html#/'; return; }
    showGithubModal();
}

document.getElementById('heroConnectGhBtn')?.addEventListener('click', startConnectFlow);
document.getElementById('dnaConnectBtn')?.addEventListener('click', startConnectFlow);

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Active nav link on scroll
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link, .mobile-link');

window.addEventListener('scroll', () => {
    let current = 'home';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}, { passive: true });

// Prevent video right-click
const video = document.querySelector('.bg-video');
video?.addEventListener('contextmenu', (e) => e.preventDefault());

// Restore an existing GitHub connection
function checkGithubConnection() {
    const token = localStorage.getItem(GH_TOKEN_KEY);
    const stored = localStorage.getItem(GH_USER_KEY);
    if (!token || !stored) return;

    try {
        githubUser = JSON.parse(stored);
    } catch {
        // Corrupted entry — drop it rather than half-restoring the session.
        localStorage.removeItem(GH_USER_KEY);
        return;
    }

    updateConnectButtons();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (githubModal) {
        githubModal.hidden = true;
        githubModal.setAttribute('hidden', 'hidden');
    }
    checkGithubConnection();
});
