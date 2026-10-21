/* Plate Nº 01 — interactions. Vanilla JS, no dependencies. */
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
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Magnifier lens cursor ---------- */
  const lens = document.getElementById('lens');
  if (lens && canHover && !prefersReducedMotion) {
    let mx = -100, my = -100, lx = -100, ly = -100, scale = 1, targetScale = 1;
    addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      lens.classList.add('is-on');
    }, { passive: true });
    (function loop() {
      lx += (mx - lx) * 0.2;
      ly += (my - ly) * 0.2;
      scale += (targetScale - scale) * 0.18;
      const half = 17 * scale;
      lens.style.transform =
        'translate(' + (lx - half) + 'px,' + (ly - half) + 'px) scale(' + scale.toFixed(3) + ')';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => { targetScale = 1.55; });
      el.addEventListener('mouseleave', () => { targetScale = 1; });
    });
  } else if (lens) {
    lens.style.display = 'none';
  }

  /* ---------- Live IST clock + date ---------- */
  const plateClock = document.getElementById('plateClock');
  const istClock = document.getElementById('istClock');
  const noteDate = document.getElementById('noteDate');

  function tickClock() {
    try {
      const now = new Date();
      if (plateClock) {
        plateClock.textContent = now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        plateClock.setAttribute('datetime', now.toISOString());
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
  if (plateClock || istClock || noteDate) {
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

  /* ---------- Live counts (best effort; printed figures are the fallback) ---------- */
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
