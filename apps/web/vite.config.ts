import { defineConfig } from "vite";
import dotenv from "dotenv";
import fs from "node:fs";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = fileURLToPath(new URL(".", import.meta.url));
const envCandidates = [
  path.resolve(webRoot, ".env"),
  path.resolve(webRoot, "../.env"),
  path.resolve(webRoot, "../../.env"),
];

const publicEnv = Object.fromEntries(
  envCandidates.flatMap((candidate) => {
    if (!fs.existsSync(candidate)) {
      return [];
    }

    return Object.entries(dotenv.parse(fs.readFileSync(candidate))).filter(
      ([key]) => key.startsWith("VITE_"),
    );
  }),
);

const defineEnv = Object.fromEntries(
  Object.entries(publicEnv).map(([key, value]) => [
    `import.meta.env.${key}`,
    JSON.stringify(value),
  ]),
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  define: defineEnv,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("/react-dom/") || id.includes("react-dom@")) {
            return "react-dom";
          }

          if (id.includes("/react/") || id.includes("react@")) {
            return "react";
          }

          if (id.includes("react-router-dom")) {
            return "router";
          }

          if (id.includes("socket.io-client")) {
            return "socket";
          }

          if (id.includes("lucide-react")) {
            return "icons";
          }

          if (id.includes("react-hook-form")) {
            return "forms";
          }

          if (id.includes("emoji-picker-react")) {
            return "emoji-picker";
          }

          if (id.includes("date-fns")) {
            return "date-fns";
          }

          if (id.includes("axios")) {
            return "axios";
          }

          return "vendor";
        },
      },
    },
  },
});
