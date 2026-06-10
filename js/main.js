/*  main.js  — 결혼식 초대장 메인 로직 */

import {
  initFirebase, addGuestbook, listenGuestbook, addRsvp
} from './firebase.js';

document.addEventListener('DOMContentLoaded', async () => {

  /* 0) Firebase 초기화 */
  initFirebase();

  /* 1) 달력 렌더링 (간단) */
  buildCalendar();

  /* 2) Swiper 앨범 */
  new Swiper('.swiper', { loop: true, slidesPerView: 'auto', spaceBetween: 12 });

  /* 3) NAVER 지도 */
  window.naver.maps.onJSContentLoaded = () => {
    const pos = new naver.maps.LatLng(37.528683, 126.918452);
    const map = new naver.maps.Map('map', { center: pos, zoom: 16 });
    new naver.maps.Marker({ position: pos, map });
    document.getElementById('openNaverApp').onclick =
      () => location.href = 'nmap://place?lat=37.528683&lng=126.918452&name=켄싱턴호텔여의도';
  };

  /* 4) 방명록 작성 */
  const gbForm = document.getElementById('guestbookForm');
  gbForm.onsubmit = async e => {
    e.preventDefault();
    await addGuestbook(gbForm.name.value.trim(), gbForm.msg.value.trim());
    gbForm.reset();
  };

  /* 5) 실시간 방명록 출력 */
  listenGuestbook(list => {
    const ul = document.getElementById('guestbookList');
    ul.innerHTML = list.map(d => `
      <li class="bg-white p-3 rounded-lg shadow">
        <strong>${escapeHtml(d.name)}</strong>
        <p class="mt-1 text-sm break-all whitespace-pre-wrap">${escapeHtml(d.msg)}</p>
      </li>`).join('');
  });

  /* 6) RSVP 모달 */
  const modal = document.getElementById('rsvpModal');
  document.getElementById('openRsvp').onclick = () => modal.classList.remove('hidden');
  document.getElementById('closeRsvp').onclick = () => modal.classList.add('hidden');
  document.getElementById('submitRsvp').onclick = async () => {
    const data = {
      name  : document.getElementById('rsvpName').value.trim(),
      phone : '',
      side  : document.getElementById('rsvpSide').value,
      meal  : document.getElementById('rsvpMeal').value,
      totalGuests: +document.getElementById('rsvpTotal').value || 1,
      attend: document.getElementById('rsvpAttend').value
    };
    if (!data.name) return alert('이름을 입력해주세요!');
    await addRsvp(data);
    alert('답변이 저장되었습니다. 감사합니다!');
    modal.classList.add('hidden');
  };

  /* 7) 계좌번호 복사 */
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.onclick = () => navigator.clipboard.writeText(btn.dataset.acct)
      .then(() => alert('복사되었습니다!'));
  });

  /* 8) 카카오 공유 */
  Kakao.init('YOUR_KAKAO_JS_KEY');
  document.getElementById('shareKakao').onclick = () => {
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '권채린 · 조영민 결혼식',
        description: '2025-09-27 켄싱턴호텔 여의도',
        imageUrl: location.origin + '/assets/hero.jpg',
        link: { mobileWebUrl: location.href, webUrl: location.href }
      }
    });
  };

  /* 9) URL 복사 */
  document.getElementById('copyUrl').onclick =
    () => navigator.clipboard.writeText(location.href)
         .then(()=>alert('주소가 복사되었습니다.'));
});

/* ---------- 유틸 ---------- */

function buildCalendar () {
  const daysKor   = ['일','월','화','수','목','금','토'];
  const calendar  = document.getElementById('calendar');
  const dayCells  = Array.from({ length: 30 }, (_, i) => {
    const d = i + 1;
    const mark = d === 27 ? 'bg-rose-500 text-white rounded-full' : '';
    return `<span class="text-sm ${mark}">${d}</span>`;
  }).join('');
  calendar.innerHTML = `
    <div class="text-center">
      <p class="font-semibold mb-1">2025 년 9 월</p>
      <div class="grid grid-cols-7 gap-1">${daysKor.map(d=>`<span>${d}</span>`).join('')}${dayCells}</div>
    </div>`;
}

function escapeHtml (str) {
  return str.replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
}
