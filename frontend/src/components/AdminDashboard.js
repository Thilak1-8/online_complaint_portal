import React, { useEffect, useState } from "react";
import EscalateComplaint from "./EscalateComplaint";
import ReportsExports from "./ReportsExports"; // link to your reports component
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]); // always an array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [formStates, setFormStates] = useState({});
  const [openEscalate, setOpenEscalate] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showReports, setShowReports] = useState(false); // NEW: toggle reports

  // Fetch complaints
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5000/admin/complaints")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load complaints");
        return res.json();
      })
      .then((data) => {
        const complaintsArray = data.complaints || []; // ensure array
        setComplaints(complaintsArray);

        // Initialize form states for each complaint
        const initialFormStates = complaintsArray.reduce(
          (acc, c) => ({
            ...acc,
            [c.id]: { assigned_to: "", note: "", reply: "" },
          }),
          {}
        );
        setFormStates(initialFormStates);
      })
      .catch((err) => {
        console.error(err);
        setError("Error loading complaints");
      })
      .finally(() => setLoading(false));
  }, []);

  // Overview stats
  const overview = {
    open: complaints.filter((c) => (c.current_status || "New") !== "Resolved").length,
    resolved: complaints.filter((c) => (c.current_status || "New") === "Resolved").length,
    avgTime: complaints.length
      ? Math.round(
          complaints.reduce((acc, c) => acc + (c.resolution_time || 0), 0) / complaints.length
        )
      : 0,
  };

  const updateFormState = (id, field, value) => {
    setFormStates((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleAssign = async (id) => {
    const { assigned_to } = formStates[id];
    if (!assigned_to.trim()) return setError("Staff name required");

    try {
      const res = await fetch(`http://localhost:5000/admin/actions/assign/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to }),
      });
      if (!res.ok) throw new Error("Assignment failed");
      alert("Assigned successfully");
      setFormStates((prev) => ({ ...prev, [id]: { ...prev[id], assigned_to: "" } }));
    } catch (err) {
      console.error(err);
      setError("Assignment failed");
    }
  };

  const handleAddNote = async (id) => {
    const { note } = formStates[id];
    if (!note.trim()) return setError("Note required");

    try {
      const res = await fetch(`http://localhost:5000/admin/actions/${id}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: 1, note }),
      });
      if (!res.ok) throw new Error("Note addition failed");
      alert("Note added successfully");
      setFormStates((prev) => ({ ...prev, [id]: { ...prev[id], note: "" } }));
    } catch (err) {
      console.error(err);
      setError("Note addition failed");
    }
  };

  const handleSendReply = async (id) => {
    const { reply } = formStates[id];
    if (!reply.trim()) return setError("Reply required");

    try {
      const res = await fetch(`http://localhost:5000/admin/actions/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: 1, reply }),
      });
      if (!res.ok) throw new Error("Reply failed");
      alert("Reply sent to user");
      setFormStates((prev) => ({ ...prev, [id]: { ...prev[id], reply: "" } }));
    } catch (err) {
      console.error(err);
      setError("Reply failed");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/admin/complaints/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, current_status: status } : c))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to update status");
    }
  };

  // Filtered complaints
  const filteredComplaints = (complaints || []).filter(
    (c) =>
      c.category?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!filterStatus || (c.current_status || "New") === filterStatus)
  );

  if (loading) return <p className="loading">Loading complaints...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!complaints.length) return <p className="no-data">No complaints found.</p>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="header-controls">
          <input
            type="text"
            placeholder="Search complaints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="overview">
        <div className="overview-card">
          <h2>{overview.open}</h2>
          <p>Open Complaints</p>
        </div>
        <div className="overview-card resolved">
          <h2>{overview.resolved}</h2>
          <p>Resolved Complaints</p>
        </div>
        <div className="overview-card avg">
          <h2>{overview.avgTime} days</h2>
          <p>Avg Resolution</p>
        </div>
      </section>

      <section className="filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
        </select>
      </section>

      {/* NEW: Generate Reports Button */}
      <section className="report-section">
        <button
          className="generate-report-btn"
          onClick={() => setShowReports(!showReports)}
        >
          {showReports ? "Hide Reports" : "Generate Reports"}
        </button>
      </section>

      {/* NEW: Render ReportsExports component */}
      {showReports && <ReportsExports complaints={complaints} />}

      <section className="complaints-grid">
        {filteredComplaints.map((c) => {
          const formState = formStates[c.id] || { assigned_to: "", note: "", reply: "" };
          return (
            <div key={c.id} className={`complaint-card ${c.urgency?.toLowerCase() || ""}`}>
              <div className="card-header">
                <h3>{c.category}</h3>
                <span className={`status ${c.current_status?.toLowerCase() || "new"}`}>
                  {c.current_status || "New"}
                </span>
              </div>
              <p className="description">{c.description}</p>
              <p className="created-date">{new Date(c.created_at).toLocaleDateString()}</p>

              <select
                value={c.current_status || "New"}
                onChange={(e) => handleStatusChange(c.id, e.target.value)}
              >
                <option value="New">New</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
              </select>

              <div className="actions">
                <input
                  type="text"
                  placeholder="Staff Name"
                  value={formState.assigned_to}
                  onChange={(e) => updateFormState(c.id, "assigned_to", e.target.value)}
                />
                <button onClick={() => handleAssign(c.id)}>Assign</button>

                <textarea
                  placeholder="Add note..."
                  value={formState.note}
                  onChange={(e) => updateFormState(c.id, "note", e.target.value)}
                />
                <button onClick={() => handleAddNote(c.id)}>Add Note</button>

                <textarea
                  placeholder="Reply to user..."
                  value={formState.reply}
                  onChange={(e) => updateFormState(c.id, "reply", e.target.value)}
                />
                <button onClick={() => handleSendReply(c.id)}>Send Reply</button>

                <button
                  className="escalate-btn"
                  onClick={() => {
                    setSelectedComplaint(c);
                    setOpenEscalate(true);
                  }}
                >
                  Escalate Complaint
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {selectedComplaint && (
        <EscalateComplaint
          open={openEscalate}
          onClose={() => setOpenEscalate(false)}
          complaint={selectedComplaint}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
