import React from "react";
import "./SecondHero.css";

const SecondHero = () => {
  return (
    <section className="second-hero">
      <div className="second-img">
        <img src="https://via.placeholder.com/350x250" alt="Support" />
      </div>
      <div className="second-text">
        <h2>Why Choose Our Portal?</h2>
        <p>We provide transparency, real-time tracking, and fast resolution for all complaints.</p>
        <ul>
          <li>✔ User-friendly interface</li>
          <li>✔ Secure and private</li>
          <li>✔ Real-time updates</li>
        </ul>
        <button>Learn More</button>
      </div>
    </section>
  );
};

export default SecondHero;
