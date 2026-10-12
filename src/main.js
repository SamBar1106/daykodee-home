import "./styles.css";
import { setupEmbed } from "./embed.js";
import { setupNav } from "./nav.js";
import { setupMotion } from "./motion.js";
import { setupHero } from "./hero.js";
import { setupLifestyle } from "./lifestyle.js";
import { setupProducts } from "./products.js";
import { setupCategoryVideos } from "./categories.js";

setupEmbed();
setupNav();
setupLifestyle();
setupCategoryVideos();

const motion = setupMotion();
motion.then((api) => {
  setupHero({
    onCut: () => api.bounceH1(),
    introDone: api.introDone,
    beatsReady: api.beatsReady,
  });
});

setupProducts();

window.setTimeout(() => {
  document.documentElement.classList.add("show-text");
}, 1500);
