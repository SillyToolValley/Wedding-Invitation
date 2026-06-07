/* ============================================================
   APP — 청첩장 동작 로직 (classic script, 모듈 없이 file:// 직접 열기 가능)
   섹션: 0) 유틸  1) 렌더  2) 모션/네비  3) 갤러리  4) 카운트다운/달력
        5) 테마+레트로FX+미니게임  6) 모달  7) RSVP  8) 방명록  9) 액션
   ============================================================ */
(function () {
  'use strict';
  var W = window.WEDDING;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- 0) ICONS (inline SVG) ---- */
  var I = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    msg:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    subway:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16M8 21l2-3M16 21l-2-3"/><circle cx="8.5" cy="14" r=".8"/><circle cx="15.5" cy="14" r=".8"/></svg>',
    bus:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M5 17V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11M5 17l-1 3M19 17l1 3M4 10h16"/><circle cx="8" cy="14" r=".8"/><circle cx="16" cy="14" r=".8"/></svg>',
    pin:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    leaf:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 9-9 4 0 7 2 7 2s-1 9-9 14z"/><path d="M11 20c0-5 2-9 6-12"/></svg>',
    sun:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>',
    moon:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tel(n) { return 'tel:' + n.replace(/-/g, ''); }
  function sms(n) { return 'sms:' + n.replace(/-/g, ''); }

  /* 테마별 라벨 (레트로일 때 게임풍으로 교체) */
  var LABELS = {
    modern: { groom: '신랑측', bride: '신부측', father: '아버지', mother: '어머니', subway: '지하철', bus: '버스', copy: '복사' },
    retro:  { groom: 'PLAYER 1 TEAM', bride: 'PLAYER 2 TEAM', father: 'FATHER', mother: 'MOTHER', subway: 'SUBWAY ROUTE', bus: 'BUS ROUTE', copy: 'COPY' }
  };
  var THEMES = {
    modern: { key: 'modern', storage: 'modern', attr: null, toggleText: 'RETRO', toggleIcon: I.moon, fx: false },
    retro:  { key: 'retro', storage: 'retro', attr: 'retro', toggleText: 'MODERN', toggleIcon: I.sun, fx: true }
  };
  var currentTheme = 'modern';
  var themeToggleBtn = null;

  function normalizeTheme(theme) { return theme === 'retro' ? 'retro' : 'modern'; }
  function themeConfig(theme) { return THEMES[normalizeTheme(theme)]; }
  function L(theme) { return LABELS[normalizeTheme(theme)]; }

  /* ============================================================
     1) DATA-DRIVEN RENDER
     ============================================================ */
  function renderParents(theme) {
    var box = $('#parentsContact'); if (!box) return;
    var lab = L(theme), html = '';
    ['groom', 'bride'].forEach(function (side) {
      var p = W.parents[side];
      html += '<div class="contact-card" data-reveal>';
      html += '<div class="contact-card__label">' + lab[side] + '</div>';
      ['father', 'mother'].forEach(function (k) {
        var m = p[k];
        html += '<div class="contact-row"><div class="contact-row__who">' +
          '<div class="role">' + lab[k] + '</div><div class="name">' + m.name + '</div></div>' +
          '<div class="contact-row__btns">' +
          '<a class="icon-btn" href="' + tel(m.tel) + '" aria-label="' + m.name + ' 전화">' + I.phone + '</a>' +
          '<a class="icon-btn" href="' + sms(m.tel) + '" aria-label="' + m.name + ' 문자">' + I.msg + '</a>' +
          '</div></div>';
      });
      html += '</div>';
    });
    box.innerHTML = html;
  }

  function renderAccounts(theme) {
    var box = $('#accounts'); if (!box) return;
    var lab = L(theme), html = '';
    ['groom', 'bride'].forEach(function (side) {
      var list = W.accounts[side];
      html += '<details class="acc-group"' + (side === 'groom' ? ' open' : '') + '>';
      html += '<summary class="acc-head">' + lab[side] + '<span class="acc-head__chev">' + I.leaf + '</span></summary>';
      html += '<div class="acc-body">';
      list.forEach(function (a) {
        html += '<div class="acc-row"><div class="acc-row__info">' +
          '<div class="bank">' + a.bank + '</div>' +
          '<div class="num">' + a.number + '</div>' +
          '<div class="holder">' + a.holder + '</div></div>' +
          '<button class="btn btn--ghost" data-copy="' + a.number.replace(/-/g, '') + '">' + lab.copy + '</button></div>';
      });
      html += '</div></details>';
    });
    box.innerHTML = html;
  }

  function renderTransit(theme) {
    var box = $('#transit'); if (!box) return;
    var lab = L(theme);
    box.innerHTML = W.transit.map(function (t) {
      var title = lab[t.type] || t.title;
      return '<div class="transit__item" data-reveal><div class="transit__icon">' + (I[t.type] || I.pin) +
        '</div><div class="transit__txt"><h4>' + title + '</h4><p>' + t.lines.replace(/\n/g, '<br>') + '</p></div></div>';
    }).join('');
  }

  function renderDynamic(theme) { renderParents(theme); renderAccounts(theme); renderTransit(theme); }

  function renderStaticText() {
    var set = function (sel, txt) { var el = $(sel); if (el) el.textContent = txt; };
    var setHTML = function (sel, txt) { var el = $(sel); if (el) el.innerHTML = txt; };
    set('#heroDateTop', W.dateLabel.replace(/ 오전.*| 오후.*/, '').replace(/년 /, '. ').replace(/월 /, '. ').replace(/일.*/, ''));
    setHTML('#heroNames', W.couple.bride.name + '<span class="amp">&amp;</span>' + W.couple.groom.name);
    set('#dateLabel', W.dateLabel);
    set('#inviteMsg', W.message.invite);
    setHTML('#inviteFamilies',
      '<div><b>' + W.couple.groom.parents + '</b>의 ' + W.couple.groom.role + ' <b>' + W.couple.groom.name + '</b></div>' +
      '<div><b>' + W.couple.bride.parents + '</b>의 ' + W.couple.bride.role + ' <b>' + W.couple.bride.name + '</b></div>');
    set('#venueName', W.venue.name);
    setHTML('#venueAddr', W.venue.address + '<br>' + W.venue.hall + ' · ' + W.venue.tel);
    set('#closingMsg', W.message.closing);
    setHTML('#closingNames', W.couple.bride.name + ' &#10084; ' + W.couple.groom.name);
    set('#closingDate', W.date.year + '. ' + pad(W.date.month) + '. ' + pad(W.date.day));
    var hp = $('#heroPhoto'); if (hp) hp.src = W.heroPhoto;
  }

  /* ============================================================
     2) MOTION / NAV
     ============================================================ */
  var revealReady = false;
  function initReveal() {
    var els = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-visible'); }); revealReady = true; return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e, i) { e.style.setProperty('--reveal-delay', (i % 4) * 0.06 + 's'); io.observe(e); });
    revealReady = true;
  }

  function initScrollChrome() {
    var bar = $('#progress'), appbar = $('#appbar'), hero = $('.hero'), minigame = $('#minigame');
    function onScroll() {
      var h = document.documentElement;
      var pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
      if (bar) bar.style.width = pct + '%';
      if (appbar && hero) {
        var gameRect = minigame ? minigame.getBoundingClientRect() : null;
        var gameInView = document.documentElement.getAttribute('data-theme') === 'retro' &&
          gameRect && gameRect.top < window.innerHeight - 80 && gameRect.bottom > 120;
        appbar.classList.toggle('is-hidden', h.scrollTop < hero.offsetHeight * 0.6 || gameInView);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initPetals() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var wrap = $('#petals'); if (!wrap) return;
    for (var i = 0; i < 12; i++) {
      var p = document.createElement('span');
      p.className = 'petal';
      var size = 8 + Math.random() * 10;
      p.style.left = Math.random() * 100 + '%';
      p.style.width = p.style.height = size + 'px';
      p.style.animationDuration = (9 + Math.random() * 8) + 's';
      p.style.animationDelay = (-Math.random() * 12) + 's';
      p.style.opacity = 0.4 + Math.random() * 0.35;
      wrap.appendChild(p);
    }
  }

  /* ============================================================
     3) GALLERY (slider + swipe + lightbox, 테마별 이미지 소스)
     ============================================================ */
  var galleryApi = null;
  function galleryFor(theme) {
    return (theme === 'retro' && W.galleryRetro && W.galleryRetro.length) ? W.galleryRetro : W.gallery;
  }
  function initGallery() {
    var track = $('#galleryTrack'), dots = $('#galleryDots');
    if (!track) return;
    var imgs = galleryFor('modern'), idx = 0;
    function build() {
      track.innerHTML = imgs.map(function (src, i) {
        return '<div class="gallery__slide"><img src="' + src + '" alt="웨딩 사진 ' + (i + 1) + '" loading="lazy" data-light="' + src + '"></div>';
      }).join('');
      dots.innerHTML = imgs.map(function (_, i) {
        return '<button class="gallery__dot' + (i === 0 ? ' gallery__dot--active' : '') + '" data-go="' + i + '" aria-label="' + (i + 1) + '번 사진"></button>';
      }).join('');
    }
    function go(n) {
      idx = (n + imgs.length) % imgs.length;
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      $$('.gallery__dot', dots).forEach(function (d, i) { d.classList.toggle('gallery__dot--active', i === idx); });
    }
    build();
    $('#galPrev').addEventListener('click', function () { go(idx - 1); });
    $('#galNext').addEventListener('click', function () { go(idx + 1); });
    dots.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) go(+b.dataset.go); });
    var x0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    track.addEventListener('click', function (e) {
      var img = e.target.closest('[data-light]'); if (!img) return;
      $('#lightboxImg').src = img.dataset.light;
      $('#lightbox').classList.add('is-open');
    });
    $('#lightboxClose').addEventListener('click', closeLight);
    $('#lightbox').addEventListener('click', function (e) { if (e.target.id === 'lightbox') closeLight(); });
    function closeLight() { $('#lightbox').classList.remove('is-open'); }
    galleryApi = { setTheme: function (theme) { imgs = galleryFor(theme); idx = 0; build(); track.style.transform = 'translateX(0)'; } };
  }

  /* ============================================================
     4) COUNTDOWN + CALENDAR
     ============================================================ */
  function target() { var d = W.date; return new Date(d.year, d.month - 1, d.day, d.hour, d.minute); }

  var countdownTimer = null;
  function initCountdown() {
    var box = $('#countdown'); if (!box) return;
    function unit(n, l) { return '<div class="cd-unit"><div class="cd-unit__num">' + pad(n) + '</div><div class="cd-unit__lab">' + l + '</div></div>'; }
    function tick() {
      var diff = target() - new Date();
      var done = diff <= 0; if (done) diff = 0;
      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
      box.innerHTML = unit(d, 'DAYS') + unit(h, 'HOURS') + unit(m, 'MIN') + unit(sec, 'SEC');
      var note = $('#countdownNote');
      if (note) note.textContent = done
        ? '두 사람이 부부가 되었습니다 ♥'
        : W.couple.bride.name + ' ♥ ' + W.couple.groom.name + '의 결혼식이 ' + d + '일 남았습니다';
    }
    if (countdownTimer) clearInterval(countdownTimer);
    tick(); countdownTimer = setInterval(tick, 1000);
  }

  function initCalendar() {
    var box = $('#calGrid'); if (!box) return;
    var d = W.date, first = new Date(d.year, d.month - 1, 1).getDay(), days = new Date(d.year, d.month, 0).getDate();
    var dows = ['일', '월', '화', '수', '목', '금', '토'];
    var html = dows.map(function (x, i) { return '<div class="cal__cell cal__cell--dow' + (i === 0 ? ' cal__cell--sun' : '') + '">' + x + '</div>'; }).join('');
    for (var i = 0; i < first; i++) html += '<div class="cal__cell cal__cell--muted">.</div>';
    for (var day = 1; day <= days; day++) {
      var dow = (first + day - 1) % 7;
      var cls = 'cal__cell' + (dow === 0 ? ' cal__cell--sun' : '') + (day === d.day ? ' cal__cell--wed' : '');
      html += '<div class="' + cls + '">' + day + '</div>';
    }
    box.innerHTML = html;
    var t = $('#calTitle'); if (t) t.textContent = d.year + '. ' + pad(d.month);
  }

  /* ============================================================
     5) THEME + 레트로 FX(폭죽·풍선) + 미니게임
     ============================================================ */
  function applyThemeText(theme) {
    theme = normalizeTheme(theme);
    $$('[data-retro]').forEach(function (el) {
      if (el.getAttribute('data-modern') === null) el.setAttribute('data-modern', el.innerHTML.trim());
      var r = el.getAttribute('data-retro').replace(/\n/g, '<br>');
      el.innerHTML = (theme === 'retro') ? r : el.getAttribute('data-modern');
    });
    var im = $('#inviteMsg');
    if (im) im.textContent = (theme === 'retro' && W.message.inviteRetro) ? W.message.inviteRetro : W.message.invite;
    renderDynamic(theme);
    if (galleryApi) galleryApi.setTheme(theme);
    var hp = $('#heroPhoto');
    if (hp) hp.src = (theme === 'retro' && W.heroPhotoRetro) ? W.heroPhotoRetro : W.heroPhoto;
    if (revealReady) $$('#parentsContact [data-reveal], #transit [data-reveal]').forEach(function (e) { e.classList.add('is-visible'); });
  }

  function initTheme() {
    themeToggleBtn = $('#themeToggle'); if (!themeToggleBtn) return;
    var saved = null;
    try { saved = localStorage.getItem('wi-theme'); } catch (e) {}
    setTheme(saved);
    themeToggleBtn.addEventListener('click', function () {
      setTheme(currentTheme === 'retro' ? 'modern' : 'retro');
    });
  }

  function setTheme(theme) {
    var cfg = themeConfig(theme);
    currentTheme = cfg.key;
    if (cfg.attr) document.documentElement.setAttribute('data-theme', cfg.attr);
    else document.documentElement.removeAttribute('data-theme');
    if (themeToggleBtn) themeToggleBtn.innerHTML = cfg.toggleIcon + '<span>' + cfg.toggleText + '</span>';
    try { localStorage.setItem('wi-theme', cfg.storage); } catch (e) {}
    applyThemeText(cfg.key);
    if (cfg.fx) { startFireworks(); initRetroGame(); }
    else {
      stopFireworks();
      if (window.stopMiniGame) window.stopMiniGame();
    }
  }

  /* ---- 8-bit fireworks (canvas) ---- */
  var fxCanvas, fxCtx, fxParts = [], fxRAF = null, fxTimer = null, fxResizeListening = false;
  function fxResize() { if (fxCanvas) { fxCanvas.width = window.innerWidth; fxCanvas.height = window.innerHeight; } }
  function startFireworks() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    fxCanvas = $('#retroFx'); if (!fxCanvas || fxTimer) return;
    fxCtx = fxCanvas.getContext('2d'); fxResize();
    if (!fxResizeListening) {
      window.addEventListener('resize', fxResize);
      fxResizeListening = true;
    }
    fxTimer = setInterval(spawnBurst, 1100);
    spawnBurst(); loopFx();
  }
  function stopFireworks() {
    if (fxTimer) { clearInterval(fxTimer); fxTimer = null; }
    if (fxRAF) { cancelAnimationFrame(fxRAF); fxRAF = null; }
    if (fxResizeListening) {
      window.removeEventListener('resize', fxResize);
      fxResizeListening = false;
    }
    if (fxCtx && fxCanvas) fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    fxParts = [];
    fxCtx = null;
    fxCanvas = null;
  }
  function spawnBurst() {
    if (!fxCanvas) return;
    var cols = ['#ff5d8f', '#ffd23f', '#5be0ff', '#7cff6b', '#c98aff', '#ff8a3d'];
    var col = cols[Math.floor(Math.random() * cols.length)];
    var cx = Math.random() * fxCanvas.width, cy = 40 + Math.random() * fxCanvas.height * 0.5, n = 26;
    for (var i = 0; i < n; i++) {
      var a = (Math.PI * 2 / n) * i, sp = 1.6 + Math.random() * 2.6;
      fxParts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, col: col, sz: 2 + (Math.random() * 2 | 0) });
    }
  }
  function loopFx() {
    if (!fxCtx || !fxCanvas) { fxRAF = null; return; }
    fxRAF = requestAnimationFrame(loopFx);
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    for (var i = fxParts.length - 1; i >= 0; i--) {
      var p = fxParts[i];
      p.vy += 0.03; p.x += p.vx; p.y += p.vy; p.life -= 0.012;
      if (p.life <= 0) { fxParts.splice(i, 1); continue; }
      fxCtx.globalAlpha = Math.max(0, p.life); fxCtx.fillStyle = p.col;
      fxCtx.fillRect(p.x | 0, p.y | 0, p.sz + 1, p.sz + 1);
    }
    fxCtx.globalAlpha = 1;
  }
  function initBalloons() {
    var wrap = $('#balloons'); if (!wrap) return;
    var cols = ['#ff5d8f', '#ffd23f', '#5be0ff', '#7cff6b', '#c98aff', '#ff8a3d'];
    for (var i = 0; i < 8; i++) {
      var b = document.createElement('span'); b.className = 'balloon';
      var s = 24 + Math.random() * 16;
      b.style.left = (4 + Math.random() * 90) + '%';
      b.style.background = cols[i % cols.length];
      b.style.width = s + 'px'; b.style.height = (s * 1.25) + 'px';
      b.style.animationDuration = (11 + Math.random() * 9) + 's';
      b.style.animationDelay = (-Math.random() * 14) + 's';
      wrap.appendChild(b);
    }
  }

  /* ---- 미니게임: 32비트 스프라이트 WEDDING RUNNER + 오프라인 리더보드 스텁 ---- */
  var gameInited = false;
  function initRetroGame() {
    if (gameInited || typeof window.initMiniGame !== 'function' || !$('#miniGameContainer')) return;
    if (!window.getGameLeaderboard) window.getGameLeaderboard = function () {
      return Promise.resolve(read('wi-scores').slice().sort(function (a, b) { return b.score - a.score; }));
    };
    if (!window.submitGameScore) window.submitGameScore = function (name, score) {
      var l = read('wi-scores'); l.push({ name: String(name).slice(0, 10), score: Math.floor(score) || 0, ts: Date.now() });
      write('wi-scores', l); return Promise.resolve(true);
    };
    try { window.initMiniGame('miniGameContainer'); gameInited = true; } catch (e) { console.warn('minigame init failed:', e); }
  }

  /* ============================================================
     6) MODAL
     ============================================================ */
  function openModal(id) { var m = $(id); if (m) { m.classList.add('is-open'); document.body.style.overflow = 'hidden'; } }
  function closeModal(m) { m.classList.remove('is-open'); document.body.style.overflow = ''; }
  function initModals() {
    $$('[data-open]').forEach(function (b) { b.addEventListener('click', function () { openModal(b.dataset.open); }); });
    $$('.modal').forEach(function (m) {
      m.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal__scrim') || e.target.closest('.modal__close')) closeModal(m);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { var open = $('.modal.is-open'); if (open) closeModal(open); $('#lightbox').classList.remove('is-open'); }
    });
  }

  /* ============================================================
     7) RSVP (localStorage 저장 — 포트폴리오 데모용, 키 노출 없음)
     ============================================================ */
  function initRSVP() {
    var form = $('#rsvpForm'); if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        name: form.name.value.trim(), side: form.side.value, attend: form.attend.value,
        adults: form.adults.value || 0, kids: form.kids.value || 0, meal: form.meal.value, ts: Date.now()
      };
      if (!data.name) { toast('성함을 입력해 주세요'); return; }
      var list = read('wi-rsvp'); list.push(data); write('wi-rsvp', list);
      closeModal($('#rsvpModal')); form.reset();
      toast('참석 여부가 전달되었습니다. 감사합니다 ♥');
    });
  }

  /* ============================================================
     8) GUESTBOOK (localStorage + pagination)
     ============================================================ */
  var GB_PER = 4, gbPage = 1;
  function gbSeed() {
    if (read('wi-gb').length) return;
    write('wi-gb', [
      { name: '김지원', msg: '두 분의 앞날을 진심으로 축복합니다. 행복하세요!', ts: Date.now() - 864e5 * 3 },
      { name: '이준호', msg: '결혼 축하해 영민아! 평생 알콩달콩 살자 :)', ts: Date.now() - 864e5 * 2 },
      { name: '박서연', msg: '채린이 신부 너무 예쁠 거 같아 ♥ 결혼 축하해!', ts: Date.now() - 864e5 }
    ]);
  }
  function gbRender() {
    var box = $('#gbList'); if (!box) return;
    var all = read('wi-gb').sort(function (a, b) { return b.ts - a.ts; });
    var pages = Math.max(1, Math.ceil(all.length / GB_PER));
    if (gbPage > pages) gbPage = pages;
    var slice = all.slice((gbPage - 1) * GB_PER, gbPage * GB_PER);
    box.innerHTML = slice.length ? slice.map(function (g) {
      return '<div class="gb-card"><div class="gb-card__top"><span class="gb-card__name">' + esc(g.name) +
        '</span><span class="gb-card__date">' + fmtDate(g.ts) + '</span></div><div class="gb-card__msg">' + esc(g.msg) + '</div></div>';
    }).join('') : '<div class="gb__empty">첫 번째 축하 메시지를 남겨보세요 ♥</div>';
    $('#gbPageInfo').textContent = gbPage + ' / ' + pages;
    $('#gbPrev').disabled = gbPage <= 1;
    $('#gbNext').disabled = gbPage >= pages;
  }
  function initGuestbook() {
    gbSeed(); gbRender();
    var form = $('#gbForm');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim(), msg = form.msg.value.trim();
      if (!name || !msg) { toast('이름과 메시지를 입력해 주세요'); return; }
      var list = read('wi-gb'); list.push({ name: name, msg: msg, ts: Date.now() }); write('wi-gb', list);
      form.reset(); closeModal($('#gbModal')); gbPage = 1; gbRender();
      toast('소중한 축하 메시지가 등록되었습니다 ♥');
    });
    $('#gbPrev').addEventListener('click', function () { if (gbPage > 1) { gbPage--; gbRender(); } });
    $('#gbNext').addEventListener('click', function () { gbPage++; gbRender(); });
  }

  /* ============================================================
     9) ACTIONS — copy / map / share
     ============================================================ */
  function initActions() {
    document.addEventListener('click', function (e) {
      var c = e.target.closest('[data-copy]');
      if (c) { copy(c.dataset.copy); toast('계좌번호가 복사되었습니다'); }
    });
    var nm = $('#mapNaver'), km = $('#mapKakao');
    var q = encodeURIComponent(W.venue.name);
    if (nm) nm.addEventListener('click', function () { window.open('https://map.naver.com/v5/search/' + q, '_blank'); });
    if (km) km.addEventListener('click', function () { window.open('https://map.kakao.com/link/search/' + W.venue.name, '_blank'); });
    $$('[data-share]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.share === 'link') { copy(location.href); toast('링크가 복사되었습니다'); }
        else if (navigator.share) navigator.share({ title: W.share.title, text: W.share.description, url: location.href }).catch(function () {});
        else { copy(location.href); toast('링크가 복사되었습니다'); }
      });
    });
  }

  /* ---- small utils ---- */
  function read(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function copy(t) {
    if (navigator.clipboard) navigator.clipboard.writeText(t).catch(function () { fallbackCopy(t); });
    else fallbackCopy(t);
  }
  function fallbackCopy(t) {
    var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta);
    ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta);
  }
  var toastT;
  function toast(msg) {
    var el = $('#toast'); if (!el) return;
    el.textContent = msg; el.classList.add('is-show');
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('is-show'); }, 2400);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtDate(ts) { var d = new Date(ts); return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()); }

  function teardownRuntime() {
    stopFireworks();
    if (window.stopMiniGame) window.stopMiniGame();
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (toastT) { clearTimeout(toastT); toastT = null; }
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    renderStaticText();
    initGallery(); initCountdown(); initCalendar();
    initModals(); initRSVP(); initGuestbook(); initActions();
    initBalloons();
    initReveal(); initScrollChrome(); initPetals();
    initTheme();   // applyThemeText → renderDynamic + 갤러리/사진 스왑 + 레트로 FX/미니게임
    window.addEventListener('pagehide', teardownRuntime, { once: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
