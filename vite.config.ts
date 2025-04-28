import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/", // Ensure the base path matches your deployment
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Simplify imports with '@'
    },
  },
  server: {
    port: 3000, // Specify the development server port
  },
  build: {
    outDir: "dist", // Output directory for the build
  },
  envPrefix: ["VITE_", "REACT_APP_"], // Ensure environment variables with these prefixes are loaded
});



