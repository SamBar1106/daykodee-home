const REDUCE = "(prefers-reduced-motion: reduce)";

function playClip(video) {
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.preload = "auto";
  if (!video.dataset.reveal) {
    video.dataset.reveal = "1";
    const show = () => video.classList.add("is-playing");
    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(() => show());
    } else {
      video.addEventListener("timeupdate", () => {
        if (video.currentTime > 0) show();
      }, { once: true });
    }
  }
  const pending = video.play();
  if (pending && typeof pending.catch === "function") pending.catch(() => {});
}

/** Loop each category clip only while its card is on screen. */
export function setupCategoryVideos() {
  const videos = [...document.querySelectorAll(".card__video")];
  if (!videos.length) return;

  const reduce =
    document.documentElement.classList.contains("reduce-motion") ||
    window.matchMedia(REDUCE).matches;
  if (reduce) {
    videos.forEach((video) => {
      video.removeAttribute("autoplay");
      video.removeAttribute("src");
      video.load();
    });
    return;
  }

  const playVisible = () => {
    videos.forEach((video) => {
      const rect = video.getBoundingClientRect();
      const shown = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      if (!document.hidden && shown > rect.height * 0.35) playClip(video);
      else video.pause();
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && !document.hidden) playClip(video);
        else video.pause();
      });
    },
    { threshold: 0.35 },
  );

  videos.forEach((video) => {
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "auto";
    observer.observe(video);
  });

  window.addEventListener("load", playVisible);
  window.addEventListener("touchstart", playVisible, { once: true, passive: true });
  window.addEventListener("scroll", playVisible, { passive: true });
  window.addEventListener("resize", playVisible);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) videos.forEach((video) => video.pause());
    else playVisible();
  });
  playVisible();
}
