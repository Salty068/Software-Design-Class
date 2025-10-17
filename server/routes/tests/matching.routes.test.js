import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { buildApp } from "../../server.js";
import { store } from "../../store.memory.js";

let app;
beforeAll(async () => { app = await buildApp(); });

it("lists volunteers", async () => {
  const res = await request(app).get("/api/match/volunteers");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

it("ranks events for a volunteer", async () => {
  const v = store.listVolunteers()[0];
  const res = await request(app).get(`/api/match/volunteer/${v.id}?topN=5`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});
