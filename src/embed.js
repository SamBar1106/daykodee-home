/** Report content height to a parent frame and keep Wix paths on the parent site. */
export function setupEmbed() {
  const framed = window.parent !== window;
  if (framed && document.referrer) {
    document.querySelectorAll("a[data-wix]").forEach((anchor) => {
      const path = anchor.getAttribute("href");
      if (!path || path.startsWith("#")) return;
      try {
        anchor.href = new URL(path, document.referrer).href;
      } catch {
        /* Keep the authored path. */
      }
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
