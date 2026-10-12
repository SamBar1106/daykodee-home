/**
 * Rodin product models. One renderer, lazy-loaded near the viewport.
 * The baked logos are soft, so each product gets logo-decal.png projected
 * on its front. The bottle cap and handle are part of the single baked
 * material (no vertex colors), so they are left as authored.
 */

const REDUCE = "(prefers-reduced-motion: reduce)";
const FINE = "(hover: hover) and (pointer: fine)";
const LOGO_ASPECT = 1433 / 942;

const PLACEMENTS = {
  bottle: { x: 0.5, y: 0.6, width: 0.64, depth: 0.24 },
  cap: { x: 0.5, y: 0.58, width: 0.5, depth: 0.32 },
  backpack: { x: 0.5, y: 0.44, width: 0.5, depth: 0.34 },
};

const ORDER = ["bottle", "cap", "backpack"];

function afterFirstPaint() {
  return new Promise((resolve) => {
    const done = () => requestAnimationFrame(() => requestAnimationFrame(resolve));
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });
  });
}

function whenIdle() {
  return new Promise((resolve) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => resolve(), { timeout: 800 });
    else setTimeout(resolve, 48);
  });
}

function modelUrl(file) {
  return `${import.meta.env.BASE_URL}models/${file}`;
}

function buildDecal(THREE, DecalGeometry, mesh, texture, spec) {
  mesh.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const x = box.min.x + size.x * spec.x;
  const y = box.min.y + size.y * spec.y;
  const raycaster = new THREE.Raycaster();
  let hit = null;
  for (const dy of [0, size.y * 0.04, -size.y * 0.04, size.y * 0.08, -size.y * 0.08]) {
    raycaster.set(new THREE.Vector3(x, y + dy, box.max.z + size.z), new THREE.Vector3(0, 0, -1));
    hit = raycaster.intersectObject(mesh, false)[0];
    if (hit) break;
  }
  if (!hit) return null;

  const normal = hit.face.normal.clone().transformDirection(mesh.matrixWorld).normalize();
  const position = hit.point.clone().addScaledVector(normal, 0.008);
  const helper = new THREE.Object3D();
  helper.position.copy(position);
  helper.lookAt(position.clone().add(normal));

  const width = size.x * spec.width;
  const height = width / LOGO_ASPECT;
  const depth = Math.max(size.z * spec.depth, height * 0.55);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -8,
    polygonOffsetUnits: -8,
    toneMapped: false,
  });

  let geometry = new DecalGeometry(mesh, position, helper.rotation, new THREE.Vector3(width, height, depth));
  let decal;
  if (!geometry.getAttribute("position") || geometry.getAttribute("position").count < 3) {
    geometry.dispose();
    geometry = new THREE.PlaneGeometry(width, height);
    decal = new THREE.Mesh(geometry, material);
    decal.position.copy(position);
    decal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  } else {
    decal = new THREE.Mesh(geometry, material);
  }
  decal.renderOrder = 2;
  decal.name = "logo-decal";
  return decal;
}

function prepareTemplate(THREE, DecalGeometry, gltf, texture, spec) {
  const model = gltf.scene;
  model.updateMatrixWorld(true);
  const mesh = model.getObjectByProperty("isMesh", true);
  const wrapper = new THREE.Group();
  wrapper.add(model);
  if (mesh) {
    const decal = buildDecal(THREE, DecalGeometry, mesh, texture, spec);
    if (decal) wrapper.add(decal);
  }
  return wrapper;
}

function normalize(THREE, wrapper) {
  wrapper.position.set(0, 0, 0);
  wrapper.scale.set(1, 1, 1);
  wrapper.rotation.set(0, 0, 0);
  wrapper.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(wrapper);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const fit = 1.2 / Math.max(size.x, size.y, size.z);
  wrapper.scale.setScalar(fit);
  wrapper.position.set(-center.x * fit, -center.y * fit, -center.z * fit);
  return wrapper;
}

function frameCamera(camera, count, stacked, aspect) {
  const span = Math.max(count - 1, 0) * 1.55;
  const width = stacked ? 1.4 : span + 1.4;
  const height = stacked ? span + 1.45 : 1.5;
  const fov = 28;
  const halfFov = (fov * Math.PI) / 180 / 2;
  const distY = height * 0.5 / Math.tan(halfFov);
  const distX = width * 0.5 / (Math.tan(halfFov) * Math.max(aspect, 0.2));
  const dist = Math.max(distY, distX) * 1.08;
  camera.fov = fov;
  camera.aspect = aspect;
  camera.position.set(0, 0, dist);
  camera.near = Math.max(0.01, dist / 80);
  camera.far = dist * 12;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

export function setupProducts() {
  const views = [...document.querySelectorAll(".product-view")];
  if (!views.length) return;

  let started = false;
  const observer = new IntersectionObserver(
    (entries) => {
      if (started) return;
      if (!entries.some((entry) => entry.isIntersecting)) return;
      started = true;
      observer.disconnect();
      boot(views).catch(() => {
        /* Posters stay in place if WebGL or a model fails. */
      });
    },
    { rootMargin: "240px 0px" },
  );
  views.forEach((view) => observer.observe(view));
}

async function boot(views) {
  await afterFirstPaint();
  await whenIdle();

  const THREE = await import("three");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const { MeshoptDecoder } = await import("three/addons/libs/meshopt_decoder.module.js");
  const { DecalGeometry } = await import("three/addons/geometries/DecalGeometry.js");

  const reduce = window.matchMedia(REDUCE).matches;
  const fine = window.matchMedia(FINE).matches;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:6;";
  document.body.appendChild(canvas);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const texture = await new THREE.TextureLoader().loadAsync(modelUrl("logo-decal.png"));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.premultiplyAlpha = false;

  const needed = new Set(views.flatMap((view) => (view.dataset.products || ORDER.join(" ")).split(/\s+/)));
  const templates = new Map();
  await Promise.all(
    [...needed].map(async (name) => {
      const gltf = await loader.loadAsync(modelUrl(`${name}.glb`));
      templates.set(name, prepareTemplate(THREE, DecalGeometry, gltf, texture, PLACEMENTS[name]));
    }),
  );

  const scenes = views.map((view) => {
    const names = (view.dataset.products || ORDER.join(" ")).split(/\s+/).filter((name) => templates.has(name));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#EBDFC2");
    scene.add(new THREE.AmbientLight(0xffffff, 0.92));
    const key = new THREE.DirectionalLight(0xffffff, 1.75);
    key.position.set(1.4, 2.6, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xfff6e4, 0.45);
    fill.position.set(-2.2, 1.2, 2.4);
    scene.add(fill);

    const root = new THREE.Group();
    scene.add(root);
    const products = names.map((name, index) => {
      const model = normalize(THREE, templates.get(name).clone(true));
      const spin = new THREE.Group();
      spin.add(model);
      spin.userData.phase = index * 1.35;
      root.add(spin);
      return spin;
    });

    const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 50);
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    if (!reduce && fine) {
      view.addEventListener("pointermove", (event) => {
        const rect = view.getBoundingClientRect();
        pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 0.26;
        pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * -0.14;
      });
      view.addEventListener("pointerleave", () => {
        pointer.tx = 0;
        pointer.ty = 0;
      });
    }

    return { view, scene, root, products, camera, pointer };
  });

  const resize = () => {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  };
  window.addEventListener("resize", resize);

  let running = false;
  const visible = new Set();
  const watch = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    if (visible.size && !running) {
      running = true;
      renderer.setAnimationLoop(frame);
    }
  }, { threshold: 0.01 });
  views.forEach((view) => watch.observe(view));

  const clock = new THREE.Clock();
  function frame() {
    if (!visible.size || document.hidden) {
      if (!visible.size) {
        running = false;
        renderer.setAnimationLoop(null);
        renderer.setScissorTest(false);
        renderer.setClearColor(0x000000, 0);
        renderer.clear(true, true, true);
      }
      return;
    }

    const elapsed = clock.getElapsedTime();
    const dpr = renderer.getPixelRatio();
    const height = window.innerHeight;

    renderer.setScissorTest(false);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, true);
    renderer.setScissorTest(true);

    for (const item of scenes) {
      if (!visible.has(item.view)) continue;
      const rect = item.view.getBoundingClientRect();
      const border = 3;
      const left = rect.left + border;
      const top = rect.top + border;
      const width = Math.max(1, rect.width - border * 2);
      const heightPx = Math.max(1, rect.height - border * 2);
      if (top > height || top + heightPx < 0) continue;

      const stacked = item.products.length > 1 && width < 560;
      if (!reduce) {
        item.pointer.x += (item.pointer.tx - item.pointer.x) * 0.08;
        item.pointer.y += (item.pointer.ty - item.pointer.y) * 0.08;
      }
      const mid = (rect.top + rect.height / 2) / height - 0.5;
      item.products.forEach((spin, index) => {
        const count = item.products.length;
        const offset = index - (count - 1) / 2;
        const layoutY = stacked ? ((count - 1) / 2) * 1.55 - index * 1.55 : 0;
        spin.position.x = stacked ? 0 : offset * 1.55;
        const phase = spin.userData.phase;
        if (reduce) {
          spin.rotation.set(0, 0, 0);
          spin.position.y = layoutY;
          spin.position.z = 0;
        } else {
          spin.rotation.y = Math.sin(elapsed * 0.42 + phase) * 0.38 + item.pointer.x;
          spin.rotation.x = Math.sin(elapsed * 0.33 + phase) * 0.05 + item.pointer.y + mid * -0.16;
          spin.position.y = layoutY + Math.sin(elapsed * 1.15 + phase) * 0.04;
        }
      });

      frameCamera(item.camera, item.products.length, stacked, width / heightPx);
      renderer.setViewport(left * dpr, (height - (top + heightPx)) * dpr, width * dpr, heightPx * dpr);
      renderer.setScissor(left * dpr, (height - (top + heightPx)) * dpr, width * dpr, heightPx * dpr);
      renderer.clearDepth();
      renderer.render(item.scene, item.camera);
      item.view.classList.add("is-live");
      item.view.dataset.ready = "1";
    }
  }
}
