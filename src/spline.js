import gsap from "gsap";

const PHONE = "(max-width: 767px)";
const TABLET = "(min-width: 768px) and (max-width: 1199px)";
const DESKTOP = "(min-width: 1200px)";
const FINE = "(hover: hover) and (pointer: fine)";
const REDUCE = "(prefers-reduced-motion: reduce)";
const TWO_MB = 2 * 1024 * 1024;

let viewerPromise;

function loadViewerScript() {
  viewerPromise ??= import("@splinetool/viewer");
  return viewerPromise;
}

function afterFirstPaint() {
  return new Promise((resolve) => {
    const done = () => requestAnimationFrame(() => requestAnimationFrame(resolve));
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });
  });
}

async function sceneBytes(url) {
  try {
    const response = await fetch(url, { method: "HEAD", mode: "cors" });
    const length = Number(response.headers.get("content-length"));
    if (Number.isFinite(length) && length > 0) return length;
  } catch {
    /* Unknown size. Tablets fall back to the poster. */
  }
  return null;
}

function floatPoster(slot) {
  const image = slot.querySelector(".spline-slot__img");
  if (!image) return;
  const reduce = window.matchMedia(REDUCE).matches;
  const phone = window.matchMedia(PHONE).matches;
  if (reduce || phone) return;
  gsap.fromTo(
    image,
    { y: -12 },
    { y: 12, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 },
  );
}

function followPointer(slot) {
  const stage = slot.querySelector(".spline-slot__stage");
  if (!stage) return;
  const allow =
    window.matchMedia(DESKTOP).matches &&
    window.matchMedia(FINE).matches &&
    !window.matchMedia(REDUCE).matches;
  if (!allow) return;

  slot.addEventListener("pointermove", (event) => {
    const box = slot.getBoundingClientRect();
    const rotateY = ((event.clientX - box.left) / box.width - 0.5) * 10;
    const rotateX = ((event.clientY - box.top) / box.height - 0.5) * -10;
    gsap.to(stage, { rotateX, rotateY, duration: 0.4, ease: "power2.out", overwrite: "auto" });
  });
  slot.addEventListener("pointerleave", () => {
    gsap.to(stage, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "power3.out", overwrite: "auto" });
  });
}

async function mountViewer(slot, url) {
  await loadViewerScript();
  const stage = slot.querySelector(".spline-slot__stage");
  if (!stage) return;
  const viewer = document.createElement("spline-viewer");
  viewer.setAttribute("url", url);
  viewer.setAttribute("loading", "eager");
  viewer.setAttribute("events-target", "local");
  viewer.setAttribute("background", "#EBDFC2");
  viewer.style.width = "100%";
  viewer.style.height = "100%";
  viewer.style.display = "block";
  viewer.addEventListener("load", () => {
    const logo = viewer.shadowRoot?.querySelector("#logo");
    if (logo) logo.style.display = "none";
  });
  stage.replaceChildren(viewer);
  slot.classList.add("is-live");
}

/**
 * Placeholder floats until SPLINE_SCENE_URL or data-spline-url is set.
 * The viewer script loads only after first paint, and only near the slot.
 */
export function setupSpline(sceneUrl) {
  const slots = [...document.querySelectorAll(".spline-slot")];
  if (!slots.length) return;

  const phone = window.matchMedia(PHONE).matches;
  const tablet = window.matchMedia(TABLET).matches;

  slots.forEach((slot) => {
    if (!slot.dataset.splineUrl && sceneUrl) slot.dataset.splineUrl = sceneUrl;
    floatPoster(slot);
    followPointer(slot);
  });

  const pending = slots.filter((slot) => slot.dataset.splineUrl && !phone);
  if (!pending.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(async (entry) => {
        if (!entry.isIntersecting) return;
        const slot = entry.target;
        observer.unobserve(slot);
        const url = slot.dataset.splineUrl;
        if (!url) return;
        if (tablet) {
          const bytes = await sceneBytes(url);
          if (bytes == null || bytes > TWO_MB) return;
        }
        await afterFirstPaint();
        await mountViewer(slot, url);
      });
    },
    { rootMargin: "240px 0px" },
  );

  pending.forEach((slot) => observer.observe(slot));
}
