// server/routes/reports.js (ESM, improved layout)

import express from "express";
import prisma from "../db.js";
import PDFDocument from "pdfkit";
import { stringify } from "csv-stringify/sync";

const router = express.Router();


async function buildVolunteerParticipationRows() {
  const profiles = await prisma.userProfile.findMany({
    include: {
      volunteerHistory: {
        include: { event: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const rows = [];

  profiles.forEach((profile) => {
    if (profile.volunteerHistory.length === 0) {
      rows.push({
        volunteerId: profile.userId,
        fullName: profile.fullName,
        eventName: "-",
        eventDate: "-",
        participationStatus: "-",
        hoursVolunteered: "-",
      });
    } else {
      profile.volunteerHistory.forEach((h) => {
        rows.push({
          volunteerId: profile.userId,
          fullName: profile.fullName,
          eventName: h.event.eventName,
          eventDate: h.event.eventDate.toISOString().slice(0, 10),
          participationStatus: h.participationStatus,
          hoursVolunteered:
            typeof h.hoursVolunteered === "number"
              ? h.hoursVolunteered.toString()
              : "-",
        });
      });
    }
  });

  return rows;
}

async function buildEventAssignmentRows() {
  const events = await prisma.eventDetails.findMany({
    include: {
      Assignment: {
        include: {
          volunteer: true,
        },
      },
    },
    orderBy: { eventDate: "desc" },
  });

  const rows = [];

  events.forEach((event) => {
    if (event.Assignment.length === 0) {
      rows.push({
        eventId: event.id,
        eventName: event.eventName,
        eventDate: event.eventDate.toISOString().slice(0, 10),
        location: event.location,
        volunteerId: "-",
        volunteerName: "-",
      });
    } else {
      event.Assignment.forEach((a) => {
        rows.push({
          eventId: event.id,
          eventName: event.eventName,
          eventDate: event.eventDate.toISOString().slice(0, 10),
          location: event.location,
          volunteerId: a.volunteer.userId,
          volunteerName: a.volunteer.fullName,
        });
      });
    }
  });

  return rows;
}

function sendCSV(res, rows, filename) {
  if (!rows.length) return res.status(204).end();

  const header = Object.keys(rows[0]);
  const data = rows.map((row) => header.map((h) => row[h] ?? "-"));

  const csv = stringify([header, ...data]);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.csv"`
  );
  res.send(csv);
}

function sendTabularPDF(res, title, filename, rows, columns) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.pdf"`
  );

  doc.pipe(res);

  // Title
  doc.font("Helvetica-Bold").fontSize(20).text(title, {
    underline: true,
  });
  doc.moveDown(1);

  const { left, right, top, bottom } = doc.page.margins;
  const pageWidth = doc.page.width;
  const tableTop = doc.y + 10;

  // Precompute column X positions from widths
  const colX = [];
  let x = left;
  columns.forEach((col) => {
    colX.push(x);
    x += col.width;
  });

  const tableWidth = x - left;
  const maxWidth = pageWidth - left - right;
  if (tableWidth > maxWidth) {
    // If we ever overflow, you can tweak widths; for now assume we stay within A4 width.
  }

  function drawHeader() {
    doc.font("Helvetica-Bold").fontSize(11);
    let headerY = doc.y;

    columns.forEach((col, idx) => {
      doc.text(col.label, colX[idx], headerY, {
        width: col.width,
        align: col.align || "left",
      });
    });

    doc.moveTo(left, headerY + 16)
      .lineTo(left + tableWidth, headerY + 16)
      .lineWidth(0.8)
      .stroke();

    doc.y = headerY + 22;
  }

  function newPageWithHeader() {
    drawHeader();
    doc.font("Helvetica").fontSize(10);
  }

  // Start table
  doc.y = tableTop;
  newPageWithHeader();

  rows.forEach((row, index) => {
    // page break
    if (doc.y > doc.page.height - bottom - 24) {
      doc.addPage();
      doc.y = top;
      newPageWithHeader();
    }

    const rowY = doc.y;

    columns.forEach((col, idx) => {
      const value = row[col.key] == null ? "-" : String(row[col.key]);
      doc.text(value, colX[idx], rowY, {
        width: col.width,
        align: col.align || "left",
      });
    });

    doc.y = rowY + 16;

    // row separator
    if (index !== rows.length - 1) {
      doc.moveTo(left, doc.y)
        .lineTo(left + tableWidth, doc.y)
        .lineWidth(0.3)
        .stroke();
      doc.y += 4;
    }
  });

  doc.end();
}


router.get("/volunteers/csv", async (req, res, next) => {
  try {
    const rows = await buildVolunteerParticipationRows();

    const header = [
      "volunteerId",
      "fullName",
      "eventName",
      "eventDate",
      "participationStatus",
      "hoursVolunteered",
    ];

    const data = rows.map((row) => header.map((h) => row[h] ?? "-"));
    const csv = stringify([header, ...data]);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="volunteer_participation.csv"'
    );
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

router.get("/volunteers/pdf", async (req, res, next) => {
  try {
    const rows = await buildVolunteerParticipationRows();

    const columns = [
      { key: "fullName", label: "Volunteer", width: 170 },
      { key: "eventName", label: "Event", width: 170 },
      { key: "eventDate", label: "Date", width: 80 },
      { key: "participationStatus", label: "Status", width: 70 },
      { key: "hoursVolunteered", label: "Hours", width: 50 },
    ];

    return sendTabularPDF(
      res,
      "Volunteer Participation Report",
      "volunteer_participation",
      rows,
      columns
    );
  } catch (err) {
    next(err);
  }
});

router.get("/events/csv", async (req, res, next) => {
  try {
    const rows = await buildEventAssignmentRows();
    return sendCSV(res, rows, "event_assignments");
  } catch (err) {
    next(err);
  }
});

router.get("/events/pdf", async (req, res, next) => {
  try {
    const rows = await buildEventAssignmentRows();

    const columns = [
      { key: "eventName", label: "Event", width: 170 },
      { key: "eventDate", label: "Date", width: 80 },
      { key: "location", label: "Location", width: 140 },
      { key: "volunteerName", label: "Volunteer", width: 140 },
      { key: "volunteerId", label: "ID", width: 60 },
    ];

    return sendTabularPDF(
      res,
      "Event Assignment Report",
      "event_assignments",
      rows,
      columns
    );
  } catch (err) {
    next(err);
  }
});

export default router;
