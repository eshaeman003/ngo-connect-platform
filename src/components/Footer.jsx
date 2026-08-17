import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3>🌿 NGO Connect</h3>
          <p>Connecting volunteers with NGOs for a better tomorrow.</p>
        </div>
        <div className="footer-links">
          <h4>Quick Links</h4>
          <a href="/">Home</a>
          <a href="/ngos">NGOs</a>
          <a href="/opportunities">Opportunities</a>
        </div>
        <div className="footer-contact">
          <h4>Contact</h4>
          <p>📧 info@ngoconnect.org</p>
          <p>📞 +92-300-1234567</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 NGO Connect. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;