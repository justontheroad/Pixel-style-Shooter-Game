import { initScene, updateScene } from './scene.js';
import { initPlayer } from './player.js';
import { initInput } from './input.js';
import { initGame } from './game.js';
import { initUI } from './ui.js';
import { state } from './state.js';

initScene();
initPlayer();
initInput();
initUI();
initGame();

window.addEventListener('resize', () => {
  if (state.camera && state.renderer) {
    state.renderer.setSize(240, 400);
  }
});
