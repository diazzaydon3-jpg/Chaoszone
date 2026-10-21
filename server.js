
const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Change this if your published GitHub Pages URL differs.
const ALLOWED_ORIGIN = "https://diazzaydon3-jpg.github.io";

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: "2kb" }));

app.get("/", (req, res) => {
  res.send("Chaos Zone server is online.");
});

app.post("/log-my-ip", async (req, res) => {
  if (req.body?.consent !== true) {
    return res.status(400).json({ error: "Consent is required." });
  }

  if (!WEBHOOK_URL) {
    return res.status(503).json({ error: "Logging is not configured." });
  }

  // Accept only Discord webhook URLs.
  let webhook;
  try {
    webhook = new URL(WEBHOOK_URL);
    if (
      webhook.protocol !== "https:" ||
      !["discord.com", "discordapp.com"].includes(webhook.hostname) ||
      !webhook.pathname.includes("/api/webhooks/")
    ) {
      throw new Error("Invalid webhook URL");
    }
  } catch {
    return res.status(500).json({ error: "Webhook configuration is invalid." });
  }

  // This endpoint is intended for a visitor who deliberately
  // chooses to submit their own IP after reading the notice.
  const ip = req.ip || "unknown";

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `A visitor voluntarily requested IP logging.\nIP: ${ip}\nTime: ${new Date().toISOString()}`
      })
    });

    if (!response.ok) {
      console.error("Discord webhook returned status", response.status);
      return res.status(502).json({ error: "Discord notification failed." });
    }

    return res.json({ success: true });
  } catch {
    console.error("Discord notification failed.");
    return res.status(502).json({ error: "Could not contact Discord." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Chaos Zone server listening on ${PORT}`);
});
