import { state } from './state.js';
import { switchChannel } from './player.js';
import { togglePause } from './game.js';

export function initInput() {
  const canvas = state.renderer ? state.renderer.domElement : null;

  document.addEventListener('click', (e) => {
    if (e.target.closest('#pause-overlay')) return;
    if (!state.gameActive) return;
    if (e.target.closest('#start-overlay') || e.target.closest('#gameover-overlay')) return;
    if (e.target.closest('.mute-btn') || e.target.closest('.pause-btn')) return;
    switchChannel();
  });

  if (canvas) {
    canvas.addEventListener('touchstart', (e) => {
      if (!state.gameActive) return;
      e.preventDefault();
      switchChannel();
    }, { passive: false });
  }

  document.addEventListener('touchstart', (e) => {
    if (e.target.closest('#pause-overlay')) return;
    if (!state.gameActive) return;
    if (e.target.closest('#start-overlay') || e.target.closest('#gameover-overlay')) return;
    if (e.target.closest('.mute-btn') || e.target.closest('.pause-btn')) return;
    if (canvas && e.target === canvas) return;
    e.preventDefault();
    switchChannel();
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (state.gameActive || state.paused) {
        e.preventDefault();
        togglePause();
        return;
      }
    }
    if (!state.gameActive) return;
    if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();
      switchChannel();
    }
  });
}
