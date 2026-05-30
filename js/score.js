import { state } from './state.js';
import { getComboMultiplier } from './config.js';

export function addScore(baseScore) {
  const multiplier = getComboMultiplier(state.combo);
  const finalScore = Math.floor(baseScore * multiplier);
  state.score += finalScore;
}

export function addCombo() {
  state.combo++;
  if (state.combo > state.maxCombo) {
    state.maxCombo = state.combo;
  }
  state.destroyedCount++;
}

export function resetCombo() {
  state.combo = 0;
}

export function resetScore() {
  state.score = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.destroyedCount = 0;
  state.survivalTime = 0;
  state.weaponsUsed = new Set();
  state.weaponsUsed.add(0);
}
