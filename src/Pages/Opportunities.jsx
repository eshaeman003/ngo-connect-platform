import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./Opportunities.css";

// NGO/Social service related images
const ngoImages = [
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=250&fit=crop",
];

function getImageForOpportunity(id, category) {
  // Deterministic image selection based on id
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ngoImages.length;
  return ngoImages[index];
}

function Opportunities() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [visibleCards, setVisibleCards] = useState({});

  // Report modal state
  const [reportModal, setReportModal] = useState({
    open: false,
    opportunity: null,
    reason: "Misconduct",
    description: "",
    submitting: false,
  });

  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false });
      setOpportunities(data || []);
      setLoading(false);

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Staggered fade-in animation for cards
      if (data) {
        data.forEach((_, index) => {
          setTimeout(() => {
            setVisibleCards((prev) => ({ ...prev, [index]: true }));
          }, index * 100);
        });
      }
    };
    fetchData();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  const handleApply = (oppId) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    navigate(`/apply/${oppId}`);
  };

  const openReport = (opp, e) => {
    e.stopPropagation();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setReportModal({
      open: true,
      opportunity: opp,
      reason: "Misconduct",
      description: "",
      submitting: false,
    });
  };

  const closeReport = () => {
    setReportModal({
      open: false,
      opportunity: null,
      reason: "Misconduct",
      description: "",
      submitting: false,
    });
  };

  const submitReport = async () => {
    if (!reportModal.description.trim()) {
      alert("Please describe the issue.");
      return;
    }
    setReportModal((m) => ({ ...m, submitting: true }));

    const { error } = await supabase.from("complaints").insert({
      reporter_id: user.id,
      reported_id: reportModal.opportunity.ngo_id || reportModal.opportunity.id,
      reason: reportModal.reason,
      description: `[Reported Opportunity: "${reportModal.opportunity.title}" by ${reportModal.opportunity.ngo_name || "NGO"}]\n\n${reportModal.description}`,
      status: "pending",
    });

    setReportModal((m) => ({ ...m, submitting: false }));
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Report submitted! Admin will review it.");
      closeReport();
    }
  };

  const categories = ["All", ...new Set(opportunities.map((o) => o.category).filter(Boolean))];
  const types = ["All", ...new Set(opportunities.map((o) => o.type).filter(Boolean))];

  const filtered = opportunities.filter((o) => {
    const matchesSearch =
      !search ||
      o.title?.toLowerCase().includes(search.toLowerCase()) ||
      o.ngo_name?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "All" || o.category === categoryFilter;
    const matchesType = typeFilter === "All" || o.type === typeFilter;
    return matchesSearch && matchesCat && matchesType;
  });

  if (loading) return <div className="opp-loading">Loading opportunities...</div>;

  return (
    <div className="opportunities-page">
      {/* ===== HERO ===== */}
      <div className="opp-hero">
        <div className="opp-hero-content">
          <h1>Volunteer Opportunities</h1>
          <p>Discover meaningful ways to contribute to your community</p>
        </div>
      </div>

      {/* ===== SEARCH & FILTERS ===== */}
      <div className="opp-toolbar">
        <div className="opp-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="opp-filters">
          <div className="filter-group">
            <label>Category</label>
            <div className="filter-pills">
              {categories.map((c) => (
                <button
                  key={c}
                  className={categoryFilter === c ? "active" : ""}
                  onClick={() => setCategoryFilter(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Type</label>
            <div className="filter-pills">
              {types.map((t) => (
                <button
                  key={t}
                  className={typeFilter === t ? "active" : ""}
                  onClick={() => setTypeFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CARDS GRID ===== */}
      <div className="opp-grid">
        {filtered.map((opp, index) => (
          <div
            className={`opp-card ${visibleCards[index] ? "visible" : ""}`}
            key={opp.id}
            style={{ transitionDelay: `${index * 80}ms` }}
          >
            <div className="opp-image">
              <img
                src={getImageForOpportunity(opp.id, opp.category)}
                alt={opp.title}
                loading="lazy"
              />
              <div className="opp-image-overlay" />
              <span className="opp-spots">Open</span>
              <span className="opp-type-badge">{opp.type || "Volunteer"}</span>
            </div>

            <div className="opp-body">
              <div className="opp-tags">
                <span className="tag-cat">{opp.category || "General"}</span>
              </div>

              <h3>{opp.title || "Untitled Opportunity"}</h3>

              <p className="opp-desc">
                {opp.description || "No description available."}
              </p>

              <div className="opp-meta">
                <span>📍 {opp.location || "Remote"}</span>
                <span>📅 {opp.duration || "Flexible"}</span>
                <span>🏢 {opp.ngo_name || "NGO"}</span>
              </div>

              <div className="opp-requirements">
                <strong>Requirements:</strong>
                <p>{opp.requirements || "No specific requirements, open to all volunteers"}</p>
              </div>

              {/* ===== APPLY + REPORT BUTTONS ===== */}
              <div className="opp-actions">
                <button className="btn-apply" onClick={() => handleApply(opp.id)}>
                  Apply Now <span className="arrow">→</span>
                </button>
                <button className="btn-report" onClick={(e) => openReport(opp, e)} title="Report this opportunity">
                  🚩 Report
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="opp-empty">No opportunities found.</div>
      )}

      {/* ===== LOGIN MODAL ===== */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLoginModal(false)}>
              ✕
            </button>
            <div className="modal-icon">🔒</div>
            <h2>Login Required</h2>
            <p>You need to be logged in to apply or report opportunities.</p>
            <div className="modal-buttons">
              <button className="btn-primary" onClick={() => navigate("/login")}>
                Log In
              </button>
              <button className="btn-outline" onClick={() => navigate("/register")}>
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REPORT MODAL ===== */}
      {reportModal.open && (
        <div className="modal-overlay" onClick={closeReport}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeReport}>
              ✕
            </button>
            <div className="modal-icon" style={{ background: "#fef3c7", color: "#92400e" }}>
              🚩
            </div>
            <h2>Report Opportunity</h2>
            <p className="report-opp-title">"{reportModal.opportunity?.title}"</p>

            <div className="form-group">
              <label>Reason</label>
              <select
                value={reportModal.reason}
                onChange={(e) =>
                  setReportModal({ ...reportModal, reason: e.target.value })
                }
              >
                <option>Misconduct</option>
                <option>Fraud</option>
                <option>Harassment</option>
                <option>Fake Posting</option>
                <option>Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                rows="4"
                placeholder="Explain why you're reporting this opportunity..."
                value={reportModal.description}
                onChange={(e) =>
                  setReportModal({ ...reportModal, description: e.target.value })
                }
              />
            </div>

            <p className="report-anon">
              🔒 Your identity is hidden from the NGO. Only admin can see your report.
            </p>

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={closeReport}>
                Cancel
              </button>
              <button
                className="btn-report-submit"
                onClick={submitReport}
                disabled={reportModal.submitting}
              >
                {reportModal.submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Opportunities;