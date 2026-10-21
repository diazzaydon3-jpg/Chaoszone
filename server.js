
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2kb" }));

app.get("/", (req, res) => {
  res.send("Chaos Zone server is online.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
