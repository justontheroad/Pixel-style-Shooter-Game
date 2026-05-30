import * as THREE from 'three';
import { state } from './state.js';
import { GAME_WIDTH, GAME_HEIGHT, CHANNEL_WIDTH, DIVIDER_WIDTH, CHANNEL_LEFT_X, CHANNEL_RIGHT_X, COLORS } from './config.js';

export function initScene() {
  const mobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  state.isMobile = mobile;

  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(COLORS.bgDark);

  const aspect = GAME_WIDTH / GAME_HEIGHT;
  const frustumHeight = GAME_HEIGHT;
  const frustumWidth = frustumHeight * aspect;

  state.camera = new THREE.OrthographicCamera(
    -frustumWidth / 2, frustumWidth / 2,
    frustumHeight / 2, -frustumHeight / 2,
    0.1, 1000
  );
  state.camera.position.set(0, 0, 100);
  state.camera.lookAt(0, 0, 0);

  state.renderer = new THREE.WebGLRenderer({ antialias: false });
  state.renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
  state.renderer.setPixelRatio(1);
  const canvas = state.renderer.domElement;
  canvas.style.imageRendering = 'pixelated';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.objectFit = 'contain';
  canvas.style.maxWidth = (GAME_WIDTH / GAME_HEIGHT * 100) + 'vh';
  canvas.style.maxHeight = '100vh';
  document.getElementById('gameContainer').appendChild(canvas);

  state.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const playerLight = new THREE.PointLight(0x00ff88, 1.5, 200);
  playerLight.position.set(0, -GAME_HEIGHT / 2 + 30, 50);
  state.scene.add(playerLight);
  state.playerLight = playerLight;

  const floorGeo = new THREE.PlaneGeometry(CHANNEL_WIDTH, GAME_HEIGHT);
  const floorMat = new THREE.MeshBasicMaterial({ color: COLORS.channelFloor });

  const leftFloor = new THREE.Mesh(floorGeo, floorMat);
  leftFloor.position.set(CHANNEL_LEFT_X, 0, -1);
  state.scene.add(leftFloor);

  const rightFloor = new THREE.Mesh(floorGeo, floorMat);
  rightFloor.position.set(CHANNEL_RIGHT_X, 0, -1);
  state.scene.add(rightFloor);

  const dividerGeo = new THREE.PlaneGeometry(DIVIDER_WIDTH, GAME_HEIGHT);
  const dividerMat = new THREE.MeshBasicMaterial({ color: COLORS.divider });
  const divider = new THREE.Mesh(dividerGeo, dividerMat);
  divider.position.set(0, 0, 0);
  state.scene.add(divider);

  const dashGeo = new THREE.PlaneGeometry(2, 6);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0x444466 });
  for (let y = -GAME_HEIGHT / 2; y < GAME_HEIGHT / 2; y += 14) {
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.position.set(0, y, 1);
    state.scene.add(dash);
  }

  const starCount = mobile ? 40 : 80;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * GAME_WIDTH * 1.5;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * GAME_HEIGHT * 1.2;
    starPos[i * 3 + 2] = -5;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0x334455, size: 2, sizeAttenuation: false });
  state.bgStars = new THREE.Points(starGeo, starMat);
  state.scene.add(state.bgStars);

  const deathLineGeo = new THREE.PlaneGeometry(GAME_WIDTH, 2);
  const deathLineMat = new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.3 });
  const deathLine = new THREE.Mesh(deathLineGeo, deathLineMat);
  deathLine.position.set(0, -GAME_HEIGHT / 2 + 10, 2);
  state.scene.add(deathLine);
}

export function updateScene(dt) {
  if (state.bgStars) {
    const posAttr = state.bgStars.geometry.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
      let y = posAttr.getY(i);
      y -= 5 * dt;
      if (y < -GAME_HEIGHT * 0.6) y = GAME_HEIGHT * 0.6;
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;
  }
}
