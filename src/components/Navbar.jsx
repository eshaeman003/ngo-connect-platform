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

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" onClick={() => setMenuOpen(false)}>NGO Connect</Link>
      </div>

      <div className={`nav-links ${menuOpen ? "active" : ""}`}>
        <div className="nav-pill-container">
          <Link 
            to="/" 
            className={`nav-pill ${isActive("/") ? "active" : ""}`} 
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/ngos" 
            className={`nav-pill ${isActive("/ngos") ? "active" : ""}`} 
            onClick={() => setMenuOpen(false)}
          >
            NGOs
          </Link>
          <Link 
            to="/opportunities" 
            className={`nav-pill ${isActive("/opportunities") ? "active" : ""}`} 
            onClick={() => setMenuOpen(false)}
          >
            Opportunities
          </Link>
          <Link 
            to="/about" 
            className={`nav-pill ${isActive("/about") ? "active" : ""}`} 
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>
          
          {user ? (
            <>
              <Link 
                to="/admin" 
                className={`nav-pill ${isActive("/admin") ? "active" : ""}`} 
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button className="nav-pill nav-pill-btn logout-pill" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={`nav-pill ${isActive("/login") ? "active" : ""}`} 
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className={`nav-pill register-pill ${isActive("/register") ? "active" : ""}`} 
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>
    </nav>
  );
}

export default Navbar;