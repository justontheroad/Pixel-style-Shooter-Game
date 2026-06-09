import { initScene } from './scene.js';
import { initPlayer } from './player.js';
import { initInput } from './input.js';
import { initGame, loadHighScore, togglePause } from './game.js';
import { initUI } from './ui.js';
import { state } from './state.js';

initScene();
initPlayer();
initInput();
initUI();
initGame();
loadHighScore();

window.addEventListener('resize', () => {
  if (state.camera && state.renderer) {
    state.renderer.setSize(240, 400);
  }
});

// 横屏旋转提示
function checkOrientation() {
  const mask = document.getElementById('orientation-mask');
  if (!mask) return;
  const isLandscape = window.innerWidth > window.innerHeight;
  if (isLandscape && state.isMobile) {
    mask.classList.remove('hidden');
    if (state.gameActive && !state.paused) {
      togglePause();
    }
  } else {
    mask.classList.add('hidden');
  }
}

const orientationMQ = window.matchMedia('(orientation: landscape)');
if (orientationMQ.addEventListener) {
  orientationMQ.addEventListener('change', checkOrientation);
}
window.addEventListener('resize', checkOrientation);
checkOrientation();
