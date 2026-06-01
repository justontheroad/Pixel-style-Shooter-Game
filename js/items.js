import * as THREE from 'three';
import { state } from './state.js';
import {
  WEAPONS, POWERUPS, POWERUP_DROP_RATE,
  PLAYER_Y, PLAYER_HEIGHT, PLAYER_WIDTH,
  DEATH_LINE_Y,
  CHANNEL_LEFT_X, CHANNEL_RIGHT_X,
  CHANNEL_WIDTH
} from './config.js';
import { getWaveSpawnConfig } from './waves.js';
import { updateGunAppearance } from './player.js';
import { spawnPickupParticles, spawnItemSparkle, spawnExtraExplosion, triggerScreenShake } from './effects.js';
import { playPickup, playPowerup } from './audio.js';
import { createTextTexture, disposeTextTexture } from './texttexture.js';

export function tryDropItem(x, y, obstacleLevel) {
  const stage = state.currentStage;
  if (!stage) return;

  if (Math.random() > stage.itemDropRate) return;

  const playerChannelX = state.currentChannel === 'left' ? CHANNEL_LEFT_X : CHANNEL_RIGHT_X;

  if (Math.random() < POWERUP_DROP_RATE) {
    const powerupIndex = Math.floor(Math.random() * POWERUPS.length);
    createPowerup(playerChannelX, y, powerupIndex);
    return;
  }

  let realWeaponIndex = state.tempWeaponActive ? state.savedWeaponIndex : state.currentWeaponIndex;
  let weaponLevel = realWeaponIndex + 1;
  const waveConfig = state.wavePlan ? getWaveSpawnConfig(state.gameTime) : null;
  if (waveConfig && waveConfig.weaponTarget) {
    const target = waveConfig.weaponTarget - 1;
    if (target > realWeaponIndex) {
      weaponLevel = Math.min(realWeaponIndex + 2, target + 1);
    }
  }
  if (weaponLevel >= WEAPONS.length) return;

  createItem(playerChannelX, y, weaponLevel);
}

export function createItem(x, y, weaponLevel) {
  const weapon = WEAPONS[weaponLevel];

  const group = new THREE.Group();

  const boxGeo = new THREE.PlaneGeometry(16, 16);
  const boxMat = new THREE.MeshBasicMaterial({ color: weapon.bulletColor, transparent: true, opacity: 0.8 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.z = 8;
  group.add(box);

  const glowGeo = new THREE.PlaneGeometry(20, 20);
  const glowMat = new THREE.MeshBasicMaterial({ color: weapon.bulletColor, transparent: true, opacity: 0.2 });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.z = 7;
  group.add(glow);

  const lvlGeo = new THREE.PlaneGeometry(12, 4);
  const lvlMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
  const lvlBg = new THREE.Mesh(lvlGeo, lvlMat);
  lvlBg.position.set(0, -4, 9);
  group.add(lvlBg);

  const indicatorGeo = new THREE.PlaneGeometry(weaponLevel + 1, 2);
  const indicatorMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
  indicator.position.set(0, -4, 10);
  group.add(indicator);

  const texResult = createTextTexture(weapon.name, weapon.bulletColor, 6);
  const labelGeo = new THREE.PlaneGeometry(texResult.width, texResult.height);
  const labelMat = new THREE.MeshBasicMaterial({ map: texResult.texture, transparent: true, depthWrite: false });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, -12, 11);
  group.add(label);

  group.position.set(x, y, 0);
  state.scene.add(group);

  state.items.push({
    group,
    glow,
    glowMat,
    boxMat,
    weaponLevel,
    speed: 40,
    alive: true,
    timer: 0,
    texResult,
  });
}

export function createPowerup(x, y, powerupIndex) {
  const config = POWERUPS[powerupIndex];

  const group = new THREE.Group();

  const boxGeo = new THREE.PlaneGeometry(14, 14);
  const boxMat = new THREE.MeshBasicMaterial({ color: config.color, transparent: true, opacity: 0.9 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.z = 8;
  group.add(box);

  const glowGeo = new THREE.PlaneGeometry(18, 18);
  const glowMat = new THREE.MeshBasicMaterial({ color: config.color, transparent: true, opacity: 0.3 });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.z = 7;
  group.add(glow);

  const borderGeo = new THREE.PlaneGeometry(16, 16);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.4 });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.z = 9;
  group.add(border);

  const texResult = createTextTexture(config.name, config.color, 6);
  const labelGeo = new THREE.PlaneGeometry(texResult.width, texResult.height);
  const labelMat = new THREE.MeshBasicMaterial({ map: texResult.texture, transparent: true, depthWrite: false });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, -12, 11);
  group.add(label);

  group.position.set(x, y, 0);
  state.scene.add(group);

  state.powerups.push({
    group,
    glowMat,
    boxMat,
    powerupIndex,
    type: config.type,
    speed: 35,
    alive: true,
    timer: 0,
    texResult,
  });
}

export function updateItems(dt) {
  processPendingDrops();

  for (let i = state.items.length - 1; i >= 0; i--) {
    const item = state.items[i];
    if (!item.alive) {
      if (item.texResult) disposeTextTexture(item.texResult);
      state.scene.remove(item.group);
      state.items.splice(i, 1);
      continue;
    }

    item.group.position.y -= item.speed * dt;
    item.timer += dt;

    const pulse = 0.5 + Math.sin(item.timer * 6) * 0.3;
    item.glowMat.opacity = pulse * 0.3;
    item.boxMat.opacity = 0.6 + pulse * 0.4;

    spawnItemSparkle(item.group.position.x, item.group.position.y, item.timer);

    const dx = Math.abs(item.group.position.x - state.playerX);
    const dy = Math.abs(item.group.position.y - PLAYER_Y);
    if (dx < 16 && dy < 20) {
      pickupItem(item);
      item.alive = false;
      if (item.texResult) disposeTextTexture(item.texResult);
      state.scene.remove(item.group);
      state.items.splice(i, 1);
      continue;
    }

    if (item.group.position.y < DEATH_LINE_Y - 20) {
      item.alive = false;
      if (item.texResult) disposeTextTexture(item.texResult);
      state.scene.remove(item.group);
      state.items.splice(i, 1);
    }
  }

  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const pu = state.powerups[i];
    if (!pu.alive) {
      if (pu.texResult) disposeTextTexture(pu.texResult);
      state.scene.remove(pu.group);
      state.powerups.splice(i, 1);
      continue;
    }

    pu.group.position.y -= pu.speed * dt;
    pu.timer += dt;

    const pulse = 0.5 + Math.sin(pu.timer * 8) * 0.4;
    pu.glowMat.opacity = pulse * 0.4;
    pu.boxMat.opacity = 0.6 + pulse * 0.4;

    spawnItemSparkle(pu.group.position.x, pu.group.position.y, pu.timer);

    const dx = Math.abs(pu.group.position.x - state.playerX);
    const dy = Math.abs(pu.group.position.y - PLAYER_Y);
    if (dx < 16 && dy < 20) {
      activatePowerup(pu);
      pu.alive = false;
      if (pu.texResult) disposeTextTexture(pu.texResult);
      state.scene.remove(pu.group);
      state.powerups.splice(i, 1);
      continue;
    }

    if (pu.group.position.y < DEATH_LINE_Y - 20) {
      pu.alive = false;
      if (pu.texResult) disposeTextTexture(pu.texResult);
      state.scene.remove(pu.group);
      state.powerups.splice(i, 1);
    }
  }

  updatePowerupTimers(dt);
}

function processPendingDrops() {
  while (state.pendingDrops.length > 0) {
    const drop = state.pendingDrops.shift();
    tryDropItem(drop.x, drop.y, drop.level);
  }
}

function pickupItem(item) {
  const weaponLevel = item.weaponLevel;
  if (state.tempWeaponActive) {
    if (weaponLevel > state.savedWeaponIndex) {
      state.savedWeaponIndex = state.savedWeaponIndex + 1;
      state.weaponsUsed.add(state.savedWeaponIndex);
      spawnPickupParticles(state.playerX, PLAYER_Y);
      playPickup();
    }
    return;
  }
  if (weaponLevel > state.currentWeaponIndex) {
    state.currentWeaponIndex = weaponLevel;
    updateGunAppearance();
    state.weaponsUsed.add(weaponLevel);
    spawnPickupParticles(state.playerX, PLAYER_Y);
    playPickup();
  }
}

function activatePowerup(pu) {
  const config = POWERUPS[pu.powerupIndex];
  playPowerup();
  spawnPickupParticles(state.playerX, PLAYER_Y);

  switch (config.type) {
    case 'shield':
      state.shieldActive = true;
      state.shieldTimer = config.duration;
      if (!state.shieldMesh) {
        const shieldGeo = new THREE.PlaneGeometry(PLAYER_WIDTH + 12, PLAYER_HEIGHT + 12);
        const shieldMat = new THREE.MeshBasicMaterial({ color: 0x44AAFF, transparent: true, opacity: 0.3 });
        state.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        state.shieldMesh.position.z = 4;
        state.playerGroup.add(state.shieldMesh);
      }
      break;
    case 'slowtime':
      state.slowTimeActive = true;
      state.slowTimeTimer = config.duration;
      break;
    case 'double':
      state.doubleScoreActive = true;
      state.doubleScoreTimer = config.duration;
      break;
    case 'clear':
      clearAllObstacles();
      break;
    case 'tempweapon':
      state.tempWeaponActive = true;
      state.tempWeaponTimer = config.duration;
      state.savedWeaponIndex = state.currentWeaponIndex;
      state.currentWeaponIndex = Math.min(state.currentWeaponIndex + 3, WEAPONS.length - 1);
      updateGunAppearance();
      break;
    case 'clone':
      state.cloneActive = true;
      state.cloneTimer = config.duration;
      createClone();
      break;
  }
}

function clearAllObstacles() {
  for (const obs of state.obstacles) {
    if (obs.alive) {
      obs.hp = 0;
      obs.alive = false;
    }
  }
  state.clearPending = true;
  spawnExtraExplosion(0, 0, 60, 0xFFFFFF);
  triggerScreenShake(3.0);
}

function updatePowerupTimers(dt) {
  if (state.shieldActive) {
    state.shieldTimer -= dt;
    if (state.shieldTimer <= 0) {
      state.shieldActive = false;
      state.shieldTimer = 0;
      if (state.shieldMesh) {
        state.playerGroup.remove(state.shieldMesh);
        state.shieldMesh.geometry.dispose();
        state.shieldMesh.material.dispose();
        state.shieldMesh = null;
      }
    } else if (state.shieldMesh) {
      const blink = state.shieldTimer < 2 ? (Math.sin(state.shieldTimer * 10) > 0 ? 0.3 : 0.1) : 0.3;
      state.shieldMesh.material.opacity = blink;
    }
  }

  if (state.slowTimeActive) {
    state.slowTimeTimer -= dt;
    if (state.slowTimeTimer <= 0) {
      state.slowTimeActive = false;
      state.slowTimeTimer = 0;
    }
  }

  if (state.doubleScoreActive) {
    state.doubleScoreTimer -= dt;
    if (state.doubleScoreTimer <= 0) {
      state.doubleScoreActive = false;
      state.doubleScoreTimer = 0;
    }
  }

  if (state.tempWeaponActive) {
    state.tempWeaponTimer -= dt;
    if (state.tempWeaponTimer <= 0) {
      state.tempWeaponActive = false;
      state.tempWeaponTimer = 0;
      state.currentWeaponIndex = state.savedWeaponIndex;
      updateGunAppearance();
    }
  }

  if (state.cloneActive) {
    state.cloneTimer -= dt;
    if (state.cloneTimer <= 0) {
      state.cloneActive = false;
      state.cloneTimer = 0;
      removeClone();
    }
  }
}

function createClone() {
  const group = new THREE.Group();

  const bodyGeo = new THREE.PlaneGeometry(PLAYER_WIDTH, PLAYER_HEIGHT);
  const bodyMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.5 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.z = 5;
  group.add(body);

  const headGeo = new THREE.PlaneGeometry(12, 10);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xffcc88, transparent: true, opacity: 0.5 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, PLAYER_HEIGHT / 2 - 2, 6);
  group.add(head);

  const eyeGeo = new THREE.PlaneGeometry(2, 2);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-3, PLAYER_HEIGHT / 2 - 1, 7);
  group.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(3, PLAYER_HEIGHT / 2 - 1, 7);
  group.add(rightEye);

  const gunGeo = new THREE.PlaneGeometry(4, 10);
  const gunMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });
  const gun = new THREE.Mesh(gunGeo, gunMat);
  gun.position.set(4, PLAYER_HEIGHT / 2 + 3, 6);
  group.add(gun);

  const oppositeX = state.currentChannel === 'left' ? CHANNEL_RIGHT_X : CHANNEL_LEFT_X;
  group.position.set(oppositeX, PLAYER_Y, 0);
  state.scene.add(group);

  state.cloneGroup = group;
  state.cloneBullets = [];
}

function removeClone() {
  if (state.cloneGroup) {
    state.scene.remove(state.cloneGroup);
    state.cloneGroup.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    state.cloneGroup = null;
  }
  for (let i = state.cloneBullets.length - 1; i >= 0; i--) {
    const b = state.cloneBullets[i];
    state.scene.remove(b.mesh);
    b.mesh.geometry.dispose();
    b.mesh.material.dispose();
  }
  state.cloneBullets.length = 0;
}

export function resetItems() {
  for (const item of state.items) {
    if (item.group) state.scene.remove(item.group);
    if (item.texResult) disposeTextTexture(item.texResult);
  }
  state.items.length = 0;

  for (const pu of state.powerups) {
    if (pu.group) state.scene.remove(pu.group);
    if (pu.texResult) disposeTextTexture(pu.texResult);
  }
  state.powerups.length = 0;

  state.pendingDrops.length = 0;

  state.shieldActive = false;
  state.shieldTimer = 0;
  if (state.shieldMesh) {
    state.playerGroup.remove(state.shieldMesh);
    state.shieldMesh.geometry.dispose();
    state.shieldMesh.material.dispose();
    state.shieldMesh = null;
  }

  state.slowTimeActive = false;
  state.slowTimeTimer = 0;

  state.doubleScoreActive = false;
  state.doubleScoreTimer = 0;

  state.tempWeaponActive = false;
  state.tempWeaponTimer = 0;
  state.savedWeaponIndex = 0;

  state.cloneActive = false;
  state.cloneTimer = 0;
  removeClone();
}
