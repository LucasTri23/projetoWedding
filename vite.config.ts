import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { pagesBase } from "./src/lib/deployment";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "PAGES_");
  const base = pagesBase(
    process.env.GITHUB_REPOSITORY,
    process.env.PAGES_BASE_PATH || env.PAGES_BASE_PATH,
  );
  return {
    base,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes("/node_modules/") &&
              (id.includes("@firebase/") || id.includes("/firebase/"))
            )
              return "firebase";
            if (
              /\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(
                id,
              )
            )
              return "react-vendor";
          },
        },
      },
    },
    plugins: [
      react(),
      tailwind(),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["logo.svg", "icon.svg", "icon-192.png", "icon-512.png"],
        manifest: {
          name: "Cultiva",
          short_name: "Cultiva",
          lang: "pt-BR",
          description: "Bons hábitos, no nosso ritmo.",
          theme_color: "#284e45",
          background_color: "#f6f7f2",
          display: "standalone",
          start_url: base,
          scope: base,
          icons: [
            {
              src: "icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any",
            },
          ],
        },
        workbox: {
          navigateFallback: "index.html",
          globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        },
      }),
    ],
  };
});
