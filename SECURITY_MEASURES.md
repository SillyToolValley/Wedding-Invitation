# 미니게임 보안 및 어뷰징 방지 조치

## 문제 분석
Firebase에서 발견된 2,147,483,647 값은 32-bit signed integer의 최대값으로, 다음과 같은 원인이 가능합니다:
- Integer overflow 공격
- 클라이언트 측 변조
- 메모리 오버플로우

## 구현된 보안 조치

### 1. 클라이언트 측 검증 (js/minigame.js)
- **최대 점수 제한**: 100,000,000점 (1억점)
- **거리 계산 오버플로우 방지**: 
  ```javascript
  const MAX_SAFE_DISTANCE = 100000000;
  if (world.distance + distanceIncrement < MAX_SAFE_DISTANCE) {
    world.distance += distanceIncrement;
  }
  ```
- **점수 검증 로직**: NaN, Infinity, 음수 값 차단
- **게임 세션 추적**: 모든 플레이어 액션 기록 및 검증
  - 최소 플레이 시간: 5초
  - 시간당 최대 점수: 분당 15,000m
  - 체크포인트 검증
  - 액션 수 검증

### 2. 제출 시점 검증 (index.html - submitGameScore)
- **타입 검증**: number 타입만 허용
- **범위 검증**: 0 ~ 100,000,000 사이만 허용
- **특수값 차단**: 2,147,483,647 명시적 차단
- **이름 검증**: 빈 문자열 및 50자 초과 차단
- **Rate Limiting**: 3초 간격 제한
- **세션 데이터 전송**: 검증용 메타데이터 포함

### 3. 서버 측 검증 (firestore.rules)
```javascript
function isValidGameScore(data) {
  return data.score is int &&
         data.score >= 0 &&
         data.score <= 100000000 &&
         data.score != 2147483647 &&
         data.ts == request.time;
}
```

## 추가 권장사항

### 단기 조치
1. **기존 비정상 데이터 정리**
   - Firebase Console에서 2,147,483,647 값 수동 삭제
   - 100만점 이상 기록 모두 검토

2. **모니터링**
   - 비정상적으로 높은 점수 알림 설정
   - 짧은 시간 내 반복 제출 패턴 감지

### 장기 조치
1. **서버 측 게임 로직**
   - 중요한 게임 로직을 Cloud Functions로 이동
   - 점수 계산을 서버에서 수행

2. **플레이 세션 검증**
   - 게임 시작/종료 시간 기록
   - 현실적인 점수/시간 비율 검증

3. **사용자 인증**
   - Firebase Auth 도입 검토
   - IP 기반 제한 고려

## 배포 방법
```bash
# Firestore Rules 배포
firebase deploy --only firestore:rules

# 또는 Firebase Console에서 직접 수정
1. https://console.firebase.google.com
2. Firestore Database > Rules
3. 새 규칙 붙여넣기 > Publish
```

## 테스트 체크리스트
- [ ] 정상 점수 (0~1,000,000) 제출 확인
- [ ] 음수 점수 차단 확인
- [ ] 2,147,483,647 값 차단 확인
- [ ] 빠른 연속 제출 차단 확인
- [ ] 빈 이름 차단 확인