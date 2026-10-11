import "./styles.css";
import { SPLINE_SCENE_URL } from "./config.js";
import { setupEmbed } from "./embed.js";
import { setupNav } from "./nav.js";
import { setupMotion } from "./motion.js";
import { setupHero } from "./hero.js";
import { setupLifestyle } from "./lifestyle.js";
import { setupSpline } from "./spline.js";

setupEmbed();
setupNav();
setupLifestyle();

const motion = setupMotion();
motion.then((api) => {
  setupHero({
    onCut: () => api.bounceH1(),
    introDone: api.introDone,
    beatsReady: api.beatsReady,
  });
});

setupSpline(SPLINE_SCENE_URL);

window.setTimeout(() => {
  document.querySelectorAll(".pop").forEach((el) => {
    if (el.dataset.split !== "1") el.style.opacity = "1";
  });
  document.querySelectorAll(".brand__img, .hero__mark img").forEach((img) => {
    if (Number(getComputedStyle(img).opacity) === 0) img.style.opacity = "1";
  });
}, 5000);
