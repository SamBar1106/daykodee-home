import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function splitHeading(element, { chars, stagger, play }) {
  const split = SplitText.create(element, {
    type: chars ? "chars,words" : "words",
    tag: "span",
    aria: "auto",
    mask: chars ? "chars" : "words",
    charsClass: "char",
    wordsClass: "word",
  });
  const targets = chars ? split.chars : split.words;
  gsap.set(targets, {
    yPercent: 120,
    scale: 0.4,
    rotate: () => gsap.utils.random(-15, 15),
    opacity: 0,
  });
  gsap.set(element, { opacity: 1 });
  element.dataset.split = "1";
  const tween = gsap.to(targets, {
    yPercent: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
    duration: 0.6,
    stagger,
    ease: "back.out(2.2)",
    paused: !play,
  });
  return { split, targets, tween };
}

function isEmbed() {
  return document.documentElement.classList.contains("is-embed");
}

function setupSectionEntrances() {
  document.querySelectorAll("main > section.section").forEach((section) => {
    const stage = section.querySelector(":scope > .section__stage");
    if (!stage) return;
    gsap.fromTo(
      stage,
      { y: 80, scale: 0.96, opacity: 0 },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: "power3.out",
        immediateRender: false,
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          once: true,
          toggleActions: "play none none none",
        },
      },
    );
  });
}

function playStep(step, delay = 0) {
  if (!step || step.dataset.played === "1") return;
  step.dataset.played = "1";
  const number = step.querySelector(".step__num");
  const copy = step.querySelectorAll("h3, p");
  const target = Number(number?.textContent.trim()) || 0;
  if (number) number.dataset.split = "1";
  const proxy = { n: 0 };
  const timeline = gsap.timeline({ delay });
  if (number) {
    timeline.fromTo(
      number,
      { scale: 0.55, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" },
      0,
    );
    timeline.to(
      proxy,
      {
        n: target,
        duration: 0.7,
        ease: "power2.out",
        onUpdate: () => {
          number.textContent = String(Math.round(proxy.n)).padStart(2, "0");
        },
      },
      0,
    );
  }
  if (copy.length) {
    timeline.fromTo(
      copy,
      { y: 28, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.08,
        ease: "power3.out",
        onComplete: () => gsap.set(copy, { clearProps: "transform" }),
      },
      0.32,
    );
  }
}

function setupSteps(embed, pinned) {
  const steps = [...document.querySelectorAll("#ordering .step")];
  if (!steps.length || pinned) return;
  const play = () => steps.forEach((step, index) => playStep(step, index * 0.12));
  if (embed) {
    play();
    return;
  }
  ScrollTrigger.create({
    trigger: "#ordering",
    start: "top 75%",
    once: true,
    onEnter: play,
  });
}

function setupPin(endPercent) {
  const section = document.querySelector("#ordering");
  const steps = [...document.querySelectorAll("#ordering .step")];
  if (!section || steps.length < 3) return;
  document.documentElement.classList.add("motion-pin");

  gsap.set(steps[0], { autoAlpha: 1, y: 0, scale: 1 });
  gsap.set(steps.slice(1), { autoAlpha: 0, y: 48, scale: 0.8 });

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: `+=${endPercent}%`,
      pin: true,
      scrub: 0.6,
      anticipatePin: 0,
      invalidateOnRefresh: true,
    },
  });

  timeline.add(() => playStep(steps[0]), 0);
  timeline.to(steps[0], { scale: 0.92, y: -36, autoAlpha: 0, duration: 1, ease: "none" }, 0);
  timeline.fromTo(
    steps[1],
    { scale: 0.8, y: 48, autoAlpha: 0 },
    { scale: 1, y: 0, autoAlpha: 1, duration: 1, ease: "none" },
    0,
  );
  timeline.add(() => playStep(steps[1]), 1);
  timeline.to(steps[1], { scale: 0.92, y: -36, autoAlpha: 0, duration: 1, ease: "none" }, 1);
  timeline.add(() => playStep(steps[2]), 1);
  timeline.fromTo(
    steps[2],
    { scale: 0.8, y: 48, autoAlpha: 0 },
    { scale: 1, y: 0, autoAlpha: 1, duration: 1, ease: "none" },
    1,
  );
}

function setupCards() {
  gsap.from(".card", {
    y: 40,
    scale: 0.94,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
    stagger: 0.08,
    immediateRender: false,
    scrollTrigger: {
      trigger: ".cards",
      start: "top 80%",
      once: true,
    },
  });
}

function setupPoints() {
  gsap.from(".why__item", {
    y: 28,
    scale: 0.92,
    opacity: 0,
    duration: 0.55,
    ease: "back.out(1.8)",
    stagger: 0.1,
    scrollTrigger: {
      trigger: ".why__list",
      start: "top 80%",
      once: true,
    },
  });
}

function setupCtaButtons() {
  gsap.from("#ready .btn", {
    y: 22,
    scale: 0.86,
    opacity: 0,
    duration: 0.5,
    ease: "back.out(1.8)",
    stagger: 0.08,
    scrollTrigger: {
      trigger: "#ready",
      start: "top 75%",
      once: true,
    },
  });
}

function setupParallax() {
  gsap.to(".about__parallax", {
    yPercent: -10,
    ease: "none",
    scrollTrigger: {
      trigger: "#about",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
}

/** The parent page scrolls, so embed reveals play on load instead of on scroll. */
function setupEmbedReveals() {
  document.querySelectorAll("main > section.section").forEach((section) => {
    const stage = section.querySelector(":scope > .section__stage");
    if (!stage) return;
    gsap.fromTo(
      stage,
      { y: 40, scale: 0.98, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.7, ease: "power3.out", immediateRender: false },
    );
  });

  gsap.from(".card", {
    y: 28,
    opacity: 0,
    duration: 0.7,
    ease: "power3.out",
    stagger: 0.08,
    immediateRender: false,
  });

  gsap.from(".why__item", {
    y: 16,
    opacity: 0,
    duration: 0.45,
    ease: "power2.out",
    stagger: 0.06,
    immediateRender: false,
  });

  gsap.from("#ready .btn", {
    y: 16,
    opacity: 0,
    duration: 0.45,
    ease: "power2.out",
    stagger: 0.06,
    immediateRender: false,
  });
}

function setupHovers() {
  if (setupHovers.done) return;
  setupHovers.done = true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.querySelectorAll(".btn").forEach((button) => {
    const sweep = button.querySelector(".btn__sweep");
    if (fine) {
      button.addEventListener("pointerenter", () => {
        gsap.to(button, { scale: 1.05, duration: 0.25, ease: "power2.out", overwrite: "auto" });
        if (sweep) {
          gsap.fromTo(
            sweep,
            { xPercent: -180 },
            { xPercent: 320, duration: 0.55, ease: "power2.out", overwrite: "auto" },
          );
        }
      });
      button.addEventListener("pointerleave", () => {
        gsap.to(button, { scale: 1, duration: 0.2, ease: "power2.out", overwrite: "auto" });
        if (sweep) gsap.set(sweep, { xPercent: -180 });
      });
      button.addEventListener("pointerdown", () => {
        gsap.to(button, { scale: 0.97, duration: 0.08, overwrite: "auto" });
      });
      button.addEventListener("pointerup", () => {
        gsap.to(button, { scale: 1.05, duration: 0.15, ease: "power2.out", overwrite: "auto" });
      });
      return;
    }
    button.addEventListener("pointerdown", () => {
      gsap.to(button, { scale: 0.97, duration: 0.08, overwrite: "auto" });
    });
    button.addEventListener("pointerup", () => {
      gsap.to(button, { scale: 1, duration: 0.12, ease: "power2.out", overwrite: "auto" });
    });
    button.addEventListener("pointercancel", () => {
      gsap.to(button, { scale: 1, duration: 0.12, overwrite: "auto" });
    });
  });

  if (!fine) return;

  document.querySelectorAll(".card").forEach((card) => {
    const image = card.querySelector(".card__video, img");
    const border = card.querySelector(".card__border");
    card.addEventListener("pointerenter", () => {
      gsap.to(card, { y: -8, duration: 0.3, ease: "back.out(1.7)", overwrite: "auto" });
      if (image) gsap.to(image, { scale: 1.06, duration: 0.3, ease: "back.out(1.7)", overwrite: "auto" });
      if (border) gsap.to(border, { scaleX: 1, duration: 0.3, ease: "back.out(1.7)", overwrite: "auto" });
    });
    card.addEventListener("pointerleave", () => {
      gsap.to(card, { y: 0, duration: 0.25, ease: "power2.out", overwrite: "auto" });
      if (image) gsap.to(image, { scale: 1, duration: 0.25, ease: "power2.out", overwrite: "auto" });
      if (border) gsap.to(border, { scaleX: 0, duration: 0.2, ease: "power2.in", overwrite: "auto" });
    });
  });
}

function setupLenis() {
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    autoRaf: false,
  });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  document.documentElement._lenis = lenis;
  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    document.documentElement._lenis = null;
  };
}

function flyLogo(intro, introDone) {
  if (flyLogo.started) return;
  flyLogo.started = true;
  const image = intro.querySelector("img");
  const embed = document.documentElement.classList.contains("is-embed");
  const target = embed ? null : document.querySelector(".brand__img");
  if (!image || (!embed && !target)) {
    intro.remove();
    gsap.set(".brand__img, .hero__mark img", { opacity: 1 });
    introDone.resolve();
    return;
  }

  const reveal = () => {
    if (!embed) gsap.set(".brand__img, .hero__mark img", { opacity: 1 });
    intro.remove();
    introDone.resolve();
  };

  gsap.set(image, { scale: 0.4, opacity: 0 });
  const timeline = gsap.timeline();
  flyLogo.tween = timeline;
  timeline.to(image, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2.2)" });
  if (embed) {
    timeline.to(image, {
      opacity: 0,
      duration: 0.45,
      ease: "power2.inOut",
      delay: 0.15,
      onComplete: reveal,
    });
    return;
  }
  timeline.add(() => {
    const from = image.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const scale = to.width > 0 && from.width > 0 ? to.width / from.width : 0.22;
    gsap.to(image, {
      x: dx,
      y: dy,
      scale,
      duration: 0.6,
      ease: "power3.inOut",
      onComplete: reveal,
    });
  });
}

export async function setupMotion() {
  const introDone = deferred();
  const beatsReady = deferred();
  const api = {
    introDone: introDone.promise,
    beatsReady: beatsReady.promise,
    bounceH1() {},
  };

  const reduceNow =
    document.documentElement.classList.contains("reduce-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const iosEmbed =
    document.documentElement.classList.contains("is-embed") &&
    document.documentElement.classList.contains("is-ios");
  const intro = document.querySelector(".logo-intro");
  if (iosEmbed) {
    document.documentElement.classList.add("show-text");
    intro?.remove();
    gsap.set(".brand__img, .hero__mark img, .pop, .section__stage, .card, .why__item, .step, .step__num", {
      opacity: 1,
      visibility: "visible",
    });
    introDone.resolve();
    beatsReady.resolve();
    return api;
  }
  if (reduceNow || !intro) {
    intro?.remove();
    gsap.set(".brand__img, .hero__mark img", { opacity: 1 });
    introDone.resolve();
  } else {
    flyLogo(intro, introDone);
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await new Promise((resolve) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => resolve(), { timeout: 400 });
    else setTimeout(resolve, 48);
  });
  await Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);

  let h1Targets = [];
  api.bounceH1 = () => {
    if (!h1Targets.length) return;
    gsap.fromTo(
      h1Targets,
      { y: 0 },
      { y: -8, duration: 0.25, ease: "back.out(3)", yoyo: true, repeat: 1, overwrite: "auto" },
    );
  };

  const mm = gsap.matchMedia();
  mm.add(
    {
      reduce: "(prefers-reduced-motion: reduce)",
      phone: "(max-width: 767px)",
      tablet: "(min-width: 768px) and (max-width: 1199px)",
      desktop: "(min-width: 1200px)",
    },
    (context) => {
      const { reduce, phone, tablet, desktop } = context.conditions;
      h1Targets = [];
      document.documentElement.classList.remove("motion-pin");

      document.documentElement.dataset.motion = "1";

      if (reduce) {
        gsap.to(".pop", { opacity: 1, duration: 0.2, ease: "none" });
        document.querySelectorAll(".pop").forEach((el) => {
          el.dataset.split = "1";
        });
        gsap.set(".brand__img, .hero__mark img", { opacity: 1 });
        document.querySelector(".logo-intro")?.remove();
        introDone.resolve();
        beatsReady.resolve();
        return undefined;
      }

      const embed = isEmbed();
      const cleanups = [];
      if (desktop && !embed) cleanups.push(setupLenis());

      const h1 = document.querySelector(".hero__title");
      let h1Tween;
      if (h1) {
        const useChars = !phone;
        const popped = splitHeading(h1, {
          chars: useChars,
          stagger: useChars ? 0.03 : 0.045,
          play: false,
        });
        h1Targets = popped.targets;
        h1Tween = popped.tween;
        h1Tween.eventCallback("onComplete", () => {
          h1.querySelectorAll(".char-mask, .word-mask").forEach((mask) => {
            mask.style.overflow = "visible";
          });
          beatsReady.resolve();
        });
      } else {
        beatsReady.resolve();
      }

      document.querySelectorAll("h2.pop").forEach((heading) => {
        const popped = splitHeading(heading, { chars: true, stagger: 0.02, play: embed });
        if (!embed) {
          ScrollTrigger.create({
            trigger: heading,
            start: "top 80%",
            once: true,
            onEnter: () => popped.tween.play(),
          });
        }
      });

      setupSteps(embed, !embed && !phone);

      if (h1Tween) {
        introDone.promise.then(() => {
          if (h1Tween.progress() === 0) h1Tween.play();
        });
      }

      if (embed) {
        setupEmbedReveals();
      } else {
        setupSectionEntrances();
        if (!phone) setupPin(desktop ? 150 : tablet ? 100 : 100);
        setupCards();
        setupPoints();
        setupCtaButtons();
        setupParallax();
      }

      return () => {
        document.documentElement.classList.remove("motion-pin");
        cleanups.forEach((fn) => fn && fn());
      };
    },
  );

  setupHovers();
  window.setTimeout(() => {
    if (document.querySelector(".logo-intro")) {
      flyLogo.tween?.kill();
      gsap.killTweensOf(".logo-intro img");
      document.querySelector(".logo-intro")?.remove();
      gsap.set(".brand__img, .hero__mark img", { opacity: 1 });
    }
    introDone.resolve();
  }, 2800);
  window.setTimeout(() => beatsReady.resolve(), 4500);

  return api;
}
