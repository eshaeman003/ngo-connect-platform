import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./Navbar.css";

function Navbar() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchUserRole(user.id);
      }
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    return () => {
      listener?.subscription?.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const fetchUserRole = async (userId) => {
    // Check profiles table first (admin, volunteer)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role) {
      setUserRole(profile.role);
      return;
    }

    // Check ngos table (ngo user)
    const { data: ngo } = await supabase
      .from("ngos")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (ngo) {
      setUserRole("ngo");
      return;
    }

    setUserRole(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  // Determine dashboard path based on role
  const getDashboardPath = () => {
    switch (userRole) {
      case "admin": return "/admin";
      case "ngo": return "/ngo/dashboard";
      case "volunteer": return "/volunteer/dashboard";
      default: return "/";
    }
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/ngos", label: "NGOs" },
    { path: "/opportunities", label: "Opportunities" },
    { path: "/about", label: "About" },
  ];

  const dashboardPath = getDashboardPath();

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-icon">🌿</span>
          <span className="logo-text">NGO Connect</span>
        </Link>

        <div className={`nav-center ${menuOpen ? "open" : ""}`}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user && userRole && (
            <Link
              to={dashboardPath}
              className={`nav-link ${isActive(dashboardPath) ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className={`nav-right ${menuOpen ? "open" : ""}`}>
          {user ? (
            <button className="nav-btn nav-btn-dark" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="nav-btn nav-btn-dark" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
            </>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;