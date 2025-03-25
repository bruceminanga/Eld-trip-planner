import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import tailwindcss from "@tailwindcss/vite";

// Load environment variables
dotenv.config();

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "process.env": process.env,
  },
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/components",
      "@services": "/src/services",
      "@utils": "/src/utils",
      "@styles": "/src/styles",
    },
  },

  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
