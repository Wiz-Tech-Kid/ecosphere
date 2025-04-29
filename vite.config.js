import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // Switch to SWC for better performance
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::", // Listen on all IPv6 and IPv4 addresses
    port: 8080, // Set development server port to 8080
  },
  plugins: [
    react(),
    // Add any mode-specific plugins here if needed
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Define alias for the src directory
    },
  },
  base: "./", // Ensure correct base path for assets
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: "./src/main.tsx", // Ensure correct entry point
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
}));
