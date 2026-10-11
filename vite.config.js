import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  let base = env.VITE_BASE || process.env.VITE_BASE || "/daykodee-home/";
  if (!base.endsWith("/")) base += "/";

  return {
    base,
    build: {
      target: "es2020",
      cssCodeSplit: false,
      modulePreload: { polyfill: false },
      assetsInlineLimit: 2048,
    },
    plugins: [
      {
        name: "preload-critical-fonts",
        transformIndexHtml: {
          order: "post",
          handler(html, ctx) {
            if (!ctx.bundle) return html;
            const want = ["montserrat-latin-900", "open-sans-latin-400"];
            const links = [];
            for (const item of Object.values(ctx.bundle)) {
              if (item.type !== "asset" || !item.fileName.endsWith(".woff2")) continue;
              if (!want.some((name) => item.fileName.includes(name))) continue;
              links.push(
                `<link rel="preload" href="${base}${item.fileName}" as="font" type="font/woff2" crossorigin>`,
              );
            }
            if (!links.length) return html;
            return html.replace("</head>", `${links.join("\n")}\n</head>`);
          },
        },
      },
    ],
  };
});
