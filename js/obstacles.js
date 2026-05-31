import * as THREE from 'three';
import { state } from './state.js';
import {
  OBSTACLES,
  CHANNEL_LEFT_X, CHANNEL_RIGHT_X,
  DEATH_LINE_Y, SPAWN_LINE_Y, CHANNEL_WIDTH,
  PLAYER_Y, PLAYER_WIDTH, PLAYER_HEIGHT,
  getDifficultyStage
} from './config.js';
import { resetCombo } from './score.js';

export function spawnObstacle() {
  const stage = state.currentStage || getDifficultyStage(0);
  const levelIndex = stage.levelMin + Math.floor(Math.random() * (stage.levelMax - stage.levelMin + 1));
  const obsConfig = OBSTACLES[levelIndex];

  let channel = Math.random() < 0.5 ? 'left' : 'right';
  if (stage.sameChannelOnly) {
    channel = state.currentChannel;
  }
  const channelX = channel === 'left' ? CHANNEL_LEFT_X : CHANNEL_RIGHT_X;

  const x = channelX + (Math.random() - 0.5) * Math.min(30, CHANNEL_WIDTH - obsConfig.width - 4);

  const y = SPAWN_LINE_Y;

  const geo = new THREE.PlaneGeometry(obsConfig.width, obsConfig.height);
  const mat = new THREE.MeshBasicMaterial({ color: obsConfig.color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, 5);
  state.scene.add(mesh);

  const innerGeo = new THREE.PlaneGeometry(obsConfig.width - 4, obsConfig.height - 4);
  const innerMat = new THREE.MeshBasicMaterial({ color: darkenColor(obsConfig.color, 0.7) });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  innerMesh.position.z = 6;
  mesh.add(innerMesh);

  addObstacleDetails(mesh, obsConfig);

  const hpBarBgGeo = new THREE.PlaneGeometry(obsConfig.width, 3);
  const hpBarBgMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
  const hpBarBg = new THREE.Mesh(hpBarBgGeo, hpBarBgMat);
  hpBarBg.position.set(x, y + obsConfig.height / 2 + 4, 8);
  state.scene.add(hpBarBg);

  const hpBarGeo = new THREE.PlaneGeometry(obsConfig.width, 3);
  const hpBarMat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
  const hpBar = new THREE.Mesh(hpBarGeo, hpBarMat);
  hpBar.position.set(x, y + obsConfig.height / 2 + 4, 9);
  state.scene.add(hpBar);

  const obstacle = {
    mesh,
    innerMesh,
    hpBar,
    hpBarBg,
    hp: obsConfig.hp,
    maxHp: obsConfig.hp,
    width: obsConfig.width,
    height: obsConfig.height,
    speed: obsConfig.speed * stage.speedMult,
    score: obsConfig.score,
    level: levelIndex,
    materialType: obsConfig.material,
    colorHex: obsConfig.color,
    channel,
    alive: true,
    flashTimer: 0,
    hitScale: 1,
    originalColor: obsConfig.color,
  };

  state.obstacles.push(obstacle);
  return obstacle;
}

function darkenColor(hex, factor) {
  const r = ((hex >> 16) & 0xff) * factor;
  const g = ((hex >> 8) & 0xff) * factor;
  const b = (hex & 0xff) * factor;
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

function addObstacleDetails(mesh, config) {
  const detailMat = new THREE.MeshBasicMaterial({ color: darkenColor(config.color, 0.5) });
  const highlightMat = new THREE.MeshBasicMaterial({ color: lightenColor(config.color, 1.3) });

  switch (config.material) {
    case 'wood': {
      const lineGeo = new THREE.PlaneGeometry(config.width - 6, 1);
      for (let i = -2; i <= 2; i += 2) {
        const line = new THREE.Mesh(lineGeo, detailMat);
        line.position.set(0, i, 7);
        mesh.add(line);
      }
      break;
    }
    case 'stone': {
      const crackGeo = new THREE.PlaneGeometry(2, 1);
      for (let i = 0; i < 3; i++) {
        const crack = new THREE.Mesh(crackGeo, detailMat);
        crack.position.set(-4 + i * 4, -2 + i * 3, 7);
        mesh.add(crack);
      }
      break;
    }
    case 'metal': {
      const boltGeo = new THREE.PlaneGeometry(2, 2);
      const boltMat = new THREE.MeshBasicMaterial({ color: 0xCCCCCC });
      const positions = [
        [-config.width / 2 + 4, -config.height / 2 + 4],
        [config.width / 2 - 4, -config.height / 2 + 4],
        [-config.width / 2 + 4, config.height / 2 - 4],
        [config.width / 2 - 4, config.height / 2 - 4],
      ];
      for (const [bx, by] of positions) {
        const bolt = new THREE.Mesh(boltGeo, boltMat);
        bolt.position.set(bx, by, 7);
        mesh.add(bolt);
      }
      if (config.level >= 9) {
        const starGeo = new THREE.PlaneGeometry(4, 4);
        const starMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.set(0, 0, 8);
        mesh.add(star);
      }
      break;
    }
    case 'cloth': {
      const crossGeo = new THREE.PlaneGeometry(config.width - 8, 2);
      const crossVGeo = new THREE.PlaneGeometry(2, config.height - 8);
      const cross1 = new THREE.Mesh(crossGeo, highlightMat);
      cross1.position.z = 7;
      mesh.add(cross1);
      const cross2 = new THREE.Mesh(crossVGeo, highlightMat);
      cross2.position.z = 7;
      mesh.add(cross2);
      break;
    }
  }
}

function lightenColor(hex, factor) {
  const r = Math.min(255, ((hex >> 16) & 0xff) * factor);
  const g = Math.min(255, ((hex >> 8) & 0xff) * factor);
  const b = Math.min(255, (hex & 0xff) * factor);
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

export function updateObstacles(dt) {
  const stage = state.currentStage || getDifficultyStage(0);

  state.spawnTimer += dt;
  if (state.spawnTimer >= stage.spawnInterval && state.obstacles.filter(o => o.alive).length < stage.maxObstacles) {
    state.spawnTimer = 0;
    spawnObstacle();
  }

  for (let i = state.obstacles.length - 1; i >= 0; i--) {
    const obs = state.obstacles[i];
    if (!obs.alive) {
      removeObstacleFromScene(obs);
      state.obstacles.splice(i, 1);
      continue;
    }

    obs.mesh.position.y -= obs.speed * dt;

    if (obs.hpBar) {
      obs.hpBar.position.y = obs.mesh.position.y + obs.height / 2 + 4;
      const hpRatio = Math.max(0, obs.hp / obs.maxHp);
      obs.hpBar.scale.x = Math.max(0.01, hpRatio);
      const barWidth = obs.width * hpRatio;
      obs.hpBar.position.x = obs.mesh.position.x - obs.width / 2 + barWidth / 2;

      if (hpRatio > 0.5) {
        obs.hpBar.material.color.set(0x00ff44);
      } else if (hpRatio > 0.25) {
        obs.hpBar.material.color.set(0xffcc00);
      } else {
        obs.hpBar.material.color.set(0xff2200);
      }
    }
    if (obs.hpBarBg) {
      obs.hpBarBg.position.y = obs.mesh.position.y + obs.height / 2 + 4;
      obs.hpBarBg.position.x = obs.mesh.position.x;
    }

    if (obs.flashTimer > 0) {
      obs.flashTimer -= dt;
      obs.mesh.material.color.set(0xffffff);
    } else {
      obs.mesh.material.color.set(obs.originalColor);
    }

    if (obs.hitScale > 1) {
      obs.hitScale = Math.max(1, obs.hitScale - dt * 4);
      obs.mesh.scale.setScalar(obs.hitScale);
    }

    if (obs.mesh.position.y - obs.height / 2 <= DEATH_LINE_Y) {
      if (state.shieldActive) {
        obs.alive = false;
        obs.shieldBlocked = true;
        continue;
      }
      resetCombo();
      obs.alive = false;
      removeObstacleFromScene(obs);
      state.obstacles.splice(i, 1);
      return 'gameover';
    }

    const dx = Math.abs(obs.mesh.position.x - state.playerX);
    const dy = Math.abs(obs.mesh.position.y - PLAYER_Y);
    if (dx < (obs.width / 2 + PLAYER_WIDTH / 2) && dy < (obs.height / 2 + PLAYER_HEIGHT / 2)) {
      if (state.shieldActive) {
        obs.alive = false;
        obs.shieldBlocked = true;
        continue;
      }
      obs.alive = false;
      removeObstacleFromScene(obs);
      state.obstacles.splice(i, 1);
      return 'gameover';
    }
  }

  return null;
}

export function removeObstacleFromScene(obs) {
  if (obs.mesh) {
    state.scene.remove(obs.mesh);
    obs.mesh.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    if (obs.mesh.geometry) obs.mesh.geometry.dispose();
    if (obs.mesh.material) obs.mesh.material.dispose();
  }
  if (obs.hpBar) {
    state.scene.remove(obs.hpBar);
    if (obs.hpBar.geometry) obs.hpBar.geometry.dispose();
    if (obs.hpBar.material) obs.hpBar.material.dispose();
  }
  if (obs.hpBarBg) {
    state.scene.remove(obs.hpBarBg);
    if (obs.hpBarBg.geometry) obs.hpBarBg.geometry.dispose();
    if (obs.hpBarBg.material) obs.hpBarBg.material.dispose();
  }
}

export function resetObstacles() {
  for (const obs of state.obstacles) {
    removeObstacleFromScene(obs);
  }
  state.obstacles.length = 0;
  state.spawnTimer = 0;
}
