import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./NGORegister.css";

function NGORegister() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    address: "",
    category: "Education",
    description: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData?.user?.id) {
        setError("Registration failed. This email may already be registered.");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      await supabase
        .from("profiles")
        .upsert(
          [{ id: userId, email: form.email, full_name: form.name, role: "ngo" }],
          { onConflict: "id" }
        );

      const { error: ngoError } = await supabase.from("ngos").insert([
        {
          user_id: userId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          category: form.category,
          description: form.description,
          website: form.website,
          status: "pending",
        },
      ]);

      if (ngoError) {
        setError(ngoError.message);
        setLoading(false);
        return;
      }

      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      setSuccess(true);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!success) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/ngo/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [success, navigate]);

  if (success) {
    return (
      <div className="ngo-register-page">
        <div className="ngo-register-overlay" />
        <div className="ngo-register-card">
          <div className="ngo-success-content">
            <div className="ngo-success-icon">🎉</div>
            <h2>Registration Successful!</h2>
            <p>Welcome aboard, <strong>{form.name}</strong>!</p>
            <div className="ngo-success-status">
              <span className="ngo-pending-badge">⏳ Pending Admin Approval</span>
            </div>
            <div className="ngo-success-info">
              <div className="ngo-info-row"><span>✅</span><p>Account created and <strong>logged in</strong> successfully</p></div>
              <div className="ngo-info-row"><span>📧</span><p>Confirmation sent to <strong>{form.email}</strong></p></div>
              <div className="ngo-info-row"><span>⏱</span><p>Admin will review within <strong>24 hours</strong></p></div>
              <div className="ngo-info-row"><span>🚀</span><p>Redirecting to dashboard in <strong>{countdown} seconds...</strong></p></div>
            </div>
            <button onClick={() => navigate("/ngo/dashboard")} className="ngo-btn-main">
              Go to Dashboard Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ngo-register-page">
      <div className="ngo-register-overlay" />
      <div className="ngo-register-card">
        <div className="ngo-register-toggle">
          <Link to="/register" className="ngo-register-toggle-btn">Register as Volunteer</Link>
          <button className="ngo-register-toggle-btn active">Register as NGO</button>
        </div>

        <div className="ngo-register-header">
          <span className="ngo-register-icon">🏛️</span>
          <h1>Register your NGO</h1>
          <p>Create an organization account to post volunteer opportunities</p>
        </div>

        {error && <div className="ngo-register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="ngo-register-form">
          <div className="ngo-register-group">
            <label>Organization Name <span>*</span></label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Edhi Foundation" required />
          </div>

          <div className="ngo-register-group">
            <label>Email Address <span>*</span></label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="ngo@organization.org" required />
          </div>

          <div className="ngo-register-row">
            <div className="ngo-register-group">
              <label>Password <span>*</span></label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required />
            </div>
            <div className="ngo-register-group">
              <label>Confirm Password <span>*</span></label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required />
            </div>
          </div>

          <div className="ngo-register-row">
            <div className="ngo-register-group">
              <label>Phone Number <span>*</span></label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+92-300-1234567" required />
            </div>
            <div className="ngo-register-group">
              <label>Category <span>*</span></label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option>Education</option>
                <option>Health</option>
                <option>Environment</option>
                <option>Food & Shelter</option>
                <option>Disaster Relief</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="ngo-register-group">
            <label>Address <span>*</span></label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Full office address" required />
          </div>

          <div className="ngo-register-group">
            <label>Mission / Description <span>*</span></label>
            <textarea name="description" rows="3" value={form.description} onChange={handleChange} placeholder="Tell us about your organization's mission and work..." required />
          </div>

          <div className="ngo-register-group">
            <label>Website <span className="optional">(optional)</span></label>
            <input name="website" value={form.website} onChange={handleChange} placeholder="https://www.yourngo.org" />
          </div>

          <button type="submit" className="ngo-register-btn" disabled={loading}>
            {loading ? "Registering..." : "Register NGO"}
          </button>
        </form>

        <div className="ngo-register-divider"><span>Or</span></div>

        <p className="ngo-register-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default NGORegister;