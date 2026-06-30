// Firebase App Check 초기화
// 외부 프로그램의 직접 API 호출 방지

import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// App Check 초기화 함수
export function initializeFirebaseAppCheck(app) {
    // reCAPTCHA v3 사이트 키 필요 (Firebase Console에서 생성)
    const RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_V3_SITE_KEY';
    
    // Development 환경에서는 debug token 사용
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        // Firebase Console에서 생성한 debug token
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    
    // App Check 초기화
    const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true // 토큰 자동 갱신
    });
    
    return appCheck;
}

// 게임 세션 검증을 위한 추가 보안
export class GameSessionValidator {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.actions = [];
        this.checkpoints = [];
    }
    
    generateSessionId() {
        return crypto.randomUUID ? crypto.randomUUID() : 
               Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    recordAction(action, value) {
        this.actions.push({
            action,
            value,
            timestamp: Date.now() - this.startTime
        });
    }
    
    recordCheckpoint(distance) {
        this.checkpoints.push({
            distance,
            timestamp: Date.now() - this.startTime
        });
    }
    
    validateSession(finalScore) {
        const duration = Date.now() - this.startTime;
        
        // 최소 플레이 시간 (5초)
        if (duration < 5000) {
            console.warn('Session too short:', duration);
            return false;
        }
        
        // 시간당 최대 점수 제한 (분당 최대 10,000m)
        const maxScorePerMinute = 10000;
        const maxPossibleScore = (duration / 60000) * maxScorePerMinute;
        
        if (finalScore > maxPossibleScore) {
            console.warn('Score too high for duration:', finalScore, maxPossibleScore);
            return false;
        }
        
        // 체크포인트 검증 (점진적 증가 확인)
        if (this.checkpoints.length > 1) {
            for (let i = 1; i < this.checkpoints.length; i++) {
                if (this.checkpoints[i].distance <= this.checkpoints[i-1].distance) {
                    console.warn('Invalid checkpoint progression');
                    return false;
                }
            }
        }
        
        // 액션 수 검증 (최소 상호작용)
        if (this.actions.length < 3) {
            console.warn('Too few actions:', this.actions.length);
            return false;
        }
        
        return true;
    }
    
    getSessionData() {
        return {
            sessionId: this.sessionId,
            duration: Date.now() - this.startTime,
            actionCount: this.actions.length,
            checkpointCount: this.checkpoints.length
        };
    }
}

// 브라우저 핑거프린팅 (간단한 버전)
export function getBrowserFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    
    const dataURL = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataURL.length; i++) {
        const char = dataURL.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    return {
        fingerprint: Math.abs(hash).toString(36),
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
}