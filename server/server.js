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

async function createServer() {
  const app = express();
  app.use(express.json());

  app.use("/api/match", matching);
  app.use("/api/notifications", notifications);
  startReminders();

    //no use for this at the moment
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  let vite = null;
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({ server: { middlewareMode: true }, appType: "custom", root });
    app.use(vite.middlewares);
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

  store.upsertVolunteers(demoVols); //Example volunteer addition
  store.upsertEvents(demoEvents); //Example event addition

  //if .env doesn't exist push on port 3000
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`http://localhost:${port}`));
}

createServer();
