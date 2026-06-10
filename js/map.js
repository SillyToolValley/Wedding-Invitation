// ========================================
// MAP MODULE - 지도 관리
// ========================================
const MapManager = {
    // 네이버 지도 열기
    openNaverMap: function() {
        const address = CONFIG.wedding.venue.address;
        const encodedAddress = Utils.encodeForURL(address);
        const isMobile = Utils.isMobile();
        
        // 분석 추적
        AnalyticsManager.track('map_open', { 
            provider: 'naver',
            device: isMobile ? 'mobile' : 'desktop'
        });
        
        if (isMobile) {
            // 모바일: 네이버지도 앱 시도 후 웹으로 fallback
            this.openMobileApp(
                CONFIG.map.naver.appScheme + encodedAddress,
                CONFIG.map.naver.searchUrl + encodedAddress
            );
        } else {
            // 데스크톱: 웹에서 바로 열기
            window.open(CONFIG.map.naver.searchUrl + encodedAddress, '_blank');
        }
    },

    // 카카오 맵 열기
    openKakaoMap: function() {
        const address = CONFIG.wedding.venue.address;
        const encodedAddress = Utils.encodeForURL(address);
        const isMobile = Utils.isMobile();
        
        // 분석 추적
        AnalyticsManager.track('map_open', { 
            provider: 'kakao',
            device: isMobile ? 'mobile' : 'desktop'
        });
        
        if (isMobile) {
            // 모바일: 카카오맵 앱 시도 후 웹으로 fallback
            this.openMobileApp(
                CONFIG.map.kakao.appScheme + encodedAddress,
                CONFIG.map.kakao.searchUrl + encodedAddress
            );
        } else {
            // 데스크톱: 웹에서 바로 열기
            window.open(CONFIG.map.kakao.searchUrl + encodedAddress, '_blank');
        }
    },

    // 모바일 앱 열기 (fallback 포함)
    openMobileApp: function(appUrl, webUrl) {
        let appOpened = false;
        
        // 앱 열기 시도
        const appLink = document.createElement('a');
        appLink.href = appUrl;
        appLink.style.display = 'none';
        document.body.appendChild(appLink);
        
        // 클릭 이벤트 시뮬레이션
        appLink.click();
        document.body.removeChild(appLink);
        
        // 앱이 열리지 않았을 경우를 대비한 타이머
        const startTime = Date.now();
        
        setTimeout(() => {
            // 앱이 열렸다면 브라우저가 백그라운드로 가면서 blur 이벤트 발생
            // 일정 시간 후에도 blur가 발생하지 않았다면 앱이 없는 것으로 판단
            if (Date.now() - startTime < 2100) {
                window.open(webUrl, '_blank');
            }
        }, 2000);
        
        // 페이지가 blur되면 앱이 열린 것으로 판단
        const handleBlur = () => {
            appOpened = true;
            window.removeEventListener('blur', handleBlur);
        };
        
        window.addEventListener('blur', handleBlur);
        
        // 3초 후 이벤트 리스너 정리
        setTimeout(() => {
            window.removeEventListener('blur', handleBlur);
        }, 3000);
    },

    // 현재 위치에서 길찾기
    getDirections: function(provider = 'naver') {
        const venue = CONFIG.wedding.venue;
        
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    this.openDirections(latitude, longitude, venue, provider);
                },
                (error) => {
                    console.error('위치 정보를 가져올 수 없습니다:', error);
                    NotificationManager.warning('위치 정보를 가져올 수 없어 주소로 검색합니다.');
                    
                    // 현재 위치를 알 수 없으면 그냥 장소 검색
                    if (provider === 'naver') {
                        this.openNaverMap();
                    } else {
                        this.openKakaoMap();
                    }
                }
            );
        } else {
            NotificationManager.warning('이 브라우저는 위치 서비스를 지원하지 않습니다.');
            if (provider === 'naver') {
                this.openNaverMap();
            } else {
                this.openKakaoMap();
            }
        }
    },

    // 길찾기 URL 생성 및 열기
    openDirections: function(startLat, startLng, venue, provider) {
        let directionsUrl;
        
        if (provider === 'naver') {
            // 네이버 길찾기 URL
            directionsUrl = `https://map.naver.com/v5/directions/${startLng},${startLat},현재위치,ADDRESS_POI/${venue.coordinates.lng},${venue.coordinates.lat},${Utils.encodeForURL(venue.name)},PLACE_POI/-/transit,car`;
        } else {
            // 카카오 길찾기 URL
            directionsUrl = `https://map.kakao.com/link/to/${Utils.encodeForURL(venue.name)},${venue.coordinates.lat},${venue.coordinates.lng}`;
        }
        
        window.open(directionsUrl, '_blank');
    },

    // 지도 iframe 새로고침 (필요시)
    refreshMap: function() {
        const mapIframe = document.querySelector('.map-container iframe');
        if (mapIframe) {
            mapIframe.src = mapIframe.src;
        }
    }
};
