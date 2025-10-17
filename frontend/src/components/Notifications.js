import React, { useEffect, useState } from "react";

const Notifications = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/user/notifications/${userId}`)
      .then(res => res.json())
      .then(setNotifications)
      .catch(console.error);
  }, [userId]);

  return (
    <div className="notifications">
      <h3>Notifications</h3>
      {notifications.length === 0 && <p>No notifications</p>}
      <ul>
        {notifications.map(n => (
          <li key={n.id} className={n.read_status ? "read" : "unread"}>
            <a href={n.link}>{n.message}</a>
            <span>{new Date(n.created_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
