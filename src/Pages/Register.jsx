import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("volunteer");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setMessage({ type: "error", text: "Please fill all fields!" });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match!" });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters!" });
      return;
    }

    // Success message
    setMessage({ 
      type: "success", 
      text: `Account created successfully! Welcome, ${name}.` 
    });

    // Clear form after 3 seconds
    setTimeout(() => {
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setMessage("");
    }, 3000);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join NGO Connect and make a difference</p>
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
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-btn">Create Account</button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;