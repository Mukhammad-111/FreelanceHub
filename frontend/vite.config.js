import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": "http://localhost:8000",
      "/orders": "http://localhost:8000",
      "/services": "http://localhost:8000",
      "/profiles": "http://localhost:8000",
      "/responses": "http://localhost:8000",
      "/reviews": "http://localhost:8000",
      "/payments": "http://localhost:8000",
      "/categories": "http://localhost:8000",
      "/admin": "http://localhost:8000",
    },
  },
});
