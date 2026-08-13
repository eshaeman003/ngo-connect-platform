import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./NGOProfile.css";

function NGOProfile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    contact: "",
    category: "Education",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNgo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("ngos")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setForm({
            name: data.name || "",
            location: data.location || "",
            contact: data.contact || "",
            category: data.category || "Education",
            description: data.description || "",
          });
        }
      }
      setLoading(false);
    };
    fetchNgo();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    // Update NGOs table
    const { error: ngoError } = await supabase
      .from("ngos")
      .update({
        name: form.name,
        location: form.location,
        contact: form.contact,
        category: form.category,
        description: form.description,
      })
      .eq("user_id", user.id);

    // Also update profiles full_name so it stays in sync
    const { error: profError } = await supabase
      .from("profiles")
      .update({ full_name: form.name })
      .eq("id", user.id);

    if (ngoError || profError) {
      setMessage({ type: "error", text: ngoError?.message || profError?.message || "Update failed" });
    } else {
      setMessage({ type: "success", text: "NGO profile updated successfully!" });
      setTimeout(() => navigate("/ngo/dashboard"), 1500);
    }
    setSaving(false);
  };

  if (loading) return <div className="profile-loading">Loading NGO profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">🏛️</div>
          <div>
            <h1>Edit NGO Profile</h1>
            <p>Update your organization information</p>
          </div>
        </div>

        {message && (
          <div className={`profile-alert ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>Organization Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your NGO name"
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option>Education</option>
                <option>Healthcare</option>
                <option>Microfinance</option>
                <option>Environment</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Lahore"
                required
              />
            </div>
            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="tel"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="e.g. 0300-1234567"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Organization Description</label>
            <textarea
              name="description"
              rows="4"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your mission and work..."
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/ngo/dashboard")}>
              Cancel
            </button>
            <button type="submit" className="profile-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NGOProfile;