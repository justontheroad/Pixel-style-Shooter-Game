import * as THREE from 'three';
import { state } from './state.js';
import {
  WEAPONS, POWERUPS, POWERUP_DROP_RATE,
  PLAYER_Y, PLAYER_HEIGHT, PLAYER_WIDTH,
  DEATH_LINE_Y, GAME_WIDTH, GAME_HEIGHT
} from './config.js';
import { updateGunAppearance } from './player.js';
import { spawnPickupParticles, spawnItemSparkle, spawnExtraExplosion, triggerScreenShake } from './effects.js';
import { playPickup, playPowerup } from './audio.js';

export function tryDropItem(x, y, obstacleLevel) {
  const stage = state.currentStage;
  if (!stage) return;

  if (Math.random() > stage.itemDropRate) return;

  if (Math.random() < POWERUP_DROP_RATE) {
    const powerupIndex = Math.floor(Math.random() * POWERUPS.length);
    createPowerup(x, y, powerupIndex);
    return;
  }

  const minLevel = stage.itemLevelMin;
  const maxLevel = stage.itemLevelMax;
  const weaponLevel = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));

  if (weaponLevel <= state.currentWeaponIndex) return;

  createItem(x, y, weaponLevel);
}

function createItem(x, y, weaponLevel) {
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
  });
}

function createPowerup(x, y, powerupIndex) {
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
  });
}

export function updateItems(dt) {
  for (let i = state.items.length - 1; i >= 0; i--) {
    const item = state.items[i];
    if (!item.alive) {
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
      state.scene.remove(item.group);
      state.items.splice(i, 1);
      continue;
    }

    if (item.group.position.y < DEATH_LINE_Y - 20) {
      item.alive = false;
      state.scene.remove(item.group);
      state.items.splice(i, 1);
    }
  }

  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const pu = state.powerups[i];
    if (!pu.alive) {
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
      state.scene.remove(pu.group);
      state.powerups.splice(i, 1);
      continue;
    }

    if (pu.group.position.y < DEATH_LINE_Y - 20) {
      pu.alive = false;
      state.scene.remove(pu.group);
      state.powerups.splice(i, 1);
    }
  }

  updatePowerupTimers(dt);
}

function pickupItem(item) {
  const weaponLevel = item.weaponLevel;
  if (weaponLevel > state.currentWeaponIndex) {
    state.currentWeaponIndex = weaponLevel;
    updateGunAppearance();
    state.weaponsUsed.add(weaponLevel);
    spawnPickupParticles(state.playerX, PLAYER_Y);
    playPickup();
    showWeaponPopup(WEAPONS[weaponLevel].name, weaponLevel);
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
  }

  showPowerupPopup(config.name, config.color);
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
}

function showWeaponPopup(name, level) {
  const weapon = WEAPONS[level];
  const group = new THREE.Group();

  const bgGeo = new THREE.PlaneGeometry(60, 12);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.7 });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  bg.position.z = 25;
  group.add(bg);

  const borderGeo = new THREE.PlaneGeometry(62, 14);
  const borderMat = new THREE.MeshBasicMaterial({ color: weapon.bulletColor, transparent: true, opacity: 0.5 });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.z = 24;
  group.add(border);

  group.position.set(state.playerX, PLAYER_Y + 30, 0);
  state.scene.add(group);

  state.effects.push({ mesh: group, mat: bgMat, type: 'popup', timer: 0, duration: 1.5 });
}

function showPowerupPopup(name, color) {
  const group = new THREE.Group();

  const bgGeo = new THREE.PlaneGeometry(60, 12);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.7 });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  bg.position.z = 25;
  group.add(bg);

  const borderGeo = new THREE.PlaneGeometry(62, 14);
  const borderMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.z = 24;
  group.add(border);

  group.position.set(state.playerX, PLAYER_Y + 30, 0);
  state.scene.add(group);

  state.effects.push({ mesh: group, mat: bgMat, type: 'popup', timer: 0, duration: 1.5 });
}

export function resetItems() {
  for (const item of state.items) {
    if (item.group) state.scene.remove(item.group);
  }
  state.items.length = 0;

  for (const pu of state.powerups) {
    if (pu.group) state.scene.remove(pu.group);
  }
  state.powerups.length = 0;

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
}
