import React, { useEffect, useState } from "react";
import Header from "./Header";
import ComplaintForm from "./ComplaintForm";
import Footer from "./Footer";
import "./Dashboard.css";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [userComplaints, setUserComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  // Fetch user's complaints
  useEffect(() => {
    if (!user) return;

    const fetchComplaints = async () => {
      try {
        const res = await fetch(`http://localhost:5000/complaints/user/${user.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch complaints");
        setUserComplaints(Array.isArray(data) ? data : data.complaints || []);
      } catch (err) {
        console.error(err);
        setError("Error loading your complaints");
      }
    };

    fetchComplaints();
  }, [user]);

  // Fetch user's notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`http://localhost:5000/user/notifications/${user.id}`);
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : data.notifications || []);
      } catch (err) {
        console.error(err);
        setError("Error loading notifications");
      }
    };

    fetchNotifications();
  }, [user]);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/user/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_status: 1 } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  // Helpers for styling
  const getUrgencyClass = (urgency) => {
    switch (urgency) {
      case "High":
        return "urgency-high";
      case "Medium":
        return "urgency-medium";
      default:
        return "urgency-low";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "New":
        return "status-new";
      case "Under Review":
        return "status-review";
      case "Resolved":
        return "status-resolved";
      default:
        return "status-new";
    }
  };

  if (!user) return <p>Please log in to view your dashboard.</p>;

  return (
    <div className="dashboard">
      <Header user={user} />

      <div className="dashboard-content">
        <div className="dashboard-left">
          <h3>Welcome, {user.name}</h3>
          <p>Email: {user.email}</p>

          {/* Notifications */}
          <div className="notifications">
            <h4>Notifications</h4>
            {notifications.length === 0 && <p>No notifications</p>}
            <ul>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={n.read_status ? "read" : "unread"}
                  onClick={() => markAsRead(n.id)}
                >
                  <a href={n.link}>{n.message}</a>
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="dashboard-center">
          <ComplaintForm user={user} />

          {userComplaints.length === 0 ? (
            <p>No complaints submitted yet.</p>
          ) : (
            <div className="user-complaints">
              <h3>Your Submitted Complaints</h3>
              {error && <p className="error">{error}</p>}
              <div className="complaints-grid">
                {userComplaints.map((c) => (
                  <div key={c.id} className={`complaint-card ${getUrgencyClass(c.urgency)}`}>
                    <div className="card-header">
                      <h4>{c.category}</h4>
                      <span className={`status-badge ${getStatusClass(c.status || "New")}`}>
                        {c.status || "New"}
                      </span>
                    </div>
                    <p>{c.description}</p>
                    <p><strong>Urgency:</strong> {c.urgency}</p>
                    <p><strong>Status History:</strong> {c.status_history || "New"}</p>
                    <p><strong>Submitted At:</strong> {new Date(c.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
