// ========================================
// PERFORMANCE MODULE - 성능 최적화
// ========================================
const PerformanceManager = {
    // 이미지 지연 로딩
    lazyLoadImages: function() {
        // Intersection Observer 지원 확인
        if (!('IntersectionObserver' in window)) {
            // 지원하지 않는 경우 모든 이미지 즉시 로드
            this.loadAllImages();
            return;
        }

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px', // 50px 미리 로드
            threshold: 0.01
        });

        // data-src 속성을 가진 이미지들을 관찰
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });

        // 기존 이미지들도 관찰 (에러 처리용)
        const allImages = document.querySelectorAll('img:not([data-src])');
        allImages.forEach(img => {
            if (!img.complete) {
                imageObserver.observe(img);
            }
        });
    },

    // 이미지 로드
    loadImage: function(img) {
        return new Promise((resolve, reject) => {
            const tempImg = new Image();
            
            tempImg.onload = () => {
                // 성공적으로 로드되면 실제 이미지에 적용
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                img.classList.remove('lazy');
                img.classList.add('loaded');
                resolve(img);
            };
            
            tempImg.onerror = () => {
                // 로드 실패시 placeholder 이미지
                img.src = 'https://via.placeholder.com/400x300/f0f0f0/666?text=이미지+로드+실패';
                img.classList.remove('lazy');
                img.classList.add('error');
                reject(new Error('Image load failed'));
            };
            
            // 로딩 시작
            tempImg.src = img.dataset.src || img.src;
        });
    },

    // 모든 이미지 즉시 로드 (fallback)
    loadAllImages: function() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.classList.remove('lazy');
        });
    },

    // 리소스 프리로딩
    preloadResources: function() {
        const criticalResources = [
            // 중요한 이미지들
            CONFIG.photos.main,
            ...CONFIG.photos.album.slice(0, 2), // 첫 2개 슬라이드만
        ];

        criticalResources.forEach(url => {
            if (url && url.startsWith('http')) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = url;
                document.head.appendChild(link);
            }
        });
    },

    // CSS 중요 스타일 인라인화 확인
    checkCriticalCSS: function() {
        // 중요한 above-the-fold 스타일이 인라인으로 있는지 확인
        const criticalStyles = [
            '.container',
            '.title-section',
            '.main-photo'
        ];

        const hasInlineStyles = document.querySelector('style');
        if (!hasInlineStyles) {
            console.warn('Critical CSS가 인라인으로 포함되지 않았습니다.');
        }
    },

    // JavaScript 지연 로딩
    deferNonCriticalJS: function() {
        // 중요하지 않은 스크립트들을 지연 로딩
        const nonCriticalScripts = [
            'js/analytics.js',
            'js/performance.js'
        ];

        nonCriticalScripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            document.head.appendChild(script);
        });
    },

    // 메모리 사용량 모니터링
    monitorMemoryUsage: function() {
        if ('memory' in performance) {
            const checkMemory = () => {
                const memory = performance.memory;
                const usage = {
                    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
                    total: Math.round(memory.totalJSHeapSize / 1048576), // MB
                    limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
                };

                // 메모리 사용량이 70% 초과시 경고
                if (usage.used / usage.limit > 0.7) {
                    console.warn('높은 메모리 사용량 감지:', usage);
                    this.cleanupMemory();
                }

                return usage;
            };

            // 5분마다 메모리 체크
            setInterval(checkMemory, 5 * 60 * 1000);
            
            // 초기 체크
            checkMemory();
        }
    },

    // 메모리 정리
    cleanupMemory: function() {
        // 오래된 분석 데이터 정리
        if (window.localAnalytics && window.localAnalytics.length > 500) {
            window.localAnalytics = window.localAnalytics.slice(-500);
        }

        // 사용하지 않는 이미지 캐시 정리
        const unusedImages = document.querySelectorAll('img.error');
        unusedImages.forEach(img => {
            if (img.src.includes('placeholder')) {
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            }
        });
    },

    // 네트워크 상태 감지
    monitorNetworkStatus: function() {
        // Network Information API 지원 확인
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            const handleConnectionChange = () => {
                const effectiveType = connection.effectiveType;
                const saveData = connection.saveData;
                
                // 느린 연결이거나 데이터 절약 모드인 경우
                if (effectiveType === 'slow-2g' || effectiveType === '2g' || saveData) {
                    this.enableDataSavingMode();
                } else {
                    this.disableDataSavingMode();
                }
            };

            connection.addEventListener('change', handleConnectionChange);
            handleConnectionChange(); // 초기 상태 확인
        }

        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            NotificationManager.success('인터넷 연결이 복구되었습니다.');
            this.disableDataSavingMode();
        });

        window.addEventListener('offline', () => {
            NotificationManager.warning('인터넷 연결이 끊어졌습니다.');
            this.enableDataSavingMode();
        });
    },

    // 데이터 절약 모드 활성화
    enableDataSavingMode: function() {
        // 자동 슬라이드 중지
        if (SliderManager) {
            SliderManager.stopAutoSlide();
        }

        // 이미지 품질 저하
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.src && !img.dataset.originalSrc) {
                img.dataset.originalSrc = img.src;
                // 저화질 버전으로 교체 (실제 구현시)
                // img.src = img.src.replace(/\/([^\/]+)$/, '/low_$1');
            }
        });

        document.body.classList.add('data-saving-mode');
        console.log('데이터 절약 모드 활성화');
    },

    // 데이터 절약 모드 비활성화
    disableDataSavingMode: function() {
        // 자동 슬라이드 재시작
        if (SliderManager) {
            SliderManager.startAutoSlide();
        }

        // 원본 이미지 복구
        const images = document.querySelectorAll('img[data-original-src]');
        images.forEach(img => {
            img.src = img.dataset.originalSrc;
            delete img.dataset.originalSrc;
        });

        document.body.classList.remove('data-saving-mode');
        console.log('데이터 절약 모드 비활성화');
    },

    // 렌더링 최적화
    optimizeRendering: function() {
        // 스크롤 이벤트 최적화
        let ticking = false;
        
        const optimizedScrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    // 스크롤 관련 작업들
                    this.updateScrollProgress();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

        // 리사이즈 이벤트 최적화
        const optimizedResizeHandler = Utils.debounce(() => {
            // 리사이즈 관련 작업들
            if (SliderManager) {
                SliderManager.update();
            }
        }, 250);

        window.addEventListener('resize', optimizedResizeHandler);
    },

    // 스크롤 진행률 업데이트
    updateScrollProgress: function() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        // 진행률 표시 (있다면)
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) {
            progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
        }
    },

    // 중요 메트릭 측정
    measureCoreWebVitals: function() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    
                    const lcp = lastEntry.startTime;
                    console.log('LCP:', lcp);
                    
                    // 분석 전송
                    AnalyticsManager.track('core_web_vitals', {
                        metric: 'LCP',
                        value: lcp,
                        rating: lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor'
                    });
                });
                
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('LCP 측정 실패:', e);
            }

            // First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        const fid = entry.processingStart - entry.startTime;
                        console.log('FID:', fid);
                        
                        AnalyticsManager.track('core_web_vitals', {
                            metric: 'FID',
                            value: fid,
                            rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor'
                        });
                    });
                });
                
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.warn('FID 측정 실패:', e);
            }
        }
    },

    // 성능 진단 실행
    runPerformanceDiagnostics: function() {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            connectionType: navigator.connection?.effectiveType || 'unknown',
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576)
            } : null,
            timing: null
        };

        // 페이지 로딩 타이밍
        if (performance.timing) {
            const timing = performance.timing;
            diagnostics.timing = {
                domLoading: timing.domLoading - timing.navigationStart,
                domInteractive: timing.domInteractive - timing.navigationStart,
                domComplete: timing.domComplete - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart
            };
        }

        console.log('Performance Diagnostics:', diagnostics);
        return diagnostics;
    },

    // 초기화
    init: function() {
        // 성능 최적화 기능들 활성화
        this.preloadResources();
        this.monitorMemoryUsage();
        this.monitorNetworkStatus();
        this.optimizeRendering();
        this.measureCoreWebVitals();
        
        // 페이지 로드 완료 후 진단 실행
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.runPerformanceDiagnostics();
            }, 1000);
        });
    }
};
