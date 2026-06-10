# 캐시 버스팅 가이드

## 개요
브라우저 캐시로 인해 업데이트가 즉시 반영되지 않는 문제를 해결하기 위한 캐시 버스팅 시스템입니다.

## 구현 내용

### 1. 버전 관리 시스템
- `version.json`: 현재 버전 정보 저장
- 모든 CSS/JS 파일에 버전 쿼리 파라미터 추가 (`?v=2024-12-19-1`)

### 2. 자동 새로고침
페이지 로드 시 버전을 체크하여 새 버전이 있으면 자동으로 새로고침:

```javascript
// 버전 체크 및 자동 새로고침
const res = await fetch('/version.json', { cache: 'no-store' });
const { version } = await res.json();
if (localVersion !== version) {
    location.reload(true);
}
```

### 3. Service Worker 관리
- 기존 Service Worker 제거
- 버전별 Service Worker 등록

## 사용 방법

### 자동 업데이트 (권장)

#### Windows:
```batch
update-version.bat
```

#### Mac/Linux:
```bash
node update-version.js
```

### 수동 업데이트

1. **version.json 수정**
```json
{
  "version": "2024-12-19-2",
  "lastUpdated": "2024-12-19T11:00:00Z"
}
```

2. **index.html 수정**
- `SITE_VERSION` 상수 업데이트
- 모든 CSS/JS 링크의 `?v=` 파라미터 업데이트

## 버전 형식
`YYYY-MM-DD-N`
- YYYY: 년도
- MM: 월
- DD: 일
- N: 당일 릴리즈 번호

## 장점
1. **즉시 반영**: 새 버전 배포 시 사용자가 자동으로 최신 버전 로드
2. **캐시 활용**: 같은 버전은 캐시에서 로드하여 성능 향상
3. **관리 용이**: 스크립트로 버전 업데이트 자동화

## 주의사항
1. GitHub Pages는 캐시가 강력하므로 최대 10분 정도 딜레이 발생 가능
2. CloudFlare 등 CDN 사용 시 추가 캐시 무효화 필요
3. 로컬 테스트 시 브라우저 개발자 도구에서 "Disable cache" 옵션 활용

## 문제 해결

### 업데이트가 반영되지 않을 때
1. 브라우저 캐시 강제 새로고침: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
2. 브라우저 캐시 삭제
3. 시크릿/프라이빗 창에서 테스트
4. Service Worker 수동 제거:
   - 개발자 도구 → Application → Service Workers → Unregister

### 버전 충돌 시
1. `localStorage.clear()` 실행
2. 모든 Service Worker 제거
3. 페이지 새로고침

## 개발 팁
- 개발 중에는 브라우저 개발자 도구의 "Disable cache" 옵션 활성화
- 배포 전 항상 버전 업데이트
- 중요한 업데이트는 버전 설명을 version.json에 추가