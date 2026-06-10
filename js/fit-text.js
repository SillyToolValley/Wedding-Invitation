/* fit-text.js v2
 * 규칙:
 *  - 초대 메시지/오시는길/중요 헤더: '...' 금지. 공간이 부족해지면 "그 때만" scale()로 축소
 *  - 스케일 하한은 CSS 변수(--tight-scale-min) 또는 기본 .74
 *  - 폭/높이 모두 넘침이 없을 때까지 1~3회 미세 스케일
 */
(function () {
  const TARGETS = [
    // 초대 메시지
    '.invitation .title', '.invitation .message',
    // 오시는 길
    '.directions .title', '.directions .desc', '.directions .address',
    // Retro 섹션 헤더/타이틀류
    '.retro-section .celebrate-text', '.retro-section h3',
    // (필요시) 버튼 라벨도 보호
    '.attendance.retro-section button'
  ];

  const hasOverflow = (el) => {
    const sw = el.scrollWidth, sh = el.scrollHeight;
    const cw = el.clientWidth, ch = el.clientHeight;
    return sw > cw + 0.5 || sh > ch + 0.5;
  };

  function readMinScale(el) {
    const root = el.closest('.invitation, .directions') || el;
    const cs = getComputedStyle(root);
    const v = cs.getPropertyValue('--tight-scale-min').trim();
    const f = parseFloat(v);
    return (isFinite(f) && f > 0 && f <= 1) ? f : 0.74;
  }

  function fit(el) {
    if (!el) return;

    // 초기화
    el.style.transformOrigin = 'left top';
    el.style.transform = 'scale(1)';

    // 혹시 남아있는 ellipsis/hidden 제거
    if (el.style.textOverflow === 'ellipsis') el.style.textOverflow = 'clip';
    if (el.style.overflow === 'hidden') el.style.overflow = 'visible';

    if (!hasOverflow(el)) return;

    const minScale = readMinScale(el);
    let tries = 0;
    while (tries < 3 && hasOverflow(el)) {
      const rect = el.getBoundingClientRect();
      const parent = el.parentElement;
      if (!parent) break;

      const pw = parent.clientWidth || rect.width;
      const ph = parent.clientHeight || rect.height;
      if (pw <= 0 || ph <= 0) break;

      const nw = rect.width, nh = rect.height;
      const next = Math.min(
        Math.max(minScale, pw / nw),
        Math.max(minScale, ph / nh)
      );

      if (next >= 0.999) break;
      el.style.transform = `scale(${next})`;
      tries++;
    }
  }

  function run() {
    document.querySelectorAll(TARGETS.join(',')).forEach(fit);
  }

  const debounced = (window.Utils && typeof Utils.debounce === 'function')
    ? Utils.debounce(run, 120)
    : run;

  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  window.addEventListener('resize', debounced);

  // 폰트 로드로 레이아웃 변동 시 재적용
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run).catch(() => {});
  }

  // 동적 텍스트 변경 대응
  const mo = new MutationObserver(() => debounced());
  mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
