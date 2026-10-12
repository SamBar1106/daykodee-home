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
  const fit = 1.15 / Math.max(size.x, size.y, 0.001);
  wrapper.scale.setScalar(fit);
  wrapper.position.set(-center.x * fit, -center.y * fit, -center.z * fit);
  return wrapper;
}

function frameCamera(camera, contentWidth, contentHeight, nearZ, lookY, aspect) {
  const fov = 26;
  const halfFov = (fov * Math.PI) / 180 / 2;
  const hFov = Math.atan(Math.tan(halfFov) * Math.max(aspect, 0.2));
  const distY = contentHeight * 0.5 / Math.tan(halfFov) + nearZ;
  const distX = contentWidth * 0.5 / Math.tan(hFov) + nearZ;
  const dist = Math.max(distY, distX) * 1.08;
  camera.fov = fov;
  camera.aspect = aspect;
  camera.position.set(0, lookY, dist);
  camera.near = Math.max(0.01, dist / 80);
  camera.far = dist * 12;
  camera.lookAt(0, lookY, 0);
  camera.updateProjectionMatrix();
}

/** One horizontal row. Spacing uses the real bounds of the widest pose. */
function layoutRow(THREE, products) {
  const yaws = [-0.64, 0, 0.64];
  const pitches = [-0.22, 0, 0.22];
  const gap = 0.42;
  const measured = products.map((spin) => {
    spin.rotation.set(0, 0, 0);
    spin.position.set(0, 0, 0);
    spin.updateWorldMatrix(true, true);
    const rest = new THREE.Box3().setFromObject(spin);
    const restSize = rest.getSize(new THREE.Vector3());
    let halfW = restSize.x / 2;
    let maxY = rest.max.y;
    let minY = rest.min.y;
    let nearZ = rest.max.z;
    for (const yaw of yaws) {
      for (const pitch of pitches) {
        spin.rotation.set(pitch, yaw, 0);
        spin.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(spin);
        halfW = Math.max(halfW, Math.abs(box.min.x), Math.abs(box.max.x));
        maxY = Math.max(maxY, box.max.y);
        minY = Math.min(minY, box.min.y);
        nearZ = Math.max(nearZ, box.max.z);
      }
    }
    spin.rotation.set(0, 0, 0);
    return { spin, hy: restSize.y / 2, halfW, maxY, minY, nearZ };
  });
  const totalW = measured.reduce((sum, item) => sum + item.halfW * 2, 0) + gap * Math.max(measured.length - 1, 0);
  let cursor = -totalW / 2;
  const maxHy = Math.max(...measured.map((item) => item.hy));
  let spanTop = -Infinity;
  let spanBottom = Infinity;
  let nearZ = 0;
  measured.forEach((item) => {
    const baseY = -maxHy + item.hy;
    item.spin.userData.baseX = cursor + item.halfW;
    item.spin.userData.baseY = baseY;
    cursor += item.halfW * 2 + gap;
    spanTop = Math.max(spanTop, baseY + item.maxY);
    spanBottom = Math.min(spanBottom, baseY + item.minY);
    nearZ = Math.max(nearZ, item.nearZ);
  });
  const pad = 0.12;
  return {
    contentW: totalW + pad,
    contentH: spanTop - spanBottom + pad + 0.1,
    nearZ,
    lookY: (spanTop + spanBottom) / 2,
  };
}

export function setupProducts() {
  const views = [...document.querySelectorAll(".product-view")];
  if (!views.length) return;

  if (document.documentElement.classList.contains("is-embed")) {
    boot(views, true).catch(() => {
      /* The row stays empty if WebGL or a model fails. */
    });
    return;
  }

  let started = false;
  const observer = new IntersectionObserver(
    (entries) => {
      if (started) return;
      if (!entries.some((entry) => entry.isIntersecting)) return;
      started = true;
      observer.disconnect();
      boot(views, false).catch(() => {
        /* Posters stay in place if WebGL or a model fails. */
      });
    },
    { rootMargin: "240px 0px" },
  );
  views.forEach((view) => observer.observe(view));
}

async function boot(views, immediate) {
  if (!immediate) {
    await afterFirstPaint();
    await whenIdle();
  }

  const THREE = await import("three");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const { MeshoptDecoder } = await import("three/addons/libs/meshopt_decoder.module.js");
  const { DecalGeometry } = await import("three/addons/geometries/DecalGeometry.js");

  const reduce = window.matchMedia(REDUCE).matches;
  const fine = window.matchMedia(FINE).matches;

  const host = views[0];
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

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

    const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 50);
    const bounds = layoutRow(THREE, products);
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

    return { view, scene, root, products, camera, pointer, bounds };
  });

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

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
    const height = window.innerHeight;
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, true);

    for (const item of scenes) {
      if (!visible.has(item.view)) continue;
      const rect = item.view.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (rect.bottom < 0 || rect.top > height) continue;

      if (!reduce) {
        item.pointer.x += (item.pointer.tx - item.pointer.x) * 0.08;
        item.pointer.y += (item.pointer.ty - item.pointer.y) * 0.08;
      }
      const mid = (rect.top + rect.height / 2) / height - 0.5;
      item.products.forEach((spin) => {
        const phase = spin.userData.phase;
        spin.position.x = spin.userData.baseX;
        spin.position.z = 0;
        if (reduce) {
          spin.rotation.set(0, 0, 0);
          spin.position.y = spin.userData.baseY;
        } else {
          spin.rotation.y = Math.sin(elapsed * 0.42 + phase) * 0.38 + item.pointer.x;
          spin.rotation.x = Math.sin(elapsed * 0.33 + phase) * 0.05 + item.pointer.y + mid * -0.16;
          spin.position.y = spin.userData.baseY + Math.sin(elapsed * 1.15 + phase) * 0.04;
        }
      });

      const aspect = canvas.width / Math.max(canvas.height, 1);
      frameCamera(item.camera, item.bounds.contentW, item.bounds.contentH, item.bounds.nearZ, item.bounds.lookY, aspect);
      renderer.render(item.scene, item.camera);
      item.view.dataset.ready = "1";
    }
  }
}
