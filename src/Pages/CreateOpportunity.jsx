import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./CreateOpportunity.css";

function CreateOpportunity() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    category: "General",
    type: "Part-time",
    requirements: "",
    deadline: "",
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/login");
        return;
      }
      setUser(authUser);

      const { data: ngoData } = await supabase
        .from("ngos")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      setNgo(ngoData);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      showToast("Title and description are required!", "error");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("opportunities").insert({
      title: form.title,
      description: form.description,
      location: form.location || "Remote",
      category: form.category,
      type: form.type,
      requirements: form.requirements || null,
      deadline: form.deadline || null,
      ngo_id: user.id,
      ngo_name: ngo?.name || "NGO",
      status: "active",
      created_at: new Date().toISOString(),
    });

    setSubmitting(false);

    if (error) {
      showToast("Error: " + error.message, "error");
    } else {
      showToast("✅ Opportunity posted successfully!");
      setTimeout(() => navigate("/ngo/dashboard"), 1500);
    }
  };

  if (loading) return <div className="opp-page"><div className="opp-loading">Loading...</div></div>;

  if (ngo && ngo.approval_status !== "approved") {
    return (
      <div className="opp-page">
        <div className="opp-header" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚫</div>
          <h1>Access Denied</h1>
          <p style={{ color: "#6B7268", maxWidth: "500px", margin: "12px auto" }}>
            Your NGO is not approved yet. You cannot post opportunities until admin approval.
          </p>
          <button className="opp-btn-primary" onClick={() => navigate("/ngo/dashboard")}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="opp-page">
      {toast.show && <div className={`opp-toast ${toast.type}`}>{toast.msg}</div>}

      <div className="opp-header">
        <h1>Post New Opportunity</h1>
        <p>Create a volunteer opportunity for your NGO</p>
      </div>

      <form onSubmit={handleSubmit} className="opp-form" style={{ maxWidth: "700px", margin: "0 auto", background: "white", padding: "32px", borderRadius: "16px", border: "1px solid #E4E0D6" }}>
        <div className="opp-form-group">
          <label>Opportunity Title *</label>
          <input
            type="text"
            name="title"
            placeholder="e.g., Weekend Teaching Program"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="opp-form-group">
          <label>Description *</label>
          <textarea
            name="description"
            rows="4"
            placeholder="Describe the opportunity, responsibilities, and impact..."
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="opp-form-group">
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              <option>General</option>
              <option>Education</option>
              <option>Healthcare</option>
              <option>Environment</option>
              <option>Food & Shelter</option>
              <option>Microfinance</option>
            </select>
          </div>

          <div className="opp-form-group">
            <label>Type</label>
            <select name="type" value={form.type} onChange={handleChange}>
              <option>Part-time</option>
              <option>Full-time</option>
              <option>One-time</option>
              <option>Remote</option>
              <option>On-site</option>
            </select>
          </div>
        </div>

        <div className="opp-form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            placeholder="e.g., Karachi, Pakistan or Remote"
            value={form.location}
            onChange={handleChange}
          />
        </div>

        <div className="opp-form-group">
          <label>Requirements (optional)</label>
          <textarea
            name="requirements"
            rows="2"
            placeholder="Any specific skills or requirements..."
            value={form.requirements}
            onChange={handleChange}
          />
        </div>

        <div className="opp-form-group">
          <label>Application Deadline (optional)</label>
          <input
            type="date"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button type="button" className="opp-btn-secondary" onClick={() => navigate("/ngo/dashboard")}>Cancel</button>
          <button type="submit" className="opp-btn-primary" disabled={submitting}>
            {submitting ? "Posting..." : "Post Opportunity"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateOpportunity;