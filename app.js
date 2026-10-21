/* TVA Personnel File — Variant E-1130. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  /* Boot watchdog disarm: the head script removes the `js` class after
     3s if this flag never lands, so a failed script load can never
     leave JS-armed hidden states (reveals, fields, stamp) stuck. */
  window.__tvaAppReady = true;
  if (window.__tvaBootWatchdog) clearTimeout(window.__tvaBootWatchdog);

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Scroll reveals ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  function nudgeMain() {
    const m = document.querySelector('main');
    if (!m) return;
    m.classList.remove('is-nudged');
    void m.offsetWidth;
    m.classList.add('is-nudged');
    setTimeout(() => m.classList.remove('is-nudged'), 200);
  }
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      let batch = 0;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          // paper-feed cascade: sections arriving together settle 60ms apart
          el.style.transitionDelay = (batch++ * 60) + 'ms';
          el.classList.add('is-visible');
          if (el.classList.contains('file')) {
            el.classList.add('is-opened');
            nudgeMain();
          }
          if (el.id === 'file-02') {
            // the signal cards file in one by one (CSS holds their
            // per-card delays only while this class is on)
            el.classList.add('is-cascading');
            setTimeout(() => el.classList.remove('is-cascading'), 1000);
          }
          io.unobserve(el);
          setTimeout(() => { el.style.transitionDelay = ''; }, 1100);
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
      }, 780);
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
        idCard.style.setProperty('--ry', (px * 2.5).toFixed(2) + 'deg');
        idCard.style.setProperty('--rx', (-py * 2.5).toFixed(2) + 'deg');
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
  const flapH = document.getElementById('flapH');
  const flapM = document.getElementById('flapM');
  const flapS = document.getElementById('flapS');
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
        // Split-flap tiles mirror the (screen-reader) time element; the
        // seconds tile gets a tiny mechanical settle each tick.
        if (flapH && flapM && flapS) {
          const parts = chronoClock.textContent.split(':');
          if (parts.length === 3) {
            if (flapH.textContent !== parts[0]) flapH.textContent = parts[0];
            if (flapM.textContent !== parts[1]) flapM.textContent = parts[1];
            if (flapS.textContent !== parts[2]) {
              flapS.textContent = parts[2];
              if (!prefersReducedMotion) {
                flapS.classList.remove('is-tick');
                void flapS.offsetWidth;
                flapS.classList.add('is-tick');
              }
            }
          }
        }
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

  // Inject a strength meter into each signal card
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
    const cal = document.createElement('span');
    cal.className = 'meter-cal';
    cal.setAttribute('aria-hidden', 'true');
    cal.textContent = 'Cal. 1974 · TVA Metrology';
    dataP.appendChild(cal);
  });
  /* Odometer drums: each live count is rebuilt as a row of mechanical
     digit cells (a 0–9 strip behind a recessed window). The strips roll
     whenever the count changes; the plain printed figure remains the
     no-JS fallback and the aria-label keeps the value readable. */
  function renderOdometer(el, n) {
    const wrap = el.querySelector('.odo-digits');
    if (!wrap) { el.textContent = Number(n).toLocaleString('en-IN'); return; }
    const str = String(Math.max(0, Math.round(n)));
    while (wrap.children.length < str.length) {
      const cell = document.createElement('span');
      cell.className = 'odo-cell';
      const strip = document.createElement('span');
      strip.className = 'odo-strip';
      for (let d = 0; d <= 9; d++) {
        const dg = document.createElement('span');
        dg.className = 'odo-digit';
        dg.textContent = String(d);
        strip.appendChild(dg);
      }
      cell.appendChild(strip);
      wrap.appendChild(cell);
    }
    while (wrap.children.length > str.length) wrap.removeChild(wrap.lastChild);
    for (let i = 0; i < str.length; i++) {
      const strip = wrap.children[i].firstChild;
      strip.style.transform = 'translateY(' + (-parseInt(str[i], 10) * 1.06).toFixed(2) + 'em)';
    }
  }
  function buildOdometer(el, n) {
    el.setAttribute('aria-label', Number(n).toLocaleString('en-IN'));
    el.textContent = '';
    const wrap = document.createElement('span');
    wrap.className = 'odo-digits';
    wrap.setAttribute('aria-hidden', 'true');
    el.appendChild(wrap);
    renderOdometer(el, n);
  }
  document.querySelectorAll('[data-live]').forEach((el) => {
    const key = el.getAttribute('data-live');
    if (Number.isFinite(liveState[key])) buildOdometer(el, liveState[key]);
  });

  /* No grand total: summing followers across platforms counts the same
     people repeatedly and means nothing, so the readout was removed
     (2026-10-22, user-spotted). Per-signal counts only. */

  function refreshMeters(changedKey) {
    const max = Math.max(1, ...Object.values(liveState));
    Object.keys(meterFills).forEach((key) => {
      const n = liveState[key] || 0;
      const pct = Math.max(3, (Math.sqrt(n) / Math.sqrt(max)) * 100);
      meterFills[key].style.transform = 'scaleX(' + (pct / 100).toFixed(3) + ')';
      const meterEl = meterFills[key].parentElement;
      if (meterEl) meterEl.style.setProperty('--needle', (pct / 100).toFixed(3));
    });
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
    const wrap = el.querySelector('.odo-digits');
    if (prefersReducedMotion || from === to) {
      if (wrap) renderOdometer(el, to);
      else el.textContent = Number(to).toLocaleString('en-IN');
      el.setAttribute('aria-label', Number(to).toLocaleString('en-IN'));
      return;
    }
    if (wrap) wrap.classList.add('is-rolling');
    const start = performance.now();
    const dur = 750;
    (function step(t) {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(from + (to - from) * eased);
      if (wrap) renderOdometer(el, val);
      else el.textContent = val.toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(step);
      else {
        if (wrap) wrap.classList.remove('is-rolling');
        el.setAttribute('aria-label', Number(to).toLocaleString('en-IN'));
      }
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

  /* ---------- The TVA seal ---------- */
  const tvaSeal = document.getElementById('tvaSeal');
  let audioCtx = null;
  function sealChime() {
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

  if (tvaSeal) {
    const sealPress = () => {
      tvaSeal.classList.remove('is-spinning');
      void tvaSeal.getBoundingClientRect();
      tvaSeal.classList.add('is-spinning');
      sealChime();
      showToast('The seal accepts your appeal.');
    };
    tvaSeal.addEventListener('click', sealPress);
    tvaSeal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sealPress(); }
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
      // the node at the thread's leading edge rides the same value
      timelineBar.parentElement.style.setProperty('--p', p.toFixed(4));
      ticking = false;
    };
    addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateBar); }
    }, { passive: true });
    updateBar();
  }

  /* ---------- Scrollspy: mark the file currently on the reader's desk ---------- */
  const spyTabs = document.querySelectorAll('.file-tab[data-spy]');
  if (spyTabs.length && 'IntersectionObserver' in window) {
    const spyById = {};
    spyTabs.forEach((tab) => { spyById[tab.getAttribute('data-spy')] = tab; });
    let spyCurrent = null;
    const spySet = (id) => {
      if (id === spyCurrent) return;
      spyCurrent = id;
      spyTabs.forEach((tab) => {
        const on = tab.getAttribute('data-spy') === id;
        tab.classList.toggle('is-active', on);
        if (on) tab.setAttribute('aria-current', 'true');
        else tab.removeAttribute('aria-current');
      });
    };
    // a section counts as current while it crosses the desk's middle band
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) spySet(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    Object.keys(spyById).forEach((id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
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
  const crtFlash = document.getElementById('crtFlash');
  if (auditBtn) {
    auditBtn.addEventListener('click', () => {
      const on = document.body.classList.toggle('audit');
      // CRT power-on: a bright amber line blooms open for 280ms (power-off is a plain fade)
      if (on && crtFlash && !prefersReducedMotion) {
        crtFlash.classList.remove('is-on');
        void crtFlash.offsetWidth;
        crtFlash.classList.add('is-on');
        setTimeout(() => crtFlash.classList.remove('is-on'), 400);
      }
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
    let W = 0, H = 0, threads = [], running = false, rafId = null, heroVisible = false;
    let branches = [], redlineY = 0, redFlash = null, spawnCount = 0;
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
          color: i % 3 === 2 ? '20,69,61' : '232,100,28',
          colorAudit: i % 3 === 2 ? '47,143,107' : '255,176,0',
          nodes
        });
      }
      branches = [];
      redFlash = null;
      redlineY = Math.max(54, H * 0.16);
    }

    /* Branches: threads that leave the loom field and climb toward the
       REDLINE. Most think better of it and curl back; the daring ones
       touch the line, flash, and get pruned back. Population is capped. */
    const MAX_BRANCHES = 7;
    function spawnBranch(seeded) {
      spawnCount += 1;
      const green = spawnCount % 3 === 2;
      branches.push({
        x0: W * (0.06 + Math.random() * 0.88),
        len: 60 + Math.random() * (H * 0.34),
        tip: seeded ? 30 + Math.random() * 90 : 6,
        drift: (Math.random() - 0.5) * 130,
        sway: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.8,
        curl: 0,
        state: 'grow',
        flashT: 0,
        daring: Math.random() < 0.3,
        color: green ? '20,69,61' : '232,100,28',
        colorAudit: green ? '47,143,107' : '255,176,0'
      });
    }
    function updateBranches() {
      if (!branches.length) {
        for (let i = 0; i < 4; i++) spawnBranch(true);
      } else if (branches.length < MAX_BRANCHES && Math.random() < 0.012) {
        spawnBranch(false);
      }
      branches.forEach((br) => {
        if (br.state === 'grow') {
          br.tip += br.speed;
          if (br.tip >= br.len) {
            br.tip = br.len;
            if (br.daring) {
              br.state = 'flash';
              br.flashT = 0;
              redFlash = { x: br.x0 + br.drift, t: 0 };
            } else {
              br.state = 'curl';
            }
          }
        } else if (br.state === 'curl') {
          br.curl = Math.min(1, br.curl + 0.03);
          br.tip -= br.speed * 0.35;
          if (br.curl >= 1) br.state = 'retract';
        } else if (br.state === 'flash') {
          br.flashT += 16;
          br.tip -= br.speed * 2.4;
          if (br.flashT > 240) br.state = 'retract';
        } else {
          br.tip -= br.speed * 1.7;
          br.curl = Math.max(0, br.curl - 0.03);
        }
      });
      branches = branches.filter((br) => !(br.state === 'retract' && br.tip <= 5));
      if (redFlash) {
        redFlash.t += 16;
        if (redFlash.t > 320) redFlash = null;
      }
    }
    function drawBranches(inAudit) {
      branches.forEach((br) => {
        let col = inAudit ? br.colorAudit : br.color;
        let alpha = 0.42;
        if (br.state === 'flash') {
          col = inAudit ? '255,122,26' : '179,53,43';
          alpha = 0.85;
        } else if (br.state === 'grow' && br.tip / br.len > 0.82) {
          col = '255,150,20';
          alpha = 0.65;
        }
        ctx.beginPath();
        const steps = 14;
        for (let i = 0; i <= steps; i++) {
          const s = i / steps;
          const x = br.x0 + br.drift * s + Math.sin(s * 2.4 + br.sway) * 7 * s + br.curl * 30 * s * s;
          const y = redlineY + br.tip * s - br.curl * 34 * s * s;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(' + col + ',' + alpha + ')';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        const tx = br.x0 + br.drift + Math.sin(2.4 + br.sway) * 7 + br.curl * 30;
        const ty = redlineY + br.tip - br.curl * 34;
        ctx.beginPath();
        ctx.arc(tx, ty, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + col + ',' + Math.min(1, alpha + 0.2) + ')';
        ctx.fill();
      });
      if (redFlash) {
        const p = redFlash.t / 320;
        const fc = inAudit ? '255,122,26' : '179,53,43';
        const g = ctx.createRadialGradient(redFlash.x, redlineY, 0, redFlash.x, redlineY, 46);
        g.addColorStop(0, 'rgba(' + fc + ',' + (0.5 * (1 - p)).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(' + fc + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(redFlash.x, redlineY, 46, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawField(t) {
      // Phosphor afterglow: rather than a hard clear, each frame lays a
      // translucent destination-out wash over the field, so threads and
      // branches leave a short fading trail, like an old monitor. No
      // shadowBlur anywhere; the wash is one fillRect per frame.
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      const time = t * 0.001;
      // audit mode re-inks the threads amber/green, like the rest of the terminal
      const inAudit = document.body.classList.contains('audit');
      threads.forEach((th) => {
        const tc = inAudit ? th.colorAudit : th.color;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 14) {
          const y = th.baseY + Math.sin(x * 0.006 + th.phase + time * th.speed) * th.amp
            + Math.sin(x * 0.017 + th.phase * 2) * th.amp * 0.3;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(' + tc + ',0.28)';
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
          ctx.fillStyle = 'rgba(' + tc + ',' + (0.35 + near * 0.55) + ')';
          ctx.fill();
          if (near > 0.25) {
            ctx.beginPath();
            ctx.arc(x, y, nd.r + 6 + near * 8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(' + tc + ',' + (near * 0.5) + ')';
            ctx.stroke();
          }
        });
      });

      // REDLINE: the dashed threshold the branches are not to cross,
      // drawn in the field's current ink (paper red, audit amber).
      ctx.save();
      ctx.strokeStyle = inAudit ? 'rgba(255,122,26,0.55)' : 'rgba(179,53,43,0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(0, redlineY);
      ctx.lineTo(W, redlineY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '600 8px "IBM Plex Mono", monospace';
      ctx.fillStyle = inAudit ? 'rgba(255,176,0,0.8)' : 'rgba(179,53,43,0.75)';
      ctx.fillText('REDLINE', 8, redlineY - 6);
      ctx.restore();
      updateBranches();
      drawBranches(inAudit);
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
        entries.forEach((en) => {
          heroVisible = en.isIntersecting;
          if (heroVisible && !document.hidden) startField(); else stopField();
        });
      }, { threshold: 0.02 }).observe(cardZone);
    } else { heroVisible = true; startField(); }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopField();
      else if (heroVisible) startField();
    });
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

  /* ---------- Timeslipping (the filed photograph is unstable) ----------
     Activating the photo window — click, tap, Enter/Space, or the S key —
     slips the whole ID card for ~950ms, and it is a SLIP, not a shake:
     the card melts. An SVG displacement filter (#slipWarp in index.html)
     warps the card's own rendering while a requestAnimationFrame driver
     ramps the displacement scale 0 → ~72 → 0 with a baseFrequency drift,
     and a CSS elastic track squashes, stretches the card like taffy,
     then snaps it back through two decaying wobble beats. The pull
     direction alternates per trigger (--slip-dir). If SVG filters are
     unavailable the elastic transforms alone still read as a stretch.
     Re-entry is guarded; the rAF, the filter, the class, and every timer
     are cleaned up at the end. Reduced motion: just the toast. */
  const photoWindow = document.getElementById('photoWindow');
  const slipLines = [
    'Timeslipping detected. It is not a dance move.',
    'Variant slipped 0.3 seconds. Barely worth the paperwork.',
    'Please hold still — the timeline is trying to file you.'
  ];
  const slipTurb = document.getElementById('slipTurb');
  const slipDisp = document.getElementById('slipDisp');
  const SLIP_MS = 950;
  let slipIndex = 0;
  let slipping = false;
  let slipTimers = [];
  let slipRaf = null;
  let slipDir = -1;

  function slipLater(fn, delay) {
    const id = setTimeout(fn, delay);
    slipTimers.push(id);
    return id;
  }

  function setSlipScale(value) {
    if (slipDisp) slipDisp.setAttribute('scale', value.toFixed(1));
  }

  function endTimeslip() {
    slipTimers.forEach((id) => clearTimeout(id));
    slipTimers = [];
    if (slipRaf !== null) { cancelAnimationFrame(slipRaf); slipRaf = null; }
    setSlipScale(0);
    if (idCard) {
      idCard.classList.remove('is-timeslipping');
      idCard.style.removeProperty('filter');
      idCard.style.removeProperty('--slip-dir');
    }
    slipping = false;
  }

  /* The molten envelope: a fast melt-in to the stretch peak (~34% in),
     then an elastic decay whose sine term gives the warp two dying
     wobbles of its own, in step with the CSS transform track. */
  function runSlipWarp(startedAt) {
    function frame(now) {
      if (!slipping) return;
      const t = Math.min((now - startedAt) / SLIP_MS, 1);
      let env;
      if (t < 0.34) {
        const u = t / 0.34;
        env = 1 - Math.pow(1 - u, 3);
      } else {
        const u = (t - 0.34) / 0.66;
        env = Math.pow(1 - u, 2) * (1 + 0.35 * Math.sin(u * Math.PI * 4) * (1 - u));
      }
      setSlipScale(72 * Math.max(0, Math.min(env, 1)));
      if (slipTurb) {
        const melt = Math.sin(t * Math.PI);
        slipTurb.setAttribute(
          'baseFrequency',
          (0.012 + 0.010 * melt).toFixed(4) + ' ' + (0.09 + 0.02 * Math.sin(t * Math.PI * 2)).toFixed(4)
        );
      }
      if (t < 1) slipRaf = requestAnimationFrame(frame);
      else slipRaf = null;
    }
    slipRaf = requestAnimationFrame(frame);
  }

  function startTimeslip() {
    if (slipping || !idCard) return;
    showToast(slipLines[slipIndex % slipLines.length]);
    slipIndex += 1;
    if (prefersReducedMotion) return;
    slipping = true;
    slipDir *= -1; // the pull alternates left/right per trigger
    idCard.style.setProperty('--slip-dir', String(slipDir));
    idCard.classList.remove('is-timeslipping');
    void idCard.offsetWidth;
    idCard.classList.add('is-timeslipping');
    if (slipDisp && slipTurb) {
      idCard.style.filter = 'url("#slipWarp")';
      runSlipWarp(performance.now());
    }
    slipLater(endTimeslip, SLIP_MS + 40);
  }

  if (photoWindow) {
    photoWindow.addEventListener('click', startTimeslip);
    photoWindow.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startTimeslip();
      }
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
      const p = idx < filmStep ? 1 : idx === filmStep ? progress : 0;
      fill.style.transform = 'scaleX(' + p.toFixed(3) + ')';
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

  /* ---------- Prune Variant (absolutely do not press) ----------
     Choreographed erosion: the reset charge arms, the page burns away
     bottom-to-top behind a rising erosion front, one loom thread holds
     in the void, the verdict stamp lands — and there it STAYS. Since
     v6.8 the branch is never restored automatically: the terminated
     hold persists until the visitor restores it by hand (the Restore
     Branch control, a click on the thread itself, or the R key).
     Escape or a click (after a 1s grace) aborts only mid-sequence; in
     the hold they do nothing. A narrowed failsafe (see pruneFailsafe)
     guarantees coherence only: an error mid-sequence jumps to the
     terminated state rather than leaving a half-dissolved page with
     no way back. */
  const pruneBtn = document.getElementById('pruneBtn');
  const pruneVeil = document.getElementById('pruneVeil');
  const pruneHud = document.getElementById('pruneHud');
  const pruneHudLabel = document.getElementById('pruneHudLabel');
  const pruneHudCount = document.getElementById('pruneHudCount');
  const pruneHudBarFill = document.getElementById('pruneHudBarFill');
  const pruneFront = document.getElementById('pruneFront');
  const pruneThread = document.getElementById('pruneThread');
  const pruneStampRed = document.getElementById('pruneStampRed');
  const pruneStampAmber = document.getElementById('pruneStampAmber');
  const pruneRestore = document.getElementById('pruneRestore');
  const pruneRestoreBtn = document.getElementById('pruneRestoreBtn');
  let pruning = false;
  let pruneTerminated = false;
  let pruneRestoring = false;
  let pruneAbortReadyAt = 0;
  let pruneTimers = [];
  let pruneVeilTimer = null;

  // Reduced motion compresses the sequence (~60%) and drops the glitch.
  // `failsafe` is now only the coherence-watchdog deadline (see startPrune).
  const PRUNE_T = prefersReducedMotion
    ? { arm: 300, step: 90, glitch: 0, count: 330, voidAt: 1400, restoreSpan: 600, failsafe: 4200 }
    : { arm: 500, step: 150, glitch: 130, count: 550, voidAt: 2300, restoreSpan: 850, failsafe: 5500 };

  function pruneLater(fn, delay) {
    const id = setTimeout(() => {
      try { fn(); } catch (err) { pruneFailsafe(); }
    }, delay);
    pruneTimers.push(id);
    return id;
  }

  // Narrowed failsafe: a mid-sequence error must still land somewhere
  // coherent — the terminated state (with its restore control), or a
  // snap-back if the error hit during restoration. It never restores
  // the page on its own once the branch has terminated.
  function pruneFailsafe() {
    if (!pruning) return;
    if (pruneRestoring) { restorePrune(false); return; }
    if (!pruneTerminated) enterTerminated();
  }

  function clearPruneTimers() {
    pruneTimers.forEach((id) => clearTimeout(id));
    pruneTimers = [];
  }

  // Erosion order: the ground goes first, the control room (strip) last.
  function pruneTargets() {
    const list = [];
    const push = (el) => { if (el) list.push(el); };
    push(document.querySelector('.colophon'));
    push(document.getElementById('annex-intake'));
    push(document.getElementById('file-04'));
    push(document.getElementById('file-03'));
    push(document.getElementById('file-02'));
    push(document.getElementById('file-01'));
    push(document.querySelector('.tva-marquee'));
    push(document.querySelector('.card-zone'));
    push(document.querySelector('.loom-tape'));
    push(document.querySelector('.strip'));
    return list;
  }

  function setPruneHud(label, count) {
    if (pruneHudLabel && label !== null) pruneHudLabel.textContent = label;
    if (pruneHudCount && count !== null) pruneHudCount.textContent = count;
  }

  // Two low klaxon tones through the same WebAudio context as the seal.
  function pruneKlaxon() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audioCtx.currentTime;
      [392, 311].forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + i * 0.17);
        g.gain.exponentialRampToValueAtTime(0.035, t0 + i * 0.17 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.17 + 0.2);
        o.connect(g).connect(audioCtx.destination);
        o.start(t0 + i * 0.17);
        o.stop(t0 + i * 0.17 + 0.22);
      });
    } catch (e) { /* silence is also very TVA */ }
  }

  function hideRestoreControl() {
    if (pruneRestore) pruneRestore.classList.remove('is-visible');
  }

  function clearPruneStageFx() {
    document.body.classList.remove('is-pruning');
    document.body.classList.remove('is-terminated');
    if (pruneHud) pruneHud.classList.remove('is-visible');
    if (pruneHudBarFill) pruneHudBarFill.classList.remove('is-draining');
    if (pruneFront) pruneFront.classList.remove('is-sweeping');
    if (pruneThread) pruneThread.classList.remove('is-visible', 'is-flaring');
    if (pruneStampRed) pruneStampRed.classList.remove('is-slammed', 'is-down', 'is-faded');
    if (pruneStampAmber) pruneStampAmber.classList.remove('is-slammed');
  }

  function flashVeilRestored() {
    if (!pruneVeil) return;
    pruneVeil.classList.remove('is-active');
    pruneVeil.classList.add('is-restored');
    clearTimeout(pruneVeilTimer);
    pruneVeilTimer = setTimeout(() => pruneVeil.classList.remove('is-restored'), 900);
  }

  // Natural completion: the (visitor-triggered) restore has already run.
  function finishPrune() {
    if (!pruning) return;
    pruning = false;
    pruneTerminated = false;
    pruneRestoring = false;
    hideRestoreControl();
    clearPruneTimers();
    clearPruneStageFx();
    pruneTargets().forEach((el) => el.classList.remove('eroding', 'erode-glitch'));
    setTimeout(() => {
      pruneTargets().forEach((el) => el.classList.remove('is-refeeding'));
    }, 800);
    if (pruneVeil) pruneVeil.classList.remove('is-active');
    if (pruneBtn) {
      pruneBtn.disabled = false;
      pruneBtn.focus({ preventScroll: true }); // hand focus back to the control that started it
    }
    showToast('Timeline restored.');
  }

  // Abort path (mid-sequence only): snap everything back, no questions asked.
  function restorePrune(showNotice) {
    if (!pruning) return;
    pruning = false;
    pruneTerminated = false;
    pruneRestoring = false;
    hideRestoreControl();
    clearPruneTimers();
    const targets = pruneTargets();
    targets.forEach((el) => el.classList.add('is-refeeding'));
    void document.body.offsetWidth; // let the refeed transition take hold
    targets.forEach((el) => el.classList.remove('eroding', 'erode-glitch'));
    setTimeout(() => targets.forEach((el) => el.classList.remove('is-refeeding')), 750);
    clearPruneStageFx();
    flashVeilRestored();
    if (pruneBtn) pruneBtn.disabled = false;
    if (showNotice) showToast('Timeline restored.');
  }

  function restoreSequence() {
    if (!pruning) return;
    document.body.classList.remove('is-pruning');
    if (pruneThread) pruneThread.classList.add('is-flaring');
    if (pruneStampRed) {
      pruneStampRed.classList.remove('is-slammed');
      pruneStampRed.classList.add('is-down', 'is-faded');
    }
    if (pruneStampAmber) pruneStampAmber.classList.add('is-slammed');
    setPruneHud('Timeline restored — by order of the Authority', '');
    flashVeilRestored();
    // Regions feed back in top-down: control room first, ground last.
    pruneTargets().slice().reverse().forEach((el, i) => {
      pruneLater(() => {
        el.classList.add('is-refeeding');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.classList.remove('eroding');
        }));
        pruneLater(() => el.classList.remove('is-refeeding'), 750);
      }, i * 70);
    });
    pruneLater(finishPrune, PRUNE_T.restoreSpan);
  }

  // Phase 4 — TERMINATED HOLD: the void completes, then nothing else is
  // scheduled. Regions stay dissolved, the thread keeps its slow pulse,
  // the red stamp stays down, and the page waits for the visitor. The
  // visual completion is idempotent so the failsafe path lands in the
  // exact same state even if some regions never eroded.
  function enterTerminated() {
    if (!pruning || pruneTerminated || pruneRestoring) return;
    pruneTerminated = true;
    pruneTargets().forEach((el) => {
      el.classList.remove('erode-glitch');
      el.classList.add('eroding');
    });
    if (pruneThread) pruneThread.classList.add('is-visible');
    if (pruneStampRed) pruneStampRed.classList.add('is-slammed');
    setPruneHud('Branch E-1130 · Terminated', '');
    document.body.classList.add('is-terminated');
    clearPruneTimers();
    showToast('Branch terminated. Restore it yourself.');
    pruneLater(showRestoreControl, 400);
  }

  function showRestoreControl() {
    if (!pruneTerminated || pruneRestoring) return;
    if (pruneRestore) pruneRestore.classList.add('is-visible');
    if (pruneRestoreBtn) pruneRestoreBtn.focus({ preventScroll: true });
  }

  // The visitor pulls the thread: the v6.5 restore choreography, fired
  // by hand (button, thread click, or R) instead of by a timer.
  function beginRestore() {
    if (!pruning || !pruneTerminated || pruneRestoring) return;
    pruneRestoring = true;
    hideRestoreControl();
    restoreSequence();
  }

  function startPrune() {
    if (pruning) return;
    pruning = true;
    pruneTerminated = false;
    pruneRestoring = false;
    hideRestoreControl();
    pruneAbortReadyAt = performance.now() + 1000;
    if (pruneBtn) pruneBtn.disabled = true;
    if (pruneVeil) {
      pruneVeil.classList.remove('is-restored');
      pruneVeil.classList.add('is-active');
    }
    document.body.classList.add('is-pruning');
    pruneKlaxon();

    // Phase 1 — ARM: HUD chip up, charge bar draining.
    if (pruneHud) pruneHud.classList.add('is-visible');
    setPruneHud('Reset charge armed — Branch E-1130', 'Pruning in 3');
    if (pruneHudBarFill) {
      pruneHudBarFill.classList.remove('is-draining');
      void pruneHudBarFill.offsetWidth;
      // the drain runs from the first erosion tick to the void moment
      pruneLater(() => pruneHudBarFill.classList.add('is-draining'), PRUNE_T.arm);
    }
    pruneLater(() => setPruneHud(null, 'Pruning in 2'), PRUNE_T.count);
    pruneLater(() => setPruneHud(null, 'Pruning in 1'), PRUNE_T.count * 2);

    // Phase 2 — EROSION: front sweeps up, regions glitch then burn away.
    pruneLater(() => { if (pruneFront) pruneFront.classList.add('is-sweeping'); }, PRUNE_T.arm);
    pruneTargets().forEach((el, i) => {
      pruneLater(() => {
        if (prefersReducedMotion) {
          el.classList.add('eroding');
          return;
        }
        el.classList.add('erode-glitch');
        pruneLater(() => {
          el.classList.remove('erode-glitch');
          el.classList.add('eroding');
        }, PRUNE_T.glitch);
      }, PRUNE_T.arm + i * PRUNE_T.step);
    });

    // Phase 3 — VOID: one thread holds; the verdict lands; the hold begins.
    pruneLater(() => {
      if (pruneThread) pruneThread.classList.add('is-visible');
      if (pruneStampRed) pruneStampRed.classList.add('is-slammed');
      setPruneHud('Branch E-1130 · Terminated', '');
      enterTerminated();
    }, PRUNE_T.voidAt);

    // Coherence watchdog: if the sequence somehow never reached the
    // terminated state, jump there. It can never restore the page —
    // after termination it is a permanent no-op and the hold persists.
    pruneLater(() => {
      if (pruning && !pruneTerminated && !pruneRestoring) enterTerminated();
    }, PRUNE_T.failsafe);
  }

  if (pruneBtn) pruneBtn.addEventListener('click', startPrune);
  if (pruneRestoreBtn) pruneRestoreBtn.addEventListener('click', beginRestore);
  if (pruneThread) pruneThread.addEventListener('click', () => {
    if (pruneTerminated) beginRestore();
  });
  document.addEventListener('click', () => {
    // Abort is a mid-sequence privilege only: once the branch has
    // terminated (or restoration is under way), clicks do nothing —
    // restoring must be a deliberate act.
    if (pruning && !pruneTerminated && !pruneRestoring && performance.now() >= pruneAbortReadyAt) restorePrune(false);
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
    setTempadStatus('Coordinates locked to Kerala Branch.');
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
    setTempadStatus('Coordinates locked to Kerala Branch.');
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
          '<p class="variant-card-foot">Intake Nº ' + escapeHtml(variantNo) + ' · Kerala Branch · Forgotten on departure</p>' +
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
      // Mid-sequence Escape aborts; in the terminated hold it does
      // nothing — only a deliberate restore brings the branch back.
      if (pruning && !pruneTerminated) { restorePrune(false); return; }
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
    if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && !e.altKey && !typing && !filmOpen && !tempadOpen) {
      e.preventDefault();
      startTimeslip();
    }
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey && !typing && pruneTerminated && !pruneRestoring) {
      e.preventDefault();
      beginRestore();
    }
  });

})();
