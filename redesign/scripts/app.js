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
    modern: { key: 'modern', storage: 'modern', attr: null, toggleText: '게임 모드', toggleIcon: I.moon, fx: false },
    retro:  { key: 'retro', storage: 'retro', attr: 'retro', toggleText: '모던 모드', toggleIcon: I.sun, fx: true }
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
      html += '<details class="acc-group" open>';
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
    var bar = $('#progress');
    function onScroll() {
      var h = document.documentElement;
      var pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
      if (bar) bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function forcePageTop() {
    var root = document.documentElement;
    var body = document.body;
    var rootBehavior = root.style.scrollBehavior;
    var bodyBehavior = body ? body.style.scrollBehavior : '';
    root.style.scrollBehavior = 'auto';
    if (body) body.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.scrollTop = 0;
    if (body) body.scrollTop = 0;
    root.style.scrollBehavior = rootBehavior;
    if (body) body.style.scrollBehavior = bodyBehavior;
  }

  var topScrollRAF = null;
  function animatePageTop(duration) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      forcePageTop();
      return;
    }
    var root = document.documentElement;
    var body = document.body;
    var startY = window.scrollY || root.scrollTop || (body ? body.scrollTop : 0) || 0;
    if (startY <= 1) {
      forcePageTop();
      return;
    }
    if (topScrollRAF) cancelAnimationFrame(topScrollRAF);

    var rootBehavior = root.style.scrollBehavior;
    var bodyBehavior = body ? body.style.scrollBehavior : '';
    root.style.scrollBehavior = 'auto';
    if (body) body.style.scrollBehavior = 'auto';

    var startedAt = performance.now();
    function step(now) {
      var t = Math.min(1, (now - startedAt) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var nextY = Math.round(startY * (1 - eased));
      window.scrollTo(0, nextY);
      root.scrollTop = nextY;
      if (body) body.scrollTop = nextY;
      if (t < 1) {
        topScrollRAF = requestAnimationFrame(step);
        return;
      }
      topScrollRAF = null;
      window.scrollTo(0, 0);
      root.scrollTop = 0;
      if (body) body.scrollTop = 0;
      root.style.scrollBehavior = rootBehavior;
      if (body) body.style.scrollBehavior = bodyBehavior;
    }
    topScrollRAF = requestAnimationFrame(step);
  }

  function scrollPageTop(clearHash) {
    if (clearHash && window.location.hash && window.history && window.history.replaceState) {
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
    forcePageTop();
    window.setTimeout(forcePageTop, 80);
    window.setTimeout(forcePageTop, 240);
  }

  function initTopNavigation() {
    $$('a[href="#top"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.history && window.history.pushState) {
          window.history.pushState(null, document.title, window.location.pathname + window.location.search + '#top');
        } else {
          window.location.hash = 'top';
        }
        animatePageTop(320);
      });
    });
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
    var requested = new URLSearchParams(window.location.search).get('theme');
    setTheme(requested || saved);
    themeToggleBtn.addEventListener('click', function () {
      setTheme(currentTheme === 'retro' ? 'modern' : 'retro');
      scrollPageTop(true);
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
  var FX_PALETTE = ['#615e85', '#9c8dc2', '#d9a3cd', '#ebc3a7', '#e0e0dc', '#a3d1af', '#90b4de', '#717fb0'];
  var FX_BALLOON_COLORS = ['#615e85', '#9c8dc2', '#d9a3cd', '#ebc3a7', '#a3d1af', '#90b4de', '#717fb0'];
  var FX_PART_LIMIT = 900;
  var fxCanvas, fxCtx, fxParts = [], fxRAF = null, fxTimer = null, fxResizeListening = false, fxLastTime = 0, fxPausedByVisibility = false;
  function fxResize() { if (fxCanvas) { fxCanvas.width = window.innerWidth; fxCanvas.height = window.innerHeight; } }
  function fxRand(min, max) { return min + Math.random() * (max - min); }
  function fxPick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function fxBalloonShade(col) {
    var shades = {
      '#615e85': '#717fb0',
      '#9c8dc2': '#615e85',
      '#d9a3cd': '#9c8dc2',
      '#ebc3a7': '#d9a3cd',
      '#e0e0dc': '#90b4de',
      '#a3d1af': '#717fb0',
      '#90b4de': '#717fb0',
      '#717fb0': '#615e85'
    };
    return shades[col] || '#615e85';
  }
  function trimFxParts() {
    if (fxParts.length > FX_PART_LIMIT) fxParts.splice(0, fxParts.length - FX_PART_LIMIT);
  }
  function startFireworks(quiet) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.hidden) {
      fxPausedByVisibility = currentTheme === 'retro';
      return;
    }
    fxCanvas = $('#retroFx'); if (!fxCanvas || fxTimer) return;
    fxPausedByVisibility = false;
    fxCtx = fxCanvas.getContext('2d'); fxResize();
    if (!fxResizeListening) {
      window.addEventListener('resize', fxResize);
      fxResizeListening = true;
    }
    fxLastTime = performance.now();
    fxTimer = setInterval(spawnFxCue, 780);
    if (!quiet) { spawnFxCue(); spawnBalloon(); }
    loopFx(fxLastTime);
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
    fxLastTime = 0;
    fxCtx = null;
    fxCanvas = null;
  }

  function handleFxVisibility() {
    if (document.hidden) {
      if (fxTimer || fxRAF || fxParts.length) {
        fxPausedByVisibility = currentTheme === 'retro';
        stopFireworks();
      }
      return;
    }
    if (fxPausedByVisibility && currentTheme === 'retro') {
      startFireworks(true);
    }
  }

  function spawnFxCue() {
    if (!fxCanvas) return;
    spawnFireworkRocket();
    if (Math.random() < 0.9) spawnBalloon();
    if (Math.random() < 0.28) spawnBalloon();
    trimFxParts();
  }

  function spawnFireworkRocket() {
    if (!fxCanvas) return;
    var w = fxCanvas.width, h = fxCanvas.height;
    var startX = fxRand(w * 0.14, w * 0.86);
    var targetX = Math.max(w * 0.08, Math.min(w * 0.92, startX + fxRand(-w * 0.18, w * 0.18)));
    var targetY = fxRand(h * 0.12, h * 0.48);
    fxParts.push({
      type: 'rocket',
      x: startX,
      y: h + 24,
      sx: startX,
      sy: h + 24,
      tx: targetX,
      ty: targetY,
      arc: fxRand(-46, 46),
      age: 0,
      life: fxRand(0.95, 1.45),
      trail: 0,
      col: fxPick(FX_PALETTE),
      accent: fxPick(FX_PALETTE),
      sz: 3
    });
  }

  function explodeFirework(x, y, col, accent) {
    var pattern = Math.floor(Math.random() * 5);
    var scale = fxRand(0.72, 1.62 * 3);
    var count = 22 + Math.floor(Math.random() * 22);

    if (pattern === 0) {
      pushSparkRing(x, y, col, accent, count, fxRand(72, 138) * scale, 1, 0);
    } else if (pattern === 1) {
      pushSparkRing(x, y, col, accent, count, fxRand(58, 96) * scale, 0.88, 0);
      pushSparkRing(x, y, accent, col, count + 8, fxRand(118, 176) * scale, 1.12, 0.04);
    } else if (pattern === 2) {
      for (var i = 0; i < count + 16; i++) {
        var a = fxRand(-Math.PI * 0.92, Math.PI * 0.08);
        var sp = fxRand(46, 132) * scale;
        pushSpark(x, y, Math.cos(a) * sp, Math.sin(a) * sp + fxRand(16, 64), fxRand(1.05, 1.75), Math.random() < 0.7 ? col : accent, fxRand(2, 5), 42, 0.993);
      }
    } else if (pattern === 3) {
      for (var j = 0; j < count + 10; j++) {
        var spiral = j * 0.55;
        var sp2 = (36 + j * 3.2) * scale;
        pushSpark(x, y, Math.cos(spiral) * sp2, Math.sin(spiral) * sp2, fxRand(0.78, 1.24), j % 2 ? col : accent, fxRand(2, 4), 78, 0.988);
      }
    } else {
      var spokes = 6 + Math.floor(Math.random() * 4);
      for (var s = 0; s < spokes; s++) {
        var base = (Math.PI * 2 / spokes) * s;
        for (var step = 0; step < 6; step++) {
          var sp3 = (38 + step * 22) * scale;
          pushSpark(x, y, Math.cos(base) * sp3, Math.sin(base) * sp3, fxRand(0.68, 1.08), step % 2 ? accent : col, 2 + (step % 3), 88, 0.986);
        }
      }
    }
    fxParts.push({ type: 'flash', x: x, y: y, age: 0, life: 0.16, col: '#e0e0dc', sz: Math.round(8 + 8 * scale) });
    trimFxParts();
  }

  function pushSparkRing(x, y, col, accent, count, speed, lifeScale, offset) {
    for (var i = 0; i < count; i++) {
      var a = (Math.PI * 2 / count) * i + offset + fxRand(-0.07, 0.07);
      var sp = speed * fxRand(0.82, 1.14);
      pushSpark(x, y, Math.cos(a) * sp, Math.sin(a) * sp, fxRand(0.72, 1.18) * lifeScale, Math.random() < 0.7 ? col : accent, fxRand(2, 5), 92, 0.988);
    }
  }

  function pushSpark(x, y, vx, vy, life, col, sz, gravity, drag) {
    fxParts.push({
      type: 'spark',
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      age: 0,
      life: life,
      col: col,
      sz: Math.max(1, Math.round(sz)),
      gravity: gravity,
      drag: drag
    });
  }

  function spawnRocketTrail(x, y, col) {
    fxParts.push({
      type: 'trail',
      x: x + fxRand(-2, 2),
      y: y + fxRand(-1, 4),
      vx: fxRand(-8, 8),
      vy: fxRand(18, 46),
      age: 0,
      life: fxRand(0.28, 0.44),
      col: Math.random() < 0.65 ? '#e0e0dc' : col,
      sz: 1 + (Math.random() * 2 | 0)
    });
  }

  function spawnBalloon() {
    if (!fxCanvas) return;
    var w = fxCanvas.width, h = fxCanvas.height;
    var col = fxPick(FX_BALLOON_COLORS);
    var sz = Math.round(fxRand(22, 38));
    fxParts.push({
      type: 'balloon',
      x: fxRand(w * 0.06, w * 0.94),
      y: h + sz * 2 + fxRand(0, 70),
      vx: fxRand(-6, 6),
      vy: -fxRand(28, 58),
      age: 0,
      life: 24,
      popY: fxRand(h * 0.16, h * 0.66),
      phase: fxRand(0, Math.PI * 2),
      amp: fxRand(10, 26),
      col: col,
      shade: fxBalloonShade(col),
      sz: sz
    });
    trimFxParts();
  }

  function popBalloon(b) {
    var pieces = 10 + Math.floor(Math.random() * 8);
    for (var i = 0; i < pieces; i++) {
      var a = fxRand(0, Math.PI * 2);
      var sp = fxRand(32, 96);
      fxParts.push({
        type: 'confetti',
        x: b.x,
        y: b.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 30,
        age: 0,
        life: fxRand(0.55, 0.95),
        col: Math.random() < 0.72 ? b.col : fxPick(FX_PALETTE),
        sz: 2 + (Math.random() * 3 | 0)
      });
    }
    fxParts.push({ type: 'flash', x: b.x, y: b.y, age: 0, life: 0.12, col: b.col, sz: Math.max(6, b.sz * 0.38) });
    trimFxParts();
  }

  function loopFx(t) {
    if (!fxCtx || !fxCanvas) { fxRAF = null; return; }
    fxRAF = requestAnimationFrame(loopFx);
    var dt = Math.min(0.04, Math.max(0.001, (t - fxLastTime) / 1000 || 0.016));
    fxLastTime = t;
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    for (var i = fxParts.length - 1; i >= 0; i--) {
      var p = fxParts[i];
      if (p.type === 'rocket') {
        updateRocket(p, dt, i);
      } else if (p.type === 'balloon') {
        updateBalloon(p, dt, i);
      } else {
        updateParticle(p, dt, i);
      }
    }
    trimFxParts();
    fxCtx.globalAlpha = 1;
  }

  function updateRocket(p, dt, index) {
    p.age += dt;
    var q = Math.min(1, p.age / p.life);
    var ease = 1 - Math.pow(1 - q, 2.2);
    var prevX = p.x, prevY = p.y;
    p.x = p.sx + (p.tx - p.sx) * ease + Math.sin(q * Math.PI) * p.arc;
    p.y = p.sy + (p.ty - p.sy) * ease;
    p.trail -= dt;
    if (p.trail <= 0) {
      spawnRocketTrail(prevX, prevY, p.col);
      p.trail = 0.035;
    }
    if (q >= 1) {
      explodeFirework(p.x, p.y, p.col, p.accent);
      fxParts.splice(index, 1);
      return;
    }
    fxCtx.globalAlpha = 0.95;
    fxCtx.fillStyle = p.col;
    fxCtx.fillRect(p.x | 0, p.y | 0, p.sz, p.sz + 5);
    fxCtx.fillStyle = '#e0e0dc';
    fxCtx.fillRect((p.x + 1) | 0, (p.y - 3) | 0, 2, 2);
  }

  function updateBalloon(p, dt, index) {
    p.age += dt;
    p.x += (p.vx + Math.sin(p.age * 2.1 + p.phase) * p.amp) * dt;
    p.y += p.vy * dt;
    if (p.y <= p.popY || p.age >= p.life) {
      popBalloon(p);
      fxParts.splice(index, 1);
      return;
    }
    drawBalloon(p);
  }

  function updateParticle(p, dt, index) {
    p.age += dt;
    p.life -= dt;
    if (p.type === 'spark') {
      p.vy += (p.gravity == null ? 92 : p.gravity) * dt;
      p.vx *= p.drag || 0.988;
    } else if (p.type === 'confetti') {
      p.vy += 130 * dt;
      p.vx *= 0.985;
    } else if (p.type === 'trail') {
      p.vy += 38 * dt;
    }
    p.x += (p.vx || 0) * dt;
    p.y += (p.vy || 0) * dt;
    if (p.life <= 0) { fxParts.splice(index, 1); return; }
    var alpha = Math.max(0, Math.min(1, p.life / Math.max(0.16, p.age + p.life)));
    if (p.type === 'flash') alpha = Math.max(0, p.life / 0.16) * 0.75;
    fxCtx.globalAlpha = alpha;
    fxCtx.fillStyle = p.col;
    var sz = Math.max(1, p.sz | 0);
    if (p.type === 'flash') {
      fxCtx.fillRect((p.x - sz) | 0, p.y | 0, sz * 2 + 1, 2);
      fxCtx.fillRect(p.x | 0, (p.y - sz) | 0, 2, sz * 2 + 1);
    } else {
      fxCtx.fillRect(p.x | 0, p.y | 0, sz, sz);
    }
  }

  function drawBalloon(p) {
    var x = p.x | 0;
    var y = p.y | 0;
    var u = Math.max(2, Math.round(p.sz / 10));
    var top = y - u * 6;
    var outlineRows = [
      [-2, 0, 5],
      [-4, 1, 9],
      [-5, 2, 11],
      [-5, 3, 11],
      [-5, 4, 11],
      [-5, 5, 11],
      [-5, 6, 11],
      [-4, 7, 9],
      [-4, 8, 9],
      [-3, 9, 7],
      [-2, 10, 5],
      [-1, 11, 3]
    ];
    var fillRows = [
      [-2, 1, 5],
      [-4, 2, 9],
      [-4, 3, 9],
      [-4, 4, 9],
      [-4, 5, 9],
      [-4, 6, 9],
      [-4, 7, 9],
      [-3, 8, 7],
      [-2, 9, 5],
      [-1, 10, 3]
    ];
    fxCtx.globalAlpha = 0.42;
    fxCtx.fillStyle = 'rgba(224,224,220,0.44)';
    fxCtx.fillRect(x, top + u * 13, Math.max(1, Math.round(u / 2)), u * 8);
    fxCtx.globalAlpha = 0.78;
    fxCtx.fillStyle = '#e0e0dc';
    for (var i = 0; i < outlineRows.length; i++) {
      fxCtx.fillRect(x + outlineRows[i][0] * u, top + outlineRows[i][1] * u, outlineRows[i][2] * u, u);
    }
    fxCtx.globalAlpha = 0.96;
    fxCtx.fillStyle = p.col;
    for (var j = 0; j < fillRows.length; j++) {
      fxCtx.fillRect(x + fillRows[j][0] * u, top + fillRows[j][1] * u, fillRows[j][2] * u, u);
    }
    fxCtx.globalAlpha = 0.5;
    fxCtx.fillStyle = p.shade;
    fxCtx.fillRect(x + u * 2, top + u * 4, u * 2, u * 4);
    fxCtx.fillRect(x + u, top + u * 8, u * 2, u * 2);
    fxCtx.fillRect(x, top + u * 10, u, u);
    fxCtx.globalAlpha = 0.84;
    fxCtx.fillStyle = '#e0e0dc';
    fxCtx.fillRect(x - u * 3, top + u * 2, u * 2, u);
    fxCtx.fillRect(x - u * 4, top + u * 4, u, u * 2);
    fxCtx.globalAlpha = 0.96;
    fxCtx.fillStyle = p.col;
    fxCtx.fillRect(x - u, top + u * 11, u * 2, u);
    fxCtx.fillRect(x, top + u * 12, u, u);
  }
  function initBalloons() {
    var wrap = $('#balloons'); if (!wrap) return;
    var cols = ['#615e85', '#9c8dc2', '#d9a3cd', '#ebc3a7', '#e0e0dc', '#a3d1af', '#90b4de', '#717fb0'];
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

  /* ---- 미니게임: 64-bit 스타일 스프라이트 WEDDING RUNNER + 리더보드 fallback ---- */
  var gameInited = false;
  var LEADERBOARD_CLOSED_MESSAGE = '정규 시즌이 종료되었습니다.';
  function initRetroGame() {
    if (gameInited || typeof window.initMiniGame !== 'function' || !$('#miniGameContainer')) return;
    if (!window.getGameLeaderboard) window.getGameLeaderboard = function () {
      return Promise.resolve(read('wi-scores').slice().sort(function (a, b) { return b.score - a.score; }));
    };
    if (!window.submitGameScore) window.submitGameScore = function (name, score) {
      return Promise.reject(new Error(LEADERBOARD_CLOSED_MESSAGE));
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
     7) RSVP (Firebase adapter first, localStorage fallback)
     ============================================================ */
  function initRSVP() {
    var form = $('#rsvpForm'); if (!form) return;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var data = {
        name: form.name.value.trim(), side: form.side.value, attend: form.attend.value,
        adults: form.adults.value || 0, kids: form.kids.value || 0, meal: form.meal.value, ts: Date.now()
      };
      if (!data.name) { toast('성함을 입력해 주세요'); return; }
      try {
        if (window.WeddingData && window.WeddingData.submitRsvp) {
          await window.WeddingData.submitRsvp(data);
        } else {
          var list = read('wi-rsvp'); list.push(data); write('wi-rsvp', list);
        }
        closeModal($('#rsvpModal')); form.reset();
        toast('참석 여부가 전달되었습니다. 감사합니다 ♥');
      } catch (error) {
        console.error('RSVP submit failed:', error);
        toast('전달 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    });
  }

  /* ============================================================
     8) GUESTBOOK (Firebase adapter first + pagination)
     ============================================================ */
  var GB_PER = 4, gbPage = 1;
  var remoteGuestbookActive = false;

  function saveLocalGuestbook(entry) {
    var list = read('wi-gb');
    list.push(entry);
    write('wi-gb', list);
  }

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
    if (window.WeddingData && window.WeddingData.listenGuestbook) {
      remoteGuestbookActive = !!window.WeddingData.listenGuestbook(function (items) {
        write('wi-gb', items);
        gbPage = 1;
        gbRender();
      });
    }
    if (!remoteGuestbookActive) gbSeed();
    gbRender();
    var form = $('#gbForm');
    if (form) form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = form.name.value.trim(), msg = form.msg.value.trim();
      if (!name || !msg) { toast('이름과 메시지를 입력해 주세요'); return; }
      var entry = { name: name, msg: msg, ts: Date.now() };
      try {
        var result = null;
        if (window.WeddingData && window.WeddingData.submitGuestbook) {
          result = await window.WeddingData.submitGuestbook(name, msg);
        }
        if (!window.WeddingData || !window.WeddingData.submitGuestbook || (result && result.remote && !remoteGuestbookActive)) {
          saveLocalGuestbook(entry);
        }
        form.reset(); closeModal($('#gbModal')); gbPage = 1; gbRender();
        toast('소중한 축하 메시지가 등록되었습니다 ♥');
      } catch (error) {
        console.error('Guestbook submit failed:', error);
        toast('등록 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
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
    document.removeEventListener('visibilitychange', handleFxVisibility);
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
    initReveal(); initScrollChrome(); initTopNavigation(); initPetals();
    initTheme();   // applyThemeText → renderDynamic + 갤러리/사진 스왑 + 레트로 FX/미니게임
    document.addEventListener('visibilitychange', handleFxVisibility);
    window.addEventListener('pagehide', teardownRuntime, { once: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
