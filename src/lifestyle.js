import { MEDIA } from "./config.js";

const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Lazy classroom video: load within one viewport, play only while visible. */
export function setupLifestyle() {
  const section = document.querySelector("#about");
  const video = document.querySelector(".about__video");
  const poster = document.querySelector(".about__poster");
  if (!section || !video) return;

  let armed = false;

  const pauseOthers = () => {
    document.querySelectorAll(".hero__video").forEach((other) => {
      if (!other.paused) other.pause();
    });
  }

  const load = () => {
    if (armed) return;
    armed = true;
    video.preload = "auto";
    video.src = `${MEDIA}l1-classroom.mp4`;
    video.load();
  };

  const loadObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      load();
      loadObserver.disconnect();
    },
    { rootMargin: "100% 0px" },
  );
  loadObserver.observe(section);

  const playObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (!armed || !visible || document.hidden || reduce()) {
        video.pause();
        return;
      }
      pauseOthers();
      video.play().then(() => {
        const hide = () => {
          video.classList.add("is-painted");
          poster?.classList.add("is-gone");
        };
        if (typeof video.requestVideoFrameCallback === "function") {
          video.requestVideoFrameCallback(() => hide());
        } else {
          video.addEventListener("timeupdate", () => {
            if (video.currentTime > 0) hide();
          }, { once: true });
        }
      }).catch(() => {});
    },
    { threshold: 0.35 },
  );
  playObserver.observe(section);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause();
  });
}
