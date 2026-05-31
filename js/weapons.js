import * as THREE from 'three';
import { state } from './state.js';
import {
  WEAPONS, BULLET_SPEED, MAX_BULLETS,
  CHANNEL_LEFT_X, CHANNEL_RIGHT_X, CHANNEL_WIDTH,
  PLAYER_Y, PLAYER_HEIGHT, GAME_HEIGHT
} from './config.js';
import { playGunShot, playHitSound, playDestroySound } from './audio.js';
import { spawnHitParticles, spawnDamageText, spawnDestroyParticles } from './effects.js';
import { addScore, addCombo } from './score.js';
import { tryDropItem } from './items.js';
import { removeObstacleFromScene } from './obstacles.js';

export function updateWeapons(dt) {
  if (!state.gameActive) return;

  const weapon = WEAPONS[state.currentWeaponIndex];

  if (weapon.type !== 'beam' && beamMesh) {
    cleanupBeam();
  }

  if (weapon.type === 'beam') {
    updateBeam(dt, weapon);
    return;
  }

  state.fireTimer += dt;
  const fireInterval = 1 / weapon.fireRate;

  if (state.fireTimer >= fireInterval) {
    state.fireTimer -= fireInterval;
    fireBullets(weapon);
  }

  updateBullets(dt);
}

function fireBullets(weapon) {
  const playerX = state.playerX;
  const bulletY = PLAYER_Y + PLAYER_HEIGHT / 2 + 5;

  playGunShot(state.currentWeaponIndex);

  switch (weapon.type) {
    case 'single':
    case 'pierce':
    case 'explosive':
      createBullet(playerX, bulletY, 0, weapon);
      break;
    case 'dual':
      createBullet(playerX - 5, bulletY, 0, weapon);
      createBullet(playerX + 5, bulletY, 0, weapon);
      break;
    case 'spread':
    case 'rapid': {
      const spreadDeg = weapon.spreadAngle;
      const angleOffset = (Math.random() - 0.5) * spreadDeg * 2;
      createBullet(playerX, bulletY, angleOffset, weapon);
      break;
    }
    case 'shotgun': {
      for (let i = -1; i <= 1; i++) {
        const angleOffset = i * 10 + (Math.random() - 0.5) * 5;
        createBullet(playerX, bulletY, angleOffset, weapon);
      }
      break;
    }
  }
}

function createBullet(x, y, angleDeg, weapon) {
  if (state.bullets.length >= MAX_BULLETS) return;

  const size = weapon.bulletSize;
  const geo = new THREE.PlaneGeometry(size, size * 1.5);
  const mat = new THREE.MeshBasicMaterial({ color: weapon.bulletColor });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, 10);
  state.scene.add(mesh);

  const angleRad = (angleDeg * Math.PI) / 180;
  const vx = Math.sin(angleRad) * BULLET_SPEED;
  const vy = Math.cos(angleRad) * BULLET_SPEED;

  state.bullets.push({
    mesh,
    vx,
    vy,
    damage: weapon.damage,
    pierceCount: weapon.pierceCount || 0,
    pierced: 0,
    explosive: weapon.type === 'explosive',
    explosionRadius: weapon.explosionRadius || 0,
    weaponLevel: weapon.level,
    alive: true,
  });
}

function updateBullets(dt) {
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.mesh.position.x += b.vx * dt;
    b.mesh.position.y += b.vy * dt;

    if (b.mesh.position.y > GAME_HEIGHT / 2 + 20 || b.mesh.position.x < -150 || b.mesh.position.x > 150) {
      removeBullet(i);
      continue;
    }

    let hit = false;
    for (const obs of state.obstacles) {
      if (!obs.alive) continue;
      const sameChannel = (obs.channel === 'left' && b.mesh.position.x < 0) ||
                          (obs.channel === 'right' && b.mesh.position.x >= 0);
      if (!sameChannel) continue;
      const dy = Math.abs(b.mesh.position.y - obs.mesh.position.y);
      if (dy < obs.height / 2 + 4) {
        hitObstacle(obs, b);
        if (b.pierced < b.pierceCount) {
          b.pierced++;
        } else {
          hit = true;
        }
        break;
      }
    }
    if (hit) {
      removeBullet(i);
    }
  }
}

export function hitObstacle(obs, bullet) {
  obs.hp -= bullet.damage;
  obs.flashTimer = 0.1;

  playHitSound(obs.materialType);
  spawnHitParticles(bullet.mesh.position.x, bullet.mesh.position.y, obs.materialType, obs.colorHex);
  spawnDamageText(bullet.mesh.position.x, bullet.mesh.position.y + obs.height / 2, bullet.damage);

  if (bullet.explosive && bullet.explosionRadius > 0) {
    for (const other of state.obstacles) {
      if (other === obs || !other.alive) continue;
      const dx = Math.abs(bullet.mesh.position.x - other.mesh.position.x);
      const dy = Math.abs(bullet.mesh.position.y - other.mesh.position.y);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bullet.explosionRadius) {
        other.hp -= bullet.damage * 0.5;
        other.flashTimer = 0.1;
        spawnDamageText(other.mesh.position.x, other.mesh.position.y + other.height / 2, Math.floor(bullet.damage * 0.5));
      }
    }
    spawnExplosionEffect(bullet.mesh.position.x, bullet.mesh.position.y);
  }

  if (obs.hp <= 0) {
    destroyObstacle(obs);
  }
}

export function destroyObstacle(obs) {
  obs.alive = false;
  spawnDestroyParticles(obs.mesh.position.x, obs.mesh.position.y, obs.width, obs.height, obs.colorHex, obs.materialType);
  playDestroySound(obs.materialType);

  addScore(obs.score);
  addCombo();
  tryDropItem(obs.mesh.position.x, obs.mesh.position.y, obs.level);

  removeObstacleFromScene(obs);
}

function spawnExplosionEffect(x, y) {
  const geo = new THREE.PlaneGeometry(10, 10);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.8 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, 15);
  state.scene.add(mesh);
  state.effects.push({ mesh, mat, type: 'explosion', timer: 0, duration: 0.3, startX: x, startY: y });
}

export function removeBullet(index) {
  const b = state.bullets[index];
  state.scene.remove(b.mesh);
  b.mesh.geometry.dispose();
  b.mesh.material.dispose();
  state.bullets.splice(index, 1);
}

let beamMesh = null;
let beamMat = null;

function updateBeam(dt, weapon) {
  const playerX = state.playerX;
  const beamY = PLAYER_Y + PLAYER_HEIGHT / 2;
  const beamHeight = GAME_HEIGHT;

  if (!beamMesh) {
    beamMat = new THREE.MeshBasicMaterial({ color: weapon.bulletColor, transparent: true, opacity: 0.7 });
    const geo = new THREE.PlaneGeometry(4, beamHeight);
    beamMesh = new THREE.Mesh(geo, beamMat);
    beamMesh.position.set(playerX, beamY + beamHeight / 2, 10);
    state.scene.add(beamMesh);
  }

  beamMesh.position.x = playerX;
  beamMesh.visible = state.gameActive;

  if (!state.gameActive) return;

  for (const obs of state.obstacles) {
    if (!obs.alive) continue;
    const dx = Math.abs(playerX - obs.mesh.position.x);
    if (dx < CHANNEL_WIDTH / 2) {
      obs.hp -= weapon.damage * dt * 60;
      obs.flashTimer = 0.05;
      if (obs.hp <= 0) {
        destroyObstacle(obs);
      }
    }
  }

  if (Math.random() < 0.1) {
    const py = beamY + Math.random() * beamHeight;
    spawnHitParticles(playerX, py, 'energy', weapon.bulletColor);
  }
}

export function cleanupBeam() {
  if (beamMesh) {
    state.scene.remove(beamMesh);
    beamMesh.geometry.dispose();
    beamMesh.material.dispose();
    beamMesh = null;
    beamMat = null;
  }
}

export function resetWeapons() {
  while (state.bullets.length > 0) {
    removeBullet(0);
  }
  cleanupBeam();
  state.fireTimer = 0;
}
