import { describe, it, expect } from "vitest";
import { createEvent, updateEvent, deleteEvent, resetEvents, listEvents } from "../../api/test.js";

describe("api/test internals", () => {
  it("update/delete throw on unknown id", () => {
    const payload = { name:"n", description:"d", location:"l", eventDate:"2099-01-01", requiredSkills:["A"] };
    expect(() => updateEvent("__nope__", payload)).toThrow();  // 29–49, 52–55
    expect(() => deleteEvent("__nope__")).toThrow();
  });

  it("resetEvents normalizes skills and copies", () => {
    resetEvents([{ id:"e1", name:"N", description:"D", location:"L", eventDate:"2099-01-01", requiredSkills:["A","A","B"], urgency:"High" }]); // 59–65
    const [ev] = listEvents();
    expect(ev.requiredSkills).toEqual(["A","B"]);
  });

  it("createEvent returns independent copy", () => {
    const ev = createEvent({ name:"X", description:"D", location:"L", eventDate:"2099-01-01", requiredSkills:["Q"] });
    ev.requiredSkills.push("Z");
    const storeCopy = listEvents().find(e => e.id === ev.id);
    expect(storeCopy.requiredSkills).toEqual(["Q"]);
  });
});
