import React from "react";
import "./Hero.css";

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>Welcome to Complaint Portal</h1>
        <p>Track, manage, and resolve your complaints easily and transparently.</p>
        <button>Get Started</button>
      </div>
      <div className="hero-img">
        <img src="https://via.placeholder.com/400x300" alt="Hero Illustration" />
      </div>
    </section>
  );
};

export default Hero;
