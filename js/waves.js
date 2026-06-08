import { state } from './state.js';
import { WEAPONS, OBSTACLES, POWERUPS } from './config.js';

export function generateWavePlan() {
  const waves = [];
  let time = 0;

  const waveDefs = [
    { count: 3, obstacleLevel: 0, spawnInterval: 4.0, speedMult: 0.5, maxObs: 2, dropRate: 0.15, sameChannel: true,  calm: 2, weaponTarget: 1, stageName: '新手期' },
    { count: 3, obstacleLevel: 0, spawnInterval: 3.0, speedMult: 0.6, maxObs: 3, dropRate: 0.12, sameChannel: false, calm: 2, weaponTarget: 1, stageName: '热身期' },
    { count: 3, obstacleLevel: 1, spawnInterval: 2.6, speedMult: 0.7, maxObs: 3, dropRate: 0.12, sameChannel: false, calm: 2, weaponTarget: 2, stageName: '初级期' },
    { count: 3, obstacleLevel: 2, spawnInterval: 2.2, speedMult: 0.8, maxObs: 4, dropRate: 0.12, sameChannel: false, calm: 3, weaponTarget: 3, stageName: '进阶期', firstPowerup: true },
    { count: 3, obstacleLevel: 3, spawnInterval: 2.0, speedMult: 0.9, maxObs: 4, dropRate: 0.12, sameChannel: false, calm: 3, weaponTarget: 3, stageName: '挑战期' },
    { count: 3, obstacleLevel: 4, spawnInterval: 1.8, speedMult: 1.0, maxObs: 4, dropRate: 0.12, sameChannel: false, calm: 3, weaponTarget: 4, stageName: '困难期' },
    { count: 3, obstacleLevel: 5, spawnInterval: 1.5, speedMult: 1.1, maxObs: 5, dropRate: 0.15, sameChannel: false, calm: 3, weaponTarget: 5, stageName: '精英期' },
    { count: 3, obstacleLevel: 6, spawnInterval: 1.3, speedMult: 1.2, maxObs: 5, dropRate: 0.15, sameChannel: false, calm: 3, weaponTarget: 6, stageName: '噩梦期' },
    { count: 3, obstacleLevel: 7, spawnInterval: 1.1, speedMult: 1.3, maxObs: 5, dropRate: 0.18, sameChannel: false, calm: 3, weaponTarget: 7, stageName: '炼狱期' },
    { count: 3, obstacleLevel: 8, spawnInterval: 1.0, speedMult: 1.4, maxObs: 5, dropRate: 0.18, sameChannel: false, calm: 3, weaponTarget: 8, stageName: '深渊期' },
    { count: 3, obstacleLevel: 8, spawnInterval: 0.9, speedMult: 1.5, maxObs: 6, dropRate: 0.18, sameChannel: false, calm: 2, weaponTarget: 9, stageName: '地狱期' },
    { count: 3, obstacleLevel: 9, spawnInterval: 0.85, speedMult: 1.55, maxObs: 6, dropRate: 0.15, sameChannel: false, calm: 2, weaponTarget: 10, stageName: '炼狱II' },
    { count: 3, obstacleLevel: 9, spawnInterval: 0.8, speedMult: 1.6, maxObs: 6, dropRate: 0.15, sameChannel: false, calm: 2, weaponTarget: 11, stageName: '深渊II' },
    { count: 99, obstacleLevel: 9, spawnInterval: 0.75, speedMult: 1.65, maxObs: 7, dropRate: 0.12, sameChannel: false, calm: 2, weaponTarget: 12, stageName: '终末期' },
  ];

  let prevWeaponTarget = 0;

  for (const def of waveDefs) {
    const waveCount = def.count;
    for (let w = 0; w < waveCount; w++) {
      const duration = 12 + w * 4 + Math.floor(w / 2) * 3;
      const levelVariance = Math.random() < 0.2 ? 1 : 0;
      const actualLevel = Math.min(def.obstacleLevel + levelVariance, OBSTACLES.length - 1);

      let guaranteedDrop = null;
      if (w === 0 && def.weaponTarget > prevWeaponTarget) {
        guaranteedDrop = {
          type: 'weapon',
          weaponTarget: def.weaponTarget,
          time: duration * 0.4,
        };
        prevWeaponTarget = def.weaponTarget;
      } else if (def.firstPowerup && w === 1) {
        guaranteedDrop = {
          type: 'powerup',
          powerupType: 'shield',
          time: duration * 0.5,
        };
      } else if (Math.random() < 0.4) {
        guaranteedDrop = {
          type: 'powerup',
          powerupType: POWERUPS[Math.floor(Math.random() * POWERUPS.length)].type,
          time: duration * (0.3 + Math.random() * 0.4),
        };
      }

      waves.push({
        time: time,
        duration: duration,
        obstacleLevel: actualLevel,
        spawnInterval: def.spawnInterval * (1 + (Math.random() - 0.5) * 0.15),
        speedMult: def.speedMult,
        maxObstacles: def.maxObs,
        sameChannelOnly: def.sameChannel,
        itemDropRate: def.dropRate,
        guaranteedDrop: guaranteedDrop,
        calmAfter: def.calm,
        stageName: def.stageName,
        weaponTarget: def.weaponTarget,
      });

      time += duration + def.calm;
    }
  }

  return waves;
}

export function getCurrentWave(gameTime) {
  if (!state.wavePlan || state.wavePlan.length === 0) return null;

  for (let i = state.wavePlan.length - 1; i >= 0; i--) {
    if (gameTime >= state.wavePlan[i].time) {
      return { wave: state.wavePlan[i], index: i + 1 };
    }
  }
  return { wave: state.wavePlan[0], index: 1 };
}

export function getWaveSpawnConfig(gameTime) {
  const result = getCurrentWave(gameTime);
  if (!result) return null;
  const wave = result.wave;

  const waveEndTime = wave.time + wave.duration;
  if (gameTime >= waveEndTime) {
    return { inCalm: true, calmEnd: waveEndTime + wave.calmAfter };
  }

  return {
    inCalm: false,
    obstacleLevel: wave.obstacleLevel,
    spawnInterval: wave.spawnInterval,
    speedMult: wave.speedMult,
    maxObstacles: wave.maxObstacles,
    sameChannelOnly: wave.sameChannelOnly,
    itemDropRate: wave.itemDropRate,
    guaranteedDrop: wave.guaranteedDrop,
    waveIndex: result.index,
    waveTime: gameTime - wave.time,
    waveDuration: wave.duration,
    stageName: wave.stageName,
    weaponTarget: wave.weaponTarget,
  };
}
