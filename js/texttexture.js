import * as THREE from 'three';

const cache = new Map();
const MAX_CACHE = 20;

export function createTextTexture(text, color, fontSize) {
  fontSize = fontSize || 10;
  const hexColor = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color;
  const cacheKey = text + '_' + hexColor + '_' + fontSize;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const scale = 2;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${fontSize * scale}px monospace`;
  const metrics = ctx.measureText(text);
  const textWidth = Math.ceil(metrics.width) + 4 * scale;
  const textHeight = Math.ceil(fontSize * scale * 1.4);

  canvas.width = textWidth;
  canvas.height = textHeight;

  ctx.font = `bold ${fontSize * scale}px monospace`;
  ctx.fillStyle = hexColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, textWidth / 2, textHeight / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  const result = { texture, width: textWidth / scale, height: textHeight / scale };

  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    const old = cache.get(oldest);
    old.texture.dispose();
    cache.delete(oldest);
  }
  cache.set(cacheKey, result);

  return result;
}

export function disposeTextTexture(result) {
  if (!result) return;
  for (const [key, val] of cache) {
    if (val === result) {
      cache.delete(key);
      break;
    }
  }
  result.texture.dispose();
}
