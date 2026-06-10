// ========================================
// CONTACT MODULE - 연락처 관리
// ========================================
const ContactManager = {
    call: function(side, parentType) {
        const parent = CONFIG.wedding[side][parentType];
        if (!parent || !parent.phone) {
            NotificationManager.error('연락처 정보를 찾을 수 없습니다.');
            return;
        }

        const phoneNumber = parent.phone;
        const formattedNumber = Utils.formatPhoneNumber(phoneNumber);
        
        // 분석 추적
        AnalyticsManager.track('contact_call', {
            side: side,
            parent_type: parentType,
            contact_method: 'phone'
        });

        if (confirm(`${parent.name} (${formattedNumber})로 전화를 걸까요?`)) {
            try {
                window.location.href = `tel:${phoneNumber}`;
            } catch (error) {
                console.error('전화 연결 실패:', error);
                NotificationManager.error('전화를 걸 수 없습니다. 직접 다이얼해 주세요.');
                
                // 전화번호 복사로 fallback
                Utils.copyToClipboard(phoneNumber, '전화번호가 복사되었습니다.');
            }
        }
    },

    sms: function(side, parentType) {
        const parent = CONFIG.wedding[side][parentType];
        if (!parent || !parent.phone) {
            NotificationManager.error('연락처 정보를 찾을 수 없습니다.');
            return;
        }

        const phoneNumber = parent.phone;
        const message = this.getSMSMessage(side, parentType);
        
        // 분석 추적
        AnalyticsManager.track('contact_sms', {
            side: side,
            parent_type: parentType,
            contact_method: 'sms'
        });

        try {
            if (Utils.isMobile()) {
                // 모바일에서는 SMS 앱 직접 열기
                window.location.href = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
            } else {
                // 데스크톱에서는 메시지와 함께 번호 복사
                const fullMessage = `${message}\n\n전화번호: ${phoneNumber}`;
                Utils.copyToClipboard(fullMessage, '메시지와 전화번호가 복사되었습니다.');
            }
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            NotificationManager.error('메시지를 보낼 수 없습니다.');
            
            // 전화번호 복사로 fallback
            Utils.copyToClipboard(phoneNumber, '전화번호가 복사되었습니다.');
        }
    },

    getSMSMessage: function(side, parentType) {
        const { bride, groom, date, venue } = CONFIG.wedding;
        const weddingDate = `${date.year}년 ${date.month}월 ${date.day}일`;
        
        return `안녕하세요. ${bride.name} ❤️ ${groom.name} 결혼식(${weddingDate}, ${venue.name}) 관련하여 연락드립니다.`;
    },

    // 연락처 정보 가져오기
    getContactInfo: function(side, parentType) {
        const parent = CONFIG.wedding[side][parentType];
        if (!parent) return null;

        return {
            name: parent.name,
            phone: parent.phone,
            formattedPhone: Utils.formatPhoneNumber(parent.phone),
            side: side === 'groom' ? '신랑측' : '신부측',
            relation: parentType === 'father' ? '아버지' : '어머니'
        };
    },

    // 모든 연락처 정보 가져오기
    getAllContacts: function() {
        const contacts = [];
        
        ['groom', 'bride'].forEach(side => {
            ['father', 'mother'].forEach(parentType => {
                const contact = this.getContactInfo(side, parentType);
                if (contact) {
                    contacts.push(contact);
                }
            });
        });
        
        return contacts;
    },

    // 연락처 유효성 검사
    validatePhone: function(phone) {
        // 한국 휴대폰 번호 패턴 (010, 011, 016, 017, 018, 019)
        const mobilePattern = /^01[0-9]-?\d{3,4}-?\d{4}$/;
        // 일반 전화번호 패턴
        const phonePattern = /^(0[2-9][0-9]?)-?\d{3,4}-?\d{4}$/;
        
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        
        return mobilePattern.test(cleanPhone) || phonePattern.test(cleanPhone);
    },

    // 연락처 카드 생성 (vCard)
    generateVCard: function(side, parentType) {
        const contact = this.getContactInfo(side, parentType);
        if (!contact) return null;

        const vCard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${contact.name}`,
            `TEL;TYPE=CELL:${contact.phone}`,
            `NOTE:${contact.side} ${contact.relation} - ${CONFIG.wedding.bride.name} ❤️ ${CONFIG.wedding.groom.name} 결혼식`,
            'END:VCARD'
        ].join('\n');

        return vCard;
    },

    // 연락처 저장 (vCard 다운로드)
    saveContact: function(side, parentType) {
        const vCard = this.generateVCard(side, parentType);
        const contact = this.getContactInfo(side, parentType);
        
        if (!vCard || !contact) {
            NotificationManager.error('연락처 정보를 생성할 수 없습니다.');
            return;
        }

        try {
            const blob = new Blob([vCard], { type: 'text/vcard' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${contact.name}.vcf`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            NotificationManager.success('연락처가 저장되었습니다.');
            
            // 분석 추적
            AnalyticsManager.track('contact_save', {
                side: side,
                parent_type: parentType
            });
            
        } catch (error) {
            console.error('연락처 저장 실패:', error);
            NotificationManager.error('연락처 저장에 실패했습니다.');
        }
    },

    // 카카오톡으로 연락하기
    openKakaoTalk: function(side, parentType) {
        const contact = this.getContactInfo(side, parentType);
        if (!contact) {
            NotificationManager.error('연락처 정보를 찾을 수 없습니다.');
            return;
        }

        // 카카오톡 URL 스키마 (실제로는 전화번호로 직접 연결 불가)
        // 대신 메시지 복사 기능 제공
        const message = this.getSMSMessage(side, parentType);
        Utils.copyToClipboard(message, '메시지가 복사되었습니다. 카카오톡에서 붙여넣기 하세요.');
        
        // 분석 추적
        AnalyticsManager.track('contact_kakao', {
            side: side,
            parent_type: parentType
        });
    },

    // 이메일 보내기 (이메일 주소가 있는 경우)
    sendEmail: function(side, parentType, email) {
        const contact = this.getContactInfo(side, parentType);
        if (!contact) {
            NotificationManager.error('연락처 정보를 찾을 수 없습니다.');
            return;
        }

        const subject = `${CONFIG.wedding.bride.name} ❤️ ${CONFIG.wedding.groom.name} 결혼식 관련 문의`;
        const body = this.getSMSMessage(side, parentType);
        
        const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        try {
            window.location.href = mailtoUrl;
            
            // 분석 추적
            AnalyticsManager.track('contact_email', {
                side: side,
                parent_type: parentType
            });
            
        } catch (error) {
            console.error('이메일 전송 실패:', error);
            NotificationManager.error('이메일을 보낼 수 없습니다.');
        }
    },

    // 연락처 목록 UI 업데이트 (필요시)
    updateContactsUI: function() {
        const contacts = this.getAllContacts();
        
        // 연락처 정보 업데이트 로직
        contacts.forEach(contact => {
            const elements = document.querySelectorAll(`[data-contact="${contact.side}-${contact.relation}"]`);
            elements.forEach(element => {
                element.textContent = `${contact.name} (${contact.formattedPhone})`;
            });
        });
    }
};
