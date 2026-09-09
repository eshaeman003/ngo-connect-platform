import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import ReportModal from "../components/ReportModal";
import "./OpportunityDetail.css";

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [reportModal, setReportModal] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data, error } = await supabase
        .from("opportunities")
        .select("*, ngos(user_id)")
        .eq("id", id)
        .single();

      if (error || !data) {
        navigate("/opportunities");
        return;
      }
      setOpp(data);

      if (user) {
        const { data: existing } = await supabase
          .from("applications")
          .select("id")
          .eq("opportunity_id", id)
          .eq("volunteer_id", user.id)
          .maybeSingle();
        if (existing) setHasApplied(true);
      }
      setLoading(false);
    };
    init();
  }, [id, navigate]);

  const handleApply = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (hasApplied) return;

    setApplying(true);
    setMessage("");

    const { error } = await supabase.from("applications").insert({
      opportunity_id: id,
      volunteer_id: user.id,
      ngo_id: opp.ngo_id,
      status: "pending",
    });

    if (error) {
      setMessage(error.code === "23505" ? "Already applied!" : "Error. Try again.");
    } else {
      setHasApplied(true);
      setMessage("Application submitted successfully! 🎉");
    }
    setApplying(false);
  };

  if (loading) return <div className="od-loading">Loading...</div>;
  if (!opp) return null;

  return (
    <div className="opportunity-detail-page">
      <div className="od-container">
        <button className="od-back" onClick={() => navigate("/opportunities")}>← Back</button>
        
        <div className="od-card">
          <div className="od-header">
            <span className={`od-badge ${opp.status}`}>{opp.status}</span>
            <h1>{opp.title}</h1>
            <p className="od-cat">📂 {opp.category || "General"}</p>
          </div>

          <div className="od-body">
            <div className="od-section">
              <h3>📝 Description</h3>
              <p>{opp.description || "No description provided."}</p>
            </div>

            <div className="od-grid">
              <div className="od-info">
                <strong>📍 Location</strong>
                <p>{opp.location || "Remote"}</p>
              </div>
              <div className="od-info">
                <strong>⏰ Type</strong>
                <p>{opp.type || "Not specified"}</p>
              </div>
              <div className="od-info">
                <strong>📅 Deadline</strong>
                <p>{opp.deadline ? new Date(opp.deadline).toLocaleDateString() : "Open"}</p>
              </div>
              <div className="od-info">
                <strong>🏢 NGO</strong>
                <p>{opp.ngo_name || "Unknown"}</p>
              </div>
            </div>

            {opp.requirements && (
              <div className="od-section">
                <h3>✅ Requirements</h3>
                <p>{opp.requirements}</p>
              </div>
            )}
          </div>

          <div className="od-footer">
            {message && (
              <div className={`od-msg ${message.includes("success") ? "success" : "error"}`}>
                {message}
              </div>
            )}
            
            {hasApplied ? (
              <button className="od-apply applied" disabled>✓ Application Submitted</button>
            ) : (
              <button 
                className="od-apply" 
                onClick={handleApply}
                disabled={applying || opp.status !== "active"}
              >
                {applying ? "Submitting..." : user ? "Apply Now 🚀" : "Login to Apply"}
              </button>
            )}

            {/* 🚨 Report Button */}
            {user && (
              <button
                style={{
                  marginTop: "12px",
                  background: "transparent",
                  color: "#B24444",
                  border: "1.5px solid #FBE9E7",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  width: "100%",
                  fontFamily: "inherit",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.target.style.background = "#FBE9E7"; }}
                onMouseLeave={(e) => { e.target.style.background = "transparent"; }}
                onClick={() => setReportModal({
                  reportedId: opp.ngos?.user_id || opp.ngo_id,
                  reportedName: opp.ngo_name || "This Opportunity",
                  type: "ngo"
                })}
              >
                🚨 Report Fake / Scam
              </button>
            )}
          </div>
        </div>
      </div>

      {reportModal && (
        <ReportModal
          reportedId={reportModal.reportedId}
          reportedName={reportModal.reportedName}
          type={reportModal.type}
          onClose={() => setReportModal(null)}
        />
      )}
    </div>
  );
}