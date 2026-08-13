import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../utils/supabase";
import ReportModal from "../components/ReportModal";
import "./NGOs.css";

function NGOs() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [reportModal, setReportModal] = useState(null);

  useEffect(() => {
    const fetchNGOs = async () => {
      try {
        const { data, error } = await supabase
          .from("ngos")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setNgos(data || []);
      } catch (err) {
        console.error("Error fetching NGOs:", err);
        setError("Failed to load NGOs. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchNGOs();
  }, []);

  const filtered = ngos.filter((ngo) =>
    ngo.name?.toLowerCase().includes(search.toLowerCase()) ||
    ngo.category?.toLowerCase().includes(search.toLowerCase()) ||
    ngo.location?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="ngos-page"><div className="ngos-loading">Loading NGOs...</div></div>;
  
  if (error) return (
    <div className="ngos-page">
      <div className="ngos-header"><h1>Our Partner NGOs</h1></div>
      <div className="ngos-empty" style={{ color: '#c62828' }}>{error}</div>
    </div>
  );

  return (
    <div className="ngos-page">
      <div className="ngos-header">
        <h1>Our Partner NGOs</h1>
        <p>Organizations making a real difference in communities</p>
      </div>

      <div className="ngos-search-wrap">
        <input
          type="text"
          placeholder="Search by name, category or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ngos-search"
        />
      </div>

      <div className="ngos-grid">
        {filtered.length === 0 ? (
          <div className="ngos-empty">
            <p>No NGOs found.</p>
          </div>
        ) : (
          filtered.map((ngo) => (
            <div key={ngo.id} className="ngo-card" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}>
              <Link to={`/ngos/${ngo.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                <div className="ngo-card-avatar">
                  {ngo.name?.charAt(0) || "🏛️"}
                </div>
                <h3>{ngo.name || "Unnamed NGO"}</h3>
                <span className="ngo-cat">{ngo.category || "General"}</span>
                <p className="ngo-loc">📍 {ngo.location || "Pakistan"}</p>
                <p className="ngo-desc">
                  {ngo.description ? `${ngo.description.substring(0, 100)}...` : "Dedicated to community service and social welfare."}
                </p>
                <span className="ngo-link">View Profile →</span>
              </Link>
              
              <button
                style={{
                  marginTop: "12px",
                  background: "transparent",
                  color: "#B24444",
                  border: "1.5px solid #FBE9E7",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  width: "100%",
                  fontFamily: "inherit",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.target.style.background = "#FBE9E7"; }}
                onMouseLeave={(e) => { e.target.style.background = "transparent"; }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setReportModal({
                    reportedId: ngo.user_id,
                    reportedName: ngo.name || "This NGO",
                    type: "ngo"
                  });
                }}
              >
                🚨 Report This NGO
              </button>
            </div>
          ))
        )}
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

export default NGOs;