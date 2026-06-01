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

export function spawnObstacle(levelOverride) {
  const stage = state.currentStage || getDifficultyStage(0);
  let levelIndex;
  if (levelOverride !== undefined) {
    levelIndex = levelOverride;
  } else {
    levelIndex = Math.random() < 0.7 ? state.maxObstacleLevel : Math.max(0, state.maxObstacleLevel - 1);
  }
  levelIndex = Math.min(levelIndex, OBSTACLES.length - 1);
  const obsConfig = OBSTACLES[levelIndex];

  let channel = Math.random() < 0.5 ? 'left' : 'right';
  if (state.gameTime < 20) {
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

  const innerW = obsConfig.material === 'stone' ? obsConfig.width * 0.85 : obsConfig.width - 4;
  const innerH = obsConfig.material === 'stone' ? obsConfig.height * 0.85 : obsConfig.height - 4;
  const innerGeo = new THREE.PlaneGeometry(innerW, innerH);
  const innerMat = new THREE.MeshBasicMaterial({ color: darkenColor(obsConfig.color, 0.7) });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  innerMesh.position.z = 6;
  mesh.add(innerMesh);

  if (obsConfig.material === 'stone') {
    const capGeo = new THREE.PlaneGeometry(obsConfig.width * 0.7, obsConfig.height * 0.25);
    const capMat = new THREE.MeshBasicMaterial({ color: lightenColor(obsConfig.color, 1.15) });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(-2, obsConfig.height * 0.15, 7);
    mesh.add(cap);
  }

  if (obsConfig.name === '铁桶') {
    const rimGeo = new THREE.PlaneGeometry(obsConfig.width + 2, 3);
    const rimMat = new THREE.MeshBasicMaterial({ color: lightenColor(obsConfig.color, 1.3) });
    const rimTop = new THREE.Mesh(rimGeo, rimMat);
    rimTop.position.set(0, obsConfig.height / 2 - 1, 7);
    mesh.add(rimTop);
    const rimBot = new THREE.Mesh(rimGeo, rimMat);
    rimBot.position.set(0, -obsConfig.height / 2 + 1, 7);
    mesh.add(rimBot);
  }

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
    shieldBlocked: false,
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
      const crossH = new THREE.PlaneGeometry(config.width - 4, 1.5);
      const crossV = new THREE.PlaneGeometry(1.5, config.height - 4);
      const ch = new THREE.Mesh(crossH, detailMat);
      ch.position.z = 7;
      mesh.add(ch);
      const cv = new THREE.Mesh(crossV, detailMat);
      cv.position.z = 7;
      mesh.add(cv);
      break;
    }
    case 'stone': {
      const crackGeo = new THREE.PlaneGeometry(2, 1);
      for (let i = 0; i < 3; i++) {
        const crack = new THREE.Mesh(crackGeo, detailMat);
        crack.position.set(-4 + i * 4, -2 + i * 3, 7);
        mesh.add(crack);
      }
      const bumpGeo = new THREE.PlaneGeometry(config.width * 0.35, config.height * 0.3);
      const bump1 = new THREE.Mesh(bumpGeo, highlightMat);
      bump1.position.set(-config.width * 0.15, config.height * 0.1, 7);
      mesh.add(bump1);
      const bump2 = new THREE.Mesh(bumpGeo, highlightMat);
      bump2.position.set(config.width * 0.12, -config.height * 0.12, 7);
      mesh.add(bump2);
      break;
    }
    case 'metal': {
      if (config.name === '铁桶') {
        const bandGeo = new THREE.PlaneGeometry(config.width - 2, 2);
        for (let i = -1; i <= 1; i++) {
          const band = new THREE.Mesh(bandGeo, highlightMat);
          band.position.set(0, i * (config.height / 4), 7);
          mesh.add(band);
        }
        const dentGeo = new THREE.PlaneGeometry(6, 4);
        const dent = new THREE.Mesh(dentGeo, detailMat);
        dent.position.set(3, -2, 7);
        mesh.add(dent);
      } else if (config.name === '汽车' || config.name === '装甲车') {
        const cabinW = config.width * 0.5;
        const cabinH = config.height * 0.45;
        const cabinGeo = new THREE.PlaneGeometry(cabinW, cabinH);
        const cabinMat = new THREE.MeshBasicMaterial({ color: darkenColor(config.color, 0.6) });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, config.height * 0.1, 7);
        mesh.add(cabin);
        const windowGeo = new THREE.PlaneGeometry(cabinW - 4, cabinH - 4);
        const windowMat = new THREE.MeshBasicMaterial({ color: 0x4488AA });
        const window_ = new THREE.Mesh(windowGeo, windowMat);
        window_.position.set(0, config.height * 0.1, 8);
        mesh.add(window_);
        const wheelGeo = new THREE.PlaneGeometry(6, 6);
        const wheelMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const w1 = new THREE.Mesh(wheelGeo, wheelMat);
        w1.position.set(-config.width / 2 + 2, -config.height / 2 + 2, 7);
        mesh.add(w1);
        const w2 = new THREE.Mesh(wheelGeo, wheelMat);
        w2.position.set(config.width / 2 - 2, -config.height / 2 + 2, 7);
        mesh.add(w2);
        if (config.name === '装甲车') {
          const turretGeo = new THREE.PlaneGeometry(8, 8);
          const turretMat = new THREE.MeshBasicMaterial({ color: darkenColor(config.color, 0.7) });
          const turret = new THREE.Mesh(turretGeo, turretMat);
          turret.position.set(0, config.height * 0.15, 8);
          mesh.add(turret);
          const barrelGeo = new THREE.PlaneGeometry(3, 12);
          const barrel = new THREE.Mesh(barrelGeo, new THREE.MeshBasicMaterial({ color: 0x444444 }));
          barrel.position.set(0, config.height * 0.15 + 10, 9);
          mesh.add(barrel);
        }
      } else {
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
        if (config.name === '钢铁堡垒') {
          const rampGeo = new THREE.PlaneGeometry(config.width * 0.3, config.height * 0.15);
          const ramp1 = new THREE.Mesh(rampGeo, highlightMat);
          ramp1.position.set(-config.width * 0.25, config.height * 0.35, 7);
          mesh.add(ramp1);
          const ramp2 = new THREE.Mesh(rampGeo, highlightMat);
          ramp2.position.set(config.width * 0.25, config.height * 0.35, 7);
          mesh.add(ramp2);
          const slitGeo = new THREE.PlaneGeometry(3, 2);
          const slitMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
          const slit = new THREE.Mesh(slitGeo, slitMat);
          slit.position.set(0, config.height * 0.1, 8);
          mesh.add(slit);
        }
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
      const knotGeo = new THREE.PlaneGeometry(4, 4);
      const knotMat = new THREE.MeshBasicMaterial({ color: darkenColor(config.color, 0.7) });
      const knot = new THREE.Mesh(knotGeo, knotMat);
      knot.position.z = 8;
      mesh.add(knot);
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

  if (!state.inCalm) {
    state.spawnTimer += dt;
    if (state.spawnTimer >= stage.spawnInterval && state.obstacles.filter(o => o.alive).length < stage.maxObstacles) {
      state.spawnTimer = 0;
      spawnObstacle();
    }
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
  state.maxObstacleLevel = 0;
  state.destroyedAtCurrentLevel = 0;
}
