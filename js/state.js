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

  highScore: 0,

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
