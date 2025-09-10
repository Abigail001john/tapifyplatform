// Smooth scroll for in-page nav links
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id.length > 1) {
            const el = document.querySelector(id);
            if (el) {
                e.preventDefault();
                el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Image zoom (gallery + proofs)
const modal = document.getElementById('zoomModal');
const zoomImg = document.getElementById('zoomedImg');
const zoomClose = document.getElementById('zoomClose');

if (modal && zoomImg && zoomClose) {
    const openZoom = (src, alt) => {
        zoomImg.src = src;
        zoomImg.alt = alt || 'Zoomed image';
        modal.removeAttribute('hidden');
    };
    const closeZoom = () => {
        modal.setAttribute('hidden', '');
        zoomImg.src = '';
        zoomImg.alt = 'Zoomed image';
    };

    document.querySelectorAll('.zoomable').forEach(img => {
        img.addEventListener('click', () => openZoom(img.src, img.alt));
    });

    zoomClose.addEventListener('click', closeZoom);
    modal.addEventListener('click', e => {
        if (e.target === modal) closeZoom();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeZoom();
    });
}

// Mobile nav toggle
(() => {
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.nav__toggle');
    const menu = document.getElementById('primary-menu');

    if (!nav || !toggle || !menu) return;

    const openMenu = (open) => {
        nav.classList.toggle('nav--open', open);
        toggle.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('no-scroll', open);
    };

    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.contains('nav--open');
        openMenu(!isOpen);
    });

    // Close on link click
    menu.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('click', () => openMenu(false));
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!nav.classList.contains('nav--open')) return;
        if (!nav.contains(e.target)) openMenu(false);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') openMenu(false);
    });
})();


// ---------- Rotating Gallery ----------
(() => {
    const viewport = document.getElementById('galleryViewport');
    const track = document.getElementById('galleryTrack');
    const prevBtn = document.querySelector('.gallery__btn--prev');
    const nextBtn = document.querySelector('.gallery__btn--next');

    if (!viewport || !track) return;

    // How far to move per step = width of one item (dynamic & responsive)
    const step = () => {
        const first = track.querySelector('.gallery__item');
        return first ? first.getBoundingClientRect().width + 10 /* gap */ : 300;
    };

    const scrollNext = () => viewport.scrollBy({
        left: step(),
        behavior: 'smooth'
    });
    const scrollPrev = () => viewport.scrollBy({
        left: -step(),
        behavior: 'smooth'
    });

    prevBtn ? .addEventListener('click', scrollPrev);
    nextBtn ? .addEventListener('click', scrollNext);

    // Auto-rotate (pause on interaction/hover)
    let paused = false;
    const stop = () => {
        paused = true;
    };
    ['pointerdown', 'wheel', 'touchstart', 'keydown', 'mouseenter'].forEach(ev => {
        viewport.addEventListener(ev, stop, {
            once: true
        });
    });

    const tick = () => {
        if (!paused) {
            // If we're at the end, loop back
            const nearEnd = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 5;
            if (nearEnd) viewport.scrollTo({
                left: 0,
                behavior: 'smooth'
            });
            else scrollNext();
        }
    };
    // Rotate every 3s
    setInterval(tick, 3000);
})();

// Scroll-to-top button
(() => {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;

    const revealAt = 600; // px scrolled before showing

    const onScroll = () => {
        if (window.scrollY > revealAt) btn.classList.add('scrolltop--show');
        else btn.classList.remove('scrolltop--show');
    };

    // Smooth scroll (respect reduced motion)
    const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: prefersReduced() ? 'auto' : 'smooth'
        });
    });

    document.addEventListener('scroll', onScroll, {
        passive: true
    });
    onScroll(); // init on load
})();

// Tapify Payment: populate summary, build payment note, countdown, WhatsApp confirm, testimonials
(() => {
    const $ = (id) => document.getElementById(id);

    // ----- Load registration data -----
    function fromSession() {
        try {
            const raw = sessionStorage.getItem('tapify_reg');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function fromQuery() {
        const p = new URLSearchParams(location.search);
        return {
            name: p.get('name') || '',
            username: p.get('username') || '',
            email: p.get('email') || '',
            phone: p.get('phone') || '',
            amount: p.get('amount') || '10000',
            packageName: p.get('packageName') || 'Tapify Access — ₦10,000 (One-Time)'
        };
    }
    const data = fromSession() || fromQuery() || {};
    const hello = (data.name || '').split(' ')[0] || 'there';
    $('helloName').textContent = hello;

    $('name').value = data.name || '';
    $('username').value = data.username || '';
    $('email').value = data.email || '';
    $('phone').value = data.phone || '';

    const amount = Number(data.amount) || 10000;
    const fmt = (n) => Number(n).toLocaleString('en-NG');
    $('amount').value = '₦' + fmt(amount);
    $('amountText').textContent = fmt(amount);

    // ----- Payment note / reference -----
    const refEl = $('ref');
    const userTagEl = $('userTag');
    const payNoteEl = $('payNote');

    function randomRef() {
        const n = Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
        return 'TPFY' + n;
    }

    function buildNote() {
        const ref = randomRef();
        const uname = ($('username').value || 'user').replace(/\s+/g, '').slice(0, 16);
        refEl.textContent = ref;
        userTagEl.textContent = uname;
        return `TPFY-${ref}-${uname}`;
    }
    buildNote();

    // ----- Copy buttons -----
    function copyById(id) {
        const el = $(id);
        const text = (el ? .innerText || el ? .textContent || '').trim();
        if (!text) return;
        if (navigator.clipboard ? .writeText) {
            navigator.clipboard.writeText(text).then(() => alert('Copied: ' + text));
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                alert('Copied: ' + text);
            } catch {}
            document.body.removeChild(ta);
        }
    }
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => copyById(btn.getAttribute('data-copy')));
    });

    // ----- Countdown (6 minutes, regenerates reference) -----
    const timerEl = $('timer');
    let secs = 6 * 60;

    function tick() {
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
        if (secs <= 0) {
            const newNote = buildNote();
            alert('Timer expired. A new payment reference has been generated: ' + newNote);
            secs = 6 * 60;
        } else {
            secs--;
        }
    }
    tick();
    setInterval(tick, 1000);

    // ----- WhatsApp actions -----
    const ADMIN = '2349040989441';

    function buildWAConfirmMessage() {
        const payload =
            `Hello Tapify Admin,

I have completed the transfer. Please verify and activate my access.`;
        return payload;
    }
    $('confirmBtn').addEventListener('click', () => {
        const msg = encodeURIComponent(buildWAConfirmMessage());
        window.open(`https://wa.me/${ADMIN}?text=${msg}`, '_blank', 'noopener');
    });
    $('helpBtn').addEventListener('click', () => {
        const msg = encodeURIComponent('Hi Tapify Support, I need help completing my payment.');
        window.open(`https://wa.me/${ADMIN}?text=${msg}`, '_blank', 'noopener');
    });



    // ----- Testimonials rotate (every 7s) -----
    const testimonials = [{
            name: "Ada",
            location: "Lagos",
            text: "Started for the freebies, stayed for the streaks. Payouts land every week."
        },
        {
            name: "Seyi",
            location: "Abuja",
            text: "Delivery tasks + social uploads = simple and fast. Mentorship helped a lot."
        },
        {
            name: "Bola",
            location: "Port Harcourt",
            text: "Paid on Friday as promised. The global job board got me a remote gig."
        },
        {
            name: "Ife",
            location: "Ibadan",
            text: "Streak mode made consistency fun—and the multipliers are real."
        },
        {
            name: "Peace",
            location: "Uyo",
            text: "Freebies covered my data bills while I built my streaks."
        }
    ];
    const tBox = $('tBox');
    let ti = 0;

    function rotateT() {
        const t = testimonials[ti];
        tBox.classList.remove('show');
        setTimeout(() => {
            tBox.innerHTML = `<p>“${t.text}”</p><p><strong>${t.name}</strong> <em>from ${t.location}</em></p>`;
            tBox.classList.add('show');
        }, 250);
        ti = (ti + 1) % testimonials.length;
    }
    rotateT();
    setInterval(rotateT, 7000);
})();