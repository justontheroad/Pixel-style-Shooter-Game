import { state } from './state.js';
import { DIFFICULTY_STAGES, getDifficultyStage, WEAPONS, POWERUPS } from './config.js';
import { updatePlayer, resetPlayer, updateGunAppearance } from './player.js';
import { updateWeapons, resetWeapons, destroyObstacle } from './weapons.js';
import { updateObstacles, resetObstacles, removeObstacleFromScene } from './obstacles.js';
import { updateItems, resetItems, createItem, createPowerup } from './items.js';
import { updateEffects, resetEffects, spawnWaveAnnouncement } from './effects.js';
import { updateScene } from './scene.js';
import { resetScore } from './score.js';
import { showGameOver, hideGameOver, hideStartScreen, updateHUD, showHUD } from './ui.js';
import { initAudio, playGameOver, startBgm, stopBgm, updateBgmSpeed, toggleMute } from './audio.js';
import { generateWavePlan, getCurrentWave, getWaveSpawnConfig } from './waves.js';

let prevStageIndex = -1;
let prevWaveIndex = 0;

export function initGame() {
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const continueBtn = document.getElementById('continueBtn');
  const muteBtn = document.getElementById('muteBtn');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      initAudio();
      hideStartScreen();
      startGame();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      hideGameOver();
      startGame();
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      showAdPlaceholder(() => {
        hideGameOver();
        continueGame();
      });
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const isMuted = toggleMute();
      muteBtn.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  requestAnimationFrame(gameLoop);
}

function showAdPlaceholder(callback) {
  const overlay = document.getElementById('ad-overlay');
  if (overlay) {
    show(overlay);
    let countdown = 3;
    const countdownEl = document.getElementById('ad-countdown');
    if (countdownEl) countdownEl.textContent = countdown;
    const timer = setInterval(() => {
      countdown--;
      if (countdownEl) countdownEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(timer);
        hide(overlay);
        callback();
      }
    }, 1000);
  } else {
    callback();
  }
}

function show(el) { if (el) el.classList.remove('hidden'); }
function hide(el) { if (el) el.classList.add('hidden'); }

export function startGame() {
  state.gameActive = true;
  state.gameStarted = true;
  state.gameOver = false;
  state.gameTime = 0;
  state.spawnTimer = 0;
  state.currentWeaponIndex = 0;
  prevStageIndex = -1;
  prevWaveIndex = 0;

  state.wavePlan = generateWavePlan();
  state.currentWaveIndex = 0;
  state.waveTimer = 0;
  state.calmTimer = 0;
  state.inCalm = false;
  state.waveDropSpawned = false;
  state.currentStage = getDifficultyStage(0);

  resetPlayer();
  resetWeapons();
  resetObstacles();
  resetItems();
  resetEffects();
  resetScore();

  showHUD();
  startBgm();
}

export function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);

  if (!state.lastTime) state.lastTime = timestamp;
  let dt = (timestamp - state.lastTime) / 1000;
  state.lastTime = timestamp;

  if (dt > 0.1) dt = 0.1;

  if (state.gameActive) {
    let gameDt = dt;
    let obstacleDt = dt;
    if (state.slowTimeActive) {
      obstacleDt *= 0.4;
    }

    state.gameTime += gameDt;
    state.survivalTime += dt;

    const stage = getDifficultyStage(state.gameTime);
    state.currentStage = stage;

    const waveConfig = getWaveSpawnConfig(state.gameTime);
    if (waveConfig) {
      if (waveConfig.inCalm) {
        state.inCalm = true;
        if (state.calmTimer === 0) {
          state.calmTimer = waveConfig.calmEnd - state.gameTime;
        }
      } else {
        state.inCalm = false;
        state.calmTimer = 0;

        if (waveConfig.waveIndex !== prevWaveIndex) {
          prevWaveIndex = waveConfig.waveIndex;
          state.currentWaveIndex = waveConfig.waveIndex;
          state.waveDropSpawned = false;
          spawnWaveAnnouncement(waveConfig.waveIndex);
        }

        if (waveConfig.stageName) {
          state.currentStage = Object.assign({}, stage, {
            name: waveConfig.stageName,
            speedMult: waveConfig.speedMult,
            spawnInterval: waveConfig.spawnInterval,
            maxObstacles: waveConfig.maxObstacles,
            itemDropRate: waveConfig.itemDropRate,
          });
        }

        if (waveConfig.guaranteedDrop && !state.waveDropSpawned && waveConfig.waveTime >= waveConfig.guaranteedDrop.time) {
          state.waveDropSpawned = true;
          const drop = waveConfig.guaranteedDrop;
          const CHANNEL_LEFT_X = -(100 + 8) / 2;
          const CHANNEL_RIGHT_X = (100 + 8) / 2;
          const dropX = state.currentChannel === 'left' ? CHANNEL_LEFT_X : CHANNEL_RIGHT_X;
          const dropY = 200;
          if (drop.type === 'weapon') {
            createItem(dropX, dropY, drop.weaponLevel);
          } else if (drop.type === 'powerup') {
            const puIndex = POWERUPS.findIndex(p => p.type === drop.powerupType);
            if (puIndex >= 0) createPowerup(dropX, dropY, puIndex);
          }
        }
      }
    }

    const stageIndex = DIFFICULTY_STAGES.indexOf(stage);
    if (stageIndex !== prevStageIndex) {
      prevStageIndex = stageIndex;
      updateBgmSpeed(stageIndex);
    }

    updatePlayer(gameDt);
    updateWeapons(gameDt);
    updateScene(gameDt);

    const obsResult = updateObstacles(obstacleDt);
    if (obsResult === 'gameover') {
      endGame();
      return;
    }

    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      const obs = state.obstacles[i];
      if (obs.shieldBlocked) {
        obs.shieldBlocked = false;
        destroyObstacle(obs);
      }
    }

    updateItems(gameDt);
    updateEffects(gameDt);

    if (state.clearPending) {
      state.clearPending = false;
      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        const obs = state.obstacles[i];
        if (!obs.alive) {
          removeObstacleFromScene(obs);
          state.obstacles.splice(i, 1);
        }
      }
    }

    updateHUD();
  } else {
    updateEffects(dt);
    updateScene(dt);
  }

  if (state.renderer && state.scene && state.camera) {
    state.renderer.render(state.scene, state.camera);
  }
}

function endGame() {
  state.gameActive = false;
  state.gameOver = true;
  stopBgm();
  playGameOver();

  saveContinueState();

  if (state.score > state.highScore) {
    state.highScore = state.score;
    try { localStorage.setItem('pixelShooter_highScore', state.highScore); } catch(e) {}
  }

  showGameOver();
}

function saveContinueState() {
  state.continueState = {
    score: state.score,
    survivalTime: state.survivalTime,
    currentWeaponIndex: state.currentWeaponIndex,
    weaponsUsed: new Set(state.weaponsUsed),
    maxCombo: state.maxCombo,
    destroyedCount: state.destroyedCount,
    maxObstacleLevel: state.maxObstacleLevel,
    destroyedAtCurrentLevel: state.destroyedAtCurrentLevel,
    gameTime: state.gameTime,
    currentWaveIndex: state.currentWaveIndex,
    wavePlan: state.wavePlan,
  };
}

function continueGame() {
  if (!state.continueState) {
    startGame();
    return;
  }

  const saved = state.continueState;

  state.gameActive = true;
  state.gameStarted = true;
  state.gameOver = false;
  state.spawnTimer = 0;

  resetPlayer();
  resetWeapons();
  resetObstacles();
  resetItems();
  resetEffects();

  prevStageIndex = -1;
  prevWaveIndex = saved.currentWaveIndex;

  state.score = saved.score;
  state.survivalTime = saved.survivalTime;
  state.currentWeaponIndex = saved.currentWeaponIndex;
  state.weaponsUsed = new Set(saved.weaponsUsed);
  state.maxCombo = saved.maxCombo;
  state.destroyedCount = saved.destroyedCount;
  state.maxObstacleLevel = saved.maxObstacleLevel;
  state.destroyedAtCurrentLevel = saved.destroyedAtCurrentLevel;
  state.gameTime = saved.gameTime;
  state.currentWaveIndex = saved.currentWaveIndex;
  state.wavePlan = saved.wavePlan;
  state.currentStage = getDifficultyStage(state.gameTime);

  state.combo = 0;
  state.shieldActive = false;
  state.shieldTimer = 0;
  state.slowTimeActive = false;
  state.slowTimeTimer = 0;
  state.doubleScoreActive = false;
  state.doubleScoreTimer = 0;
  state.tempWeaponActive = false;
  state.tempWeaponTimer = 0;
  state.cloneActive = false;
  state.cloneTimer = 0;
  state.clearPending = false;
  state.pendingDrops = [];
  state.inCalm = false;
  state.calmTimer = 0;
  state.waveDropSpawned = false;

  state.continueState = null;

  updateGunAppearance();
  showHUD();
  startBgm();
}

export function loadHighScore() {
  try {
    const saved = localStorage.getItem('pixelShooter_highScore');
    if (saved) state.highScore = parseInt(saved, 10) || 0;
  } catch(e) {}
}
