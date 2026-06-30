// ========================================
// DATA MODULE - 데이터 관리
// ========================================
const DataManager = {
    // 데이터 저장소
    data: {
        guestbook: [],
        attendance: []
    },

    // 방명록 관련
    guestbook: {
        add: function(entry) {
            entry.id = Utils.generateId();
            entry.date = new Date().toLocaleDateString('ko-KR');
            entry.timestamp = new Date().toISOString();
            DataManager.data.guestbook.unshift(entry);
            DataManager.saveToStorage();
            return entry;
        },
        
        getAll: function() {
            return DataManager.data.guestbook;
        },
        
        getById: function(id) {
            return DataManager.data.guestbook.find(entry => entry.id === id);
        },
        
        remove: function(id) {
            const index = DataManager.data.guestbook.findIndex(entry => entry.id === id);
            if (index > -1) {
                const removed = DataManager.data.guestbook.splice(index, 1)[0];
                DataManager.saveToStorage();
                return removed;
            }
            return null;
        },
        
        getSample: function() {
            return [
                {
                    id: 'sample1',
                    name: '김친구',
                    message: '정말 축하해! 너무 행복해 보여서 보기 좋아 ❤️',
                    date: '2025/07/30',
                    timestamp: '2025-07-30T10:00:00.000Z'
                },
                {
                    id: 'sample2',
                    name: '이동기',
                    message: '축하드립니다! 오래오래 행복하세요~',
                    date: '2025/07/29',
                    timestamp: '2025-07-29T15:30:00.000Z'
                }
            ];
        }
    },

    // 참석자 관련
    attendance: {
        add: function(entry) {
            entry.id = Utils.generateId();
            entry.timestamp = new Date().toISOString();
            entry.date = new Date().toLocaleDateString('ko-KR');
            DataManager.data.attendance.push(entry);
            DataManager.saveToStorage();
            
            // 실제 구현시 서버로 전송
            // this.sendToServer(entry);
            return entry;
        },
        
        getAll: function() {
            return DataManager.data.attendance;
        },
        
        getById: function(id) {
            return DataManager.data.attendance.find(entry => entry.id === id);
        },
        
        getByRelation: function(relation) {
            return DataManager.data.attendance.filter(entry => entry.relation === relation);
        },
        
        getAttendingCount: function() {
            return DataManager.data.attendance
                .filter(entry => entry.status === 'attend')
                .reduce((total, entry) => total + parseInt(entry.count || 1), 0);
        },
        
        getMealCount: function() {
            return DataManager.data.attendance
                .filter(entry => entry.status === 'attend' && entry.meal === 'yes')
                .reduce((total, entry) => total + parseInt(entry.count || 1), 0);
        },
        
        getStatistics: function() {
            const all = this.getAll();
            const attending = all.filter(entry => entry.status === 'attend');
            const absent = all.filter(entry => entry.status === 'absent');
            const groomSide = all.filter(entry => entry.relation === 'groom');
            const brideSide = all.filter(entry => entry.relation === 'bride');
            
            return {
                total: all.length,
                attending: attending.length,
                absent: absent.length,
                attendingCount: this.getAttendingCount(),
                mealCount: this.getMealCount(),
                groomSide: groomSide.length,
                brideSide: brideSide.length
            };
        },
        
        sendToServer: function(entry) {
            // TODO: 실제 서버 API 호출
            console.log('서버로 전송할 참석 정보:', entry);
            
            // 예시: fetch API 사용
            /*
            return fetch('/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entry)
            })
            .then(response => response.json())
            .catch(error => {
                console.error('서버 전송 실패:', error);
                throw error;
            });
            */
        }
    },

    // 로컬 스토리지 관리 (현재는 메모리에만 저장)
    saveToStorage: function() {
        try {
            // GitHub Pages에서는 localStorage 사용 불가
            // localStorage.setItem('weddingData', JSON.stringify(this.data));
            console.log('데이터 저장됨 (메모리):', this.data);
        } catch (e) {
            console.warn('데이터 저장 실패:', e);
        }
    },

    loadFromStorage: function() {
        try {
            // GitHub Pages에서는 localStorage 사용 불가
            // const saved = localStorage.getItem('weddingData');
            // if (saved) {
            //     this.data = { ...this.data, ...JSON.parse(saved) };
            // }
            
            // Firebase 데이터가 없을 때만 샘플 데이터 사용
            if (!this.data.guestbook || this.data.guestbook.length === 0) {
                this.data.guestbook = this.guestbook.getSample();
                console.log('샘플 데이터로 초기화됨:', this.data);
            } else {
                console.log('기존 데이터 유지:', this.data.guestbook.length, '개');
            }
        } catch (e) {
            console.warn('데이터 로드 실패:', e);
            // 실패시 기본 샘플 데이터 사용
            if (!this.data.guestbook || this.data.guestbook.length === 0) {
                this.data.guestbook = this.guestbook.getSample();
            }
        }

        this._ready = true;
        window.dispatchEvent(new Event('DataManagerReady'));
    },

    // 데이터 초기화
    reset: function() {
        this.data = {
            guestbook: [],
            attendance: []
        };
        this.saveToStorage();
    },

    // 데이터 내보내기 (관리자용)
    export: function() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `wedding-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    },

    // 데이터 가져오기 (관리자용)
    import: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // 데이터 유효성 검사
                    if (importedData.guestbook && Array.isArray(importedData.guestbook)) {
                        this.data.guestbook = importedData.guestbook;
                    }
                    if (importedData.attendance && Array.isArray(importedData.attendance)) {
                        this.data.attendance = importedData.attendance;
                    }
                    
                    this.saveToStorage();
                    resolve(this.data);
                } catch (error) {
                    reject(new Error('잘못된 데이터 형식입니다.'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('파일을 읽을 수 없습니다.'));
            };
            
            reader.readAsText(file);
        });
    }
};

// 초기화 - Firebase가 없을 경우를 위한 샘플 데이터
// Firebase가 있으면 Firebase 데이터로 덮어씌워짐
if (!DataManager.data.guestbook || DataManager.data.guestbook.length === 0) {
    DataManager.data.guestbook = DataManager.guestbook.getSample();
}

DataManager._ready = true;
window.DataManager = DataManager;
window.dispatchEvent(new Event('DataManagerReady'));