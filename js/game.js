import { state } from './state.js';
import { DIFFICULTY_STAGES, getDifficultyStage } from './config.js';
import { updatePlayer, resetPlayer } from './player.js';
import { updateWeapons, resetWeapons, destroyObstacle } from './weapons.js';
import { updateObstacles, resetObstacles, removeObstacleFromScene } from './obstacles.js';
import { updateItems, resetItems } from './items.js';
import { updateEffects, resetEffects } from './effects.js';
import { updateScene } from './scene.js';
import { resetScore } from './score.js';
import { showGameOver, hideGameOver, hideStartScreen, updateHUD, showHUD } from './ui.js';
import { initAudio, playGameOver, startBgm, stopBgm, updateBgmSpeed, toggleMute } from './audio.js';

let prevStageIndex = -1;

export function initGame() {
  const startBtn = document.getElementById('startBtn');
  const retryBtn = document.getElementById('retryBtn');
  const muteBtn = document.getElementById('muteBtn');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      initAudio();
      hideStartScreen();
      startGame();
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      hideGameOver();
      startGame();
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

export function startGame() {
  state.gameActive = true;
  state.gameStarted = true;
  state.gameOver = false;
  state.gameTime = 0;
  state.spawnTimer = 0;
  prevStageIndex = -1;

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
    if (state.slowTimeActive) {
      gameDt *= 0.4;
    }

    state.gameTime += gameDt;
    state.survivalTime += dt;

    const stage = getDifficultyStage(state.gameTime);
    state.currentStage = stage;

    const stageIndex = DIFFICULTY_STAGES.indexOf(stage);
    if (stageIndex !== prevStageIndex) {
      prevStageIndex = stageIndex;
      updateBgmSpeed(stageIndex);
    }

    updatePlayer(gameDt);
    updateWeapons(gameDt);
    updateScene(gameDt);

    const obsResult = updateObstacles(gameDt);
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

  if (state.score > state.highScore) {
    state.highScore = state.score;
    try { localStorage.setItem('pixelShooter_highScore', state.highScore); } catch(e) {}
  }

  showGameOver();
}

export function loadHighScore() {
  try {
    const saved = localStorage.getItem('pixelShooter_highScore');
    if (saved) state.highScore = parseInt(saved, 10) || 0;
  } catch(e) {}
}
