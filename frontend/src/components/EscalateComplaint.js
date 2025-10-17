import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  Box,
} from "@mui/material";

const EscalateComplaint = ({ open, onClose, complaint }) => {
  const [formData, setFormData] = useState({
    escalated_to: "",
    reason: "",
    notify_all: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.escalated_to) return alert("Select a higher authority!");
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/admin/escalate/${complaint.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          escalated_by: 1, // Example admin ID
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Complaint Escalated Successfully");
        onClose(true);
      } else {
        alert("Escalation failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error during escalation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Escalate Complaint</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" fontWeight="bold" mt={1}>
          {complaint?.category}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Complaint ID: {complaint?.id}
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Higher Authority</InputLabel>
          <Select
            value={formData.escalated_to}
            onChange={(e) => handleChange("escalated_to", e.target.value)}
            label="Select Higher Authority"
          >
            <MenuItem value="Chief Admin">Chief Admin</MenuItem>
            <MenuItem value="Regional Officer">Regional Officer</MenuItem>
            <MenuItem value="Department Head">Department Head</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Reason for Escalation"
          fullWidth
          multiline
          rows={3}
          value={formData.reason}
          onChange={(e) => handleChange("reason", e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.notify_all}
              onChange={(e) => handleChange("notify_all", e.target.checked)}
            />
          }
          label="Notify all parties"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose(false)} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? "Escalating..." : "Escalate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EscalateComplaint;
