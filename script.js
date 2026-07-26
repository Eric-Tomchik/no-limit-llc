/* ============================================
   NO LIMIT LLC — Site Scripts
   ============================================ */

// --- Navbar scroll behavior ---
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
});

// --- Mobile nav toggle ---
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close mobile nav when clicking a link
navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// --- Scroll reveal animations ---
const animatedEls = document.querySelectorAll('.about-card, .brand-card, .benefit-item, .apply-info, .apply-form-wrapper');

if ('IntersectionObserver' in window) {
    const observerOptions = {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedEls.forEach(el => observer.observe(el));

    // Safety fallback: reveal any still-hidden elements after 4s
    setTimeout(() => {
        animatedEls.forEach(el => el.classList.add('visible'));
    }, 4000);
} else {
    // No IntersectionObserver support — show everything immediately
    animatedEls.forEach(el => el.classList.add('visible'));
}

// --- Smooth scroll for anchor links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// --- Cal.com integration ---
let calEmbedLoaded = false;

function openCalendly(e) {
    e.preventDefault();
    // Switch to the calendar tab and scroll to apply section
    const tabCalendar = document.getElementById('tabCalendar');
    if (tabCalendar) {
        tabCalendar.click();
        document.getElementById('apply').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// --- Apply section tab switching ---
const applyTabs = document.querySelectorAll('.apply-tab');
const applyPanels = document.querySelectorAll('.apply-panel');

applyTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;

        // Update active tab
        applyTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active panel
        applyPanels.forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(target === 'form' ? 'panelForm' : 'panelCalendar');
        if (panel) panel.classList.add('active');

        // Load Cal.com embed on first switch to calendar tab
        if (target === 'calendar' && !calEmbedLoaded && window.Cal) {
            Cal("inline", {
                elementOrSelector: "#cal-inline-embed",
                calLink: "angel-molina-hdwyb9/15min",
                layout: "month_view",
                config: { theme: "dark" }
            });
            calEmbedLoaded = true;
        }
    });
});

// --- Phone number formatting ---
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value.length <= 3) {
                value = '(' + value;
            } else if (value.length <= 6) {
                value = '(' + value.slice(0, 3) + ') ' + value.slice(3);
            } else {
                value = '(' + value.slice(0, 3) + ') ' + value.slice(3, 6) + '-' + value.slice(6, 10);
            }
        }
        e.target.value = value;
    });
}

// --- Form submission enhancement ---
const DASHBOARD_API = 'https://kindhearted-ibis-211.convex.site/api/submissions';

const form = document.getElementById('applicationForm');
if (form) {
    form.addEventListener('submit', (e) => {
        const btn = form.querySelector('button[type="submit"]');
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="spin">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-dasharray="44" stroke-dashoffset="11" stroke-linecap="round"/>
            </svg>
            Submitting...
        `;
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.7';

        // Send to admin dashboard in the background (keepalive survives page navigation)
        try {
            const formData = new FormData(form);
            fetch(DASHBOARD_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({
                    firstName: formData.get('First Name') || '',
                    lastName: formData.get('Last Name') || '',
                    email: formData.get('Email') || '',
                    phone: formData.get('Phone') || '',
                    salesExperience: formData.get('Sales Experience') || '',
                    message: formData.get('Message') || '',
                    agentReferral: formData.get('Agent Referral') || '',
                }),
            }).catch(() => {}); // Silent fail — FormSubmit email is the fallback
        } catch (_) {}
    });
}

// Add spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);
