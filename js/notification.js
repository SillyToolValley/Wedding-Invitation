// ========================================
// NOTIFICATION MODULE - 알림 관리
// ========================================
const NotificationManager = {
    show: function(message, type = 'info', duration = 3000) {
        // 기존 알림이 있다면 제거
        this.clearExisting();
        
        // 알림 요소 생성
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 스타일 적용
        this.applyStyles(notification, type);
        
        // DOM에 추가
        document.body.appendChild(notification);
        
        // 애니메이션으로 표시
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 자동 제거
        setTimeout(() => {
            this.hide(notification);
        }, duration);
        
        // 클릭으로 닫기
        notification.addEventListener('click', () => {
            this.hide(notification);
        });
        
        return notification;
    },
    
    applyStyles: function(notification, type) {
        const baseStyles = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '9999',
            fontSize: '14px',
            maxWidth: '300px',
            cursor: 'pointer',
            userSelect: 'none',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        };
        
        // 기본 스타일 적용
        Object.assign(notification.style, baseStyles);
        
        // 타입별 색상
        const colors = this.getColors(type);
        notification.style.background = colors.background;
        notification.style.color = colors.color;
    },
    
    getColors: function(type) {
        const colorMap = {
            'success': { background: '#4CAF50', color: 'white' },
            'error': { background: '#f44336', color: 'white' },
            'warning': { background: '#ff9800', color: 'white' },
            'info': { background: '#2196F3', color: 'white' }
        };
        return colorMap[type] || colorMap.info;
    },
    
    hide: function(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },
    
    clearExisting: function() {
        const existing = document.querySelectorAll('.notification');
        existing.forEach(notification => {
            this.hide(notification);
        });
    },
    
    success: function(message, duration = 3000) {
        return this.show(message, 'success', duration);
    },
    
    error: function(message, duration = 4000) {
        return this.show(message, 'error', duration);
    },
    
    warning: function(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    },
    
    info: function(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
};
