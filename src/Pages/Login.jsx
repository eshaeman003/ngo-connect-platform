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

    const userId = authData.user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, suspended, legal_notice_received, full_name")
      .eq("id", userId)
      .single();

    if (profile) {
      if (profile.suspended || profile.legal_notice_received) {
        setError(
          "Your account has been officially suspended due to violation of platform policies. You may no longer access this platform. Contact admin for appeals."
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (profile.role === "admin") {
        setLoading(false);
        navigate("/admin");
        return;
      }

      if (profile.role === "volunteer") {
        setLoading(false);
        navigate("/volunteer/dashboard");
        return;
      }
    }

    const { data: ngo } = await supabase
      .from("ngos")
      .select("id, name, approval_status, suspended, legal_notice_received")
      .eq("user_id", userId)
      .single();

    if (ngo) {
      if (ngo.suspended || ngo.legal_notice_received) {
        setError(
          "Your NGO account has been officially suspended due to violation of platform policies. You may no longer access this platform. Contact admin for appeals."
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (ngo.approval_status === "pending") {
        setError(
          "Your NGO registration is still pending approval. Please wait for admin verification before accessing the dashboard."
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (ngo.approval_status === "rejected") {
        setError(
          "Your NGO registration has been rejected by the admin. Contact support for more information."
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (ngo.approval_status === "approved") {
        setLoading(false);
        navigate("/ngo/dashboard");
        return;
      }
    }

    setError("Account not found or not properly registered. Please contact support.");
    await supabase.auth.signOut();
    setLoading(false);
  };

  return (
    <div className="login-page">
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
                placeholder="********"
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