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

function setupWipes(timed) {
  document.querySelectorAll(".wipe").forEach((wipe) => {
    const layers = [...wipe.querySelectorAll(".wipe__layer")];
    const logo = wipe.querySelector(".wipe__logo");
    const enter = timed ? 0.4 : 0.5;
    const timeline = gsap.timeline({ paused: true });

    layers.forEach((layer, index) => {
      const at = index * 0.08;
      timeline.fromTo(
        layer,
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0% 0 0)", duration: enter, ease: "power4.inOut" },
        at,
      );
      timeline.to(
        layer,
        { clipPath: "inset(0 0% 0 100%)", duration: enter, ease: "power4.inOut" },
        at + enter,
      );
    });

    if (logo) {
      const host = logo.closest(".wipe__layer");
      const hostIndex = Math.max(0, layers.indexOf(host));
      const at = hostIndex * 0.08 + enter * 0.3;
      timeline.fromTo(
        logo,
        { scale: 0.55, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.2)" },
        at,
      );
      timeline.to(logo, { opacity: 0, duration: 0.2, ease: "power2.in" }, at + enter * 0.7);
    }

    if (timed) {
      const next = wipe.nextElementSibling;
      ScrollTrigger.create({
        trigger: next || wipe,
        start: "top 70%",
        once: true,
        onEnter: () => {
          wipe.classList.add("is-playing");
          timeline.play(0);
        },
      });
      timeline.eventCallback("onComplete", () => {
        wipe.classList.remove("is-playing");
      });
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: wipe,
      start: "top 70%",
      end: "bottom bottom",
      scrub: 0.4,
      animation: timeline,
    });
    wipe._dkWipe = trigger;
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

  timeline.to(steps[0], { scale: 0.92, y: -36, autoAlpha: 0, duration: 1, ease: "none" }, 0);
  timeline.fromTo(
    steps[1],
    { scale: 0.8, y: 48, autoAlpha: 0 },
    { scale: 1, y: 0, autoAlpha: 1, duration: 1, ease: "none" },
    0,
  );
  timeline.to(steps[1], { scale: 0.92, y: -36, autoAlpha: 0, duration: 1, ease: "none" }, 1);
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
    scale: 0.9,
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
        if (sweep) gsap.to(sweep, { scaleX: 1, duration: 0.25, ease: "power2.out", overwrite: "auto" });
      });
      button.addEventListener("pointerleave", () => {
        gsap.to(button, { scale: 1, duration: 0.2, ease: "power2.out", overwrite: "auto" });
        if (sweep) gsap.to(sweep, { scaleX: 0, duration: 0.2, ease: "power2.in", overwrite: "auto" });
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
    const image = card.querySelector("img");
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
  const image = intro.querySelector("img");
  const embed = document.documentElement.classList.contains("is-embed");
  const target = document.querySelector(embed ? ".hero__mark img" : ".brand__img");
  if (!image || !target) {
    intro.remove();
    introDone.resolve();
    return;
  }

  gsap.set(image, { scale: 0.4, opacity: 0 });
  const timeline = gsap.timeline();
  timeline.to(image, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2.2)" });
  timeline.add(() => {
    const from = image.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const scale = to.width > 0 && from.width > 0 ? to.width / from.width : 0.25;
    gsap.to(image, {
      x: dx,
      y: dy,
      scale,
      duration: 0.55,
      ease: "power3.inOut",
      onComplete: () => {
        gsap.set(target, { opacity: 1 });
        intro.remove();
        introDone.resolve();
      },
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
      document.documentElement.classList.remove("motion-pin", "motion-wipes");

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

      document.documentElement.classList.add("motion-wipes");
      const cleanups = [];
      if (desktop) cleanups.push(setupLenis());

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
        const popped = splitHeading(heading, { chars: true, stagger: 0.02, play: false });
        ScrollTrigger.create({
          trigger: heading,
          start: "top 80%",
          once: true,
          onEnter: () => popped.tween.play(),
        });
      });

      document.querySelectorAll(".step__num").forEach((number) => {
        const popped = splitHeading(number, { chars: true, stagger: 0.03, play: false });
        ScrollTrigger.create({
          trigger: "#ordering",
          start: "top 75%",
          once: true,
          onEnter: () => popped.tween.play(),
        });
      });

      const intro = document.querySelector(".logo-intro");
      if (intro) {
        flyLogo(intro, introDone);
      } else {
        gsap.set(".brand__img, .hero__mark img", { opacity: 1 });
        introDone.resolve();
      }

      if (h1Tween) {
        introDone.promise.then(() => {
          if (h1Tween.progress() === 0) h1Tween.play();
        });
      }

      setupWipes(Boolean(phone));
      if (!phone) setupPin(desktop ? 150 : tablet ? 100 : 100);
      setupCards();
      setupPoints();
      setupCtaButtons();
      setupParallax();

      return () => {
        document.documentElement.classList.remove("motion-pin", "motion-wipes");
        cleanups.forEach((fn) => fn && fn());
      };
    },
  );

  setupHovers();
  window.setTimeout(() => introDone.resolve(), 2800);
  window.setTimeout(() => beatsReady.resolve(), 4500);

  return api;
}
