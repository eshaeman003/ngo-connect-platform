import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./Register.css";

function Register() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",
    age: "",
    gender: "Prefer not to say",
    skills: "",
    experience: "",
    interests: "",
    availability: "Weekends",
    bio: "",
    accountRole: "Volunteer",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

      await supabase.from("profiles").insert([
        {
          id: userId,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          location: form.location,
          age: form.age ? Number(form.age) : null,
          gender: form.gender,
          skills: form.skills,
          experience: form.experience,
          interests: form.interests,
          availability: form.availability,
          bio: form.bio,
          role: "volunteer",
          account_role: form.accountRole,
          status: "active",
        },
      ]);

      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      navigate("/volunteer/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-center-page">
      <div className="register-center-overlay" />

      <div className="register-center-card">
        <div className="register-center-toggle">
          <button className="register-center-toggle-btn active">Register as Volunteer</button>
          <Link to="/register/ngo" className="register-center-toggle-btn">Register as NGO</Link>
        </div>

        <div className="register-center-header">
          <span className="register-center-icon">🌿</span>
          <h1>Create Account</h1>
          <p>Join as a volunteer and start making an impact</p>
        </div>

        {error && <div className="register-center-error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-center-form">
          <div className="register-center-group">
            <label>Full Name <span>*</span></label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="register-center-group">
            <label>Email <span>*</span></label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="register-center-row">
            <div className="register-center-group">
              <label>Password <span>*</span></label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 chars"
                required
              />
            </div>
            <div className="register-center-group">
              <label>Confirm <span>*</span></label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter"
                required
              />
            </div>
          </div>

          <div className="register-center-row">
            <div className="register-center-group">
              <label>Phone <span>*</span></label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+92-300-1234567"
                required
              />
            </div>
            <div className="register-center-group">
              <label>Location <span>*</span></label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Karachi"
                required
              />
            </div>
          </div>

          <div className="register-center-row">
            <div className="register-center-group">
              <label>Age <span className="optional">(optional)</span></label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                placeholder="e.g. 24"
                min="13"
                max="100"
              />
            </div>
            <div className="register-center-group">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="register-center-group">
            <label>Skills <span className="optional">(optional)</span></label>
            <input
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="e.g. Teaching, Design, Medical"
            />
          </div>

          <div className="register-center-group">
            <label>Experience <span className="optional">(optional)</span></label>
            <textarea
              name="experience"
              rows="2"
              value={form.experience}
              onChange={handleChange}
              placeholder="Any prior volunteering or relevant work experience..."
            />
          </div>

          <div className="register-center-group">
            <label>Interests <span className="optional">(optional)</span></label>
            <input
              name="interests"
              value={form.interests}
              onChange={handleChange}
              placeholder="e.g. Education, Environment, Health"
            />
          </div>

          <div className="register-center-row">
            <div className="register-center-group">
              <label>Availability</label>
              <select name="availability" value={form.availability} onChange={handleChange}>
                <option>Weekdays</option>
                <option>Weekends</option>
                <option>Evenings</option>
                <option>Full-time</option>
                <option>Flexible</option>
              </select>
            </div>
            <div className="register-center-group">
              <label>Account Role</label>
              <select name="accountRole" value={form.accountRole} onChange={handleChange}>
                <option>Volunteer</option>
                <option>Team Lead</option>
                <option>Coordinator</option>
              </select>
            </div>
          </div>

          <div className="register-center-group">
            <label>Bio <span className="optional">(optional)</span></label>
            <textarea
              name="bio"
              rows="2"
              value={form.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="register-center-group">
            <label>Status</label>
            <input value="Active" disabled />
          </div>

          <button type="submit" className="register-center-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="register-center-divider">
          <span>Or</span>
        </div>

        <p className="register-center-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;