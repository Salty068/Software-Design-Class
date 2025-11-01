import { EventEmitter } from "events";
import { PrismaClient } from "@prisma/client";

export const bus = new EventEmitter();

let __prisma;
export function getPrisma() {
  if (!__prisma) __prisma = new PrismaClient();
  return __prisma;
}

const toMillis = (v) => (typeof v === "bigint" ? Number(v) : v);
const serialize = (n) => ({
  id: n.id,
  volunteerId: n.volunteerId,
  title: n.title,
  body: n.body ?? null,
  type: n.type,
  createdAtMs: toMillis(n.createdAtMs),
});



export async function notify(volunteerId, { title, body, type = "info" }) {
  const prisma = getPrisma();
  const created = await prisma.notice.create({
    data: { volunteerId, title, body, type },
  });
  const payload = serialize(created);
  bus.emit(`notice:${volunteerId}`, payload);
  return payload;
}

export function startReminders() {
  const prisma = getPrisma();

  const TICK_MS = 60_000;
  const WINDOW_MS = 24 * 3600 * 1000;
  const DEDUP_MS = 25 * 3600 * 1000;

  const tick = async () => {
    const now = Date.now();
    const soon = new Date(now + WINDOW_MS);

    try {
      const assigns = await prisma.assignment.findMany({
        where: { event: { eventDate: { gt: new Date(now), lte: soon } } },
        include: { event: true },
      });

      for (const a of assigns) {
        const ev = a.event;
        if (!ev) continue;

        const title = `Reminder: ${ev.eventName} tomorrow`;
        const body = `${ev.location} • ${new Date(ev.eventDate).toISOString()}`;

        const recent = await prisma.notice.findFirst({
          where: {
            volunteerId: a.volunteerId,
            title,
            createdAtMs: { gte: BigInt(Math.floor(now - DEDUP_MS)) },
          },
          select: { id: true },
        });
        if (recent) continue;

        await notify(a.volunteerId, { title, body, type: "warn" });
      }
    } catch {

    }
  };

  tick();
  return setInterval(tick, TICK_MS);
}
