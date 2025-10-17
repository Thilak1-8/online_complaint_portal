// src/components/ReportsExports.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ReportsExports.css";

const ReportsExports = () => {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [format, setFormat] = useState("csv"); // Default CSV
  const [loading, setLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/admin/complaint-categories"
        );
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleExport = async () => {
    if (!dateRange.start || !dateRange.end || !selectedCategory) {
      alert("Please select date range and category");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/admin/reports?start=${dateRange.start}&end=${dateRange.end}&category=${selectedCategory}&format=${format}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to generate report");
    }
    setLoading(false);
  };

  return (
    <div className="reports-container">
      <h2 className="reports-title">Reports & Exports</h2>

      <div className="reports-field">
        <label>Date Range</label>
        <div className="reports-daterange">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
          />
        </div>
      </div>

      <div className="reports-field">
        <label>Complaint Categories</label>
        <select
          className="reports-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">-- Select Category --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="reports-field">
        <label>Export Format</label>
        <select
          className="reports-select"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      <button
        className="export-btn"
        onClick={handleExport}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Report"}
      </button>
    </div>
  );
};

export default ReportsExports;
