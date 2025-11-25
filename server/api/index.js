import { Router } from "express";
import { PrismaClient } from '@prisma/client';
import {
  createEvent,
  deleteEvent,
  listEvents,
  resetEvents,
  updateEvent,
} from "./events.prisma.js";
import {
  addVolunteerHistory,
  listVolunteerHistory,
  resetVolunteerHistory,
} from "./volunteerHistory.prisma.js";

const prisma = new PrismaClient();

// 🔒 Import the authentication middleware
import { auth } from "../routes/middleware/authenticate.js";

const router = Router();

// 🔒 Protect ALL routes in this router
//router.use(auth);

const handleSuccess = (res, data, status = 200) => {
  res.status(status).json({ data });
};

const handleError = (res, error) => {
  if (error instanceof Error) {
    return res.status(400).json({ error: error.message });
  }
  return res.status(500).json({ error: "Unexpected server error." });
};

router.get("/events", async (_req, res) => {
  try {
    const events = await listEvents();
    handleSuccess(res, events);
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/events", async (req, res) => {
  try {
    const event = await createEvent(req.body);
    handleSuccess(res, event, 201);
  } catch (error) {
    handleError(res, error);
  }
});

router.put("/events/:id", async (req, res) => {
  try {
    const event = await updateEvent(req.params.id, req.body);
    handleSuccess(res, event);
  } catch (error) {
    handleError(res, error);
  }
});

router.delete("/events/:id", async (req, res) => {
  try {
    await deleteEvent(req.params.id);
    res.status(204).end();
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/events/reset", async (req, res) => {
  try {
    const seed = Array.isArray(req.body) ? req.body : [];
    await resetEvents(seed);
    res.status(204).end();
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/assignments", async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Fetch assignments for this user with event details
    const assignments = await prisma.assignment.findMany({
      where: { volunteerId: userId },
      include: {
        event: true
      },
      orderBy: { createdAtMs: "desc" }
    });

    const transformedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      eventId: assignment.eventId,
      eventName: assignment.event?.eventName || 'Event',
      eventDescription: assignment.event?.description || '',
      location: assignment.event?.location || 'TBD',
      eventDate: assignment.event?.eventDate,
      requiredSkills: assignment.event?.requiredSkills || [],
      urgency: assignment.event?.urgency || 'Medium',
      createdAt: new Date(Number(assignment.createdAtMs)).toISOString()
    }));

    res.json({ 
      success: true, 
      data: transformedAssignments,
      count: transformedAssignments.length 
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

router.get("/volunteer-history", async (req, res) => {
  try {
    const {
      page = "1",
      pageSize = "10",
      sortKey = "eventDate",
      sortDir = "desc",
      search = "",
      status = "",
      dateFrom = "",
      dateTo = "",
    } = req.query;

    const all = await listVolunteerHistory();
    const term = String(search).trim().toLowerCase();
    const statusFilters = String(status)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const dateFromValue = dateFrom ? new Date(String(dateFrom)) : null;
    const dateToValue = dateTo ? new Date(String(dateTo)) : null;

    const filtered = all.filter((item) => {
      const matchesSearch =
        !term ||
        item.volunteerName.toLowerCase().includes(term) ||
        item.assignment.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term);

      const matchesStatus =
        statusFilters.length === 0 || statusFilters.includes(item.status);

      const eventDate = new Date(item.eventDate);
      const matchesDateFrom = !dateFromValue || eventDate >= dateFromValue;
      const matchesDateTo = !dateToValue || eventDate <= dateToValue;

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    const dir = String(sortDir).toLowerCase() === "asc" ? 1 : -1;
    const key = String(sortKey);

    const sorted = [...filtered].sort((a, b) => {
      if (key === "eventDate") {
        return (new Date(a.eventDate) - new Date(b.eventDate)) * dir;
      }
      if (key === "volunteerName") {
        return a.volunteerName.localeCompare(b.volunteerName) * dir;
      }
      if (key === "assignment") {
        return a.assignment.localeCompare(b.assignment) * dir;
      }
      if (key === "status") {
        return a.status.localeCompare(b.status) * dir;
      }
      return 0;
    });

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNumber = Math.max(1, Math.min(parseInt(pageSize, 10) || 10, 100));
    const start = (pageNumber - 1) * pageSizeNumber;

    const items = sorted.slice(start, start + pageSizeNumber);
    const total = filtered.length;

    handleSuccess(res, { items, total });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/volunteer-history", async (req, res) => {
  try {
    const history = await addVolunteerHistory(req.body);
    handleSuccess(res, history, 201);
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/volunteer-history/reset", async (req, res) => {
  try {
    const seed = Array.isArray(req.body) ? req.body : [];
    await resetVolunteerHistory(seed);
    res.status(204).end();
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
