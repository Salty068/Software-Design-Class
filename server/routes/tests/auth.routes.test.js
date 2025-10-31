import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { buildApp } from "../../server.js";
import prisma from "../../db.js";
import bcrypt from "bcrypt";

let app;

beforeAll(async () => {
  app = await buildApp();
});

beforeEach(async () => {
  await prisma.volunteerHistory.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.userCredentials.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Authentication Routes Tests", () => {
  describe("POST /api/auth/register - User Registration", () => {
    it("should register a new user with encrypted password", async () => {
      const credentials = {
        userId: "newuser123",
        password: "SecurePass123!",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(credentials)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe("newuser123");

      const dbUser = await prisma.userCredentials.findUnique({
        where: { userId: "newuser123" },
      });

      expect(dbUser).toBeTruthy();
      expect(dbUser.password).not.toBe(credentials.password);
      
      const isPasswordValid = await bcrypt.compare(credentials.password, dbUser.password);
      expect(isPasswordValid).toBe(true);
    });

    it("should reject duplicate userId", async () => {
      const credentials = {
        userId: "duplicate123",
        password: "SecurePass123!",
      };

      await request(app).post("/api/auth/register").send(credentials).expect(201);

      const response = await request(app)
        .post("/api/auth/register")
        .send(credentials)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });

    it("should validate password length", async () => {
      const credentials = {
        userId: "shortpass",
        password: "short",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(credentials)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain("password must be at least 8 characters long");
    });

    it("should validate userId is provided", async () => {
      const credentials = {
        password: "SecurePass123!",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(credentials)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/auth/login - User Login", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          userId: "logintest",
          password: "TestPassword123!",
        })
        .expect(201);
    });

    it("should login with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          userId: "logintest",
          password: "TestPassword123!",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Login successful");
      expect(response.body.data.userId).toBe("logintest");
    });

    it("should reject incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          userId: "logintest",
          password: "WrongPassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid credentials");
    });

    it("should reject non-existent userId", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          userId: "nonexistent",
          password: "TestPassword123!",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid credentials");
    });
  });

  describe("PUT /api/auth/change-password - Change Password", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          userId: "changepass",
          password: "OldPassword123!",
        })
        .expect(201);
    });

    it("should change password successfully", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .send({
          userId: "changepass",
          currentPassword: "OldPassword123!",
          newPassword: "NewPassword456!",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Password changed successfully");

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          userId: "changepass",
          password: "NewPassword456!",
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it("should reject incorrect current password", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .send({
          userId: "changepass",
          currentPassword: "WrongOldPassword",
          newPassword: "NewPassword456!",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid current password");
    });

    it("should validate new password length", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .send({
          userId: "changepass",
          currentPassword: "OldPassword123!",
          newPassword: "short",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain("password must be at least 8 characters long");
    });
  });
});
