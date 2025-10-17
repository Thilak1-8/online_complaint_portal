const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../db");

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({ storage });

// Submit complaint
router.post("/", upload.single("file"), async (req, res) => {
  try {
    let { category, description, urgency, anonymous, userId } = req.body;

    if (!category || !description || !urgency)
      return res.status(400).json({ message: "Missing required fields" });

    // Convert anonymous to boolean
    anonymous = anonymous === "true" || anonymous === true ? 1 : 0;
    const uid = anonymous || !userId ? null : userId;

    const filePath = req.file ? req.file.path : null;

    const query = `
      INSERT INTO complaints (user_id, category, description, urgency, file_path, anonymous)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [uid, category, description, urgency, filePath, anonymous]);

    // Optional: Notify user via dashboard / email later

    res.status(201).json({ message: "Complaint submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Get complaints for a user
router.get("/user/:id", async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      c.id, c.category, c.description, c.urgency, c.status,
      GROUP_CONCAT(CONCAT(cs.status,' (',cs.updated_at,')') ORDER BY cs.updated_at SEPARATOR ' → ') AS status_history,
      c.created_at
    FROM complaints c
    LEFT JOIN complaint_status cs ON c.id = cs.complaint_id
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  try {
    const [results] = await db.query(query, [id]);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error fetching user complaints" });
  }
});

module.exports = router;
