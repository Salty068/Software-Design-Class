import { Router } from "express";
import { store } from "../store.memory.js";
import { score } from "../services/matching.js";
import { notify } from "../services/notifications.js";

export const matching = Router();


matching.post("/seed", (req, res) => {
  const { volunteers = [], events = [] } = req.body || {};
  store.upsertVolunteers(volunteers);
  store.upsertEvents(events);
  res.json({ ok: true });
});

matching.get("/volunteer/:id", (req, res) => {
  const v = store.getVolunteer(req.params.id);
  if (!v) return res.status(404).json({ error: "volunteer not found" });
  const ranked = store.listEvents()
    .map(e => ({ event: e, score: score(v, e) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
  res.json(ranked);
});

matching.post("/assign", (req, res) => {
  const { volunteerId, eventId } = req.body || {};
  const v = store.getVolunteer(volunteerId);
  const e = store.getEvent(eventId);
  if (!v || !e) return res.status(404).json({ error: "not found" });
  const a = store.addAssignment(volunteerId, eventId);
  notify(volunteerId, { title: `Assigned: ${e.name}`, body: `${e.location} • ${e.date}`, type: "success" });
  res.json({ ok: true, assignment: a });
});

matching.get("/volunteers", (_req, res) => {
  res.json(store.listVolunteers());
});

matching.get("/events", (_req, res) => {
  res.json(store.listEvents());
});

