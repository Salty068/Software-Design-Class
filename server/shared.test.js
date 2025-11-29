import {
  EVENT_TITLE_MAX_LENGTH,
  ensureEventPayload,
  ensureVolunteerPayload,
  isParticipationStatus,
  toUniqueSkills,
  generateId,
} from "./shared.js";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("shared utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("generateId returns unique prefixed ids", () => {
    const id1 = generateId("test");
    const id2 = generateId("test");

    expect(id1).not.toBe(id2);
    expect(id1.startsWith("test-")).toBe(true);
    expect(id2.startsWith("test-")).toBe(true);
  });

  it("toUniqueSkills trims, filters, and deduplicates skills", () => {
    const result = toUniqueSkills([" js ", "JS", "", "ts", "js"]);
    // "js" (trimmed) appears once, "JS" is distinct, empty string is removed
    expect(result).toEqual(["js", "JS", "ts"]);
  });

  it("ensureEventPayload returns normalized event for valid payload", () => {
    const future = new Date("2024-01-10T00:00:00Z");
    const iso = future.toISOString().slice(0, 10);

    const payload = {
      name: "Test Event",
      description: "Some description",
      location: "Downtown",
      eventDate: iso,
      requiredSkills: ["a", "a", "b"],
      urgency: "High",
    };

    const out = ensureEventPayload(payload);

    expect(out.name).toBe("Test Event");
    expect(out.requiredSkills).toEqual(["a", "b"]);
    expect(out.urgency).toBe("High");
    expect(out.eventDate).toBe(iso);
  });

  it("ensureEventPayload throws when event date is in the past", () => {
    const past = new Date("2023-12-31T00:00:00Z")
      .toISOString()
      .slice(0, 10);

    expect(() =>
      ensureEventPayload({
        name: "Past Event",
        description: "Desc",
        location: "Loc",
        eventDate: past,
        requiredSkills: ["a"],
      }),
    ).toThrow("Event date cannot be in the past.");
  });

  it("ensureEventPayload throws when urgency is invalid", () => {
    const future = new Date("2024-01-10T00:00:00Z")
      .toISOString()
      .slice(0, 10);

    expect(() =>
      ensureEventPayload({
        name: "Bad Urgency",
        description: "Desc",
        location: "Loc",
        eventDate: future,
        requiredSkills: ["a"],
        urgency: "Ultra",
      }),
    ).toThrow("Invalid urgency: Ultra");
  });

  it("ensureEventPayload throws when name is too long", () => {
    const future = new Date("2024-01-10T00:00:00Z")
      .toISOString()
      .slice(0, 10);

    const longName = "x".repeat(EVENT_TITLE_MAX_LENGTH + 1);

    expect(() =>
      ensureEventPayload({
        name: longName,
        description: "Desc",
        location: "Loc",
        eventDate: future,
        requiredSkills: ["a"],
        urgency: "Low",
      }),
    ).toThrow(`Event name must be ≤ ${EVENT_TITLE_MAX_LENGTH} characters.`);
  });

  it("isParticipationStatus correctly validates statuses", () => {
    expect(isParticipationStatus("Registered")).toBe(true);
    expect(isParticipationStatus("Completed")).toBe(true);
    expect(isParticipationStatus("NotAStatus")).toBe(false);
  });

  it("ensureVolunteerPayload generates id and rounds hours", () => {
    const result = ensureVolunteerPayload({
      volunteerName: "Alice",
      assignment: "Park Cleanup",
      location: "Downtown",
      eventDate: "2024-01-10",
      status: "Registered",
      hours: 2.7,
    });

    expect(result.volunteerId.startsWith("vol-")).toBe(true);
    expect(result.volunteerName).toBe("Alice");
    expect(result.hours).toBe(3); // rounded
  });

  it("ensureVolunteerPayload throws for invalid status", () => {
    expect(() =>
      ensureVolunteerPayload({
        volunteerName: "Bob",
        assignment: "Food Drive",
        location: "Uptown",
        eventDate: "2024-01-10",
        status: "Wrong",
      }),
    ).toThrow("Invalid participation status: Wrong");
  });

  it("ensureVolunteerPayload throws for missing required fields", () => {
    expect(() =>
      ensureVolunteerPayload({
        volunteerName: "",
        assignment: "",
        location: "",
        eventDate: "",
        status: "Registered",
      }),
    ).toThrow("Missing required fields.");
  });

  it("ensureVolunteerPayload defaults hours to 0 when hours is not a number", () => {
    const result = ensureVolunteerPayload({
      volunteerName: "Eve",
      assignment: "Library Help",
      location: "Central",
      eventDate: "2024-01-10",
      status: "Registered",
      hours: "not-a-number",
    });

    expect(result.hours).toBe(0);
  });
    it("ensureEventPayload throws if payload is not an object", () => {
    expect(() => ensureEventPayload(null)).toThrow("Invalid event payload.");
    expect(() => ensureEventPayload("bad")).toThrow("Invalid event payload.");
  });

  it("ensureVolunteerPayload respects provided volunteerId", () => {
    const result = ensureVolunteerPayload({
      volunteerId: "user-123",
      volunteerName: "Frank",
      assignment: "Clinic Help",
      location: "Midtown",
      eventDate: "2024-01-10",
      status: "Registered",
      hours: 4,
    });

    expect(result.volunteerId).toBe("user-123");
    expect(result.hours).toBe(4);
  });

});
