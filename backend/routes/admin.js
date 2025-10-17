// routes/admin.js
const express = require("express");
const db = require("../db"); // must be mysql2/promise
const router = express.Router();
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");


// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true if using port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ---------------- GET ALL COMPLAINTS ----------------
router.get("/complaints", async (req, res) => {
  const query = `
    SELECT 
      c.id, 
      c.user_id, 
      c.category, 
      c.description, 
      c.urgency, 
      COALESCE(
        (
          SELECT cs.status
          FROM complaint_status cs
          WHERE cs.complaint_id = c.id
          ORDER BY cs.updated_at DESC
          LIMIT 1
        ),
        'New'
      ) AS current_status,
      c.created_at,
      GROUP_CONCAT(
        CONCAT(cs.status, ' (', cs.updated_at, ')') 
        ORDER BY cs.updated_at 
        SEPARATOR ' → '
      ) AS status_history
    FROM complaints c
    LEFT JOIN complaint_status cs ON c.id = cs.complaint_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;
  try {
    const [rows] = await db.query(query);
    res.json({ success: true, complaints: rows });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ success: false, message: "DB error fetching complaints" });
  }
});

// ---------------- UPDATE COMPLAINT STATUS ----------------
router.put("/complaints/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const updateQuery = "UPDATE complaints SET status = ?, updated_at = NOW() WHERE id = ?";
  const historyQuery = "INSERT INTO complaint_status (complaint_id, status) VALUES (?, ?)";

  try {
    const [updateResult] = await db.query(updateQuery, [status, id]);
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    await db.query(historyQuery, [id, status]);
    res.json({ success: true, message: "Status updated and history recorded" });
  } catch (err) {
    console.error("Error updating complaint status:", err);
    res.status(500).json({ success: false, message: "DB error updating complaint" });
  }
});

// ---------------- ESCALATE COMPLAINT ----------------
router.post("/escalate/:id", async (req, res) => {
  const complaintId = req.params.id;
  const { escalated_to, reason, notify_all, escalated_by } = req.body;

  const connection = await db.getConnection(); // start transaction
  try {
    await connection.beginTransaction();

    // 1️⃣ Insert into escalations
    await connection.query(
      "INSERT INTO escalations (complaint_id, escalated_to, reason, notify_all, escalated_by) VALUES (?, ?, ?, ?, ?)",
      [complaintId, escalated_to, reason, notify_all, escalated_by]
    );

    // 2️⃣ Update complaint status
    await connection.query("UPDATE complaints SET status = 'Under Review' WHERE id = ?", [complaintId]);

    // 3️⃣ Fetch complaint details and user email
    const [[complaint]] = await connection.query(
      `SELECT c.*, u.email AS user_email, u.id AS user_id
       FROM complaints c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [complaintId]
    );

    if (!complaint) throw new Error("Complaint not found");

    // 4️⃣ Insert in-app notification for user
    await connection.query(
      "INSERT INTO notifications (user_id, message, link) VALUES (?, ?, ?)",
      [
        complaint.user_id,
        `Your complaint #${complaint.id} has been escalated and is under review.`,
        `/complaints/${complaint.id}`,
      ]
    );

    // 5️⃣ Send email to higher authority
    const [higherAdmin] = await connection.query("SELECT email FROM users WHERE id = ?", [escalated_to]);
    if (higherAdmin.length > 0) {
      await transporter.sendMail({
        from: `"Complaint System" <${process.env.SMTP_USER}>`,
        to: higherAdmin[0].email,
        subject: `Complaint #${complaint.id} Escalated`,
        html: `<p>Complaint #${complaint.id} has been escalated by admin ${escalated_by}.</p>
               <p>Reason: ${reason}</p>
               <p><a href="${process.env.FRONTEND_URL}/admin/complaints/${complaint.id}">View Complaint</a></p>`,
      });
    }

    await connection.commit();
    res.json({ success: true, message: "Complaint escalated and notifications sent" });
  } catch (err) {
    await connection.rollback();
    console.error("Error escalating complaint:", err);
    res.status(500).json({ success: false, message: "Error escalating complaint" });
  } finally {
    connection.release();
  }
});

//
// Fetch distinct complaint categories
router.get("/complaint-categories", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DISTINCT category FROM complaints");
    // Convert to {id, name} format for frontend dropdown
    const categories = rows.map(r => ({ id: r.category, name: r.category }));
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Generate report (CSV / PDF)
router.get("/reports", async (req, res) => {
  const { start, end, category, format } = req.query;

  if (!start || !end || !category) {
    return res.status(400).json({ message: "Start date, end date, and category are required" });
  }

  try {
    // Fetch complaints in date range for selected category
    const [rows] = await db.query(
      "SELECT * FROM complaints WHERE category=? AND DATE(created_at) BETWEEN ? AND ?",
      [category, start, end]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No complaints found for this selection" });
    }

    if (format === "csv") {
      // CSV generation
      const csv = [
        Object.keys(rows[0]).join(","), // headers
        ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(",")) // values
      ].join("\n");

      res.setHeader("Content-Disposition", "attachment; filename=report.csv");
      res.setHeader("Content-Type", "text/csv");
      res.send(csv);

    } else if (format === "pdf") {
      // PDF generation
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      res.setHeader("Content-Disposition", "attachment; filename=report.pdf");
      res.setHeader("Content-Type", "application/pdf");

      doc.pipe(res);

      doc.fontSize(18).text("Complaint Report", { align: "center" });
      doc.moveDown();

      rows.forEach((r, idx) => {
        doc.fontSize(12).text(`Complaint #${r.id}`);
        doc.text(`User ID: ${r.user_id}`);
        doc.text(`Category: ${r.category}`);
        doc.text(`Description: ${r.description}`);
        doc.text(`Urgency: ${r.urgency}`);
        doc.text(`Status: ${r.status}`);
        doc.text(`Anonymous: ${r.anonymous ? "Yes" : "No"}`);
        doc.text(`Created At: ${r.created_at}`);
        doc.text(`Updated At: ${r.updated_at}`);
        doc.moveDown();
      });

      doc.end();

    } else {
      res.status(400).json({ message: "Invalid format" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;