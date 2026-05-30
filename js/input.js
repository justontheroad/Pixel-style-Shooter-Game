import { state } from './state.js';
import { switchChannel } from './player.js';

export function initInput() {
  document.addEventListener('click', (e) => {
    if (!state.gameActive) return;
    if (e.target.closest('#startScreen') || e.target.closest('#gameOverScreen')) return;
    switchChannel();
  });

  const canvas = state.renderer ? state.renderer.domElement : null;

  const handleTouch = (e) => {
    if (!state.gameActive) return;
    e.preventDefault();
    switchChannel();
  };

  if (canvas) {
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
  }

  document.addEventListener('touchstart', (e) => {
    if (!state.gameActive) return;
    if (e.target.closest('#startScreen') || e.target.closest('#gameOverScreen')) return;
    if (canvas && e.target === canvas) return;
    switchChannel();
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (!state.gameActive) return;
    if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();
      switchChannel();
    }
  });
}
