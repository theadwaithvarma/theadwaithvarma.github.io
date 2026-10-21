/* Portfolio interactions — vanilla JS, no dependencies. */
(function () {
  'use strict';

  const root = document.documentElement;
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Theme (persisted) ---------- */
  const toggle = document.querySelector('[data-theme-toggle]');
  let theme = 'light';
  try {
    theme = localStorage.getItem('av-theme')
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) { /* private mode */ }
  root.setAttribute('data-theme', theme);
  updateToggleIcon();

  if (toggle) {
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem('av-theme', theme); } catch (e) {}
      updateToggleIcon();
    });
  }

  function updateToggleIcon() {
    if (!toggle) return;
    toggle.innerHTML = theme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    toggle.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
  }

  /* ---------- Hero char-stagger ---------- */
  document.querySelectorAll('[data-split]').forEach((line, lineIdx) => {
    const text = line.textContent;
    line.textContent = '';
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      span.style.animationDelay = (lineIdx * 0.35 + i * 0.045) + 's';
      line.appendChild(span);
    });
  });

  /* ---------- Scroll reveals ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Nav: scrolled state + progress + active link ---------- */
  const nav = document.getElementById('nav');
  const progress = document.getElementById('scrollProgress');
  const navAnchors = [...document.querySelectorAll('[data-nav]')];
  const sections = navAnchors
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      if (nav) nav.classList.toggle('is-scrolled', y > 24);

      const max = document.body.scrollHeight - innerHeight;
      if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';

      // Active section link
      let current = null;
      sections.forEach((s) => {
        if (s.getBoundingClientRect().top <= innerHeight * 0.4) current = s;
      });
      navAnchors.forEach((a) => {
        a.classList.toggle('is-active', current && a.getAttribute('href') === '#' + current.id);
      });

      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Custom cursor (dot + trailing ring) ---------- */
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (dot && ring && canHover && !prefersReducedMotion) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = 'translate(' + (mx - 3) + 'px,' + (my - 3) + 'px)';
      const half = ring.offsetWidth / 2;
      ring.style.transform = 'translate(' + (rx - half) + 'px,' + (ry - half) + 'px)';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button, .chips li').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });
  } else if (dot && ring) {
    dot.style.display = 'none';
    ring.style.display = 'none';
  }

  /* ---------- Magnetic elements ---------- */
  if (canHover && !prefersReducedMotion) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      const strength = 0.28;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + x * strength + 'px,' + y * strength + 'px)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------- Card spotlight follows mouse ---------- */
  if (canHover) {
    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
        card.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Live IST clock ---------- */
  const clocks = [document.getElementById('istClock'), document.getElementById('istClock2')].filter(Boolean);
  function tickClock() {
    try {
      const t = new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true
      });
      clocks.forEach((c) => { c.textContent = t; });
    } catch (e) {}
  }
  if (clocks.length) { tickClock(); setInterval(tickClock, 20000); }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        cio.unobserve(el);
        const target = parseInt(el.getAttribute('data-count'), 10) || 0;
        const start = performance.now();
        const dur = 1200;
        (function step(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach((el) => { el.textContent = el.getAttribute('data-count'); });
  }

  /* ---------- Toast ---------- */
  const toast = document.getElementById('toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  /* ---------- Copy email ---------- */
  const copyBtn = document.getElementById('copyEmail');
  const EMAIL = 'varmaadwaith872@gmail.com';
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(EMAIL);
        ok = true;
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = EMAIL;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch (err) {}
        ta.remove();
      }
      if (ok) {
        copyBtn.classList.add('copied');
        showToast('Email copied to clipboard');
        setTimeout(() => copyBtn.classList.remove('copied'), 2000);
      } else {
        showToast(EMAIL);
      }
    });
  }

  /* ---------- Live follower counts (best effort, embedded values are the fallback) ---------- */
  const compactFmt = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
  function setLive(key, n) {
    if (!Number.isFinite(n) || n < 0) return;
    document.querySelectorAll('[data-live="' + key + '"]').forEach((el) => {
      el.textContent = el.hasAttribute('data-compact') ? compactFmt.format(n) : Number(n).toLocaleString('en-IN');
    });
  }

  // X — syndication widget endpoint, then a public API mirror
  (async function fetchX() {
    try {
      const res = await fetch('https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=TheAdwaithVarma');
      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0].followers_count) { setLive('x', data[0].followers_count); return; }
      }
    } catch (e) { /* try next source */ }
    try {
      const res = await fetch('https://api.fxtwitter.com/TheAdwaithVarma');
      if (res.ok) {
        const data = await res.json();
        const u = data && data.user;
        if (u) setLive('x', u.followers ?? u.followers_count);
      }
    } catch (e) { /* keep fallback */ }
  })();

  // GitHub — public API, no key needed
  (async function fetchGitHub() {
    try {
      const res = await fetch('https://api.github.com/users/theadwaithvarma');
      if (res.ok) {
        const data = await res.json();
        setLive('gh', data.followers);
      }
    } catch (e) { /* keep fallback */ }
  })();

  // Telegram — channel preview page via a text mirror (t.me itself blocks cross-origin reads)
  (async function fetchTelegram() {
    try {
      const res = await fetch('https://r.jina.ai/https://t.me/TheAdwaithVarma');
      if (res.ok) {
        const text = await res.text();
        const m = text.replace(/,/g, '').match(/(\d+)\s+subscribers/i);
        if (m) setLive('tg', parseInt(m[1], 10));
      }
    } catch (e) { /* keep fallback */ }
  })();

  // Instagram — profile page via a text mirror (no public API without login)
  (async function fetchInstagram() {
    try {
      const res = await fetch('https://r.jina.ai/https://www.instagram.com/theadwaithvarma/');
      if (res.ok) {
        const text = await res.text();
        const m = text.replace(/,/g, '').match(/(\d+)\s+followers/i);
        if (m) setLive('ig', parseInt(m[1], 10));
      }
    } catch (e) { /* keep fallback */ }
  })();

  /* ---------- Lock screen ---------- */
  const lockEl = document.getElementById('lock');
  const homeEl = document.getElementById('home');
  const lockClock = document.getElementById('lockClock');
  const lockDate = document.getElementById('lockDate');
  const lockGreeting = document.getElementById('lockGreeting');

  function istNow() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  }

  function tickLock() {
    if (!lockClock) return;
    const d = istNow();
    const h = d.getHours();
    lockClock.textContent = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s?[ap]m/i, '');
    if (lockDate) {
      lockDate.textContent = d.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    if (lockGreeting) {
      lockGreeting.textContent =
        h < 5 ? 'up late, as usual' :
        h < 11 ? 'early, like always' :
        h < 17 ? 'around' :
        h < 22 ? 'around this evening' : 'still up';
    }
    root.setAttribute('data-phase', h < 6 ? 'night' : h < 11 ? 'morning' : h < 17 ? 'day' : h < 20 ? 'evening' : 'night');
  }
  if (lockClock) { tickLock(); setInterval(tickLock, 1000); }

  let unlocked = false;
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    document.body.classList.remove('is-locked');
    document.body.classList.add('is-unlocked');
    if (homeEl) homeEl.setAttribute('aria-hidden', 'false');
    if (lockEl) lockEl.setAttribute('aria-hidden', 'true');
  }
  function relock() {
    if (!unlocked) return;
    unlocked = false;
    scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    document.body.classList.add('is-locked');
    document.body.classList.remove('is-unlocked');
    if (homeEl) homeEl.setAttribute('aria-hidden', 'true');
    if (lockEl) lockEl.setAttribute('aria-hidden', 'false');
  }

  const unlockBtn = document.getElementById('unlockBtn');
  if (unlockBtn) unlockBtn.addEventListener('click', unlock);
  addEventListener('wheel', (e) => { if (!unlocked && e.deltaY > 4) unlock(); }, { passive: true });
  let touchStartY = null;
  addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (!unlocked && touchStartY !== null && touchStartY - e.touches[0].clientY > 40) unlock();
  }, { passive: true });
  addEventListener('keydown', (e) => {
    if (!unlocked && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) unlock();
  });
  const relockBtn = document.getElementById('relockBtn');
  if (relockBtn) relockBtn.addEventListener('click', relock);
  const relockBrand = document.getElementById('relockBrand');
  if (relockBrand) relockBrand.addEventListener('click', (e) => { e.preventDefault(); relock(); });

  /* ---------- Konami easter egg ---------- */
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let pos = 0;
  addEventListener('keydown', (e) => {
    pos = (e.key === seq[pos]) ? pos + 1 : (e.key === seq[0] ? 1 : 0);
    if (pos === seq.length) {
      pos = 0;
      showToast('Nice. You found the easter egg.');
    }
  });

})();
