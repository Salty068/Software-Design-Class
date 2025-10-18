import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { buildApp } from "../../server.js";
import { store } from "../../store.memory.js";

let app;
beforeAll(async () => { app = await buildApp(); });

it("POST /api/notifications/send stores a notice", async () => {
  const v = store.listVolunteers()[0];
  const res = await request(app)
    .post("/api/notifications/send")
    .send({ volunteerId: v.id, title: "HTTP notice", body: "hi" });
  expect(res.status).toBe(200);
  const list = store.listNotices(v.id);
  expect(list.some(n => n.title === "HTTP notice")).toBe(true);
});

it("GET /api/notifications/list/:volId returns notices", async () => {
  const v = store.listVolunteers()[0];
  const res = await request(app).get(`/api/notifications/list/${v.id}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});
