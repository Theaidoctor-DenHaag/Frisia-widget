import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  define: {
  "process.env.NODE_ENV": '"production"',
  "process.env": {},
  "process": {},
},
  build: {
    lib: {
      entry: "src/widget.tsx",
      name: "FrisiaChatbotWidget",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
