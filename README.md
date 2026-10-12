# Daykodee homepage effects preview

Standalone Vite preview of the Daykodee home page. It is meant to be embedded in Wix later. This repo does not publish anything to Wix.

GitHub Pages base path: `/daykodee-home/` (`https://sambar1106.github.io/daykodee-home/`).

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

Set `VITE_BASE` to override the base path (include the trailing slash). Example: `VITE_BASE=/ npm run build`.

Open `?embed=1`, or load the page in an iframe, to hide this site's header. The hero is a fixed 720px on desktop and 640px on smaller widths, so a tall host frame does not stretch the page. Pins and scroll-scrubbed motion are skipped; sections reveal as the page loads, and the product row draws immediately. The load-time logo still pops, then fades out. Shop, category, about, contact, quote, and FAQ links use `target="_top"` and open the Wix pages at `https://goldie13.wixsite.com/my-site/shop`, `/about`, `/contact`, and `/faq`. Standalone viewing keeps the header, the full-viewport hero, the flight into that header, and scroll-driven motion. On resize the frame posts `{ type: "daykodee-height", height }` to the parent.

## Products

The bottle, cap, and backpack from `public/models` sit together in one horizontal row directly under the hero, on the cream page with no frame or backdrop. They stay in that row at every width, including 390px, scaled so each model stays fully visible. Three.js (`GLTFLoader` and the meshopt decoder) loads after first paint, once the row is near the viewport. In an embed it loads immediately. One renderer draws the row, with the pixel ratio capped at 1.5, and it pauses while the row is off screen. `logo-decal.png` is projected on the front of each model. `prefers-reduced-motion` keeps that front view still. Category photos are transparent WebP cut-outs, so the products sit on the cream card.

## Motion and video

Hero clips play in order with configurable `CUT_POINTS` in `src/config.js`. Two video elements crossfade for 200ms so only one keeps decoding. The next clip preloads while the current one plays. Posters are the first frame. On each load the logo pops in the center and settles into the header once, in about 1.2 seconds, before the first clip plays. When the header is hidden, that same pop ends in a fade-out. Each section below the hero slides, scales, and fades in as one block. `prefers-reduced-motion` shows the first poster and a play button, leaves the logo in the header, and skips Lenis, pins, section entrances, and letter pops.

Palette is navy `#00276C`, cream `#EBDFC2`, royal blue `#0A3A9E`, and gold `#D4A017`.

Testimonials stay out of the page until real quotes exist. `[NEEDS DWIGHT]` notes stay visible in the ordering and bulk-friendly copy.
