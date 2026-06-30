// ========================================
// CONFIG MODULE - 설정 데이터
// ========================================
const CONFIG = {
    wedding: {
        bride: {
            name: '권채린',
            father: { name: '권순문', phone: '0123-4567-8910' },
            mother: { name: '이은숙', phone: '0123-4567-8910' }
        },
        groom: {
            name: '조영민',
            father: { name: '조국제', phone: '0123-4567-8910' },
            mother: { name: '김명선', phone: '0123-4567-8910' }
        },
        date: {
            year: 2025,
            month: 9,
            day: 27,
            time: '오전 11시'
        },
        venue: {
            name: '켄싱턴호텔 여의도 15층',
            address: '서울특별시 영등포구 국회대로 76길 16',
            phone: '0123-4567-8910',
            coordinates: {
                lat: 37.5294,
                lng: 126.9216
            }
        }
    },
    accounts: {
        groom: [
            { name: '조영민', bank: '농협', number: '0123-4567-8910' },
            { name: '조국제 (아버지)', bank: '농협', number: '0123-4567-8910' },
            { name: '김명선 (어머니)', bank: '농협', number: '0123-4567-8910' }
        ],
        bride: [
            { name: '권채린', bank: '기업은행', number: '0123-4567-8910' },
            { name: '권순문 (아버지)', bank: '신한은행', number: '0123-4567-8910' },
            { name: '이은숙 (어머니)', bank: '하나은행', number: '0123-4567-8910' }
        ]
    },
    share: {
        title: '권채린 ❤️ 조영민 결혼식에 초대합니다',
        description: '2025년 9월 27일 토요일 오후 12시 30분\n켄싱턴호텔 여의도 15층',
        smsMessage: '권채린♥조영민 결혼식 관련 문의드립니다.'
    },
    photos: {
        main: 'https://via.placeholder.com/280x280/ff9a9e/ffffff?text=💑',
        album: [
            'https://via.placeholder.com/400x300/ff9a9e/ffffff?text=사진1',
            'https://via.placeholder.com/400x300/fecfef/ffffff?text=사진2',
            'https://via.placeholder.com/400x300/fab1a0/ffffff?text=사진3'
        ]
    },
    map: {
        naver: {
            searchUrl: 'https://map.naver.com/v5/search/',
            appScheme: 'nmap://search?query='
        },
        kakao: {
            searchUrl: 'https://map.kakao.com/link/search/',
            appScheme: 'kakaomap://search?q='
        }
    }
};
