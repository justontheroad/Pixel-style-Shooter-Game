import * as THREE from 'three';
import { state } from './state.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT, CHANNEL_LEFT_X, CHANNEL_RIGHT_X, PLAYER_Y, CHANNEL_SWITCH_SPEED, WEAPONS, COLORS } from './config.js';

// 12种武器的像素图定义（Canvas2D 绘制）
// 每个武器用像素矩阵表示，1=主色 2=辅色 3=高光 0=透明
export const WEAPON_PIXELS = {
  1: { // 左轮手枪 - 短管转轮
    w: 6, h: 8,
    data: [
      0,0,1,1,0,0,
      0,0,1,1,0,0,
      1,1,1,1,1,1,
      1,2,1,1,2,1,
      0,0,1,1,0,0,
      0,0,1,3,0,0,
      0,0,1,1,0,0,
      0,0,1,1,0,0,
    ],
    colors: { 1: '#888888', 2: '#666666', 3: '#aaaaaa' },
  },
  2: { // 手枪 - 紧凑型
    w: 6, h: 8,
    data: [
      0,0,1,1,0,0,
      0,0,1,1,0,0,
      0,0,1,1,0,0,
      1,1,1,1,1,1,
      1,2,1,1,2,1,
      0,0,1,3,0,0,
      0,0,1,1,0,0,
      0,0,1,1,0,0,
    ],
    colors: { 1: '#666666', 2: '#555555', 3: '#888888' },
  },
  3: { // 双持手枪 - 两把短枪
    w: 10, h: 8,
    data: [
      1,1,0,0,0,0,0,0,1,1,
      1,1,0,0,0,0,0,0,1,1,
      1,1,0,0,0,0,0,0,1,1,
      1,1,1,0,0,0,0,1,1,1,
      1,2,1,0,0,0,0,1,2,1,
      1,3,1,0,0,0,0,1,3,1,
      1,1,0,0,0,0,0,0,1,1,
      1,1,0,0,0,0,0,0,1,1,
    ],
    colors: { 1: '#666666', 2: '#555555', 3: '#888888' },
  },
  4: { // 冲锋枪 - 弹匣突出
    w: 8, h: 10,
    data: [
      0,0,0,1,1,0,0,0,
      0,0,0,1,1,0,0,0,
      0,0,0,1,1,0,0,0,
      0,0,0,1,1,0,0,0,
      1,1,1,1,1,1,1,0,
      1,2,1,1,2,1,1,0,
      0,0,0,1,3,0,0,0,
      0,0,0,1,1,0,0,0,
      0,0,0,1,1,0,0,0,
      0,0,0,1,1,0,0,0,
    ],
    colors: { 1: '#555555', 2: '#444444', 3: '#777777' },
  },
  5: { // 霰弹枪 - 粗管
    w: 8, h: 10,
    data: [
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,2,2,1,0,0,
      0,0,1,1,1,1,0,0,
      1,1,1,1,1,1,1,1,
      1,3,1,1,1,1,3,1,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
    ],
    colors: { 1: '#8B4513', 2: '#6B3410', 3: '#A0522D' },
  },
  6: { // 步枪 - 长管+瞄准镜
    w: 6, h: 14,
    data: [
      0,0,3,3,0,0,
      0,0,1,1,0,0,
      0,0,1,1,0,0,
      0,0,1,1,0,0,
      0,0,1,1,0,0,
      0,0,1,1,0,0,
      1,1,1,1,1,1,
      1,2,1,1,2,1,
      0,0,1,1,0,0,
      0,0,1,1,0,0,
      0,0,1,3,0,0,
      0,0,1,1,0,0,
      0,0,1,1,0,0,
      0,0,1,1,0,0,
    ],
    colors: { 1: '#4a3728', 2: '#3a2718', 3: '#6a5748' },
  },
  7: { // 狙击枪 - 超长管+大瞄准镜
    w: 5, h: 18,
    data: [
      0,3,3,3,0,
      0,1,1,1,0,
      0,1,1,1,0,
      0,1,1,1,0,
      0,1,1,1,0,
      0,1,1,1,0,
      0,1,1,1,0,
      0,1,1,1,0,
      0,1,1,1,0,
      1,1,1,1,1,
      1,2,1,2,1,
      0,1,1,1,0,
      0,1,1,1,0,
      0,1,3,1,0,
      0,1,1,1,0,
      0,1,1,1,0,
      0,1,1,1,0,
      0,1,1,1,0,
    ],
    colors: { 1: '#2a4a2a', 2: '#1a3a1a', 3: '#4a6a4a' },
  },
  8: { // 加特林 - 多管+弹链
    w: 10, h: 12,
    data: [
      1,0,1,0,1,0,1,0,1,0,
      1,0,1,0,1,0,1,0,1,0,
      1,0,1,0,1,0,1,0,1,0,
      1,1,1,1,1,1,1,1,1,1,
      1,2,1,2,1,2,1,2,1,1,
      1,1,1,1,1,1,1,1,1,1,
      0,0,0,1,1,1,1,0,0,0,
      0,0,0,1,3,3,1,0,0,0,
      0,0,0,1,1,1,1,0,0,0,
      0,0,0,1,1,1,1,0,0,0,
      0,0,0,1,1,1,1,0,0,0,
      0,0,0,1,1,1,1,0,0,0,
    ],
    colors: { 1: '#444444', 2: '#333333', 3: '#666666' },
  },
  9: { // 火箭筒 - 粗管+弹头
    w: 8, h: 14,
    data: [
      0,0,3,3,3,3,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,2,2,1,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
      1,1,1,1,1,1,1,1,
      1,2,1,1,1,1,2,1,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,3,3,1,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
    ],
    colors: { 1: '#3a5a3a', 2: '#2a4a2a', 3: '#5a7a5a' },
  },
  10: { // 激光枪 - 细管+发光口
    w: 5, h: 14,
    data: [
      0,0,3,0,0,
      0,0,1,0,0,
      0,0,1,0,0,
      0,0,1,0,0,
      0,0,1,0,0,
      0,0,1,0,0,
      0,0,1,0,0,
      1,1,1,1,1,
      1,2,1,2,1,
      0,0,1,0,0,
      0,0,1,0,0,
      0,0,3,0,0,
      0,0,1,0,0,
      0,0,1,0,0,
    ],
    colors: { 1: '#008855', 2: '#006644', 3: '#00ff88' },
  },
  11: { // 双持激光枪 - 两把激光枪
    w: 10, h: 14,
    data: [
      0,0,3,0,0,0,0,3,0,0,
      0,0,1,0,0,0,0,1,0,0,
      0,0,1,0,0,0,0,1,0,0,
      0,0,1,0,0,0,0,1,0,0,
      0,0,1,0,0,0,0,1,0,0,
      0,0,1,0,0,0,0,1,0,0,
      0,0,1,0,0,0,0,1,0,0,
      1,1,1,0,0,0,0,1,1,1,
      1,2,1,0,0,0,0,1,2,1,
      0,0,1,0,0,0,0,1,0,0,
      0,0,1,0,0,0,0,1,0,0,
      0,0,3,0,0,0,0,3,0,0,
      0,0,1,0,0,0,0,1,0,0,
      0,0,1,0,0,0,0,1,0,0,
    ],
    colors: { 1: '#0088aa', 2: '#006688', 3: '#00ddff' },
  },
  12: { // 激光炮 - 大型+散热片
    w: 8, h: 18,
    data: [
      0,0,3,3,3,3,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
      0,2,1,1,1,1,2,0,
      0,0,1,1,1,1,0,0,
      0,2,1,1,1,1,2,0,
      0,0,1,1,1,1,0,0,
      0,2,1,1,1,1,2,0,
      0,0,1,1,1,1,0,0,
      1,1,1,1,1,1,1,1,
      1,2,1,1,1,1,2,1,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,3,3,1,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
      0,0,1,1,1,1,0,0,
    ],
    colors: { 1: '#00aacc', 2: '#008899', 3: '#00ffff' },
  },
};

export function createWeaponTexture(weaponLevel) {
  const spec = WEAPON_PIXELS[weaponLevel];
  if (!spec) return null;

  const pixelSize = 2;
  const canvas = document.createElement('canvas');
  canvas.width = spec.w * pixelSize;
  canvas.height = spec.h * pixelSize;
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < spec.data.length; i++) {
    const val = spec.data[i];
    if (val === 0) continue;
    const x = (i % spec.w) * pixelSize;
    const y = Math.floor(i / spec.w) * pixelSize;
    ctx.fillStyle = spec.colors[val] || '#ffffff';
    ctx.fillRect(x, y, pixelSize, pixelSize);
  }

  return canvas;
}

export function initPlayer() {
  state.playerGroup = new THREE.Group();

  const bodyGeo = new THREE.PlaneGeometry(PLAYER_WIDTH, PLAYER_HEIGHT);
  const bodyMat = new THREE.MeshBasicMaterial({ color: 0x44aaff });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.z = 5;
  state.playerGroup.add(body);

  const headGeo = new THREE.PlaneGeometry(12, 10);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xffcc88 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, PLAYER_HEIGHT / 2 - 2, 6);
  state.playerGroup.add(head);

  const eyeGeo = new THREE.PlaneGeometry(2, 2);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-3, PLAYER_HEIGHT / 2 - 1, 7);
  state.playerGroup.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(3, PLAYER_HEIGHT / 2 - 1, 7);
  state.playerGroup.add(rightEye);

  const gunGeo = new THREE.PlaneGeometry(4, 10);
  const gunMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
  state.gunMesh = new THREE.Mesh(gunGeo, gunMat);
  state.gunMesh.position.set(4, PLAYER_HEIGHT / 2 + 3, 6);
  state.playerGroup.add(state.gunMesh);

  state.playerGroup.position.set(CHANNEL_LEFT_X, PLAYER_Y, 0);
  state.playerX = CHANNEL_LEFT_X;
  state.playerTargetX = CHANNEL_LEFT_X;
  state.currentChannel = 'left';

  state.scene.add(state.playerGroup);
  state.playerMesh = body;
}

export function switchChannel() {
  if (state.playerSwitching || !state.gameActive) return;
  state.playerSwitching = true;
  state.playerSwitchTimer = 0;
  state.playerSwitchFromX = state.playerX;
  state.currentChannel = state.currentChannel === 'left' ? 'right' : 'left';
  state.playerTargetX = state.currentChannel === 'left' ? CHANNEL_LEFT_X : CHANNEL_RIGHT_X;
}

export function updatePlayer(dt) {
  if (state.playerSwitching) {
    state.playerSwitchTimer += dt;
    const t = Math.min(1, state.playerSwitchTimer / CHANNEL_SWITCH_SPEED);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    state.playerX = state.playerSwitchFromX + (state.playerTargetX - state.playerSwitchFromX) * eased;
    if (t >= 1) {
      state.playerSwitching = false;
      state.playerX = state.playerTargetX;
    }
  }
  if (state.playerGroup) {
    state.playerGroup.position.x = state.playerX;
  }
  if (state.playerLight) {
    state.playerLight.position.x = state.playerX;
  }

  // 临时武器到期闪烁预警
  if (state.gunMesh && state.tempWeaponWarning) {
    const blink = Math.sin(state.gameTime * 15) > 0;
    state.gunMesh.material.opacity = blink ? 1.0 : 0.3;
    state.gunMesh.material.transparent = true;
  } else if (state.gunMesh && state.gunMesh.material.transparent) {
    state.gunMesh.material.opacity = 1.0;
    state.gunMesh.material.transparent = false;
  }
}

export function resetPlayer() {
  state.currentChannel = 'left';
  state.playerX = CHANNEL_LEFT_X;
  state.playerTargetX = CHANNEL_LEFT_X;
  state.playerSwitching = false;
  state.playerSwitchTimer = 0;
  state.playerSwitchFromX = CHANNEL_LEFT_X;
  if (state.playerGroup) {
    state.playerGroup.position.set(CHANNEL_LEFT_X, PLAYER_Y, 0);
  }
}

export function updateGunAppearance() {
  if (!state.gunMesh) return;
  const weapon = WEAPONS[state.currentWeaponIndex];
  const spec = WEAPON_PIXELS[weapon.level];

  // 释放旧纹理
  if (state.gunMesh.material.map) {
    state.gunMesh.material.map.dispose();
    state.gunMesh.material.map = null;
  }

  if (spec) {
    const canvas = createWeaponTexture(weapon.level);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const displayW = spec.w * 2;
    const displayH = spec.h * 2;
    state.gunMesh.geometry.dispose();
    state.gunMesh.geometry = new THREE.PlaneGeometry(displayW, displayH);

    state.gunMesh.material.color.set(0xffffff);
    state.gunMesh.material.map = texture;
    state.gunMesh.material.transparent = true;
    state.gunMesh.material.needsUpdate = true;
    state.gunMesh.position.set(4, PLAYER_HEIGHT / 2 + displayH / 2 - 2, 6);
  } else {
    // 回退到旧逻辑
    const colorMap = {
      1: 0x888888, 2: 0x666666, 3: 0x666666, 4: 0x555555,
      5: 0x8B4513, 6: 0x4a3728, 7: 0x2a4a2a, 8: 0x444444,
      9: 0x3a5a3a, 10: 0x008855, 11: 0x0088aa, 12: 0x00aacc
    };
    state.gunMesh.material.color.set(colorMap[weapon.level] || 0x888888);

    const sizeMap = { 1: [4, 10], 2: [4, 10], 3: [4, 10], 4: [6, 12], 5: [8, 10], 6: [4, 14], 7: [3, 18], 8: [8, 14], 9: [6, 16], 10: [4, 16], 11: [5, 16], 12: [6, 20] };
    const [w, h] = sizeMap[weapon.level] || [4, 10];
    state.gunMesh.geometry.dispose();
    state.gunMesh.geometry = new THREE.PlaneGeometry(w, h);
    state.gunMesh.position.set(4, PLAYER_HEIGHT / 2 + h / 2 - 2, 6);
  }
}
