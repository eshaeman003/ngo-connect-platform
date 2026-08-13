import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, suspended")
      .eq("id", authData.user.id)
      .single();

    if (profile?.suspended) {
      setError("Your account has been suspended. Contact admin.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setLoading(false);

    if (profile?.role === "admin") {
      navigate("/admin");
    } else if (profile?.role === "ngo") {
      navigate("/ngo/dashboard");
    } else {
      navigate("/volunteer/dashboard");
    }
  };

  return (
    <div className="login-page">
      {/* LEFT SIDE — Bachon wali NGO Picture */}
      <div className="login-visual">
        <img 
          src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80" 
          alt="Children smiling" 
        />
        <div className="login-visual-overlay" />
        <div className="login-visual-text">
          <h2>NGO Connect</h2>
          <p>Connecting hearts, changing lives.</p>
        </div>
      </div>

      {/* RIGHT SIDE — Form */}
      <div className="login-right">
        <div className="login-card">
          <h1>Welcome Back</h1>
          <p>Login to your NGO Connect account</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="login-footer">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;