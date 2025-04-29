import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ||"/ecosphere", // Ensure the base path is correct
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Simplify imports with '@'
    },
  },
  server: {
    port: 3000, // Local development server port
    open: true, // Automatically open the app in the browser
  },
  build: {
    outDir: "dist", // Output directory for the build
    rollupOptions: {
      input: "index.html", // Ensure the correct entry point
    },
  },
  envPrefix: ["VITE_", "REACT_APP_"], // Ensure environment variables with these prefixes are loaded
  assetsInclude: ["**/*.html"], // Treat .html files as assets
});



