/* ============================================================
   CONFIG — 단일 진실 공급원 (Single Source of Truth)
   이 파일의 값만 바꾸면 전체 청첩장 내용이 갱신됩니다.
   ============================================================ */
const isRedesignDocument = window.location.pathname.includes('/redesign/');
const assetBase = isRedesignDocument ? '../assets/' : 'assets/';
const asset = (path) => assetBase + path;

window.WEDDING = {
  couple: {
    groom: { name: '조영민', role: '장남', parents: '조국제 · 김명선' },
    bride: { name: '권채린', role: '차녀', parents: '권순문 · 이은숙' }
  },

  // 예식 일시 (countdown / calendar 가 이 값을 사용)
  date: { year: 2025, month: 9, day: 27, hour: 11, minute: 0 },
  dateLabel: '2025년 9월 27일 토요일 오전 11시',

  venue: {
    name: '켄싱턴호텔 여의도',
    hall: '15층 그랜드볼룸',
    address: '서울특별시 영등포구 국회대로 76길 16',
    tel: '02-6670-7000',
    lat: 37.5294, lng: 126.9216
  },

  transit: [
    { type: 'subway', title: '지하철', lines: '9호선 국회의사당역 3번 출구 (도보 3분)\n5호선 여의나루역 1번 출구 (도보 10분)' },
    { type: 'bus',    title: '버스',   lines: '여의도 순복음교회 하차\n5615 · 5618 · 6623 · 753' }
  ],

  parents: {
    groom: {
      label: '신랑측',
      father: { role: '아버지', name: '조국제', tel: '010-1234-5678' },
      mother: { role: '어머니', name: '김명선', tel: '010-2345-6789' }
    },
    bride: {
      label: '신부측',
      father: { role: '아버지', name: '권순문', tel: '010-3456-7890' },
      mother: { role: '어머니', name: '이은숙', tel: '010-4567-8901' }
    }
  },

  accounts: {
    groom: [
      { holder: '조영민',        bank: '농협',     number: '302-1008-6711-31' },
      { holder: '조국제 (아버지)', bank: '농협',     number: '848-02-052946' },
      { holder: '김명선 (어머니)', bank: '농협',     number: '177784-56-065611' }
    ],
    bride: [
      { holder: '권채린',        bank: '기업은행',  number: '010-4448-3268' },
      { holder: '권순문 (아버지)', bank: '신한은행',  number: '323-04-048686' },
      { holder: '이은숙 (어머니)', bank: '하나은행',  number: '125-910052-94207' }
    ]
  },

  message: {
    invite:
      '서로에게 기댈 수 있는 나무가 되기로 했습니다.\n' +
      '바람이 불어도, 비가 내려도 그늘이 되어 주고\n' +
      '뿌리가 되어 주는 마음으로 함께 걸어가려 합니다.\n' +
      '그 첫 걸음을 축복해 주시면 감사하겠습니다.',
    // 레트로(게임) 테마 전용 인사말
    inviteRetro:
      'PLAYER 1과 PLAYER 2가\n' +
      "LIFE GAME의 '평생 듀오' 퀘스트를 시작합니다.\n" +
      '바람이 불어도, 비가 내려도\n' +
      '서로의 HP를 채워주는 그늘처럼,\n' +
      'MP를 회복시키는 뿌리처럼\n' +
      '한 팀으로 걸어가겠습니다.\n' +
      '우리의 1 STAGE를 함께 클리어해 주세요.\n' +
      '♥ ♥ ♥',
    closing:
      '소중한 날에 함께해 주셔서\n진심으로 감사드립니다.'
  },

  share: {
    title: '권채린 ♥ 조영민, 결혼합니다',
    description: '2025년 9월 27일 토요일 오전 11시\n켄싱턴호텔 여의도 15층 그랜드볼룸'
  },

  // 모던: 실제 감성 사진 / 레트로: 64-bit 스타일 픽셀아트 변환본 (assets/AlbumSlidesRetro, assets/main_retro.png)
  gallery: [
    asset('AlbumSlides/album1.jpg'),
    asset('AlbumSlides/album2.jpg'),
    asset('AlbumSlides/album3.jpg'),
    asset('AlbumSlides/album4.jpg'),
    asset('AlbumSlides/album5.jpg')
  ],
  galleryRetro: [
    asset('AlbumSlidesRetro/album1.png'),
    asset('AlbumSlidesRetro/album2.png'),
    asset('AlbumSlidesRetro/album3.png'),
    asset('AlbumSlidesRetro/album4.png'),
    asset('AlbumSlidesRetro/album5.png')
  ],
  heroPhoto: asset('main.jpg'),
  heroPhotoRetro: asset('main_retro.png')
};
