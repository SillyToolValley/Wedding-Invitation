// ========================================
// APP INITIALIZATION - 앱 초기화
// ========================================
const WeddingApp = {
    init: function() {
        console.log('Wedding App 초기화 시작...');
        const startTime = performance.now();
        
        try {
            // 데이터 로드
            DataManager.loadFromStorage();
            
            // 각 모듈 초기화
            CalendarManager.generate();
            SliderManager.init();
            ModalManager.setupEventListeners();
            GuestbookManager.updateList();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 이미지 에러 처리
            this.setupImageErrorHandling();
            
            // 성능 최적화 적용
            PerformanceManager.lazyLoadImages();
            
            // 분석 추적
            AnalyticsManager.pageView();
            
            // 초기화 완료
            const endTime = performance.now();
            console.log(`Wedding app 초기화 완료: ${(endTime - startTime).toFixed(2)}ms`);
            
            // 초기화 완료 이벤트 발생
            this.onInitComplete();
            
        } catch (error) {
            console.error('앱 초기화 중 오류 발생:', error);
            NotificationManager.error('앱 초기화 중 오류가 발생했습니다.');
        }
    },

    setupEventListeners: function() {
        // 방명록 폼 제출
        const guestbookForm = document.getElementById('guestbookForm');
        if (guestbookForm) {
            guestbookForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                GuestbookManager.submit(formData);
            });
        }

        // 참석여부 폼 제출
        const attendanceForm = document.getElementById('attendanceForm');
        if (attendanceForm) {
            attendanceForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                AttendanceManager.submit(formData);
            });
        }

        // 키보드 이벤트
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // 윈도우 리사이즈 이벤트
        window.addEventListener('resize', Utils.debounce(() => {
            SliderManager.update();
        }, 250));

        // 페이지 가시성 변경 이벤트
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                SliderManager.startAutoSlide();
            } else {
                SliderManager.stopAutoSlide();
            }
        });
    },

    handleKeydown: function(e) {
        // ESC 키로 모달 닫기
        if (e.key === 'Escape') {
            ModalManager.closeAll();
        }
        
        // 사진 슬라이더 키보드 컨트롤
        if (e.key === 'ArrowLeft') {
            SliderManager.previous();
        } else if (e.key === 'ArrowRight') {
            SliderManager.next();
        }
    },

    setupImageErrorHandling: function() {
        // 메인 사진 에러 처리
        const mainPhoto = document.getElementById('mainPhoto');
        if (mainPhoto) {
            mainPhoto.onerror = function() {
                this.src = 'https://via.placeholder.com/280x280/ff9a9e/ffffff?text=💑+사진을+업로드해주세요';
            };
        }

        // 앨범 사진들 에러 처리
        document.querySelectorAll('.photo-slide img').forEach((img, index) => {
            img.onerror = function() {
                this.src = `https://via.placeholder.com/400x300/ff9a9e/ffffff?text=사진${index + 1}`;
            };
        });
    },

    onInitComplete: function() {
        // 로딩 스피너 제거 (있다면)
        const loader = document.querySelector('.loader');
        if (loader) {
            loader.style.display = 'none';
        }

        // 메인 컨테이너 표시
        const container = document.querySelector('.container');
        if (container) {
            container.style.opacity = '1';
        }

        // 웰컴 메시지 (선택사항)
        // NotificationManager.info('청첩장에 오신 것을 환영합니다! 💕');
    }
};

// ========================================
// GLOBAL FUNCTIONS - HTML에서 호출되는 전역 함수들
// ========================================

// 사진 슬라이더
function nextPhoto() { 
    SliderManager.next(); 
}

function previousPhoto() { 
    SliderManager.previous(); 
}

// 연락처
function callParent(side, parent) { 
    ContactManager.call(side, parent); 
}

function smsParent(side, parent) { 
    ContactManager.sms(side, parent); 
}

// 지도
function openNaverMap() { 
    MapManager.openNaverMap(); 
}

function openKakaoMap() { 
    MapManager.openKakaoMap(); 
}

// 방명록
function openGuestbookModal() { 
    GuestbookManager.open(); 
}

function closeGuestbookModal() { 
    GuestbookManager.close(); 
}

// 참석여부
function openAttendanceModal() { 
    AttendanceManager.open(); 
}

function closeAttendanceModal() { 
    AttendanceManager.close(); 
}

// 계좌 복사
function copyAccount(accountNumber) { 
    Utils.copyToClipboard(accountNumber, '계좌번호가 복사되었습니다.'); 
}

// 공유
function shareKakao() { 
    Utils.share(); 
}

function copyURL() { 
    Utils.copyToClipboard(window.location.href, '주소가 복사되었습니다.'); 
}

// ========================================
// APP START - 앱 시작
// ========================================

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', function() {
    WeddingApp.init();
});

// 페이지 완전 로드 후 추가 최적화
window.addEventListener('load', function() {
    // 이미지 지연 로딩 재검사
    PerformanceManager.lazyLoadImages();
    
    // 폰트 로딩 완료 확인
    if (document.fonts) {
        document.fonts.ready.then(() => {
            console.log('폰트 로딩 완료');
        });
    }
});

// 에러 핸들링
window.addEventListener('error', function(e) {
    console.error('전역 에러 발생:', e.error);
    // 중요한 에러의 경우 사용자에게 알림
    if (e.error && e.error.message) {
        NotificationManager.error('문제가 발생했습니다. 페이지를 새로고침해 주세요.');
    }
});

// Promise 에러 핸들링
window.addEventListener('unhandledrejection', function(e) {
    console.error('처리되지 않은 Promise 에러:', e.reason);
    e.preventDefault(); // 기본 에러 표시 방지
});

// ========================================
// ADMIN FUNCTIONS - 관리자 기능 (개발/테스트용)
// ========================================
window.WeddingAdmin = {
    // 데이터 확인
    getData: () => DataManager.data,
    
    // 방명록 통계
    getGuestbookStats: () => ({
        total: DataManager.guestbook.getAll().length,
        latest: DataManager.guestbook.getAll().slice(0, 5)
    }),
    
    // 참석자 통계
    getAttendanceStats: () => DataManager.attendance.getStatistics(),
    
    // 데이터 내보내기
    exportData: () => DataManager.export(),
    
    // 데이터 초기화
    resetData: () => {
        if (confirm('모든 데이터를 초기화하시겠습니까?')) {
            DataManager.reset();
            location.reload();
        }
    },
    
    // 테스트 알림
    testNotification: (type = 'info') => {
        NotificationManager[type](`테스트 ${type} 알림입니다.`);
    }
};

// 개발 모드에서만 콘솔에 관리자 기능 안내
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 개발 모드 - 관리자 기능 사용 가능:');
    console.log('WeddingAdmin.getData() - 데이터 확인');
    console.log('WeddingAdmin.getGuestbookStats() - 방명록 통계');
    console.log('WeddingAdmin.getAttendanceStats() - 참석자 통계');
    console.log('WeddingAdmin.exportData() - 데이터 내보내기');
    console.log('WeddingAdmin.resetData() - 데이터 초기화');
}
