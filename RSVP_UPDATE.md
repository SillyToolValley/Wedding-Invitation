# RSVP 폼 업데이트 내역

## 변경 사항

### 1. 동행 인원 세분화
**기존**: 동행 인원 (본인 포함) - 단일 숫자 필드
**변경**: 
- **성인**: 1-10명 (기본값: 1)
- **유아**: 0-5명 (기본값: 0)

### 2. 식사 참석 옵션 추가
새로운 드롭다운 필드 추가:
- 전 일정 참석하겠습니다
- 예식만 참석하고 식사는 어려울 것 같습니다
- 식사만 하고 인사드리고 가겠습니다

## 데이터베이스 구조

### Firestore 필드
```javascript
{
  name: string,           // 성함 (필수)
  phone: string,          // 전화번호 (빈 문자열)
  status: string,         // 참석여부 (attend/absent)
  adultCount: number,     // 성인 인원 (NEW)
  babyCount: number,      // 유아 인원 (NEW)
  mealAttendance: string, // 식사 참석 (NEW: full/ceremony/meal)
  relation: string,       // 구분 (groom/bride)
  count: number,          // 총 인원 (호환성 유지: 성인+유아)
  ts: timestamp          // 서버 타임스탬프
}
```

## Firestore Rules 업데이트
```javascript
// 새 필드 검증 규칙
(!('adultCount' in data) || (data.adultCount is int && data.adultCount >= 0 && data.adultCount <= 10))
(!('babyCount' in data) || (data.babyCount is int && data.babyCount >= 0 && data.babyCount <= 5))
(!('mealAttendance' in data) || (data.mealAttendance in ['full', 'ceremony', 'meal', '']))
```

## UI 변경사항

### Modern 테마
- 성인/유아 필드가 나란히 표시
- 깔끔한 폼 레이아웃 유지

### Retro 테마
- ADULTS / KIDS 라벨로 표시
- MEAL OPTION 라벨로 표시
- 픽셀 스타일 유지

## 배포 체크리스트

1. **Firestore Rules 배포**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **테스트 항목**
   - [ ] 성인 인원 입력/저장
   - [ ] 유아 인원 입력/저장
   - [ ] 식사 참석 옵션 선택/저장
   - [ ] 기존 필드 호환성 (count 필드)
   - [ ] 모던/레트로 테마 전환
   - [ ] Firebase 데이터 저장 확인

3. **관리자 확인사항**
   - Firebase Console에서 새 필드 데이터 확인
   - 통계 집계 시 성인/유아 구분 활용
   - 식사 참석 정보로 케이터링 계획 수립

## 향후 개선사항

1. **통계 대시보드**
   - 총 참석자: 성인 X명, 유아 Y명
   - 식사 참석: 전체 X명, 예식만 Y명, 식사만 Z명

2. **알림 기능**
   - 참석 여부 제출 시 신랑/신부에게 알림

3. **데이터 내보내기**
   - Excel로 참석자 명단 다운로드
   - 식사 인원 별도 집계