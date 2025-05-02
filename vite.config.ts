import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src", // Alias for the src directory
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`, // Include global SCSS variables if needed
      },
    },
  },
  server: {
    hmr: {
      overlay: false, // Disable the HMR overlay for errors
    },
  },
});
