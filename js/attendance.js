// ========================================
// ATTENDANCE MODULE - 참석여부 관리
// ========================================
const AttendanceManager = {
    open: function() {
        ModalManager.open('attendanceModal');
        
        // 포커스를 이름 입력란으로
        setTimeout(() => {
            const nameInput = document.getElementById('attendeeName');
            if (nameInput) nameInput.focus();
        }, 100);
    },

    close: function() {
        ModalManager.close('attendanceModal');
    },

    submit: async function(formData) {
        try {
            // 로딩 표시
            ModalManager.showLoading('참석 정보를 저장하는 중...');
            
            // 폼 검증
            if (!FormManager.validate.attendance(formData)) {
                ModalManager.hideLoading();
                return;
            }
            
            // 데이터 정제
            const sanitizedData = FormManager.sanitize(formData);
            
            const entry = {
                name: sanitizedData.get('name'),
                phone: '',
                status: sanitizedData.get('status'),
                meal: sanitizedData.get('meal'),
                count: parseInt(sanitizedData.get('count')) || 1,
                relation: sanitizedData.get('relation')
            };

            // 중복 체크
            if (this.isDuplicate(entry)) {
                ModalManager.hideLoading();
                ModalManager.confirm(
                    '같은 이름으로 이미 등록된 정보가 있습니다.\n기존 정보를 업데이트하시겠습니까?',
                    () => {
                        this.updateExisting(entry);
                    }
                );
                return;
            }

            // API 호출 (현재는 로컬 저장)
            await APIManager.submitAttendance(entry);
            
            // 로컬 데이터 업데이트
            DataManager.attendance.add(entry);
            
            // 성공 처리
            ModalManager.hideLoading();
            this.close();
            
            const statusText = entry.status === 'attend' ? '참석' : '불참';
            NotificationManager.success(`${statusText} 의사를 전달해주셔서 감사합니다! 🙏`);
            
            // 통계 업데이트
            this.updateStatistics();
            
            // 분석 추적
            AnalyticsManager.attendanceSubmit(entry.status);
            
        } catch (error) {
            ModalManager.hideLoading();
            console.error('참석 정보 제출 오류:', error);
            NotificationManager.error('참석 정보 저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
        }
    },

    isDuplicate: function(newEntry) {
        const existing = DataManager.attendance.getAll();
        return existing.some(entry => 
            entry.name === newEntry.name
        );
    },

    updateExisting: async function(newEntry) {
        try {
            ModalManager.showLoading('정보를 업데이트하는 중...');
            
            const existing = DataManager.attendance.getAll();
            const index = existing.findIndex(entry => 
                entry.name === newEntry.name
            );
            
            if (index !== -1) {
                // 기존 정보 업데이트
                DataManager.data.attendance[index] = {
                    ...existing[index],
                    ...newEntry,
                    updated_at: new Date().toISOString()
                };
                DataManager.saveToStorage();
                
                ModalManager.hideLoading();
                this.close();
                NotificationManager.success('참석 정보가 업데이트되었습니다.');
                
                this.updateStatistics();
            }
        } catch (error) {
            ModalManager.hideLoading();
            console.error('참석 정보 업데이트 오류:', error);
            NotificationManager.error('정보 업데이트 중 오류가 발생했습니다.');
        }
    },

    updateStatistics: function() {
        const stats = DataManager.attendance.getStatistics();
        
        // 통계 정보를 화면에 표시 (통계 섹션이 있다면)
        const statsElements = {
            total: document.querySelector('.stat-total'),
            attending: document.querySelector('.stat-attending'),
            attendingCount: document.querySelector('.stat-attending-count'),
            mealCount: document.querySelector('.stat-meal-count')
        };
        
        Object.keys(statsElements).forEach(key => {
            const element = statsElements[key];
            if (element && stats[key] !== undefined) {
                element.textContent = stats[key];
            }
        });
        
        // 참석률 계산 및 표시
        const attendanceRate = stats.total > 0 ? Math.round((stats.attending / stats.total) * 100) : 0;
        const rateElement = document.querySelector('.attendance-rate');
        if (rateElement) {
            rateElement.textContent = `${attendanceRate}%`;
        }
    },

    // 참석자 목록 표시 (관리자용)
    showAttendeeList: function() {
        const attendees = DataManager.attendance.getAll()
            .filter(entry => entry.status === 'attend')
            .sort((a, b) => a.name.localeCompare(b.name));
        
        if (attendees.length === 0) {
            NotificationManager.info('아직 참석 확인된 분이 없습니다.');
            return;
        }
        
        let listHTML = '<div class="attendee-list">';
        listHTML += '<h3>참석 확인 명단</h3>';
        
        const groomSide = attendees.filter(a => a.relation === 'groom');
        const brideSide = attendees.filter(a => a.relation === 'bride');
        
        if (groomSide.length > 0) {
            listHTML += '<h4>신랑측</h4><ul>';
            groomSide.forEach(attendee => {
                listHTML += `<li>${attendee.name} (${attendee.count}명, 식사: ${attendee.meal === 'yes' ? 'O' : 'X'})</li>`;
            });
            listHTML += '</ul>';
        }
        
        if (brideSide.length > 0) {
            listHTML += '<h4>신부측</h4><ul>';
            brideSide.forEach(attendee => {
                listHTML += `<li>${attendee.name} (${attendee.count}명, 식사: ${attendee.meal === 'yes' ? 'O' : 'X'})</li>`;
            });
            listHTML += '</ul>';
        }
        
        listHTML += '</div>';
        
        // 모달로 표시
        const modalHTML = `
            <div id="attendeeListModal" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                    <span class="close" onclick="document.getElementById('attendeeListModal').remove(); document.body.style.overflow='';">&times;</span>
                    ${listHTML}
                    <button onclick="AttendanceManager.exportAttendeeList()" class="submit-btn" style="margin-top: 20px;">
                        명단 내보내기
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    },

    // 참석자 명단 내보내기
    exportAttendeeList: function() {
        const attendees = DataManager.attendance.getAll();
        
        if (attendees.length === 0) {
            NotificationManager.warning('내보낼 참석 정보가 없습니다.');
            return;
        }
        
        // CSV 형식으로 내보내기
        let csvContent = '이름,참석여부,식사여부,참석인원,관계,등록일\n';
        
        attendees.forEach(entry => {
            const row = [
                `"${entry.name}"`,
                entry.status === 'attend' ? '참석' : '불참',
                entry.meal === 'yes' ? '식사함' : '식사안함',
                entry.count,
                entry.relation === 'groom' ? '신랑측' : '신부측',
                entry.date
            ].join(',');
            
            csvContent += row + '\n';
        });
        
        // 통계 정보 추가
        const stats = DataManager.attendance.getStatistics();
        csvContent += '\n통계 정보\n';
        csvContent += `총 응답자 수,${stats.total}\n`;
        csvContent += `참석자 수,${stats.attending}\n`;
        csvContent += `총 참석 인원,${stats.attendingCount}\n`;
        csvContent += `식사 인원,${stats.mealCount}\n`;
        csvContent += `신랑측,${stats.groomSide}\n`;
        csvContent += `신부측,${stats.brideSide}\n`;
        
        // BOM 추가 (한글 깨짐 방지)
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `참석자명단_${new Date().toISOString().split('T')[0]}.csv`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(link.href);
        
        NotificationManager.success('참석자 명단이 내보내기 되었습니다.');
    },

    // 참석 확인 알림 발송 (관리자용)
    sendReminder: function(attendee) {
        const message = `안녕하세요, ${attendee.name}님!\n\n${CONFIG.wedding.bride.name} ❤️ ${CONFIG.wedding.groom.name} 결혼식 참석 여부를 아직 확인받지 못했습니다.\n\n결혼식 정보:\n날짜: ${CONFIG.wedding.date.year}년 ${CONFIG.wedding.date.month}월 ${CONFIG.wedding.date.day}일 ${CONFIG.wedding.date.time}\n장소: ${CONFIG.wedding.venue.name}\n\n참석 여부를 알려주시면 감사하겠습니다.`;
        
        // 메시지 복사
        Utils.copyToClipboard(message, '알림 메시지가 복사되었습니다.')
    },

    // 폼 입력 도우미 설정
    setupFormHelpers: function() {
        // 참석 상태 변경시 식사 옵션 활성화/비활성화
        const statusSelect = document.getElementById('attendanceStatus');
        const mealSelect = document.getElementById('mealOption');
        const countInput = document.getElementById('guestCount');
        
        if (statusSelect && mealSelect && countInput) {
            statusSelect.addEventListener('change', (e) => {
                if (e.target.value === 'absent') {
                    mealSelect.value = 'no';
                    mealSelect.disabled = true;
                    countInput.value = '0';
                    countInput.disabled = true;
                } else {
                    mealSelect.disabled = false;
                    countInput.disabled = false;
                    if (countInput.value === '0') {
                        countInput.value = '1';
                    }
                }
            });
        }
    },

    // 통계 차트 생성 (Chart.js 사용시)
    createStatChart: function() {
        const chartContainer = document.getElementById('attendanceChart');
        if (!chartContainer) return;
        
        const stats = DataManager.attendance.getStatistics();
        
        // 간단한 텍스트 기반 차트
        chartContainer.innerHTML = `
            <div class="stat-chart">
                <h4>참석 통계</h4>
                <div class="stat-bar">
                    <div class="stat-label">참석</div>
                    <div class="stat-progress">
                        <div class="stat-fill" style="width: ${stats.total > 0 ? (stats.attending / stats.total) * 100 : 0}%"></div>
                    </div>
                    <div class="stat-value">${stats.attending}명</div>
                </div>
                <div class="stat-bar">
                    <div class="stat-label">불참</div>
                    <div class="stat-progress">
                        <div class="stat-fill" style="width: ${stats.total > 0 ? (stats.absent / stats.total) * 100 : 0}%"></div>
                    </div>
                    <div class="stat-value">${stats.absent}명</div>
                </div>
            </div>
        `;
    }
};
