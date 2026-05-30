import * as THREE from 'three';
import { state } from './state.js';
import {
  WEAPONS,
  PLAYER_Y,
  DEATH_LINE_Y
} from './config.js';
import { updateGunAppearance } from './player.js';
import { cleanupBeam } from './weapons.js';

export function tryDropItem(x, y, obstacleLevel) {
  const stage = state.currentStage;
  if (!stage) return;

  if (Math.random() > stage.itemDropRate) return;

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

  const numColor = 0xffffff;
  const numSize = 2;
  const numY = 0;
  const dotGeo = new THREE.PlaneGeometry(numSize, numSize);
  const dotMat = new THREE.MeshBasicMaterial({ color: numColor });
  for (let i = 0; i < Math.min(weaponLevel + 1, 5); i++) {
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(-4 + i * 2, numY, 9);
    group.add(dot);
  }

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
}

function pickupItem(item) {
  const weaponLevel = item.weaponLevel;
  if (weaponLevel > state.currentWeaponIndex) {
    if (WEAPONS[state.currentWeaponIndex].type === 'beam') {
      cleanupBeam();
    }
    state.currentWeaponIndex = weaponLevel;
    updateGunAppearance();
    state.weaponsUsed.add(weaponLevel);

    import('./effects.js').then(m => m.spawnPickupParticles(state.playerX, PLAYER_Y));
    import('./audio.js').then(m => m.playPickup());
  }
}

export function resetItems() {
  for (const item of state.items) {
    if (item.group) state.scene.remove(item.group);
  }
  state.items.length = 0;
}
