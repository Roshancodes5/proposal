const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const EVENTS_FILE = path.join(__dirname, "events.json");
const ALLOWED_EVENTS = ["page_opened", "yes_clicked", "maybe_clicked"];

function readEvents() {
  try {
    const data = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

function writeEvents(events) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

app.use(express.json({ limit: "2kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/events", (req, res) => {
  const { event, sessionId, timestamp } = req.body || {};

  if (!ALLOWED_EVENTS.includes(event)) {
    return res.status(400).json({ success: false, error: "Unknown event" });
  }
  if (typeof sessionId !== "string" || !/^[a-zA-Z0-9-]{8,64}$/.test(sessionId)) {
    return res.status(400).json({ success: false, error: "Invalid sessionId" });
  }
  const parsed = new Date(timestamp);
  const safeTimestamp = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();

  const events = readEvents();
  events.push({ event, sessionId, timestamp: safeTimestamp });
  writeEvents(events);

  res.json({ success: true });
});

app.get("/api/events", (req, res) => {
  res.json(readEvents());
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => {
  console.log("Proposal server running:");
  console.log("  Proposal: http://localhost:" + PORT);
  console.log("  Admin:    http://localhost:" + PORT + "/admin");
});
