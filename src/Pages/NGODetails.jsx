import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import ReportModal from "../components/ReportModal";
import "./NGODetails.css";

function NGODetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ngo, setNgo] = useState(null);
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: ngoData, error: ngoError } = await supabase
        .from("ngos")
        .select("*")
        .eq("id", id)
        .single();

      if (ngoError || !ngoData) {
        setNgo(null);
        setLoading(false);
        return;
      }

      setNgo(ngoData);

      if (ngoData.user_id) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("email, phone, full_name")
          .eq("id", ngoData.user_id)
          .single();
        if (profData) setProfile(profData);
      }

      const { data: oppData } = await supabase
        .from("opportunities")
        .select("*")
        .eq("ngo_id", ngoData.user_id)
        .eq("status", "active");

      setOpportunities(oppData || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const email = profile?.email || ngo?.email || null;
  const phone = profile?.phone || ngo?.phone || null;
  const location = ngo?.location || "Pakistan";

  if (loading) {
    return (
      <div className="ngo-detail-page">
        <div className="ngo-detail-loading">Loading NGO profile...</div>
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="ngo-detail-page">
        <div className="ngo-detail-notfound">
          <h1>NGO Not Found</h1>
          <button className="ngo-detail-back" onClick={() => navigate("/ngos")}>
            ← Back to NGOs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ngo-detail-page">
      <div className="ngo-detail-container">
        <button className="ngo-detail-back" onClick={() => navigate("/ngos")}>
          ← Back to NGOs
        </button>

        <div className="ngo-detail-card">
          <div className="ngo-detail-avatar">
            {ngo.name?.charAt(0) || "🏛️"}
          </div>
          <h1>{ngo.name || "Unnamed NGO"}</h1>
          <span className="ngo-detail-cat">{ngo.category || "General"}</span>

          <div className="ngo-detail-contact">
            <div className="ngo-contact-row">
              <span className="ngo-contact-icon">📍</span>
              <span className="ngo-contact-text">{location}</span>
            </div>
            
            {email ? (
              <div className="ngo-contact-row">
                <span className="ngo-contact-icon">✉️</span>
                <span className="ngo-contact-text">{email}</span>
              </div>
            ) : (
              <div className="ngo-contact-row muted">
                <span className="ngo-contact-icon">✉️</span>
                <span className="ngo-contact-text">Email not provided</span>
              </div>
            )}
            
            {phone ? (
              <div className="ngo-contact-row">
                <span className="ngo-contact-icon">📞</span>
                <span className="ngo-contact-text">{phone}</span>
              </div>
            ) : (
              <div className="ngo-contact-row muted">
                <span className="ngo-contact-icon">📞</span>
                <span className="ngo-contact-text">Phone not provided</span>
              </div>
            )}
          </div>

          <div className="ngo-detail-actions">
            {phone && (
              <a href={`tel:${phone}`} className="ngo-action-btn call">
                <span>📞</span> Call Now
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="ngo-action-btn email">
                <span>✉️</span> Send Email
              </a>
            )}
            {phone && (
              <a 
                href={`https://wa.me/${phone.replace(/\D/g, "")}`} 
                target="_blank" 
                rel="noreferrer" 
                className="ngo-action-btn whatsapp"
              >
                <span>💬</span> Message
              </a>
            )}
          </div>

          {/* 🚨 Report Button */}
          <button
            style={{
              marginTop: "16px",
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
              reportedId: ngo.user_id,
              reportedName: ngo.name || "This NGO",
              type: "ngo"
            })}
          >
            🚨 Report This NGO
          </button>

          <div className="ngo-detail-desc">
            <h3>About</h3>
            <p>{ngo.description || "No description available."}</p>
          </div>
        </div>

        <div className="ngo-detail-opp-section">
          <h2>Active Opportunities ({opportunities.length})</h2>
          {opportunities.length === 0 ? (
            <p className="ngo-detail-noopp">No active opportunities posted yet.</p>
          ) : (
            <div className="ngo-detail-opp-grid">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="ngo-detail-opp-card"
                  onClick={() => navigate(`/opportunities/${opp.id}`)}
                >
                  <h4>{opp.title}</h4>
                  <p className="ngo-detail-opp-loc">📍 {opp.location || "Remote"}</p>
                  <p className="ngo-detail-opp-desc">
                    {opp.description?.substring(0, 80) || "No description"}...
                  </p>
                  <span className="ngo-detail-opp-type">{opp.type || "Part-time"}</span>
                </div>
              ))}
            </div>
          )}
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

export default NGODetails;