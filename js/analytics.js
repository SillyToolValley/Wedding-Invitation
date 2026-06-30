// ========================================
// ANALYTICS MODULE - 분석 및 추적
// ========================================
const AnalyticsManager = {
    // 초기화
    init: function() {
        // Google Analytics 초기화 (gtag가 있을 경우)
        if (typeof gtag !== 'undefined') {
            console.log('Google Analytics 연결됨');
        }
        
        // Facebook Pixel 초기화 (fbq가 있을 경우)
        if (typeof fbq !== 'undefined') {
            console.log('Facebook Pixel 연결됨');
        }
        
        // 세션 시작 추적
        this.track('session_start', {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`
        });
    },

    // 이벤트 추적
    track: function(eventName, properties = {}) {
        const eventData = {
            event: eventName,
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            page_title: document.title,
            ...properties
        };
        
        // 콘솔 로그 (개발 환경에서)
        if (this.isDevelopment()) {
            console.log('Analytics Event:', eventName, eventData);
        }
        
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: properties.event_category || 'engagement',
                event_label: properties.event_label || '',
                value: properties.value || 1,
                custom_parameters: properties
            });
        }
        
        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', this.mapToFacebookEvent(eventName), properties);
        }
        
        // 커스텀 분석 서버 (있을 경우)
        this.sendToCustomAnalytics(eventData);
        
        // 로컬 분석 데이터 저장
        this.saveLocalAnalytics(eventData);
    },

    // 페이지뷰 추적
    pageView: function() {
        this.track('page_view', {
            page_location: window.location.href,
            page_title: document.title,
            referrer: document.referrer || 'direct'
        });
    },

    // 방명록 작성 추적
    guestbookSubmit: function() {
        this.track('guestbook_submit', {
            event_category: 'engagement',
            event_label: 'guestbook_form',
            form_type: 'guestbook'
        });
    },

    // 참석 확인 추적
    attendanceSubmit: function(status) {
        this.track('attendance_submit', {
            event_category: 'rsvp',
            event_label: status,
            attendance_status: status,
            form_type: 'attendance'
        });
    },

    // 공유 추적
    shareEvent: function(method) {
        this.track('share', {
            event_category: 'social',
            event_label: method,
            content_type: 'wedding_invitation',
            share_method: method
        });
    },

    // 연락처 이용 추적
    contactEvent: function(method, side, parentType) {
        this.track('contact_interaction', {
            event_category: 'contact',
            event_label: `${method}_${side}_${parentType}`,
            contact_method: method,
            contact_side: side,
            contact_type: parentType
        });
    },

    // 지도 열기 추적
    mapOpen: function(provider) {
        this.track('map_open', {
            event_category: 'navigation',
            event_label: provider,
            map_provider: provider
        });
    },

    // 사진 슬라이더 상호작용
    sliderInteraction: function(action, slideIndex) {
        this.track('slider_interaction', {
            event_category: 'media',
            event_label: action,
            slider_action: action,
            slide_index: slideIndex
        });
    },

    // 모달 상호작용
    modalInteraction: function(action, modalId) {
        this.track('modal_interaction', {
            event_category: 'ui',
            event_label: `${action}_${modalId}`,
            modal_action: action,
            modal_id: modalId
        });
    },

    // 스크롤 깊이 추적
    trackScrollDepth: function() {
        let maxScroll = 0;
        const milestones = [25, 50, 75, 90, 100];
        const tracked = new Set();

        const trackScroll = Utils.throttle(() => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                milestones.forEach(milestone => {
                    if (scrollPercent >= milestone && !tracked.has(milestone)) {
                        tracked.add(milestone);
                        this.track('scroll_depth', {
                            event_category: 'engagement',
                            event_label: `${milestone}%`,
                            scroll_depth: milestone
                        });
                    }
                });
            }
        }, 500);

        window.addEventListener('scroll', trackScroll, { passive: true });
    },

    // 사용자 참여도 추적
    trackEngagement: function() {
        let startTime = Date.now();
        let isActive = true;
        let totalActiveTime = 0;

        // 활성 상태 추적
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        const resetTimer = () => {
            isActive = true;
            startTime = Date.now();
        };

        events.forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true });
        });

        // 비활성 상태 감지 (30초)
        setInterval(() => {
            if (isActive && Date.now() - startTime > 30000) {
                isActive = false;
                totalActiveTime += 30;
            }
        }, 1000);

        // 페이지 떠날 때 참여도 전송
        window.addEventListener('beforeunload', () => {
            if (isActive) {
                totalActiveTime += (Date.now() - startTime) / 1000;
            }
            
            this.track('user_engagement', {
                event_category: 'engagement',
                engagement_time: Math.round(totalActiveTime),
                session_duration: Date.now() - startTime
            });
        });
    },

    // 에러 추적
    trackError: function(error, context = '') {
        this.track('javascript_error', {
            event_category: 'error',
            event_label: error.message || 'Unknown error',
            error_message: error.message,
            error_stack: error.stack,
            error_context: context,
            page_url: window.location.href
        });
    },

    // 성능 메트릭 추적
    trackPerformance: function() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        this.track('page_performance', {
                            event_category: 'performance',
                            load_time: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                            dom_content_loaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
                            dns_lookup: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
                            server_response: Math.round(perfData.responseEnd - perfData.requestStart)
                        });
                    }
                }, 1000);
            });
        }
    },

    // Facebook 이벤트 매핑
    mapToFacebookEvent: function(eventName) {
        const mapping = {
            'page_view': 'PageView',
            'guestbook_submit': 'Lead',
            'attendance_submit': 'CompleteRegistration',
            'share': 'Share',
            'contact_interaction': 'Contact'
        };
        
        return mapping[eventName] || 'CustomEvent';
    },

    // 커스텀 분석 서버로 전송
    sendToCustomAnalytics: function(eventData) {
        // 실제 구현시 서버 엔드포인트로 전송
        /*
        fetch('/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        }).catch(error => {
            console.warn('Analytics 전송 실패:', error);
        });
        */
    },

    // 로컬 분석 데이터 저장
    saveLocalAnalytics: function(eventData) {
        try {
            // 현재는 메모리에만 저장
            if (!window.localAnalytics) {
                window.localAnalytics = [];
            }
            
            window.localAnalytics.push(eventData);
            
            // 최대 1000개 이벤트만 보관
            if (window.localAnalytics.length > 1000) {
                window.localAnalytics = window.localAnalytics.slice(-1000);
            }
        } catch (error) {
            console.warn('로컬 분석 데이터 저장 실패:', error);
        }
    },

    // 분석 데이터 내보내기 (관리자용)
    exportAnalytics: function() {
        const data = window.localAnalytics || [];
        
        if (data.length === 0) {
            NotificationManager.warning('내보낼 분석 데이터가 없습니다.');
            return;
        }
        
        // JSON 형식으로 내보내기
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
        NotificationManager.success('분석 데이터가 내보내기 되었습니다.');
    },

    // 분석 통계 조회
    getAnalyticsStats: function() {
        const data = window.localAnalytics || [];
        
        if (data.length === 0) {
            return { message: '분석 데이터가 없습니다.' };
        }
        
        const stats = {
            totalEvents: data.length,
            uniqueEvents: [...new Set(data.map(d => d.event))].length,
            pageViews: data.filter(d => d.event === 'page_view').length,
            guestbookSubmissions: data.filter(d => d.event === 'guestbook_submit').length,
            attendanceSubmissions: data.filter(d => d.event === 'attendance_submit').length,
            shares: data.filter(d => d.event === 'share').length,
            contactInteractions: data.filter(d => d.event === 'contact_interaction').length,
            mostRecentEvent: data[data.length - 1]?.timestamp,
            eventTypes: {}
        };
        
        // 이벤트 타입별 카운트
        data.forEach(event => {
            stats.eventTypes[event.event] = (stats.eventTypes[event.event] || 0) + 1;
        });
        
        return stats;
    },

    // 개발 환경 체크
    isDevelopment: function() {
        return window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('192.168.') ||
               window.location.protocol === 'file:';
    },

    // UTM 파라미터 추적
    trackUTMParameters: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const utmParams = {};
        
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
            if (urlParams.has(param)) {
                utmParams[param] = urlParams.get(param);
            }
        });
        
        if (Object.keys(utmParams).length > 0) {
            this.track('utm_tracking', {
                event_category: 'marketing',
                ...utmParams
            });
        }
    }
};
