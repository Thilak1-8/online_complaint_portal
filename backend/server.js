const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cron = require("node-cron");
const axios = require("axios");

// Run every day at midnight


// Load .env at the very top
dotenv.config();

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const adminActions = require("./routes/adminActions");
const escalationRoutes = require("./routes/escalationRoutes");
const notificationsRouter = require("./routes/user");






const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/complaints", complaintRoutes);
app.use("/admin", require("./routes/admin"));
app.use("/admin/actions", adminActions);
app.use("/api", escalationRoutes);
app.use("/user", notificationsRouter);



cron.schedule("0 0 * * *", async () => {
  try {
    await axios.get("http://localhost:5000/api/auto-escalate");
    console.log("Auto-escalation job executed.");
  } catch (error) {
    console.error("Auto-escalation job failed:", error);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
