import * as THREE from 'three';
import { state } from './state.js';

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

export function spawnHitParticles(x, y, materialType, colorHex) {
  if (state.effects.length >= MAX_EFFECTS) return;
  const colors = PARTICLE_COLORS[materialType] || [colorHex, 0xFFFFFF, 0xFFFF00];
  const count = state.isMobile ? 2 : 3;

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
}

export function spawnDamageText(x, y, damage) {
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

  const pixelMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 1.0 });

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
  for (let i = state.effects.length - 1; i >= 0; i--) {
    const fx = state.effects[i];
    fx.timer += dt;
    const progress = fx.timer / fx.duration;

    if (fx.type === 'particle') {
      fx.mesh.position.x += fx.vx * dt;
      fx.mesh.position.y += fx.vy * dt;
      fx.vy -= 80 * dt;
      fx.mat.opacity = Math.max(0, 1 - progress);
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
    }

    if (fx.timer >= fx.duration) {
      state.scene.remove(fx.mesh);
      disposeMeshDeep(fx.mesh);
      fx.mat.dispose();
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
}
