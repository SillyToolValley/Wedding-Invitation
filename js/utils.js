// ========================================
// UTILITY MODULE - 유틸리티 함수들
// ========================================
const Utils = {
    // 클립보드 복사
    copyToClipboard: function(text, successMessage = '복사되었습니다.') {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                NotificationManager.success(successMessage);
            }).catch(() => {
                this.fallbackCopy(text, successMessage);
            });
        } else {
            this.fallbackCopy(text, successMessage);
        }
    },

    // 구형 브라우저용 복사 fallback
    fallbackCopy: function(text, successMessage) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            NotificationManager.success(successMessage);
        } catch (err) {
            console.error('복사 실패:', err);
            NotificationManager.error('복사에 실패했습니다.');
        }
        
        document.body.removeChild(textArea);
    },

    // 공유 기능
    share: function() {
        const url = window.location.href;
        const { title, description } = CONFIG.share;
        
        // 분석 추적
        AnalyticsManager.shareEvent('web_share');
        
        if (navigator.share) {
            navigator.share({
                title: title,
                text: description,
                url: url
            }).catch((error) => {
                console.log('공유 취소 또는 실패:', error);
            });
        } else {
            this.copyToClipboard(url, '주소가 복사되었습니다.');
        }
    },

    // 전화번호 포맷팅
    formatPhoneNumber: function(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        }
        return phone;
    },

    // 날짜 포맷팅
    formatDate: function(date) {
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        }).format(date);
    },

    // 모바일 체크
    isMobile: function() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // 디바운스 함수
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 스로틀 함수
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // URL 인코딩
    encodeForURL: function(str) {
        return encodeURIComponent(str);
    },

    // XSS 방지 문자열 정제
    sanitizeString: function(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // 랜덤 ID 생성
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};
