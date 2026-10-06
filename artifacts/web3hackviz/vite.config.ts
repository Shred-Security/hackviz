import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const port = Number(process.env.PORT) || 5000;
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    {
      name: "hackviz-live-visitors",
      async configureServer(server) {
        const fs = await import("node:fs/promises");
        const pathMod = await import("node:path");
        const storePath = pathMod.resolve(import.meta.dirname, ".visitors-total.json");
        const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;
        const BASELINE = 11_034;

        type Store = { total: number; seen: Record<string, true> };

        const readStore = async (): Promise<Store> => {
          try {
            const raw = await fs.readFile(storePath, "utf8");
            const parsed = JSON.parse(raw) as Store;
            const stored =
              typeof parsed.total === "number" ? Math.max(0, Math.floor(parsed.total)) : 0;
            return {
              total: Math.max(stored, BASELINE),
              seen: parsed.seen && typeof parsed.seen === "object" ? parsed.seen : {},
            };
          } catch {
            return { total: BASELINE, seen: {} };
          }
        };

        const writeStore = async (store: Store) => {
          await fs.writeFile(storePath, JSON.stringify(store), "utf8");
        };

        server.middlewares.use("/api/visitors", (req, res, next) => {
          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (req.method === "GET") {
            void readStore().then((store) => {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ count: store.total }));
            });
            return;
          }

          if (req.method !== "POST") {
            next();
            return;
          }

          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", () => {
            void (async () => {
              try {
                const parsed = JSON.parse(body || "{}") as { id?: string };
                const id = typeof parsed.id === "string" ? parsed.id : "";
                if (!ID_RE.test(id)) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: "invalid id" }));
                  return;
                }
                const store = await readStore();
                if (!store.seen[id]) {
                  store.seen[id] = true;
                  store.total += 1;
                  await writeStore(store);
                }
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ count: store.total }));
              } catch {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "bad request" }));
              }
            })();
          });
        });
      },
    },
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
