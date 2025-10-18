import { Router } from "express";
import { store } from "../store.memory.js";
import { bus, notify } from "../services/notifications.js";

export const notifications = Router();

notifications.get("/list/:volId", (req, res) => res.json(store.listNotices(req.params.volId)));
notifications.delete("/clear/:volId", (req, res) => { store.clearNotices(req.params.volId); res.json({ ok: true }); });
notifications.post("/send", (req, res) => {
  const { volunteerId, title, body, type } = req.body || {};
  if (!volunteerId || !title) return res.status(400).json({ error: "volunteerId and title required" });
  res.json(notify(volunteerId, { title, body, type }));
});

// SSE stream
notifications.get("/stream/:volId", (req, res) => {
  const { volId } = req.params;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  store.listNotices(volId).forEach(n => res.write(`event: notice\ndata: ${JSON.stringify(n)}\n\n`));
  const handler = n => res.write(`event: notice\ndata: ${JSON.stringify(n)}\n\n`);
  bus.on(`notice:${volId}`, handler);
  req.on("close", () => bus.off(`notice:${volId}`, handler));
});
