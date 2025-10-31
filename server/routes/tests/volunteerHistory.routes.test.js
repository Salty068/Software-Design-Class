import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import { buildApp } from "../../server.js";
import { resetVolunteerHistory, PARTICIPATION_STATUSES } from "../../api/volunteerHistory.prisma.js";

let app;
const isoDate = (daysFromToday = 0) =>
  new Date(Date.now() + daysFromToday * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  app = await buildApp();
});

beforeEach(async () => {
  await resetVolunteerHistory([]);
});

describe("Volunteer History API", () => {
  it("GET /api/volunteer-history returns empty list when no records", async () => {
    const res = await request(app).get("/api/volunteer-history");
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ items: [], total: 0 });
  });

  it("POST /api/volunteer-history creates an entry", async () => {
    const res = await request(app).post("/api/volunteer-history").send({
      volunteerName: "Jordan Smith",
      assignment: "Logistics Support",
      location: "Houston, TX",
      eventDate: isoDate(1),
      status: PARTICIPATION_STATUSES[0],
      hours: 6,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.volunteerName).toBe("Jordan Smith");
  });

  it("POST /api/volunteer-history rejects invalid payload", async () => {
    const res = await request(app).post("/api/volunteer-history").send({
      volunteerName: "",
      assignment: "",
      location: "",
      eventDate: "",
      status: "Registered",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields.");
  });

  it("GET /api/volunteer-history applies status filter", async () => {
    await resetVolunteerHistory([
      {
        id: "vh-1",
        volunteerId: "vol-1",
        volunteerName: "x",
        assignment: "x",
        location: "x",
        eventDate: isoDate(1),
        status: "Completed",
        hours: 4,
      },
      {
        id: "vh-2",
        volunteerId: "vol-2",
        volunteerName: "x",
        assignment: "x",
        location: "x",
        eventDate: isoDate(2),
        status: "Registered",
        hours: 3,
      },
    ]);

    const res = await request(app).get("/api/volunteer-history").query({ status: "Completed" });
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].status).toBe("Completed");
  });
});
