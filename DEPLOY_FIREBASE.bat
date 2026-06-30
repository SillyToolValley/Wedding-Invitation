@echo off
echo ===================================
echo Firebase Rules 배포 스크립트
echo ===================================
echo.
echo 1. 먼저 Firebase CLI가 설치되어 있는지 확인하세요:
echo    npm install -g firebase-tools
echo.
echo 2. Firebase에 로그인:
echo    firebase login
echo.
echo 3. 프로젝트 초기화 (처음 한 번만):
echo    firebase init firestore
echo.
echo 4. Rules 배포:
echo    firebase deploy --only firestore:rules
echo.
echo ===================================
echo 수동으로 Firebase Console에서 수정하려면:
echo.
echo 1. https://console.firebase.google.com 접속
echo 2. 프로젝트 선택
echo 3. Firestore Database > Rules 탭
echo 4. firestore.rules 파일 내용 복사/붙여넣기
echo 5. Publish 클릭
echo ===================================
pause