import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { buildApp } from "../../server.js";

let app;
beforeAll(async () => { app = await buildApp(); });

it("POST /api/match/seed accepts empty body", async () => {
  const res = await request(app).post("/api/match/seed").send({});
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});
