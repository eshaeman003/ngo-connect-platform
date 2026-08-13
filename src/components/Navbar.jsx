import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let authSubscription;

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          setUserRole(data?.role || null);
        }
      } catch (err) {
        console.error("Navbar auth error:", err);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single();
          setUserRole(data?.role || null);
        } else {
          setUserRole(null);
        }
      }
    );

    authSubscription = subscription;

    return () => {
      authSubscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    navigate("/");
  };

  if (loading) return null;

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">🌿 NGO Connect</Link>
      </div>

      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/ngos" onClick={() => setMenuOpen(false)}>NGOs</Link>
        <Link to="/opportunities" onClick={() => setMenuOpen(false)}>Opportunities</Link>
        
        {user ? (
          <>
            {userRole === "admin" && (
              <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>
            )}
            
            {userRole !== "admin" && (
              <Link 
                to={userRole === "ngo" ? "/ngo/dashboard" : "/volunteer/dashboard"} 
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            
            <button onClick={handleLogout} className="nav-btn logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="nav-btn">
              Login
            </Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="nav-btn">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;