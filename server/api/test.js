import {
  EVENT_URGENCY_OPTIONS,
  PARTICIPATION_STATUSES,
  ensureEventPayload,
  ensureVolunteerPayload,
  generateId,
} from "../shared.js";
import { store } from "../store.memory.js";

export const listEvents = () =>
  store.listEvents().map(e => ({ ...e, eventDate: e.date })); // expose eventDate to API clients

export const createEvent = (payload) => {
  const safe = ensureEventPayload(payload);
  const event = {
    id: generateId("event"),
    name: safe.name,
    description: safe.description,
    location: safe.location,
    requiredSkills: safe.requiredSkills,
    urgency: safe.urgency,
    date: safe.eventDate,            // store expects `date`
  };
  store.upsertEvents([...store.listEvents(), event]);
  return { ...event, eventDate: event.date };
};

export const updateEvent = (id, payload) => {
  const safe = ensureEventPayload(payload);
  const updated = (ev) =>
    ev.id === id
      ? {
          ...ev,
          name: safe.name,
          description: safe.description,
          location: safe.location,
          requiredSkills: safe.requiredSkills,
          urgency: safe.urgency,
          date: safe.eventDate,
        }
      : ev;

  const next = store.listEvents().map(updated);
  const before = next.find(e => e.id === id);
  if (!before) throw new Error(`Event with id "${id}" not found.`);
  store.upsertEvents(next);
  const out = next.find(e => e.id === id);
  return { ...out, eventDate: out.date };
};

export const deleteEvent = (id) => {
  const next = store.listEvents().filter(e => e.id !== id);
  if (next.length === store.listEvents().length) throw new Error(`Event with id "${id}" not found.`);
  store.upsertEvents(next);
};

export const resetEvents = (seed = []) => {
  const normalized = seed.map(e => ({
    id: e.id ?? generateId("event"),
    name: String(e.name ?? "").trim(),
    description: String(e.description ?? "").trim(),
    location: String(e.location ?? "").trim(),
    requiredSkills: Array.isArray(e.requiredSkills) ? [...new Set(e.requiredSkills)] : [],
    urgency: EVENT_URGENCY_OPTIONS.includes(e.urgency) ? e.urgency : "Low",
    date: String(e.eventDate ?? e.date ?? "").trim(),    // accept either
  }));
  store.upsertEvents(normalized);
};

// ---- Volunteer history (kept local for now) ----
const VOLUNTEER_NAMES = ["Jordan Smith", "Alex Johnson"];
const defaultVolunteerEvent = {
  id: "event-default",
  name: "event1",
  description: "event1-description",
  location: "h",
  requiredSkills: [],
  urgency: "Low",
  eventDate: "2025-01-01",
};

const createVolunteerSeed = () => {
  const sourceEvents = listEvents().length ? listEvents() : [defaultVolunteerEvent];
  return VOLUNTEER_NAMES.map((name, i) => {
    const event = sourceEvents[i % sourceEvents.length];
    return {
      id: `vol-history-seed-${i + 1}`,
      volunteerId: `vol-${String(i + 1).padStart(3, "0")}`,
      volunteerName: name,
      assignment: event.name,
      location: event.location,
      eventDate: event.eventDate,
      status: PARTICIPATION_STATUSES[i % PARTICIPATION_STATUSES.length],
      hours: 8 + (i % 5) * 4,
    };
  });
};

const volunteerHistoryStore = createVolunteerSeed();
const clone = (x) => ({ ...x });

export const listVolunteerHistory = () => volunteerHistoryStore.map(clone);

export const addVolunteerHistory = (payload) => {
  const safe = ensureVolunteerPayload(payload);
  const entry = { id: generateId("vol-history"), ...safe };
  volunteerHistoryStore.unshift(entry);
  return clone(entry);
};

export { EVENT_URGENCY_OPTIONS, PARTICIPATION_STATUSES };

export const resetVolunteerHistory = (seed = []) => {
  volunteerHistoryStore.splice(0, volunteerHistoryStore.length, ...seed.map(clone));
};
