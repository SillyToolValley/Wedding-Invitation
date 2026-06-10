# 고급 보안 조치 - 외부 API 직접 호출 방지

## 현재 취약점
맞습니다. 현재 Firestore Rules만으로는 외부 프로그램이 Firebase SDK를 사용해 직접 데이터를 쓰는 것을 완전히 막을 수 없습니다.

## 구현된 방어 계층

### 1단계: 기본 검증 (구현 완료)
- 점수 범위: 0 ~ 100,000,000 (1억)
- 32-bit overflow 값 차단
- Rate limiting (3초)
- 필드 개수 제한 (정확히 3개)

### 2단계: 오버플로우 값 차단 (구현 완료)
```javascript
// firestore.rules
data.score != 2147483647 // 32-bit 정수 최대값 차단
```

## 추가 권장 보안 조치

### 3단계: Firebase App Check (강력 권장)
**목적**: 정상적인 웹사이트에서만 API 호출 허용

1. Firebase Console에서 App Check 활성화
2. reCAPTCHA v3 설정
3. 코드 추가:
```javascript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR-RECAPTCHA-SITE-KEY'),
  isTokenAutoRefreshEnabled: true
});
```

4. Firestore Rules 업데이트:
```javascript
allow create: if request.auth != null || request.app != null;
```

### 4단계: Cloud Functions로 점수 검증 (최선의 방법)
**서버 측에서 점수 제출 처리**

```javascript
// Cloud Function 예시
exports.submitScore = functions.https.onCall(async (data, context) => {
  // App Check 토큰 검증
  if (!context.app) {
    throw new functions.https.HttpsError('failed-precondition', 'App Check failed');
  }
  
  // 게임 세션 검증
  const session = await validateGameSession(data.sessionId);
  if (!session.valid) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid session');
  }
  
  // 점수 계산 서버에서 수행
  const calculatedScore = calculateScoreFromSession(session);
  
  // Firestore 저장
  await admin.firestore().collection('gameScores').add({
    name: data.name,
    score: calculatedScore,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

### 5단계: 게임 세션 추적
**클라이언트에서 게임 플레이 기록**

```javascript
class GameSession {
  constructor() {
    this.id = crypto.randomUUID();
    this.startTime = Date.now();
    this.events = [];
  }
  
  logEvent(type, data) {
    this.events.push({
      type,
      data,
      timestamp: Date.now() - this.startTime
    });
  }
  
  validate(finalScore) {
    // 시간 대비 점수 검증
    const duration = Date.now() - this.startTime;
    const maxScorePerSecond = 100;
    
    if (finalScore > duration * maxScorePerSecond / 1000) {
      return false; // 비현실적인 점수
    }
    
    // 최소 이벤트 수 확인
    if (this.events.length < 10) {
      return false; // 너무 적은 상호작용
    }
    
    return true;
  }
}
```

### 6단계: 브라우저 환경 검증
```javascript
// 봇/자동화 도구 감지
function detectBot() {
  // Headless 브라우저 감지
  if (navigator.webdriver) return true;
  
  // PhantomJS 감지
  if (window.callPhantom || window._phantom) return true;
  
  // Selenium 감지
  if (document.__selenium_unwrapped) return true;
  
  return false;
}
```

## 즉시 적용 가능한 조치

### 1. Firestore Rules 강화 (이미 적용)
✅ 점수 범위 제한
✅ 패턴 기반 차단
✅ 필드 검증

### 2. 클라이언트 검증 강화
```javascript
// index.html에 추가
window.gameSessionActive = false;
window.gameStartTime = 0;

// 게임 시작 시
window.startGameSession = function() {
  window.gameSessionActive = true;
  window.gameStartTime = Date.now();
};

// 점수 제출 시
if (!window.gameSessionActive) {
  alert('정상적인 게임 플레이가 아닙니다.');
  return false;
}

const playTime = Date.now() - window.gameStartTime;
if (playTime < 5000) { // 5초 미만
  alert('너무 짧은 플레이 시간입니다.');
  return false;
}
```

### 3. 숨겨진 검증 필드
```javascript
// Firestore에 저장할 때 검증용 해시 추가
const scoreHash = btoa(score + ':' + name + ':' + Date.now());
```

## 결론

### 현재 방어 수준: 중간
- 단순한 조작은 방지 가능
- 전문적인 해킹은 방지 어려움

### App Check 적용 시: 높음
- 대부분의 외부 프로그램 차단
- 정교한 우회는 여전히 가능

### Cloud Functions 적용 시: 매우 높음
- 서버 측 검증으로 조작 거의 불가능
- 가장 안전한 방법

## 추천 우선순위
1. **즉시**: 클라이언트 세션 검증 추가
2. **단기**: Firebase App Check 활성화
3. **장기**: Cloud Functions로 마이그레이션