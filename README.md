# Daykodee homepage effects preview

Standalone Vite preview of the Daykodee home page. It is meant to be embedded in Wix later. This repo does not publish anything to Wix.

GitHub Pages base path: `/daykodee-home/` (`https://sambar1106.github.io/daykodee-home/`).

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run posters
```

Set `VITE_BASE` to override the base path (include the trailing slash). Example: `VITE_BASE=/ npm run build`.

`npm run posters` needs ffmpeg. It writes a WebP of the last frame of each `public/media/assemble-*.mp4`, using whatever clip is there now. Run it again after those files are replaced.

Open `?embed=1`, or load the page in an iframe, to hide this site's header. The hero is a fixed 720px on desktop and 640px on smaller widths, so a tall host frame does not stretch the page. Pins and scroll-scrubbed motion are skipped; text and sections stay visible. The load-time logo still pops, then fades out. Shop, category, about, contact, quote, and FAQ links use `target="_top"` and open the Wix pages at `https://goldie13.wixsite.com/my-site/shop`, `/about`, `/contact`, and `/faq`. Standalone viewing keeps the header, the full-viewport hero, the flight into that header, and scroll-driven motion. On resize the frame posts `{ type: "daykodee-height", height }` to the parent.

## Products

The bottle, cap, and backpack from `public/models` sit together in one horizontal row directly under the hero, on the cream page with no frame or backdrop. They stay in that row at every width, including 390px, scaled so each model stays fully visible. `public/media/products-row.webp` is the static picture of that row. It stays on screen until WebGL has drawn a real frame, and it stays up if WebGL fails, the context is lost, or the models are still loading after 4 seconds. Three.js (`GLTFLoader` and the meshopt decoder) loads after first paint, once the row is near the viewport. In an embed it loads immediately. One renderer draws the row and pauses while the row is off screen. Desktop caps the pixel ratio at 1.5 and projects `logo-decal.png` on the front of each model. Phones and coarse pointers cap the pixel ratio at 1, skip antialiasing and the decals, and ask for the low-power GPU. `prefers-reduced-motion` keeps the front view still.

Each category card loops its own clip while the card is on screen, on desktop and on a phone: Mugs use `assemble-mugs.mp4`, Shirts `assemble-shirts.mp4`, Bags `assemble-bags.mp4`, Water Bottles `assemble-bottles.mp4`, and Hats `assemble-hats.mp4`. The clips are muted, `autoplay`, `loop`, and `playsinline`, with `preload="auto"`. `play()` runs on load and again on the first touch or scroll. Nothing scrubs `currentTime`. The poster is that clip's last frame (`assemble-*.webp`), set as the `poster` and as a background image, including before the file loads and with `prefers-reduced-motion`. The video stays hidden until a frame has actually painted, so the poster cannot be covered by an empty player. After replacing any `assemble-*.mp4`, run `npm run posters` to refresh those WebPs. The frame is 16:9 with `object-fit: cover` and the same rounded corners as the card. Text, posters, and sections are visible without waiting for a scroll trigger. In an embed or on iOS that happens immediately; everywhere else, a reveal that has not finished within 1.5 seconds is forced visible.

## Motion and video

Hero clips play in order with configurable `CUT_POINTS` in `src/config.js`. Two video elements crossfade for 200ms so only one keeps decoding. The next clip preloads while the current one plays. Posters are the first frame. On each load the logo pops in the center and settles into the header once, in about 1.2 seconds, before the first clip plays. When the header is hidden, that same pop ends in a fade-out. Each section below the hero slides, scales, and fades in as one block. Section headings reveal letter by letter. Ordering numbers count up and scale in, then the step copy slides up. Category cards and Why rows rise and fade in. Buttons sweep a gold shine on hover. In an embed those reveals play on load, without pinning, so the document height does not grow. `prefers-reduced-motion` shows the first poster and a play button, leaves the logo in the header, and skips Lenis, pins, section entrances, and letter pops.

Palette is navy `#00276C`, cream `#EBDFC2`, royal blue `#0A3A9E`, and gold `#D4A017`.

Testimonials stay out of the page until real quotes exist. `[NEEDS DWIGHT]` notes stay visible in the ordering and bulk-friendly copy.
