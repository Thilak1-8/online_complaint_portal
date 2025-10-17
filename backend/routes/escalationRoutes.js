const express = require('express');
const router = express.Router();
const db = require('../db'); // your MySQL connection file

// POST: Escalate a complaint
router.post('/escalate', async (req, res) => {
  const { complaint_id, escalated_by, higher_authority, reason, notify_all } = req.body;

  try {
    const [complaint] = await db.query('SELECT * FROM complaints WHERE id = ?', [complaint_id]);
    if (complaint.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Insert into escalation table
    await db.query(
      'INSERT INTO escalations (complaint_id, escalated_by, higher_authority, reason, notify_all) VALUES (?, ?, ?, ?, ?)',
      [complaint_id, escalated_by, higher_authority, reason || null, notify_all]
    );

    // Update complaint status (optional)
    await db.query('UPDATE complaints SET status = "Under Review" WHERE id = ?', [complaint_id]);

    // Send notification (future extension)
    // You can integrate email/in-app notifications here

    res.status(200).json({ message: 'Complaint escalated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error escalating complaint' });
  }
});

module.exports = router;
