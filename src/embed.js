const WIX_ORIGIN = "https://goldie13.wixsite.com/my-site";

function isFramed() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** Map a preview path onto the matching Wix page. Product links share /shop. */
function wixHref(path) {
  let pathname = path;
  try {
    pathname = new URL(path, "https://preview.local").pathname;
  } catch {
    return null;
  }
  if (pathname === "/shop" || pathname.startsWith("/category/") || pathname.startsWith("/product")) {
    return `${WIX_ORIGIN}/shop`;
  }
  if (pathname === "/about" || pathname.startsWith("/about/")) return `${WIX_ORIGIN}/about`;
  if (
    pathname === "/contact" ||
    pathname.startsWith("/contact/") ||
    pathname === "/quote" ||
    pathname.startsWith("/quote/")
  ) {
    return `${WIX_ORIGIN}/contact`;
  }
  if (pathname === "/faq" || pathname.startsWith("/faq/")) return `${WIX_ORIGIN}/faq`;
  return null;
}

/** Report content height to a parent frame and point CTAs at the Wix site when embedded. */
export function setupEmbed() {
  const framed = isFramed();
  const embed =
    framed ||
    document.documentElement.classList.contains("is-embed") ||
    new URLSearchParams(location.search).get("embed") === "1";

  if (embed) {
    document.documentElement.classList.add("is-embed");
    document.querySelectorAll("a[data-wix]").forEach((anchor) => {
      anchor.target = "_top";
      const path = anchor.getAttribute("href");
      if (!path || path.startsWith("#")) return;
      const next = wixHref(path);
      if (next) anchor.href = next;
    });
  }

  if (!embed) return;

  let fitting = false;

  /** Natural content height, ignoring any fill added to the closing section. */
  const measureContent = () => {
    const main = document.getElementById("main");
    if (!main) return document.documentElement.scrollHeight;
    return main.getBoundingClientRect().bottom + window.scrollY;
  };

  /**
   * Wix can leave the iframe taller than this page, and a fixed posted height
   * does not survive its mobile width scale. Stretch only the last section to
   * cover that gap. A shorter iframe keeps the natural height, so this never
   * adds a scrollbar.
   */
  const fitLastSection = () => {
    const section = document.getElementById("ready");
    if (!section) return Math.ceil(measureContent());

    fitting = true;
    section.style.minHeight = "";
    const natural = measureContent();
    const extra = window.innerHeight - natural;
    if (extra > 0.5) {
      const sectionHeight = section.getBoundingClientRect().height;
      section.style.minHeight = `${sectionHeight + extra}px`;
      const overflow = document.documentElement.scrollHeight - window.innerHeight;
      if (overflow > 0) {
        section.style.minHeight = `${Math.max(sectionHeight, section.getBoundingClientRect().height - overflow)}px`;
      }
    }
    requestAnimationFrame(() => {
      fitting = false;
    });
    return Math.ceil(natural);
  };

  const send = () => {
    const height = fitLastSection();
    window.parent.postMessage({ type: "daykodee-height", height }, "*");
    if (framed) {
      window.parent.postMessage({ source: "daykodee-home", type: "resize", height }, "*");
    }
  };

  send();
  window.addEventListener("load", send);
  window.addEventListener("resize", send);
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => {
      if (fitting) return;
      send();
    });
    observer.observe(document.documentElement);
  }
}
