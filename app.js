/* TVA Personnel File — Variant E-1130. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

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
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- The stamp ---------- */
  const stamp = document.getElementById('stamp');
  const cardScene = document.getElementById('cardScene');
  if (stamp) {
    if (prefersReducedMotion) {
      stamp.classList.add('is-stamped');
      stamp.style.animation = 'none';
      stamp.style.opacity = '.94';
      stamp.style.transform = 'rotate(-12deg) scale(1)';
    } else {
      setTimeout(() => {
        stamp.classList.add('is-stamped');
        if (cardScene) {
          cardScene.classList.add('is-jolt');
          setTimeout(() => cardScene.classList.remove('is-jolt'), 380);
        }
      }, 450);
    }
  }

  /* ---------- Card tilt ---------- */
  const idCard = document.getElementById('idCard');
  if (idCard && cardScene && canHover && !prefersReducedMotion) {
    let rafPending = false;
    cardScene.addEventListener('pointermove', (e) => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        const r = idCard.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        idCard.style.setProperty('--ry', (px * 5).toFixed(2) + 'deg');
        idCard.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg');
        rafPending = false;
      });
    });
    cardScene.addEventListener('pointerleave', () => {
      idCard.style.setProperty('--rx', '0deg');
      idCard.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- Redactions (tap toggles; hover/focus handled in CSS) ---------- */
  document.querySelectorAll('.redact').forEach((el) => {
    el.addEventListener('click', () => {
      el.classList.toggle('is-revealed');
    });
  });

  /* ---------- Temporal chronometer + file date (IST) ---------- */
  const chronoClock = document.getElementById('chronoClock');
  const istClock = document.getElementById('istClock');
  const noteDate = document.getElementById('noteDate');

  function tickClock() {
    try {
      const now = new Date();
      if (chronoClock) {
        chronoClock.textContent = now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        chronoClock.setAttribute('datetime', now.toISOString());
      }
      if (istClock) {
        istClock.textContent = now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true
        });
        istClock.setAttribute('datetime', now.toISOString());
      }
      if (noteDate) {
        noteDate.textContent = now.toLocaleDateString('en-GB', {
          timeZone: 'Asia/Kolkata', day: '2-digit', month: 'long', year: 'numeric'
        });
      }
    } catch (e) { /* leave the printed defaults */ }
  }
  if (chronoClock || istClock || noteDate) {
    tickClock();
    setInterval(tickClock, 1000);
  }

  /* ---------- Toast ---------- */
  const toast = document.getElementById('toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
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
        try { ok = document.execCommand('copy'); } catch (err) { /* no route left */ }
        ta.remove();
      }
      showToast(ok ? 'Copied — ' + EMAIL : EMAIL);
    });
  }

  /* ---------- Live signal strengths (best effort; printed figures are the fallback) ---------- */
  function setLive(key, n) {
    if (!Number.isFinite(n) || n < 0) return;
    document.querySelectorAll('[data-live="' + key + '"]').forEach((el) => {
      el.textContent = Number(n).toLocaleString('en-IN');
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
    } catch (e) { /* keep the printed figure */ }
  })();

  // GitHub — public API, no key needed
  (async function fetchGitHub() {
    try {
      const res = await fetch('https://api.github.com/users/theadwaithvarma');
      if (res.ok) {
        const data = await res.json();
        setLive('gh', data.followers);
      }
    } catch (e) { /* keep the printed figure */ }
  })();

  // Telegram — channel preview page via a text mirror (t.me blocks cross-origin reads)
  (async function fetchTelegram() {
    try {
      const res = await fetch('https://r.jina.ai/https://t.me/TheAdwaithVarma');
      if (res.ok) {
        const text = await res.text();
        const m = text.replace(/,/g, '').match(/(\d+)\s+subscribers/i);
        if (m) setLive('tg', parseInt(m[1], 10));
      }
    } catch (e) { /* keep the printed figure */ }
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
    } catch (e) { /* keep the printed figure */ }
  })();

})();
