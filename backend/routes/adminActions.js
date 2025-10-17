const express = require("express");
const router = express.Router();
const db = require("../db"); // promise-based mysql2

// Assign complaint to staff
router.post("/assign/:id", async (req, res) => {
  const { id } = req.params;
  const { assigned_to } = req.body;

  try {
    await db.query(
      "INSERT INTO complaint_assignments (complaint_id, assigned_to) VALUES (?, ?)",
      [id, assigned_to]
    );
    res.json({ message: "Complaint assigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

// Add internal note
router.post("/:id/note", async (req, res) => {
  const { id } = req.params;
  const { admin_id, note } = req.body;

  try {
    await db.query(
      "INSERT INTO internal_notes (complaint_id, admin_id, note) VALUES (?, ?, ?)",
      [id, admin_id, note]
    );
    res.json({ message: "Internal note added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

// Add public reply to user
router.post("/:id/reply", async (req, res) => {
  const { id } = req.params;
  const { admin_id, reply } = req.body;

  try {
    await db.query(
      "INSERT INTO public_replies (complaint_id, admin_id, reply) VALUES (?, ?, ?)",
      [id, admin_id, reply]
    );
    res.json({ message: "Public reply sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

// Get full details (assignment + notes + replies)
router.get("/:id/details", async (req, res) => {
  const { id } = req.params;

  try {
    const [assignedResult] = await db.query(
      "SELECT assigned_to, assigned_at FROM complaint_assignments WHERE complaint_id = ? ORDER BY assigned_at DESC LIMIT 1",
      [id]
    );

    const [notesResult] = await db.query(
      "SELECT note, created_at FROM internal_notes WHERE complaint_id = ? ORDER BY created_at DESC",
      [id]
    );

    const [repliesResult] = await db.query(
      "SELECT reply, created_at FROM public_replies WHERE complaint_id = ? ORDER BY created_at DESC",
      [id]
    );

    res.json({
      assigned: assignedResult[0] || null,
      notes: notesResult,
      replies: repliesResult,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

module.exports = router;
