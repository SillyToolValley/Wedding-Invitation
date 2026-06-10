# GitHub Pages 배포 가이드

## 배포 방법

### 1. GitHub Actions 사용 (권장)
이미 `.github/workflows/static.yml` 파일이 설정되어 있습니다.
main 브랜치에 push하면 자동으로 배포됩니다.

### 2. 수동 설정
1. GitHub 저장소 → Settings → Pages
2. Source: "GitHub Actions" 선택
3. Save

### 3. 배포 확인
- URL: https://luke-youngmin-cho.github.io/Wedding-Invitation/
- 배포 후 5-10분 정도 기다려야 반영됩니다

## 파일 구조
```
Wedding-Invitation/
├── index.html           # 메인 파일
├── modern-theme.css     # 모던 테마
├── retro-final.css      # 레트로 테마
├── js/                  # JavaScript 파일들
├── assets/              # 이미지 파일들
│   ├── main.jpg
│   └── AlbumSlides/
│       ├── album1.JPG
│       ├── album2.JPG
│       ├── album3.JPG
│       ├── album4.JPG
│       └── album5.JPG
├── pwa-192x192.png      # PWA 아이콘
├── pwa-512x512.png      # PWA 아이콘
└── manifest.json        # PWA 설정
```

## 주의사항
- 이미지 파일명 대소문자 확인 (GitHub Pages는 대소문자 구분)
- Firebase 설정은 js/config.js에서 관리
- Vite 빌드는 사용하지 않음 (정적 파일 직접 배포)

## 문제 해결
1. 이미지가 안 보일 때: 파일명 대소문자 확인
2. JavaScript 에러: 브라우저 콘솔(F12) 확인
3. PWA 아이콘 에러: pwa-192x192.png, pwa-512x512.png 파일 존재 확인