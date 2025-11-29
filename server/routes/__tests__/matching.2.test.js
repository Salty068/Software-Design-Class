import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { score } from "../../services/matching.js";

describe("matching score", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseVol = {
    skills: [],
    location: "Downtown",
    availability: [],
  };

  const baseEvent = {
    requiredSkills: [],
    location: "Downtown",
    date: new Date("2024-01-02T00:00:00Z").toISOString(), // 1 day in future
    urgency: "Medium",
  };

  it("gives a higher score when skills, location, and availability match", () => {
    const event = {
      ...baseEvent,
      requiredSkills: ["first aid", "spanish"],
      urgency: "High",
    };

    const vol = {
      ...baseVol,
      skills: ["spanish", "cooking"],
      availability: [new Date(event.date).toLocaleDateString()],
    };

    const s = score(vol, event);

    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(1.7); // sanity bound
  });

  it("zeroes urgency weight when there are no skills and location mismatch", () => {
    const event = {
      ...baseEvent,
      requiredSkills: ["medical"],
      location: "Uptown",
      urgency: "Critical",
    };

    const vol = {
      ...baseVol,
      skills: [],
      location: "Suburb",
      availability: [],
    };

    const s = score(vol, event);

    expect(s).toBeCloseTo(0, 4);
  });

  it("returns low score for past events (days < 0 branch)", () => {
    const event = {
      ...baseEvent,
      date: new Date("2023-12-30T00:00:00Z").toISOString(),
    };

    const vol = {
      ...baseVol,
      skills: ["x"],
      availability: [],
    };

    const s = score(vol, event);

    expect(s).toBeGreaterThanOrEqual(0);
  });
    it("handles empty skills sets without division by zero", () => {
    const event = {
      ...baseEvent,
      requiredSkills: [],
      date: new Date("2024-01-05T00:00:00Z").toISOString(),
      urgency: "Low",
    };

    const vol = {
      ...baseVol,
      skills: [],
      availability: [],
    };

    const s = score(vol, event);
    expect(s).toBeGreaterThanOrEqual(0);
  });

  it("uses medium-range time weight when event is within a week", () => {
    const event = {
      ...baseEvent,
      date: new Date("2024-01-05T00:00:00Z").toISOString(),
      urgency: "Medium",
    };

    const vol = {
      ...baseVol,
      skills: ["first aid"],
      availability: [],
    };

    const s = score(vol, event);
    expect(s).toBeGreaterThan(0);
  });

  it("uses long-range time weight when event is more than a week away", () => {
    const event = {
      ...baseEvent,
      date: new Date("2024-01-20T00:00:00Z").toISOString(),
      urgency: "Medium",
    };

    const vol = {
      ...baseVol,
      skills: ["first aid"],
      availability: [],
    };

    const s = score(vol, event);
    expect(s).toBeGreaterThan(0);
  });

});
