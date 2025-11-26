import { Router } from "express";
import { PrismaClient } from '@prisma/client';
import { authenticate } from "../routes/middleware/auth.js";
import { generateId } from "../shared.js";
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


const router = Router();



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

// Get assignments for a specific event
router.get("/events/:eventId/assignments", async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: "eventId is required" });
    }

    // Fetch assignments for this event with volunteer details
    const assignments = await prisma.assignment.findMany({
      where: { eventId: eventId },
      include: {
        volunteer: true
      },
      orderBy: { createdAtMs: "desc" }
    });

    // Also fetch volunteer history for this event (self-registered volunteers)
    const volunteerHistory = await prisma.volunteerHistory.findMany({
      where: { 
        eventId: eventId,
        participationStatus: { in: ['registered', 'completed'] }
      },
      include: {
        profile: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Combine assignments and volunteer history
    const allVolunteers = [];

    // Add admin-assigned volunteers
    assignments.forEach(assignment => {
      allVolunteers.push({
        id: `assignment-${assignment.id}`,
        volunteerId: assignment.volunteerId,
        volunteerName: assignment.volunteer?.fullName || 'Unknown Volunteer',
        volunteerEmail: assignment.volunteer?.userId || 'No email',
        assignmentType: 'admin_assigned',
        assignmentDate: new Date(Number(assignment.createdAtMs)).toISOString(),
        status: 'active'
      });
    });

    // Add self-registered volunteers (avoid duplicates)
    volunteerHistory.forEach(history => {
      // Only add if not already in assignments
      const alreadyAssigned = assignments.some(a => a.volunteerId === history.userId);
      if (!alreadyAssigned) {
        allVolunteers.push({
          id: `history-${history.id}`,
          volunteerId: history.userId,
          volunteerName: history.profile?.fullName || 'Unknown Volunteer',
          volunteerEmail: history.profile?.userId || 'No email',
          assignmentType: 'self_registered',
          assignmentDate: history.createdAt.toISOString(),
          status: history.participationStatus === 'completed' ? 'completed' : 'active'
        });
      }
    });

    // Remove any remaining duplicates based on volunteerId (extra safety)
    const uniqueVolunteers = [];
    const seenVolunteerIds = new Set();
    
    allVolunteers.forEach(volunteer => {
      if (!seenVolunteerIds.has(volunteer.volunteerId)) {
        seenVolunteerIds.add(volunteer.volunteerId);
        uniqueVolunteers.push(volunteer);
      }
    });

    const finalVolunteers = uniqueVolunteers;

    res.json({ 
      success: true, 
      data: finalVolunteers,
      count: finalVolunteers.length 
    });
  } catch (error) {
    console.error('Error fetching event assignments:', error);
    res.status(500).json({ error: "Failed to fetch event assignments" });
  }
});

// Debug endpoint to check what data exists
router.get("/debug/assignments", async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      include: { volunteer: true, event: true }
    });
    const volunteerHistory = await prisma.volunteerHistory.findMany({
      include: { profile: true, event: true }
    });
    const events = await prisma.eventDetails.findMany();
    
    res.json({
      assignments: assignments,
      volunteerHistory: volunteerHistory,
      events: events,
      assignmentCount: assignments.length,
      historyCount: volunteerHistory.length,
      eventCount: events.length
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
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
      userId = "", // Add user-specific filtering
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
      const matchesUser = !userId || item.volunteerId === String(userId);
      
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

      return matchesUser && matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
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
    // Handle both Find Events payloads and traditional volunteer history payloads
    let payload = req.body;
    
    // If this looks like a Find Events signup payload, transform it
    if (payload.volunteerId && payload.eventId && !payload.volunteerName) {
      // Get event details to populate the payload
      const event = await prisma.eventDetails.findUnique({
        where: { id: payload.eventId }
      });
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Transform to complete volunteer history payload
      payload = {
        volunteerId: payload.volunteerId,
        volunteerName: payload.volunteerId, // Use ID as name fallback
        assignment: event.eventName,
        location: event.location,
        eventDate: event.eventDate.toISOString().slice(0, 10),
        status: 'Registered', // Normalize status
        hours: 0
      };
    } else if (payload.status) {
      // Normalize status values to proper case
      const statusMap = {
        'registered': 'Registered',
        'confirmed': 'Confirmed',
        'checkedin': 'CheckedIn',
        'noshow': 'NoShow',
        'cancelled': 'Cancelled',
        'completed': 'Completed'
      };
      payload.status = statusMap[payload.status.toLowerCase()] || payload.status;
    }
    
    const history = await addVolunteerHistory(payload);
    handleSuccess(res, history, 201);
  } catch (error) {
    handleError(res, error);
  }
});

// Simple event sign-up endpoint
router.post("/volunteer-history/signup", authenticate, async (req, res) => {
  try {
    const { volunteerId, eventId } = req.body;

    if (!volunteerId || !eventId) {
      return res.status(400).json({ error: "volunteerId and eventId are required" });
    }

    // Check if event exists
    const event = await prisma.eventDetails.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if user is already signed up
    const existingSignup = await prisma.volunteerHistory.findFirst({
      where: {
        userId: volunteerId,
        eventId: eventId
      }
    });

    if (existingSignup) {
      return res.status(400).json({ error: "Already signed up for this event" });
    }

    // Create volunteer history record
    const volunteerHistory = await prisma.volunteerHistory.create({
      data: {
        id: generateId("vol-history"),
        userId: volunteerId,
        eventId: eventId,
        participationStatus: 'Registered',
        hoursVolunteered: 0,
        feedback: JSON.stringify({
          volunteerName: volunteerId,
          assignment: event.eventName,
          location: event.location,
          eventDate: event.eventDate.toISOString().slice(0, 10)
        })
      },
      include: { event: true }
    });

    res.status(201).json({ 
      success: true, 
      message: "Successfully signed up for event",
      data: {
        id: volunteerHistory.id,
        eventId: volunteerHistory.eventId,
        volunteerId: volunteerHistory.userId,
        status: volunteerHistory.participationStatus,
        eventName: event.eventName,
        eventDate: event.eventDate.toISOString().slice(0, 10),
        location: event.location
      }
    });

  } catch (error) {
    console.error('Sign-up error:', error);
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

// Check-in endpoint
router.post("/volunteer-history/checkin", authenticate, async (req, res) => {
  try {
    const { volunteerId, eventId } = req.body;

    if (!volunteerId || !eventId) {
      return res.status(400).json({ error: "volunteerId and eventId are required" });
    }

    // Find the volunteer history record
    const existingHistory = await prisma.volunteerHistory.findFirst({
      where: {
        userId: volunteerId,
        eventId: eventId
      }
    });

    if (!existingHistory) {
      return res.status(404).json({ error: "Volunteer assignment not found" });
    }

    if (existingHistory.participationStatus === 'CheckedIn') {
      return res.status(400).json({ error: "Already checked in to this event" });
    }

    // Update the status to CheckedIn
    const updatedHistory = await prisma.volunteerHistory.update({
      where: { id: existingHistory.id },
      data: { 
        participationStatus: 'CheckedIn',
        updatedAt: new Date()
      }
    });

    res.status(200).json({ 
      success: true, 
      message: "Successfully checked in",
      data: updatedHistory 
    });

  } catch (error) {
    console.error('Check-in error:', error);
    handleError(res, error);
  }
});

// Cancel assignment endpoint
router.post("/volunteer-history/cancel", authenticate, async (req, res) => {
  try {
    const { volunteerId, eventId } = req.body;

    if (!volunteerId || !eventId) {
      return res.status(400).json({ error: "volunteerId and eventId are required" });
    }

    // Debug: Check what records exist for this user
    const allUserRecords = await prisma.volunteerHistory.findMany({
      where: { userId: volunteerId }
    });
    console.log('All records for user:', volunteerId, allUserRecords);

    // Find the volunteer history record
    const existingHistory = await prisma.volunteerHistory.findFirst({
      where: {
        userId: volunteerId,
        eventId: eventId
      }
    });
    
    console.log('Searching for volunteerId:', volunteerId, 'eventId:', eventId);
    console.log('Found record:', existingHistory);

    if (!existingHistory) {
      return res.status(404).json({ error: "Volunteer assignment not found" });
    }

    if (existingHistory.participationStatus === 'Cancelled') {
      return res.status(400).json({ error: "Assignment already cancelled" });
    }

    if (existingHistory.participationStatus === 'Completed') {
      return res.status(400).json({ error: "Cannot cancel a completed event" });
    }

    // Update the status to Cancelled
    const updatedHistory = await prisma.volunteerHistory.update({
      where: { id: existingHistory.id },
      data: { 
        participationStatus: 'Cancelled',
        updatedAt: new Date()
      }
    });

    res.status(200).json({ 
      success: true, 
      message: "Assignment cancelled successfully",
      data: updatedHistory 
    });

  } catch (error) {
    console.error('Cancel assignment error:', error);
    handleError(res, error);
  }
});

export default router;
