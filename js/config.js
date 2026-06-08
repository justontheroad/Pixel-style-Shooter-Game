export const GAME_WIDTH = 240;
export const GAME_HEIGHT = 400;
export const CHANNEL_WIDTH = 100;
export const DIVIDER_WIDTH = 8;
export const CHANNEL_LEFT_X = -(CHANNEL_WIDTH + DIVIDER_WIDTH) / 2;
export const CHANNEL_RIGHT_X = (CHANNEL_WIDTH + DIVIDER_WIDTH) / 2;
export const PLAYER_Y = -GAME_HEIGHT / 2 + 30;
export const DEATH_LINE_Y = -GAME_HEIGHT / 2 + 5;
export const SPAWN_LINE_Y = GAME_HEIGHT / 2 + 20;

export const PLAYER_WIDTH = 16;
export const PLAYER_HEIGHT = 24;
export const CHANNEL_SWITCH_SPEED = 0.15;

export const BULLET_SPEED = 300;
export const MAX_BULLETS = 30;

export const OBSTACLE_MIN_GAP = 40;

export const POWERUPS = [
  { type: 'shield',     name: '护盾',     color: 0x44AAFF, duration: 8,  icon: 'S' },
  { type: 'slowtime',   name: '减速时钟', color: 0xFFAA00, duration: 6,  icon: 'T' },
  { type: 'double',     name: '双倍积分', color: 0xFF44FF, duration: 10, icon: 'x2' },
  { type: 'clear',      name: '全屏清除', color: 0xFF4444, duration: 0,  icon: 'C' },
  { type: 'tempweapon', name: '临时武器', color: 0xFF6600, duration: 20, icon: 'W' },
  { type: 'clone',      name: '分身',     color: 0x00FFAA, duration: 20, icon: 'C' },
];

export const POWERUP_DROP_RATE = 0.25;

export const WEAPONS = [
  { level: 1,  name: '左轮手枪',   damage: 10,   fireRate: 2.5,  type: 'single',    bulletSize: 3,  bulletColor: 0xffcc00, spreadAngle: 0, pierceCount: 0, explosionRadius: 0 },
  { level: 2,  name: '手枪',       damage: 12,   fireRate: 3.0,  type: 'single',    bulletSize: 3,  bulletColor: 0xffcc00, spreadAngle: 0, pierceCount: 0, explosionRadius: 0 },
  { level: 3,  name: '双持手枪',   damage: 9,    fireRate: 3.5,  type: 'dual',      bulletSize: 3,  bulletColor: 0xffaa00, spreadAngle: 0, pierceCount: 0, explosionRadius: 0 },
  { level: 4,  name: '冲锋枪',     damage: 10,   fireRate: 8.0,  type: 'spread',    bulletSize: 2,  bulletColor: 0xff8800, spreadAngle: 2, pierceCount: 0, explosionRadius: 0 },
  { level: 5,  name: '霰弹枪',     damage: 12,   fireRate: 2.0,  type: 'shotgun',   bulletSize: 3,  bulletColor: 0xff6600, spreadAngle: 12,pierceCount: 0, explosionRadius: 0 },
  { level: 6,  name: '步枪',       damage: 120,  fireRate: 1.5,  type: 'single',    bulletSize: 4,  bulletColor: 0x00ff88, spreadAngle: 0, pierceCount: 1, explosionRadius: 0 },
  { level: 7,  name: '狙击枪',     damage: 120,  fireRate: 2.0,  type: 'pierce',    bulletSize: 5,  bulletColor: 0x00ccff, spreadAngle: 0, pierceCount: 2, explosionRadius: 0 },
  { level: 8,  name: '加特林',     damage: 14,   fireRate: 16.0, type: 'rapid',     bulletSize: 2,  bulletColor: 0xff4400, spreadAngle: 2, pierceCount: 0, explosionRadius: 0 },
  { level: 9,  name: '火箭筒',     damage: 200,  fireRate: 1.5,  type: 'explosive', bulletSize: 6,  bulletColor: 0xff2200, spreadAngle: 0, pierceCount: 0, explosionRadius: 90 },
  { level: 10, name: '激光枪',     damage: 8,    fireRate: -1,   type: 'beam',      bulletSize: 2,  bulletColor: 0x00ff88, spreadAngle: 0, pierceCount: 0, explosionRadius: 0 },
  { level: 11, name: '双持激光枪', damage: 8,    fireRate: -1,   type: 'beam',      bulletSize: 2,  bulletColor: 0x00ddff, spreadAngle: 0, pierceCount: 0, explosionRadius: 0, dualBeam: true },
  { level: 12, name: '激光炮',     damage: 20,   fireRate: -1,   type: 'beam',      bulletSize: 6,  bulletColor: 0x00ffff, spreadAngle: 0, pierceCount: 99,explosionRadius: 0 },
];

export const OBSTACLES = [
  { level: 1,  name: '木箱',     hp: 15,   width: 24, height: 24, speed: 50,  score: 10,  material: 'wood',  color: 0x8B4513 },
  { level: 2,  name: '树干',     hp: 40,   width: 20, height: 32, speed: 54,  score: 20,  material: 'wood',  color: 0x6B3410 },
  { level: 3,  name: '石头',     hp: 80,   width: 28, height: 28, speed: 48,  score: 30,  material: 'stone', color: 0x808080 },
  { level: 4,  name: '铁桶',     hp: 130,  width: 22, height: 28, speed: 51,  score: 40,  material: 'metal', color: 0x404040 },
  { level: 5,  name: '沙袋',     hp: 200,  width: 30, height: 20, speed: 42,  score: 50,  material: 'cloth', color: 0xC2B280 },
  { level: 6,  name: '铁板',     hp: 300,  width: 32, height: 24, speed: 45,  score: 60,  material: 'metal', color: 0xA8A8A8 },
  { level: 7,  name: '水泥墙',   hp: 450,  width: 36, height: 36, speed: 36,  score: 70,  material: 'stone', color: 0xB0B0B0 },
  { level: 8,  name: '汽车',     hp: 700,  width: 40, height: 28, speed: 30,  score: 80,  material: 'metal', color: 0xCC3333 },
  { level: 9,  name: '装甲车',   hp: 1100, width: 44, height: 32, speed: 27,  score: 90,  material: 'metal', color: 0x556B2F },
  { level: 10, name: '钢铁堡垒', hp: 1800, width: 48, height: 48, speed: 21,  score: 100, material: 'metal', color: 0x303030 },
];

export const DIFFICULTY_STAGES = [
  { name: '新手期', timeStart: 0,   timeEnd: 20,    spawnInterval: 4.0, speedMult: 0.5, maxObstacles: 2, itemDropRate: 0.10 },
  { name: '热身期', timeStart: 20,  timeEnd: 60,    spawnInterval: 3.0, speedMult: 0.6, maxObstacles: 3, itemDropRate: 0.08 },
  { name: '挑战期', timeStart: 60,  timeEnd: 150,   spawnInterval: 2.4, speedMult: 0.8, maxObstacles: 4, itemDropRate: 0.08 },
  { name: '困难期', timeStart: 150, timeEnd: 300,   spawnInterval: 2.0, speedMult: 1.0, maxObstacles: 4, itemDropRate: 0.08 },
  { name: '炼狱期', timeStart: 300, timeEnd: 480,   spawnInterval: 1.5, speedMult: 1.2, maxObstacles: 5, itemDropRate: 0.10 },
  { name: '地狱期', timeStart: 480, timeEnd: 99999, spawnInterval: 1.0, speedMult: 1.5, maxObstacles: 6, itemDropRate: 0.15 },
];

export const COMBO_THRESHOLDS = [
  { combo: 5,  multiplier: 1.5 },
  { combo: 10, multiplier: 2.0 },
  { combo: 20, multiplier: 3.0 },
  { combo: 50, multiplier: 5.0 },
];

export const COLORS = {
  neonGreen: 0x00ff88,
  neonOrange: 0xff6644,
  neonBlue: 0x00ccff,
  bgDark: 0x0a0a1a,
  channelFloor: 0x1a1a2e,
  divider: 0x333355,
  hpGreen: 0x00ff44,
  hpYellow: 0xffcc00,
  hpRed: 0xff2200,
  white: 0xffffff,
};

export function getDifficultyStage(gameTime) {
  let stage = DIFFICULTY_STAGES[0];
  for (const s of DIFFICULTY_STAGES) {
    if (gameTime >= s.timeStart) stage = s;
  }
  return stage;
}

export function getComboMultiplier(combo) {
  let mult = 1.0;
  for (const t of COMBO_THRESHOLDS) {
    if (combo >= t.combo) mult = t.multiplier;
  }
  return mult;
}
