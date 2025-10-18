import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { buildApp } from "../../server.js";
import {
  clearAllProfiles,
  validateArray,
  validateProfileData,
  validateStateCode,
  validateStringLength,
  validateZipCode,
} from "../profile.js";
import { store } from "../../store.memory.js";

let app;

beforeAll(async () => {
  app = await buildApp();
});

beforeEach(() => {
  clearAllProfiles();
});

describe("Profile validation helpers", () => {
  describe("validateStringLength", () => {
    it("validates minimum length", () => {
      const result = validateStringLength("ab", "testField", 3, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("at least 3 character(s)");
    });

    it("validates maximum length", () => {
      const result = validateStringLength("abcdefghijk", "testField", 1, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("must not exceed 10 characters");
    });

    it("passes valid string", () => {
      const result = validateStringLength("valid", "testField", 1, 10);
      expect(result.isValid).toBe(true);
    });
  });

  describe("validateStateCode", () => {
    it("rejects lowercase state codes", () => {
      const result = validateStateCode("tx");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("2-letter uppercase code");
    });

    it("accepts valid state codes", () => {
      const result = validateStateCode("TX");
      expect(result.isValid).toBe(true);
    });
  });

  describe("validateZipCode", () => {
    it("accepts 5 digit zip", () => {
      const result = validateZipCode("12345");
      expect(result.isValid).toBe(true);
    });

    it("rejects invalid zip", () => {
      const result = validateZipCode("1234");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("12345 or 12345-6789");
    });
  });

  describe("validateArray", () => {
    it("rejects non arrays", () => {
      const result = validateArray("nope", "testArray");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("must be an array");
    });

    it("rejects too few items", () => {
      const result = validateArray([], "testArray", 1);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("at least 1");
    });

    it("rejects too many items", () => {
      const result = validateArray(["a", "b", "c", "d"], "testArray", 1, 3);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("must not exceed 3");
    });

    it("rejects non string entries", () => {
      const result = validateArray([1, "two"], "testArray");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("must be a string");
    });

    it("passes valid array", () => {
      const result = validateArray(["one", "two"], "testArray", 1, 3);
      expect(result.isValid).toBe(true);
    });
  });

  describe("validateProfileData", () => {
    it("accepts a valid profile", () => {
      const profileData = {
        fullName: "John Doe",
        location: {
          address1: "123 Main St",
          city: "Houston",
          state: "TX",
          zipCode: "12345",
        },
        skills: ["JavaScript"],
        availability: ["Monday"],
      };

      const result = validateProfileData(profileData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("collects multiple validation errors", () => {
      const profileData = {
        fullName: "",
        location: {
          address1: "",
          city: "",
          state: "texas",
          zipCode: "123",
        },
        skills: [],
        availability: [],
      };

      const result = validateProfileData(profileData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe("Profile API", () => {
  const userId = "user123";

  const baseProfile = {
    fullName: "John Doe",
    location: {
      address1: "123 Main St",
      city: "Houston",
      state: "TX",
      zipCode: "12345",
    },
    skills: ["JavaScript"],
    availability: ["Monday"],
  };

  it("creates a new profile", async () => {
    const res = await request(app).post(`/api/profile/${userId}`).send(baseProfile);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(userId);
  });

  it("prevents duplicate profiles", async () => {
    await request(app).post(`/api/profile/${userId}`).send(baseProfile);
    const res = await request(app).post(`/api/profile/${userId}`).send(baseProfile);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("retrieves a profile", async () => {
    await request(app).post(`/api/profile/${userId}`).send(baseProfile);
    const res = await request(app).get(`/api/profile/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe("John Doe");
  });

  it("updates a profile", async () => {
    await request(app).post(`/api/profile/${userId}`).send(baseProfile);
    const res = await request(app)
      .put(`/api/profile/${userId}`)
      .send({
        ...baseProfile,
        fullName: "Jane Doe",
        availability: ["Tuesday"],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe("Jane Doe");
    expect(res.body.data.availability).toEqual(["Tuesday"]);
  });

  it("rejects invalid updates", async () => {
    await request(app).post(`/api/profile/${userId}`).send(baseProfile);
    const res = await request(app)
      .put(`/api/profile/${userId}`)
      .send({ fullName: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("deletes a profile", async () => {
    await request(app).post(`/api/profile/${userId}`).send(baseProfile);
    const res = await request(app).delete(`/api/profile/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app).get(`/api/profile/${userId}`);
    expect(getRes.status).toBe(404);
  });

  it("syncs profiles with the volunteer store", async () => {
    await request(app).post(`/api/profile/${userId}`).send(baseProfile);

    let volunteer = store.getVolunteer(userId);
    expect(volunteer).toBeTruthy();
    expect(volunteer?.name).toBe("John Doe");
    expect(volunteer?.skills).toContain("JavaScript");
    expect(volunteer?.location).toBe("Houston, TX");

    const updatePayload = {
      ...baseProfile,
      fullName: "Jane Doe",
      skills: ["JavaScript", "Leadership"],
    };

    const updateRes = await request(app).put(`/api/profile/${userId}`).send(updatePayload);
    expect(updateRes.status).toBe(200);

    volunteer = store.getVolunteer(userId);
    expect(volunteer).toBeTruthy();
    expect(volunteer?.name).toBe("Jane Doe");
    expect(volunteer?.skills).toContain("Leadership");
  });
});
