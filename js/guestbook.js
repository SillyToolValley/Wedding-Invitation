/* =========================================================
 * guestbook.js  (Modern/Retro 공용 - DataManager 준비까지 '무기한 대기')
 * - Modern/Retro 양쪽 컨테이너 동시 지원
 * - DataManager 준비되기 전엔 어떤 함수도 DataManager에 접근하지 않음
 * - 커스텀 이벤트 'DataManagerReady'도 지원 (있으면 더 빨리 준비됨)
 * =======================================================*/

/* ---------- DM 준비 탐지 ---------- */
function dmReady() {
  return !!(window.DataManager &&
            window.DataManager.guestbook &&
            typeof window.DataManager.guestbook.getAll === 'function' &&
            typeof window.DataManager.guestbook.add === 'function');
}
function DM() { return window.DataManager; }

/* 무기한 대기 + 이벤트 리스너 (타임아웃 없음) */
function onDMReady(cb) {
  if (dmReady()) { cb(); return; }
  // 1) 커스텀 이벤트를 먼저 청취
  const handler = () => { if (dmReady()) { window.removeEventListener('DataManagerReady', handler); cb(); } };
  window.addEventListener('DataManagerReady', handler);
  // 2) 폴링(백오프 없이 300ms) – 가장 단순하고 견고
  const iv = setInterval(() => {
    if (dmReady()) { clearInterval(iv); window.removeEventListener('DataManagerReady', handler); cb(); }
  }, 300);
}

/* ---------- DOM 훅 ---------- */
function getAllGuestbookDoms() {
  const ids = [
    ['guestbookListModern', 'pageInfoModern', 'pageIndicatorModern', 'prevPageBtnModern', 'nextPageBtnModern'],
    ['guestbookListRetro',  'pageInfoRetro',  'pageIndicatorRetro',  'prevPageBtnRetro',  'nextPageBtnRetro' ],
    // 레거시 호환(있으면 같이 갱신)
    ['guestbookList',       'pageInfo',       'pageIndicator',       'prevPageBtn',       'nextPageBtn'      ],
  ];
  return ids.map(([l,pi,pind,pb,nb]) => ({
    list: document.getElementById(l),
    pageInfo: document.getElementById(pi),
    pageIndicator: document.getElementById(pind),
    prevBtn: document.getElementById(pb),
    nextBtn: document.getElementById(nb),
  })).filter(d => d.list);
}

/* ---------- GuestbookManager ---------- */
const GuestbookManager = {
  _state: { itemsPerPage: 5, currentPage: 1, searchKeyword: '' },

  async init() {
    // DataManager 준비될 때까지 '무기한' 대기
    onDMReady(() => {
      this.updateList(); // 최초 렌더

      // 폰트 로드 완료시 한번만 재렌더
      document.fonts?.ready?.then(() => this.updateList()).catch(()=>{});

      // 검색 인풋 연결(있으면)
      const searchInput = document.getElementById('guestbookSearch');
      if (searchInput) {
        const debounce = (fn, ms=200) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms);} };
        searchInput.addEventListener('input', debounce(e => this.search(e.target.value), 200));
      }
    });
    
    // Firebase 데이터 업데이트 감지 (DataManagerReady 이벤트를 계속 청취)
    window.addEventListener('DataManagerReady', () => {
      if (dmReady()) {
        this.updateList();
      }
    });
  },

  /* ----- 모달 ----- */
  open() { window.ModalManager?.open?.('guestbookModal'); setTimeout(()=>document.getElementById('guestName')?.focus(),100); },
  close() { window.ModalManager?.close?.('guestbookModal'); },

  /* ----- 제출 ----- */
  submit: async function (formData) {
    try {
      window.ModalManager?.showLoading?.('방명록을 저장하는 중...');
      if (!window.FormManager?.validate?.guestbook?.(formData)) { window.ModalManager?.hideLoading?.(); return; }

      const sanitized = window.FormManager?.sanitize?.(formData) ?? formData;
      const entry = { name: sanitized.get('name'), message: sanitized.get('message') };

      await window.APIManager?.submitGuestbook?.(entry); // 서버 연동
      onDMReady(() => { DM().guestbook.add(entry); this.setPage(1); window.ModalManager?.hideLoading?.(); this.close(); });
      window.NotificationManager?.success?.('방명록이 등록되었습니다. 감사합니다! 💕');
      window.AnalyticsManager?.guestbookSubmit?.();
    } catch (e) {
      window.ModalManager?.hideLoading?.();
      console.error('방명록 제출 오류:', e);
      window.NotificationManager?.error?.('방명록 등록 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  },

  /* ----- 페이지네이션 ----- */
  setPage(page) {
    if (!dmReady()) return; // DM 준비 전엔 고정
    const total = DM().guestbook.getAll().length;
    const totalPages = Math.max(1, Math.ceil(total / this._state.itemsPerPage));
    this._state.currentPage = Math.min(Math.max(1, page), totalPages);
    this.updateList();
  },
  goPrevPage() { this.setPage(this._state.currentPage - 1); },
  goNextPage() { this.setPage(this._state.currentPage + 1); },

  /* ----- 렌더링 ----- */
  updateList() {
    const doms = getAllGuestbookDoms();
    if (!doms.length || !dmReady()) return;

    const all = DM().guestbook.getAll() || [];
    const kw = (this._state.searchKeyword || '').toLowerCase();
    const entries = kw
      ? all.filter(e => (e.name||'').toLowerCase().includes(kw) || (e.message||'').toLowerCase().includes(kw))
      : all;

    const total = entries.length;
    const totalPages = Math.max(1, Math.ceil(total / this._state.itemsPerPage));
    if (this._state.currentPage > totalPages) this._state.currentPage = totalPages;

    const start = (this._state.currentPage - 1) * this._state.itemsPerPage;
    const pageEntries = entries.slice(start, start + this._state.itemsPerPage);

    doms.forEach(({ list, pageInfo, pageIndicator, prevBtn, nextBtn }) => {
      list.innerHTML = '';

      if (!total) {
        this.showEmptyState(list);
      } else {
        pageEntries.forEach((entry, i) => {
          const displayNo = total - (start + i); // #003, #002 …
          list.appendChild(this.createGuestbookItem(entry, displayNo));
        });
        const first = list.firstElementChild;
        if (first) { first.classList.add('new-item'); setTimeout(()=> first.classList.remove('new-item'), 1200); }
      }

      if (pageInfo)      pageInfo.textContent = `${this._state.currentPage} / ${totalPages}`;
      if (pageIndicator) pageIndicator.textContent = `PAGE ${this._state.currentPage}`;
      if (prevBtn)       prevBtn.disabled = this._state.currentPage <= 1;
      if (nextBtn)       nextBtn.disabled = this._state.currentPage >= totalPages;
    });
  },

  /* ----- 항목 DOM 생성(DataManager에 의존 안 함) ----- */
  createGuestbookItem(entry, displayNumber) {
    const item = document.createElement('div');
    item.className = 'guestbook-item';
    item.setAttribute('data-id', entry.id);

    const msg = entry.message ?? '';
    const isLong = msg.length > 100;
    const shortMsg = isLong ? msg.slice(0, 100) + '...' : msg;
    const safe = (s) => (window.Utils?.sanitizeString ? window.Utils.sanitizeString(s) : String(s));

    item.innerHTML = `
      <div class="guest-header">
        <div class="guest-name">${safe(entry.name ?? '')}</div>
        <div class="guest-date">${entry.date ?? ''}</div>
      </div>
      <div class="guest-message" ${isLong ? 'data-full-message="'+ safe(msg) + '"' : ''}>
        ${safe(shortMsg)}
        ${isLong ? '<button class="read-more-btn" type="button">더보기</button>' : ''}
      </div>
      <div class="guest-number">#${String(displayNumber).padStart(3,'0')}</div>
    `;

    if (isLong) {
      const messageDiv = item.querySelector('.guest-message');
      const toggle = () => {
        const expanded = messageDiv.getAttribute('data-expanded') === '1';
        if (expanded) {
          messageDiv.innerHTML = `${safe(shortMsg)}<button class="read-more-btn" type="button">더보기</button>`;
          messageDiv.setAttribute('data-expanded', '0');
        } else {
          messageDiv.innerHTML = `${safe(msg)}<button class="read-more-btn" type="button">접기</button>`;
          messageDiv.setAttribute('data-expanded', '1');
        }
        messageDiv.querySelector('.read-more-btn').addEventListener('click', toggle);
      };
      messageDiv.querySelector('.read-more-btn').addEventListener('click', toggle);
    }

    item.addEventListener('click', () => {
      document.querySelectorAll('.guestbook-item.highlighted').forEach(el => el.classList.remove('highlighted'));
      item.classList.add('highlighted');
      setTimeout(() => item.classList.remove('highlighted'), 1500);
    });

    return item;
  },

  /* ----- 빈 상태 ----- */
  showEmptyState(container) {
    container.innerHTML = `
      <div class="empty-state" style="
        text-align:center;color:#666;padding:40px 20px;
        background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);
        border-radius:15px;margin:10px 0;">
        <div style="font-size:3em;margin-bottom:15px;">✍️</div>
        <h4 style="margin-bottom:10px;color:#495057;">아직 방명록이 없습니다</h4>
        <p style="font-size:.9em;color:#6c757d;">첫 번째 축하 메시지를 남겨주세요!</p>
      </div>`;
  },

  /* ----- 검색/통계/내보내기 ----- */
  search(keyword) { this._state.searchKeyword = keyword || ''; this.setPage(1); },

  getStatistics() {
    if (!dmReady()) return { total:0, avgLength:0, longestMessage:'', recentCount:0 };
    const entries = DM().guestbook.getAll() || [];
    if (!entries.length) return { total:0, avgLength:0, longestMessage:'', recentCount:0 };

    const totalLength = entries.reduce((s, e) => s + ((e.message||'').length), 0);
    const avgLength = Math.round(totalLength / entries.length);
    const longestMessage = entries.reduce((m, e) => ((e.message||'').length) > m.length ? e.message : m, '');
    const oneDayAgo = new Date(Date.now() - 24*60*60*1000);
    const recentCount = entries.filter(e => new Date(e.timestamp || e.date) > oneDayAgo).length;

    return {
      total: entries.length,
      avgLength,
      longestMessage: (longestMessage||'').slice(0,50) + ((longestMessage||'').length>50 ? '...' : ''),
      recentCount
    };
  },

  export() {
    if (!dmReady()) { window.NotificationManager?.warning?.('내보낼 방명록이 없습니다.'); return; }
    const entries = DM().guestbook.getAll() || [];
    if (!entries.length) { window.NotificationManager?.warning?.('내보낼 방명록이 없습니다.'); return; }

    let csv = '순번,이름,메시지,작성일\n';
    entries.forEach((e, i) => {
      const row = [
        entries.length - i,
        `"${(e.name||'').replace(/"/g,'""')}"`,
        `"${(e.message||'').replace(/"/g,'""')}"`,
        e.date || ''
      ].join(',');
      csv += row + '\n';
    });

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type:'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `방명록_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    window.NotificationManager?.success?.('방명록이 내보내기 되었습니다.');
  },
};

/* 전역 헬퍼(HTML onClick용) */
window.openGuestbookModal    = () => GuestbookManager.open();
window.previousGuestbookPage = () => GuestbookManager.goPrevPage();
window.nextGuestbookPage     = () => GuestbookManager.goNextPage();

/* 초기화 */
document.addEventListener('DOMContentLoaded', () => { GuestbookManager.init(); });
