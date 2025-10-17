// we made this practically empty backend for future proofing

import fs from "fs/promises";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dist = path.resolve(root, "dist");

async function createServer() {
  const app = express();
  app.use(express.json());

  let apiRouter = null;

  //no use for this at the moment
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  let vite = null;
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({ server: { middlewareMode: true }, appType: "custom", root });
    app.use(vite.middlewares);
  }

  try {
    if (vite) {
      const mod = await vite.ssrLoadModule("/server/api/index.js");
      apiRouter = mod?.default ?? null;
    } else {
      const mod = await import("./api/index.js");
      apiRouter = mod?.default ?? null;
    }
  } catch (error) {
    console.warn("API router not mounted.", error);
  }

  if (apiRouter) {
    app.use("/api", apiRouter);
  }

  app.use(express.static(dist));


  //regex to match everything but the api to display pages
  app.get(/^(?!\/api).*/, async (req, res, next) => {
    try {
      if (vite) {
        const url = req.originalUrl;
        const raw = await fs.readFile(path.resolve(root, "index.html"), "utf8");
        const html = await vite.transformIndexHtml(url, raw);
        res.status(200).type("html").end(html);
      } else {
        res.sendFile(path.join(dist, "index.html"));
      }
    } catch (e) {
      vite?.ssrFixStacktrace?.(e);
      next(e);
    }
  });

  //if .env doesn't exist push on port 3000
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`http://localhost:${port}`));
}

createServer();
