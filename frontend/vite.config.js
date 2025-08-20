import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// We need to export a function to access the 'mode'
export default defineConfig(({ mode }) => {
  // Load env variables based on the mode (development, production)
  // and the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
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
      // 1. Make the server accessible from outside the container
      host: true,
      port: 5173, // Explicitly set the port

      // 2. Use an environment variable for the proxy target
      proxy: {
        "/api": {
          // If VITE_API_BASE_URL is set, use it; otherwise, fall back to localhost
          target: env.VITE_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
