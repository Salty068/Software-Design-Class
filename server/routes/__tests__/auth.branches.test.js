import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../db.js", () => {
  const prisma = {
    userCredentials: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
  return { __esModule: true, default: prisma, prisma };
});

vi.mock("bcrypt", () => {
  const hash = vi.fn();
  const compare = vi.fn();
  return { __esModule: true, default: { hash, compare }, hash, compare };
});

vi.mock("jsonwebtoken", () => {
  const sign = vi.fn(() => "signed-token");
  return { __esModule: true, default: { sign }, sign };
});

vi.mock("../middleware/auth.js", () => ({
  authenticate: (req, _res, next) => {
    req.user = {};
    next();
  },
}));

import prisma from "../../db.js";
import bcryptModule from "bcrypt";
import { auth } from "../auth.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/auth", auth);
  return app;
}

describe("auth routes branches", () => {
  it("register returns 409 when user already exists", async () => {
    prisma.userCredentials.findUnique.mockResolvedValue({ userId: "user@test.com" });

    const app = createApp();
    const res = await request(app).post("/auth/register").send({
      email: "user@test.com",
      password: "pass",
    });

    expect(res.status).toBe(409);
  });

  it("login returns 401 when password is invalid", async () => {
    prisma.userCredentials.findUnique.mockResolvedValue({
      userId: "user@test.com",
      password: "hashed",
    });
    bcryptModule.compare.mockResolvedValue(false);

    const app = createApp();
    const res = await request(app).post("/auth/login").send({
      email: "user@test.com",
      password: "wrong",
    });

    expect(res.status).toBe(401);
  });

  it("me returns 401 when user id from token is invalid", async () => {
    const app = createApp();
    const res = await request(app).get("/auth/me");

    expect(res.status).toBe(401);
  });

  it("change-password returns 404 when user not found", async () => {
    prisma.userCredentials.findUnique.mockResolvedValue(null);

    const app = createApp();
    const res = await request(app).put("/auth/change-password").send({
      email: "user@test.com",
      currentPassword: "old",
      newPassword: "new",
    });

    expect(res.status).toBe(404);
  });
    it("register returns 400 when email and password are missing", async () => {
    const app = createApp();
    const res = await request(app).post("/auth/register").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("login returns 400 when email and password are missing", async () => {
    const app = createApp();
    const res = await request(app).post("/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("change-password returns 400 when required fields are missing", async () => {
    const app = createApp();
    const res = await request(app).put("/auth/change-password").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

});
