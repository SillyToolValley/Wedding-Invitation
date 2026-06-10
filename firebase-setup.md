# Firebase 설정 가이드

## 로컬 테스트 방법

### 1. Firebase Console 설정
1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 생성 또는 선택
3. **Authentication** > **Settings** > **Authorized domains**에 추가:
   - `localhost`
   - `127.0.0.1`
   - `YOUR-USERNAME.github.io` (GitHub Pages 도메인)

### 2. Firestore 설정
1. **Firestore Database** 생성 (아직 없다면)
2. **Rules** 탭에서 임시 개발용 규칙 설정:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 개발 중 테스트용 (보안 주의!)
    match /guestbook/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    match /rsvp/{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### 3. Firebase 설정 추가
`js/firebase-config.js` 파일에서 YOUR_로 시작하는 값들을 실제 Firebase 프로젝트 값으로 교체:

```javascript
const firebaseConfig = {
    apiKey: "실제-API-키",
    authDomain: "프로젝트명.firebaseapp.com",
    projectId: "프로젝트-ID",
    storageBucket: "프로젝트명.appspot.com",
    messagingSenderId: "센더-ID",
    appId: "앱-ID"
};
```

Firebase Console > Project Settings > General 에서 확인 가능

### 4. 로컬 서버 실행
단순히 HTML 파일을 더블클릭하면 CORS 에러가 발생할 수 있습니다.
로컬 서버를 실행해야 합니다:

#### 방법 1: Python (가장 간단)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
브라우저에서 `http://localhost:8000/index-final.html` 접속

#### 방법 2: Node.js (http-server)
```bash
# 설치
npm install -g http-server

# 실행
http-server -p 8000
```

#### 방법 3: VS Code Live Server
VS Code의 Live Server 확장 프로그램 사용

### 5. 테스트
1. 브라우저 개발자 도구(F12) 열기
2. Console 탭에서 에러 확인
3. Network 탭에서 Firebase 요청 확인

## GitHub Pages 배포시

### 1. GitHub Secrets 설정
Repository > Settings > Secrets and variables > Actions에서:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

### 2. GitHub Actions 워크플로우
`.github/workflows/deploy.yml`에 환경 변수 주입 스크립트 추가

### 3. 보안 규칙 강화 (프로덕션)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /guestbook/{document=**} {
      allow read: if true;
      allow create: if request.resource.data.name is string 
        && request.resource.data.name.size() <= 50
        && request.resource.data.message is string
        && request.resource.data.message.size() <= 500;
      allow update, delete: if false;
    }
    match /rsvp/{document=**} {
      allow read: if false; // 관리자만 읽기
      allow create: if request.resource.data.name is string
        && request.resource.data.phone is string;
      allow update, delete: if false;
    }
  }
}
```

## 문제 해결

### CORS 에러
- 로컬 서버 사용 필수
- Firebase Console에서 도메인 추가 확인

### Permission Denied
- Firestore Rules 확인
- Firebase 프로젝트 설정 확인

### 연결 안됨
- API 키가 올바른지 확인
- 네트워크 연결 확인
- 브라우저 콘솔 에러 확인