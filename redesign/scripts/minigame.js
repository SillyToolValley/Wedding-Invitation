// ===== Wedding Runner Mini Game =====
(() => {
  let gameContainer = null;
  let canvas = null;
  let ctx = null;

  const ASSET_BASE = window.location.pathname.includes('/redesign/')
    ? '../assets/pixel/game/'
    : 'assets/pixel/game/';
  const SWEETHOPE_ASSET_BASE = window.location.pathname.includes('/redesign/')
    ? '../assets/pixel/sweethope/game/'
    : 'assets/pixel/sweethope/game/';
  const SWEETHOPE_ASSET_VERSION = 'sweethope-moon-texture-v8';
  const GROOM_SLASH_ASSET_VERSION = 'groom-slash-v20260610';
  const LEADERBOARD_CLOSED_MESSAGE = '정규 시즌이 종료되었습니다.';
  const LEADERBOARD_SUBMISSIONS_OPEN = false;
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
    groomSlash: `../groom-slash.png?v=${GROOM_SLASH_ASSET_VERSION}`,
    brideIdle: 'Bride/Idle.png',
    brideRun: 'Bride/Run.png',
    brideJump: 'Bride/Jump.png',
    brideAttack: 'Bride/Attack.png',
    brideDie: 'Bride/Die.png',
  };
  const KEYED_SPR = {};
  const SHADED_SPR = {};
  let OUTLINED_BULLET_SPR = null;
  const FRAME_W = 96;
  const FRAME_H = 96;
  const ANIM_FPS = {
    run: 10,
    jump: 12,
    brideAttack: 10,
    groomAttack: 24,
    die: 12,
  };
  const GROOM_ATTACK_HIT_FRAME = 2;
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
  const ENEMY_SHADER_SPRITES = new Set(['mine', 'drone']);
  const DRONE_HIT_CIRCLE_RADIUS_SCALE = 0.12;
  const MINE_HIT_CIRCLE_RADIUS_SCALE = 0.08;
  const SWEETHOPE_SHADER_PALETTE = {
    ink: [15, 22, 44],
    navy: [23, 32, 60],
    deepBlue: [45, 66, 107],
    plum: [97, 94, 133],
    lavender: [156, 141, 194],
    pink: [217, 163, 205],
    peach: [235, 195, 167],
    orange: [215, 102, 41],
    glow: [255, 244, 224],
    mist: [224, 224, 220],
    sky: [144, 180, 222],
    blue: [113, 127, 176],
  };
  const BACKGROUND_LAYERS = [
    { key: 'bgMoon', speed: 0.006 },
    { key: 'bgStars', speed: 0.01 },
    { key: 'bgCloud2', speed: 0.018 },
    { key: 'bgCloud1', speed: 0.03 },
  ];
  const BACKGROUND_BASE_SPEED = 0.003;
  const DRONE_SPAWN_BASE_OFFSET = 60;
  const DRONE_SPAWN_RANDOM_OFFSET = 34;
  const BRIDE_BULLET_FALLBACK_W = 18;
  const BRIDE_BULLET_FALLBACK_H = 5;
  const BRIDE_BULLET_X_FACTOR = 0.9;
  const BRIDE_BULLET_Y_FACTOR = 0.50;
  const BRIDE_MAGAZINE_SIZE = 10;
  const BRIDE_FIRE_CADENCE = 0.06;
  const BRIDE_RELOAD_TIME = 0.5;
  const BRIDE_IDLE_RELOAD_TIME = 2.0;
  const HIT_SLOW_DURATION = 0.28;
  const HIT_SLOW_SCALE = 0.34;
  const HIT_FREEZE_DURATION = 0.035;
  const HIT_FREEZE_SCALE = 0.06;
  const SLASH_HIT_SLOW_PADDING = 0.04;
  const SLASH_HIT_SLOW_MAX = 0.85;
  const HIT_FOCUS_DURATION = 0.24;
  const HIT_FOCUS_MAX_DURATION = 0.36;
  const HIT_FOCUS_DIM_ALPHA = 0.16;
  const HIT_FOCUS_ZOOM = 0.022;
  const IMPACT_FLASH_LIFE = 0.20;
  const ENEMY_EXPLOSION_LIFE = 0.42;
  const ENEMY_EXPLOSION_SMOKE_LIFE = 0.54;
  const MUZZLE_FLASH_LIFE = 0.08;
  const BRIDE_RECOIL_TIME = 0.11;
  const SFX_VOLUME = 0.18;
  const DEATH_MIN_DURATION = 1.15;
  const DEATH_POP_VY = 430;
  const DEATH_KNOCKBACK_VX = 185;
  const DEATH_KNOCKBACK_DRAG = 1.35;
  const DEATH_CAMERA_FOLLOW_DAMPING = 8.0;
  const DEATH_CAMERA_MAX_X = 150;
  const BGM_MASTER_VOLUME = 0.045;
  const BGM_BEAT_SECONDS = 0.32;
  const BGM_SCORE_EVENTS = [
    [0.33, 0.33, [60]], [0.33, 0.33, [60]], [0.34, 0.34, [60]],
    [3.00, 3.00, [60]], [0.33, 0.33, [60]], [0.33, 0.33, [60]],
    [0.34, 0.34, [60]], [3.00, 3.00, [60]], [0.33, 0.33, [60]],
    [0.33, 0.33, [60]], [0.34, 0.34, [60]], [1.00, 1.00, [60, 64]],
    [0.33, 0.33, [60, 64]], [0.33, 0.33, [60, 64]], [0.34, 0.34, [60, 64]],
    [1.00, 1.00, [60, 64]], [0.33, 0.33, [60, 64]], [0.33, 0.33, [60, 64]],
    [0.34, 0.34, [60, 64]], [1.00, 1.00, [60, 64, 67]], [0.33, 0.33, [60, 64, 67]],
    [0.33, 0.33, [60, 64, 67]], [0.34, 0.34, [60, 64, 67]], [1.00, 1.00, [60, 64, 67]],
    [1.00, 1.00, [60, 64, 67]], [2.00, 2.00, [45, 57, 76, 78, 84]], [1.50, 2.00, [47, 59, 75, 78, 83]],
    [0.50, 0.50, [71, 75, 78]], [1.00, 1.00, [40, 52, 71, 78, 81]], [1.00, 1.00, [40, 52, 71, 76, 79]],
    [1.00, 1.00, [41, 53, 69, 74, 77]], [1.00, 1.00, [41, 53, 65, 69, 74]], [0.18, 2.00, [43, 55, 72]],
    [0.17, 0.14, [74]], [0.17, 0.14, [72]], [0.16, 0.13, [74]],
    [0.16, 0.13, [72]], [0.16, 0.12, [74]], [0.16, 0.12, [72]],
    [0.16, 0.12, [74]], [0.16, 0.12, [72]], [0.17, 0.13, [74]],
    [0.17, 0.13, [72]], [0.09, 0.18, [71]], [0.09, 0.09, [72]],
    [1.00, 1.00, [43, 55, 65, 67, 74]], [0.75, 1.00, [43, 55, 67]], [0.25, 0.25, [74]],
    [1.00, 1.00, [48, 60, 67, 72, 76]], [0.50, 0.50, [60]], [0.50, 0.50, [64]],
    [0.50, 0.50, [67]], [0.50, 0.50, [72]], [0.50, 0.50, [76]],
    [0.50, 0.50, [79]], [2.00, 2.00, [45, 57, 76, 78, 84]], [1.50, 2.00, [47, 59, 75, 78, 83]],
    [0.50, 0.50, [71, 75, 78]], [1.00, 2.00, [40, 52, 71, 78, 81]], [1.00, 1.00, [71, 76, 79]],
    [1.00, 2.00, [41, 53, 69, 74, 77]], [1.00, 1.00, [65, 69, 74]], [0.18, 2.00, [43, 55, 72]],
    [0.17, 0.14, [74]], [0.17, 0.14, [72]], [0.16, 0.13, [74]],
    [0.16, 0.13, [72]], [0.16, 0.12, [74]], [0.16, 0.12, [72]],
    [0.16, 0.12, [74]], [0.16, 0.12, [72]], [0.17, 0.13, [74]],
    [0.17, 0.13, [72]], [0.18, 0.18, [71]], [1.00, 1.00, [43, 67, 72, 76]],
    [0.75, 1.00, [55, 67, 71, 74]], [0.25, 0.25, [76]], [2.00, 2.00, [43, 67, 71, 74]],
    [1.00, 1.00, [48, 64, 67, 72]], [0.33, 0.33, [60]], [0.33, 0.33, [60]],
    [1.34, 0.34, [60]], [0.33, 0.33, [60]], [0.33, 0.33, [64]],
    [0.34, 0.34, [67]], [1.00, 1.00, [72]], [0.33, 0.33, [60]],
    [0.33, 0.33, [60]], [0.34, 0.34, [60]], [1.00, 2.00, [60]],
    [0.33, 0.33, [64]], [0.33, 0.33, [67]], [0.34, 0.34, [72]],
    [1.00, 1.00, [76]], [0.33, 0.33, [60]], [0.33, 0.33, [60]],
    [0.34, 0.34, [60]], [1.00, 1.00, [60]], [0.33, 1.00, [60, 64]],
    [0.33, 0.33, [67]], [0.34, 0.34, [72]], [1.00, 1.00, [60, 76]],
    [0.33, 1.00, [60, 67]], [0.33, 0.33, [72]], [0.34, 0.34, [76]],
    [1.00, 1.00, [60, 64, 79]], [0.33, 1.00, [60, 64, 67]], [0.33, 0.33, [72]],
    [0.34, 0.34, [76]], [1.00, 1.00, [60, 64, 79]], [0.33, 1.00, [60, 64, 72]],
    [0.33, 0.33, [76]], [0.34, 0.34, [79]], [2.00, 2.00, [45, 57, 76, 78, 84]],
    [1.50, 2.00, [47, 59, 75, 78, 83]], [0.50, 0.50, [71, 75, 78]], [1.00, 1.00, [40, 52, 71, 78, 81]],
    [1.00, 1.00, [40, 52, 71, 76, 79]], [1.00, 1.00, [41, 53, 69, 74, 77]], [1.00, 1.00, [41, 53, 65, 69, 74]],
    [0.18, 2.00, [43, 55, 72]], [0.17, 0.14, [74]], [0.17, 0.14, [72]],
    [0.16, 0.13, [74]], [0.16, 0.13, [72]], [0.16, 0.12, [74]],
    [0.16, 0.12, [72]], [0.16, 0.12, [74]], [0.16, 0.12, [72]],
    [0.17, 0.13, [74]], [0.17, 0.13, [72]], [0.10, 0.18, [71]],
    [0.08, 0.08, [72]], [1.00, 1.00, [43, 55, 65, 67, 74]], [0.75, 1.00, [43, 55, 67]],
    [0.25, 0.25, [74]], [1.00, 1.00, [48, 60, 67, 72, 76]], [0.50, 0.50, [60]],
    [0.50, 0.50, [64]], [0.50, 0.50, [67]], [0.50, 0.50, [72]],
    [0.50, 0.50, [76]], [0.50, 0.50, [79]], [2.00, 2.00, [45, 57, 76, 78, 84]],
    [1.50, 2.00, [47, 59, 75, 78, 83]], [0.50, 0.50, [71, 75, 78]], [1.00, 2.00, [40, 52, 71, 78, 81]],
    [1.00, 1.00, [71, 76, 79]], [1.00, 2.00, [41, 53, 69, 74, 77]], [1.00, 1.00, [65, 69, 74]],
    [0.18, 2.00, [43, 55, 72]], [0.17, 0.14, [74]], [0.17, 0.14, [72]],
    [0.16, 0.13, [74]], [0.16, 0.13, [72]], [0.16, 0.12, [74]],
    [0.16, 0.12, [72]], [0.16, 0.12, [74]], [0.16, 0.12, [72]],
    [0.17, 0.13, [74]], [0.17, 0.13, [72]], [0.00, 0.00, [74]],
    [0.18, 0.18, [71]], [1.00, 1.00, [43, 67, 72, 76]], [0.75, 1.00, [55, 67, 71, 74]],
    [0.25, 0.25, [76]], [2.00, 2.00, [43, 67, 71, 74]], [2.00, 1.00, [48, 64, 67, 72]],
    [2.00, 2.00, [48, 60, 64, 67, 72]], [1.50, 2.00, [48, 60, 64, 67, 72]], [0.50, 0.50, [64, 67, 72]],
    [1.00, 3.00, [43, 55, 67, 72, 76]], [1.00, 1.00, [65, 71, 74]], [1.00, 1.00, [62, 65, 71]],
    [1.00, 1.00, [55, 62, 65, 67]], [1.00, 1.50, [48, 60, 64, 67]], [0.50, 1.00, [48]],
    [0.50, 0.50, [64, 67, 72]], [1.00, 1.50, [52, 64, 67, 72]], [0.50, 1.00, [48]],
    [0.50, 0.50, [64, 67, 72]], [1.00, 3.00, [43, 55, 67, 72, 76]], [1.00, 1.00, [65, 71, 74]],
    [1.00, 1.00, [62, 65, 71]], [1.00, 1.00, [55, 62, 65, 67]], [1.00, 1.50, [48, 60, 64, 67]],
    [0.50, 1.00, [55]], [0.50, 0.50, [67, 72, 76]], [1.00, 1.50, [52, 67, 72, 76]],
    [0.50, 1.00, [48]], [0.50, 0.50, [72, 76, 79]], [2.00, 2.00, [41, 53, 69, 76, 79]],
    [1.00, 2.00, [41, 53, 69, 74, 77]], [1.00, 1.00, [69, 72, 76]], [1.00, 2.00, [41, 53, 69, 72, 74]],
    [0.75, 0.75, [69, 73]], [0.25, 0.25, [76]], [1.00, 2.00, [42, 54, 69, 72, 74]],
    [0.75, 0.75, [62, 66, 69]], [0.25, 0.25, [72]], [1.00, 1.00, [43, 55, 62, 67, 71]],
    [1.00, 1.00, [55, 67, 79]], [1.00, 1.00, [55, 69, 81]], [1.00, 1.00, [55, 71, 83]],
    [2.00, 2.00, [45, 57, 76, 78, 84]], [1.50, 2.00, [47, 59, 75, 78, 83]], [0.50, 0.50, [71, 75, 78]],
    [1.00, 1.00, [40, 52, 71, 78, 81]], [1.00, 1.00, [40, 52, 71, 76, 79]], [1.00, 1.00, [41, 53, 69, 74, 77]],
    [1.00, 1.00, [41, 53, 65, 69, 74]], [0.18, 2.00, [43, 55, 72]], [0.18, 0.14, [74]],
    [0.17, 0.14, [72]], [0.17, 0.14, [74]], [0.16, 0.13, [72]],
    [0.16, 0.13, [74]], [0.16, 0.12, [72]], [0.16, 0.12, [74]],
    [0.17, 0.13, [72]], [0.17, 0.13, [74]], [0.12, 0.12, [72]],
    [0.11, 0.19, [71]], [0.09, 0.09, [72]], [1.00, 1.00, [43, 55, 65, 67, 74]],
    [0.75, 1.00, [43, 55, 67]], [0.25, 0.25, [74]], [1.00, 1.00, [48, 60, 67, 72, 76]],
    [0.50, 0.50, [60]], [0.50, 0.50, [64]], [0.50, 0.50, [67]],
    [0.50, 0.50, [72]], [0.50, 0.50, [76]], [0.50, 0.50, [79]],
    [2.00, 2.00, [45, 57, 76, 78, 84]], [1.50, 2.00, [47, 59, 75, 78, 83]], [0.50, 0.50, [71, 75, 78]],
    [1.00, 2.00, [40, 52, 71, 78, 81]], [1.00, 1.00, [71, 76, 79]], [1.00, 2.00, [41, 53, 69, 74, 77]],
    [1.00, 1.00, [65, 69, 74]], [0.18, 2.00, [43, 55, 72]], [0.17, 0.14, [74]],
    [0.17, 0.14, [72]], [0.16, 0.13, [74]], [0.16, 0.13, [72]],
    [0.16, 0.12, [74]], [0.16, 0.12, [72]], [0.16, 0.12, [74]],
    [0.16, 0.12, [72]], [0.17, 0.13, [74]], [0.17, 0.13, [72]],
    [0.00, 0.00, [74]], [0.18, 0.18, [71]], [1.00, 1.00, [43, 67, 72, 76]],
    [0.75, 1.00, [55, 67, 71, 74]], [0.25, 0.25, [76]], [2.00, 2.00, [43, 67, 71, 74]],
    [1.00, 1.00, [48, 64, 67, 72]], [0.33, 0.33, [60]], [0.33, 0.33, [60]],
    [1.34, 0.34, [60]], [0.33, 0.33, [60]], [0.33, 0.33, [64]],
    [0.34, 0.34, [67]], [1.00, 1.00, [72]], [0.33, 0.33, [60]],
    [0.33, 0.33, [60]], [0.34, 0.34, [60]], [1.00, 2.00, [60]],
    [0.33, 0.33, [64]], [0.33, 0.33, [67]], [0.34, 0.34, [72]],
    [1.00, 1.00, [76]], [0.33, 0.33, [60]], [0.33, 0.33, [60]],
    [0.34, 0.34, [60]], [1.00, 1.00, [60]], [0.33, 1.00, [60, 64]],
    [0.33, 0.33, [67]], [0.34, 0.34, [72]], [1.00, 1.00, [60, 76]],
    [0.33, 1.00, [60, 67]], [0.33, 0.33, [72]], [0.34, 0.34, [76]],
    [1.00, 1.00, [60, 64, 79]], [0.33, 1.00, [60, 64, 67]], [0.33, 0.33, [72]],
    [0.34, 0.34, [76]], [1.00, 1.00, [60, 64, 79]], [0.33, 1.00, [60, 64, 72]],
    [0.33, 0.33, [76]], [0.34, 0.34, [79]], [2.00, 2.00, [45, 57, 76, 78, 84]],
    [1.50, 2.00, [47, 59, 75, 78, 83]], [0.50, 0.50, [71, 75, 78]], [1.00, 1.00, [40, 52, 71, 78, 81]],
    [1.00, 1.00, [40, 52, 71, 76, 79]], [1.00, 1.00, [41, 53, 69, 74, 77]], [1.00, 1.00, [41, 53, 65, 69, 74]],
    [0.18, 2.00, [43, 55, 72]], [0.17, 0.14, [74]], [0.17, 0.14, [72]],
    [0.16, 0.13, [74]], [0.16, 0.13, [72]], [0.16, 0.12, [74]],
    [0.16, 0.12, [72]], [0.16, 0.12, [74]], [0.16, 0.12, [72]],
    [0.17, 0.13, [74]], [0.14, 0.13, [72]], [0.11, 0.21, [71]],
    [0.11, 0.11, [72]], [1.00, 1.00, [43, 55, 65, 67, 74]], [0.75, 1.00, [43, 55, 67]],
    [0.25, 0.25, [74]], [1.00, 1.00, [48, 60, 67, 72, 76]], [0.50, 0.50, [60]],
    [0.50, 0.50, [64]], [0.50, 0.50, [67]], [0.50, 0.50, [72]],
    [0.50, 0.50, [76]], [0.50, 0.50, [79]], [2.00, 2.00, [45, 57, 76, 78, 84]],
    [1.50, 2.00, [47, 59, 75, 78, 83]], [0.50, 0.50, [71, 75, 78]], [1.00, 2.00, [40, 52, 71, 78, 81]],
    [1.00, 1.00, [71, 76, 79]], [1.00, 2.00, [41, 53, 69, 74, 77]], [1.00, 1.00, [65, 69, 74]],
    [0.18, 2.00, [43, 55, 72]], [0.17, 0.14, [74]], [0.17, 0.14, [72]],
    [0.16, 0.13, [74]], [0.16, 0.13, [72]], [0.16, 0.12, [74]],
    [0.16, 0.12, [72]], [0.16, 0.12, [74]], [0.16, 0.12, [72]],
    [0.17, 0.13, [74]], [0.16, 0.13, [72]], [0.20, 0.20, [71]],
    [1.00, 1.00, [43, 67, 72, 76]], [0.75, 1.00, [55, 67, 71, 74]], [0.25, 0.25, [76]],
    [2.00, 2.00, [43, 67, 71, 74]], [5.00, 3.00, [48, 64, 67, 72]],
  ];
  // Score-symbol order from the supplied pages:
  // p170: opening fanfare, then repeat with 1st ending and 2nd ending.
  // p171: both 1st/2nd ending brackets are unfolded in play order.
  // p172-p174: through-composed middle/return passages.
  // p175: final repeat-start/repeat-end passage, then the closing cadence.
  const BGM_SCORE_ORDER = [
    ['p170_opening_fanfare', 0, 25],
    ['p170_repeat_1st_ending', 25, 55],
    ['p170_repeat_2nd_ending', 55, 79],
    ['p171_repeat_1st_ending', 79, 143],
    ['p171_repeat_2nd_ending', 143, 168],
    ['p172_middle_section', 168, 204],
    ['p173_return_repeat_1st_ending', 204, 254],
    ['p174_return_repeat_2nd_ending', 254, 323],
    ['p175_final_repeat', 323, 346],
    ['p175_closing_cadence', 346, 347],
  ];
  const BGM_EVENTS = BGM_SCORE_ORDER.flatMap(([, start, end]) => BGM_SCORE_EVENTS.slice(start, end));

  Object.entries(SPRITE_FILES).forEach(([key, path]) => {
    const im = new Image();
    const useSweethope = isSweethopeSprite(path);
    const isDirectAssetUrl = path.startsWith('/') || path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:');
    im.src = isDirectAssetUrl ? path : (useSweethope ? SWEETHOPE_ASSET_BASE : ASSET_BASE) + path
      + (useSweethope ? `?v=${SWEETHOPE_ASSET_VERSION}` : '');
    SPR[key] = im;
  });

  function isSweethopeSprite(path) {
    return path.startsWith('Background/')
      || path.startsWith('Platform/')
      || path.startsWith('PlatformProps/')
      || path.startsWith('Enemy/')
      || path.startsWith('Groom/')
      || path.startsWith('Bride/');
  }

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

  function getEnemySprite(key) {
    const source = SPR[key];
    if (!sprReady(source)) return null;
    if (!ENEMY_SHADER_SPRITES.has(key)) return source;
    if (!SHADED_SPR[key]) SHADED_SPR[key] = createSweethopeEnemyCanvas(source);
    return SHADED_SPR[key];
  }

  function getBulletSprite() {
    const source = SPR.bullet;
    if (!sprReady(source)) return null;
    if (!OUTLINED_BULLET_SPR) {
      OUTLINED_BULLET_SPR = createOutlinedBulletCanvas(source);
    }
    return OUTLINED_BULLET_SPR;
  }

  function createOutlinedBulletCanvas(image) {
    const sourceW = assetWidth(image);
    const sourceH = assetHeight(image);
    const pad = 2;
    const w = sourceW + pad * 2;
    const h = sourceH + pad * 2;
    const canvasEl = document.createElement('canvas');
    canvasEl.width = w;
    canvasEl.height = h;
    const c = canvasEl.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(image, pad, pad, sourceW, sourceH);

    let imageData;
    try {
      imageData = c.getImageData(0, 0, w, h);
    } catch (e) {
      return image;
    }

    const data = imageData.data;
    const originalAlpha = new Uint8Array(w * h);
    for (let i = 0; i < originalAlpha.length; i++) {
      originalAlpha[i] = data[i * 4 + 3];
    }

    const outline = SWEETHOPE_SHADER_PALETTE.glow;
    for (let i = 0; i < originalAlpha.length; i++) {
      if (!originalAlpha[i]) continue;
      const x = i % w;
      const y = (i - x) / w;
      for (let dy = -pad; dy <= pad; dy++) {
        for (let dx = -pad; dx <= pad; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const ni = ny * w + nx;
          if (originalAlpha[ni]) continue;
          const no = ni * 4;
          data[no] = outline[0];
          data[no + 1] = outline[1];
          data[no + 2] = outline[2];
          data[no + 3] = 255;
        }
      }
    }

    c.putImageData(imageData, 0, 0);
    return canvasEl;
  }

  function drawBulletSpriteAt(x, y, w, h) {
    const bulletSprite = getBulletSprite();
    if (!sprReady(bulletSprite)) return false;
    const rawW = assetWidth(SPR.bullet) || BRIDE_BULLET_FALLBACK_W;
    const rawH = assetHeight(SPR.bullet) || BRIDE_BULLET_FALLBACK_H;
    const drawW = Math.ceil(w * assetWidth(bulletSprite) / rawW);
    const drawH = Math.ceil(h * assetHeight(bulletSprite) / rawH);
    const drawX = Math.floor(x - (drawW - w) / 2);
    const drawY = Math.floor(y - (drawH - h) / 2);
    ctx.drawImage(bulletSprite, drawX, drawY, drawW, drawH);
    return true;
  }

  let audioCtx = null;
  let bgmGain = null;
  let bgmTimer = null;
  let bgmStep = 0;
  let bgmBeat = 0;
  let bgmPlaying = false;

  function getAudioContext() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!audioCtx) audioCtx = new AudioContextCtor();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function playTone(freq, duration, type, volume, endFreq = freq, delay = 0) {
    const ac = getAudioContext();
    if (!ac) return;

    const now = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * SFX_VOLUME), now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playNoise(duration, volume, frequency, delay = 0) {
    const ac = getAudioContext();
    if (!ac) return;

    const length = Math.max(1, Math.floor(ac.sampleRate * duration));
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const now = ac.currentTime + delay;
    const source = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency, now);
    filter.Q.setValueAtTime(1.8, now);
    gain.gain.setValueAtTime(volume * SFX_VOLUME, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(ac.destination);
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  function playSfx(name) {
    if (name === 'shoot') {
      playTone(1040, 0.045, 'square', 0.45, 520);
      playNoise(0.035, 0.16, 3200);
    } else if (name === 'slash') {
      playNoise(0.10, 0.30, 1800);
      playTone(420, 0.065, 'sawtooth', 0.28, 820);
    } else if (name === 'slashHit') {
      playTone(190, 0.085, 'square', 0.56, 90);
      playTone(960, 0.055, 'triangle', 0.34, 1460);
      playNoise(0.075, 0.36, 1400);
    } else if (name === 'bulletHit') {
      playTone(680, 0.055, 'square', 0.38, 280);
      playNoise(0.065, 0.30, 2600);
    } else if (name === 'slamStart') {
      playTone(180, 0.09, 'sawtooth', 0.15, 90);
    } else if (name === 'slamLand') {
      playTone(90, 0.12, 'square', 0.24, 50);
      playNoise(0.08, 0.18, 420);
    } else if (name === 'slamHit') {
      playTone(70, 0.16, 'square', 0.50, 34);
      playTone(520, 0.05, 'triangle', 0.26, 940, 0.015);
      playNoise(0.12, 0.36, 520);
    }
  }

  function midiToFreq(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  function getBgmGain(ac) {
    if (!bgmGain) {
      bgmGain = ac.createGain();
      bgmGain.gain.value = 0.0001;
      bgmGain.connect(ac.destination);
    }

    return bgmGain;
  }

  function playBgmTone(note, start, duration, type, volume, endNote = note) {
    const ac = getAudioContext();
    if (!ac || note == null) return;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const endFreq = midiToFreq(endNote);
    osc.type = type;
    osc.frequency.setValueAtTime(midiToFreq(note), start);
    if (endNote !== note) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(getBgmGain(ac));
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function playBgmNoise(start, duration, volume, frequency) {
    const ac = getAudioContext();
    if (!ac) return;

    const length = Math.max(1, Math.floor(ac.sampleRate * duration));
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const source = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(getBgmGain(ac));
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  function playBgmStep(step, beat) {
    const ac = getAudioContext();
    if (!ac) return;

    const start = ac.currentTime + 0.018;
    const event = BGM_EVENTS[step % BGM_EVENTS.length];
    const [nextBeats, durationBeats, notes] = event;
    const maxNote = Math.max(...notes);
    const held = durationBeats > nextBeats * 1.5;
    const chordScale = Math.max(0.62, 1 - Math.max(0, notes.length - 3) * 0.08);
    const duration = BGM_BEAT_SECONDS * (held ? durationBeats * 0.92 : Math.min(durationBeats * 0.92, nextBeats * 0.86));

    notes.forEach((note) => {
      const isBass = note < 60;
      const isLead = note === maxNote && note >= 60;
      const type = isBass ? 'triangle' : (isLead ? 'square' : 'triangle');
      const volume = (isBass ? 0.16 : (isLead ? 0.34 : 0.065)) * chordScale;
      playBgmTone(note, start, Math.max(0.04, duration), type, volume);
    });

    if (notes.length === 1 && maxNote >= 60 && maxNote < 72) {
      playBgmTone(maxNote + 12, start + 0.008, Math.max(0.04, duration * 0.70), 'triangle', 0.055);
    } else if (maxNote >= 72 && maxNote < 82) {
      playBgmTone(maxNote + 12, start + 0.008, Math.min(Math.max(0.04, duration * 0.62), BGM_BEAT_SECONDS * 0.48), 'triangle', 0.045);
    }

    const beatInBar = ((beat % 4) + 4) % 4;
    const downBeat = beatInBar < 0.07 || beatInBar > 3.93;
    const backBeat = Math.abs(beatInBar - 2) < 0.07;
    const quarterBeat = Math.abs(beatInBar - Math.round(beatInBar)) < 0.07;
    if (downBeat) {
      playBgmTone(36, start, 0.055, 'square', 0.14, 30);
    } else if (backBeat) {
      playBgmNoise(start, 0.045, 0.045, 2400);
    } else if (quarterBeat) {
      playBgmNoise(start, 0.022, 0.018, 3600);
    }
  }

  function scheduleBgmStep() {
    if (!bgmPlaying) return;

    const event = BGM_EVENTS[bgmStep % BGM_EVENTS.length];
    const nextBeats = Math.max(0.08, event[0]);
    playBgmStep(bgmStep, bgmBeat);
    bgmStep = (bgmStep + 1) % BGM_EVENTS.length;
    bgmBeat += nextBeats;
    bgmTimer = window.setTimeout(scheduleBgmStep, nextBeats * BGM_BEAT_SECONDS * 1000);
  }

  function startBgm() {
    const ac = getAudioContext();
    if (!ac) return;

    if (bgmTimer) {
      window.clearTimeout(bgmTimer);
      bgmTimer = null;
    }

    bgmPlaying = true;
    bgmStep = 0;
    bgmBeat = 0;
    const gain = getBgmGain(ac);
    gain.gain.cancelScheduledValues(ac.currentTime);
    gain.gain.setTargetAtTime(BGM_MASTER_VOLUME, ac.currentTime, 0.45);
    scheduleBgmStep();
  }

  function fadeBgmTo(volume, fade = 0.25) {
    const ac = audioCtx;
    if (!ac || !bgmGain) return;

    bgmGain.gain.cancelScheduledValues(ac.currentTime);
    bgmGain.gain.setTargetAtTime(Math.max(0.0001, volume), ac.currentTime, fade);
  }

  function stopBgm(fade = 0.35) {
    bgmPlaying = false;
    if (bgmTimer) {
      window.clearTimeout(bgmTimer);
      bgmTimer = null;
    }
    fadeBgmTo(0.0001, fade);
  }

  function createSweethopeEnemyCanvas(image) {
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
    const originalAlpha = new Uint8Array(w * h);
    const neonMask = new Uint8Array(w * h);
    for (let i = 0; i < originalAlpha.length; i++) {
      const o = i * 4;
      originalAlpha[i] = data[o + 3];
      if (originalAlpha[i]) neonMask[i] = getEnemyNeonStrength(data[o], data[o + 1], data[o + 2]);
    }

    for (let i = 0; i < originalAlpha.length; i++) {
      if (!originalAlpha[i]) continue;
      const o = i * 4;
      const mapped = mapEnemyPixelToSweethope(data[o], data[o + 1], data[o + 2]);
      data[o] = mapped[0];
      data[o + 1] = mapped[1];
      data[o + 2] = mapped[2];
    }

    applyEnemyNeonGlow(data, originalAlpha, neonMask, w, h);

    const outline = SWEETHOPE_SHADER_PALETTE.glow;
    for (let i = 0; i < originalAlpha.length; i++) {
      if (!originalAlpha[i]) continue;
      const x = i % w;
      const y = (i - x) / w;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          const ni = ny * w + nx;
          if (originalAlpha[ni]) continue;
          const no = ni * 4;
          data[no] = outline[0];
          data[no + 1] = outline[1];
          data[no + 2] = outline[2];
          data[no + 3] = 255;
        }
      }
    }

    c.putImageData(imageData, 0, 0);
    return canvasEl;
  }

  function applyEnemyNeonGlow(data, originalAlpha, neonMask, w, h) {
    const p = SWEETHOPE_SHADER_PALETTE;
    for (let i = 0; i < neonMask.length; i++) {
      const strength = neonMask[i];
      if (!strength) continue;

      const x = i % w;
      const y = (i - x) / w;
      const radius = strength >= 3 ? 3 : 2;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

          const distance = Math.max(Math.abs(dx), Math.abs(dy));
          if (distance > radius) continue;

          const ni = ny * w + nx;
          const no = ni * 4;
          const hasSourcePixel = originalAlpha[ni] > 0;
          const isNeonSourcePixel = neonMask[ni] > 0;

          if (distance === 0 || (hasSourcePixel && isNeonSourcePixel)) {
            overlayEnemyGlowPixel(data, no, strength >= 3 ? p.glow : p.orange, strength >= 3 ? 255 : 235, true);
          } else if (hasSourcePixel) {
            continue;
          } else if (distance === 1) {
            overlayEnemyGlowPixel(data, no, strength >= 3 ? p.peach : p.orange, strength >= 3 ? 155 : 115, false);
          } else if (distance === 2) {
            overlayEnemyGlowPixel(data, no, p.peach, strength >= 3 ? 95 : 64, false);
          } else {
            overlayEnemyGlowPixel(data, no, p.pink, 42, false);
          }
        }
      }
    }
  }

  function overlayEnemyGlowPixel(data, offset, color, alpha, hasSourcePixel) {
    const currentAlpha = data[offset + 3];
    if (!currentAlpha) {
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = alpha;
      return;
    }

    const weight = Math.min(1, (alpha / 255) * (hasSourcePixel ? 0.88 : 0.62));
    data[offset] = Math.round(data[offset] * (1 - weight) + color[0] * weight);
    data[offset + 1] = Math.round(data[offset + 1] * (1 - weight) + color[1] * weight);
    data[offset + 2] = Math.round(data[offset + 2] * (1 - weight) + color[2] * weight);
    data[offset + 3] = Math.max(currentAlpha, alpha);
  }

  function getEnemyNeonStrength(r, g, b) {
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const golden = r > 220 && g > 135 && b < 225 && r - g > 10 && g - b > 25;
    const hotOrange = r > 190 && g > 75 && b < 120 && r > g * 1.45;

    if (!golden && !hotOrange) return 0;
    if (golden || (hotOrange && l > 145)) return 3;
    return 2;
  }

  function mapEnemyPixelToSweethope(r, g, b) {
    const p = SWEETHOPE_SHADER_PALETTE;
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (max > 215 && max - min < 42) return p.glow;

    if ((r > 95 && r > g * 1.18 && r > b * 1.12) || (r > 130 && g > 55 && b < 115)) {
      if (l < 90) return p.orange;
      if (l < 165) return p.orange;
      if (l < 215) return p.peach;
      return p.glow;
    }

    if (l < 52) return p.ink;
    if (l < 102) return p.navy;
    if (l < 152) return p.deepBlue;
    if (l < 210) return p.blue;
    return p.mist;
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

    gameContainer.innerHTML = `
      <div class="game-section-wrapper">
        <div class="game-screen-container">
          <div class="game-wrapper">
            <canvas id="miniGameCanvas" width="600" height="800"></canvas>

            <div class="game-ui">
              <div>DIST: <span id="gameDistance">0m</span></div>
              <div id="leaderboardList" class="game-ui__leaderboard">Loading...</div>
            </div>

            <div id="startScreen" class="game-overlay game-overlay--start">
              <div class="game-overlay__panel">
                <h2 class="game-overlay__title">WEDDING RUNNER</h2>
                <p class="game-overlay__copy">
                  신랑과 신부가 함께 달리는 픽셀 러닝 게임입니다.
                </p>
                <button id="startGameBtn" class="game-action game-action--primary">START GAME</button>
              </div>
            </div>

            <div id="gameOverScreen" class="game-overlay game-overlay--game-over">
              <div class="game-overlay__panel game-overlay__panel--score">
                <h2 class="game-overlay__title">GAME OVER</h2>
                <div id="finalScore" class="final-score"></div>
                <div id="recordSubmit" class="score-submit is-hidden">
                  <input type="text" id="playerName" class="game-input" placeholder="이름 입력" maxlength="10">
                  <div class="game-actions">
                    <button id="submitScore" class="game-action game-action--primary">SUBMIT</button>
                    <button id="restartGame" class="game-action game-action--secondary">RETRY</button>
                  </div>
                </div>
                <div id="normalRestart" class="score-submit is-hidden">
                  <button id="restartGameOnly" class="game-action game-action--secondary game-action--solo">RETRY</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="control-panel ${showButtons ? '' : 'is-hidden'}">
          <div class="control-group">
            <button class="game-btn game-btn--tag" id="btnTag">TAG</button>
            <button class="game-btn game-btn--jump" id="btnJump">JUMP</button>
          </div>

          <div class="control-group">
            <button class="game-btn game-btn--attack" id="btnAttack">ATK</button>
            <button class="game-btn game-btn--slam" id="btnSlam">SLAM</button>
          </div>
        </div>

        <div id="fullLeaderboard" class="leaderboard-panel">
          <h3 class="leaderboard-panel__title">FULL LEADERBOARD</h3>
          <div id="leaderboardPages" class="leaderboard-panel__pages"></div>
          <div id="leaderboardPagination" class="leaderboard-panel__pagination"></div>
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
    hitSlow: 0,
    hitSlowMax: 0,
    hitFreeze: 0,
    focusLife: 0,
    focusMaxLife: 0,
    focusX: 0,
    focusY: 0,
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
    brideRecoil: 0,
    attackAnimTime: 0,
    attackAnimDuration: 0,
    attackHitFired: false,
    deathAnimTime: 0,
    deathAnimDuration: 0,
    dying: false,
    deathStartX: 0,
    deathCameraX: 0,
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
  const impactFlashes = [];
  const enemyExplosions = [];
  const muzzleFlashes = [];

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
    world.hitSlow = 0;
    world.hitSlowMax = 0;
    world.hitFreeze = 0;
    world.focusLife = 0;
    world.focusMaxLife = 0;
    world.focusX = 0;
    world.focusY = 0;
    
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
    player.brideRecoil = 0;
    player.attackAnimTime = 0;
    player.attackAnimDuration = 0;
    player.attackHitFired = false;
    player.deathAnimTime = 0;
    player.deathAnimDuration = 0;
    player.dying = false;
    player.deathStartX = 0;
    player.deathCameraX = 0;
    player.jumpAnimTime = 0;
    player.animTime = 0;
    player.coyote = 0;
    player.buffer = 0;
    player.slamming = false;
    player.slamCooldown = 0;
    player.swordSwing = 0;
    player.invulnerable = 0;
    finalizingGameOver = false;
    
    platforms.length = 0;
    obstacles.length = 0;
    bullets.length = 0;
    waves.length = 0;
    slashes.length = 0;
    meleeRects.length = 0;
    impactFlashes.length = 0;
    enemyExplosions.length = 0;
    muzzleFlashes.length = 0;
    
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
    const slots = Math.random() < 0.6 ? 1 : 0;
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
    player.attackHitFired = false;
    player.swordSwing = groomAttackDuration; // Start sword swing animation
    player.attackCooldown = Math.max(groomAttackDuration, 0.3 * cooldownScale);
  }

  function spawnGroomAttackHit() {
    playSfx('slash');
    const box = { x: player.x + player.w - 18, y: player.y - 24, w: 130, h: player.h + 66, life: 0.12 };
    meleeRects.push(box);
    slashes.push({ x: player.x + player.w - 20, y: player.y + player.h * 0.40, life: 0.15, maxLife: 0.15, angle: 0.10 });
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
    player.attackHitFired = false;
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
    playSfx('slamStart');
  }

  function updateUI() {
    const distEl = document.getElementById('gameDistance');
    
    if (distEl) distEl.textContent = Math.floor(world.distance) + 'm';
  }

  function createSlamImpact() {
    const originX = player.x + player.w * 0.5;
    const groundY = player.y + player.h;
    const hitOffsets = [-26, 0, 26];
    const brickColors = ['#9c8dc2', '#d9a3cd', '#ebc3a7', '#e0e0dc', '#a3d1af'];
    const crackColors = ['#615e85', '#717fb0', '#9c8dc2'];
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
    ctx.fillStyle = '#717fb0';
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
        ctx.fillStyle = '#e0e0dc';
        ctx.fillRect(x + 1, y + 1, Math.max(1, ridge.w - 2), 1);
      }
    }

    const dustColors = ['#e0e0dc', '#d9a3cd', '#9c8dc2'];
    for (const hitX of wv.hitOffsets || [0]) {
      for (let i = 0; i < 2; i++) {
        const t = clamp((age - i * 0.07) / 0.36, 0, 1);
        if (t <= 0 || t >= 1) continue;
        const radius = 10 + i * 8 + t * (48 + i * 12);
        const height = Math.max(1, Math.round((1 - t) * (3 - i)));
        ctx.globalAlpha = (1 - t) * (0.48 - i * 0.08);
        ctx.fillStyle = '#717fb0';
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
    const muzzleX = player.x + player.w * BRIDE_BULLET_X_FACTOR;
    const muzzleY = player.y + player.h * BRIDE_BULLET_Y_FACTOR;

    bullets.push({
      x: muzzleX,
      y: muzzleY,
      w: bulletSize.w,
      h: bulletSize.h,
      vx: bulletVelocity,
      ttl: 1.6
    });

    spawnMuzzleFlash(muzzleX + bulletSize.w, muzzleY + bulletSize.h * 0.5);
    player.brideRecoil = BRIDE_RECOIL_TIME;
    playSfx('shoot');

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
        if (o.hp <= 0) continue;
        if (collidesWithObstacle(a, o)) {
          const impact = getRectObstacleContactPoint(a, o);
          destroyObstacle(o, { kind: 'slash', x: impact.x, y: impact.y });
        }
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
        if (o.hp <= 0) continue;
        if (o.type === 'mine' && collidesWithObstacle(wv, o)) {
          const foot = getPlayerFootPoint();
          destroyObstacle(o, { kind: 'slam', x: foot.x, y: foot.y });
        }
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
        if (o.hp <= 0) continue;
        if (collidesWithObstacle(b, o)) {
          if (o.type === 'drone') {
            destroyObstacle(o, { kind: 'bullet', x: b.x + b.w, y: b.y + b.h * 0.5 });
          }
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

  function collidesWithObstacle(rect, obstacle) {
    if (obstacle.type === 'mine' || obstacle.type === 'drone') {
      return rectIntersectsCircle(rect, getEnemyHitCircle(obstacle));
    }

    return aabb(rect, obstacle);
  }

  function getEnemyHitCircle(obstacle) {
    const w = obstacle.w || 0;
    const h = obstacle.h || 0;
    const radiusScale = obstacle.type === 'mine'
      ? MINE_HIT_CIRCLE_RADIUS_SCALE
      : DRONE_HIT_CIRCLE_RADIUS_SCALE;

    return {
      x: obstacle.x + w * 0.5,
      y: obstacle.y + h * 0.5,
      r: Math.min(w, h) * radiusScale,
    };
  }

  function rectIntersectsCircle(rect, circle) {
    const left = rect.x;
    const right = rect.x + (rect.w || 0);
    const top = rect.y;
    const bottom = rect.y + (rect.h || 0);
    const closestX = Math.max(left, Math.min(circle.x, right));
    const closestY = Math.max(top, Math.min(circle.y, bottom));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function getPlayerFootPoint() {
    return {
      x: player.x + player.w * 0.5,
      y: player.y + player.h - 4,
    };
  }

  function getRectObstacleContactPoint(rect, obstacle) {
    const circle = getEnemyHitCircle(obstacle);
    return {
      x: clamp(circle.x, rect.x, rect.x + (rect.w || 0)),
      y: clamp(circle.y, rect.y, rect.y + (rect.h || 0)),
    };
  }

  function getHitSlowDuration(kind) {
    if (kind === 'slash' && player.who === CHAR.MALE && player.attackAnimDuration > 0) {
      const animScale = Math.max(0.001, getSpeedRatio());
      const remaining = Math.max(0, player.attackAnimDuration - player.attackAnimTime);
      return clamp((remaining / animScale) + SLASH_HIT_SLOW_PADDING, HIT_SLOW_DURATION, SLASH_HIT_SLOW_MAX);
    }

    return HIT_SLOW_DURATION;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  }

  function triggerHitSlow(kind) {
    const duration = getHitSlowDuration(kind);
    if (duration >= world.hitSlow) {
      world.hitSlow = duration;
      world.hitSlowMax = duration;
    }
    world.hitFreeze = Math.max(world.hitFreeze, HIT_FREEZE_DURATION);
    return duration;
  }

  function getHitTimeScale() {
    if (world.hitFreeze > 0) return HIT_FREEZE_SCALE;
    if (world.hitSlow <= 0 || world.hitSlowMax <= 0) return 1;

    const progress = 1 - clamp(world.hitSlow / world.hitSlowMax, 0, 1);
    return HIT_SLOW_SCALE + (1 - HIT_SLOW_SCALE) * easeOutCubic(progress);
  }

  function triggerHitFocus(x, y, kind, slowDuration) {
    const duration = kind === 'slash'
      ? clamp(slowDuration * 0.65, HIT_FOCUS_DURATION, HIT_FOCUS_MAX_DURATION)
      : HIT_FOCUS_DURATION;

    world.focusX = x;
    world.focusY = y;
    world.focusLife = duration;
    world.focusMaxLife = duration;
  }

  function getHitFocusPulse() {
    if (world.focusLife <= 0 || world.focusMaxLife <= 0) return 0;
    const progress = 1 - clamp(world.focusLife / world.focusMaxLife, 0, 1);

    if (progress < 0.14) return easeOutCubic(progress / 0.14);
    return Math.pow(clamp(1 - (progress - 0.14) / 0.86, 0, 1), 2.4);
  }

  function getHitFocusDimAlpha() {
    return getHitFocusPulse() * HIT_FOCUS_DIM_ALPHA;
  }

  function destroyObstacle(obstacle, source = {}) {
    if (!obstacle || obstacle.hp <= 0) return false;

    obstacle.hp = 0;
    const kind = source.kind || 'hit';
    const x = source.x ?? (obstacle.x + obstacle.w * 0.5);
    const y = source.y ?? (obstacle.y + obstacle.h * 0.5);

    const slowDuration = triggerHitSlow(kind);
    triggerHitFocus(x, y, kind, slowDuration);
    spawnEnemyExplosion(obstacle, kind);
    spawnImpactFlash(x, y, kind);
    world.shake = Math.min(world.shake + (kind === 'slam' ? 8 : kind === 'slash' ? 5 : 4), 18);

    if (kind === 'slam') playSfx('slamHit');
    else if (kind === 'bullet') playSfx('bulletHit');
    else playSfx('slashHit');

    return true;
  }

  function spawnImpactFlash(x, y, kind = 'hit') {
    const size = kind === 'slam' ? 34 : kind === 'slash' ? 28 : 22;
    const life = kind === 'slam' ? IMPACT_FLASH_LIFE + 0.05 : IMPACT_FLASH_LIFE;
    const sparks = [];

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + randRange(-0.18, 0.18);
      const speed = randRange(120, kind === 'slam' ? 260 : 210);
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.round(randRange(2, kind === 'slam' ? 5 : 4)),
        life: life * randRange(0.55, 0.95),
        maxLife: life,
      });
    }

    impactFlashes.push({
      x,
      y,
      kind,
      size,
      life,
      maxLife: life,
      sparks,
    });
  }

  function spawnEnemyExplosion(obstacle, kind = 'hit') {
    const x = obstacle.x + obstacle.w * 0.5;
    const y = obstacle.y + obstacle.h * 0.5;
    const type = obstacle.type || 'enemy';
    const coreLife = kind === 'slam' ? ENEMY_EXPLOSION_LIFE + 0.08 : ENEMY_EXPLOSION_LIFE;
    const life = Math.max(coreLife, ENEMY_EXPLOSION_SMOKE_LIFE);
    const radius = Math.max(obstacle.w || 0, obstacle.h || 0) * (type === 'drone' ? 0.56 : 0.48);
    const fragmentCount = kind === 'slam' ? 28 : type === 'drone' ? 22 : 18;
    const fragments = [];
    const smokes = [];
    const palette = getEnemyExplosionPalette(type);

    for (let i = 0; i < fragmentCount; i++) {
      const angle = (Math.PI * 2 * i) / fragmentCount + randRange(-0.26, 0.26);
      const speed = randRange(120, kind === 'slam' ? 370 : 290);
      fragments.push({
        x: x + randRange(-8, 8),
        y: y + randRange(-8, 8),
        vx: Math.cos(angle) * speed + randRange(-36, 36),
        vy: Math.sin(angle) * speed + randRange(-64, 22),
        size: Math.round(randRange(3, kind === 'slam' ? 8 : 7)),
        color: palette[Math.floor(Math.random() * palette.length)],
        life: coreLife * randRange(0.45, 0.95),
        maxLife: coreLife,
      });
    }

    for (let i = 0; i < 9; i++) {
      const angle = (Math.PI * 2 * i) / 9 + randRange(-0.32, 0.32);
      const speed = randRange(28, kind === 'slam' ? 105 : 82);
      const smokeLife = ENEMY_EXPLOSION_SMOKE_LIFE * randRange(0.7, 1);
      smokes.push({
        x: x + randRange(-10, 10),
        y: y + randRange(-8, 8),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randRange(18, 42),
        size: Math.round(randRange(7, kind === 'slam' ? 18 : 15)),
        grow: randRange(8, 18),
        color: Math.random() > 0.55 ? '#615e85' : '#2b172a',
        life: smokeLife,
        maxLife: smokeLife,
      });
    }

    enemyExplosions.push({
      x,
      y,
      kind,
      type,
      radius,
      life,
      maxLife: life,
      coreLife,
      coreMaxLife: coreLife,
      fragments,
      smokes,
    });
  }

  function getEnemyExplosionPalette(type) {
    if (type === 'drone') {
      return ['#fff4e0', '#e0e0dc', '#90b4de', '#717fb0', '#615e85', '#2b172a'];
    }

    return ['#fff4e0', '#ffd35a', '#d86629', '#8f1f16', '#615e85', '#2b172a'];
  }

  function spawnMuzzleFlash(x, y) {
    muzzleFlashes.push({
      x,
      y,
      life: MUZZLE_FLASH_LIFE,
      maxLife: MUZZLE_FLASH_LIFE,
      size: 18,
    });
  }

  function updateCombatFx(dt) {
    for (let i = enemyExplosions.length - 1; i >= 0; i--) {
      const fx = enemyExplosions[i];
      fx.life -= dt;
      fx.coreLife = Math.max(0, fx.coreLife - dt);
      fx.x -= world.speed * dt;

      for (const smoke of fx.smokes) {
        smoke.life -= dt;
        smoke.x += (smoke.vx - world.speed) * dt;
        smoke.y += smoke.vy * dt;
        smoke.vx *= Math.max(0, 1 - 1.7 * dt);
        smoke.vy *= Math.max(0, 1 - 1.1 * dt);
        smoke.size += smoke.grow * dt;
      }

      for (const fragment of fx.fragments) {
        fragment.life -= dt;
        fragment.x += (fragment.vx - world.speed) * dt;
        fragment.y += fragment.vy * dt;
        fragment.vy += 390 * dt;
        fragment.vx *= Math.max(0, 1 - 2.2 * dt);
      }

      if (fx.life <= 0) enemyExplosions.splice(i, 1);
    }

    for (let i = impactFlashes.length - 1; i >= 0; i--) {
      const fx = impactFlashes[i];
      fx.life -= dt;
      fx.x -= world.speed * dt;

      for (const spark of fx.sparks) {
        spark.life -= dt;
        spark.x += (spark.vx - world.speed) * dt;
        spark.y += spark.vy * dt;
        spark.vy += 260 * dt;
      }

      if (fx.life <= 0) impactFlashes.splice(i, 1);
    }

    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
      const fx = muzzleFlashes[i];
      fx.life -= dt;
      if (fx.life <= 0) muzzleFlashes.splice(i, 1);
    }
  }

  // ===== Game Loop =====
  let lastTime = 0;
  let animationId = null;
  let finalizingGameOver = false;

  function stopGameLoop() {
    running = false;
    stopBgm(0.2);
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
    getAudioContext();
    startBgm();
    running = true;
    lastTime = performance.now();
    
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
    
    console.log('Game started successfully');
  }

  function gameLoop(t) {
    if (!running) return;
    
    const rawDt = Math.min(0.033, (t - lastTime) / 1000);
    const hitFreezeActive = world.hitFreeze > 0;
    const slowScale = getHitTimeScale();
    const dt = rawDt * slowScale;
    world.hitFreeze = Math.max(0, world.hitFreeze - rawDt);
    world.hitSlow = Math.max(0, world.hitSlow - rawDt);
    if (world.hitSlow <= 0) world.hitSlowMax = 0;
    world.focusLife = Math.max(0, world.focusLife - rawDt);
    if (world.focusLife > 0) {
      world.focusX -= world.speed * dt;
    } else {
      world.focusMaxLife = 0;
    }
    lastTime = t;

    // Verify canvas is still valid
    if (!ctx || !canvas) {
      console.error('Canvas lost during game loop!');
      return;
    }

    if (player.dying) {
      updateDeathSequence(rawDt);
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
      playSfx('slamLand');
      player.slamming = false;
      player.invulnerable = 0.3; // 착지 후 추가 무적
      
      // 슬램 착지 시 주변 지뢰 즉시 파괴
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        if (o.hp <= 0) continue;
        if (o.type === 'mine' && Math.abs(o.x - player.x) < 150) {
          const foot = getPlayerFootPoint();
          destroyObstacle(o, { kind: 'slam', x: foot.x, y: foot.y });
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
    player.brideRecoil = Math.max(0, player.brideRecoil - dt);

    if (player.onGround) {
      player.jumpAnimTime = 0;
    } else {
      player.jumpAnimTime += dt * animScale;
    }

    if (player.who === CHAR.MALE) {
      if (player.attackAnimDuration > 0) {
        const attackDt = hitFreezeActive ? 0 : (world.hitSlow > 0 ? rawDt : dt);
        player.attackAnimTime += attackDt * animScale;
        if (!player.attackHitFired && player.attackAnimTime >= GROOM_ATTACK_HIT_FRAME / ANIM_FPS.groomAttack) {
          player.attackHitFired = true;
          spawnGroomAttackHit();
        }
        if (player.attackAnimTime >= player.attackAnimDuration) {
          player.attackAnimTime = 0;
          player.attackAnimDuration = 0;
          player.attackHitFired = false;
        }
      }
    } else if (isAttackHeld()) {
      player.attackAnimDuration = 0;
      player.attackHitFired = false;
      player.attackAnimTime += dt * animScale;
    } else {
      player.attackAnimDuration = 0;
      player.attackHitFired = false;
      player.attackAnimTime = 0;
    }

    // Update combat
    updateCombat(dt);
    updateCombatFx(dt);

    // Remove destroyed obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].hp <= 0) obstacles.splice(i, 1);
    }

    // Check collisions with player (if not invulnerable)
    if (player.invulnerable <= 0) {
      const body = {x: player.x + 4, y: player.y + 4, w: player.w - 8, h: player.h - 8};
      for (const o of obstacles) {
        if (o.hp <= 0) continue;
        if (collidesWithObstacle(body, o)) {
          // 슬램 중이면 지뢰는 파괴
          if (player.slamming && o.type === 'mine') {
            const foot = getPlayerFootPoint();
            destroyObstacle(o, { kind: 'slam', x: foot.x, y: foot.y });
            continue;
          }
          beginDeathSequence();
          return;
        }
      }
    }

    // Check if player fell
    if (player.y > world.h + 200) {
      beginDeathSequence(true);
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
  
  function getPlayerDieKey() {
    return player.who === CHAR.MALE ? 'groomDie' : 'brideDie';
  }

  function getPlayerDieDuration() {
    return Math.max(DEATH_MIN_DURATION, clipDuration(getPlayerDieKey(), ANIM_FPS.die));
  }

  function beginDeathSequence(clampToView = false) {
    if (player.dying || finalizingGameOver) return;

    player.dying = true;
    player.deathAnimTime = 0;
    player.deathAnimDuration = getPlayerDieDuration();
    player.deathStartX = player.x;
    player.deathCameraX = 0;
    player.attackAnimTime = 0;
    player.attackAnimDuration = 0;
    player.attackHitFired = false;
    player.jumpAnimTime = 0;
    player.vx = -DEATH_KNOCKBACK_VX;
    player.vy = -DEATH_POP_VY;
    player.onGround = false;
    player.slamming = false;
    player.invulnerable = 0;
    fadeBgmTo(BGM_MASTER_VOLUME * 0.38, 0.18);
    keys.clear();
    touches.clear();
    justPressed.clear();
    justTouched.clear();

    if (clampToView) {
      player.y = Math.min(player.y, world.h - player.h - 28);
    }

    animationId = requestAnimationFrame(gameLoop);
  }

  function updateDeathSequence(dt) {
    player.deathAnimTime += dt;
    updateDeathPhysics(dt);
    world.shake = Math.max(0, world.shake - 0.9);

    render(1);
    updateUI();
    lateInputFlush();

    if (player.deathAnimTime >= player.deathAnimDuration) {
      endGame();
      return;
    }

    animationId = requestAnimationFrame(gameLoop);
  }

  function updateDeathPhysics(dt) {
    const prevY = player.y;

    player.x += player.vx * dt;
    player.x = Math.max(-player.w * 0.65, player.x);
    player.vx *= Math.max(0, 1 - DEATH_KNOCKBACK_DRAG * dt);
    const cameraTargetX = clamp(player.deathStartX - player.x, 0, DEATH_CAMERA_MAX_X);
    const cameraFollow = 1 - Math.exp(-DEATH_CAMERA_FOLLOW_DAMPING * dt);
    player.deathCameraX += (cameraTargetX - player.deathCameraX) * cameraFollow;

    player.vy += world.gravity * dt;
    player.y += player.vy * dt;

    const prevOnGround = player.onGround;
    player.onGround = false;

    for (const p of platforms) {
      const xOverlap = !(player.x + player.w < p.x || player.x > p.x + p.w);
      const topY = p.y - player.h;
      const crossed = prevY <= topY && player.y >= topY;

      if (xOverlap && crossed && player.vy >= 0 && (player.y - prevY) <= 160) {
        player.y = topY;
        player.vy = 0;
        player.onGround = true;
        break;
      }

      const feet = {x: player.x + 6, y: player.y + player.h - 4, w: player.w - 12, h: 6};
      if (player.vy >= 0 && feet.x < p.x + p.w && feet.x + feet.w > p.x) {
        if (player.y >= topY - 6 && player.y <= topY + 14) {
          player.y = topY;
          player.vy = 0;
          player.onGround = true;
          break;
        }
      }
    }

    if (!player.onGround && prevOnGround) {
      player.vy = Math.max(player.vy, 80);
    }
  }

  async function endGame() {
    if (finalizingGameOver) return;
    finalizingGameOver = true;
    running = false;
    stopBgm(0.6);
    
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
          <div class="score-record">
            🏆 신기록 달성! 🏆
          </div>
          <div>거리: ${currentScore}m</div>
          <div>최고 속도: ${Math.floor(world.speed)}</div>
        `;
      } else {
        finalScoreEl.innerHTML = `
          <div>거리: ${currentScore}m</div>
          <div>최고 속도: ${Math.floor(world.speed)}</div>
          <div class="score-best">최고 기록: ${highScore}m</div>
        `;
      }
      
      // 항상 기록 입력 패널 표시 (점수가 0보다 클 때만)
      if (currentScore > 0) {
        if (recordSubmit) recordSubmit.classList.remove('is-hidden');
        if (normalRestart) normalRestart.classList.add('is-hidden');
      } else {
        // 점수가 0이면 재시작 버튼만 표시
        if (recordSubmit) recordSubmit.classList.add('is-hidden');
        if (normalRestart) normalRestart.classList.remove('is-hidden');
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
    
    ctx.save();

    // Apply camera shake
    if (world.shake > 0) {
      const sx = (Math.random() - 0.5) * world.shake;
      const sy = (Math.random() - 0.5) * world.shake;
      ctx.translate(sx, sy);
    }

    applyHitFocusZoom(W, H);
    renderScene(W, H, animScale);
    ctx.restore();
  }

  function applyDeathCameraFollow() {
    if (!player.dying || player.deathCameraX <= 0.01) return;
    ctx.translate(Math.round(player.deathCameraX), 0);
  }

  function applyHitFocusZoom(W, H) {
    const pulse = getHitFocusPulse();
    if (pulse <= 0) return;

    const zoom = 1 + HIT_FOCUS_ZOOM * pulse;
    const pivotX = clamp(Number.isFinite(world.focusX) ? world.focusX : W * 0.5, W * 0.12, W * 0.88);
    const pivotY = clamp(Number.isFinite(world.focusY) ? world.focusY : H * 0.5, H * 0.12, H * 0.88);
    ctx.translate(pivotX, pivotY);
    ctx.scale(zoom, zoom);
    ctx.translate(-pivotX, -pivotY);
  }

  function renderScene(W, H, animScale) {
    ctx.imageSmoothingEnabled = false;
    const focusDimAlpha = getHitFocusDimAlpha();
    drawBackground(W, H);

    ctx.save();
    applyDeathCameraFollow();

    // Platform props stay behind the player.
    for (const p of platforms) {
      drawPlatformProps(p);
    }

    ctx.restore();
    drawHitFocusBackdropDim(W, H, focusDimAlpha);

    ctx.save();
    applyDeathCameraFollow();
    
    // Obstacles
    for (const o of obstacles) {
      if (o.hp <= 0) continue;
      const spr = getEnemySprite((o.type === 'mine') ? 'mine' : 'drone');
      if (sprReady(spr)) {
        ctx.drawImage(spr, o.x, o.y, o.w, o.h);
      } else {
        ctx.fillStyle = (o.type === 'mine') ? '#d9a3cd' : '#90b4de';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    }

    // Bullets
    for (const b of bullets) {
      if (!drawBulletSpriteAt(b.x, b.y, b.w, b.h)) {
        ctx.fillStyle = '#ebc3a7';
        ctx.fillRect(b.x, b.y, b.w, b.h);
      }
    }

    // Waves
    for (const wv of waves) {
      if (wv.type === 'slamImpact') {
        drawSlamImpact(wv);
      } else {
        const alpha = Math.max(0, wv.life / 0.18);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#90b4de';
        ctx.fillRect(wv.x, wv.y, wv.w, wv.h);
        ctx.restore();
      }
    }

    for (const p of platforms) {
      drawDimmedWorldLayer(focusDimAlpha, () => drawPlatform(p));
    }

    // Slashes should read above building bodies but below the player.
    for (const s of slashes) {
      drawSwordSlash(s);
    }

    // Player
    drawPlayer(animScale);
    drawMuzzleFlashes();

    drawEnemyExplosions();
    drawImpactFlashes();
    ctx.restore();
  }

  function drawHitFocusBackdropDim(W, H, alpha) {
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#050914';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawDimmedWorldLayer(alpha, drawFn) {
    if (alpha <= 0) {
      drawFn();
      return;
    }

    const brightness = Math.round((1 - alpha * 0.34) * 100);
    ctx.save();
    ctx.filter = `brightness(${brightness}%)`;
    ctx.globalAlpha = 1 - alpha * 0.04;
    drawFn();
    ctx.restore();
  }

  function drawMuzzleFlashes() {
    for (const fx of muzzleFlashes) {
      const t = 1 - clamp(fx.life / fx.maxLife, 0, 1);
      const alpha = 1 - t;
      const len = Math.round(fx.size * (1.05 + t * 0.65));
      const x = Math.floor(fx.x - t * 3);
      const y = Math.floor(fx.y);

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#e0e0dc';
      ctx.fillRect(x, y - 3, Math.max(4, Math.round(len * 0.45)), 6);
      ctx.fillStyle = '#90b4de';
      ctx.fillRect(x + 4, y - 6, len, 4);
      ctx.fillRect(x + 4, y + 2, Math.max(6, Math.round(len * 0.65)), 4);
      ctx.fillStyle = '#717fb0';
      ctx.fillRect(x + Math.round(len * 0.55), y - 1, Math.max(4, Math.round(len * 0.45)), 3);
      ctx.restore();
    }
  }

  function drawImpactFlashes() {
    for (const fx of impactFlashes) {
      const lifeRatio = clamp(fx.life / fx.maxLife, 0, 1);
      const t = 1 - lifeRatio;
      const alpha = Math.min(1, lifeRatio * 1.4);
      const x = Math.floor(fx.x);
      const y = Math.floor(fx.y);
      const size = Math.round(fx.size * (0.65 + t * 0.9));
      const core = Math.max(3, Math.round(size * (0.16 + lifeRatio * 0.1)));

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#e0e0dc';
      ctx.fillRect(x - core, y - core, core * 2, core * 2);
      ctx.fillStyle = '#90b4de';
      ctx.fillRect(x - size, y - 2, size * 2, 4);
      ctx.fillRect(x - 2, y - size, 4, size * 2);
      ctx.fillStyle = '#717fb0';
      ctx.fillRect(x - Math.round(size * 0.7), y - Math.round(size * 0.7), 4, 4);
      ctx.fillRect(x + Math.round(size * 0.7) - 4, y - Math.round(size * 0.7), 4, 4);
      ctx.fillRect(x - Math.round(size * 0.7), y + Math.round(size * 0.7) - 4, 4, 4);
      ctx.fillRect(x + Math.round(size * 0.7) - 4, y + Math.round(size * 0.7) - 4, 4, 4);

      for (const spark of fx.sparks) {
        if (spark.life <= 0) continue;
        const sparkAlpha = alpha * clamp(spark.life / spark.maxLife, 0, 1);
        ctx.globalAlpha = sparkAlpha;
        ctx.fillStyle = sparkAlpha > 0.55 ? '#e0e0dc' : '#90b4de';
        ctx.fillRect(Math.floor(spark.x), Math.floor(spark.y), spark.size, spark.size);
      }

      ctx.restore();
    }
  }

  function drawEnemyExplosions() {
    for (const fx of enemyExplosions) {
      const coreLifeRatio = clamp(fx.coreLife / fx.coreMaxLife, 0, 1);
      const t = 1 - coreLifeRatio;
      const x = Math.floor(fx.x);
      const y = Math.floor(fx.y);

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      for (const smoke of fx.smokes) {
        if (smoke.life <= 0) continue;
        const smokeRatio = clamp(smoke.life / smoke.maxLife, 0, 1);
        const size = Math.max(3, Math.round(smoke.size));
        ctx.globalAlpha = 0.34 * smokeRatio;
        ctx.fillStyle = smoke.color;
        ctx.fillRect(Math.floor(smoke.x - size * 0.5), Math.floor(smoke.y - size * 0.5), size, size);
        if (size > 8) {
          ctx.globalAlpha = 0.18 * smokeRatio;
          ctx.fillRect(Math.floor(smoke.x - size * 0.3), Math.floor(smoke.y - size * 0.75), Math.max(3, Math.round(size * 0.6)), Math.max(3, Math.round(size * 0.38)));
        }
      }

      if (coreLifeRatio > 0.22) {
        const coreAlpha = Math.min(1, coreLifeRatio * 1.6);
        const core = Math.max(4, Math.round(fx.radius * (0.72 - t * 0.36)));
        const burst = Math.max(5, Math.round(fx.radius * (0.38 + t * 0.55)));

        ctx.globalAlpha = coreAlpha;
        ctx.fillStyle = '#d86629';
        ctx.fillRect(x - burst, y - 4, burst * 2, 8);
        ctx.fillRect(x - 4, y - burst, 8, burst * 2);
        ctx.fillStyle = '#ffd35a';
        ctx.fillRect(x - Math.round(core * 0.55), y - Math.round(core * 0.55), core, core);
        ctx.fillStyle = '#fff4e0';
        ctx.fillRect(x - Math.round(core * 0.24), y - Math.round(core * 0.24), Math.max(4, Math.round(core * 0.48)), Math.max(4, Math.round(core * 0.48)));
      }

      for (const fragment of fx.fragments) {
        if (fragment.life <= 0) continue;
        const fragmentRatio = clamp(fragment.life / fragment.maxLife, 0, 1);
        const alpha = Math.min(1, fragmentRatio * 1.35);
        const size = Math.max(2, Math.round(fragment.size * (0.65 + fragmentRatio * 0.35)));
        const trailX = Math.round(fragment.vx * 0.018);
        const trailY = Math.round(fragment.vy * 0.018);

        ctx.globalAlpha = alpha * 0.45;
        ctx.fillStyle = '#2b172a';
        ctx.fillRect(Math.floor(fragment.x - trailX), Math.floor(fragment.y - trailY), Math.max(2, size - 1), Math.max(2, size - 1));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = fragment.color;
        ctx.fillRect(Math.floor(fragment.x), Math.floor(fragment.y), size, size);
      }

      ctx.restore();
    }
  }

  function drawSwordSlash(s) {
    const maxLife = s.maxLife || 0.15;
    const lifeRatio = clamp(s.life / maxLife, 0, 1);
    const t = 1 - lifeRatio;
    const alpha = Math.pow(lifeRatio, 0.54);
    const open = 0.92 + t * 0.10;
    const slashSprite = SPR.groomSlash;
    if (!sprReady(slashSprite)) return;
    const drawW = 226 * open;
    const drawH = 85 * open;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;
    ctx.translate(Math.floor(s.x - 20 + t * 6), Math.floor(s.y + t * 12));
    ctx.rotate(s.angle - 0.04 + t * 0.025);
    ctx.drawImage(slashSprite, -drawW * 0.20, -drawH * 0.54, drawW, drawH);
    ctx.restore();
  }

  function drawBackground(W, H) {
    if (sprReady(SPR.bg)) {
      drawTiledParallaxBackgroundLayer(SPR.bg, BACKGROUND_BASE_SPEED, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#615e85');
      g.addColorStop(1, '#90b4de');
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
      ctx.fillStyle = '#9c8dc2';
      ctx.fillRect(p.x, p.y, p.w, Math.max(p.h, 180));
      ctx.fillStyle = '#d9a3cd';
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

    if (!drawBulletSpriteAt(iconX, iconY, iconW, iconH)) {
      ctx.fillStyle = '#615e85';
      ctx.fillRect(iconX - outline, iconY - outline, iconW + outline * 2, iconH + outline * 2);
      ctx.fillStyle = '#e0e0dc';
      ctx.fillRect(iconX, iconY, iconW, iconH);
    }

    ctx.fillStyle = '#615e85';
    for (const [ox, oy] of outlineOffsets) {
      ctx.fillText(countText, textX + ox, y + oy);
    }
    ctx.fillStyle = ammo === 0 ? '#d9a3cd' : '#e0e0dc';
    ctx.fillText(countText, textX, y);
    ctx.restore();
  }

  function drawPlayer(animScale) {
    const x = Math.floor(player.x);
    const y = Math.floor(player.y);
    if (!player.dying && player.invulnerable > 0 && Math.sin(player.invulnerable * 30) > 0) ctx.globalAlpha = 0.5;

    const isMale = player.who === CHAR.MALE;
    const recoilX = !isMale ? Math.round(-7 * clamp(player.brideRecoil / BRIDE_RECOIL_TIME, 0, 1)) : 0;
    let key;
    let fps = ANIM_FPS.run;
    let frame = 0;
    let loop = true;

    if (player.dying) {
      key = getPlayerDieKey();
      fps = ANIM_FPS.die;
      loop = false;
      frame = Math.floor(player.deathAnimTime * fps);
    } else if (isMale && player.attackAnimDuration > 0) {
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
    const drawX = x + Math.floor((player.w - drawW) / 2) + recoilX;
    const drawY = y + player.h - drawH;

    if (!drawSpriteFrame(sprite, frame, drawX, drawY, drawW, drawH)) {
      const leg = Math.sin(player.animTime * 10) * 3 * animScale;
      const bodyX = x + recoilX;
      ctx.fillStyle = isMale ? '#e0e0dc' : '#d9a3cd';
      ctx.fillRect(bodyX + 8, y + 18, 34, 34);
      ctx.fillStyle = '#ebc3a7';
      ctx.fillRect(bodyX + 15, y + 5, 20, 18);
      ctx.fillStyle = isMale ? '#615e85' : '#9c8dc2';
      ctx.fillRect(bodyX + 14, y + 5, 22, 8);
      ctx.fillStyle = isMale ? '#615e85' : '#ebc3a7';
      ctx.fillRect(bodyX + 14, y + 50, 8, 10 + leg);
      ctx.fillRect(bodyX + 28, y + 50, 8, 10 - leg);
    }
    ctx.globalAlpha = 1;

    if (!player.dying && !isMale) {
      drawBrideAmmoCounter(drawX, drawY);
    }
  }

  // ===== Firebase Integration =====
  async function submitScore() {
    if (!LEADERBOARD_SUBMISSIONS_OPEN) {
      alert(LEADERBOARD_CLOSED_MESSAGE);
      return;
    }

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
      alert(error && error.message === LEADERBOARD_CLOSED_MESSAGE ? LEADERBOARD_CLOSED_MESSAGE : '점수 등록에 실패했습니다.');
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
            return `<div class="leaderboard-chip">${medal} ${escapeHtml(name)} : ${score}m</div>`;
          }).join('');
        } else if (listEl) {
          listEl.innerHTML = '기록 없음';
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
              <div class="leaderboard-row${rank <= 3 ? ' is-podium' : ''}">
                ${rankDisplay} ${s.name}: ${s.score}m
              </div>
            `;
          }).join('');
          
          // Create prev/next pagination controls
          paginationEl.innerHTML = `
            <div class="leaderboard-pager">
              <button id="prevPageBtn" class="leaderboard-page-btn" ${currentLeaderboardPage === 0 ? 'disabled' : ''}>
                ◀
              </button>
              
              <span class="leaderboard-page-info">
                ${currentLeaderboardPage + 1}/${totalPages}
              </span>
              
              <button id="nextPageBtn" class="leaderboard-page-btn" ${currentLeaderboardPage === totalPages - 1 ? 'disabled' : ''}>
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
