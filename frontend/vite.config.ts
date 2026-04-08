import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const backendTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:4000";
const proxiedRoutePrefixes = [
  "/api",
  "/auth",
  "/assistant",
  "/cart",
  "/courses",
  "/lessons",
  "/pages",
  "/quiz",
  "/health",
  "/users",
  "/cold-call",
  "/activity",
  "/persona-profiles",
  "/cohort-projects",
  "/registrations",
  "/landing-assistant",
  "/dashboard",
  "/certificates",
  "/blogs",
  "/admin",
];

const proxy = Object.fromEntries(
  proxiedRoutePrefixes.map((prefix) => [
    prefix,
    {
      target: backendTarget,
      changeOrigin: true,
    },
  ]),
);

export default defineConfig({
  plugins: [
    react(),
    // Only include Replit plugins in development/Replit environment
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
        runtimeErrorOverlay(),
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer(),
        ),
      ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "src", "assets", "external"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    allowedHosts: ["erminia-orthogonal-tremendously.ngrok-free.dev"],
    proxy,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
