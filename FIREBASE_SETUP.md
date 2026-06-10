# Firebase Firestore 권한 설정 가이드

## 문제: "Missing or insufficient permissions" 오류

이 오류는 Firestore 보안 규칙이 제한적으로 설정되어 있을 때 발생합니다.

## 해결 방법:

1. **Firebase Console 접속**
   - https://console.firebase.google.com 접속
   - 프로젝트 선택

2. **Firestore Database > Rules 탭으로 이동**

3. **다음 규칙으로 변경:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 개발 중에는 모든 읽기/쓰기 허용 (나중에 보안 강화 필요)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

또는 각 컬렉션별로 세밀하게 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 방명록 - 누구나 읽고 쓸 수 있음
    match /guestbook/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    
    // RSVP - 누구나 읽고 쓸 수 있음
    match /rsvp/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    
    // 게임 점수 - 누구나 읽고 쓸 수 있음  
    match /gameScores/{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

4. **"Publish" 버튼 클릭하여 규칙 적용**

## 주의사항:
- 위 규칙은 개발/테스트용입니다
- 프로덕션 환경에서는 적절한 인증 및 권한 검증 필요
- 예: `allow write: if request.auth != null;` (로그인한 사용자만 쓰기 가능)

## 게임이 보이지 않는 문제:

콘솔(F12)에서 다음을 확인하세요:
1. Canvas 초기화 로그 확인
2. 오류 메시지 확인
3. 네트워크 탭에서 minigame.js 파일이 로드되었는지 확인