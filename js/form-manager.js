// ========================================
// FORM MODULE - 폼 관리
// ========================================
const FormManager = {
    // 폼 데이터 검증
    validate: {
        guestbook: function(formData) {
            const name = formData.get('name')?.trim();
            const message = formData.get('message')?.trim();
            
            if (!name) {
                NotificationManager.error('이름을 입력해주세요.');
                FormManager.focusField('guestName');
                return false;
            }
            
            if (name.length < 2) {
                NotificationManager.error('이름은 2글자 이상 입력해주세요.');
                FormManager.focusField('guestName');
                return false;
            }
            
            if (name.length > 20) {
                NotificationManager.error('이름은 20글자 이하로 입력해주세요.');
                FormManager.focusField('guestName');
                return false;
            }
            
            if (!message) {
                NotificationManager.error('메시지를 입력해주세요.');
                FormManager.focusField('guestMessage');
                return false;
            }
            
            if (message.length < 5) {
                NotificationManager.error('메시지는 5글자 이상 입력해주세요.');
                FormManager.focusField('guestMessage');
                return false;
            }
            
            if (message.length > 500) {
                NotificationManager.error('메시지는 500글자 이하로 입력해주세요.');
                FormManager.focusField('guestMessage');
                return false;
            }
            
            // 스팸 검사
            if (FormManager.isSpam(message)) {
                NotificationManager.error('적절하지 않은 내용이 포함되어 있습니다.');
                return false;
            }
            
            return true;
        },
        
        attendance: function(formData) {
            const required = ['name', 'status', 'meal', 'count', 'relation'];
            
            for (let field of required) {
                const value = formData.get(field)?.trim();
                if (!value) {
                    const fieldName = FormManager.getFieldName(field);
                    NotificationManager.error(`${fieldName}을(를) 입력해주세요.`);
                    FormManager.focusField(FormManager.getFieldId(field));
                    return false;
                }
            }
            
            // 이름 검증
            const name = formData.get('name').trim();
            if (name.length < 2 || name.length > 20) {
                NotificationManager.error('이름은 2~20글자로 입력해주세요.');
                FormManager.focusField('attendeeName');
                return false;
            }
            
            
            // 참석 인원 검증
            const count = parseInt(formData.get('count'));
            const status = formData.get('status');
            
            if (status === 'attend') {
                if (count < 1 || count > 10) {
                    NotificationManager.error('참석 인원은 1~10명 사이로 입력해주세요.');
                    FormManager.focusField('guestCount');
                    return false;
                }
            }
            
            return true;
        },
        
        email: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        phone: function(phone) {
            return FormManager.validatePhone(phone);
        }
    },

    // 필드명 매핑
    getFieldName: function(field) {
        const fieldNames = {
            'name': '이름',
            'phone': '연락처',
            'status': '참석 여부',
            'meal': '식사 여부',
            'count': '참석 인원',
            'relation': '관계',
            'message': '메시지',
            'email': '이메일'
        };
        return fieldNames[field] || field;
    },

    // 필드 ID 매핑
    getFieldId: function(field) {
        const fieldIds = {
            'name': 'attendeeName',
            'phone': 'attendeePhone',
            'status': 'attendanceStatus',
            'meal': 'mealOption',
            'count': 'guestCount',
            'relation': 'relation',
            'message': 'guestMessage'
        };
        return fieldIds[field] || field;
    },

    // 전화번호 유효성 검사
    validatePhone: function(phone) {
        // 숫자만 추출
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        
        // 한국 휴대폰 번호 패턴
        const mobilePatterns = [
            /^010\d{8}$/,  // 010-xxxx-xxxx
            /^011\d{8}$/,  // 011-xxx-xxxx
            /^016\d{8}$/,  // 016-xxx-xxxx
            /^017\d{8}$/,  // 017-xxx-xxxx
            /^018\d{8}$/,  // 018-xxx-xxxx
            /^019\d{8}$/   // 019-xxx-xxxx
        ];
        
        // 일반 전화번호 패턴 (지역번호)
        const phonePatterns = [
            /^02\d{7,8}$/,    // 서울 02-xxx-xxxx, 02-xxxx-xxxx
            /^0[3-6]\d{1}\d{7,8}$/,  // 지역번호 03x, 04x, 05x, 06x
            /^070\d{8}$/      // 인터넷전화 070-xxxx-xxxx
        ];
        
        return mobilePatterns.some(pattern => pattern.test(cleanPhone)) ||
               phonePatterns.some(pattern => pattern.test(cleanPhone));
    },

    // 스팸 검사
    isSpam: function(text) {
        const spamKeywords = [
            '광고', '홍보', '마케팅', '판매', '대출', '카지노', '도박',
            'http://', 'https://', 'www.', '.com', '.kr', '.net',
            '돈벌기', '부업', '재택근무', '투자', '수익'
        ];
        
        const lowerText = text.toLowerCase();
        return spamKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    },

    // 폼 데이터 정제
    sanitize: function(formData) {
        const sanitized = new FormData();
        
        for (let [key, value] of formData.entries()) {
            let cleanValue = value.toString().trim();
            
            // HTML 태그 제거
            cleanValue = cleanValue.replace(/<[^>]*>/g, '');
            
            // XSS 방지를 위한 특수문자 치환
            cleanValue = cleanValue
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
            
            // 연속된 공백 제거
            cleanValue = cleanValue.replace(/\s+/g, ' ');
            
            
            sanitized.append(key, cleanValue);
        }
        
        return sanitized;
    },

    // 전화번호 정규화
    normalizePhone: function(phone) {
        // 숫자만 추출
        const numbers = phone.replace(/[^0-9]/g, '');
        
        // 형식에 맞게 하이픈 추가
        if (numbers.length === 11 && numbers.startsWith('01')) {
            return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        } else if (numbers.length === 10 && numbers.startsWith('02')) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
        } else if (numbers.length === 10) {
            return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        }
        
        return phone; // 형식을 알 수 없으면 원본 반환
    },

    // 필드에 포커스
    focusField: function(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            setTimeout(() => {
                field.focus();
                if (field.select) field.select();
            }, 100);
        }
    },

    // 실시간 유효성 검사 설정
    setupRealTimeValidation: function() {
        // 이름 필드 실시간 검사
        const nameFields = ['guestName', 'attendeeName'];
        nameFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    const value = field.value.trim();
                    if (value && (value.length < 2 || value.length > 20)) {
                        this.showFieldError(field, '이름은 2~20글자로 입력해주세요.');
                    } else {
                        this.clearFieldError(field);
                    }
                });
            }
        });


        // 메시지 필드 실시간 글자 수 확인
        const messageField = document.getElementById('guestMessage');
        if (messageField) {
            messageField.addEventListener('input', () => {
                const length = messageField.value.length;
                const counter = messageField.parentNode.querySelector('.char-counter');
                
                if (counter) {
                    counter.textContent = `${length}/500`;
                    counter.style.color = length > 450 ? '#ff6b6b' : '#666';
                }
                
                if (length > 500) {
                    this.showFieldError(messageField, '메시지는 500글자 이하로 입력해주세요.');
                } else {
                    this.clearFieldError(messageField);
                }
            });
        }
    },

    // 필드 에러 표시
    showFieldError: function(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #f44336;
            font-size: 0.8em;
            margin-top: 5px;
        `;
        
        field.parentNode.appendChild(errorDiv);
    },

    // 필드 에러 제거
    clearFieldError: function(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    // 폼 전체 에러 제거
    clearAllErrors: function(form) {
        const errorFields = form.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
        
        const errorMessages = form.querySelectorAll('.field-error');
        errorMessages.forEach(msg => msg.remove());
    },

    // 폼 리셋
    resetForm: function(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            this.clearAllErrors(form);
        }
    },

    // 자동 저장 기능 (드래프트)
    setupAutoSave: function(formId, storageKey) {
        const form = document.getElementById(formId);
        if (!form) return;

        // 폼 데이터 로드
        this.loadDraft(formId, storageKey);

        // 자동 저장 설정
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', Utils.debounce(() => {
                this.saveDraft(formId, storageKey);
            }, 1000));
        });
    },

    saveDraft: function(formId, storageKey) {
        const form = document.getElementById(formId);
        if (!form) return;

        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        try {
            // 현재는 메모리에만 저장
            window[`draft_${storageKey}`] = data;
            console.log(`드래프트 저장됨: ${storageKey}`);
        } catch (e) {
            console.warn('드래프트 저장 실패:', e);
        }
    },

    loadDraft: function(formId, storageKey) {
        try {
            const data = window[`draft_${storageKey}`];
            if (!data) return;

            const form = document.getElementById(formId);
            if (!form) return;

            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    field.value = data[key];
                }
            });

            console.log(`드래프트 로드됨: ${storageKey}`);
        } catch (e) {
            console.warn('드래프트 로드 실패:', e);
        }
    },

    clearDraft: function(storageKey) {
        try {
            delete window[`draft_${storageKey}`];
            console.log(`드래프트 삭제됨: ${storageKey}`);
        } catch (e) {
            console.warn('드래프트 삭제 실패:', e);
        }
    }
};
