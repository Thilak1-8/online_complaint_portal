import React, { useState } from "react";
import "./ComplaintForm.css";

const ComplaintForm = ({ user }) => {
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    urgency: "Low",
    anonymous: !user,
  });
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    const data = new FormData();
    data.append("category", formData.category);
    data.append("description", formData.description);
    data.append("urgency", formData.urgency);
    data.append("anonymous", formData.anonymous);
    if (user && !formData.anonymous) data.append("userId", user.id);
    if (file) data.append("file", file);
    
    try {
  const res = await fetch("http://localhost:5000/complaints", { method: "POST", body: data });
  const result = await res.json();
  if (!res.ok) return setError(result.message || "Submission failed");

  setSuccess(result.message);
  setFormData({ category: "", description: "", urgency: "Low", anonymous: !user });
  setFile(null);
} catch (err) {
  console.error("Error submitting complaint:", err);
  setError("Network error");
}

  };

  return (
    <div className="complaint-form-container">
      <h2>Submit a Complaint</h2>
      <form onSubmit={handleSubmit}>
        <label>Category</label>
        <input name="category" value={formData.category} onChange={handleChange} required />

        <label>Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} required />

        <label>Urgency</label>
        <select name="urgency" value={formData.urgency} onChange={handleChange}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        {user && (
          <label>
            <input
              type="checkbox"
              name="anonymous"
              checked={formData.anonymous}
              onChange={handleChange}
            />
            Submit anonymously
          </label>
        )}

        <label>Upload File (optional)</label>
        <input type="file" onChange={handleFileChange} />

        <button type="submit">Submit Complaint</button>
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
};

export default ComplaintForm;
