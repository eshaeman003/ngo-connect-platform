import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./Navbar.css";

function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

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

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" onClick={() => setMenuOpen(false)}>NGO Connect</Link>
      </div>

      <div className={`nav-links ${menuOpen ? "active" : ""}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/ngos" onClick={() => setMenuOpen(false)}>NGOs</Link>
        <Link to="/opportunities" onClick={() => setMenuOpen(false)}>Opportunities</Link>
        <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
        
        {user ? (
          <>
            <Link to="/admin" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <button className="nav-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" className="nav-register-btn" onClick={() => setMenuOpen(false)}>
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