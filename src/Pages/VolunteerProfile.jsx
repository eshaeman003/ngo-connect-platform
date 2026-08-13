import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import "./VolunteerProfile.css";

function VolunteerProfile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    location: "",
    skills: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setForm({
            full_name: data.full_name || "",
            email: data.email || user.email || "",
            location: data.location || "",
            skills: data.skills || "",
            bio: data.bio || "",
          });
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        location: form.location,
        skills: form.skills,
        bio: form.bio,
      })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" });
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">👤</div>
          <div>
            <h1>My Profile</h1>
            <p>Update your volunteer information</p>
          </div>
        </div>

        {message && (
          <div className={`profile-alert ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} disabled className="disabled-input" />
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
                placeholder="e.g. Karachi"
              />
            </div>
            <div className="form-group">
              <label>Skills</label>
              <input
                type="text"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="e.g. Teaching, First Aid"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Bio / About Me</label>
            <textarea
              name="bio"
              rows="4"
              value={form.bio}
              onChange={handleChange}
              placeholder="Tell NGOs about yourself..."
            />
          </div>

          <button type="submit" className="profile-btn" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default VolunteerProfile;