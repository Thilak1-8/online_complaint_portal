const express = require("express");
const db = require("../db"); // mysql2/promise
const router = express.Router();

// Get notifications for a user
router.get("/notifications/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const [notifications] = await db.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json(notifications || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Optional: mark notification as read
router.put("/notifications/:id/read", async (req, res) => {
  const notificationId = req.params.id;

  try {
    await db.query("UPDATE notifications SET read_status = 1 WHERE id = ?", [notificationId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating notification" });
  }
});

module.exports = router;
