import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { buildApp } from "../../server.js";
import { store } from "../../store.memory.js";

let app;
beforeAll(async () => { app = await buildApp(); });

it("GET /api/match/events returns all events", async () => {
  const res = await request(app).get("/api/match/events");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
});

it("GET /api/match/volunteer/:id 404 for unknown volunteer", async () => {
  const res = await request(app).get("/api/match/volunteer/does-not-exist");
  expect(res.status).toBe(404);
});

it("POST /api/match/assign 400 on missing body", async () => {
  const res = await request(app).post("/api/match/assign").send({});
  expect(res.status).toBe(400);
});

it("POST /api/match/assign 404 on bad ids", async () => {
  const res = await request(app).post("/api/match/assign").send({ volunteerId:"nope", eventId:"nope" });
  expect(res.status).toBe(404);
});

it("POST /api/match/assign succeeds", async () => {
  const v = store.listVolunteers()[0];
  const e = store.listEvents()[0];
  const res = await request(app).post("/api/match/assign").send({ volunteerId: v.id, eventId: e.id });
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
  expect(res.body.assignment).toBeTruthy();
});
