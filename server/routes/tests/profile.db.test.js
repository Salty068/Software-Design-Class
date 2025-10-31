import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { buildApp } from "../../server.js";
import prisma from "../../db.js";

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

describe("Profile Database Integration Tests", () => {
  const testProfile = {
    fullName: "John Doe",
    location: {
      address1: "123 Main St",
      address2: "Apt 4B",
      city: "Houston",
      state: "TX",
      zipCode: "77001",
    },
    skills: ["JavaScript", "Python", "React"],
    preferences: "Prefer morning shifts",
    availability: ["Monday", "Wednesday", "Friday"],
  };

  describe("POST /api/profile/:userId - Create Profile", () => {
    it("should create a new profile in database", async () => {
      const response = await request(app)
        .post("/api/profile/testuser1")
        .send(testProfile)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe("John Doe");
      expect(response.body.data.userId).toBe("testuser1");

      const dbProfile = await prisma.userProfile.findUnique({
        where: { userId: "testuser1" },
      });

      expect(dbProfile).toBeTruthy();
      expect(dbProfile.fullName).toBe("John Doe");
      expect(dbProfile.city).toBe("Houston");
      expect(dbProfile.state).toBe("TX");
      expect(dbProfile.skills).toEqual(["JavaScript", "Python", "React"]);
    });

    it("should reject duplicate userId", async () => {
      await request(app).post("/api/profile/testuser2").send(testProfile).expect(201);

      const response = await request(app)
        .post("/api/profile/testuser2")
        .send(testProfile)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });

    it("should validate required fields", async () => {
      const invalidProfile = { ...testProfile, fullName: "" };

      const response = await request(app)
        .post("/api/profile/testuser3")
        .send(invalidProfile)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("GET /api/profile/:userId - Retrieve Profile", () => {
    it("should retrieve existing profile from database", async () => {
      await request(app).post("/api/profile/testuser4").send(testProfile).expect(201);

      const response = await request(app).get("/api/profile/testuser4").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe("John Doe");
      expect(response.body.data.location.city).toBe("Houston");
    });

    it("should return 404 for non-existent profile", async () => {
      const response = await request(app).get("/api/profile/nonexistent").expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("PUT /api/profile/:userId - Update Profile", () => {
    it("should update existing profile in database", async () => {
      await request(app).post("/api/profile/testuser5").send(testProfile).expect(201);

      const updateData = {
        fullName: "Jane Smith",
        location: {
          address1: "456 Oak Ave",
          city: "Dallas",
          state: "TX",
          zipCode: "75001",
        },
      };

      const response = await request(app)
        .put("/api/profile/testuser5")
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe("Jane Smith");
      expect(response.body.data.location.city).toBe("Dallas");

      const dbProfile = await prisma.userProfile.findUnique({
        where: { userId: "testuser5" },
      });

      expect(dbProfile.fullName).toBe("Jane Smith");
      expect(dbProfile.city).toBe("Dallas");
      expect(dbProfile.skills).toEqual(testProfile.skills);
    });

    it("should return 404 for non-existent profile", async () => {
      const response = await request(app)
        .put("/api/profile/nonexistent")
        .send({ fullName: "Test" })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/profile/:userId - Delete Profile", () => {
    it("should delete profile from database", async () => {
      await request(app).post("/api/profile/testuser6").send(testProfile).expect(201);

      const response = await request(app).delete("/api/profile/testuser6").expect(200);

      expect(response.body.success).toBe(true);

      const dbProfile = await prisma.userProfile.findUnique({
        where: { userId: "testuser6" },
      });

      expect(dbProfile).toBeNull();
    });

    it("should return 404 for non-existent profile", async () => {
      const response = await request(app).delete("/api/profile/nonexistent").expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/profile - List All Profiles", () => {
    it("should retrieve all profiles from database", async () => {
      await request(app).post("/api/profile/user1").send(testProfile).expect(201);

      const profile2 = { ...testProfile, fullName: "Jane Doe" };
      await request(app).post("/api/profile/user2").send(profile2).expect(201);

      const response = await request(app).get("/api/profile").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it("should return empty array when no profiles exist", async () => {
      const response = await request(app).get("/api/profile").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });
  });
});
