import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

const replitDomain = process.env.REPLIT_DEV_DOMAIN;

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    hmr: replitDomain
      ? { host: replitDomain, clientPort: 443, protocol: "wss" }
      : { clientPort: 5000 },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ["**/mysql_data/**", "**/.git/**", "**/node_modules/**"],
    },
  },
});
