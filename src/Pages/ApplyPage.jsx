import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./ApplyPage.css";

function ApplyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    experience: "",
    motivation: "",
  });

  useEffect(() => {
    const fetchOpportunity = async () => {
      const { data } = await supabase
        .from("opportunities")
        .select("*, ngos(name)")
        .eq("id", id)
        .single();

      if (!data) {
        navigate("/opportunities");
        return;
      }
      setOpportunity(data);

      // Auto-fill user data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", user.id)
          .single();
        if (profile) {
          setForm((f) => ({
            ...f,
            full_name: profile.full_name || "",
            email: profile.email || "",
            phone: profile.phone || "",
          }));
        }
      }
      setLoading(false);
    };
    fetchOpportunity();
  }, [id, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { error } = await supabase.from("applications").insert({
      opportunity_id: id,
      volunteer_id: user.id,
      status: "pending",
      experience: form.experience,
      motivation: form.motivation,
    });

    setSubmitting(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Application submitted successfully! 🎉");
      navigate("/opportunities");
    }
  };

  if (loading) return <div className="apply-loading">Loading...</div>;

  return (
    <div className="apply-page">
      <div className="apply-hero">
        <div className="apply-hero-content">
          <span className="apply-badge">📝 Application</span>
          <h1>{opportunity.title}</h1>
          <p>
            {opportunity.ngo_name || opportunity.ngos?.name || "NGO"} · {opportunity.location || "Remote"} · {opportunity.type || "Volunteer"}
          </p>
        </div>
      </div>

      <div className="apply-container">
        <div className="apply-card">
          <h2>Apply for this Opportunity</h2>
          <p className="apply-subtitle">Fill in your details below. The NGO will review your application.</p>

          <form onSubmit={handleSubmit}>
            <div className="apply-form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" />
              </div>
            </div>

            <div className="apply-form-row">
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+92-3XX-XXXXXXX" />
              </div>
              <div className="form-group">
                <label>Relevant Experience</label>
                <input name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 2 years teaching" />
              </div>
            </div>

            <div className="form-group">
              <label>Why do you want to volunteer? *</label>
              <textarea name="motivation" value={form.motivation} onChange={handleChange} required rows="4" placeholder="Tell us why you're interested in this opportunity..." />
            </div>

            <div className="apply-actions">
              <button type="button" className="btn-cancel" onClick={() => navigate("/opportunities")}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Application →"}
              </button>
            </div>
          </form>
        </div>

        <div className="apply-info-card">
          <h3>📋 Opportunity Details</h3>
          <div className="info-row"><span>Organization</span><span>{opportunity.ngo_name || opportunity.ngos?.name || "NGO"}</span></div>
          <div className="info-row"><span>Location</span><span>{opportunity.location || "Remote"}</span></div>
          <div className="info-row"><span>Type</span><span>{opportunity.type || "N/A"}</span></div>
          <div className="info-row"><span>Category</span><span>{opportunity.category || "General"}</span></div>
          <div className="info-desc">
            <p>{opportunity.description || "No description available."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplyPage;