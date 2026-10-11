/**
 * One switch for the future Spline scene.
 * Leave this empty to keep the CSS product float.
 * A non-empty data-spline-url on a .spline-slot overrides this for that slot.
 */
export const SPLINE_SCENE_URL = "";

/**
 * Beat times, in seconds, inside each hero clip.
 * Every time is a color flash and an H1 bounce.
 * The last time hard-cuts to the next clip (and lands the logo stamp).
 * Use [] to play each clip through to the end, then cut.
 */
export const CUT_POINTS = [1.25, 2.5, 3.75, 5];

export const HERO_CLIPS = [
  { file: "h1-bottles.mp4", color: "#00276C", label: "Branded water bottles" },
  { file: "h2-caps.mp4", color: "#0A3A9E", label: "Branded caps" },
  { file: "h3-bags.mp4", color: "#D4A017", label: "Branded bags" },
  { file: "h4-tees.mp4", color: "#EBDFC2", label: "Branded tees" },
];

export const MEDIA = `${import.meta.env.BASE_URL}media/`;
