// ========================================
// CALENDAR MODULE - 달력 관리
// ========================================
const CalendarManager = {
    generate: function() {
        const calendar = document.getElementById('calendar');
        if (!calendar) {
            console.warn('달력 컨테이너를 찾을 수 없습니다.');
            return;
        }

        const { year, month, day } = CONFIG.wedding.date;
        const monthIndex = month - 1; // JS Date는 0부터 시작
        
        // 기존 내용 초기화
        calendar.innerHTML = '';
        
        // 요일 헤더 생성
        this.createDayHeaders(calendar);
        
        // 날짜 셀 생성
        this.createDateCells(calendar, year, monthIndex, day);
    },

    createDayHeaders: function(calendar) {
        const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
        
        dayHeaders.forEach((dayName, index) => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.textContent = dayName;
            
            // 일요일과 토요일 스타일링
            if (index === 0) { // 일요일
                header.style.color = '#ff6b6b';
            } else if (index === 6) { // 토요일
                header.style.color = '#4CAF50';
            }
            
            calendar.appendChild(header);
        });
    },

    createDateCells: function(calendar, year, monthIndex, weddingDay) {
        // 날짜 계산
        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);
        const startDate = firstDay.getDay(); // 첫째 날의 요일
        const daysInMonth = lastDay.getDate(); // 그 달의 총 일수
        const prevMonth = new Date(year, monthIndex, 0);
        const prevMonthDays = prevMonth.getDate();

        // 이전 달의 빈 날짜들
        for (let i = startDate - 1; i >= 0; i--) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day prev-month';
            dayElement.textContent = prevMonthDays - i;
            dayElement.style.opacity = '0.3';
            dayElement.style.color = '#ccc';
            calendar.appendChild(dayElement);
        }

        // 현재 달의 날짜들
        for (let currentDay = 1; currentDay <= daysInMonth; currentDay++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day current-month';
            dayElement.textContent = currentDay;
            
            // 요일별 스타일링
            const dayOfWeek = (startDate + currentDay - 1) % 7;
            if (dayOfWeek === 0) { // 일요일
                dayElement.style.color = '#ff6b6b';
            } else if (dayOfWeek === 6) { // 토요일
                dayElement.style.color = '#4CAF50';
            }
            
            // 결혼식 날짜 하이라이트
            if (currentDay === weddingDay) {
                dayElement.classList.add('wedding-day');
                dayElement.innerHTML = `${currentDay}<br><span style="font-size: 0.8em;">💒</span>`;
                
                // 클릭 이벤트 추가
                dayElement.addEventListener('click', () => {
                    this.showWeddingInfo();
                });
                
                dayElement.style.cursor = 'pointer';
                dayElement.title = '결혼식 날짜입니다!';
            }
            
            // 오늘 날짜 표시
            const today = new Date();
            if (year === today.getFullYear() && 
                monthIndex === today.getMonth() && 
                currentDay === today.getDate()) {
                dayElement.classList.add('today');
                dayElement.style.outline = '2px solid #2196F3';
            }
            
            calendar.appendChild(dayElement);
        }

        // 다음 달의 빈 날짜들
        const totalCells = calendar.children.length - 7; // 헤더 제외
        const remainingCells = 42 - totalCells - 7; // 6주 * 7일 - 현재 셀 수 - 헤더
        
        for (let nextDay = 1; nextDay <= remainingCells && totalCells < 35; nextDay++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day next-month';
            dayElement.textContent = nextDay;
            dayElement.style.opacity = '0.3';
            dayElement.style.color = '#ccc';
            calendar.appendChild(dayElement);
        }
    },

    showWeddingInfo: function() {
        const { year, month, day, time } = CONFIG.wedding.date;
        const { name, address } = CONFIG.wedding.venue;
        
        const message = `
            ${year}년 ${month}월 ${day}일 (${this.getDayOfWeek(year, month, day)})
            ${time}
            
            📍 ${name}
            ${address}
        `.trim();
        
        NotificationManager.info(message, 5000);
    },

    getDayOfWeek: function(year, month, day) {
        const date = new Date(year, month - 1, day);
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        return days[date.getDay()];
    },

    // D-Day 계산
    getDDay: function() {
        const { year, month, day } = CONFIG.wedding.date;
        const weddingDate = new Date(year, month - 1, day);
        const today = new Date();
        
        // 시간 정보 제거 (날짜만 비교)
        today.setHours(0, 0, 0, 0);
        weddingDate.setHours(0, 0, 0, 0);
        
        const diffTime = weddingDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            return `D-${diffDays}`;
        } else if (diffDays === 0) {
            return 'D-Day';
        } else {
            return `D+${Math.abs(diffDays)}`;
        }
    },

    // D-Day 표시 업데이트
    updateDDay: function() {
        const dDayElement = document.querySelector('.d-day');
        if (dDayElement) {
            dDayElement.textContent = this.getDDay();
        }
    },

    // 달력 새로고침
    refresh: function() {
        this.generate();
        this.updateDDay();
    }
};
