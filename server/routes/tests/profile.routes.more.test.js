import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { buildApp } from "../../server.js";
import { profiles } from "../profile.js";

let app;
beforeAll(async () => { app = await buildApp(); });

describe("profile routes", () => {
  const validProfile = {
    fullName: "John Doe",
    location: {
      address1: "123 Main St",
      address2: "Apt 4",
      city: "Houston",
      state: "TX",
      zipCode: "77001",
    },
    skills: ["Teaching", "Driving"],
    preferences: "No weekends",
    availability: ["Monday", "Wednesday"],
  };

  it("GET /api/profile returns empty array initially", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });



  it("POST /api/profile/:userId creates new profile", async () => {
    const res = await request(app).post("/api/profile/u1").send(validProfile);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/profile/:userId 409 on duplicate", async () => {
    const res = await request(app).post("/api/profile/u1").send(validProfile);
    expect(res.status).toBe(409);
  });

  it("GET /api/profile/:userId returns data", async () => {
    const res = await request(app).get("/api/profile/u1");
    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe("John Doe");
  });

  it("PUT /api/profile/:userId 404 on missing", async () => {
    const res = await request(app).put("/api/profile/none").send(validProfile);
    expect(res.status).toBe(404);
  });

  it("PUT /api/profile/:userId updates successfully", async () => {
    const res = await request(app)
      .put("/api/profile/u1")
      .send({ fullName: "John X", preferences: "Remote only" });
    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe("John X");
  });

  it("PUT /api/profile/:userId 400 on invalid input", async () => {
    const res = await request(app)
      .put("/api/profile/u1")
      .send({ location: { state: 123 } });
    expect(res.status).toBe(400);
  });

  it("DELETE /api/profile/:userId removes profile", async () => {
    const res = await request(app).delete("/api/profile/u1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /api/profile/:userId 404 when missing", async () => {
    const res = await request(app).delete("/api/profile/unknown");
    expect(res.status).toBe(404);
  });
});
