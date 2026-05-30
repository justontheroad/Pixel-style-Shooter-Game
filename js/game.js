import { state } from './state.js';
import { getDifficultyStage } from './config.js';
import { updateScene } from './scene.js';
import { updatePlayer, resetPlayer, updateGunAppearance } from './player.js';
import { updateWeapons, resetWeapons } from './weapons.js';
import { updateObstacles, resetObstacles } from './obstacles.js';
import { updateItems, resetItems } from './items.js';
import { updateEffects, resetEffects } from './effects.js';
import { updateHUD, showGameOver, showHUD, setStartGameCallback } from './ui.js';
import { resetScore } from './score.js';
import { initAudio, playGameOver } from './audio.js';

export function initGame() {
  setStartGameCallback(startGame);
  state.lastTime = performance.now() / 1000;
  animate();
}

export function startGame() {
  initAudio();

  resetPlayer();
  resetWeapons();
  resetObstacles();
  resetItems();
  resetEffects();
  resetScore();

  state.gameActive = true;
  state.gameStarted = true;
  state.gameOver = false;
  state.gameTime = 0;
  state.spawnTimer = 0;
  state.currentStage = getDifficultyStage(0);
  state.currentWeaponIndex = 0;
  state.fireTimer = 0;
  state.combo = 0;

  updateGunAppearance();
  showHUD();
}

function gameOver() {
  state.gameActive = false;
  state.gameOver = true;
  playGameOver();
  showGameOver();
}

export function animate() {
  requestAnimationFrame(animate);

  const now = performance.now() / 1000;
  let dt = now - state.lastTime;
  state.lastTime = now;
  dt = Math.min(dt, 0.05);
  state.t += dt;

  if (state.gameActive) {
    state.gameTime += dt;
    state.survivalTime = state.gameTime;

    state.currentStage = getDifficultyStage(state.gameTime);

    updatePlayer(dt);
    updateWeapons(dt);

    const obsResult = updateObstacles(dt);
    if (obsResult === 'gameover') {
      gameOver();
    }

    updateItems(dt);
    updateEffects(dt);
    updateScene(dt);
    updateHUD();
  } else {
    updateEffects(dt);
    updateScene(dt);
  }

  if (state.renderer && state.scene && state.camera) {
    state.renderer.render(state.scene, state.camera);
  }
}
