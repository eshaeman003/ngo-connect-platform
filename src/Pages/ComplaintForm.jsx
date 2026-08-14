import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./ComplaintForm.css";

function ComplaintForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    reported_id: "",
    reason: "Misconduct",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    const { error } = await supabase.from("complaints").insert({
      reporter_id: user.id,
      reported_id: form.reported_id,
      reason: form.reason,
      description: form.description,
      status: "pending",
    });
    setLoading(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Complaint filed successfully!");
      navigate("/volunteer/dashboard");
    }
  };

  return (
    <div className="complaint-page">
      <div className="complaint-card">
        <h1>File a Complaint</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Reported User ID *</label>
            <input name="reported_id" value={form.reported_id} onChange={handleChange} required placeholder="Paste the user ID here" />
          </div>
          <div className="form-group">
            <label>Reason</label>
            <select name="reason" value={form.reason} onChange={handleChange}>
              <option>Misconduct</option>
              <option>Fraud</option>
              <option>Harassment</option>
              <option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows="5" placeholder="Describe the issue in detail..." />
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ComplaintForm;