
const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Trust Render's proxy only when configured for your deployment.
// Do not trust arbitrary forwarded headers from untrusted clients.
app.set("trust proxy", 1);

app.use(express.json({ limit: "2kb" }));

const ALLOWED_ORIGIN = "https://diazzaydon3-jpg.github.io";

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
  if (req.body?.consent !== true) {
    return res.status(400).json({
      error: "Explicit consent is required."
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
      !["discord.com", "discordapp.com"].includes(webhook.hostname) ||
      !webhook.pathname.includes("/api/webhooks/")
    ) {
      throw new Error("Invalid webhook URL");
    }
  } catch {
    return res.status(500).json({
      error: "Webhook configuration is invalid."
    });
  }

  // IP as determined by Express and the configured proxy.
  const ip = req.ip || "unknown";
  const timestamp = new Date().toISOString();

  try {
    const discordResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content:
          "A visitor requested IP logging after accepting the notice.\n" +
          "IP: " + ip + "\n" +
          "Time: " + timestamp
      })
    });

    if (!discordResponse.ok) {
      console.error("Discord webhook failed:", discordResponse.status);
      return res.status(502).json({
        error: "Discord notification failed."
      });
    }

    console.log("Visitor-requested IP log sent at", timestamp);

    return res.json({ success: true });
  } catch (error) {
    console.error("Discord request failed:", error.message);
    return res.status(502).json({
      error: "Could not send Discord notification."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Chaos Zone server listening on port ${PORT}`);
});
