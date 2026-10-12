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

  if (!framed) return;

  const send = () => {
    const height = Math.ceil(document.documentElement.scrollHeight);
    window.parent.postMessage({ source: "daykodee-home", type: "resize", height }, "*");
  };

  send();
  window.addEventListener("load", send);
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(send);
    observer.observe(document.documentElement);
  }
}
