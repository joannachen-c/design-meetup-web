import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  // Agentation marks React as an optional peer; Vite's prebundle stubs those
  // imports and throws. Exclude it so React resolves from this project.
  optimizeDeps: {
    exclude: ["agentation"],
  },
});
