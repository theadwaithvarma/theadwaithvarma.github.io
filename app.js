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
          if (entry.target.classList.contains('file')) entry.target.classList.add('is-opened');
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
        idCard.style.setProperty('--mx', ((px + 0.5) * 100).toFixed(1) + '%');
        idCard.style.setProperty('--my', ((py + 0.5) * 100).toFixed(1) + '%');
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
  const liveStatus = document.getElementById('liveStatus');
  let lastStatusHour = -1;

  function tickClock() {
    try {
      const now = new Date();
      // The seal's hourglass turns with the seconds, like a chronometer dial
      document.documentElement.style.setProperty('--seal-rot', (now.getSeconds() * 6) + 'deg');
      // Live status line on the card, keyed to the actual IST hour
      if (liveStatus) {
        const istHour = parseInt(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }), 10) % 24;
        if (istHour !== lastStatusHour) {
          lastStatusHour = istHour;
          liveStatus.textContent =
            istHour < 5 ? 'At this hour: awake past branch hours, watching for launches' :
            istHour < 9 ? 'At this hour: already ahead of today\u2019s launches' :
            istHour < 17 ? 'At this hour: on timeline, monitoring signals' :
            istHour < 21 ? 'At this hour: reviewing the day\u2019s transmissions' :
            'At this hour: settling in for the night watch';
        }
      }
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
  const liveState = {};
  document.querySelectorAll('[data-live]').forEach((el) => {
    const v = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10);
    if (Number.isFinite(v)) liveState[el.getAttribute('data-live')] = v;
  });

  // Inject a strength meter into each signal card + a grand-total readout
  const meterFills = {};
  document.querySelectorAll('[data-live]').forEach((el) => {
    const key = el.getAttribute('data-live');
    const dataP = el.closest('.signal-data');
    if (!dataP || meterFills[key]) return;
    const meter = document.createElement('span');
    meter.className = 'signal-meter';
    meter.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    fill.className = 'signal-fill';
    meter.appendChild(fill);
    dataP.appendChild(meter);
    meterFills[key] = fill;
  });
  let signalTotalEl = null;
  const signalsList = document.querySelector('.signals');
  if (signalsList) {
    const total = document.createElement('p');
    total.className = 'signal-total';
    total.innerHTML = 'Total recorded across all timelines: <b id="signalTotal">—</b>';
    signalsList.after(total);
    signalTotalEl = total.querySelector('#signalTotal');
  }

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
      const card = el && el.closest('.signal');
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

  /* ---------- Card deal-in ---------- */
  if (cardScene) {
    setTimeout(() => cardScene.classList.add('is-dealt'), 120);
  }

  /* ---------- The TVA assistant (Miss Minutes homage, original art) ---------- */
  const miss = document.getElementById('missMinutes');
  const missBubble = document.getElementById('missBubble');
  const missClose = document.getElementById('missClose');
  const tvaSeal = document.getElementById('tvaSeal');
  let missTimer = null;
  let missIdleFired = false;

  const missLines = [
    'Hey y\u2019all!',
    'This variant\u2019s been flagged \u201Cearly\u201D 214 times.',
    'He gets in before the doors even open. Every time.',
    'Prunin\u2019 is above my pay grade, sugar.',
    'The loom\u2019s fine. I checked. Twice.'
  ];
  let missLineIdx = 0;

  let audioCtx = null;
  function missChime() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audioCtx.currentTime;
      [880, 1174].forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + i * 0.09);
        g.gain.exponentialRampToValueAtTime(0.06, t0 + i * 0.09 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.09 + 0.22);
        o.connect(g).connect(audioCtx.destination);
        o.start(t0 + i * 0.09);
        o.stop(t0 + i * 0.09 + 0.25);
      });
    } catch (e) { /* silence is also very TVA */ }
  }

  let missScareTimer = null;
  let missSmugTimer = null;
  let missCloseDismissals = 0;
  let missInversionTimer = null;

  function presentMiss(text, scare, withSound) {
    if (!miss) return;
    if (withSound) missChime();
    if (missBubble) {
      if (text) {
        missBubble.textContent = text;
      } else {
        missBubble.textContent = missLines[missLineIdx % missLines.length];
        missLineIdx++;
      }
    }
    clearTimeout(missScareTimer);
    clearTimeout(missSmugTimer);
    miss.classList.remove('is-smug');
    miss.classList.remove('is-scared');
    miss.classList.add('is-here');
    miss.setAttribute('aria-hidden', 'false');
    if (scare) {
      miss.classList.add('is-scared');
      missScareTimer = setTimeout(() => miss.classList.remove('is-scared'), 950);
      if (!prefersReducedMotion) {
        document.body.classList.add('is-glitching');
        setTimeout(() => document.body.classList.remove('is-glitching'), 480);
      }
    }
    // The smile turns smug shortly after arrival
    missSmugTimer = setTimeout(() => miss.classList.add('is-smug'), 1400);
    clearTimeout(missTimer);
    missTimer = setTimeout(dismissMiss, 7000);
  }

  function summonMiss(scare, withSound) {
    presentMiss(null, scare, withSound);
  }

  function summonMissLine(text, scare) {
    presentMiss(text, scare, false);
  }

  function dismissMiss() {
    if (!miss) return;
    miss.classList.remove('is-here');
    miss.classList.remove('is-scared');
    miss.setAttribute('aria-hidden', 'true');
    clearTimeout(missTimer);
    clearTimeout(missScareTimer);
    clearTimeout(missSmugTimer);
  }

  function registerMissCloseDismissal() {
    missCloseDismissals++;
    if (missCloseDismissals < 3) return;
    missCloseDismissals = 0;
    clearTimeout(missInversionTimer);
    document.body.classList.add('is-inverted');
    missInversionTimer = setTimeout(() => {
      document.body.classList.remove('is-inverted');
      summonMissLine('I warned you twice, darlin\u2019.', false);
    }, prefersReducedMotion ? 4000 : 10000);
  }

  if (missClose) {
    missClose.addEventListener('click', () => {
      const wasHere = miss && miss.classList.contains('is-here');
      dismissMiss();
      if (wasHere) registerMissCloseDismissal();
    });
  }
  if (miss) {
    miss.addEventListener('pointerenter', () => clearTimeout(missTimer));
    miss.addEventListener('pointerleave', () => { missTimer = setTimeout(dismissMiss, 2500); });
    // She introduces herself once, if a visitor lingers
    setTimeout(() => {
      if (!missIdleFired) { missIdleFired = true; summonMiss(true, false); }
    }, 26000);
  }
  if (tvaSeal) {
    const sealSummon = () => {
      tvaSeal.classList.remove('is-spinning');
      void tvaSeal.getBoundingClientRect();
      tvaSeal.classList.add('is-spinning');
      summonMiss(false, true);
      showToast('The seal accepts your appeal.');
    };
    tvaSeal.addEventListener('click', sealSummon);
    tvaSeal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sealSummon(); }
    });
  }

  /* ---------- Timeline traversal progress ---------- */
  const timelineBar = document.getElementById('timelineBar');
  if (timelineBar) {
    let ticking = false;
    const updateBar = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, scrollY / max) : 0;
      timelineBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      ticking = false;
    };
    addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateBar); }
    }, { passive: true });
    updateBar();
  }

  /* ---------- Temporal coordinates (pointer) ---------- */
  const tCoords = document.getElementById('tCoords');
  if (tCoords && canHover) {
    let coordPending = false;
    addEventListener('pointermove', (e) => {
      if (coordPending) return;
      coordPending = true;
      requestAnimationFrame(() => {
        const x = String(Math.round((e.clientX / innerWidth) * 999)).padStart(3, '0');
        const y = String(Math.round((e.clientY / innerHeight) * 999)).padStart(3, '0');
        tCoords.textContent = 'X ' + x + ' · Y ' + y;
        coordPending = false;
      });
    }, { passive: true });
  }

  /* ---------- Temporal audit mode ---------- */
  const auditBtn = document.getElementById('auditBtn');
  if (auditBtn) {
    auditBtn.addEventListener('click', () => {
      const on = document.body.classList.toggle('audit');
      auditBtn.setAttribute('aria-pressed', String(on));
      auditBtn.textContent = on ? 'End Audit' : 'Run Temporal Audit';
      showToast(on ? 'Temporal audit running — timeline holding.' : 'Audit closed. As you were.');
    });
  }

  /* ---------- Timeline field (canvas behind the ID card) ---------- */
  const canvas = document.getElementById('timelineCanvas');
  const cardZone = document.querySelector('.card-zone');
  if (canvas && cardZone) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, threads = [], running = false, rafId = null;
    const pointer = { x: -9999, y: -9999 };

    function buildField() {
      const r = cardZone.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(300, r.width); H = Math.max(300, r.height);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      threads = [];
      const count = 6;
      for (let i = 0; i < count; i++) {
        const baseY = (H / (count + 1)) * (i + 1);
        const nodes = [];
        const nodeCount = 3 + (i % 3);
        for (let j = 0; j < nodeCount; j++) {
          nodes.push({ fx: (j + 0.5 + (i % 2) * 0.22) / nodeCount, phase: Math.random() * Math.PI * 2, r: 2 + Math.random() * 2.2 });
        }
        threads.push({
          baseY, amp: 14 + Math.random() * 26, speed: 0.12 + Math.random() * 0.2,
          phase: Math.random() * Math.PI * 2,
          color: i % 3 === 2 ? '20,69,61' : '217,93,30',
          nodes
        });
      }
    }

    function drawField(t) {
      ctx.clearRect(0, 0, W, H);
      const time = t * 0.001;
      threads.forEach((th) => {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 14) {
          const y = th.baseY + Math.sin(x * 0.006 + th.phase + time * th.speed) * th.amp
            + Math.sin(x * 0.017 + th.phase * 2) * th.amp * 0.3;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(' + th.color + ',0.28)';
        ctx.lineWidth = 1;
        ctx.stroke();
        th.nodes.forEach((nd) => {
          const x = nd.fx * W;
          const y = th.baseY + Math.sin(x * 0.006 + th.phase + time * th.speed) * th.amp
            + Math.sin(x * 0.017 + th.phase * 2) * th.amp * 0.3
            + Math.sin(time * 0.9 + nd.phase) * 3;
          const dx = x - pointer.x, dy = y - pointer.y;
          const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 170);
          ctx.beginPath();
          ctx.arc(x, y, nd.r + near * 2.6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + th.color + ',' + (0.35 + near * 0.55) + ')';
          ctx.fill();
          if (near > 0.25) {
            ctx.beginPath();
            ctx.arc(x, y, nd.r + 6 + near * 8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(' + th.color + ',' + (near * 0.5) + ')';
            ctx.stroke();
          }
        });
      });
    }

    function loop(t) {
      if (!running) return;
      drawField(t || 0);
      rafId = requestAnimationFrame(loop);
    }

    function startField() {
      if (running) return;
      if (prefersReducedMotion) { drawField(1200); return; }
      running = true;
      rafId = requestAnimationFrame(loop);
    }
    function stopField() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    buildField();
    drawField(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting && !document.hidden) startField(); else stopField(); });
      }, { threshold: 0.02 }).observe(cardZone);
    } else { startField(); }
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopField(); else startField(); });
    cardZone.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    });
    cardZone.addEventListener('pointerleave', () => { pointer.x = -9999; pointer.y = -9999; });
    let resizeTimer = null;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { buildField(); if (!running) drawField(0); }, 180);
    });
  }

  /* ---------- Orientation Film 1130-B ---------- */
  const filmBtn = document.getElementById('filmBtn');
  const filmOverlay = document.getElementById('filmOverlay');
  const filmClose = document.getElementById('filmClose');
  const filmPause = document.getElementById('filmPause');
  const filmRestart = document.getElementById('filmRestart');
  const leaderCount = document.getElementById('leaderCount');
  const filmSlides = filmOverlay ? Array.from(filmOverlay.querySelectorAll('[data-film-slide]')) : [];
  const filmFills = filmOverlay ? Array.from(filmOverlay.querySelectorAll('.film-segment-fill')) : [];
  let filmOpen = false;
  let filmPaused = false;
  let filmEnded = false;
  let filmStep = 0;
  let filmElapsed = 0;
  let filmStartedAt = 0;
  let filmTimeout = null;
  let filmTick = null;
  let filmLastFocus = null;

  function filmDuration(step) {
    if (step === 0) return prefersReducedMotion ? 1200 : 2100;
    return prefersReducedMotion ? 1800 : 2400;
  }

  function clearFilmTimers() {
    clearTimeout(filmTimeout);
    clearInterval(filmTick);
    filmTimeout = null;
    filmTick = null;
  }

  function renderFilm() {
    const duration = filmDuration(filmStep);
    const progress = Math.min(1, filmElapsed / duration);
    filmSlides.forEach((slide, idx) => {
      slide.classList.toggle('is-active', idx === filmStep);
    });
    filmFills.forEach((fill, idx) => {
      fill.style.width = idx < filmStep ? '100%' : idx === filmStep ? (progress * 100).toFixed(1) + '%' : '0%';
    });
    if (leaderCount && filmStep === 0) {
      const count = 3 - Math.floor(filmElapsed / (duration / 3));
      leaderCount.textContent = String(Math.max(1, Math.min(3, count)));
    }
  }

  function startFilmClock() {
    clearFilmTimers();
    if (!filmOpen || filmPaused || filmEnded) return;
    filmStartedAt = performance.now() - filmElapsed;
    filmTick = setInterval(() => {
      filmElapsed = performance.now() - filmStartedAt;
      renderFilm();
    }, 50);
    filmTimeout = setTimeout(advanceFilm, Math.max(0, filmDuration(filmStep) - filmElapsed));
    renderFilm();
  }

  function showFilmStep(step) {
    filmStep = step;
    filmElapsed = 0;
    filmEnded = false;
    filmPaused = false;
    if (filmPause) {
      filmPause.textContent = 'Pause';
      filmPause.setAttribute('aria-pressed', 'false');
    }
    renderFilm();
    startFilmClock();
  }

  function advanceFilm() {
    if (!filmOpen) return;
    if (filmStep >= filmSlides.length - 1) {
      filmElapsed = filmDuration(filmStep);
      filmEnded = true;
      filmPaused = true;
      clearFilmTimers();
      renderFilm();
      if (filmPause) {
        filmPause.textContent = 'Play';
        filmPause.setAttribute('aria-pressed', 'true');
      }
      return;
    }
    showFilmStep(filmStep + 1);
  }

  function setFilmPaused(paused) {
    if (!filmOpen) return;
    if (filmEnded && paused) return;
    if (filmEnded && !paused) {
      showFilmStep(0);
      return;
    }
    if (paused) {
      filmElapsed = performance.now() - filmStartedAt;
      filmPaused = true;
      clearFilmTimers();
      renderFilm();
    } else {
      filmPaused = false;
      startFilmClock();
    }
    if (filmPause) {
      filmPause.textContent = filmPaused ? 'Play' : 'Pause';
      filmPause.setAttribute('aria-pressed', String(filmPaused));
    }
  }

  function restartFilm() {
    if (!filmOpen) return;
    showFilmStep(0);
  }

  function openFilm() {
    if (!filmOverlay) return;
    filmLastFocus = document.activeElement;
    filmOverlay.hidden = false;
    filmOpen = true;
    requestAnimationFrame(() => filmOverlay.classList.add('is-open'));
    showFilmStep(0);
    if (filmClose) filmClose.focus({ preventScroll: true });
  }

  function closeFilm() {
    if (!filmOverlay || !filmOpen) return;
    clearFilmTimers();
    filmOpen = false;
    filmPaused = false;
    filmOverlay.classList.remove('is-open');
    filmOverlay.hidden = true;
    if (filmLastFocus && typeof filmLastFocus.focus === 'function') {
      filmLastFocus.focus({ preventScroll: true });
    }
  }

  if (filmBtn) filmBtn.addEventListener('click', openFilm);
  if (filmClose) filmClose.addEventListener('click', closeFilm);
  if (filmRestart) filmRestart.addEventListener('click', restartFilm);
  if (filmPause) filmPause.addEventListener('click', () => setFilmPaused(!filmPaused));
  if (filmOverlay) {
    filmOverlay.addEventListener('click', (e) => {
      if (e.target === filmOverlay) closeFilm();
    });
  }

  /* ---------- Prune Variant (absolutely do not press) ---------- */
  const pruneBtn = document.getElementById('pruneBtn');
  const pruneVeil = document.getElementById('pruneVeil');
  const pruneCountdown = document.getElementById('pruneCountdown');
  const pruneCountNumber = document.getElementById('pruneCountNumber');
  const mainEl = document.querySelector('main');
  let pruning = false;
  let pruneAbortReadyAt = 0;
  let pruneTimers = [];
  let pruneVeilTimer = null;

  function pruneLater(fn, delay) {
    const id = setTimeout(fn, delay);
    pruneTimers.push(id);
    return id;
  }

  function clearPruneTimers() {
    pruneTimers.forEach((id) => clearTimeout(id));
    pruneTimers = [];
  }

  function setPruneCount(value) {
    if (pruneCountNumber) pruneCountNumber.textContent = String(value);
  }

  function restorePrune(assistantIntervenes) {
    if (!pruning) return;
    pruning = false;
    clearPruneTimers();
    document.body.classList.remove('is-pruning');
    if (mainEl) mainEl.classList.remove('pruning');
    if (pruneCountdown) pruneCountdown.classList.remove('is-visible');
    if (pruneBtn) pruneBtn.disabled = false;
    if (pruneVeil) {
      pruneVeil.classList.remove('is-active');
      pruneVeil.classList.add('is-restored');
      clearTimeout(pruneVeilTimer);
      pruneVeilTimer = setTimeout(() => pruneVeil.classList.remove('is-restored'), 650);
    }
    if (assistantIntervenes) {
      summonMissLine('Nice try, sugar. This variant is under MY protection.', false);
      showToast('Timeline restored by the assistant.');
    }
  }

  function startPrune() {
    if (pruning) return;
    pruning = true;
    pruneAbortReadyAt = performance.now() + 1000;
    if (pruneBtn) pruneBtn.disabled = true;
    if (pruneVeil) {
      pruneVeil.classList.remove('is-restored');
      pruneVeil.classList.add('is-active');
    }
    document.body.classList.add('is-pruning');
    if (mainEl) mainEl.classList.add('pruning');
    if (pruneCountdown) pruneCountdown.classList.add('is-visible');
    setPruneCount(3);
    pruneLater(() => setPruneCount(2), 900);
    pruneLater(() => setPruneCount(1), 1800);
    pruneLater(() => setPruneCount(0), 2700);
    pruneLater(() => restorePrune(true), 3800);
    pruneLater(() => restorePrune(false), 5000);
  }

  if (pruneBtn) pruneBtn.addEventListener('click', startPrune);
  document.addEventListener('click', () => {
    if (pruning && performance.now() >= pruneAbortReadyAt) restorePrune(false);
  });

  /* ---------- TemPad ---------- */
  const tempadBtn = document.getElementById('tempadBtn');
  const tempadOverlay = document.getElementById('tempadOverlay');
  const tempadClose = document.getElementById('tempadClose');
  const tempadStatus = document.getElementById('tempadStatus');
  let tempadOpen = false;
  let tempadNavigating = false;
  let tempadNavTimer = null;
  let tempadLastFocus = null;

  function setTempadStatus(text) {
    if (tempadStatus) tempadStatus.textContent = text;
  }

  function openTempad() {
    if (!tempadOverlay || tempadOpen) return;
    tempadLastFocus = document.activeElement;
    tempadOverlay.hidden = false;
    tempadOpen = true;
    tempadNavigating = false;
    tempadOverlay.classList.remove('is-opening');
    setTempadStatus('Coordinates locked to Bengaluru Branch.');
    requestAnimationFrame(() => tempadOverlay.classList.add('is-open'));
    const firstDestination = tempadOverlay.querySelector('.tempad-destination');
    if (firstDestination) firstDestination.focus({ preventScroll: true });
  }

  function closeTempad() {
    if (!tempadOverlay || !tempadOpen) return;
    clearTimeout(tempadNavTimer);
    tempadNavTimer = null;
    tempadNavigating = false;
    tempadOpen = false;
    tempadOverlay.classList.remove('is-open');
    tempadOverlay.classList.remove('is-opening');
    tempadOverlay.hidden = true;
    setTempadStatus('Coordinates locked to Bengaluru Branch.');
    if (tempadLastFocus && typeof tempadLastFocus.focus === 'function') {
      tempadLastFocus.focus({ preventScroll: true });
    }
  }

  if (tempadBtn) tempadBtn.addEventListener('click', openTempad);
  if (tempadClose) tempadClose.addEventListener('click', closeTempad);
  if (tempadOverlay) {
    tempadOverlay.addEventListener('click', (e) => {
      if (e.target === tempadOverlay) closeTempad();
    });
    tempadOverlay.querySelectorAll('.tempad-destination').forEach((destination) => {
      destination.addEventListener('click', () => {
        const url = destination.getAttribute('data-tempad-url');
        if (!url || tempadNavigating) return;
        tempadNavigating = true;
        tempadOverlay.classList.add('is-opening');
        const platformEl = destination.querySelector('.tempad-platform');
        const platform = platformEl ? platformEl.textContent.trim() : 'the selected branch';
        setTempadStatus('Opening a time door to ' + platform + '…');
        tempadNavTimer = setTimeout(() => {
          if (!tempadOpen) return;
          if (url.indexOf('mailto:') === 0) {
            window.location.href = url;
          } else {
            window.open(url, '_blank', 'noopener');
          }
          tempadNavigating = false;
          closeTempad();
        }, prefersReducedMotion ? 120 : 650);
      });
    });
  }

  /* ---------- Public intake: Variant Generator ---------- */
  const variantForm = document.getElementById('variantForm');
  const variantName = document.getElementById('variantName');
  const offenseSelect = document.getElementById('offenseSelect');
  const variantResult = document.getElementById('variantResult');
  const variantPlaceholder = '<p class="variant-placeholder">Awaiting intake. Your file will appear here, stamped and regrettably official.</p>';

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function djb2Hash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  if (variantForm && variantName && offenseSelect && variantResult) {
    variantForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const displayName = variantName.value.trim().replace(/\s+/g, ' ') || 'UNNAMED VARIANT';
      const words = displayName.split(' ');
      const surnameRaw = words[words.length - 1];
      const givenRaw = words.length > 1 ? words.slice(0, -1).join(' ') : '—';
      const offense = offenseSelect.value;
      const selectedOption = offenseSelect.options[offenseSelect.selectedIndex];
      const department = selectedOption ? (selectedOption.getAttribute('data-department') || '') : '';
      const hash = djb2Hash(displayName + '|' + offense);
      const initialMatch = surnameRaw.match(/[A-Za-z]/) || displayName.match(/[A-Za-z]/);
      const initial = initialMatch ? initialMatch[0].toUpperCase() : 'X';
      const variantNo = initial + '-' + String(1000 + (hash % 9000));
      const clearance = 'Level ' + ((hash % 9) + 1);
      const surname = escapeHtml(surnameRaw.toUpperCase());
      const given = escapeHtml(givenRaw.toUpperCase());
      variantResult.innerHTML =
        '<article class="variant-card">' +
          '<header class="variant-card-head">' +
            '<span class="variant-mini-seal" aria-hidden="true">TVA</span>' +
            '<span class="variant-card-heading"><span class="variant-card-kicker">Public Intake Copy</span><span class="variant-card-title">Variant Identification</span></span>' +
            '<span class="variant-stamp" aria-hidden="true">Filed</span>' +
          '</header>' +
          '<dl class="variant-fields">' +
            '<div><dt>Surname</dt><dd>' + surname + '</dd></div>' +
            '<div><dt>Given Name</dt><dd>' + given + '</dd></div>' +
            '<div><dt>Variant Nº</dt><dd>' + escapeHtml(variantNo) + '</dd></div>' +
            '<div><dt>Clearance</dt><dd>' + escapeHtml(clearance) + '</dd></div>' +
            '<div class="variant-field--wide"><dt>Department</dt><dd>' + escapeHtml(department) + '</dd></div>' +
            '<div class="variant-field--wide"><dt>Status</dt><dd>' + escapeHtml(offense) + '</dd></div>' +
          '</dl>' +
          '<p class="variant-card-foot">Intake Nº ' + escapeHtml(variantNo) + ' · Bengaluru Branch · Forgotten on departure</p>' +
          '<button class="variant-reset" type="button" data-reset-variant>File another</button>' +
        '</article>';
    });

    variantResult.addEventListener('click', (e) => {
      if (!e.target.closest('[data-reset-variant]')) return;
      variantForm.reset();
      variantResult.innerHTML = variantPlaceholder;
      variantName.focus({ preventScroll: true });
    });
  }

  /* ---------- Shared keyboard controls ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (filmOpen) { closeFilm(); return; }
      if (tempadOpen) { closeTempad(); return; }
      if (pruning) { restorePrune(false); return; }
    }
    const target = e.target;
    const typing = target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    );
    if ((e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey && !e.altKey && !typing && !filmOpen && !tempadOpen) {
      e.preventDefault();
      openTempad();
    }
  });

})();
