import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { bus } from "../services/notifications.js"; // keep your EventEmitter

export const notifications = Router();
const prisma = new PrismaClient();

const serialize = (n) => ({
  id: n.id,
  volunteerId: n.volunteerId,
  title: n.title,
  body: n.body ?? null,
  type: n.type,                
  createdAtMs: Number(n.createdAtMs),
});

// GET /list/:volId → list notices for a volunteer
notifications.get("/list/:volId", async (req, res) => {
  const { volId } = req.params;
  try {
    const rows = await prisma.notice.findMany({
      where: { volunteerId: volId },
      orderBy: { createdAtMs: "asc" },
    });
    res.json(rows.map(serialize));
  } catch (e) {
    res.status(500).json({ error: "failed_to_list_notices" });
  }
});

// DELETE /clear/:volId → delete all notices for a volunteer
notifications.delete("/clear/:volId", async (req, res) => {
  const { volId } = req.params;
  try {
    await prisma.notice.deleteMany({ where: { volunteerId: volId } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "failed_to_clear_notices" });
  }
});

notifications.post("/send", async (req, res) => {
  const { volunteerId, title, body, type } = req.body || {};
  if (!volunteerId || !title) return res.status(400).json({ error: "volunteerId and title required" });

  // optional: validate type against allowed values
  const allowed = new Set(["info", "success", "warn", "error"]);
  const safeType = allowed.has(type) ? type : undefined; // let Prisma default to 'info'

  try {
    const created = await prisma.notice.create({
      data: { volunteerId, title, body, type: safeType },
    });
    const payload = serialize(created);
    bus.emit(`notice:${volunteerId}`, payload);
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: "failed_to_create_notice" });
  }
});

notifications.get("/stream/:volId", async (req, res) => {
  const { volId } = req.params;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const write = (n) => res.write(`event: notice\ndata: ${JSON.stringify(n)}\n\n`);

  try {
    const existing = await prisma.notice.findMany({
      where: { volunteerId: volId },
      orderBy: { createdAtMs: "asc" },
    });
    existing.map(serialize).forEach(write);
  } catch {

  }

  const handler = (n) => write(n);
  bus.on(`notice:${volId}`, handler);

  req.on("close", () => {
    bus.off(`notice:${volId}`, handler);
  });
});
