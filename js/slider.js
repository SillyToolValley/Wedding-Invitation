// ========================================
// SLIDER MODULE - 사진 슬라이더 관리
// ========================================
const SliderManager = {
    currentIndex: 0,
    photos: null,
    autoSlideInterval: null,
    isPlaying: true,
    touchStartX: 0,
    touchEndX: 0,

    init: function() {
        this.photos = document.querySelectorAll('.photo-slide');
        if (!this.photos.length) {
            console.warn('슬라이더 이미지를 찾을 수 없습니다.');
            return;
        }

        this.setupTouchEvents();
        this.setupKeyboardEvents();
        this.startAutoSlide();
        
        // 초기 상태 설정
        this.update();
    },

    next: function() {
        this.currentIndex = (this.currentIndex + 1) % this.photos.length;
        this.update();
        this.resetAutoSlide();
    },

    previous: function() {
        this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
        this.update();
        this.resetAutoSlide();
    },

    goTo: function(index) {
        if (index >= 0 && index < this.photos.length) {
            this.currentIndex = index;
            this.update();
            this.resetAutoSlide();
        }
    },

    update: function() {
        const track = document.getElementById('photoTrack');
        if (!track) {
            console.warn('사진 트랙을 찾을 수 없습니다.');
            return;
        }

        const translateX = -this.currentIndex * 100;
        track.style.transform = `translateX(${translateX}%)`;
        
        // 인디케이터 업데이트 (있다면)
        this.updateIndicators();
        
        // 이미지 지연 로딩
        this.loadCurrentImage();
    },

    updateIndicators: function() {
        const indicators = document.querySelectorAll('.slider-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
    },

    loadCurrentImage: function() {
        const currentSlide = this.photos[this.currentIndex];
        if (currentSlide) {
            const img = currentSlide.querySelector('img');
            if (img && img.dataset.src && !img.src) {
                img.src = img.dataset.src;
            }
        }
        
        // 다음/이전 이미지도 미리 로드
        const nextIndex = (this.currentIndex + 1) % this.photos.length;
        const prevIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
        
        [nextIndex, prevIndex].forEach(index => {
            const slide = this.photos[index];
            if (slide) {
                const img = slide.querySelector('img');
                if (img && img.dataset.src && !img.src) {
                    img.src = img.dataset.src;
                }
            }
        });
    },

    startAutoSlide: function() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
        }
        
        this.autoSlideInterval = setInterval(() => {
            if (this.isPlaying && !document.hidden) {
                this.next();
            }
        }, 4000);
        
        this.isPlaying = true;
    },

    stopAutoSlide: function() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.autoSlideInterval = null;
        }
        this.isPlaying = false;
    },

    resetAutoSlide: function() {
        if (this.isPlaying) {
            this.startAutoSlide();
        }
    },

    toggleAutoSlide: function() {
        if (this.isPlaying) {
            this.stopAutoSlide();
        } else {
            this.startAutoSlide();
        }
        return this.isPlaying;
    },

    setupTouchEvents: function() {
        const slider = document.querySelector('.photo-slider');
        if (!slider) return;

        slider.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.stopAutoSlide();
        }, { passive: true });

        slider.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
            
            // 터치 후 자동 슬라이드 재시작
            setTimeout(() => {
                this.startAutoSlide();
            }, 1000);
        }, { passive: true });

        // 마우스 이벤트 (데스크톱)
        slider.addEventListener('mouseenter', () => {
            this.stopAutoSlide();
        });

        slider.addEventListener('mouseleave', () => {
            this.startAutoSlide();
        });
    },

    handleSwipe: function() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // 왼쪽으로 스와이프 - 다음 슬라이드
                this.next();
            } else {
                // 오른쪽으로 스와이프 - 이전 슬라이드
                this.previous();
            }
        }
    },

    setupKeyboardEvents: function() {
        // 키보드 이벤트는 app.js에서 처리
    },

    // 슬라이더 인디케이터 생성 (선택사항)
    createIndicators: function() {
        const controlsContainer = document.querySelector('.slider-controls');
        if (!controlsContainer || !this.photos.length) return;

        const indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'slider-indicators';
        indicatorsContainer.style.cssText = `
            display: flex;
            justify-content: center;
            margin-top: 10px;
            gap: 8px;
        `;

        for (let i = 0; i < this.photos.length; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'slider-indicator';
            indicator.style.cssText = `
                width: 8px;
                height: 8px;
                border-radius: 50%;
                border: none;
                background: #ddd;
                cursor: pointer;
                transition: background 0.3s;
            `;
            
            if (i === this.currentIndex) {
                indicator.style.background = '#ff6b6b';
                indicator.classList.add('active');
            }

            indicator.addEventListener('click', () => {
                this.goTo(i);
            });

            indicatorsContainer.appendChild(indicator);
        }

        controlsContainer.appendChild(indicatorsContainer);
    },

    // 전체화면 모드
    enterFullscreen: function() {
        const slider = document.querySelector('.photo-slider');
        if (slider && slider.requestFullscreen) {
            slider.requestFullscreen().catch(err => {
                console.log('전체화면 진입 실패:', err);
            });
        }
    },

    // 슬라이더 정보
    getInfo: function() {
        return {
            currentIndex: this.currentIndex,
            totalSlides: this.photos.length,
            isPlaying: this.isPlaying,
            currentImage: this.photos[this.currentIndex]?.querySelector('img')?.src
        };
    }
};
