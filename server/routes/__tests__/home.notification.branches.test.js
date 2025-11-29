import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("@prisma/client", () => {
  const countReject = vi.fn().mockRejectedValue(new Error("fail"));
  const aggregateReject = vi.fn().mockRejectedValue(new Error("fail"));
  const findManyReject = vi.fn().mockRejectedValue(new Error("fail"));
  const deleteManyReject = vi.fn().mockRejectedValue(new Error("fail"));
  const createReject = vi.fn().mockRejectedValue(new Error("fail"));

  class PrismaClient {
    constructor() {
      this.userProfile = { count: countReject };
      this.eventDetails = { count: countReject, findMany: findManyReject };
      this.volunteerHistory = {
        aggregate: aggregateReject,
        count: countReject,
      };
      this.notice = {
        findMany: findManyReject,
        deleteMany: deleteManyReject,
        create: createReject,
      };
    }
  }

  return { PrismaClient };
});

import home from "../home.js";
import { notifications } from "../notifications.js";

function homeApp() {
  const app = express();
  app.use(express.json());
  app.use(home);
  return app;
}

function notificationsApp() {
  const app = express();
  app.use(express.json());
  app.use(notifications);
  return app;
}

describe("home and notifications error branches", () => {
  it("GET /stats returns 500 on prisma error", async () => {
    const app = homeApp();
    const res = await request(app).get("/stats");
    expect(res.status).toBe(500);
  });

  it("GET /featured-events returns 500 on prisma error", async () => {
    const app = homeApp();
    const res = await request(app).get("/featured-events");
    expect(res.status).toBe(500);
  });

  it("GET /list/:volId returns 500 on prisma error", async () => {
    const app = notificationsApp();
    const res = await request(app).get("/list/test-vol");
    expect(res.status).toBe(500);
  });

  it("DELETE /clear/:volId returns 500 on prisma error", async () => {
    const app = notificationsApp();
    const res = await request(app).delete("/clear/test-vol");
    expect(res.status).toBe(500);
  });

  it("POST /send returns 500 on prisma error", async () => {
    const app = notificationsApp();
    const res = await request(app)
      .post("/send")
      .send({ volunteerId: "test-vol", title: "Hello" });
    expect(res.status).toBe(500);
  });
});
