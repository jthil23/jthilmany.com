import type { MapState } from './render2d';
import { renderMap, ROUTE_COLORS } from './render2d';
import type * as Three from 'three';
import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js';

export interface Terrain3DView {
  update(state: MapState, exaggeration: number): void;
  dispose(): void;
}

export async function mount3D(container: HTMLElement, initial: MapState, exaggeration: number, reducedMotion: boolean): Promise<Terrain3DView> {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
  if (!THREE.WebGLRenderer) throw new Error('WebGL is unavailable in this browser.');

  const renderer: Three.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x071224, 0);
  container.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Three-dimensional terrain model. Drag to orbit; scroll or pinch to zoom.');
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 5000);
  camera.position.set(0, 280, 390);
  const controls: OrbitControlsType = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = 0.08;
  controls.minDistance = 100;
  controls.maxDistance = 1100;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 20, 0);
  scene.add(new THREE.HemisphereLight(0xe5f2ff, 0x26364b, 2.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-160, 260, 190);
  scene.add(sun);

  const field = initial.field;
  const widthWorld = 320;
  const depthWorld = widthWorld * field.h / field.w;
  const geometry = new THREE.PlaneGeometry(widthWorld, depthWorld, field.w - 1, field.h - 1);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position as Three.BufferAttribute;
  const elevations = field.elev;
  const baseline = field.min;
  const terrainRange = Math.max(1, field.max - field.min);
  const exaggerationScale = 95 / terrainRange * exaggeration;
  for (let i = 0; i < elevations.length; i++) positions.setY(i, (elevations[i] - baseline) * exaggerationScale);
  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = 1024;
  mapCanvas.height = 768;
  mapCanvas.style.position = 'absolute';
  mapCanvas.style.inset = '0';
  mapCanvas.style.width = '100%';
  mapCanvas.style.height = '100%';
  mapCanvas.style.visibility = 'hidden';
  mapCanvas.style.pointerEvents = 'none';
  container.append(mapCanvas);
  const texture = new THREE.CanvasTexture(mapCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const terrainMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.94, metalness: 0, side: THREE.DoubleSide });
  const terrain = new THREE.Mesh(geometry, terrainMaterial);
  scene.add(terrain);
  const trails: Three.Object3D[] = [];
  function update(next: MapState, nextExaggeration: number): void {
    renderMap(mapCanvas, next, 1);
    texture.needsUpdate = true;
    for (const object of trails) {
      scene.remove(object);
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
        else object.material.dispose();
      }
    }
    trails.length = 0;
    const currentRange = Math.max(1, next.field.max - next.field.min);
    const scale = 95 / currentRange * nextExaggeration;
    const sx = widthWorld / (next.field.w - 1);
    const sz = depthWorld / (next.field.h - 1);
    for (const result of next.routes) {
      if (!result.path || result.path.length < 2) continue;
      const points: Three.Vector3[] = [];
      for (let i = 0; i < result.path.length; i++) {
        const cell = result.path[i];
        const x = cell % next.field.w;
        const y = Math.floor(cell / next.field.w);
        const elevation = next.field.elev[cell];
        points.push(new THREE.Vector3(-widthWorld / 2 + x * sx, (elevation - next.field.min) * scale + 1.2, -depthWorld / 2 + y * sz));
      }
      const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
      const trailGeometry = new THREE.TubeGeometry(curve, Math.max(24, points.length * 2), 0.75, 5, false);
      const trailMaterial = new THREE.MeshStandardMaterial({ color: ROUTE_COLORS[result.algorithm], emissive: ROUTE_COLORS[result.algorithm], emissiveIntensity: 0.12, roughness: 0.7 });
      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      scene.add(trail);
      trails.push(trail);
    }
    for (let i = 0; i < positions.count; i++) {
      positions.setY(i, (next.field.elev[i] - next.field.min) * scale);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  const resizeObserver = new ResizeObserver(() => {
    const bounds = container.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(container);
  const bounds = container.getBoundingClientRect();
  renderer.setSize(bounds.width || 800, bounds.height || 480, false);
  camera.aspect = (bounds.width || 800) / (bounds.height || 480);
  camera.updateProjectionMatrix();
  update(initial, exaggeration);
  let frame = 0;
  let disposed = false;
  const animate = () => {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(animate);

  return {
    update,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      controls.dispose();
      for (const object of trails) {
        scene.remove(object);
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
          else object.material.dispose();
        }
      }
      trails.length = 0;
      geometry.dispose();
      terrainMaterial.dispose();
      texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      mapCanvas.remove();
      const gl = renderer.getContext();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
