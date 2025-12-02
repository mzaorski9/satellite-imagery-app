import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      "/api": {
        target: "http://web:8000",
        changeOrigin: true, 
        secure: false,
      },
      "/media": {
        target: "http://web:8000",
        changeOrigin: true,
        secure: false,
      },
      // optionally static or other endpoints:
      "/static": {
        target: "http://web:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
//https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

