// server/routes/tests/notifications.sse.test.js
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { buildApp } from "../../server.js";
import { store } from "../../store.memory.js";
import { notify } from "../../services/notifications.js";

let app;
beforeAll(async () => { app = await buildApp(); });

it("SSE returns backlog then live event", async () => {
  const v = store.listVolunteers()[0];
  notify(v.id, { title: "Backlog A" });

  await new Promise((resolve, reject) => {
    const req = request(app)
      .get(`/api/notifications/stream/${v.id}`)
      .buffer(true)
      .parse((res, _cb) => {
        let buf = "";
        res.on("data", (chunk) => {
          buf += chunk.toString();

          // when backlog seen, trigger a live event
          if (buf.includes("Backlog A") && !buf.includes("Live B")) {
            notify(v.id, { title: "Live B" });
          }

          // once we see the live event, assert and abort the stream
          if (buf.includes("Live B")) {
            try {
              expect(buf).toContain("Backlog A");
              expect(buf).toContain("Live B");
              req.abort();    // <— important: close the long-lived SSE
              resolve(null);
            } catch (e) {
              req.abort();
              reject(e);
            }
          }
        });
        res.on("error", reject);
      });

    // kick off the request
    req.end(() => {});
  });
}, 15000); // allow extra time for the stream
