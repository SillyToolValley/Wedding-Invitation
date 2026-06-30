// ========================================
// API MODULE - 외부 API 연동
// ========================================
const APIManager = {
    // API 엔드포인트 설정
    endpoints: {
        base: '', // 실제 서버 URL로 변경
        guestbook: '/api/guestbook',
        attendance: '/api/attendance',
        analytics: '/api/analytics',
        upload: '/api/upload',
        notification: '/api/notification'
    },

    // 기본 설정
    config: {
        timeout: 10000, // 10초
        retryAttempts: 3,
        retryDelay: 1000 // 1초
    },

    // HTTP 요청 헬퍼
    request: async function(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            signal: controller.signal
        };

        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, finalOptions);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            console.error('API request failed:', error);
            throw error;
        }
    },

    // 재시도 로직이 포함된 요청
    requestWithRetry: async function(url, options = {}, attempt = 1) {
        try {
            return await this.request(url, options);
        } catch (error) {
            if (attempt < this.config.retryAttempts) {
                console.warn(`Request failed (attempt ${attempt}), retrying...`);
                await this.delay(this.config.retryDelay * attempt);
                return this.requestWithRetry(url, options, attempt + 1);
            }
            throw error;
        }
    },

    // 지연 함수
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // 방명록 관련 API
    guestbook: {
        // 방명록 목록 조회
        getAll: async function() {
            try {
                const url = APIManager.endpoints.base + APIManager.endpoints.guestbook;
                return await APIManager.requestWithRetry(url);
            } catch (error) {
                console.error('방명록 조회 실패:', error);
                return { success: false, error: error.message };
            }
        },

        // 방명록 작성
        create: async function(data) {
            try {
                const url = APIManager.endpoints.base + APIManager.endpoints.guestbook;
                return await APIManager.requestWithRetry(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        name: data.name,
                        message: data.message,
                        timestamp: new Date().toISOString(),
                        ip: await APIManager.getClientIP()
                    })
                });
            } catch (error) {
                console.error('방명록 작성 실패:', error);
                return { success: false, error: error.message };
            }
        },

        // 방명록 삭제 (관리자)
        delete: async function(id, adminToken) {
            try {
                const url = `${APIManager.endpoints.base}${APIManager.endpoints.guestbook}/${id}`;
                return await APIManager.requestWithRetry(url, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('방명록 삭제 실패:', error);
                return { success: false, error: error.message };
            }
        }
    },

    // 참석자 관련 API
    attendance: {
        // 참석자 목록 조회 (관리자)
        getAll: async function(adminToken) {
            try {
                const url = APIManager.endpoints.base + APIManager.endpoints.attendance;
                return await APIManager.requestWithRetry(url, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('참석자 조회 실패:', error);
                return { success: false, error: error.message };
            }
        },

        // 참석 정보 등록
        create: async function(data) {
            try {
                const url = APIManager.endpoints.base + APIManager.endpoints.attendance;
                return await APIManager.requestWithRetry(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        ...data,
                        timestamp: new Date().toISOString(),
                        ip: await APIManager.getClientIP()
                    })
                });
            } catch (error) {
                console.error('참석 정보 등록 실패:', error);
                return { success: false, error: error.message };
            }
        },

        // 참석 정보 수정
        update: async function(id, data) {
            try {
                const url = `${APIManager.endpoints.base}${APIManager.endpoints.attendance}/${id}`;
                return await APIManager.requestWithRetry(url, {
                    method: 'PUT',
                    body: JSON.stringify({
                        ...data,
                        updated_at: new Date().toISOString()
                    })
                });
            } catch (error) {
                console.error('참석 정보 수정 실패:', error);
                return { success: false, error: error.message };
            }
        },

        // 통계 조회
        getStats: async function() {
            try {
                const url = `${APIManager.endpoints.base}${APIManager.endpoints.attendance}/stats`;
                return await APIManager.requestWithRetry(url);
            } catch (error) {
                console.error('참석 통계 조회 실패:', error);
                return { success: false, error: error.message };
            }
        }
    },

    // 분석 데이터 전송
    analytics: {
        send: async function(eventData) {
            try {
                const url = APIManager.endpoints.base + APIManager.endpoints.analytics;
                return await APIManager.request(url, {
                    method: 'POST',
                    body: JSON.stringify(eventData)
                });
            } catch (error) {
                // 분석 데이터 전송 실패는 조용히 처리
                console.warn('Analytics 전송 실패:', error);
                return { success: false };
            }
        },

        // 배치로 여러 이벤트 전송
        sendBatch: async function(events) {
            try {
                const url = `${APIManager.endpoints.base}${APIManager.endpoints.analytics}/batch`;
                return await APIManager.request(url, {
                    method: 'POST',
                    body: JSON.stringify({ events })
                });
            } catch (error) {
                console.warn('Analytics batch 전송 실패:', error);
                return { success: false };
            }
        }
    },

    // 파일 업로드
    upload: {
        image: async function(file, type = 'photo') {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', type);
                formData.append('timestamp', new Date().toISOString());

                const url = APIManager.endpoints.base + APIManager.endpoints.upload;
                return await APIManager.requestWithRetry(url, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        // FormData 사용시 Content-Type 헤더 제거 (브라우저가 자동 설정)
                        'Accept': 'application/json'
                    }
                });
            } catch (error) {
                console.error('이미지 업로드 실패:', error);
                return { success: false, error: error.message };
            }
        },

        // 진행률 콜백과 함께 업로드
        imageWithProgress: function(file, type = 'photo', onProgress) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const formData = new FormData();
                
                formData.append('file', file);
                formData.append('type', type);
                formData.append('timestamp', new Date().toISOString());

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable && onProgress) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        onProgress(percentComplete);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (error) {
                            reject(new Error('Invalid JSON response'));
                        }
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed'));
                });

                xhr.open('POST', APIManager.endpoints.base + APIManager.endpoints.upload);
                xhr.send(formData);
            });
        }
    },

    // 알림 발송
    notification: {
        // 이메일 발송
        sendEmail: async function(to, subject, content, type = 'html') {
            try {
                const url = `${APIManager.endpoints.base}${APIManager.endpoints.notification}/email`;
                return await APIManager.requestWithRetry(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        to,
                        subject,
                        content,
                        type,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (error) {
                console.error('이메일 발송 실패:', error);
                return { success: false, error: error.message };
            }
        },

        // SMS 발송
        sendSMS: async function(to, message) {
            try {
                const url = `${APIManager.endpoints.base}${APIManager.endpoints.notification}/sms`;
                return await APIManager.requestWithRetry(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        to,
                        message,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (error) {
                console.error('SMS 발송 실패:', error);
                return { success: false, error: error.message };
            }
        }
    },

    // 래퍼 함수들 (하위 호환성)
    submitGuestbook: async function(data) {
        return await this.guestbook.create(data);
    },

    submitAttendance: async function(data) {
        return await this.attendance.create(data);
    },

    // 클라이언트 IP 주소 가져오기
    getClientIP: async function() {
        try {
            // 간단한 IP 조회 서비스 사용
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('IP 주소 조회 실패:', error);
            return 'unknown';
        }
    },

    // 연결 상태 확인
    checkConnection: async function() {
        try {
            const url = `${this.endpoints.base}/health`;
            const startTime = Date.now();
            await this.request(url, { method: 'HEAD' });
            const responseTime = Date.now() - startTime;
            
            return {
                status: 'online',
                responseTime: responseTime
            };
        } catch (error) {
            return {
                status: 'offline',
                error: error.message
            };
        }
    },

    // 오프라인 큐 관리
    offlineQueue: {
        queue: [],
        
        add: function(request) {
            this.queue.push({
                ...request,
                timestamp: new Date().toISOString()
            });
            this.saveToStorage();
        },
        
        process: async function() {
            if (this.queue.length === 0) return;
            
            const requests = [...this.queue];
            this.queue = [];
            this.saveToStorage();
            
            for (const request of requests) {
                try {
                    await APIManager.request(request.url, request.options);
                    console.log('오프라인 요청 처리 완료:', request);
                } catch (error) {
                    console.error('오프라인 요청 처리 실패:', error);
                    // 실패한 요청은 다시 큐에 추가
                    this.add(request);
                }
            }
        },
        
        saveToStorage: function() {
            try {
                // 현재는 메모리에만 저장
                window.offlineQueue = this.queue;
            } catch (error) {
                console.warn('오프라인 큐 저장 실패:', error);
            }
        },
        
        loadFromStorage: function() {
            try {
                this.queue = window.offlineQueue || [];
            } catch (error) {
                console.warn('오프라인 큐 로드 실패:', error);
                this.queue = [];
            }
        }
    },

    // 초기화
    init: function() {
        // 오프라인 큐 로드
        this.offlineQueue.loadFromStorage();
        
        // 온라인 상태가 되면 오프라인 큐 처리
        window.addEventListener('online', () => {
            this.offlineQueue.process();
        });
        
        // 주기적으로 연결 상태 확인 (5분마다)
        setInterval(async () => {
            const status = await this.checkConnection();
            if (status.status === 'online' && this.offlineQueue.queue.length > 0) {
                this.offlineQueue.process();
            }
        }, 5 * 60 * 1000);
    },

    // 환경별 설정
    setEnvironment: function(env) {
        const environments = {
            development: {
                base: 'http://localhost:3000',
                timeout: 5000
            },
            staging: {
                base: 'https://api-staging.wedding.com',
                timeout: 8000
            },
            production: {
                base: 'https://api.wedding.com',
                timeout: 10000
            }
        };
        
        const config = environments[env];
        if (config) {
            this.endpoints.base = config.base;
            this.config.timeout = config.timeout;
            console.log(`API 환경 설정: ${env}`);
        }
    }
};
