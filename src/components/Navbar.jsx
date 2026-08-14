import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);
const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const links = [
    { to: "/", label: "Home" },
    { to: "/opportunities", label: "Opportunities" },
    { to: "/ngos", label: "NGOs" },
    { to: "/about", label: "About" },
  ];

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">NGO Connect</span>
        </Link>

        <div className="navbar-links">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={`nav-link ${location.pathname === l.to ? "active" : ""}`}>
              {l.label}
              {location.pathname === l.to && <span className="nav-dot" />}
            </Link>
          ))}
        </div>

        <div className="navbar-cta">
          <Link to="/login" className="nav-btn-ghost">Log In</Link>
          <Link to="/register" className="nav-btn-primary">Get Started</Link>
        </div>

        <button className="navbar-hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {mobileOpen && (
        <div className="navbar-mobile">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={`nav-link-mobile ${location.pathname === l.to ? "active" : ""}`}>
              {l.label}
            </Link>
          ))}
          <div className="navbar-mobile-cta">
            <Link to="/login" className="nav-btn-ghost-mobile">Log In</Link>
            <Link to="/register" className="nav-btn-primary-mobile">Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;