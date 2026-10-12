import { CUT_POINTS, HERO_CLIPS, MEDIA } from "./config.js";

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function waitFor(target, event) {
  return new Promise((resolve) => {
    if (event === "canplay" && target.readyState >= 3) {
      resolve();
      return;
    }
    const done = () => {
      target.removeEventListener(event, done);
      target.removeEventListener("error", done);
      resolve();
    };
    target.addEventListener(event, done);
    target.addEventListener("error", done);
  });
}

/**
 * Two-buffer scene cutter. Only the visible element plays.
 * The hidden element stays paused while the next clip preloads.
 */
export function setupHero({ onCut, introDone, beatsReady }) {
  const root = document.querySelector(".hero");
  const poster = root?.querySelector(".hero__poster");
  const playButton = root?.querySelector(".hero__play");
  const videos = [...(root?.querySelectorAll(".hero__video") ?? [])];
  if (!root || videos.length < 2) return;

  const [videoA, videoB] = videos;
  let activeSlot = 0;
  let clipIndex = 0;
  let cutCursor = 0;
  let started = false;
  let advancing = false;
  let beatsLive = false;
  let heroInView = true;
  let rafId = 0;
  let errors = 0;

  const activeVideo = () => videos[activeSlot];
  const hiddenVideo = () => videos[1 - activeSlot];

  const showPlay = () => document.documentElement.classList.add("needs-play");

  async function hidePoster() {
    if (!poster || poster.classList.contains("is-gone")) return;
    try {
      await poster.decode();
    } catch {
      /* The poster can still fade if decode is unsupported. */
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    poster.classList.add("is-gone");
  }

  function arm(video, index) {
    const clip = HERO_CLIPS[index];
    if (video.dataset.clip === String(index) && video.readyState >= 2) return;
    video.dataset.clip = String(index);
    video.pause();
    video.preload = "auto";
    video.src = `${MEDIA}${clip.file}`;
    video.load();
  }

  function pauseOthers(current) {
    document.querySelectorAll(".hero__video").forEach((video) => {
      if (video !== current && !video.paused) video.pause();
    });
  }

  function shouldPlay() {
    return started && heroInView && !document.hidden;
  }

  function syncPlayback() {
    const video = activeVideo();
    if (shouldPlay()) {
      if (video.paused) {
        pauseOthers(video);
        video.play().catch(() => showPlay());
      }
    } else if (!video.paused) {
      video.pause();
    }
  }

  async function advance() {
    if (advancing) return;
    advancing = true;
    const nextIndex = (clipIndex + 1) % HERO_CLIPS.length;
    const incoming = hiddenVideo();
    const outgoing = activeVideo();
    if (incoming.dataset.clip !== String(nextIndex)) arm(incoming, nextIndex);
    if (incoming.readyState < 3) await waitFor(incoming, "canplay");
    if (incoming.error) {
      errors += 1;
      advancing = false;
      if (errors <= HERO_CLIPS.length) arm(incoming, (nextIndex + 1) % HERO_CLIPS.length);
      return;
    }

    const nextColor = HERO_CLIPS[nextIndex].color;
    onCut?.({ advance: true, color: nextColor });

    try {
      pauseOthers(incoming);
      await incoming.play();
    } catch {
      showPlay();
      advancing = false;
      return;
    }

    await crossfade(incoming, outgoing);
    hidePoster();
    clipIndex = nextIndex;
    activeSlot = 1 - activeSlot;
    cutCursor = 0;
    errors = 0;
    arm(outgoing, (clipIndex + 1) % HERO_CLIPS.length);
    advancing = false;
  }

  function crossfade(incoming, outgoing) {
    if (reduceMotion()) {
      incoming.classList.add("is-active");
      outgoing.classList.remove("is-active");
      outgoing.pause();
      return Promise.resolve();
    }
    incoming.classList.add("is-incoming");
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        incoming.removeEventListener("animationend", finish);
        incoming.classList.add("is-active");
        incoming.classList.remove("is-incoming");
        outgoing.classList.remove("is-active");
        outgoing.pause();
        resolve();
      };
      incoming.addEventListener("animationend", finish);
      window.setTimeout(finish, 200);
    });
  }

  function beatOnly() {
    onCut?.({ advance: false, color: HERO_CLIPS[clipIndex].color });
  }

  function tick() {
    rafId = requestAnimationFrame(tick);
    if (!beatsLive || advancing || !shouldPlay()) return;
    const video = activeVideo();
    const time = video.currentTime;
    if (!CUT_POINTS.length) {
      if (video.ended) advance();
      return;
    }
    if (cutCursor < CUT_POINTS.length && time >= CUT_POINTS[cutCursor]) {
      const last = cutCursor === CUT_POINTS.length - 1;
      cutCursor += 1;
      if (last) advance();
      else beatOnly();
    } else if (video.ended) {
      advance();
    }
  }

  function armBeats() {
    const time = activeVideo().currentTime;
    cutCursor = CUT_POINTS.findIndex((point) => point > time + 0.05);
    if (cutCursor < 0) cutCursor = CUT_POINTS.length;
    beatsLive = true;
    if (!rafId) tick();
  }

  async function start() {
    if (started) {
      syncPlayback();
      return;
    }
    started = true;
    document.documentElement.classList.remove("needs-play");
    const first = activeVideo();
    if (!first.getAttribute("src")) arm(first, 0);
    else first.dataset.clip = first.dataset.clip || "0";
    pauseOthers(first);
    try {
      await first.play();
      hidePoster();
    } catch {
      started = false;
      showPlay();
      return;
    }
    arm(hiddenVideo(), 1);
    if (!rafId) tick();
    beatsReady.then(armBeats);
  }

  playButton?.addEventListener("click", () => {
    start();
  });

  const viewObserver = new IntersectionObserver(
    (entries) => {
      heroInView = entries.some((entry) => entry.isIntersecting);
      syncPlayback();
    },
    { threshold: 0.2 },
  );
  viewObserver.observe(root);

  document.addEventListener("visibilitychange", () => {
    syncPlayback();
  });

  introDone.then(() => {
    if (reduceMotion()) {
      showPlay();
      return;
    }
    start();
  });
}
