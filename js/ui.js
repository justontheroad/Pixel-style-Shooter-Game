import { state } from './state.js';
import { WEAPONS, getComboMultiplier } from './config.js';
import { toggleMute } from './audio.js';

let startGameCallback = null;

export function setStartGameCallback(cb) { startGameCallback = cb; }

function startGameFromUI() {
  if (startGameCallback) startGameCallback();
}

function show(el) {
  if (el) { el.classList.remove('hidden'); el.style.display = ''; }
}
function hide(el) {
  if (el) { el.classList.add('hidden'); }
}

export function initUI() {
  document.getElementById('startBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    startGameFromUI();
  });

  document.getElementById('retryBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    startGameFromUI();
  });
  document.getElementById('menuBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    showStartScreen();
  });

  document.getElementById('muteBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const m = toggleMute();
    document.getElementById('muteBtn').textContent = m ? '🔇' : '🔊';
  });

  loadHighScore();
  showStartScreen();
}

export function showStartScreen() {
  show(document.getElementById('startScreen'));
  hide(document.getElementById('hudOverlay'));
  hide(document.getElementById('gameOverScreen'));
  document.getElementById('highScoreDisplay').textContent = state.highScore;
}

export function showHUD() {
  hide(document.getElementById('startScreen'));
  show(document.getElementById('hudOverlay'));
  hide(document.getElementById('gameOverScreen'));
}

export function showGameOver() {
  hide(document.getElementById('startScreen'));
  hide(document.getElementById('hudOverlay'));
  show(document.getElementById('gameOverScreen'));

  document.getElementById('finalScore').textContent = state.score;
  document.getElementById('survivalTime').textContent = state.survivalTime.toFixed(1) + 's';
  document.getElementById('destroyedCount').textContent = state.destroyedCount;
  document.getElementById('maxCombo').textContent = state.maxCombo;

  const weaponsList = Array.from(state.weaponsUsed).map(idx => WEAPONS[idx]?.name || '').filter(Boolean).join(' → ');
  document.getElementById('weaponsUsed').textContent = weaponsList || '左轮手枪';

  if (state.score > state.highScore) {
    state.highScore = state.score;
    saveHighScore();
    show(document.getElementById('newRecord'));
  } else {
    hide(document.getElementById('newRecord'));
  }
}

export function updateHUD() {
  const weapon = WEAPONS[state.currentWeaponIndex];
  document.getElementById('weaponName').textContent = weapon.name;
  document.getElementById('weaponLevel').textContent = 'Lv.' + weapon.level;
  document.getElementById('scoreDisplay').textContent = state.score;

  const comboEl = document.getElementById('comboDisplay');
  const comboMultEl = document.getElementById('comboMult');
  if (state.combo >= 5) {
    comboEl.classList.add('active');
    comboEl.textContent = 'x' + state.combo;
    const mult = getComboMultiplier(state.combo);
    if (mult > 1) {
      comboMultEl.classList.add('active');
      comboMultEl.textContent = mult + 'x';
    } else {
      comboMultEl.classList.remove('active');
    }
  } else {
    comboEl.classList.remove('active');
    comboMultEl.classList.remove('active');
  }
}

function loadHighScore() {
  try {
    state.highScore = parseInt(localStorage.getItem('pixelShooter_highScore')) || 0;
  } catch(e) { state.highScore = 0; }
}

function saveHighScore() {
  try {
    localStorage.setItem('pixelShooter_highScore', state.highScore);
  } catch(e) {}
}
