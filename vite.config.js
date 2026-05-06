import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/leadership-dashboard/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Capstone Leadership Dashboard",
        short_name: "Dashboard",
        description: "Capstone Works Leadership Dashboard",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/leadership-dashboard/",
        icons: [
          {
            src: "/leadership-dashboard/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/leadership-dashboard/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
