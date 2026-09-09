import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./OpportunityEdit.css";

function OpportunityEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    location: "",
    type: "Full-time",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOpp = async () => {
      const { data } = await supabase.from("opportunities").select("*").eq("id", id).single();
      if (data) setForm(data);
      setLoading(false);
    };
    fetchOpp();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("opportunities").update(form).eq("id", id);
    setSaving(false);
    if (error) alert("Error: " + error.message);
    else navigate("/ngo/dashboard");
  };

  if (loading) return <div style={{ padding: "5rem", textAlign: "center" }}>Loading...</div>;

  return (
    <div className="opp-create-page">
      <div className="opp-create-card">
        <h1>Edit Opportunity</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows="4" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option>General</option>
                <option>Education</option>
                <option>Health</option>
                <option>Environment</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={form.type} onChange={handleChange}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Weekend</option>
                <option>Remote</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Location</label>
            <input name="location" value={form.location} onChange={handleChange} />
          </div>
          <button type="submit" className="btn-submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OpportunityEdit;