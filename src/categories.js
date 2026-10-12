const REDUCE = "(prefers-reduced-motion: reduce)";
const EASE = 0.16;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** 0 when the card enters the viewport, 1 when the card center meets the viewport center. */
function scrubProgress(top, height, vh) {
  const start = vh;
  const end = vh / 2 - height / 2;
  const span = start - end;
  if (span <= 1) return top <= end ? 1 : 0;
  return clamp((start - top) / span, 0, 1);
}

function isEmbed() {
  return (
    document.documentElement.classList.contains("is-embed") ||
    new URLSearchParams(location.search).get("embed") === "1"
  );
}

function pageFillsFrame() {
  return window.innerHeight + 8 >= document.documentElement.scrollHeight;
}

/**
 * Scrub each category clip with scroll. Time 0 is the card entering the
 * viewport; the end of the clip is the card centered. The clip itself can
 * be replaced without changing this mapping.
 * Standalone pages use the window. Embeds use the parent's
 * `{ type: "daykodee-scroll", top, vh }` messages. Without those messages,
 * progress follows the intersection ratio. A frame as tall as the page
 * plays each clip once when its card is visible.
 */
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

  const embed = isEmbed();
  const framed = window.parent !== window;
  let parentScroll = null;
  const items = videos.map((video) => ({
    video,
    card: video.closest(".card") || video,
    label: video.getAttribute("aria-label") || "",
    target: 0,
    shown: 0,
    engaged: false,
    played: false,
    posted: null,
    ratio: 0,
  }));

  const postVisibility = (item, ratio) => {
    if (!framed) return;
    const bucket = Math.round(ratio * 20) / 20;
    if (bucket === item.posted) return;
    item.posted = bucket;
    const rect = item.card.getBoundingClientRect();
    window.parent.postMessage(
      {
        type: "daykodee-visibility",
        label: item.label,
        ratio: bucket,
        top: Math.round(rect.top + window.scrollY),
        height: Math.round(rect.height),
      },
      "*",
    );
  };

  const mode = () => {
    if (parentScroll) return "parent";
    if (!embed) return "local";
    if (pageFillsFrame()) return "play";
    return "ratio";
  };

  const seek = (video, progress) => {
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    if (video.readyState < 1) return;
    const end = Math.max(duration - 0.001, 0);
    const amount = clamp(progress, 0, 1);
    // A brand-new video stays on its poster at currentTime 0, so the first
    // paint has to land just past 0 to show the opening frame.
    const next = amount <= 0 ? Math.min(0.001, end) : amount * end;
    if (video.dataset.painted === "1" && Math.abs(video.currentTime - next) < 0.02) return;
    try {
      video.currentTime = next;
      video.dataset.painted = "1";
    } catch {
      /* The browser can reject a seek before the first frame is ready. */
    }
  };

  const updateTargets = () => {
    const current = mode();
    items.forEach((item) => {
      const rect = item.card.getBoundingClientRect();
      const top = current === "parent" ? rect.top + parentScroll.top : rect.top;
      const vh = current === "parent" ? parentScroll.vh : window.innerHeight;

      if (current === "play") {
        const visible = item.ratio > 0.15 || (rect.top < vh && rect.bottom > 0);
        if (visible && !item.played) {
          item.played = true;
          item.video.preload = "auto";
          item.video.loop = false;
          const pending = item.video.play();
          if (pending) {
            pending.catch(() => {
              item.played = false;
            });
          }
        }
        postVisibility(item, item.ratio || (visible ? 1 : 0));
        return;
      }

      const progress = current === "ratio" ? item.ratio : scrubProgress(top, rect.height, vh);
      const reached = current === "ratio" ? item.ratio > 0 : top <= vh + 1;
      if (!item.engaged && !reached) {
        postVisibility(item, 0);
        return;
      }
      item.engaged = true;
      item.video.preload = "auto";
      if (item.played) {
        item.video.pause();
        item.played = false;
      }
      item.target = progress;
      postVisibility(item, progress);
    });
  };

  let running = false;
  let snapped = false;
  const tick = () => {
    let moving = false;
    if (mode() !== "play") {
      items.forEach((item) => {
        if (!item.engaged) return;
        item.shown += (item.target - item.shown) * EASE;
        if (Math.abs(item.target - item.shown) < 0.004) item.shown = item.target;
        else moving = true;
        seek(item.video, item.shown);
      });
    }
    if (moving) requestAnimationFrame(tick);
    else running = false;
  };

  const kick = () => {
    updateTargets();
    if (mode() === "play") return;
    if (!snapped) {
      items.forEach((item) => {
        item.shown = item.target;
        if (item.engaged) seek(item.video, item.shown);
      });
      snapped = true;
      return;
    }
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  };

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.type !== "daykodee-scroll") return;
    const top = Number(data.top);
    const vh = Number(data.vh);
    if (!Number.isFinite(top) || !Number.isFinite(vh) || vh <= 0) return;
    parentScroll = { top, vh };
    kick();
  });

  const thresholds = Array.from({ length: 21 }, (_, index) => index / 20);
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const item = items.find((candidate) => candidate.video === entry.target);
        if (!item) return;
        item.ratio = entry.intersectionRatio;
      });
      kick();
    },
    { threshold: thresholds },
  );
  videos.forEach((video) => {
    observer.observe(video);
    const paint = () => {
      const item = items.find((candidate) => candidate.video === video);
      if (item?.engaged) seek(video, item.shown);
    };
    video.addEventListener("loadedmetadata", paint);
    video.addEventListener("loadeddata", paint);
  });

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);
  window.addEventListener("load", kick);
  if ("ResizeObserver" in window) {
    const layout = new ResizeObserver(() => kick());
    layout.observe(document.documentElement);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      videos.forEach((video) => video.pause());
      return;
    }
    kick();
  });

  if (framed) {
    const cards = items.map((item) => {
      const rect = item.card.getBoundingClientRect();
      return {
        label: item.label,
        top: Math.round(rect.top + window.scrollY),
        height: Math.round(rect.height),
      };
    });
    window.parent.postMessage({ type: "daykodee-visibility", cards }, "*");
  }

  kick();
}
