import * as THREE from 'three';
import { state } from './state.js';
import {
  WEAPONS, BULLET_SPEED, MAX_BULLETS,
  CHANNEL_LEFT_X, CHANNEL_RIGHT_X, CHANNEL_WIDTH,
  PLAYER_Y, PLAYER_HEIGHT, GAME_HEIGHT
} from './config.js';
import { playGunShot, playHitSound, playDestroySound } from './audio.js';
import { spawnHitParticles, spawnDamageText, spawnDestroyParticles, spawnMuzzleFlash, spawnExtraExplosion, triggerScreenShake } from './effects.js';
import { addScore, addCombo } from './score.js';
import { removeObstacleFromScene } from './obstacles.js';

export function updateWeapons(dt) {
  if (!state.gameActive) return;

  const weapon = WEAPONS[state.currentWeaponIndex];

  if (weapon.type !== 'beam' && beamMesh) {
    cleanupBeam();
  }

  if (weapon.type === 'beam') {
    updateBeam(dt, weapon);
    updateCloneBeam(dt, weapon);
    updateBullets(dt);
    updateCloneBullets(dt);
    return;
  }

  state.fireTimer += dt;
  const fireInterval = 1 / weapon.fireRate;

  if (state.fireTimer >= fireInterval) {
    state.fireTimer -= fireInterval;
    fireBullets(weapon);
  }

  updateBullets(dt);
  updateCloneBullets(dt);
}

function fireBullets(weapon) {
  const playerX = state.playerX;
  const bulletY = PLAYER_Y + PLAYER_HEIGHT / 2 + 5;

  playGunShot(state.currentWeaponIndex);
  spawnMuzzleFlash(playerX, bulletY);

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
      const pelletCount = 5;
      const spreadDeg = weapon.spreadAngle;
      for (let i = 0; i < pelletCount; i++) {
        const t = pelletCount > 1 ? (i / (pelletCount - 1)) * 2 - 1 : 0;
        const angleOffset = t * spreadDeg + (Math.random() - 0.5) * 3;
        createBullet(playerX, bulletY, angleOffset, weapon);
      }
      break;
    }
  }

  fireCloneBullets(weapon);
}

function createBullet(x, y, angleDeg, weapon) {
  if (state.bullets.length >= MAX_BULLETS) return;

  const size = weapon.bulletSize;
  const bulletH = weapon.type === 'pierce' ? size * 3 : (weapon.type === 'beam' ? size * 4 : size * 1.5);
  const geo = new THREE.PlaneGeometry(size, bulletH);
  const bulletColor = state.tempWeaponActive ? 0xFF6600 : weapon.bulletColor;
  const mat = new THREE.MeshBasicMaterial({ color: bulletColor });
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
    hitObstacles: new Set(),
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
      if (b.hitObstacles.has(obs)) continue;
      const sameChannel = (obs.channel === 'left' && b.mesh.position.x < 0) ||
                          (obs.channel === 'right' && b.mesh.position.x >= 0);
      if (!sameChannel) continue;
      const dy = Math.abs(b.mesh.position.y - obs.mesh.position.y);
      if (dy < obs.height / 2 + 4) {
        b.hitObstacles.add(obs);
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

function fireCloneBullets(weapon) {
  if (!state.cloneActive) return;
  const oppositeX = state.currentChannel === 'left' ? CHANNEL_RIGHT_X : CHANNEL_LEFT_X;
  const bulletY = PLAYER_Y + PLAYER_HEIGHT / 2 + 5;

  if (state.cloneBullets.length >= MAX_BULLETS) return;

  switch (weapon.type) {
    case 'single':
    case 'pierce':
    case 'explosive':
      createCloneBullet(oppositeX, bulletY, 0, weapon);
      break;
    case 'dual':
      createCloneBullet(oppositeX - 5, bulletY, 0, weapon);
      createCloneBullet(oppositeX + 5, bulletY, 0, weapon);
      break;
    case 'spread':
    case 'rapid': {
      const spreadDeg = weapon.spreadAngle;
      const angleOffset = (Math.random() - 0.5) * spreadDeg * 2;
      createCloneBullet(oppositeX, bulletY, angleOffset, weapon);
      break;
    }
    case 'shotgun': {
      const pelletCount = 5;
      const spreadDeg = weapon.spreadAngle;
      for (let i = 0; i < pelletCount; i++) {
        const t = pelletCount > 1 ? (i / (pelletCount - 1)) * 2 - 1 : 0;
        const angleOffset = t * spreadDeg + (Math.random() - 0.5) * 3;
        createCloneBullet(oppositeX, bulletY, angleOffset, weapon);
      }
      break;
    }
  }
}

function createCloneBullet(x, y, angleDeg, weapon) {
  if (state.cloneBullets.length >= MAX_BULLETS) return;
  const size = weapon.bulletSize;
  const geo = new THREE.PlaneGeometry(size, size * 1.5);
  const mat = new THREE.MeshBasicMaterial({ color: 0x00FFAA, transparent: true, opacity: 0.7 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, 10);
  state.scene.add(mesh);

  const angleRad = (angleDeg * Math.PI) / 180;
  const vx = Math.sin(angleRad) * BULLET_SPEED;
  const vy = Math.cos(angleRad) * BULLET_SPEED;

  state.cloneBullets.push({
    mesh,
    vx,
    vy,
    damage: weapon.damage,
    alive: true,
  });
}

function updateCloneBullets(dt) {
  if (!state.cloneActive) return;

  const oppositeX = state.currentChannel === 'left' ? CHANNEL_RIGHT_X : CHANNEL_LEFT_X;
  if (state.cloneGroup) {
    state.cloneGroup.position.x = oppositeX;
    const blink = state.cloneTimer < 3 ? (Math.sin(state.cloneTimer * 10) > 0 ? 0.5 : 0.2) : 0.5;
    state.cloneGroup.children.forEach(child => {
      if (child.material) child.material.opacity = blink;
    });
  }

  const weapon = WEAPONS[state.currentWeaponIndex];

  for (let i = state.cloneBullets.length - 1; i >= 0; i--) {
    const b = state.cloneBullets[i];
    b.mesh.position.x += b.vx * dt;
    b.mesh.position.y += b.vy * dt;

    if (b.mesh.position.y > GAME_HEIGHT / 2 + 20) {
      state.scene.remove(b.mesh);
      b.mesh.geometry.dispose();
      b.mesh.material.dispose();
      state.cloneBullets.splice(i, 1);
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
        obs.hp -= b.damage;
        obs.flashTimer = 0.1;
        obs.hitScale = 1.08;
        playHitSound(obs.materialType);
        spawnHitParticles(b.mesh.position.x, b.mesh.position.y, obs.materialType, obs.colorHex);
        spawnDamageText(b.mesh.position.x, b.mesh.position.y + obs.height / 2, b.damage, 0x00FFAA);
        if (obs.hp <= 0) {
          destroyObstacle(obs);
        }
        hit = true;
        break;
      }
    }
    if (hit) {
      state.scene.remove(b.mesh);
      b.mesh.geometry.dispose();
      b.mesh.material.dispose();
      state.cloneBullets.splice(i, 1);
    }
  }
}

function getDamageColor(damage, weaponLevel) {
  if (damage >= 50) return 0xFF4444;
  if (damage >= 30) return 0xFFAA00;
  if (weaponLevel >= 7) return 0x00CCFF;
  if (state.combo >= 20) return 0xFF44FF;
  if (state.combo >= 10) return 0x00CCFF;
  if (state.combo >= 5) return 0x00FF88;
  return 0xFFFFFF;
}

export function hitObstacle(obs, bullet) {
  obs.hp -= bullet.damage;
  obs.flashTimer = 0.1;
  obs.hitScale = 1.08;

  playHitSound(obs.materialType);
  spawnHitParticles(bullet.mesh.position.x, bullet.mesh.position.y, obs.materialType, obs.colorHex);

  const dmgColor = getDamageColor(bullet.damage, bullet.weaponLevel);
  spawnDamageText(bullet.mesh.position.x, bullet.mesh.position.y + obs.height / 2, bullet.damage, dmgColor);

  if (bullet.explosive && bullet.explosionRadius > 0) {
    for (const other of state.obstacles) {
      if (other === obs || !other.alive) continue;
      const dx = Math.abs(bullet.mesh.position.x - other.mesh.position.x);
      const dy = Math.abs(bullet.mesh.position.y - other.mesh.position.y);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bullet.explosionRadius) {
        const splashDmg = Math.floor(bullet.damage * 0.7);
        other.hp -= splashDmg;
        other.flashTimer = 0.1;
        other.hitScale = 1.05;
        const splashColor = getDamageColor(splashDmg, bullet.weaponLevel);
        spawnDamageText(other.mesh.position.x, other.mesh.position.y + other.height / 2, splashDmg, splashColor);
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

  if (obs.level === 4) {
    spawnExtraExplosion(obs.mesh.position.x, obs.mesh.position.y, 20, 0xFF6600);
    triggerScreenShake(1.5);
  } else if (obs.level === 8) {
    spawnExtraExplosion(obs.mesh.position.x, obs.mesh.position.y, 25, 0xFF4400);
    triggerScreenShake(2.5);
  } else if (obs.level === 9) {
    spawnExtraExplosion(obs.mesh.position.x, obs.mesh.position.y, 30, 0x88FF44);
    triggerScreenShake(2.0);
  } else if (obs.level === 10) {
    spawnExtraExplosion(obs.mesh.position.x, obs.mesh.position.y, 35, 0x8888FF);
    triggerScreenShake(3.0);
  } else if (obs.level >= 6) {
    triggerScreenShake(1.0);
  }

  addScore(obs.score);
  addCombo();

  state.pendingDrops.push({ x: obs.mesh.position.x, y: obs.mesh.position.y, level: obs.level });

  if (obs.level >= state.maxObstacleLevel) {
    state.destroyedAtCurrentLevel++;
    const threshold = 3 + state.maxObstacleLevel * 2;
    if (state.destroyedAtCurrentLevel >= threshold && state.maxObstacleLevel < 9) {
      state.maxObstacleLevel++;
      state.destroyedAtCurrentLevel = 0;
    }
  }

  removeObstacleFromScene(obs);
}

function spawnExplosionEffect(x, y) {
  const geo = new THREE.PlaneGeometry(10, 10);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.8 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, 15);
  state.scene.add(mesh);
  state.effects.push({ mesh, mat, type: 'explosion', timer: 0, duration: 0.3 });
  triggerScreenShake(2.0);
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
    const beamColor = state.tempWeaponActive ? 0xFF6600 : weapon.bulletColor;
    beamMat = new THREE.MeshBasicMaterial({ color: beamColor, transparent: true, opacity: 0.7 });
    const geo = new THREE.PlaneGeometry(4, beamHeight);
    beamMesh = new THREE.Mesh(geo, beamMat);
    beamMesh.position.set(playerX, beamY + beamHeight / 2, 10);
    state.scene.add(beamMesh);
  }

  beamMesh.position.x = playerX;
  beamMesh.visible = state.gameActive;

  if (state.tempWeaponActive && beamMat) {
    beamMat.color.set(0xFF6600);
  }

  if (!state.gameActive) return;

  let closestObs = null;
  let closestDist = Infinity;
  for (const obs of state.obstacles) {
    if (!obs.alive) continue;
    const sameChannel = (obs.channel === 'left' && playerX < 0) ||
                        (obs.channel === 'right' && playerX >= 0);
    if (!sameChannel) continue;
    const dist = Math.abs(obs.mesh.position.y - PLAYER_Y);
    if (dist < closestDist) {
      closestDist = dist;
      closestObs = obs;
    }
  }

  if (closestObs) {
    closestObs.hp -= weapon.damage * dt * 60;
    closestObs.flashTimer = 0.05;
    if (closestObs.hp <= 0) {
      destroyObstacle(closestObs);
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
  if (cloneBeamMesh) {
    state.scene.remove(cloneBeamMesh);
    cloneBeamMesh.geometry.dispose();
    cloneBeamMesh.material.dispose();
    cloneBeamMesh = null;
    cloneBeamMat = null;
  }
}

let cloneBeamMesh = null;
let cloneBeamMat = null;

function updateCloneBeam(dt, weapon) {
  if (!state.cloneActive) {
    if (cloneBeamMesh) {
      state.scene.remove(cloneBeamMesh);
      cloneBeamMesh.geometry.dispose();
      cloneBeamMesh.material.dispose();
      cloneBeamMesh = null;
      cloneBeamMat = null;
    }
    return;
  }

  const oppositeX = state.currentChannel === 'left' ? CHANNEL_RIGHT_X : CHANNEL_LEFT_X;
  const beamY = PLAYER_Y + PLAYER_HEIGHT / 2;
  const beamHeight = GAME_HEIGHT;

  if (!cloneBeamMesh) {
    cloneBeamMat = new THREE.MeshBasicMaterial({ color: 0x00FFAA, transparent: true, opacity: 0.5 });
    const geo = new THREE.PlaneGeometry(4, beamHeight);
    cloneBeamMesh = new THREE.Mesh(geo, cloneBeamMat);
    cloneBeamMesh.position.set(oppositeX, beamY + beamHeight / 2, 10);
    state.scene.add(cloneBeamMesh);
  }

  cloneBeamMesh.position.x = oppositeX;
  cloneBeamMesh.visible = state.gameActive;

  if (state.cloneGroup) {
    state.cloneGroup.position.x = oppositeX;
    const blink = state.cloneTimer < 3 ? (Math.sin(state.cloneTimer * 10) > 0 ? 0.5 : 0.2) : 0.5;
    state.cloneGroup.children.forEach(child => {
      if (child.material) child.material.opacity = blink;
    });
  }

  if (!state.gameActive) return;

  let closestObs = null;
  let closestDist = Infinity;
  for (const obs of state.obstacles) {
    if (!obs.alive) continue;
    const sameChannel = (obs.channel === 'left' && oppositeX < 0) ||
                        (obs.channel === 'right' && oppositeX >= 0);
    if (!sameChannel) continue;
    const dist = Math.abs(obs.mesh.position.y - PLAYER_Y);
    if (dist < closestDist) {
      closestDist = dist;
      closestObs = obs;
    }
  }

  if (closestObs) {
    closestObs.hp -= weapon.damage * dt * 60;
    closestObs.flashTimer = 0.05;
    if (closestObs.hp <= 0) {
      destroyObstacle(closestObs);
    }
  }
}

export function resetWeapons() {
  while (state.bullets.length > 0) {
    removeBullet(0);
  }
  cleanupBeam();
  state.fireTimer = 0;
}
