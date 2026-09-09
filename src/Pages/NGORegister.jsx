import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./NGORegister.css";

function NGORegister() {
  const [form, setForm] = useState({
    name: "",
    category: "Education",
    location: "",
    contactPerson: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    website: "",
    address: "",
    founded: "",
    volunteerCount: "",
    mission: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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
          category: form.category,
          location: form.location,
          contact_person: form.contactPerson,
          phone: form.phone,
          email: form.email,
          website: form.website,
          address: form.address,
          founded: form.founded ? Number(form.founded) : null,
          volunteer_count: form.volunteerCount ? Number(form.volunteerCount) : 0,
          description: form.mission,
          approval_status: "pending",
        },
      ]);

      if (ngoError) {
        setError(ngoError.message);
        setLoading(false);
        return;
      }

      // Do NOT sign the NGO in yet — their account is pending admin
      // approval. Signing them in here would leave them "logged in but
      // stuck" everywhere else in the app, which is confusing. They'll
      // sign in properly (and get the correct pending/rejected/approved
      // message) once an admin has reviewed the request.
      await supabase.auth.signOut();

      setSuccess(true);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="ngo-register-page">
        <div className="ngo-register-overlay" />
        <div className="ngo-register-card">
          <div className="ngo-success-content">
            <div className="ngo-success-icon">🎉</div>
            <h2>Registration Submitted!</h2>
            <p>Thanks for registering, <strong>{form.name}</strong>!</p>
            <div className="ngo-success-status">
              <span className="ngo-pending-badge">⏳ Pending Admin Approval</span>
            </div>
            <div className="ngo-success-info">
              <div className="ngo-info-row"><span>✅</span><p>Your registration request has been <strong>received</strong></p></div>
              <div className="ngo-info-row"><span>📧</span><p>Confirmation sent to <strong>{form.email}</strong></p></div>
              <div className="ngo-info-row"><span>⏱</span><p>Admin will review within <strong>24 hours</strong></p></div>
              <div className="ngo-info-row"><span>🔔</span><p>You'll be able to log in and see your dashboard <strong>once approved</strong> — if your request is rejected, you'll see the reason when you try to log in</p></div>
            </div>
            <button onClick={() => navigate("/login")} className="ngo-btn-main">
              Go to Login
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
          <div className="ngo-register-row">
            <div className="ngo-register-group">
              <label>NGO Name <span>*</span></label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Edhi Foundation" required />
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

          <div className="ngo-register-row">
            <div className="ngo-register-group">
              <label>Location <span>*</span></label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Lahore, Pakistan" required />
            </div>
            <div className="ngo-register-group">
              <label>Contact Person <span>*</span></label>
              <input name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="e.g. Ayesha Khan" required />
            </div>
          </div>

          <div className="ngo-register-row">
            <div className="ngo-register-group">
              <label>Phone <span>*</span></label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+92-300-1234567" required />
            </div>
            <div className="ngo-register-group">
              <label>Email <span>*</span></label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="ngo@organization.org" required />
            </div>
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

          <div className="ngo-register-group">
            <label>Website <span className="optional">(optional)</span></label>
            <input name="website" value={form.website} onChange={handleChange} placeholder="https://www.yourngo.org" />
          </div>

          <div className="ngo-register-group">
            <label>Address <span>*</span></label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Full office address" required />
          </div>

          <div className="ngo-register-row three-col">
            <div className="ngo-register-group">
              <label>Founded <span className="optional">(optional)</span></label>
              <input type="number" name="founded" value={form.founded} onChange={handleChange} placeholder="e.g. 2005" min="1800" max={new Date().getFullYear()} />
            </div>
            <div className="ngo-register-group">
              <label>Volunteer Count <span className="optional">(optional)</span></label>
              <input type="number" name="volunteerCount" value={form.volunteerCount} onChange={handleChange} placeholder="e.g. 50" min="0" />
            </div>
            <div className="ngo-register-group">
              <label>Status</label>
              <input value="Pending Approval" disabled />
            </div>
          </div>

          <div className="ngo-register-group">
            <label>Mission <span>*</span></label>
            <textarea name="mission" rows="3" value={form.mission} onChange={handleChange} placeholder="Tell us about your organization's mission and work..." required />
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