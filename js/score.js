import { state } from './state.js';
import { getComboMultiplier, COMBO_THRESHOLDS } from './config.js';
import { playComboSound } from './audio.js';
import { spawnComboFlash } from './effects.js';

const COMBO_MILESTONES = new Set(COMBO_THRESHOLDS.map(t => t.combo));

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

  if (COMBO_MILESTONES.has(state.combo)) {
    playComboSound(state.combo);
    spawnComboFlash(state.combo);
  }
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
