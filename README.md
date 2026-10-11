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

Open `?embed=1` to hide the preview header. In an iframe the page posts `{ source: "daykodee-home", type: "resize", height }` to the parent so a host page can size the frame. CTA links use the Wix paths `/shop`, `/contact`, `/about`, and `/category/...` with `target="_top"`. When the page is framed, those paths resolve against the parent page URL.

## Spline

Set `SPLINE_SCENE_URL` in `src/config.js`, or set `data-spline-url` on a `.spline-slot`. Either one swaps the CSS product float for the Spline viewer. The viewer script loads only after first paint, and only when a slot is near the viewport. Phones keep the poster. Tablets load a scene only when it is 2 MB or smaller.

## Motion and video

Hero clips play in order with configurable `CUT_POINTS` in `src/config.js`. Two video elements swap so only one is playing. The next clip preloads while the current one plays. Posters are the first frame. `prefers-reduced-motion` shows the first poster and a play button, and skips Lenis, pins, wipes, and letter pops.

Palette is navy `#00276C`, cream `#EBDFC2`, royal blue `#0A3A9E`, and gold `#D4A017`.

Testimonials stay out of the page until real quotes exist. `[NEEDS DWIGHT]` notes stay visible in the ordering and bulk-friendly copy.
