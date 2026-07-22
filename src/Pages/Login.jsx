import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("volunteer");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password) {
      setMessage({ type: "error", text: "Please fill all fields!" });
      return;
    }

    // Success message
    setMessage({ type: "success", text: `Welcome back! Signed in as ${role}.` });
    
    // Clear form after 2 seconds
    setTimeout(() => {
      setEmail("");
      setPassword("");
      setMessage("");
    }, 3000);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your NGO Connect account</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`auth-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="role-selector">
            <button
              type="button"
              className={role === "volunteer" ? "active" : ""}
              onClick={() => setRole("volunteer")}
            >
              Volunteer
            </button>
            <button
              type="button"
              className={role === "ngo" ? "active" : ""}
              onClick={() => setRole("ngo")}
            >
              NGO
            </button>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-btn">Sign In</button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;