// server/shared.js
export const EVENT_TITLE_MAX_LENGTH = 80;
export const EVENT_URGENCY_OPTIONS = ["Low", "Medium", "High", "Critical"];
export const PARTICIPATION_STATUSES = [
  "Registered",
  "Confirmed",
  "CheckedIn",
  "NoShow",
  "Cancelled",
  "Completed",
];

let idCounter = 1;

export const generateId = (prefix) => {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
};

export const toUniqueSkills = (skills = []) =>
  [...new Set(skills.map((s) => String(s).trim()).filter(Boolean))];

const isValidISODate = (s) => Number.isFinite(new Date(String(s)).getTime());
const toMidnight = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const ensureEventPayload = (payload = {}) => {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid event payload.");
  }

  const name = String(payload.name ?? "").trim();
  const description = String(payload.description ?? "").trim();
  const location = String(payload.location ?? "").trim();
  const eventDate = String(payload.eventDate ?? "").trim();
  const requiredSkills = Array.isArray(payload.requiredSkills)
    ? payload.requiredSkills
    : [];
  const urgency = String(payload.urgency ?? "Low").trim();

  if (!name || !description || !location || !eventDate || requiredSkills.length === 0) {
    throw new Error("Missing required fields.");
  }
  if (name.length > EVENT_TITLE_MAX_LENGTH) {
    throw new Error(`Event name must be ≤ ${EVENT_TITLE_MAX_LENGTH} characters.`);
  }

  if (!isValidISODate(eventDate)) {
    throw new Error("Invalid event date.");
  }

  const dEvent = toMidnight(new Date(eventDate));
  const dToday = toMidnight(new Date());

  if (dEvent < dToday) {
    throw new Error("Event date cannot be in the past.");
  }

  if (!EVENT_URGENCY_OPTIONS.includes(urgency)) {
    throw new Error(`Invalid urgency: ${urgency}`);
  }

  return {
    name,
    description,
    location,
    requiredSkills: toUniqueSkills(requiredSkills),
    urgency,
    eventDate,
  };
};

export const isParticipationStatus = (value) =>
  PARTICIPATION_STATUSES.includes(value);

export const ensureVolunteerPayload = (payload = {}) => {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid volunteer payload.");
  }

  const volunteerName = String(payload.volunteerName ?? "").trim();
  const assignment = String(payload.assignment ?? "").trim();
  const location = String(payload.location ?? "").trim();
  const eventDate = String(payload.eventDate ?? "").trim();
  const status = String(payload.status ?? "");
  const volunteerId =
    (payload.volunteerId ? String(payload.volunteerId) : "").trim() || generateId("vol");
  const hoursValue = Number(payload.hours);

  if (!volunteerName || !assignment || !location || !eventDate) {
    throw new Error("Missing required fields.");
  }

  if (!isParticipationStatus(status)) {
    throw new Error(`Invalid participation status: ${status}`);
  }

  const hours = Number.isFinite(hoursValue)
    ? Math.max(0, Math.round(hoursValue))
    : 0;

  return {
    volunteerId,
    volunteerName,
    assignment,
    location,
    eventDate,
    status,
    hours,
  };
};
