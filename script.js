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

// --- Chat Widget ---
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatBadge = document.querySelector('.chat-badge');
const chatIconOpen = document.querySelector('.chat-icon-open');
const chatIconClose = document.querySelector('.chat-icon-close');

const chatAnswers = {
    compensation: "Great question! 💰 Compensation is 100% commission-based with absolutely no cap on earnings. With just 5 deals per week, you're already earning $1,000+ weekly. As you build your skills and close more deals, your income grows — top performers earn significantly more. The harder you work, the more you make!",
    experience: "Not at all! 📋 No prior sales experience is needed. We provide comprehensive hands-on training from day one — covering our proven sales methodology, product knowledge for all 8+ brands, objection handling, and closing strategies. Many of our top performers started with zero sales background.",
    schedule: "As a 1099 independent contractor, you have flexibility! 🕐 You operate as your own boss with control over your schedule and approach. Our teams are typically active during business hours (Mon-Fri), and the more time you invest, the more you earn. It's all about what you put in.",
    locations: "We're currently operating in three markets! 📍\n\n• Austin, TX — Our home base and fastest-growing market\n• Orange County, CA — West coast operations\n• Charlotte, NC — Our newest expansion market\n\nEach location has its own dedicated team and leadership.",
    advancement: "Absolutely — we promote from within! 🚀 The career path is clear:\n\n1. Sales Agent → Build your skills and pipeline\n2. Team Leader → Lead and mentor your own team\n3. Management → Oversee multiple teams and markets\n\nYour advancement is based on performance and ambition, not tenure. Some team members have moved up in just months!",
    apply: "Easy! ✅ You can either:\n\n1. Fill out the application form right here on our site — scroll down to the \"Apply Now\" section\n2. Schedule an interview directly through our calendar booking\n\nOur team will reach out within 24-48 hours to discuss next steps. The process is quick — we're looking for motivated people ready to start!"
};

const fallbackAnswers = [
    "Great question! For the most accurate answer, I'd recommend reaching out to our team directly at info@no-limit-llc.com or scheduling an interview — they'll be happy to help!",
    "I appreciate your interest! That's something our team can best answer directly. Feel free to apply or schedule an interview, and they'll cover everything you need to know!",
    "Thanks for asking! For detailed info on that topic, our team would love to chat with you. Hit the Apply Now button or schedule an interview to get all your questions answered!"
];

if (chatToggle) {
    chatToggle.addEventListener('click', () => {
        const isOpen = chatWindow.classList.toggle('open');
        chatIconOpen.style.display = isOpen ? 'none' : 'block';
        chatIconClose.style.display = isOpen ? 'block' : 'none';
        if (chatBadge) chatBadge.style.display = 'none';
        if (isOpen) chatInput.focus();
    });
}

if (chatClose) {
    chatClose.addEventListener('click', () => {
        chatWindow.classList.remove('open');
        chatIconOpen.style.display = 'block';
        chatIconClose.style.display = 'none';
    });
}

// Quick reply buttons
document.querySelectorAll('.chat-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const question = btn.getAttribute('data-question');
        const label = btn.textContent.trim();
        addChatMessage(label, 'user');
        // Remove quick replies after first use
        const quickReplies = document.getElementById('chatQuickReplies');
        if (quickReplies) quickReplies.remove();
        setTimeout(() => {
            addChatMessage(chatAnswers[question] || fallbackAnswers[0], 'bot');
        }, 600);
    });
});

// Free text input
function handleChatSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    addChatMessage(text, 'user');
    chatInput.value = '';
    // Remove quick replies if still visible
    const quickReplies = document.getElementById('chatQuickReplies');
    if (quickReplies) quickReplies.remove();

    // Simple keyword matching
    const lower = text.toLowerCase();
    let answer = null;
    if (lower.match(/pay|earn|money|salary|commission|income|compensation|\$/)) {
        answer = chatAnswers.compensation;
    } else if (lower.match(/experience|background|qualif|require|need/)) {
        answer = chatAnswers.experience;
    } else if (lower.match(/schedule|hours|time|flex|remote/)) {
        answer = chatAnswers.schedule;
    } else if (lower.match(/locat|where|city|austin|charlotte|orange|office/)) {
        answer = chatAnswers.locations;
    } else if (lower.match(/advance|promot|grow|career|leader|move up/)) {
        answer = chatAnswers.advancement;
    } else if (lower.match(/apply|start|join|sign up|how do i/)) {
        answer = chatAnswers.apply;
    }

    setTimeout(() => {
        addChatMessage(answer || fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)], 'bot');
    }, 800);
}

if (chatSend) chatSend.addEventListener('click', handleChatSend);
if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });
}

function addChatMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `chat-message chat-${sender}`;
    // Convert newlines to <br>
    msg.innerHTML = '<p>' + text.replace(/\n/g, '<br>') + '</p>';
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
