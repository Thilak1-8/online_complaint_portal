import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Complaint Portal. All Rights Reserved.</p>
      <p>Made with ❤️ using React</p>
    </footer>
  );
};

export default Footer;
