const REDUCE = "(prefers-reduced-motion: reduce)";

/** Loop the category clips only while they are on screen. Reduced motion keeps the poster. */
export function setupCategoryVideos() {
  const videos = [...document.querySelectorAll(".card__video")];
  if (!videos.length) return;

  const reduce =
    document.documentElement.classList.contains("reduce-motion") ||
    window.matchMedia(REDUCE).matches;
  if (reduce) {
    videos.forEach((video) => {
      video.removeAttribute("src");
      video.load();
    });
    return;
  }

  const play = (video) => {
    const pending = video.play();
    if (pending) pending.catch(() => {});
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && !document.hidden) play(video);
        else video.pause();
      });
    },
    { threshold: 0.35 },
  );

  videos.forEach((video) => observer.observe(video));

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    videos.forEach((video) => video.pause());
  });
}
