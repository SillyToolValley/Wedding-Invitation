// ===== Wedding Runner Mini Game =====
(() => {
  let gameContainer = null;
  let canvas = null;
  let ctx = null;

  const ASSET_BASE = window.location.pathname.includes('/redesign/')
    ? '../assets/pixel/game/'
    : 'assets/pixel/game/';
  const SPR = {};
  const SPRITE_FILES = {
    bg: 'Background/Sky.png',
    bgMoon: 'Background/Moon.png',
    bgStars: 'Background/Stars.png',
    bgCloud2: 'Background/Cloud2.png',
    bgCloud1: 'Background/Cloud1.png',
    platformBuilding1: 'Platform/Building1.png',
    platformBuilding2: 'Platform/Building2.png',
    platformBuilding3: 'Platform/Building3.png',
    platformBuilding4: 'Platform/Building4.png',
    propDisplayBoard: 'PlatformProps/DisplayBoard.png',
    propDoor: 'PlatformProps/Door.png',
    propDoor2: 'PlatformProps/Door2.png',
    propFlowers: 'PlatformProps/flowers.png',
    propOutdoorUnit: 'PlatformProps/OutdoorUnit.png',
    propOutdoorUnit2: 'PlatformProps/OutdoorUnit2.png',
    propOutdoorUnit3: 'PlatformProps/OutdoorUnit3.png',
    propWaterTank: 'PlatformProps/WaterTank.png',
    mine: 'Enemy/mine.png',
    drone: 'Enemy/Drone.png',
    bullet: 'bullet.png',
    heart: 'heart.png',
    groomIdle: 'Groom/Idle.png',
    groomRun: 'Groom/Run.png',
    groomJump: 'Groom/Jump.png',
    groomAttack: 'Groom/Attack.png',
    groomDie: 'Groom/Die.png',
    brideIdle: 'Bride/Idle.png',
    brideRun: 'Bride/Run.png',
    brideJump: 'Bride/Jump.png',
    brideAttack: 'Bride/Attack.png',
    brideDie: 'Bride/Die.png',
  };
  const KEYED_SPR = {};
  const FRAME_W = 96;
  const FRAME_H = 96;
  const ANIM_FPS = {
    run: 10,
    jump: 12,
    brideAttack: 10,
    groomAttack: 24,
  };
  const PLATFORM_BUILDING_KEYS = [
    'platformBuilding1',
    'platformBuilding2',
    'platformBuilding3',
    'platformBuilding4',
  ];
  const PLATFORM_BUILDING_META = {
    platformBuilding1: { w: 1045, h: 625 },
    platformBuilding2: { w: 640, h: 405 },
    platformBuilding3: { w: 1029, h: 611 },
    platformBuilding4: { w: 416, h: 1188 },
  };
  const PLATFORM_BUILDING_SCALE = 1200 / 1045;
  const PLATFORM_PROP_DEFS = [
    { key: 'propDisplayBoard', minPlatformW: 380, width: 260, chance: 0.12, yOffset: 10 },
    { key: 'propDoor', minPlatformW: 220, width: 90, chance: 0.28, yOffset: 2 },
    { key: 'propDoor2', minPlatformW: 320, width: 170, chance: 0.18, yOffset: 2 },
    { key: 'propFlowers', minPlatformW: 150, width: 52, chance: 0.42, yOffset: 0 },
    { key: 'propOutdoorUnit', minPlatformW: 170, width: 48, chance: 0.4, yOffset: 4 },
    { key: 'propOutdoorUnit2', minPlatformW: 170, width: 48, chance: 0.35, yOffset: 4 },
    { key: 'propOutdoorUnit3', minPlatformW: 260, width: 120, chance: 0.28, yOffset: 4 },
    { key: 'propWaterTank', minPlatformW: 240, width: 58, chance: 0.22, yOffset: 4 },
  ];
  const CHROMA_KEYED_SPRITES = new Set([
    ...PLATFORM_BUILDING_KEYS,
    ...PLATFORM_PROP_DEFS.map((prop) => prop.key),
  ]);
  const BACKGROUND_LAYERS = [
    { key: 'bgMoon', speed: 0.006 },
    { key: 'bgStars', speed: 0.01 },
    { key: 'bgCloud2', speed: 0.018 },
    { key: 'bgCloud1', speed: 0.03 },
  ];
  const BACKGROUND_BASE_SPEED = 0.003;
  const DRONE_SPAWN_BASE_OFFSET = 80;
  const DRONE_SPAWN_RANDOM_OFFSET = 34;
  const BRIDE_BULLET_FALLBACK_W = 18;
  const BRIDE_BULLET_FALLBACK_H = 5;
  const BRIDE_BULLET_X_FACTOR = 0.9;
  const BRIDE_BULLET_Y_FACTOR = 0.50;
  const BRIDE_MAGAZINE_SIZE = 10;
  const BRIDE_FIRE_CADENCE = 0.06;
  const BRIDE_RELOAD_TIME = 0.5;
  const BRIDE_IDLE_RELOAD_TIME = 2.0;

  Object.entries(SPRITE_FILES).forEach(([key, path]) => {
    const im = new Image();
    im.src = ASSET_BASE + path;
    SPR[key] = im;
  });

  function assetWidth(s) {
    return s ? (s.naturalWidth || s.width || 0) : 0;
  }

  function assetHeight(s) {
    return s ? (s.naturalHeight || s.height || 0) : 0;
  }

  function getBrideBulletSize() {
    return {
      w: assetWidth(SPR.bullet) || BRIDE_BULLET_FALLBACK_W,
      h: assetHeight(SPR.bullet) || BRIDE_BULLET_FALLBACK_H,
    };
  }

  function sprReady(s) {
    return s && s.complete !== false && assetWidth(s) > 0 && assetHeight(s) > 0;
  }

  function getRenderableSprite(key) {
    const source = SPR[key];
    if (!sprReady(source)) return null;
    if (!CHROMA_KEYED_SPRITES.has(key)) return source;
    if (!KEYED_SPR[key]) KEYED_SPR[key] = createFloodKeyedCanvas(source);
    return KEYED_SPR[key];
  }

  function createFloodKeyedCanvas(image) {
    const w = assetWidth(image);
    const h = assetHeight(image);
    const canvasEl = document.createElement('canvas');
    canvasEl.width = w;
    canvasEl.height = h;
    const c = canvasEl.getContext('2d');
    c.drawImage(image, 0, 0, w, h);

    let imageData;
    try {
      imageData = c.getImageData(0, 0, w, h);
    } catch (e) {
      return image;
    }

    const data = imageData.data;
    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    function isKeyPixel(i) {
      const offset = i * 4;
      const a = data[offset + 3];
      if (a === 0) return true;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      return min >= 238 && max - min <= 22;
    }

    function enqueue(i) {
      if (!visited[i] && isKeyPixel(i)) {
        visited[i] = 1;
        queue[tail++] = i;
      }
    }

    for (let x = 0; x < w; x++) {
      enqueue(x);
      enqueue((h - 1) * w + x);
    }
    for (let y = 1; y < h - 1; y++) {
      enqueue(y * w);
      enqueue(y * w + w - 1);
    }

    while (head < tail) {
      const i = queue[head++];
      const x = i % w;
      const y = (i - x) / w;
      if (x > 0) enqueue(i - 1);
      if (x < w - 1) enqueue(i + 1);
      if (y > 0) enqueue(i - w);
      if (y < h - 1) enqueue(i + w);
    }

    for (let i = 0; i < visited.length; i++) {
      if (visited[i]) data[i * 4 + 3] = 0;
    }
    c.putImageData(imageData, 0, 0);
    return canvasEl;
  }

  function spriteFrameCount(s) {
    if (!sprReady(s)) return 1;
    const cols = Math.max(1, Math.floor(assetWidth(s) / FRAME_W));
    const rows = Math.max(1, Math.floor(assetHeight(s) / FRAME_H));
    return cols * rows;
  }

  function spriteCols(s) {
    return sprReady(s) ? Math.max(1, Math.floor(assetWidth(s) / FRAME_W)) : 1;
  }

  function clipDuration(key, fps) {
    const fallbackFrames = key === 'groomAttack' || key === 'groomDie' ? 16 : 8;
    const frames = sprReady(SPR[key]) ? spriteFrameCount(SPR[key]) : fallbackFrames;
    return frames / fps;
  }

  function drawSpriteFrame(s, frame, dx, dy, dw, dh) {
    if (!sprReady(s)) return false;
    const total = spriteFrameCount(s);
    const cols = spriteCols(s);
    const f = Math.max(0, Math.min(total - 1, frame));
    const sx = (f % cols) * FRAME_W;
    const sy = Math.floor(f / cols) * FRAME_H;
    ctx.drawImage(s, sx, sy, FRAME_W, FRAME_H, dx, dy, dw, dh);
    return true;
  }

  function isAttackHeld() {
    return keys.has('KeyJ') || touches.has('attack');
  }
  let isGameActive = false;
  let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  
  // Firebase functions will be defined globally
  window.initMiniGame = function(containerId) {
    gameContainer = document.getElementById(containerId);
    if (!gameContainer) return;
    
    setupGameHTML();
    setupCanvas();
    setupEventListeners();
  };

  function setupGameHTML() {
    // Check if mobile or small screen
    const showButtons = isMobile || window.innerWidth <= 768;
    
    // Simple 16:9 game container as a section
    gameContainer.innerHTML = `
      <div class="game-section-wrapper" style="
        width: 100%;
        max-width: 380px;
        margin: 0 auto;
        padding: 0 10px;
        box-sizing: border-box;
      ">
        <!-- Game Screen with 3:4 ratio -->
        <div class="game-screen-container" style="
          position: relative;
          width: 100%;
          padding-bottom: 133.33%;
          margin: 0 auto;
          background: #0b1020;
          border: 3px solid #ff006e;
          overflow: hidden;
          box-shadow: 0 0 30px rgba(255,0,110,0.5);
          box-sizing: border-box;
        ">
          <div class="game-wrapper" style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
          ">
            <canvas id="miniGameCanvas" width="600" height="800" style="
              display: block;
              width: 100%;
              height: 100%;
              image-rendering: pixelated;
              image-rendering: crisp-edges;
            "></canvas>
        
        <!-- UI Overlay -->
        <div class="game-ui" style="position:absolute;left:1%;top:1%;padding:6px 8px;background:rgba(7,10,20,.72);border:2px solid #ff006e;color:#ffde00;font-family:'Press Start 2P',monospace;font-size:clamp(6px, 1.5vw, 9px);z-index:10;white-space:nowrap;width:max-content;box-sizing:border-box;">
          <div>DIST: <span id="gameDistance">0m</span></div>
          <div id="leaderboardList" style="margin-top:5px;line-height:1.45;font-size:clamp(5px, 1.2vw, 7px);color:white;white-space:nowrap;">
            Loading...
          </div>
        </div>
            
            <!-- Start Screen (Inside game wrapper) -->
            <div id="startScreen" style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(10,10,10,0.95);z-index:100;overflow:auto;">
              <div style="text-align:center;padding:10px;max-width:90%;width:100%;">
                <h2 style="color:#ff006e;font-family:'Press Start 2P';font-size:clamp(10px, 2.5vw, 16px);margin-bottom:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 10px;">WEDDING RUNNER</h2>
                <p style="color:#ffde00;font-family:'Press Start 2P';font-size:clamp(6px, 1.5vw, 10px);line-height:1.6;margin-bottom:20px;">
                  신랑과 신부가 함께하는<br>
                  무한 러닝 게임!
                </p>
                <button id="startGameBtn" style="padding:10px 20px;background:#ff006e;border:none;color:white;font-family:'Press Start 2P';font-size:clamp(8px, 2vw, 11px);cursor:pointer;animation:blink 1s infinite;white-space:nowrap;">
                  START GAME
                </button>
              </div>
            </div>
            
            <!-- Game Over Screen (Inside game wrapper) -->
            <div id="gameOverScreen" style="position:absolute;top:0;left:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(10,10,10,0.95);z-index:100;overflow:auto;">
              <div style="background:#0b1020;border:3px solid #ff006e;padding:15px;text-align:center;color:#ffde00;font-family:'Press Start 2P';width:90%;max-width:350px;box-sizing:border-box;margin:auto;">
                <h2 style="margin:0 0 10px;font-size:clamp(10px, 2.5vw, 14px);white-space:nowrap;">GAME OVER</h2>
                <div id="finalScore" style="margin:10px 0;font-size:clamp(7px, 1.8vw, 10px);line-height:1.6;"></div>
                <div id="recordSubmit" style="display:none;">
                  <input type="text" id="playerName" placeholder="이름 입력" maxlength="10" style="margin:10px 0;padding:6px 8px;background:#1a1a2e;border:2px solid #ff006e;color:white;font-family:'Press Start 2P';font-size:clamp(6px, 1.5vw, 9px);width:80%;box-sizing:border-box;">
                  <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">
                    <button id="submitScore" style="padding:8px 12px;background:#ff006e;border:none;color:white;font-family:'Press Start 2P';font-size:clamp(6px, 1.5vw, 9px);cursor:pointer;white-space:nowrap;">SUBMIT</button>
                    <button id="restartGame" style="padding:8px 12px;background:#ffde00;border:none;color:black;font-family:'Press Start 2P';font-size:clamp(6px, 1.5vw, 9px);cursor:pointer;white-space:nowrap;">RETRY</button>
                  </div>
                </div>
                <div id="normalRestart" style="display:none;">
                  <button id="restartGameOnly" style="padding:10px 15px;background:#ffde00;border:none;color:black;font-family:'Press Start 2P';font-size:clamp(7px, 1.8vw, 10px);cursor:pointer;margin-top:15px;white-space:nowrap;">RETRY</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Control Panel for Mobile/Touch -->
        <div class="control-panel" style="
          margin-top: 10px;
          padding: 10px;
          background: rgba(15,15,35,0.9);
          border: 2px solid #ff006e;
          display: ${showButtons ? 'flex' : 'none'};
          justify-content: space-around;
          max-width: 360px;
          margin-left: auto;
          margin-right: auto;
          box-sizing: border-box;
          align-items: center;
          gap: 20px;
        ">
          <!-- Left Controls -->
          <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
            <button class="game-btn" id="btnTag" style="
              width: 75px;
              height: 50px;
              background: #ff66ff;
              border: 2px solid #ff99ff;
              color: #fff;
              font-family: 'Press Start 2P', monospace;
              font-size: 9px;
              cursor: pointer;
              border-radius: 5px;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
            ">TAG</button>
            
            <button class="game-btn" id="btnJump" style="
              width: 90px;
              height: 60px;
              background: #ff006e;
              border: 2px solid #ff3388;
              color: #fff;
              font-family: 'Press Start 2P', monospace;
              font-size: 11px;
              cursor: pointer;
              border-radius: 5px;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
            ">JUMP</button>
          </div>
          
          <!-- Right Controls -->
          <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
            <button class="game-btn" id="btnAttack" style="
              width: 75px;
              height: 50px;
              background: #0099ff;
              border: 2px solid #44bbff;
              color: #fff;
              font-family: 'Press Start 2P', monospace;
              font-size: 9px;
              cursor: pointer;
              border-radius: 5px;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
            ">ATK</button>
            
            <button class="game-btn" id="btnSlam" style="
              width: 90px;
              height: 60px;
              background: #ff0033;
              border: 2px solid #ff4466;
              color: #fff;
              font-family: 'Press Start 2P', monospace;
              font-size: 11px;
              cursor: pointer;
              border-radius: 5px;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
            ">SLAM</button>
          </div>
        </div>
        
        <!-- Full Leaderboard Section Below Control Panel -->
        <div id="fullLeaderboard" style="
          margin-top: 20px;
          padding: 20px;
          background: rgba(15,15,35,0.95);
          border: 2px solid #ffde00;
          display: none;
        ">
          <h3 style="
            color: #ffde00;
            font-family: 'Press Start 2P', monospace;
            font-size: 14px;
            text-align: center;
            margin-bottom: 15px;
          ">FULL LEADERBOARD</h3>
          <div id="leaderboardPages" style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
          "></div>
          <div id="leaderboardPagination" style="
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 15px;
          "></div>
        </div>
      </div>
    `;
  }

  function setupCanvas() {
    canvas = document.getElementById('miniGameCanvas');
    if (!canvas) {
      console.error('Canvas not found!');
      return;
    }
    ctx = canvas.getContext('2d');
    
    // 3:4 aspect ratio dimensions
    canvas.width = 600;
    canvas.height = 800;
    
    // Update world dimensions
    world.w = canvas.width;
    world.h = canvas.height;
    
    console.log('Canvas setup:', canvas.width, 'x', canvas.height);
  }

  // ===== Game Variables =====
  let DPR = 1;
  const world = {
    w: 768, h: 1024,
    gravity: 1600,
    baseSpeed: 250,
    speed: 250,
    maxSpeed: 750,
    accelPerSec: 20,
    distance: 0,
    time: 0,
    shake: 0,
  };

  const CHAR = { MALE: 0, FEMALE: 1 };
  const player = {
    x: 150, y: 0, w: 65, h: 80,
    vx: 0, vy: 0,
    onGround: false,
    jumpsLeft: 2,
    jumpV: 600,
    who: CHAR.MALE,
    tagCooldown: 0,
    attackCooldown: 0,
    brideAmmo: BRIDE_MAGAZINE_SIZE,
    brideFireTimer: 0,
    brideReloadTimer: 0,
    brideIdleReloadTimer: 0,
    attackAnimTime: 0,
    attackAnimDuration: 0,
    jumpAnimTime: 0,
    animTime: 0,
    baseAnimRate: 1.0,
    coyote: 0,
    buffer: 0,
    slamming: false,
    slamCooldown: 0,
    swordSwing: 0, // 칼 휘두르는 애니메이션 타이머
    invulnerable: 0, // 무적 시간
  };

  const COYOTE_TIME = 0.10;
  const JUMP_BUFFER = 0.12;

  const platforms = [];
  const obstacles = [];
  const bullets = [];
  const waves = [];
  const slashes = [];
  const meleeRects = [];

  function makePlatform(x, y, buildingKey) {
    const key = buildingKey || PLATFORM_BUILDING_KEYS[Math.floor(Math.random() * PLATFORM_BUILDING_KEYS.length)];
    const meta = PLATFORM_BUILDING_META[key] || PLATFORM_BUILDING_META.platformBuilding1;
    const w = Math.round(meta.w * PLATFORM_BUILDING_SCALE);
    const h = Math.round(meta.h * PLATFORM_BUILDING_SCALE);
    return {
      x,
      y,
      w,
      h,
      buildingKey: key,
      props: makePlatformProps(w),
    };
  }

  function makePlatformProps(platformW) {
    const props = [];
    const candidates = PLATFORM_PROP_DEFS
      .filter((prop) => platformW >= prop.minPlatformW && Math.random() < prop.chance);
    const maxProps = platformW > 760 ? 3 : platformW > 420 ? 2 : 1;
    const propCount = Math.min(maxProps, candidates.length);

    for (let i = 0; i < propCount; i++) {
      const prop = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
      const w = Math.min(prop.width, platformW * 0.72);
      const xMin = 18 + w / 2;
      const xMax = Math.max(xMin, platformW - 18 - w / 2);
      props.push({
        key: prop.key,
        centerX: randRange(xMin, xMax),
        w,
        yOffset: prop.yOffset,
      });
    }

    return props;
  }

  // ===== Input System =====
  const keys = new Set();
  const touches = new Set();
  let running = false;
  let documentInputReady = false;

  function setupEventListeners() {
    if (!documentInputReady) {
      documentInputReady = true;
    // Keyboard events - simplified without focus checks
    document.addEventListener('keydown', (e) => {
      // Always handle game keys when game container exists
      if (!isGameInputVisible()) return;
      
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        
        // Start game if not running
        if (!running) {
          const startBtn = document.getElementById('startGameBtn');
          if (startBtn && startBtn.style.display !== 'none') {
            startGame();
            return;
          }
        }
        
        // Jump
        keys.add(e.code);
        player.buffer = JUMP_BUFFER;
        console.log('Jump key pressed');
      }
      else if (e.code === 'KeyJ') {
        e.preventDefault();
        keys.add(e.code);
        console.log('Attack key pressed');
      }
      else if (e.code === 'KeyQ') {
        e.preventDefault();
        keys.add(e.code);
        console.log('Tag key pressed');
      }
      else if (e.code === 'ArrowDown' || e.code === 'KeyK') {
        e.preventDefault();
        keys.add(e.code);
        console.log('Slam key pressed');
      }
    });

    document.addEventListener('keyup', (e) => {
      keys.delete(e.code);
    });
    }

    // Mobile button events (support both touch and mouse)
    const btnJump = document.getElementById('btnJump');
    const btnAttack = document.getElementById('btnAttack');
    const btnTag = document.getElementById('btnTag');
    const btnSlam = document.getElementById('btnSlam');

    if (btnJump) {
      // Touch events
      btnJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touches.add('jump');
        player.buffer = JUMP_BUFFER;
      });
      btnJump.addEventListener('touchend', () => touches.delete('jump'));
      
      // Mouse events for testing
      btnJump.addEventListener('mousedown', (e) => {
        e.preventDefault();
        touches.add('jump');
        player.buffer = JUMP_BUFFER;
      });
      btnJump.addEventListener('mouseup', () => touches.delete('jump'));
    }

    if (btnAttack) {
      btnAttack.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touches.add('attack');
      });
      btnAttack.addEventListener('touchend', () => touches.delete('attack'));
      btnAttack.addEventListener('touchcancel', () => touches.delete('attack'));
      
      btnAttack.addEventListener('mousedown', (e) => {
        e.preventDefault();
        touches.add('attack');
      });
      btnAttack.addEventListener('mouseup', () => touches.delete('attack'));
      btnAttack.addEventListener('mouseleave', () => touches.delete('attack'));
    }

    if (btnTag) {
      btnTag.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touches.add('tag');
      });
      btnTag.addEventListener('touchend', () => touches.delete('tag'));
      
      btnTag.addEventListener('mousedown', (e) => {
        e.preventDefault();
        touches.add('tag');
      });
      btnTag.addEventListener('mouseup', () => touches.delete('tag'));
    }

    if (btnSlam) {
      btnSlam.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touches.add('slam');
      });
      btnSlam.addEventListener('touchend', () => touches.delete('slam'));
      
      btnSlam.addEventListener('mousedown', (e) => {
        e.preventDefault();
        touches.add('slam');
      });
      btnSlam.addEventListener('mouseup', () => touches.delete('slam'));
    }

    // Start/Restart buttons
    const startBtn = document.getElementById('startGameBtn');
    const restartBtn = document.getElementById('restartGame');
    const restartOnlyBtn = document.getElementById('restartGameOnly');
    const submitBtn = document.getElementById('submitScore');

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (restartBtn) restartBtn.addEventListener('click', startGame);
    if (restartOnlyBtn) restartOnlyBtn.addEventListener('click', startGame);
    if (submitBtn) submitBtn.addEventListener('click', submitScore);
  }

  function isGameInputVisible() {
    return !!(gameContainer && gameContainer.getClientRects().length);
  }

  // ===== Game Session Tracking =====
  let gameSession = null;
  
  class GameSession {
    constructor() {
      this.sessionId = this.generateId();
      this.startTime = Date.now();
      this.actions = [];
      this.checkpoints = [];
      this.lastCheckpoint = 0;
    }
    
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    recordAction(type) {
      this.actions.push({
        type,
        time: Date.now() - this.startTime,
        distance: Math.floor(world.distance)
      });
    }
    
    recordCheckpoint() {
      const currentDistance = Math.floor(world.distance);
      if (currentDistance - this.lastCheckpoint >= 1000) {
        this.checkpoints.push({
          distance: currentDistance,
          time: Date.now() - this.startTime
        });
        this.lastCheckpoint = currentDistance;
      }
    }
    
    validate(finalScore) {
      const duration = Date.now() - this.startTime;
      
      // 최소 5초 플레이
      if (duration < 5000) {
        console.warn('Session too short');
        return false;
      }
      
      // 시간당 최대 점수 (분당 최대 15,000m)
      const maxScorePerMinute = 15000;
      const maxPossible = Math.floor((duration / 60000) * maxScorePerMinute);
      
      if (finalScore > maxPossible) {
        console.warn('Score exceeds time limit');
        return false;
      }
      
      // 최소 액션 수 (5초당 최소 1개)
      const minActions = Math.floor(duration / 5000);
      if (this.actions.length < minActions) {
        console.warn('Too few actions');
        return false;
      }
      
      return true;
    }
  }
  
  // ===== Game Functions =====
  function resetWorld() {
    // Ensure canvas is set up
    if (!canvas) {
      setupCanvas();
    }
    
    // 새 게임 세션 시작
    gameSession = new GameSession();
    console.log('New game session:', gameSession.sessionId);
    
    world.speed = world.baseSpeed;
    world.distance = 0;
    world.time = 0;
    world.shake = 0;
    
    // Reset player state
    player.x = 100;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.jumpsLeft = 2;
    player.who = CHAR.MALE;
    player.tagCooldown = 0;
    player.attackCooldown = 0;
    player.brideAmmo = BRIDE_MAGAZINE_SIZE;
    player.brideFireTimer = 0;
    player.brideReloadTimer = 0;
    player.brideIdleReloadTimer = 0;
    player.attackAnimTime = 0;
    player.attackAnimDuration = 0;
    player.jumpAnimTime = 0;
    player.animTime = 0;
    player.coyote = 0;
    player.buffer = 0;
    player.slamming = false;
    player.slamCooldown = 0;
    player.swordSwing = 0;
    player.invulnerable = 0;
    
    platforms.length = 0;
    obstacles.length = 0;
    bullets.length = 0;
    waves.length = 0;
    slashes.length = 0;
    meleeRects.length = 0;
    
    // Initial platform at bottom of screen
    const groundY = 700; // Adjusted for 3:4 aspect ratio
    platforms.push(makePlatform(-200, groundY, 'platformBuilding1'));
    
    // Place player on the first platform
    player.y = groundY - player.h - 5;
    
    console.log('World reset - Canvas:', canvas.width, 'x', canvas.height);
    console.log('Player position:', player.x, player.y);
    console.log('First platform:', platforms[0]);
    
    let cursor = platforms[0].x + platforms[0].w;
    for (let i = 0; i < 10; i++) {
      cursor = spawnPlatformCursor(cursor);
    }
    
    updateUI();
  }

  function spawnPlatformCursor(cursorX) {
    const maxGap = Math.min(200, maxHorizontalDoubleJumpDistance(world.speed) * 0.8);
    const gap = randRange(60, maxGap);
    const baseY = world.h - 150;
    const y = clamp(baseY - randRange(0, 200), world.h * 0.4, world.h - 80);
    const x = cursorX + gap;
    const platform = makePlatform(x, y);
    
    platforms.push(platform);

    // Spawn obstacles
    const slots = Math.random() < 0.4 ? 1 : 0;
    for (let i = 0; i < slots; i++) {
      const isMine = Math.random() < 0.6;
      const ox = x + randRange(30, Math.max(40, platform.w - 40));
      if (isMine) {
        obstacles.push({ x: ox, y: y - 44, w: 44, h: 44, hp: 1, type: 'mine' });
      } else {
        obstacles.push({ x: ox, y: y - DRONE_SPAWN_BASE_OFFSET - randRange(0, DRONE_SPAWN_RANDOM_OFFSET), w: 62, h: 62, hp: 1, type: 'drone' });
      }
    }
    
    return x + platform.w;
  }

  function maxHorizontalJumpDistance(scrollSpeed) {
    const t = (2 * player.jumpV) / world.gravity;
    return scrollSpeed * t;
  }

  function maxHorizontalDoubleJumpDistance(scrollSpeed) {
    return maxHorizontalJumpDistance(scrollSpeed) * 1.9;
  }

  function randRange(a, b) {
    return a + Math.random() * (b - a);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function getSpeedRatio() {
    return world.baseSpeed > 0 ? world.speed / world.baseSpeed : 1;
  }

  const justPressed = new Set();
  const justTouched = new Set();

  function handleInput(dt) {
    // Jump - Space or ArrowUp
    if (player.buffer > 0) {
      if (canJump()) {
        doJump();
        player.buffer = 0;
      } else {
        player.buffer -= dt;
      }
    }
    
    // Also check for ArrowUp directly
    if (keys.has('ArrowUp') && !justPressed.has('ArrowUp')) {
      justPressed.add('ArrowUp');
      if (canJump()) {
        doJump();
      }
    }
    
    // Attack
    if (pressedOnce('KeyJ') || touchedOnce('attack')) {
      console.log('Attack triggered!');
      if (player.who === CHAR.MALE) tryAttack();
    }
    
    // Tag
    if (pressedOnce('KeyQ') || touchedOnce('tag')) {
      console.log('Tag triggered!');
      tryTag();
    }
    
    // Slam
    if (pressedOnce('ArrowDown') || pressedOnce('KeyK') || touchedOnce('slam')) {
      console.log('Slam triggered!');
      trySlam();
    }
  }

  function pressedOnce(code) {
    if (keys.has(code) && !justPressed.has(code)) {
      justPressed.add(code);
      return true;
    }
    return false;
  }

  function touchedOnce(action) {
    if (touches.has(action) && !justTouched.has(action)) {
      justTouched.add(action);
      return true;
    }
    return false;
  }

  function lateInputFlush() {
    justPressed.clear();
    justTouched.clear();
  }

  function canJump() {
    return player.onGround || player.coyote > 0 || player.jumpsLeft > 0;
  }

  function doJump() {
    // 게임 속도에 비례한 점프력 조정
    const speedRatio = world.speed / world.baseSpeed;
    const adjustedJumpV = player.jumpV * Math.sqrt(speedRatio); // 제곱근으로 완만하게 증가
    
    if (player.onGround || player.coyote > 0) {
      player.vy = -adjustedJumpV;
      player.onGround = false;
      player.jumpsLeft = 1;
      player.coyote = 0;
      player.jumpAnimTime = 0;
      
      // 세션 기록
      if (gameSession) {
        gameSession.recordAction('jump');
      }
    } else if (player.jumpsLeft > 0) {
      player.vy = -adjustedJumpV * 0.95;
      player.jumpsLeft = 0;
      player.jumpAnimTime = 0;
      
      // 세션 기록
      if (gameSession) {
        gameSession.recordAction('double_jump');
      }
    }
  }

  function tryAttack() {
    if (player.who !== CHAR.MALE || player.attackCooldown > 0) return;
    
    // 세션 기록
    if (gameSession) {
      gameSession.recordAction('attack');
    }
    
    // 게임 속도에 비례한 공격 속도 조정
    const speedRatio = world.speed / world.baseSpeed;
    const cooldownScale = 1 / Math.sqrt(speedRatio); // 속도가 빨라지면 쿨다운 감소
    
    // Katana attack with animation
    const groomAttackDuration = clipDuration('groomAttack', ANIM_FPS.groomAttack);
    player.attackAnimTime = 0;
    player.attackAnimDuration = groomAttackDuration;
    player.swordSwing = groomAttackDuration; // Start sword swing animation
    const box = { x: player.x + player.w - 6, y: player.y - 20, w: 130, h: player.h + 60, life: 0.12 };
    meleeRects.push(box);
    slashes.push({ x: player.x + player.w + 10, y: player.y + player.h*0.25, life: 0.12, angle: -0.15, scaleX: 4, scaleY: 3 });
    slashes.push({ x: player.x + player.w + 20, y: player.y + player.h*0.70, life: 0.12, angle: 0.1, scaleX: 5, scaleY: 3 });
    player.attackCooldown = Math.max(groomAttackDuration, 0.3 * cooldownScale);
  }

  function tryTag() {
    if (player.tagCooldown > 0) return;
    
    // 세션 기록
    if (gameSession) {
      gameSession.recordAction('tag');
    }
    
    player.who = (player.who === CHAR.MALE) ? CHAR.FEMALE : CHAR.MALE;
    player.attackAnimTime = 0;
    player.attackAnimDuration = 0;
    player.jumpAnimTime = 0;
    player.tagCooldown = 0.18;
    updateUI();
  }

  function trySlam() {
    if (player.onGround || player.slamCooldown > 0) return;
    
    // 세션 기록
    if (gameSession) {
      gameSession.recordAction('slam');
    }
    
    // 게임 속도에 비례한 슬램 속도 조정
    const speedRatio = world.speed / world.baseSpeed;
    const adjustedSlamSpeed = 2000 * Math.sqrt(speedRatio);
    player.vy = Math.max(player.vy, adjustedSlamSpeed);
    player.slamming = true;
    player.slamCooldown = 0.7;
    player.invulnerable = 0.5; // 슬램 중 0.5초 무적
  }

  function updateUI() {
    const distEl = document.getElementById('gameDistance');
    
    if (distEl) distEl.textContent = Math.floor(world.distance) + 'm';
  }

  function createSlamImpact() {
    const originX = player.x + player.w * 0.5;
    const groundY = player.y + player.h;
    const hitOffsets = [-26, 0, 26];
    const brickColors = ['#f7c0b2', '#e98998', '#d46a80', '#b9576d', '#ffe0cf'];
    const crackColors = ['#7c3447', '#9a4357', '#5c2538'];
    const ridges = [];
    const particles = [];

    for (let hit = 0; hit < hitOffsets.length; hit++) {
      const hitX = hitOffsets[hit];

      for (let i = -3; i <= 3; i++) {
        const falloff = 1 - Math.min(1, Math.abs(i) / 4);
        ridges.push({
          hitX,
          offset: i * 5 + randRange(-2, 2),
          w: Math.round(randRange(3, 6)),
          h: Math.round(randRange(3, 7) * (0.7 + falloff * 0.45)),
          delay: hit * 0.018 + Math.abs(i) * 0.009,
          color: brickColors[(hit + i + brickColors.length) % brickColors.length],
          crackColor: crackColors[(hit + i + crackColors.length) % crackColors.length]
        });
      }

      for (let i = 0; i < 10; i++) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const size = Math.round(randRange(2, 5));
        particles.push({
          x: originX + hitX + randRange(-7, 7),
          y: groundY - randRange(2, 9),
          vx: side * randRange(45, 190) + hitX * 1.2,
          vy: -randRange(60, 180),
          w: size + Math.round(randRange(0, 3)),
          h: Math.max(2, size - Math.round(randRange(0, 2))),
          life: randRange(0.2, 0.38),
          maxLife: 0,
          color: brickColors[Math.floor(randRange(0, brickColors.length))],
          edgeColor: crackColors[Math.floor(randRange(0, crackColors.length))]
        });
      }
    }

    for (const p of particles) p.maxLife = p.life;

    return {
      type: 'slamImpact',
      originX,
      groundY,
      radius: 34,
      x: originX - 34,
      y: groundY - 24,
      w: 68,
      h: 30,
      life: 0.42,
      maxLife: 0.42,
      expand: 360,
      hitOffsets,
      ridges,
      particles
    };
  }

  function updateSlamImpact(wv, dt) {
    wv.life -= dt;
    wv.originX -= world.speed * dt;
    wv.radius += wv.expand * dt;
    wv.x = wv.originX - wv.radius;
    wv.y = wv.groundY - 24;
    wv.w = wv.radius * 2;
    wv.h = 30;

    for (const p of wv.particles || []) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.x += (p.vx - world.speed) * dt;
      p.y += p.vy * dt;
      p.vy += 520 * dt;
    }
  }

  function drawSlamWaveSegments(centerX, groundY, radius, height, segmentW) {
    const steps = Math.max(8, Math.floor(radius / 10));

    for (const side of [-1, 1]) {
      for (let i = 0; i < steps; i++) {
        const t = i / Math.max(1, steps - 1);
        const dist = 8 + t * radius;
        const w = Math.max(2, Math.round(segmentW * (1 - t * 0.2)));
        const h = Math.max(1, Math.round(height * (1 - t * 0.25)));
        const lift = Math.round(Math.sin(t * Math.PI) * height * 0.45);
        const x = Math.floor(centerX + side * dist - (side < 0 ? w : 0));
        const y = Math.floor(groundY - lift - h - 2);
        ctx.fillRect(x, y, w, h);
      }
    }
  }

  function drawSlamImpact(wv) {
    const age = wv.maxLife - wv.life;
    const lifeRatio = clamp(wv.life / wv.maxLife, 0, 1);
    const originX = Math.floor(wv.originX);
    const groundY = Math.floor(wv.groundY);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    ctx.globalAlpha = Math.min(0.32, lifeRatio * 0.38);
    ctx.fillStyle = '#7c3447';
    for (const hitX of wv.hitOffsets || [0]) {
      ctx.fillRect(originX + hitX - 12, groundY - 2, 24, 2);
      ctx.fillRect(originX + hitX - 3, groundY - 6, 6, 4);
    }

    for (const ridge of wv.ridges || []) {
      const t = clamp((age - ridge.delay) / 0.18, 0, 1);
      if (t <= 0 || t >= 1) continue;
      const rise = Math.sin(t * Math.PI);
      const h = Math.max(2, Math.round(ridge.h * rise));
      const x = Math.floor(wv.originX + ridge.hitX + ridge.offset - ridge.w / 2);
      const y = groundY - h - Math.round(2 * rise);
      ctx.globalAlpha = 0.62 * (1 - Math.max(0, t - 0.55) / 0.45);
      ctx.fillStyle = ridge.crackColor;
      ctx.fillRect(x - 1, y - 1, ridge.w + 2, h + 2);
      ctx.fillStyle = ridge.color;
      ctx.fillRect(x, y, ridge.w, h);
      if (h > 5) {
        ctx.fillStyle = '#ffe0cf';
        ctx.fillRect(x + 1, y + 1, Math.max(1, ridge.w - 2), 1);
      }
    }

    const dustColors = ['#ffe0cf', '#e98998', '#b9576d'];
    for (const hitX of wv.hitOffsets || [0]) {
      for (let i = 0; i < 2; i++) {
        const t = clamp((age - i * 0.07) / 0.36, 0, 1);
        if (t <= 0 || t >= 1) continue;
        const radius = 10 + i * 8 + t * (48 + i * 12);
        const height = Math.max(1, Math.round((1 - t) * (3 - i)));
        ctx.globalAlpha = (1 - t) * (0.48 - i * 0.08);
        ctx.fillStyle = '#7c3447';
        drawSlamWaveSegments(wv.originX + hitX, groundY + 1, radius, height + 1, 5);
        ctx.fillStyle = dustColors[(i + Math.abs(hitX)) % dustColors.length];
        drawSlamWaveSegments(wv.originX + hitX, groundY, radius, height, 4);
      }
    }

    for (const p of wv.particles || []) {
      if (p.life <= 0) continue;
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      const w = Math.max(2, Math.round(p.w * (0.8 + alpha * 0.2)));
      const h = Math.max(2, Math.round(p.h * (0.8 + alpha * 0.2)));
      const x = Math.floor(p.x);
      const y = Math.floor(p.y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.edgeColor;
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(x, y, w, h);
    }

    ctx.restore();
  }

  function fireBrideBullet() {
    const speedRatio = world.speed / world.baseSpeed;
    const bulletVelocity = 900 * Math.sqrt(speedRatio);
    const bulletSize = getBrideBulletSize();

    bullets.push({
      x: player.x + player.w * BRIDE_BULLET_X_FACTOR,
      y: player.y + player.h * BRIDE_BULLET_Y_FACTOR,
      w: bulletSize.w,
      h: bulletSize.h,
      vx: bulletVelocity,
      ttl: 1.6
    });

    if (gameSession) {
      gameSession.recordAction('attack');
    }
  }

  function reloadBrideGun() {
    player.brideAmmo = BRIDE_MAGAZINE_SIZE;
    player.brideFireTimer = 0;
    player.brideReloadTimer = 0;
    player.brideIdleReloadTimer = 0;
  }

  function startBrideReload() {
    if (player.brideReloadTimer > 0 || player.brideAmmo >= BRIDE_MAGAZINE_SIZE) return;

    player.brideFireTimer = 0;
    player.brideReloadTimer = BRIDE_RELOAD_TIME;
    player.brideIdleReloadTimer = 0;
  }

  function updateBrideGun(dt) {
    if (player.brideReloadTimer > 0) {
      player.brideReloadTimer = Math.max(0, player.brideReloadTimer - dt);
      if (player.brideReloadTimer <= 0) reloadBrideGun();
      return;
    }

    const holdingAttack = player.who === CHAR.FEMALE && isAttackHeld();

    if (player.brideAmmo > 0 && player.brideAmmo < BRIDE_MAGAZINE_SIZE) {
      if (holdingAttack) {
        player.brideIdleReloadTimer = 0;
      } else {
        player.brideIdleReloadTimer += dt;
        if (player.brideIdleReloadTimer >= BRIDE_IDLE_RELOAD_TIME) {
          startBrideReload();
          return;
        }
      }
    } else if (player.brideAmmo >= BRIDE_MAGAZINE_SIZE) {
      player.brideIdleReloadTimer = 0;
    }

    player.brideFireTimer = Math.max(0, player.brideFireTimer - dt);

    if (!holdingAttack) return;

    if (player.brideAmmo <= 0) {
      startBrideReload();
      return;
    }

    if (player.brideFireTimer > 0) return;

    const speedRatio = world.speed / world.baseSpeed;
    fireBrideBullet();
    player.brideAmmo--;
    player.brideIdleReloadTimer = 0;
    player.brideFireTimer = BRIDE_FIRE_CADENCE / Math.sqrt(speedRatio);

    if (player.brideAmmo <= 0) startBrideReload();
  }

  function updateCombat(dt) {
    // Update melee rectangles
    for (let i = meleeRects.length - 1; i >= 0; i--) {
      const a = meleeRects[i];
      a.life -= dt;
      
      // Check collision with obstacles
      for (let j = obstacles.length - 1; j >= 0; j--) {
        const o = obstacles[j];
        if (aabb(a, o)) o.hp = 0;
      }
      
      if (a.life <= 0) meleeRects.splice(i, 1);
    }

    // Update slashes
    for (let i = slashes.length - 1; i >= 0; i--) {
      slashes[i].life -= dt;
      if (slashes[i].life <= 0) slashes.splice(i, 1);
    }

    // Update waves
    for (let i = waves.length - 1; i >= 0; i--) {
      const wv = waves[i];
      if (wv.type === 'slamImpact') {
        updateSlamImpact(wv, dt);
      } else {
        wv.life -= dt;
        wv.x -= world.speed * dt;
        wv.w += wv.expand * dt * 2;
        wv.x -= wv.expand * dt;
      }
      
      for (let j = obstacles.length - 1; j >= 0; j--) {
        const o = obstacles[j];
        if (o.type === 'mine' && aabb(wv, o)) o.hp = 0;
      }
      
      if (wv.life <= 0) waves.splice(i, 1);
    }

    updateBrideGun(dt);

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += (b.vx - world.speed) * dt;
      b.ttl -= dt;
      
      for (let j = obstacles.length - 1; j >= 0; j--) {
        const o = obstacles[j];
        if (aabb(b, o)) {
          if (o.type === 'drone') o.hp = 0;
          b.ttl = 0;
          break;
        }
      }
      
      if (b.ttl <= 0 || b.x > world.w + 120) bullets.splice(i, 1);
    }
  }

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + (a.w || 0) > b.x && 
           a.y < b.y + b.h && a.y + (a.h || 0) > b.y;
  }

  // ===== Game Loop =====
  let lastTime = 0;
  let animationId = null;

  function stopGameLoop() {
    running = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    keys.clear();
    touches.clear();
    justPressed.clear();
    justTouched.clear();
  }

  window.stopMiniGame = stopGameLoop;

  function startGame() {
    console.log('Starting game...');
    
    // Hide screens
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (startScreen) startScreen.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    
    // Ensure canvas is set up
    if (!canvas || !ctx) {
      console.log('Canvas not ready, setting up...');
      setupCanvas();
      
      // Double check
      if (!canvas || !ctx) {
        console.error('Failed to set up canvas!');
        return;
      }
    }
    
    resetWorld();
    running = true;
    lastTime = performance.now();
    
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
    
    console.log('Game started successfully');
  }

  function gameLoop(t) {
    if (!running) return;
    
    const dt = Math.min(0.033, (t - lastTime) / 1000);
    lastTime = t;

    // Verify canvas is still valid
    if (!ctx || !canvas) {
      console.error('Canvas lost during game loop!');
      return;
    }

    handleInput(dt);

    // Update world
    world.time += dt;
    world.speed = clamp(world.baseSpeed + world.accelPerSec * world.time, world.baseSpeed, world.maxSpeed);
    const animScale = getSpeedRatio();
    player.animTime += dt * player.baseAnimRate * animScale;

    // Physics - 게임 속도에 비례한 중력 조정
    const speedRatio = world.speed / world.baseSpeed;
    const adjustedGravity = world.gravity * Math.sqrt(speedRatio); // 제곱근으로 완만하게 증가
    
    const prevY = player.y;
    player.vy += adjustedGravity * dt;
    player.y += player.vy * dt;

    // Coyote time
    if (player.onGround) {
      player.coyote = COYOTE_TIME;
    } else {
      player.coyote = Math.max(0, player.coyote - dt);
    }

    // Platform collisions
    let landedThisFrame = false;
    const prevOnGround = player.onGround;
    player.onGround = false;
    
    for (const p of platforms) {
      const xOverlap = !(player.x + player.w < p.x || player.x > p.x + p.w);
      const topY = p.y - player.h;
      const crossed = (prevY <= topY && player.y >= topY);
      
      if (xOverlap && crossed && player.vy >= 0 && (player.y - prevY) <= 120) {
        player.y = topY;
        player.vy = 0;
        player.onGround = true;
        player.jumpsLeft = 2;
        player.buffer = 0;
        landedThisFrame = !prevOnGround;
        break;
      }
      
      const feet = {x: player.x + 6, y: player.y + player.h - 4, w: player.w - 12, h: 6};
      if (player.vy >= 0 && feet.x < p.x + p.w && feet.x + feet.w > p.x) {
        if (player.y >= topY - 6 && player.y <= topY + 14) {
          player.y = topY;
          player.vy = 0;
          player.onGround = true;
          player.jumpsLeft = 2;
          player.buffer = 0;
          landedThisFrame = !prevOnGround;
          break;
        }
      }
    }

    // Slam landing
    if (landedThisFrame && player.slamming) {
      waves.push(createSlamImpact());
      world.shake = Math.min(world.shake + 12, 18);
      player.slamming = false;
      player.invulnerable = 0.3; // 착지 후 추가 무적
      
      // 슬램 착지 시 주변 지뢰 즉시 파괴
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        if (o.type === 'mine' && Math.abs(o.x - player.x) < 150) {
          o.hp = 0;
        }
      }
    }

    // Scroll world
    const dx = world.speed * dt;
    for (const p of platforms) p.x -= dx;
    for (const o of obstacles) o.x -= dx;
    for (const m of meleeRects) m.x -= dx;

    // Clean up off-screen elements
    while (platforms.length && platforms[0].x + platforms[0].w < -200) platforms.shift();
    while (obstacles.length && obstacles[0].x + obstacles[0].w < -200) obstacles.shift();

    // Spawn new platforms
    let rightMost = -1e9;
    for (const p of platforms) rightMost = Math.max(rightMost, p.x + p.w);
    while (rightMost < world.w + 300) rightMost = spawnPlatformCursor(rightMost);

    // Update cooldowns and timers
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
    player.tagCooldown = Math.max(0, player.tagCooldown - dt);
    player.slamCooldown = Math.max(0, player.slamCooldown - dt);
    player.swordSwing = Math.max(0, player.swordSwing - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);

    if (player.onGround) {
      player.jumpAnimTime = 0;
    } else {
      player.jumpAnimTime += dt * animScale;
    }

    if (player.who === CHAR.MALE) {
      if (player.attackAnimDuration > 0) {
        player.attackAnimTime += dt * animScale;
        if (player.attackAnimTime >= player.attackAnimDuration) {
          player.attackAnimTime = 0;
          player.attackAnimDuration = 0;
        }
      }
    } else if (isAttackHeld()) {
      player.attackAnimDuration = 0;
      player.attackAnimTime += dt * animScale;
    } else {
      player.attackAnimDuration = 0;
      player.attackAnimTime = 0;
    }

    // Update combat
    updateCombat(dt);

    // Remove destroyed obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].hp <= 0) obstacles.splice(i, 1);
    }

    // Check collisions with player (if not invulnerable)
    if (player.invulnerable <= 0) {
      const body = {x: player.x + 4, y: player.y + 4, w: player.w - 8, h: player.h - 8};
      for (const o of obstacles) {
        if (aabb(body, o)) {
          // 슬램 중이면 지뢰는 파괴
          if (player.slamming && o.type === 'mine') {
            o.hp = 0;
            continue;
          }
          endGame();
          return;
        }
      }
    }

    // Check if player fell
    if (player.y > world.h + 200) {
      endGame();
      return;
    }

    // Update distance with overflow prevention
    const MAX_SAFE_DISTANCE = 100000000; // 100 million meters max
    const distanceIncrement = dx / 50;
    
    // Prevent integer overflow and unrealistic values
    if (world.distance + distanceIncrement < MAX_SAFE_DISTANCE) {
      world.distance += distanceIncrement;
      
      // Record checkpoint every 1000m
      if (gameSession) {
        gameSession.recordCheckpoint();
      }
    } else {
      world.distance = MAX_SAFE_DISTANCE;
      console.warn('Maximum distance reached:', MAX_SAFE_DISTANCE);
    }

    // Render
    render(animScale);
    updateUI();

    // Camera shake decay
    world.shake = Math.max(0, world.shake - 0.9);

    lateInputFlush();
    animationId = requestAnimationFrame(gameLoop);
  }

  let highScore = 0;
  
  async function endGame() {
    running = false;
    
    // Validate and sanitize score
    let currentScore = Math.floor(world.distance);
    const MAX_VALID_SCORE = 100000000; // 100 million max
    const MIN_VALID_SCORE = 0;
    
    // Prevent negative or overflow values
    if (currentScore < MIN_VALID_SCORE || isNaN(currentScore) || !isFinite(currentScore)) {
      currentScore = 0;
      console.error('Invalid score detected:', world.distance);
    } else if (currentScore > MAX_VALID_SCORE) {
      currentScore = MAX_VALID_SCORE;
      console.warn('Score exceeded maximum:', currentScore);
    }
    
    // Validate game session
    if (gameSession && !gameSession.validate(currentScore)) {
      console.warn('Invalid game session detected');
      currentScore = 0;
    }
    
    // Check if it's a new high score
    try {
      if (window.getGameLeaderboard) {
        const scores = await window.getGameLeaderboard();
        if (scores.length > 0) {
          highScore = scores[0].score || 0;
        }
      }
    } catch (error) {
      console.error('Error fetching high score:', error);
    }
    
    const isNewRecord = currentScore > highScore;
    
    const finalScoreEl = document.getElementById('finalScore');
    const recordSubmit = document.getElementById('recordSubmit');
    const normalRestart = document.getElementById('normalRestart');
    const gameOverScreen = document.getElementById('gameOverScreen');
    
    if (finalScoreEl) {
      if (isNewRecord) {
        finalScoreEl.innerHTML = `
          <div style="color:#ffde00;font-size:16px;margin-bottom:10px;animation:blink 0.5s infinite;">
            🏆 신기록 달성! 🏆
          </div>
          거리: ${currentScore}m<br>
          최고 속도: ${Math.floor(world.speed)}
        `;
      } else {
        finalScoreEl.innerHTML = `
          거리: ${currentScore}m<br>
          최고 속도: ${Math.floor(world.speed)}<br>
          <span style="color:#888;">최고 기록: ${highScore}m</span>
        `;
      }
      
      // 항상 기록 입력 패널 표시 (점수가 0보다 클 때만)
      if (currentScore > 0) {
        if (recordSubmit) recordSubmit.style.display = 'block';
        if (normalRestart) normalRestart.style.display = 'none';
      } else {
        // 점수가 0이면 재시작 버튼만 표시
        if (recordSubmit) recordSubmit.style.display = 'none';
        if (normalRestart) normalRestart.style.display = 'block';
      }
      
      // Show game over screen
      if (gameOverScreen) gameOverScreen.style.display = 'flex';
    }
    
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  // ===== Rendering =====
  function render(animScale) {
    if (!ctx || !canvas) {
      console.error('Canvas or context not initialized');
      return;
    }
    
    const W = canvas.width;
    const H = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, W, H);
    
    // Apply camera shake
    if (world.shake > 0) {
      const sx = (Math.random() - 0.5) * world.shake;
      const sy = (Math.random() - 0.5) * world.shake;
      ctx.save();
      ctx.translate(sx, sy);
      renderScene(W, H, animScale);
      ctx.restore();
    } else {
      renderScene(W, H, animScale);
    }
  }

  function renderScene(W, H, animScale) {
    ctx.imageSmoothingEnabled = false;
    drawBackground(W, H);

    // Platform props stay behind the player.
    for (const p of platforms) {
      drawPlatformProps(p);
    }
    
    // Obstacles
    for (const o of obstacles) {
      const spr = (o.type === 'mine') ? SPR.mine : SPR.drone;
      if (sprReady(spr)) {
        ctx.drawImage(spr, o.x, o.y, o.w, o.h);
      } else {
        ctx.fillStyle = (o.type === 'mine') ? '#ff0000' : '#00ffff';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    }

    // Bullets
    for (const b of bullets) {
      if (sprReady(SPR.bullet)) ctx.drawImage(SPR.bullet, Math.floor(b.x), Math.floor(b.y), b.w, b.h);
      else { ctx.fillStyle = '#ffde00'; ctx.fillRect(b.x, b.y, b.w, b.h); }
    }

    // Waves
    for (const wv of waves) {
      if (wv.type === 'slamImpact') {
        drawSlamImpact(wv);
      } else {
        const alpha = Math.max(0, wv.life / 0.18);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(wv.x, wv.y, wv.w, wv.h);
        ctx.restore();
      }
    }

    // Slashes
    for (const s of slashes) {
      const alpha = Math.max(0, s.life / 0.12);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ff006e';
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.fillRect(0, 0, 40, 8);
      ctx.restore();
    }

    // Player
    drawPlayer(animScale);

    // Platform body is the foreground roof/building layer over the player's feet.
    for (const p of platforms) {
      drawPlatform(p);
    }
  }

  function drawBackground(W, H) {
    if (sprReady(SPR.bg)) {
      drawTiledParallaxBackgroundLayer(SPR.bg, BACKGROUND_BASE_SPEED, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2e2a56');
      g.addColorStop(1, '#96aae0');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    for (const layer of BACKGROUND_LAYERS) {
      drawTiledParallaxBackgroundLayer(SPR[layer.key], layer.speed, W, H);
    }
  }

  function getFullHeightTileSize(image, H) {
    const scale = H / assetHeight(image);
    return {
      w: Math.ceil(assetWidth(image) * scale),
      h: H,
    };
  }

  function drawTiledParallaxBackgroundLayer(image, speed, W, H) {
    if (!sprReady(image)) return;
    const tile = getFullHeightTileSize(image, H);
    if (tile.w <= 0) return;
    const scroll = (world.time * world.speed * speed) % tile.w;
    let x = -scroll;
    while (x > 0) x -= tile.w;
    while (x < W) {
      ctx.drawImage(image, Math.floor(x), 0, tile.w, tile.h);
      x += tile.w;
    }
  }

  function drawPlatform(p) {
    const building = getRenderableSprite(p.buildingKey);

    if (!building) {
      ctx.fillStyle = '#ff006e';
      ctx.fillRect(p.x, p.y, p.w, Math.max(p.h, 180));
      ctx.fillStyle = '#ff4590';
      ctx.fillRect(p.x, p.y, p.w, 4);
      return;
    }

    const drawH = Math.ceil(p.w * assetHeight(building) / assetWidth(building));
    ctx.drawImage(building, Math.floor(p.x), Math.floor(p.y), Math.ceil(p.w), drawH);
  }

  function drawPlatformProps(p) {
    if (!p.props || !p.props.length) return;
    for (const prop of p.props) {
      const sprite = getRenderableSprite(prop.key);
      if (!sprite) continue;
      const drawW = prop.w;
      const drawH = Math.ceil(drawW * assetHeight(sprite) / assetWidth(sprite));
      const x = p.x + prop.centerX - drawW / 2;
      const y = p.y - drawH + prop.yOffset;
      ctx.drawImage(sprite, Math.floor(x), Math.floor(y), Math.ceil(drawW), drawH);
    }
  }

  function drawBrideAmmoCounter(drawX, drawY) {
    const ammo = Math.max(0, player.brideAmmo);
    const countText = `x${ammo}`;
    const x = Math.max(2, Math.floor(drawX - 8));
    const y = Math.max(2, Math.floor(drawY + 4));

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.font = "12px 'Press Start 2P', monospace";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const bulletRawW = assetWidth(SPR.bullet) || BRIDE_BULLET_FALLBACK_W;
    const bulletRawH = assetHeight(SPR.bullet) || BRIDE_BULLET_FALLBACK_H;
    const iconW = 21;
    const iconH = Math.max(6, Math.round(iconW * bulletRawH / bulletRawW));
    const iconX = x;
    const iconY = y + Math.floor((12 - iconH) / 2) + 1;
    const textX = iconX + iconW + 4;
    const outline = 2;
    const outlineOffsets = [
      [-outline, 0], [outline, 0], [0, -outline], [0, outline],
      [-outline, -outline], [outline, -outline], [-outline, outline], [outline, outline],
    ];

    if (sprReady(SPR.bullet)) {
      ctx.filter = 'brightness(0)';
      for (const [ox, oy] of outlineOffsets) {
        ctx.drawImage(SPR.bullet, iconX + ox, iconY + oy, iconW, iconH);
      }
      ctx.filter = 'none';
      ctx.drawImage(SPR.bullet, iconX, iconY, iconW, iconH);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(iconX - outline, iconY - outline, iconW + outline * 2, iconH + outline * 2);
      ctx.fillStyle = '#fff3a3';
      ctx.fillRect(iconX, iconY, iconW, iconH);
    }

    ctx.fillStyle = '#000000';
    for (const [ox, oy] of outlineOffsets) {
      ctx.fillText(countText, textX + ox, y + oy);
    }
    ctx.fillStyle = ammo === 0 ? '#ff3030' : '#fff3a3';
    ctx.fillText(countText, textX, y);
    ctx.restore();
  }

  function drawPlayer(animScale) {
    const x = Math.floor(player.x);
    const y = Math.floor(player.y);
    if (player.invulnerable > 0 && Math.sin(player.invulnerable * 30) > 0) ctx.globalAlpha = 0.5;

    const isMale = player.who === CHAR.MALE;
    let key;
    let fps = ANIM_FPS.run;
    let frame = 0;
    let loop = true;

    if (isMale && player.attackAnimDuration > 0) {
      key = 'groomAttack';
      fps = ANIM_FPS.groomAttack;
      loop = false;
      frame = Math.floor(player.attackAnimTime * fps);
    } else if (!player.onGround) {
      key = isMale ? 'groomJump' : 'brideJump';
      fps = ANIM_FPS.jump;
      loop = false;
      frame = Math.floor(player.jumpAnimTime * fps);
    } else if (!isMale && isAttackHeld()) {
      key = 'brideAttack';
      fps = ANIM_FPS.brideAttack;
      frame = Math.floor(player.attackAnimTime * fps);
    } else {
      key = isMale ? 'groomRun' : 'brideRun';
      frame = Math.floor(player.animTime * fps);
    }

    const sprite = SPR[key];
    const total = spriteFrameCount(sprite);
    frame = loop ? frame % total : Math.min(frame, total - 1);

    ctx.imageSmoothingEnabled = false;
    const drawW = 96;
    const drawH = 96;
    const drawX = x + Math.floor((player.w - drawW) / 2);
    const drawY = y + player.h - drawH;

    if (!drawSpriteFrame(sprite, frame, drawX, drawY, drawW, drawH)) {
      const leg = Math.sin(player.animTime * 10) * 3 * animScale;
      ctx.fillStyle = isMale ? '#ffffff' : '#ff69b4';
      ctx.fillRect(x + 8, y + 18, 34, 34);
      ctx.fillStyle = '#fdbcb4';
      ctx.fillRect(x + 15, y + 5, 20, 18);
      ctx.fillStyle = isMale ? '#000000' : '#8b4513';
      ctx.fillRect(x + 14, y + 5, 22, 8);
      ctx.fillStyle = isMale ? '#000000' : '#fdbcb4';
      ctx.fillRect(x + 14, y + 50, 8, 10 + leg);
      ctx.fillRect(x + 28, y + 50, 8, 10 - leg);
    }
    ctx.globalAlpha = 1;

    if (!isMale) {
      drawBrideAmmoCounter(drawX, drawY);
    }
  }

  // ===== Firebase Integration =====
  async function submitScore() {
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();
    
    if (!name) {
      alert('이름을 입력해주세요!');
      return;
    }
    
    const score = Math.floor(world.distance);
    
    // 세션 검증
    if (gameSession && !gameSession.validate(score)) {
      alert('비정상적인 게임 플레이가 감지되었습니다.');
      return;
    }
    
    try {
      // Firebase 연동 (전역 함수로 정의됨)
      if (window.submitGameScore) {
        // 세션 데이터와 함께 전송
        const sessionData = gameSession ? {
          sessionId: gameSession.sessionId,
          duration: Date.now() - gameSession.startTime,
          actionCount: gameSession.actions.length,
          checkpointCount: gameSession.checkpoints.length
        } : null;
        
        await window.submitGameScore(name, score, sessionData);
        
        // 점수 등록 성공 메시지
        alert(`${name}님의 기록(${score}m)이 등록되었습니다!`);
        
        // 이름 입력란 초기화
        nameInput.value = '';
        
        // 리더보드 새로고침
        loadLeaderboard();
        
        // Close the submit panel after successful submission
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('점수 등록에 실패했습니다.');
    }
  }

  let currentLeaderboardPage = 0;
  const ITEMS_PER_PAGE = 10;
  
  async function loadLeaderboard() {
    try {
      if (window.getGameLeaderboard) {
        const scores = await window.getGameLeaderboard();
        const listEl = document.getElementById('leaderboardList');
        const fullLeaderboardEl = document.getElementById('fullLeaderboard');
        const leaderboardPagesEl = document.getElementById('leaderboardPages');
        const paginationEl = document.getElementById('leaderboardPagination');
        
        // Show top 3 in game panel
        if (listEl && scores.length > 0) {
          listEl.innerHTML = scores.slice(0, 3).map((s, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            const name = String(s.name || 'PLAYER');
            const score = Math.floor(Number(s.score) || 0);
            return `<div style="margin-bottom:4px;white-space:nowrap;">${medal} ${escapeHtml(name)} : ${score}m</div>`;
          }).join('');
        } else if (listEl) {
          listEl.innerHTML = 'No scores yet';
        }
        
        // Show full leaderboard with pagination for all scores
        if (scores.length > 0 && fullLeaderboardEl && leaderboardPagesEl && paginationEl) {
          fullLeaderboardEl.style.display = 'block';
          
          // Calculate pagination for ALL scores
          const totalPages = Math.ceil(scores.length / ITEMS_PER_PAGE);
          const startIdx = currentLeaderboardPage * ITEMS_PER_PAGE;
          const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, scores.length);
          const pageScores = scores.slice(startIdx, endIdx);
          
          // Display current page scores
          leaderboardPagesEl.innerHTML = pageScores.map((s, i) => {
            const rank = startIdx + i + 1;
            let rankDisplay = '';
            if (rank === 1) rankDisplay = '🥇 #1';
            else if (rank === 2) rankDisplay = '🥈 #2';
            else if (rank === 3) rankDisplay = '🥉 #3';
            else rankDisplay = `#${rank}`;
            
            return `
              <div style="
                padding: 8px;
                background: ${rank <= 3 ? 'rgba(255,0,110,0.2)' : 'rgba(10,10,20,0.8)'};
                border: 2px solid ${rank <= 3 ? '#ffde00' : '#ff006e'};
                color: #ffde00;
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
                line-height: 1.5;
              ">
                ${rankDisplay} ${s.name}: ${s.score}m
              </div>
            `;
          }).join('');
          
          // Create prev/next pagination controls
          paginationEl.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: nowrap;">
              <button id="prevPageBtn" style="
                padding: 6px 10px;
                background: #ff006e;
                border: 2px solid #ffde00;
                color: white;
                font-family: 'Press Start 2P', monospace;
                font-size: 8px;
                cursor: pointer;
                white-space: nowrap;
                min-width: 60px;
                ${currentLeaderboardPage === 0 ? 'opacity: 0.3; cursor: not-allowed;' : ''}
              " ${currentLeaderboardPage === 0 ? 'disabled' : ''}>
                ◀
              </button>
              
              <span style="
                color: #ffde00;
                font-family: 'Press Start 2P', monospace;
                font-size: 8px;
                white-space: nowrap;
                text-align: center;
                min-width: 80px;
              ">
                ${currentLeaderboardPage + 1}/${totalPages}
              </span>
              
              <button id="nextPageBtn" style="
                padding: 6px 10px;
                background: #ff006e;
                border: 2px solid #ffde00;
                color: white;
                font-family: 'Press Start 2P', monospace;
                font-size: 8px;
                cursor: pointer;
                white-space: nowrap;
                min-width: 60px;
                ${currentLeaderboardPage === totalPages - 1 ? 'opacity: 0.3; cursor: not-allowed;' : ''}
              " ${currentLeaderboardPage === totalPages - 1 ? 'disabled' : ''}>
                ▶
              </button>
            </div>
          `;
          
          // Add event listeners
          const prevBtn = paginationEl.querySelector('#prevPageBtn');
          const nextBtn = paginationEl.querySelector('#nextPageBtn');
          
          if (prevBtn && !prevBtn.disabled) {
            prevBtn.onclick = () => {
              if (currentLeaderboardPage > 0) {
                currentLeaderboardPage--;
                loadLeaderboard();
              }
            };
          }
          
          if (nextBtn && !nextBtn.disabled) {
            nextBtn.onclick = () => {
              if (currentLeaderboardPage < totalPages - 1) {
                currentLeaderboardPage++;
                loadLeaderboard();
              }
            };
          }
        } else if (fullLeaderboardEl) {
          fullLeaderboardEl.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[ch]);
  }

  // Load leaderboard on init
  setTimeout(() => {
    console.log('Loading initial leaderboard...');
    loadLeaderboard();
  }, 1000);
})();
