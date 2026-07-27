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

function openCalendlyModal(e) {
    e.preventDefault();
    if (window.Cal) {
        Cal("modal", {
            calLink: "angel-molina-hdwyb9/15min",
            config: { theme: "dark", layout: "month_view" }
        });
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
const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/info@no-limit-llc.com';

const form = document.getElementById('applicationForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="spin">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" stroke-dasharray="44" stroke-dashoffset="11" stroke-linecap="round"/>
            </svg>
            Submitting...
        `;
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.7';

        const formData = new FormData(form);
        const payload = {
            firstName: formData.get('First Name') || '',
            lastName: formData.get('Last Name') || '',
            email: formData.get('Email') || '',
            phone: formData.get('Phone') || '',
            salesExperience: formData.get('Sales Experience') || '',
            message: formData.get('Message') || '',
            agentReferral: formData.get('Agent Referral') || '',
        };

        // Send to both dashboard and FormSubmit in parallel
        const dashboardReq = fetch(DASHBOARD_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(() => {});

        const formSubmitReq = fetch(FORMSUBMIT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                'First Name': payload.firstName,
                'Last Name': payload.lastName,
                'Email': payload.email,
                'Phone': payload.phone,
                'Sales Experience': payload.salesExperience,
                'Message': payload.message,
                'Agent Referral': payload.agentReferral,
                '_subject': 'New Application - No Limit LLC',
                '_template': 'box',
            }),
        }).catch(() => {});

        await Promise.allSettled([dashboardReq, formSubmitReq]);
        window.location.href = '/thank-you.html';
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

// --- Earnings counter animation ---
const earningsFills = document.querySelectorAll('.earnings-fill');
const earningsNumbers = document.querySelectorAll('.earnings-number[data-target]');

if (earningsFills.length > 0 || earningsNumbers.length > 0) {
    const earningsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animate progress bars
                earningsFills.forEach(fill => {
                    const width = fill.getAttribute('data-width');
                    if (width) {
                        setTimeout(() => { fill.style.width = width + '%'; }, 200);
                    }
                });
                // Animate numbers
                earningsNumbers.forEach(numEl => {
                    const target = parseInt(numEl.getAttribute('data-target'));
                    if (target) animateNumber(numEl, target);
                });
                earningsObserver.disconnect();
            }
        });
    }, { threshold: 0.2 });

    const earningsSection = document.getElementById('earnings');
    if (earningsSection) earningsObserver.observe(earningsSection);
}

function animateNumber(el, target) {
    const duration = 1500;
    const start = performance.now();
    const formatter = new Intl.NumberFormat('en-US');

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(target * eased);
        el.textContent = formatter.format(current);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = formatter.format(target);
    }
    requestAnimationFrame(update);
}
