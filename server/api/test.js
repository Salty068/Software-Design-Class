import {
  EVENT_URGENCY_OPTIONS,
  PARTICIPATION_STATUSES,
  ensureEventPayload,
  ensureVolunteerPayload,
  generateId,
} from "../shared.js";

// replace later
const eventsStore = [
  {
    id: "event1",
    name: "event1",
    description: "event1a.",
    location: "houston",
    requiredSkills: ["Teamwork", "Lifting"],
    urgency: "Medium",
    eventDate: "2025-10-01",
  },
];

export const listEvents = () =>
  eventsStore.map((event) => ({
    ...event,
    requiredSkills: [...event.requiredSkills],
  }));

export const createEvent = (payload) => {
  const safePayload = ensureEventPayload(payload);
  const event = {
    id: generateId("event"),
    ...safePayload,
  };
  eventsStore.unshift(event);
  return { ...event, requiredSkills: [...event.requiredSkills] };
};

export const updateEvent = (id, payload) => {
  const safePayload = ensureEventPayload(payload);
  const index = eventsStore.findIndex((event) => event.id === id);
  if (index === -1) throw new Error(`Event with id "${id}" not found.`);
  const updated = { id, ...safePayload };
  eventsStore[index] = updated;
  return { ...updated, requiredSkills: [...updated.requiredSkills] };
};

export const deleteEvent = (id) => {
  const index = eventsStore.findIndex((event) => event.id === id);
  if (index === -1) throw new Error(`Event with id "${id}" not found.`);
  eventsStore.splice(index, 1);
};

export const resetEvents = (seed = []) => {
  eventsStore.splice(
    0,
    eventsStore.length,
    ...seed.map((event) => ({
      ...event,
      requiredSkills: Array.isArray(event.requiredSkills)
        ? [...event.requiredSkills]
        : [],
    })),
  );
};

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
  const sourceEvents = eventsStore.length > 0 ? eventsStore : [defaultVolunteerEvent];

  return VOLUNTEER_NAMES.map((name, index) => {
    const event = sourceEvents[index % sourceEvents.length];
    return {
      id: `vol-history-seed-${index + 1}`,
      volunteerId: `vol-${(index + 1).toString().padStart(3, "0")}`,
      volunteerName: name,
      assignment: event.name,
      location: event.location,
      eventDate: event.eventDate,
      status: PARTICIPATION_STATUSES[index % PARTICIPATION_STATUSES.length],
      hours: 8 + (index % 5) * 4,
    };
  });
};

// replace with database
const volunteerHistoryStore = createVolunteerSeed();

const cloneVolunteerItem = (item) => ({
  ...item,
});

export const listVolunteerHistory = () =>
  volunteerHistoryStore.map(cloneVolunteerItem);

export const addVolunteerHistory = (payload) => {
  const safePayload = ensureVolunteerPayload(payload);
  const entry = {
    id: generateId("vol-history"),
    ...safePayload,
  };
  volunteerHistoryStore.unshift(entry);
  return cloneVolunteerItem(entry);
};

export { EVENT_URGENCY_OPTIONS, PARTICIPATION_STATUSES };

export const resetVolunteerHistory = (seed = []) => {
  volunteerHistoryStore.splice(
    0,
    volunteerHistoryStore.length,
    ...seed.map(cloneVolunteerItem),
  );
};
