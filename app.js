/* TVA Incursion Console — Variant E-1130. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Scroll reveals + Yggdrasil branch lighting ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const branchGroups = (name) => document.querySelectorAll('.ygg-branch[data-branch="' + name + '"]');

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

    const branchIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          branchGroups(entry.target.getAttribute('data-branch')).forEach((b) => b.classList.add('lit'));
          branchIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('section[data-branch]').forEach((s) => branchIO.observe(s));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    document.querySelectorAll('.ygg-branch').forEach((b) => b.classList.add('lit'));
  }

  /* ---------- Clocks, Doomsday countdown, incursion proximity ---------- */
  const DOOMSDAY = new Date('2026-12-18T00:00:00+05:30').getTime();
  const WINDOW_START = new Date('2026-10-22T00:00:00+05:30').getTime();

  const chronoClock = document.getElementById('chronoClock');
  const doomCountdown = document.getElementById('doomCountdown');
  const istClock = document.getElementById('istClock');
  const noteDate = document.getElementById('noteDate');
  const proximityPct = document.getElementById('proximityPct');
  const proximityFill = document.getElementById('proximityFill');
  const daysToDoom = document.getElementById('daysToDoom');

  const pad2 = (n) => String(n).padStart(2, '0');

  function tickClock() {
    try {
      const now = new Date();
      const nowMs = now.getTime();

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

      // Countdown to Doomsday (18 Dec 2026, 00:00 IST)
      const remaining = DOOMSDAY - nowMs;
      if (doomCountdown) {
        if (remaining <= 0) {
          doomCountdown.textContent = 'EVENT REACHED';
        } else {
          const d = Math.floor(remaining / 86400000);
          const h = Math.floor((remaining % 86400000) / 3600000);
          const m = Math.floor((remaining % 3600000) / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          doomCountdown.textContent = pad2(d) + 'D : ' + pad2(h) + 'H : ' + pad2(m) + 'M : ' + pad2(s) + 'S';
        }
      }
      if (daysToDoom) {
        const days = Math.max(0, Math.ceil(remaining / 86400000));
        daysToDoom.textContent = remaining <= 0
          ? 'Doomsday is here'
          : days + (days === 1 ? ' day to Doomsday' : ' days to Doomsday');
      }

      // Proximity = elapsed share of the monitoring window, from the same clock
      const share = Math.min(1, Math.max(0, (nowMs - WINDOW_START) / (DOOMSDAY - WINDOW_START)));
      if (proximityPct) proximityPct.textContent = (share * 100).toFixed(1) + '%';
      if (proximityFill) proximityFill.style.width = (share * 100).toFixed(2) + '%';
    } catch (e) { /* leave the printed defaults */ }
  }
  tickClock();
  setInterval(tickClock, 1000);

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

  /* ---------- ID card tilt ---------- */
  const idCard = document.getElementById('idCard');
  const cardScene = document.getElementById('cardScene');
  if (idCard && cardScene && canHover && !prefersReducedMotion) {
    let rafPending = false;
    cardScene.addEventListener('pointermove', (e) => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        const r = idCard.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        idCard.style.setProperty('--ry', (px * 4).toFixed(2) + 'deg');
        idCard.style.setProperty('--rx', (-py * 4).toFixed(2) + 'deg');
        rafPending = false;
      });
    });
    cardScene.addEventListener('pointerleave', () => {
      idCard.style.setProperty('--rx', '0deg');
      idCard.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- Live beacon strengths (printed figures are the verified fallback) ---------- */
  const liveState = {};
  document.querySelectorAll('[data-live]').forEach((el) => {
    const v = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10);
    if (Number.isFinite(v)) liveState[el.getAttribute('data-live')] = v;
  });

  const meterFills = {};
  document.querySelectorAll('[data-live]').forEach((el) => {
    const key = el.getAttribute('data-live');
    const host = el.closest('.beacon-data');
    if (!host || meterFills[key]) return;
    const meter = document.createElement('span');
    meter.className = 'beacon-meter';
    meter.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    fill.className = 'beacon-fill';
    meter.appendChild(fill);
    host.appendChild(meter);
    meterFills[key] = fill;
  });

  const signalTotalEl = document.getElementById('signalTotal');

  function refreshMeters(changedKey) {
    const max = Math.max(1, ...Object.values(liveState));
    Object.keys(meterFills).forEach((key) => {
      const n = liveState[key] || 0;
      const pct = Math.max(3, (Math.sqrt(n) / Math.sqrt(max)) * 100);
      meterFills[key].style.width = pct.toFixed(1) + '%';
    });
    if (signalTotalEl) {
      const sum = Object.values(liveState).reduce((a, b) => a + b, 0);
      signalTotalEl.textContent = sum.toLocaleString('en-IN');
    }
    if (changedKey) {
      const el = document.querySelector('[data-live="' + changedKey + '"]');
      const card = el && el.closest('.beacon');
      if (card) {
        card.classList.remove('is-updated');
        void card.offsetWidth;
        card.classList.add('is-updated');
        setTimeout(() => card.classList.remove('is-updated'), 1300);
      }
    }
  }
  refreshMeters(null);

  function tweenNumber(el, from, to) {
    if (prefersReducedMotion || from === to) {
      el.textContent = Number(to).toLocaleString('en-IN');
      return;
    }
    const start = performance.now();
    const dur = 750;
    (function step(t) {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased).toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  function setLive(key, n) {
    if (!Number.isFinite(n) || n < 0) return;
    const prev = liveState[key];
    liveState[key] = n;
    document.querySelectorAll('[data-live="' + key + '"]').forEach((el) => {
      tweenNumber(el, Number.isFinite(prev) ? prev : n, n);
    });
    refreshMeters(key);
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

  /* ---------- Seam scroll progress ---------- */
  const seamBar = document.getElementById('seamBar');
  if (seamBar) {
    let ticking = false;
    const updateBar = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, scrollY / max) : 0;
      seamBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      ticking = false;
    };
    addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateBar); }
    }, { passive: true });
    updateBar();
  }

  /* ---------- Incursion canvas: two worlds, one seam ---------- */
  const canvas = document.getElementById('incursionCanvas');
  const viewport = document.querySelector('.viewport');
  if (canvas && viewport) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, running = false, rafId = null;
    let stars = [], sparks = [], gradA = null, gradB = null;
    const pointer = { x: -9999, y: -9999 };
    const par = { x: 0, y: 0, tx: 0, ty: 0 };

    function buildScene() {
      const r = viewport.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(320, r.width);
      H = Math.max(320, r.height);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = [];
      const starCount = Math.min(170, Math.floor(W * H / 11000));
      for (let i = 0; i < starCount; i++) {
        stars.push({ x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.1, ph: Math.random() * Math.PI * 2 });
      }
      sparks = [];
      const sparkCount = Math.min(110, Math.floor(W / 11));
      for (let i = 0; i < sparkCount; i++) sparks.push(newSpark(true));

      // Cached planet-shading gradients (rebuilt on resize only)
      const seamY = H * 0.55;
      const RA = Math.max(W, H) * 0.72;
      const RB = Math.max(W, H) * 0.66;
      gradA = ctx.createRadialGradient(W * 0.14, seamY - RA, RA * 0.82, W * 0.14, seamY - RA, RA);
      gradA.addColorStop(0, 'rgba(53,161,132,0)');
      gradA.addColorStop(0.86, 'rgba(53,161,132,0.05)');
      gradA.addColorStop(1, 'rgba(45,212,191,0.20)');
      gradB = ctx.createRadialGradient(W * 0.86, seamY + RB, RB * 0.82, W * 0.86, seamY + RB, RB);
      gradB.addColorStop(0, 'rgba(255,107,26,0)');
      gradB.addColorStop(0.86, 'rgba(255,107,26,0.05)');
      gradB.addColorStop(1, 'rgba(255,107,26,0.22)');
    }

    function newSpark(anywhere) {
      return {
        x: Math.random(),
        yOff: anywhere ? Math.random() * 130 : Math.random() * 10,
        vy: 0.25 + Math.random() * 0.55,
        vx: (Math.random() - 0.5) * 0.12,
        size: 0.7 + Math.random() * 1.7,
        life: 0.5 + Math.random() * 0.5
      };
    }

    function drawScene(t) {
      const time = t * 0.001;
      const seamY = H * 0.55;
      const gap = 30 + Math.sin(time * 0.45) * 9;        // the worlds breathe
      const dipA = Math.sin(time * 0.3) * 4;
      const dipB = Math.cos(time * 0.26) * 4;
      par.x += (par.tx - par.x) * 0.045;
      par.y += (par.ty - par.y) * 0.045;

      ctx.clearRect(0, 0, W, H);

      // Starfield dust
      stars.forEach((s) => {
        const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(time * 0.7 + s.ph));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(237,232,218,' + a.toFixed(3) + ')';
        ctx.fill();
      });

      const RA = Math.max(W, H) * 0.72;
      const RB = Math.max(W, H) * 0.66;
      const cAx = W * 0.14 + par.x, cAy = seamY - gap / 2 - RA + dipA + par.y;
      const cBx = W * 0.86 - par.x, cBy = seamY + gap / 2 + RB + dipB - par.y;

      // World A (teal, descending) + World B (molten, ascending)
      ctx.beginPath(); ctx.arc(cAx, cAy, RA, 0, Math.PI * 2); ctx.fillStyle = gradA; ctx.fill();
      ctx.beginPath(); ctx.arc(cAx, cAy, RA, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(45,212,191,0.55)'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.arc(cAx, cAy, RA, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(45,212,191,0.12)'; ctx.lineWidth = 9; ctx.stroke();

      ctx.beginPath(); ctx.arc(cBx, cBy, RB, 0, Math.PI * 2); ctx.fillStyle = gradB; ctx.fill();
      ctx.beginPath(); ctx.arc(cBx, cBy, RB, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,107,26,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.arc(cBx, cBy, RB, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,107,26,0.13)'; ctx.lineWidth = 9; ctx.stroke();

      // The seam — where the worlds nearly touch
      const seamPulse = 0.72 + 0.28 * Math.sin(time * 1.4);
      const seamGrad = ctx.createLinearGradient(0, seamY - 30, 0, seamY + 30);
      seamGrad.addColorStop(0, 'rgba(255,140,60,0)');
      seamGrad.addColorStop(0.5, 'rgba(255,140,60,' + (0.20 * seamPulse).toFixed(3) + ')');
      seamGrad.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.fillStyle = seamGrad;
      ctx.fillRect(0, seamY - 30, W, 60);
      const coreGrad = ctx.createLinearGradient(0, 0, W, 0);
      coreGrad.addColorStop(0, 'rgba(255,170,90,0)');
      coreGrad.addColorStop(0.5, 'rgba(255,190,120,' + (0.85 * seamPulse).toFixed(3) + ')');
      coreGrad.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, seamY - 0.75, W, 1.5);

      // Sparks rising off the seam
      sparks.forEach((sp, i) => {
        sp.yOff += sp.vy;
        sp.x += sp.vx / Math.max(1, W) * 60;
        if (sp.yOff > 150 || sp.x < -0.02 || sp.x > 1.02) sparks[i] = newSpark(false);
        const x = sp.x * W;
        const y = seamY - sp.yOff;
        const fade = Math.max(0, 1 - sp.yOff / 150) * sp.life;
        const dx = x - pointer.x, dy = y - pointer.y;
        const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 130);
        const a = Math.min(1, fade * (0.55 + near * 0.7));
        ctx.beginPath();
        ctx.arc(x, y, sp.size + near * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,' + Math.round(150 + near * 60) + ',70,' + a.toFixed(3) + ')';
        ctx.fill();
      });
    }

    function loop(t) {
      if (!running) return;
      drawScene(t || 0);
      rafId = requestAnimationFrame(loop);
    }
    function startScene() {
      if (running) return;
      if (prefersReducedMotion) { drawScene(1400); return; }
      running = true;
      rafId = requestAnimationFrame(loop);
    }
    function stopScene() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    buildScene();
    drawScene(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting && !document.hidden) startScene(); else stopScene(); });
      }, { threshold: 0.02 }).observe(viewport);
    } else { startScene(); }
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopScene(); else startScene(); });

    if (canHover && !prefersReducedMotion) {
      viewport.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
        par.tx = ((e.clientX / innerWidth) - 0.5) * -11;
        par.ty = ((e.clientY / innerHeight) - 0.5) * -8;
      });
      viewport.addEventListener('pointerleave', () => {
        pointer.x = -9999; pointer.y = -9999;
        par.tx = 0; par.ty = 0;
      });
    }

    let resizeTimer = null;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { buildScene(); if (!running) drawScene(0); }, 180);
    });
  }

})();
