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

Open `?embed=1`, or load the page in an iframe, to hide this site's header. The hero is a fixed 720px on desktop and 640px on smaller widths, so a tall host frame does not stretch the page. Pins and scroll-scrubbed motion are skipped; sections reveal as the page loads, and the product row draws immediately. The load-time logo still pops, then fades out. Shop, category, about, contact, quote, and FAQ links use `target="_top"` and open the Wix pages at `https://goldie13.wixsite.com/my-site/shop`, `/about`, `/contact`, and `/faq`. Standalone viewing keeps the header, the full-viewport hero, the flight into that header, and scroll-driven motion. On resize the frame posts `{ type: "daykodee-height", height }` to the parent.

The Wix page does not scroll inside the iframe, so category clips cannot read the parent scroll on their own. The parent page needs to forward it on scroll and resize:

```html
<script>
  const frame = document.querySelector("#daykodee-frame");
  const send = () => {
    const rect = frame.getBoundingClientRect();
    frame.contentWindow.postMessage({
      type: "daykodee-scroll",
      top: rect.top,
      vh: window.innerHeight
    }, "*");
  };
  window.addEventListener("scroll", send, { passive: true });
  window.addEventListener("resize", send);
  send();
</script>
```

`top` is the iframe's top edge measured from the parent viewport. `vh` is the parent viewport height. The frame replies with `{ type: "daykodee-visibility", label, ratio, top, height }` as a card moves through that view (`top` is the card's offset inside the iframe). It also posts one `{ type: "daykodee-visibility", cards }` list on load. If those scroll messages never arrive and the iframe can scroll itself, each clip follows its IntersectionObserver ratio. If the iframe is as tall as the page and the parent scroll still cannot be read, each clip plays once forward when its card is on screen.

## Products

The bottle, cap, and backpack from `public/models` sit together in one horizontal row directly under the hero, on the cream page with no frame or backdrop. They stay in that row at every width, including 390px, scaled so each model stays fully visible. Three.js (`GLTFLoader` and the meshopt decoder) loads after first paint, once the row is near the viewport. In an embed it loads immediately. One renderer draws the row, with the pixel ratio capped at 1.5, and it pauses while the row is off screen. `logo-decal.png` is projected on the front of each model. `prefers-reduced-motion` keeps that front view still. Each category card uses its own clip: Mugs use `assemble-mugs.mp4`, Shirts `assemble-shirts.mp4`, Bags `assemble-bags.mp4`, Water Bottles `assemble-bottles.mp4`, and Hats `assemble-hats.mp4`. On a desktop page that is not embedded, scroll maps `currentTime` from the start of the clip, when the card enters the viewport, to the end of the clip, when the card is centered. Scrolling back reverses it, eased with a lerp. Inside an embed, and on touch devices, the clips do not scrub. They use `muted autoplay loop playsinline` and `preload="auto"`, and `play()` is called on load and on the first touch or scroll. The poster is that clip's last frame (`assemble-*.webp`), set as the `poster` and as a background image, including before the file loads and with `prefers-reduced-motion`. After replacing any `assemble-*.mp4`, run `npm run posters` to refresh those WebPs. The frame is 16:9 with `object-fit: cover` and the same rounded corners as the card. Text and sections stay visible if a reveal has not finished within 1.5 seconds, and immediately in an iOS embed.

## Motion and video

Hero clips play in order with configurable `CUT_POINTS` in `src/config.js`. Two video elements crossfade for 200ms so only one keeps decoding. The next clip preloads while the current one plays. Posters are the first frame. On each load the logo pops in the center and settles into the header once, in about 1.2 seconds, before the first clip plays. When the header is hidden, that same pop ends in a fade-out. Each section below the hero slides, scales, and fades in as one block. Section headings reveal letter by letter. Ordering numbers count up and scale in, then the step copy slides up. Category cards and Why rows rise and fade in. Buttons sweep a gold shine on hover. In an embed those reveals play on load, without pinning, so the document height does not grow. `prefers-reduced-motion` shows the first poster and a play button, leaves the logo in the header, and skips Lenis, pins, section entrances, and letter pops.

Palette is navy `#00276C`, cream `#EBDFC2`, royal blue `#0A3A9E`, and gold `#D4A017`.

Testimonials stay out of the page until real quotes exist. `[NEEDS DWIGHT]` notes stay visible in the ordering and bulk-friendly copy.
