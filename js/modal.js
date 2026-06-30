// ========================================
// MODAL MODULE - 모달 관리
// ========================================
const ModalManager = {
    activeModals: new Set(),
    
    open: function(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`모달을 찾을 수 없습니다: ${modalId}`);
            return false;
        }

        // 이미 열려있는 모달이면 무시
        if (this.activeModals.has(modalId)) {
            return false;
        }

        // 다른 모달들 닫기 (필요시)
        // this.closeAll();

        // 모달 표시
        modal.style.display = 'block';
        this.activeModals.add(modalId);
        
        // body 스크롤 방지
        document.body.style.overflow = 'hidden';
        
        // 애니메이션 효과
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // 포커스 관리
        this.manageFocus(modal);
        
        // 분석 추적
        AnalyticsManager.track('modal_open', { modal_id: modalId });
        
        return true;
    },

    close: function(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`모달을 찾을 수 없습니다: ${modalId}`);
            return false;
        }

        // 이미 닫혀있는 모달이면 무시
        if (!this.activeModals.has(modalId)) {
            return false;
        }

        // 애니메이션 효과
        modal.classList.remove('show');
        
        setTimeout(() => {
            modal.style.display = 'none';
            this.activeModals.delete(modalId);
            
            // 다른 활성 모달이 없으면 body 스크롤 복원
            if (this.activeModals.size === 0) {
                document.body.style.overflow = '';
            }
        }, 300);
        
        // 폼 리셋
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            this.clearFormErrors(form);
        }
        
        // 분석 추적
        AnalyticsManager.track('modal_close', { modal_id: modalId });
        
        return true;
    },

    closeAll: function() {
        const modalIds = Array.from(this.activeModals);
        modalIds.forEach(modalId => {
            this.close(modalId);
        });
    },

    toggle: function(modalId) {
        if (this.activeModals.has(modalId)) {
            this.close(modalId);
        } else {
            this.open(modalId);
        }
    },

    isOpen: function(modalId) {
        return this.activeModals.has(modalId);
    },

    setupEventListeners: function() {
        // 모달 외부 클릭시 닫기
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                const modalId = event.target.id;
                this.close(modalId);
            }
        });

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.activeModals.size > 0) {
                // 가장 최근에 열린 모달 닫기
                const lastModal = Array.from(this.activeModals).pop();
                this.close(lastModal);
            }
        });

        // 닫기 버튼 이벤트
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('close') || 
                event.target.closest('.close')) {
                const modal = event.target.closest('.modal');
                if (modal) {
                    this.close(modal.id);
                }
            }
        });
    },

    manageFocus: function(modal) {
        // 모달 내의 포커스 가능한 요소들
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            // 첫 번째 요소에 포커스
            setTimeout(() => {
                firstElement.focus();
            }, 100);
            
            // Tab 키 순환 처리
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        // Shift + Tab
                        if (document.activeElement === firstElement) {
                            lastElement.focus();
                            e.preventDefault();
                        }
                    } else {
                        // Tab
                        if (document.activeElement === lastElement) {
                            firstElement.focus();
                            e.preventDefault();
                        }
                    }
                }
            });
        }
    },

    clearFormErrors: function(form) {
        // 에러 메시지 제거
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.remove();
        });
        
        // 에러 클래스 제거
        const errorInputs = form.querySelectorAll('.error');
        errorInputs.forEach(input => {
            input.classList.remove('error');
        });
    },

    showFormError: function(input, message) {
        // 기존 에러 메시지 제거
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // 에러 클래스 추가
        input.classList.add('error');
        
        // 에러 메시지 생성
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #f44336;
            font-size: 0.8em;
            margin-top: 5px;
        `;
        
        // 에러 메시지 삽입
        input.parentNode.appendChild(errorElement);
    },

    // 모달 크기 조정
    adjustModalSize: function(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) return;
        
        const windowHeight = window.innerHeight;
        const maxHeight = windowHeight * 0.9;
        
        if (modalContent.offsetHeight > maxHeight) {
            modalContent.style.maxHeight = `${maxHeight}px`;
            modalContent.style.overflowY = 'auto';
        }
    },

    // 로딩 모달 표시
    showLoading: function(message = '처리 중...') {
        const loadingModalHTML = `
            <div id="loadingModal" class="modal" style="display: block;">
                <div class="modal-content" style="text-align: center; width: 200px; padding: 30px;">
                    <div class="loading-spinner" style="
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #ff6b6b;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 2s linear infinite;
                        margin: 0 auto 20px;
                    "></div>
                    <p>${message}</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        // 기존 로딩 모달 제거
        this.hideLoading();
        
        // 새 로딩 모달 추가
        document.body.insertAdjacentHTML('beforeend', loadingModalHTML);
        document.body.style.overflow = 'hidden';
    },

    hideLoading: function() {
        const loadingModal = document.getElementById('loadingModal');
        if (loadingModal) {
            loadingModal.remove();
            document.body.style.overflow = '';
        }
    },

    // 확인 다이얼로그
    confirm: function(message, onConfirm, onCancel) {
        const confirmModalHTML = `
            <div id="confirmModal" class="modal" style="display: block;">
                <div class="modal-content" style="text-align: center; max-width: 400px;">
                    <h3>확인</h3>
                    <p style="margin: 20px 0;">${message}</p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="confirmYes" class="submit-btn" style="flex: 1;">확인</button>
                        <button id="confirmNo" style="flex: 1; padding: 12px; border: 1px solid #ddd; background: white; border-radius: 10px; cursor: pointer;">취소</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', confirmModalHTML);
        document.body.style.overflow = 'hidden';
        
        const confirmModal = document.getElementById('confirmModal');
        const yesBtn = document.getElementById('confirmYes');
        const noBtn = document.getElementById('confirmNo');
        
        yesBtn.addEventListener('click', () => {
            confirmModal.remove();
            document.body.style.overflow = '';
            if (onConfirm) onConfirm();
        });
        
        noBtn.addEventListener('click', () => {
            confirmModal.remove();
            document.body.style.overflow = '';
            if (onCancel) onCancel();
        });
        
        // 외부 클릭시 취소
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                noBtn.click();
            }
        });
    }
};
