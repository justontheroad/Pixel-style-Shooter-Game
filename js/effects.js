import * as THREE from 'three';
import { state } from './state.js';
import { createTextTexture, disposeTextTexture } from './texttexture.js';

const PARTICLE_COLORS = {
  wood: [0x8B4513, 0xA0522D, 0x6B3410],
  stone: [0x808080, 0x999999, 0x666666],
  metal: [0xCCCCFF, 0x8888FF, 0xFFFFFF],
  cloth: [0xC2B280, 0xD2C290, 0xB0A070],
  energy: [0x00FFFF, 0x00CCFF, 0x88FFFF],
};

const MAX_EFFECTS = 80;
const MAX_DAMAGE_TEXTS = 20;

const sharedPixelGeo = new THREE.PlaneGeometry(1, 1);

export function spawnHitParticles(x, y, materialType, colorHex, weaponLevel) {
  if (state.effects.length >= MAX_EFFECTS) return;
  const colors = PARTICLE_COLORS[materialType] || [colorHex, 0xFFFFFF, 0xFFFF00];
  let count;
  if (state.isMobile) {
    count = 2;
  } else {
    const lvl = weaponLevel || 1;
    if (lvl <= 4) count = 3;
    else if (lvl <= 8) count = 5;
    else count = 8;
  }

  for (let i = 0; i < count; i++) {
    const size = 1 + Math.random() * 2;
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true, opacity: 1.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 12);
    state.scene.add(mesh);

    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 60;
    state.effects.push({
      mesh, mat, type: 'particle',
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      timer: 0, duration: 0.3 + Math.random() * 0.2,
    });
  }
}

export function spawnDestroyParticles(x, y, w, h, colorHex, materialType) {
  if (state.effects.length >= MAX_EFFECTS - 5) return;
  const colors = PARTICLE_COLORS[materialType] || [colorHex];
  const count = state.isMobile ? 6 : 10;

  for (let i = 0; i < count; i++) {
    const size = 2 + Math.random() * 4;
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true, opacity: 1.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x + (Math.random() - 0.5) * w, y + (Math.random() - 0.5) * h, 12);
    state.scene.add(mesh);

    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 100;
    state.effects.push({
      mesh, mat, type: 'particle',
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 20,
      timer: 0, duration: 0.4 + Math.random() * 0.3,
    });
  }

  const flashGeo = new THREE.PlaneGeometry(w * 1.5, h * 1.5);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.8 });
  const flashMesh = new THREE.Mesh(flashGeo, flashMat);
  flashMesh.position.set(x, y, 15);
  state.scene.add(flashMesh);
  state.effects.push({ mesh: flashMesh, mat: flashMat, type: 'flash', timer: 0, duration: 0.15 });

  // 径向冲击波环
  if (!state.isMobile) {
    const ringGeo = new THREE.PlaneGeometry(w, h);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.5 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(x, y, 16);
    state.scene.add(ringMesh);
    state.effects.push({ mesh: ringMesh, mat: ringMat, type: 'shockwave', timer: 0, duration: 0.2 });
  }
}

export function spawnMuzzleFlash(x, y) {
  if (state.effects.length >= MAX_EFFECTS) return;
  const colors = [0xFF8800, 0xFFAA00, 0xFFCC44];
  const count = state.isMobile ? 1 : 2;

  for (let i = 0; i < count; i++) {
    const size = 2 + Math.random() * 3;
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true, opacity: 1.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x + (Math.random() - 0.5) * 4, y + Math.random() * 3, 11);
    state.scene.add(mesh);

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const speed = 20 + Math.random() * 30;
    state.effects.push({
      mesh, mat, type: 'particle',
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 15,
      timer: 0, duration: 0.1 + Math.random() * 0.08,
    });
  }
}

export function spawnDamageText(x, y, damage, color) {
  if (state.damageTexts.length >= MAX_DAMAGE_TEXTS) return;

  const group = new THREE.Group();
  const digitStr = String(damage);
  const digitWidth = 3;
  const totalWidth = digitStr.length * (digitWidth + 1);
  const startX = -totalWidth / 2;

  const DIGITS = {
    '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
    '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
    '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
    '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
    '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
    '7': [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
    '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
    '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
  };

  const pixelMat = new THREE.MeshBasicMaterial({ color: color || 0xFFFFFF, transparent: true, opacity: 1.0 });

  for (let d = 0; d < digitStr.length; d++) {
    const pattern = DIGITS[digitStr[d]];
    const offsetX = startX + d * (digitWidth + 1);
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (pattern[row][col]) {
          const pixel = new THREE.Mesh(sharedPixelGeo, pixelMat.clone());
          pixel.position.set(offsetX + col, -row + 2, 0);
          group.add(pixel);
        }
      }
    }
  }

  group.position.set(x, y, 20);
  state.scene.add(group);

  state.damageTexts.push({
    group,
    timer: 0,
    duration: 0.8,
    vy: 30,
  });
}

export function spawnPickupParticles(x, y) {
  if (state.effects.length >= MAX_EFFECTS - 4) return;
  const count = state.isMobile ? 3 : 6;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const size = 2 + Math.random() * 2;
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 1.0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 12);
    state.scene.add(mesh);

    state.effects.push({
      mesh, mat, type: 'particle',
      vx: Math.cos(angle) * 50,
      vy: Math.sin(angle) * 50,
      timer: 0, duration: 0.4,
    });
  }
}

export function spawnItemSparkle(x, y, timer) {
  if (state.effects.length >= MAX_EFFECTS) return;
  if (Math.random() > 0.15) return;
  const colors = [0xFFFF00, 0xFF88FF, 0x88FFFF, 0xFFFFFF];
  const size = 1 + Math.random() * 2;
  const geo = new THREE.PlaneGeometry(size, size);
  const mat = new THREE.MeshBasicMaterial({
    color: colors[Math.floor(Math.random() * colors.length)],
    transparent: true, opacity: 0.8
  });
  const mesh = new THREE.Mesh(geo, mat);
  const angle = Math.random() * Math.PI * 2;
  const dist = 8 + Math.random() * 6;
  mesh.position.set(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 13);
  state.scene.add(mesh);
  state.effects.push({
    mesh, mat, type: 'sparkle',
    timer: 0, duration: 0.3 + Math.random() * 0.2,
  });
}

export function spawnComboFlash(combo) {
  if (state.effects.length >= MAX_EFFECTS - 3) return;
  const colors = { 5: 0x00FF88, 10: 0x00CCFF, 20: 0xFF44FF, 50: 0xFFD700 };
  const color = colors[combo] || 0xFFFFFF;

  const flashGeo = new THREE.PlaneGeometry(240, 400);
  const flashMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15 });
  const flashMesh = new THREE.Mesh(flashGeo, flashMat);
  flashMesh.position.set(0, 0, 30);
  state.scene.add(flashMesh);
  state.effects.push({ mesh: flashMesh, mat: flashMat, type: 'comboflash', timer: 0, duration: 0.3 });

  // 连击 ×10/×20/×30+ 金色 vignette
  if (combo >= 10) {
    const vignetteGeo = new THREE.PlaneGeometry(240, 400);
    const vignetteMat = new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.1 });
    const vignetteMesh = new THREE.Mesh(vignetteGeo, vignetteMat);
    vignetteMesh.position.set(0, 0, 31);
    state.scene.add(vignetteMesh);
    state.effects.push({ mesh: vignetteMesh, mat: vignetteMat, type: 'comboflash', timer: 0, duration: 0.5 });
  }

  const textGroup = new THREE.Group();
  const labels = { 5: 'NICE!', 10: 'GREAT!', 20: 'AMAZING!', 50: 'LEGENDARY!' };
  const label = labels[combo] || 'COMBO!';
  const labelColors = { 5: 0x00FF88, 10: 0x00CCFF, 20: 0xFF44FF, 50: 0xFFD700 };
  const textColor = labelColors[combo] || 0xFFFFFF;

  const DIGITS = {
    'N': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,0,1]], 'I': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
    'C': [[1,1,1],[1,0,0],[1,0,0],[1,0,0],[1,1,1]], 'E': [[1,1,1],[1,0,0],[1,1,1],[1,0,0],[1,1,1]],
    '!': [[1],[1],[1],[0],[1]],
    'G': [[1,1,1],[1,0,0],[1,0,1],[1,0,1],[1,1,1]], 'R': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
    'A': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]], 'T': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
    'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    'Z': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
    'L': [[1,0],[1,0],[1,0],[1,0],[1,1]], 'D': [[1,1,0],[1,0,1],[1,0,1],[1,0,1],[1,1,0]],
    'Y': [[1,0,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
    'O': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  };

  const charWidth = 3;
  const gap = 1;
  let totalW = 0;
  for (let c = 0; c < label.length; c++) {
    const ch = label[c];
    const pattern = DIGITS[ch];
    if (pattern) totalW += (pattern[0].length) + gap;
  }
  totalW -= gap;

  let offsetX = -totalW / 2;
  const pixelMat = new THREE.MeshBasicMaterial({ color: textColor, transparent: true, opacity: 1.0 });
  for (let c = 0; c < label.length; c++) {
    const ch = label[c];
    const pattern = DIGITS[ch];
    if (!pattern) continue;
    const cols = pattern[0].length;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < cols; col++) {
        if (pattern[row][col]) {
          const pixel = new THREE.Mesh(sharedPixelGeo, pixelMat.clone());
          pixel.position.set(offsetX + col, -row + 2, 0);
          textGroup.add(pixel);
        }
      }
    }
    offsetX += cols + gap;
  }

  textGroup.position.set(0, 40, 25);
  textGroup.scale.setScalar(2);
  state.scene.add(textGroup);
  state.effects.push({ mesh: textGroup, mat: pixelMat, type: 'combotext', timer: 0, duration: 1.2 });
}

export function spawnExtraExplosion(x, y, size, color) {
  if (state.effects.length >= MAX_EFFECTS - 3) return;
  const count = state.isMobile ? 4 : 6;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const pSize = 2 + Math.random() * (size / 3);
    const geo = new THREE.PlaneGeometry(pSize, pSize);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1.0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 14);
    state.scene.add(mesh);
    const speed = 30 + Math.random() * 60;
    state.effects.push({
      mesh, mat, type: 'particle',
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 10,
      timer: 0, duration: 0.3 + Math.random() * 0.2,
    });
  }
  const ringGeo = new THREE.PlaneGeometry(size, size);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xFF8800, transparent: true, opacity: 0.6 });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.set(x, y, 15);
  state.scene.add(ringMesh);
  state.effects.push({ mesh: ringMesh, mat: ringMat, type: 'flash', timer: 0, duration: 0.2 });
}

let shakeIntensity = 0;
let shakeTimer = 0;
const SHAKE_DURATION = 0.15;

export function triggerScreenShake(intensity) {
  shakeIntensity = Math.max(shakeIntensity, intensity);
  shakeTimer = SHAKE_DURATION;
}

function updateScreenShake(dt) {
  if (shakeTimer > 0) {
    shakeTimer -= dt;
    if (shakeTimer <= 0) {
      shakeIntensity = 0;
      if (state.camera) {
        state.camera.position.x = 0;
        state.camera.position.y = 0;
      }
    } else {
      const progress = shakeTimer / SHAKE_DURATION;
      const offsetX = (Math.random() - 0.5) * 2 * shakeIntensity * progress;
      const offsetY = (Math.random() - 0.5) * 2 * shakeIntensity * progress;
      if (state.camera) {
        state.camera.position.x = offsetX;
        state.camera.position.y = offsetY;
      }
    }
  }
}

function disposeMeshDeep(obj) {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    if (Array.isArray(obj.material)) {
      obj.material.forEach(m => m.dispose());
    } else {
      obj.material.dispose();
    }
  }
  if (obj.children) {
    obj.children.forEach(child => disposeMeshDeep(child));
  }
}

export function updateEffects(dt) {
  updateScreenShake(dt);

  for (let i = state.effects.length - 1; i >= 0; i--) {
    const fx = state.effects[i];
    fx.timer += dt;
    const progress = fx.timer / fx.duration;

    if (fx.type === 'particle') {
      fx.mesh.position.x += fx.vx * dt;
      fx.mesh.position.y += fx.vy * dt;
      fx.vy -= 80 * dt;
      fx.mat.opacity = Math.max(0, 1 - progress);
    } else if (fx.type === 'sparkle') {
      fx.mat.opacity = Math.max(0, 0.8 * (1 - progress));
      fx.mesh.scale.setScalar(1 + progress * 0.5);
    } else if (fx.type === 'flash') {
      fx.mat.opacity = Math.max(0, 0.8 * (1 - progress));
      const scale = 1 + progress * 2;
      fx.mesh.scale.setScalar(scale);
    } else if (fx.type === 'explosion') {
      fx.mat.opacity = Math.max(0, 0.8 * (1 - progress));
      const scale = 1 + progress * 4;
      fx.mesh.scale.setScalar(scale);
    } else if (fx.type === 'popup') {
      fx.mesh.position.y += 15 * dt;
      fx.mat.opacity = Math.max(0, 0.7 * (1 - progress));
      fx.mesh.children.forEach(child => {
        if (child.material && child.material !== fx.mat) {
          child.material.opacity = Math.max(0, child.material.opacity * 0.98);
        }
      });
    } else if (fx.type === 'comboflash') {
      fx.mat.opacity = Math.max(0, 0.15 * (1 - progress));
    } else if (fx.type === 'shockwave') {
      fx.mat.opacity = Math.max(0, 0.5 * (1 - progress));
      const scale = 1 + progress * 3;
      fx.mesh.scale.setScalar(scale);
    } else if (fx.type === 'combotext') {
      fx.mesh.position.y += 10 * dt;
      const scale = 2 + progress * 0.5;
      fx.mesh.scale.setScalar(scale);
      fx.mesh.children.forEach(child => {
        if (child.material) child.material.opacity = Math.max(0, 1 - progress);
      });
    }

    if (fx.timer >= fx.duration) {
      state.scene.remove(fx.mesh);
      disposeMeshDeep(fx.mesh);
      if (fx.mat && fx.mat !== sharedPixelGeo) fx.mat.dispose();
      if (fx.texResult) disposeTextTexture(fx.texResult);
      state.effects.splice(i, 1);
    }
  }

  for (let i = state.damageTexts.length - 1; i >= 0; i--) {
    const dtObj = state.damageTexts[i];
    dtObj.timer += dt;
    dtObj.group.position.y += dtObj.vy * dt;
    const progress = dtObj.timer / dtObj.duration;

    dtObj.group.children.forEach(child => {
      if (child.material) child.material.opacity = Math.max(0, 1 - progress);
    });

    if (dtObj.timer >= dtObj.duration) {
      state.scene.remove(dtObj.group);
      disposeMeshDeep(dtObj.group);
      state.damageTexts.splice(i, 1);
    }
  }
}

export function resetEffects() {
  for (const fx of state.effects) {
    state.scene.remove(fx.mesh);
    disposeMeshDeep(fx.mesh);
    fx.mat.dispose();
  }
  state.effects.length = 0;

  for (const dtObj of state.damageTexts) {
    state.scene.remove(dtObj.group);
    disposeMeshDeep(dtObj.group);
  }
  state.damageTexts.length = 0;

  shakeIntensity = 0;
  shakeTimer = 0;
  if (state.camera) {
    state.camera.position.x = 0;
    state.camera.position.y = 0;
  }
}

export function spawnWaveAnnouncement(waveIndex) {
  const group = new THREE.Group();

  const bgGeo = new THREE.PlaneGeometry(100, 20);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  bg.position.z = 25;
  group.add(bg);

  const borderGeo = new THREE.PlaneGeometry(102, 22);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.4 });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.z = 24;
  group.add(border);

  const waveNames = ['教学', '热身', '初级', '进阶', '挑战', '困难', '精英', '噩梦', '地狱', '深渊'];
  const waveName = waveNames[waveIndex] || `W${waveIndex + 1}`;
  const texResult = createTextTexture(`WAVE ${waveIndex + 1} - ${waveName}`, '#FFD700', 8);
  const labelGeo = new THREE.PlaneGeometry(texResult.width, texResult.height);
  const labelMat = new THREE.MeshBasicMaterial({ map: texResult.texture, transparent: true, depthWrite: false });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.z = 26;
  group.add(label);

  group.position.set(0, 0, 0);
  state.scene.add(group);

  state.effects.push({ mesh: group, mat: bgMat, type: 'popup', timer: 0, duration: 2.0, texResult });
}
