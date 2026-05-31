import { state } from './state.js';
import { WEAPONS, POWERUPS, getComboMultiplier } from './config.js';

export function initUI() {
}

function show(el) { if (el) el.classList.remove('hidden'); }
function hide(el) { if (el) el.classList.add('hidden'); }

export function showHUD() {
  const hud = document.getElementById('hud');
  show(hud);
}

export function hideHUD() {
  const hud = document.getElementById('hud');
  hide(hud);
}

export function updateHUD() {
  const scoreEl = document.getElementById('score');
  const comboEl = document.getElementById('combo');
  const weaponEl = document.getElementById('weapon');
  const timeEl = document.getElementById('time');
  const stageEl = document.getElementById('stage');
  const powerupEl = document.getElementById('powerup-status');

  if (scoreEl) scoreEl.textContent = state.score;
  if (comboEl) {
    const mult = getComboMultiplier(state.combo);
    comboEl.textContent = state.combo > 0 ? `${state.combo} COMBO x${mult}` : '';
  }
  if (weaponEl) {
    const weapon = WEAPONS[state.currentWeaponIndex];
    weaponEl.textContent = weapon.name;
  }
  if (timeEl) timeEl.textContent = state.survivalTime.toFixed(1) + 's';
  if (stageEl && state.currentStage) stageEl.textContent = state.currentStage.name;

  if (powerupEl) {
    let parts = [];
    if (state.shieldActive) parts.push(`🛡${state.shieldTimer.toFixed(1)}s`);
    if (state.slowTimeActive) parts.push(`⏳${state.slowTimeTimer.toFixed(1)}s`);
    if (state.doubleScoreActive) parts.push(`×2 ${state.doubleScoreTimer.toFixed(1)}s`);
    powerupEl.textContent = parts.join(' ');
  }
}

export function showGameOver() {
  const overlay = document.getElementById('gameover-overlay');
  const finalScore = document.getElementById('final-score');
  const finalTime = document.getElementById('final-time');
  const finalCombo = document.getElementById('final-combo');
  const finalDestroyed = document.getElementById('final-destroyed');
  const highScoreEl = document.getElementById('high-score');
  const newRecordEl = document.getElementById('new-record');
  const weaponsList = document.getElementById('weapons-list');

  if (finalScore) finalScore.textContent = state.score;
  if (finalTime) finalTime.textContent = state.survivalTime.toFixed(1) + 's';
  if (finalCombo) finalCombo.textContent = state.maxCombo;
  if (finalDestroyed) finalDestroyed.textContent = state.destroyedCount;

  if (highScoreEl) highScoreEl.textContent = state.highScore;
  if (newRecordEl) {
    if (state.score >= state.highScore && state.score > 0) {
      show(newRecordEl);
    } else {
      hide(newRecordEl);
    }
  }

  if (weaponsList) {
    const names = [];
    for (const idx of state.weaponsUsed) {
      if (WEAPONS[idx]) names.push(WEAPONS[idx].name);
    }
    weaponsList.textContent = names.join(' → ');
  }

  show(overlay);
}

export function hideGameOver() {
  const overlay = document.getElementById('gameover-overlay');
  hide(overlay);
}

export function showStartScreen() {
  const overlay = document.getElementById('start-overlay');
  show(overlay);
}

export function hideStartScreen() {
  const overlay = document.getElementById('start-overlay');
  hide(overlay);
}
