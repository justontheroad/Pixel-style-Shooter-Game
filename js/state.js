export const state = {
  scene: null,
  camera: null,
  renderer: null,
  isMobile: false,

  currentChannel: 'left',
  playerX: 0,
  playerTargetX: 0,
  playerSwitching: false,
  playerSwitchTimer: 0,
  playerSwitchFromX: 0,

  currentWeaponIndex: 0,
  fireTimer: 0,
  beamActive: false,

  bullets: [],
  cloneBullets: [],
  obstacles: [],
  items: [],
  powerups: [],
  effects: [],
  damageTexts: [],

  shieldActive: false,
  shieldTimer: 0,
  shieldMesh: null,

  slowTimeActive: false,
  slowTimeTimer: 0,

  doubleScoreActive: false,
  doubleScoreTimer: 0,

  clearPending: false,

  pendingDrops: [],

  tempWeaponActive: false,
  tempWeaponTimer: 0,
  savedWeaponIndex: 0,
  tempWeaponWarning: false,

  cloneActive: false,
  cloneTimer: 0,
  cloneGroup: null,
  cloneGun: null,

  score: 0,
  combo: 0,
  maxCombo: 0,
  destroyedCount: 0,
  weaponsUsed: new Set(),
  gameTime: 0,
  survivalTime: 0,

  gameActive: false,
  gameStarted: false,
  gameOver: false,
  paused: false,

  spawnTimer: 0,
  currentStage: null,

  maxObstacleLevel: 0,
  destroyedAtCurrentLevel: 0,

  wavePlan: [],
  currentWaveIndex: 0,
  waveTimer: 0,
  calmTimer: 0,
  inCalm: false,
  waveDropSpawned: false,

  highScore: 0,

  continueState: null,

  lastTime: 0,
  t: 0,

  playerMesh: null,
  playerGroup: null,
  gunMesh: null,
  channelFloorLeft: null,
  channelFloorRight: null,
  dividerMesh: null,
  bgStars: null,
};
