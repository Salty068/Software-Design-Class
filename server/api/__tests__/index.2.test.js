import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("@prisma/client", () => {
  const findUnique = vi.fn().mockResolvedValue({
    id: "event-1",
    eventName: "Signup Event",
    location: "Downtown",
    eventDate: new Date("2024-01-10T00:00:00Z"),
  });
  class PrismaClient {
    constructor() {
      this.assignment = { findMany: vi.fn() };
      this.volunteerHistory = {
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      };
      this.eventDetails = { findUnique };
    }
  }
  return { PrismaClient };
});

vi.mock("../../routes/middleware/auth.js", () => ({
  authenticate: (_req, _res, next) => next(),
}));

vi.mock("../events.prisma.js", () => ({
  listEvents: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  resetEvents: vi.fn(),
}));

vi.mock("../volunteerHistory.prisma.js", () => ({
  listVolunteerHistory: vi.fn(),
  addVolunteerHistory: vi.fn(async (payload) => ({ id: "history-1", ...payload })),
  resetVolunteerHistory: vi.fn(),
}));

import router from "../index.js";
import * as eventsModule from "../events.prisma.js";
import * as vhModule from "../volunteerHistory.prisma.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", router);
  return app;
}

describe("API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /events returns 200 and wraps data", async () => {
    const events = [
      { id: "e1", name: "Test Event 1" },
      { id: "e2", name: "Test Event 2" },
    ];
    eventsModule.listEvents.mockResolvedValue(events);

    const app = createApp();
    const res = await request(app).get("/api/events");

    expect(eventsModule.listEvents).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: events });
  });

  it("GET /events maps thrown Error to 400", async () => {
    eventsModule.listEvents.mockRejectedValue(new Error("DB down"));

    const app = createApp();
    const res = await request(app).get("/api/events");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "DB down" });
  });

  it("POST /events returns 201 and wraps created event", async () => {
    const created = { id: "e3", name: "Created Event" };
    eventsModule.createEvent.mockResolvedValue(created);

    const app = createApp();
    const res = await request(app)
      .post("/api/events")
      .send({ name: "Created Event" });

    expect(eventsModule.createEvent).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: created });
  });

  it("POST /events maps non-Error rejection to 500", async () => {
    eventsModule.createEvent.mockRejectedValue("boom");

    const app = createApp();
    const res = await request(app)
      .post("/api/events")
      .send({ name: "Bad Event" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Unexpected server error." });
  });

  it("GET /volunteer-history filters, sorts, paginates and wraps data", async () => {
    const items = [
      {
        volunteerId: "user-1",
        volunteerName: "Alice",
        assignment: "Park Cleanup",
        location: "Downtown Houston",
        eventDate: "2024-06-02",
        status: "Registered",
      },
      {
        volunteerId: "user-2",
        volunteerName: "Bob",
        assignment: "Food Drive",
        location: "Uptown",
        eventDate: "2024-06-01",
        status: "Completed",
      },
    ];

    vhModule.listVolunteerHistory.mockResolvedValue(items);

    const app = createApp();
    const res = await request(app)
      .get("/api/volunteer-history")
      .query({
        page: "1",
        pageSize: "1",
        sortKey: "eventDate",
        sortDir: "asc",
        search: "park",
        status: "Registered,Completed",
        dateFrom: "2024-06-01",
        dateTo: "2024-06-30",
        userId: "user-1",
      });

    expect(vhModule.listVolunteerHistory).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].volunteerName).toBe("Alice");
  });

  it("POST /volunteer-history transforms signup payload and normalizes status", async () => {
    const app = createApp();

    const payload = {
      volunteerId: "user-1",
      eventId: "event-1",
    };

    const res = await request(app)
      .post("/api/volunteer-history")
      .send(payload);

    expect(res.status).toBe(201);
    expect(vhModule.addVolunteerHistory).toHaveBeenCalledTimes(1);

    const callArg = vhModule.addVolunteerHistory.mock.calls[0][0];

    expect(callArg.volunteerId).toBe("user-1");
    expect(callArg.assignment).toBe("Signup Event");
    expect(callArg.location).toBe("Downtown");
    expect(callArg.status).toBe("Registered");
    expect(res.body).toHaveProperty("data");
    expect(res.body.data.status).toBe("Registered");
  });
  it("POST /volunteer-history normalizes lowercase status when full payload is provided", async () => {
    const app = createApp();

    const payload = {
      volunteerId: "user-2",
      eventId: "event-2",
      volunteerName: "Dana",
      assignment: "Food Drive",
      location: "Uptown",
      eventDate: "2024-06-15",
      status: "completed",
      hours: 5,
    };

    const res = await request(app)
      .post("/api/volunteer-history")
      .send(payload);

    expect(res.status).toBe(201);
    expect(vhModule.addVolunteerHistory).toHaveBeenCalledTimes(1);

    const callArg = vhModule.addVolunteerHistory.mock.calls[0][0];

    expect(callArg.status).toBe("Completed");
    expect(res.body).toHaveProperty("data");
    expect(res.body.data.status).toBe("Completed");
  });

});
