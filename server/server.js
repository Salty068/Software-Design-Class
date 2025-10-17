import fs from "fs/promises";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";

import { matching } from "./routes/matching.js";
import { notifications } from "./routes/notifications.js";
import { startReminders } from "./services/notifications.js";

import { store } from "./store.memory.js";
import { demoVols, demoEvents } from "./demo_data/volunteer_events.data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dist = path.resolve(root, "dist");

export async function buildApp() {
  const app = express();
  app.use(express.json());

  let apiRouter = null;

  // seed before routes
  store.upsertVolunteers(demoVols);
  store.upsertEvents(demoEvents);

  // APIs
  app.use("/api/match", matching);
  app.use("/api/notifications", notifications);

  // health
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // Vite middleware only outside tests
  let vite = null;
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
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

  // serve index.html for non-API routes
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

  // start reminder loop only when not testing
  if (process.env.NODE_ENV !== "test") startReminders();

  return app;
}

// start listener only when not testing
if (process.env.NODE_ENV !== "test") {
  const app = await buildApp();
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`http://localhost:${port}`));
}
