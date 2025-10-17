import React from "react";
import { Link } from "react-router-dom";
import "./Home.css"; // import the CSS

const Home = () => {
  return (
    <div className="home-container">
      <h2>Welcome to Online Complaint Portal and Feedback Management System</h2>
      <p>If you don’t have an account click below!</p>
      <Link to="/signup">
        <button>Go to Signup Page</button>
      </Link>
 
      <p>If you already have an account click below!</p>
      <Link to="/login">
        <button>Go to Login Page</button>
      </Link>
    </div>
  )
}

export default Home;
