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
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    const fetchOpportunity = async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("opportunities")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          setError("Opportunity not found.");
          setLoading(false);
          return;
        }
        setOpportunity(data);
      } catch (err) {
        setError("Something went wrong.");
      }
      setLoading(false);
    };

    fetchOpportunity();

    const fillUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          setForm(prev => ({
            ...prev,
            name: profile?.full_name || user.user_metadata?.full_name || "",
            email: user.email || "",
            phone: profile?.phone || "",
          }));
        }
      } catch (e) {}
    };
    fillUser();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const applicationData = {
        opportunity_id: id,
        ngo_id: opportunity?.ngo_id || null,
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        message: form.message || null,
        status: "pending",
        volunteer_id: user?.id || null,
      };

      const { error } = await supabase.from("applications").insert(applicationData);
      if (error) throw error;

      setSubmitted(true);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit: " + err.message);
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="apply-page">
        <div className="apply-loading">Loading...</div>
      </div>
    );
  }

  if (error && !opportunity) {
    return (
      <div className="apply-page">
        <div className="apply-error">
          <h2>⚠️ {error}</h2>
          <button className="btn-primary" onClick={() => navigate("/opportunities")}>Back to Opportunities</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="apply-page">
        <div className="apply-success">
          <div className="success-icon">✅</div>
          <h2>Application Submitted!</h2>
          <p>Thank you for applying to <strong>{opportunity?.title}</strong>.</p>
          <p>The NGO will review your application and contact you soon.</p>
          <button className="btn-primary" onClick={() => navigate("/opportunities")}>Browse More Opportunities</button>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-page">
      <div className="apply-wrapper">
        <div className="apply-box">
          {/* Header */}
          <button className="btn-back" onClick={() => navigate("/opportunities")}>← Back to Opportunities</button>

          <div className="apply-opp-info">
            <h1>{opportunity?.title}</h1>
            <p className="opp-ngo">🏢 {opportunity?.ngo_name || "NGO"}</p>
            <div className="opp-meta">
              <span>📍 {opportunity?.location || "Remote"}</span>
              <span>📅 {opportunity?.type || "Flexible"}</span>
            </div>
            <p className="opp-desc">{opportunity?.description}</p>
          </div>

          <hr className="apply-divider" />

          {/* Form */}
          <div className="apply-form-area">
            <h2>📝 Apply for this Opportunity</h2>
            {error && <div className="form-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" required />
                </div>
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+92 300 1234567" />
              </div>

              <div className="form-group">
                <label>Why do you want to volunteer?</label>
                <textarea name="message" rows="3" value={form.message} onChange={handleChange} placeholder="Tell us about yourself and why you're interested..." />
              </div>

              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplyPage;