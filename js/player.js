import * as THREE from 'three';
import { state } from './state.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT, CHANNEL_LEFT_X, CHANNEL_RIGHT_X, PLAYER_Y, CHANNEL_SWITCH_SPEED, WEAPONS, COLORS } from './config.js';

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
  const colorMap = {
    1: 0x888888, 2: 0x666666, 3: 0x666666, 4: 0x555555,
    5: 0x8B4513, 6: 0x4a3728, 7: 0x2a4a2a, 8: 0x444444,
    9: 0x3a5a3a, 10: 0x00aacc
  };
  state.gunMesh.material.color.set(colorMap[weapon.level] || 0x888888);

  const sizeMap = { 1: [4, 10], 2: [4, 10], 3: [4, 10], 4: [6, 12], 5: [8, 10], 6: [4, 14], 7: [3, 18], 8: [8, 14], 9: [6, 16], 10: [6, 20] };
  const [w, h] = sizeMap[weapon.level] || [4, 10];
  state.gunMesh.geometry.dispose();
  state.gunMesh.geometry = new THREE.PlaneGeometry(w, h);
  state.gunMesh.position.set(4, PLAYER_HEIGHT / 2 + h / 2 - 2, 6);
}
