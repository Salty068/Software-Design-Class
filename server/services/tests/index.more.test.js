import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { buildApp } from "../../server.js";

let app;
beforeAll(async () => { app = await buildApp(); });

describe("API /events coverage", () => {
  const good = {
    name: "n",
    description: "d",
    location: "l",
    eventDate: "2099-01-01",
    requiredSkills: ["A"],
    urgency: "Medium",
  };

  it("GET /api/events ok", async () => {
    const r = await request(app).get("/api/events");
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  it("POST /api/events 400 on missing fields", async () => {
    const r = await request(app).post("/api/events").send({ name: "x" });
    expect(r.status).toBe(400);
  });

  it("POST, PUT, DELETE happy paths + 400 not found", async () => {
    const c = await request(app).post("/api/events").send(good);
    expect(c.status).toBe(201);
    const id = c.body.data.id;

    const u = await request(app).put(`/api/events/${id}`).send({ ...good, name: "n2" });
    expect(u.status).toBe(200);
    expect(u.body.data.name).toBe("n2");

    const d = await request(app).delete(`/api/events/${id}`);
    expect(d.status).toBe(204);

    const u404 = await request(app).put("/api/events/__nope__").send(good);
    expect(u404.status).toBe(400);
    const d404 = await request(app).delete("/api/events/__nope__");
    expect(d404.status).toBe(400);
  });

  it("POST /api/events/reset accepts array and non-array", async () => {
    const a = await request(app).post("/api/events/reset").send([good]);
    expect(a.status).toBe(204);
    const b = await request(app).post("/api/events/reset").send({ nope: true });
    expect(b.status).toBe(204);
  });
});

describe("API /volunteer-history coverage", () => {
  const seed = [
    { volunteerName:"Zed", assignment:"Alpha", location:"UH", eventDate:"2025-10-10", status:"Registered", hours:3 },
    { volunteerName:"Ann", assignment:"Beta",  location:"UH", eventDate:"2025-10-12", status:"Completed",  hours:5 },
  ];

  it("POST /api/volunteer-history seeds entries", async () => {
    for (const x of seed) {
      const r = await request(app).post("/api/volunteer-history").send(x);
      expect(r.status).toBe(201);
    }
  });

  it("GET /api/volunteer-history paging + sort + search + status + date", async () => {
    const r1 = await request(app).get("/api/volunteer-history").query({
      page: 1, pageSize: 1, sortKey: "volunteerName", sortDir: "asc",
      search: "ze", status: "Registered", dateFrom: "2025-01-01", dateTo: "2025-12-31",
    });                                                                    // 140-141
    expect(r1.status).toBe(200);
    expect(r1.body.data).toHaveProperty("items");

    // hit other sort keys
    for (const sortKey of ["eventDate","assignment","status"]) {
      const r = await request(app).get("/api/volunteer-history").query({ sortKey, sortDir:"desc" });
      expect(r.status).toBe(200);
    }
  });

  it("POST /api/volunteer-history 400 invalid payload", async () => {
    const bad = await request(app).post("/api/volunteer-history").send({ volunteerName:"", assignment:"A" }); // 154-160
    expect(bad.status).toBe(400);
  });

  it("POST /api/volunteer-history/reset []", async () => {
    const r = await request(app).post("/api/volunteer-history/reset").send([]);
    expect(r.status).toBe(204);
  });
});
