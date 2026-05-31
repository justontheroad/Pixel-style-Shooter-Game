let audioCtx = null;
let masterGain = null;
let bgmGain = null;
let muted = false;
const bufferMap = new Map();
const activePool = new Map();
let nextVoiceId = 0;
const MAX_CONCURRENT = 4;
const MIN_INTERVAL = 40;
let lastPlayTime = 0;

let bgmSource = null;
let bgmBuffer = null;
let bgmPlaying = false;
let bgmPlaybackRate = 1.0;

function applyADSR(gain, t, peak, attack, decay, sustain, duration, release) {
  const sustainGain = peak * sustain;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + attack);
  gain.gain.linearRampToValueAtTime(sustainGain, t + attack + decay);
  gain.gain.setValueAtTime(sustainGain, t + attack + decay + duration);
  gain.gain.linearRampToValueAtTime(0, t + attack + decay + duration + release);
}

async function renderGunBuffer(freq, type, attack, decay, sustain, duration, release) {
  const totalDuration = attack + decay + duration + release + 0.05;
  const sampleRate = audioCtx.sampleRate;
  const length = Math.ceil(totalDuration * sampleRate);
  const offline = new OfflineAudioContext(1, length, sampleRate);

  const t = 0;
  const peak = 0.3;
  const osc = offline.createOscillator();
  const gain = offline.createGain();
  const filter = offline.createBiquadFilter();

  osc.type = type;
  osc.frequency.value = freq;
  filter.type = 'lowpass';
  filter.frequency.value = type === 'sine' ? 2000 : 1200;

  applyADSR(gain, t, peak, attack, decay, sustain, duration, release);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(offline.destination);
  osc.start(t);
  osc.stop(totalDuration);

  return await offline.startRendering();
}

async function renderHitBuffer(freq, type) {
  const totalDuration = 0.12;
  const sampleRate = audioCtx.sampleRate;
  const length = Math.ceil(totalDuration * sampleRate);
  const offline = new OfflineAudioContext(1, length, sampleRate);

  const osc = offline.createOscillator();
  const gain = offline.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.2, 0);
  gain.gain.linearRampToValueAtTime(0, totalDuration);
  osc.connect(gain);
  gain.connect(offline.destination);
  osc.start(0);
  osc.stop(totalDuration);

  return await offline.startRendering();
}

async function renderDestroyBuffer(freq) {
  const totalDuration = 0.4;
  const sampleRate = audioCtx.sampleRate;
  const length = Math.ceil(totalDuration * sampleRate);
  const offline = new OfflineAudioContext(1, length, sampleRate);

  const noiseLength = Math.ceil(0.2 * sampleRate);
  const noiseBuffer = offline.createBuffer(1, noiseLength, sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseLength; i++) noiseData[i] = Math.random() * 2 - 1;
  const noise = offline.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseGain = offline.createGain();
  noiseGain.gain.setValueAtTime(0.25, 0);
  noiseGain.gain.linearRampToValueAtTime(0, 0.3);
  const noiseFilter = offline.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = freq;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(offline.destination);
  noise.start(0);
  noise.stop(totalDuration);

  const osc = offline.createOscillator();
  const oscGain = offline.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 0.5, 0);
  osc.frequency.exponentialRampToValueAtTime(30, 0.3);
  oscGain.gain.setValueAtTime(0.3, 0);
  oscGain.gain.linearRampToValueAtTime(0, 0.35);
  osc.connect(oscGain);
  oscGain.connect(offline.destination);
  osc.start(0);
  osc.stop(totalDuration);

  return await offline.startRendering();
}

async function renderPickupBuffer() {
  const totalDuration = 0.3;
  const sampleRate = audioCtx.sampleRate;
  const length = Math.ceil(totalDuration * sampleRate);
  const offline = new OfflineAudioContext(1, length, sampleRate);

  const notes = [523.25, 659.25];
  const delays = [0, 0.1];
  for (let i = 0; i < notes.length; i++) {
    const osc = offline.createOscillator();
    const gain = offline.createGain();
    osc.type = 'sine';
    osc.frequency.value = notes[i];
    const t = delays[i];
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.01);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);
    osc.connect(gain);
    gain.connect(offline.destination);
    osc.start(t);
    osc.stop(totalDuration);
  }

  return await offline.startRendering();
}

async function renderPowerupBuffer() {
  const totalDuration = 0.4;
  const sampleRate = audioCtx.sampleRate;
  const length = Math.ceil(totalDuration * sampleRate);
  const offline = new OfflineAudioContext(1, length, sampleRate);

  const notes = [523.25, 659.25, 783.99, 1046.5];
  const delays = [0, 0.06, 0.12, 0.18];
  for (let i = 0; i < notes.length; i++) {
    const osc = offline.createOscillator();
    const gain = offline.createGain();
    osc.type = 'sine';
    osc.frequency.value = notes[i];
    const t = delays[i];
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);
    osc.connect(gain);
    gain.connect(offline.destination);
    osc.start(t);
    osc.stop(totalDuration);
  }

  return await offline.startRendering();
}

async function renderGameOverBuffer() {
  const totalDuration = 0.8;
  const sampleRate = audioCtx.sampleRate;
  const length = Math.ceil(totalDuration * sampleRate);
  const offline = new OfflineAudioContext(1, length, sampleRate);

  const osc = offline.createOscillator();
  const gain = offline.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, 0);
  osc.frequency.exponentialRampToValueAtTime(55, 0.5);
  gain.gain.setValueAtTime(0.25, 0);
  gain.gain.linearRampToValueAtTime(0, 0.6);
  const filter = offline.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(offline.destination);
  osc.start(0);
  osc.stop(totalDuration);

  return await offline.startRendering();
}

async function renderComboBuffer(level) {
  const totalDuration = 0.5;
  const sampleRate = audioCtx.sampleRate;
  const length = Math.ceil(totalDuration * sampleRate);
  const offline = new OfflineAudioContext(1, length, sampleRate);

  const configs = {
    5:  { notes: [523.25, 659.25, 783.99], delays: [0, 0.08, 0.16] },
    10: { notes: [523.25, 659.25, 783.99, 1046.5], delays: [0, 0.06, 0.12, 0.18] },
    20: { notes: [659.25, 783.99, 987.77, 1318.5], delays: [0, 0.05, 0.10, 0.15] },
    50: { notes: [783.99, 987.77, 1318.5, 1568.0, 2093.0], delays: [0, 0.04, 0.08, 0.12, 0.16] },
  };
  const cfg = configs[level] || configs[5];

  for (let i = 0; i < cfg.notes.length; i++) {
    const osc = offline.createOscillator();
    const gain = offline.createGain();
    osc.type = 'square';
    osc.frequency.value = cfg.notes[i];
    const t = cfg.delays[i];
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
    gain.gain.linearRampToValueAtTime(0, t + 0.2);
    const flt = offline.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 2000;
    osc.connect(flt);
    flt.connect(gain);
    gain.connect(offline.destination);
    osc.start(t);
    osc.stop(totalDuration);
  }

  return await offline.startRendering();
}

async function renderBgmBuffer() {
  const bpm = 120;
  const beatDur = 60 / bpm;
  const barDur = beatDur * 4;
  const bars = 4;
  const totalDuration = barDur * bars;
  const sampleRate = audioCtx.sampleRate;
  const length = Math.ceil(totalDuration * sampleRate);
  const offline = new OfflineAudioContext(1, length, sampleRate);

  const bassNotes = [
    [65.41, 65.41, 82.41, 82.41],
    [73.42, 73.42, 87.31, 87.31],
    [98.00, 98.00, 82.41, 82.41],
    [87.31, 87.31, 65.41, 65.41],
  ];

  const melodyNotes = [
    [261.63, 329.63, 392.00, 329.63],
    [293.66, 349.23, 440.00, 349.23],
    [392.00, 440.00, 523.25, 440.00],
    [349.23, 293.66, 261.63, 293.66],
  ];

  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < 4; beat++) {
      const t = bar * barDur + beat * beatDur;

      const bassOsc = offline.createOscillator();
      const bassGain = offline.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.value = bassNotes[bar][beat];
      bassGain.gain.setValueAtTime(0.12, t);
      bassGain.gain.linearRampToValueAtTime(0, t + beatDur * 0.8);
      const bassFlt = offline.createBiquadFilter();
      bassFlt.type = 'lowpass';
      bassFlt.frequency.value = 300;
      bassOsc.connect(bassFlt);
      bassFlt.connect(bassGain);
      bassGain.connect(offline.destination);
      bassOsc.start(t);
      bassOsc.stop(t + beatDur);

      const melOsc = offline.createOscillator();
      const melGain = offline.createGain();
      melOsc.type = 'square';
      melOsc.frequency.value = melodyNotes[bar][beat];
      melGain.gain.setValueAtTime(0, t);
      melGain.gain.linearRampToValueAtTime(0.06, t + 0.01);
      melGain.gain.setValueAtTime(0.06, t + beatDur * 0.3);
      melGain.gain.linearRampToValueAtTime(0, t + beatDur * 0.5);
      const melFlt = offline.createBiquadFilter();
      melFlt.type = 'lowpass';
      melFlt.frequency.value = 1500;
      melOsc.connect(melFlt);
      melFlt.connect(melGain);
      melGain.connect(offline.destination);
      melOsc.start(t);
      melOsc.stop(t + beatDur);

      if (beat % 2 === 0) {
        const drumLen = Math.ceil(0.08 * sampleRate);
        const drumBuf = offline.createBuffer(1, drumLen, sampleRate);
        const drumData = drumBuf.getChannelData(0);
        for (let s = 0; s < drumLen; s++) drumData[s] = (Math.random() * 2 - 1) * (1 - s / drumLen);
        const drumSrc = offline.createBufferSource();
        drumSrc.buffer = drumBuf;
        const drumGain = offline.createGain();
        drumGain.gain.setValueAtTime(0.08, t);
        drumGain.gain.linearRampToValueAtTime(0, t + 0.08);
        const drumFlt = offline.createBiquadFilter();
        drumFlt.type = 'highpass';
        drumFlt.frequency.value = 2000;
        drumSrc.connect(drumFlt);
        drumFlt.connect(drumGain);
        drumGain.connect(offline.destination);
        drumSrc.start(t);
      }
    }
  }

  return await offline.startRendering();
}

const GUN_AUDIO_CONFIGS = [
  { freq: 200, type: 'sine',     attack: 0.01, decay: 0.05, sustain: 0.4, duration: 0.08, release: 0.1 },
  { freq: 300, type: 'square',   attack: 0.005, decay: 0.03, sustain: 0.3, duration: 0.05, release: 0.08 },
  { freq: 350, type: 'square',   attack: 0.005, decay: 0.03, sustain: 0.3, duration: 0.05, release: 0.08 },
  { freq: 400, type: 'sawtooth', attack: 0.003, decay: 0.02, sustain: 0.2, duration: 0.03, release: 0.05 },
  { freq: 120, type: 'sine',     attack: 0.005, decay: 0.08, sustain: 0.3, duration: 0.1, release: 0.15 },
  { freq: 280, type: 'triangle', attack: 0.005, decay: 0.04, sustain: 0.4, duration: 0.06, release: 0.1 },
  { freq: 800, type: 'sine',     attack: 0.002, decay: 0.03, sustain: 0.2, duration: 0.05, release: 0.2 },
  { freq: 150, type: 'sawtooth', attack: 0.002, decay: 0.01, sustain: 0.15, duration: 0.02, release: 0.03 },
  { freq: 80,  type: 'sawtooth', attack: 0.01, decay: 0.1, sustain: 0.5, duration: 0.15, release: 0.3 },
  { freq: 500, type: 'sine',     attack: 0.01, decay: 0.02, sustain: 0.6, duration: 0.05, release: 0.05 },
];

const HIT_AUDIO_CONFIGS = {
  wood:  { freq: 200, type: 'triangle' },
  stone: { freq: 800, type: 'sine' },
  metal: { freq: 1200, type: 'square' },
  cloth: { freq: 150, type: 'sine' },
  energy: { freq: 600, type: 'sine' },
};

const DESTROY_AUDIO_CONFIGS = {
  wood:  400,
  stone: 600,
  metal: 800,
  cloth: 300,
  energy: 1000,
};

async function prerenderBuffers() {
  const promises = [];

  for (let i = 0; i < GUN_AUDIO_CONFIGS.length; i++) {
    const c = GUN_AUDIO_CONFIGS[i];
    const idx = i;
    promises.push(
      renderGunBuffer(c.freq, c.type, c.attack, c.decay, c.sustain, c.duration, c.release)
        .then(buf => bufferMap.set(`gun_${idx}`, buf))
    );
  }

  for (const [key, c] of Object.entries(HIT_AUDIO_CONFIGS)) {
    promises.push(
      renderHitBuffer(c.freq, c.type)
        .then(buf => bufferMap.set(`hit_${key}`, buf))
    );
  }

  for (const [key, freq] of Object.entries(DESTROY_AUDIO_CONFIGS)) {
    promises.push(
      renderDestroyBuffer(freq)
        .then(buf => bufferMap.set(`destroy_${key}`, buf))
    );
  }

  promises.push(renderPickupBuffer().then(buf => bufferMap.set('pickup', buf)));
  promises.push(renderPowerupBuffer().then(buf => bufferMap.set('powerup', buf)));
  promises.push(renderGameOverBuffer().then(buf => bufferMap.set('gameover', buf)));

  for (const level of [5, 10, 20, 50]) {
    const l = level;
    promises.push(
      renderComboBuffer(l)
        .then(buf => bufferMap.set(`combo_${l}`, buf))
    );
  }

  promises.push(
    renderBgmBuffer().then(buf => {
      bgmBuffer = buf;
    })
  );

  await Promise.all(promises);
}

export function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(audioCtx.destination);

    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = 0.15;
    bgmGain.connect(masterGain);

    prerenderBuffers();
  } catch (e) {
    audioCtx = null;
  }
}

function playFromBuffer(key) {
  if (!audioCtx || muted) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const now = performance.now();
  if (now - lastPlayTime < MIN_INTERVAL) return;
  if (activePool.size >= MAX_CONCURRENT) {
    let oldestId = null, oldestTime = Infinity;
    for (const [id, voice] of activePool) {
      if (voice.startTime < oldestTime) { oldestTime = voice.startTime; oldestId = id; }
    }
    if (oldestId !== null) {
      const voice = activePool.get(oldestId);
      try { voice.source.stop(); } catch(e) {}
      activePool.delete(oldestId);
    }
  }

  const buffer = bufferMap.get(key);
  if (!buffer) return;

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const voiceGain = audioCtx.createGain();
  voiceGain.gain.value = 1.0;
  source.connect(voiceGain);
  voiceGain.connect(masterGain);
  source.start();

  const id = nextVoiceId++;
  lastPlayTime = now;
  activePool.set(id, { source, startTime: now });
  source.onended = () => { activePool.delete(id); source.disconnect(); voiceGain.disconnect(); };
}

export function startBgm() {
  if (!audioCtx || !bgmBuffer || bgmPlaying) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  bgmSource = audioCtx.createBufferSource();
  bgmSource.buffer = bgmBuffer;
  bgmSource.loop = true;
  bgmSource.playbackRate.value = bgmPlaybackRate;
  bgmSource.connect(bgmGain);
  bgmSource.start();
  bgmPlaying = true;
}

export function stopBgm() {
  if (!bgmSource || !bgmPlaying) return;
  try {
    bgmSource.stop();
    bgmSource.disconnect();
  } catch(e) {}
  bgmSource = null;
  bgmPlaying = false;
}

export function updateBgmSpeed(stageIndex) {
  const speeds = [1.0, 1.05, 1.1, 1.15, 1.25, 1.35];
  const newRate = speeds[stageIndex] || 1.0;
  if (newRate !== bgmPlaybackRate && bgmSource) {
    bgmPlaybackRate = newRate;
    bgmSource.playbackRate.value = newRate;
  }
}

export function playGunShot(weaponIndex) { playFromBuffer(`gun_${weaponIndex}`); }
export function playHitSound(materialType) { playFromBuffer(`hit_${materialType || 'stone'}`); }
export function playDestroySound(materialType) { playFromBuffer(`destroy_${materialType || 'stone'}`); }
export function playPickup() { playFromBuffer('pickup'); }
export function playPowerup() { playFromBuffer('powerup'); }
export function playGameOver() { playFromBuffer('gameover'); }
export function playComboSound(combo) {
  const levels = [5, 10, 20, 50];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (combo === levels[i]) {
      playFromBuffer(`combo_${levels[i]}`);
      return;
    }
  }
}
export function toggleMute() {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.6;
  return muted;
}
