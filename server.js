
const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const ALLOWED_ORIGIN = "https://diazzaydon3-jpg.github.io";

// Trust one proxy hop only if it matches your Render deployment.
app.set("trust proxy", 1);

app.use(express.json({ limit: "2kb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.get("/", (req, res) => {
  res.send("Chaos Zone server is online.");
});

app.post("/log-my-ip", async (req, res) => {
  // Require explicit consent from the visitor.
  if (req.body?.consent !== true) {
    return res.status(400).json({
      error: "Please accept the IP logging notice first."
    });
  }

  if (!WEBHOOK_URL) {
    return res.status(503).json({
      error: "Discord webhook is not configured."
    });
  }

  let webhook;

  try {
    webhook = new URL(WEBHOOK_URL);

    if (
      webhook.protocol !== "https:" ||
      !["discord.com", "discordapp.com"].includes(
        webhook.hostname
      ) ||
      !webhook.pathname.includes("/api/webhooks/")
    ) {
      throw new Error("Invalid webhook URL");
    }
  } catch {
    return res.status(500).json({
      error: "Discord webhook configuration is invalid."
    });
  }

  // Express determines the client address using the configured proxy.
  const ip = req.ip;

  if (!ip) {
    return res.status(400).json({
      error: "Could not determine the visitor address."
    });
  }

  const timestamp = new Date().toISOString();

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content:
          "**Chaos Zone — Consent-Based IP Log**\n" +
          "The visitor accepted the IP logging notice.\n" +
          "Address reported by the server: `" + ip + "`\n" +
          "Time (UTC): " + timestamp
      })
    });

    if (!response.ok) {
      console.error(
        "Discord webhook failed with status:",
        response.status
      );

      return res.status(502).json({
        error: "Discord notification failed."
      });
    }

    console.log("Consent-based IP log sent at", timestamp);

    return res.json({
      success: true,
      message: "Your request was processed."
    });
  } catch (error) {
    console.error("Discord request failed:", error.message);

    return res.status(502).json({
      error: "Could not send Discord notification."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Chaos Zone server listening on port " + PORT);
});
