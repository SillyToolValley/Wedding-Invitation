// ======================================
// 계좌번호 복사 기능
// ======================================

// 계좌번호 복사 함수
function copyAccountNumber(button, accountNumber) {
    // 복사할 텍스트
    const textToCopy = accountNumber.replace(/\s/g, ''); // 공백 제거
    
    // 클립보드 API 사용
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showCopySuccess(button, accountNumber);
        }).catch(() => {
            copyFallback(textToCopy, button, accountNumber);
        });
    } else {
        copyFallback(textToCopy, button, accountNumber);
    }
}

// 폴백 복사 방법
function copyFallback(text, button, accountNumber) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess(button, accountNumber);
    } catch (err) {
        console.error('복사 실패:', err);
        alert('계좌번호: ' + accountNumber);
    } finally {
        textArea.remove();
    }
}

// 복사 성공 표시
function showCopySuccess(button, accountNumber) {
    // 버튼 텍스트 변경
    const originalText = button.textContent;
    button.textContent = '복사완료';
    button.classList.add('copied');
    
    // 토스트 메시지 표시
    showToast(`계좌번호 ${accountNumber}가 복사되었습니다.`);
    
    // 3초 후 원래 상태로 복구
    setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
    }, 3000);
}

// 토스트 메시지 표시
function showToast(message) {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 새 토스트 생성
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 3초 후 제거
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 계좌 정보 렌더링 개선
function renderAccountInfo() {
    // Modern Theme 계좌 정보
    const groomAccountsEl = document.getElementById('groomAccounts');
    const brideAccountsEl = document.getElementById('brideAccounts');
    
    if (groomAccountsEl && window.CONFIG?.accounts?.groom) {
        groomAccountsEl.innerHTML = window.CONFIG.accounts.groom.map(account => `
            <div class="account-item">
                <div style="font-weight: 600; margin-bottom: 8px;">${account.bank}</div>
                <div style="color: #666; margin-bottom: 10px;">예금주: ${account.holder}</div>
                <div style="font-family: 'Courier New', monospace; font-size: 14px; letter-spacing: 0.5px; margin-bottom: 10px;">
                    ${account.number}
                </div>
                <button class="copy-btn" onclick="copyAccountNumber(this, '${account.number}')">
                    계좌번호 복사
                </button>
            </div>
        `).join('');
    }
    
    if (brideAccountsEl && window.CONFIG?.accounts?.bride) {
        brideAccountsEl.innerHTML = window.CONFIG.accounts.bride.map(account => `
            <div class="account-item">
                <div style="font-weight: 600; margin-bottom: 8px;">${account.bank}</div>
                <div style="color: #666; margin-bottom: 10px;">예금주: ${account.holder}</div>
                <div style="font-family: 'Courier New', monospace; font-size: 14px; letter-spacing: 0.5px; margin-bottom: 10px;">
                    ${account.number}
                </div>
                <button class="copy-btn" onclick="copyAccountNumber(this, '${account.number}')">
                    계좌번호 복사
                </button>
            </div>
        `).join('');
    }
    
    // Retro Theme 계좌 정보
    const retroGroomEl = document.getElementById('retroGroomAccounts');
    const retroBrideEl = document.getElementById('retroBrideAccounts');
    
    if (retroGroomEl && window.CONFIG?.accounts?.groom) {
        retroGroomEl.innerHTML = window.CONFIG.accounts.groom.map(account => `
            <div class="account-item">
                <div style="color: var(--pixel-yellow); margin-bottom: 10px;">${account.bank}</div>
                <div style="margin-bottom: 10px;">PLAYER: ${account.holder}</div>
                <div style="font-size: 9px; margin-bottom: 10px; word-break: break-all;">
                    ${account.number}
                </div>
                <button class="copy-btn" onclick="copyAccountNumber(this, '${account.number}')">
                    COPY
                </button>
            </div>
        `).join('');
    }
    
    if (retroBrideEl && window.CONFIG?.accounts?.bride) {
        retroBrideEl.innerHTML = window.CONFIG.accounts.bride.map(account => `
            <div class="account-item">
                <div style="color: var(--pixel-yellow); margin-bottom: 10px;">${account.bank}</div>
                <div style="margin-bottom: 10px;">PLAYER: ${account.holder}</div>
                <div style="font-size: 9px; margin-bottom: 10px; word-break: break-all;">
                    ${account.number}
                </div>
                <button class="copy-btn" onclick="copyAccountNumber(this, '${account.number}')">
                    COPY
                </button>
            </div>
        `).join('');
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    // 약간의 지연 후 실행 (CONFIG 로드 대기)
    setTimeout(renderAccountInfo, 100);
});

// 전역 함수로 노출
window.copyAccountNumber = copyAccountNumber;
window.renderAccountInfo = renderAccountInfo;