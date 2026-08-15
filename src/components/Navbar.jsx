import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./Navbar.css";

function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  };

  const isActive = (path) => location.pathname === path ? "active" : "";

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" onClick={() => setMenuOpen(false)}>NGO Connect</Link>
      </div>

      <div className={`nav-links ${menuOpen ? "active" : ""}`}>
        <Link to="/" className={isActive("/")} onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/ngos" className={isActive("/ngos")} onClick={() => setMenuOpen(false)}>NGOs</Link>
        <Link to="/opportunities" className={isActive("/opportunities")} onClick={() => setMenuOpen(false)}>Opportunities</Link>
        <Link to="/about" className={isActive("/about")} onClick={() => setMenuOpen(false)}>About</Link>
        
        {user ? (
          <>
            <Link to="/admin" className={isActive("/admin")} onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <button className="nav-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={isActive("/login")} onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" className={`nav-register-btn ${isActive("/register")}`} onClick={() => setMenuOpen(false)}>
              Register
            </Link>
          </>
        )}
      </div>

      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>
    </nav>
  );
}

export default Navbar;