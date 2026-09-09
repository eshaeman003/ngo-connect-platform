import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { Search, MapPin, CalendarDays, Building2, Flag, Lock, X } from "lucide-react";
import { useToastState, ToastHost } from "../components/Toast";
import "./Opportunities.css";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=500&h=320&fit=crop",
  "https://images.unsplash.com/photo-1473649085228-583485e6e4d7?w=500&h=320&fit=crop",
  "https://images.unsplash.com/photo-1567057419565-4349c49d8a04?w=500&h=320&fit=crop",
  "https://images.unsplash.com/photo-1543689604-6fe8dbcd1f59?w=500&h=320&fit=crop",
  "https://images.unsplash.com/photo-1521493959102-bdd6677fdd81?w=500&h=320&fit=crop",
];

function Opportunities() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, closeToast } = useToastState();

  const [reportModal, setReportModal] = useState({
    open: false, opportunity: null, reason: "Misconduct", description: "", submitting: false,
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false });
      setOpportunities(data || []);
      setLoading(false);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchData();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  const handleApply = (oppId) => {
    if (!user) { setShowLoginModal(true); return; }
    navigate(`/apply/${oppId}`);
  };

  const openReport = (opp, e) => {
    e.stopPropagation();
    if (!user) { setShowLoginModal(true); return; }
    setReportModal({ open: true, opportunity: opp, reason: "Misconduct", description: "", submitting: false });
  };

  const closeReport = () => setReportModal({ open: false, opportunity: null, reason: "Misconduct", description: "", submitting: false });

  const submitReport = async () => {
    if (!reportModal.description.trim()) { showToast("Please describe the issue.", "error"); return; }
    setReportModal(m => ({ ...m, submitting: true }));
    const { error } = await supabase.from("complaints").insert({
      reporter_id: user.id,
      reported_id: reportModal.opportunity.ngo_id || reportModal.opportunity.id,
      reason: reportModal.reason,
      description: `[Reported Opportunity: "${reportModal.opportunity.title}" by ${reportModal.opportunity.ngo_name || "NGO"}]\n\n${reportModal.description}`,
      status: "pending",
    });
    setReportModal(m => ({ ...m, submitting: false }));
    if (error) showToast("Error: " + error.message, "error");
    else { showToast("Report submitted! Admin will review it.", "success"); closeReport(); }
  };

  const categories = ["All", ...new Set(opportunities.map(o => o.category).filter(Boolean))];
  const types = ["All", ...new Set(opportunities.map(o => o.type).filter(Boolean))];

  const filtered = opportunities.filter(o => {
    const matchesSearch = !search || o.title?.toLowerCase().includes(search.toLowerCase()) || o.ngo_name?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (categoryFilter === "All" || o.category === categoryFilter) && (typeFilter === "All" || o.type === typeFilter);
  });

  if (loading) return <div className="opp-loading">Loading opportunities...</div>;

  return (
    <div className="opportunities-page">
      <ToastHost toasts={toasts} onClose={closeToast} />

      <div className="opp-hero">
        <h1>Volunteer Opportunities</h1>
        <p>Discover meaningful ways to contribute to your community</p>
      </div>

      <div className="opp-toolbar">
        <div className="opp-search">
          <Search size={17} className="search-icon" />
          <input type="text" placeholder="Search opportunities..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="opp-filters">
          <div className="filter-group">
            <label>Category</label>
            <div className="filter-pills">
              {categories.map(c => <button key={c} className={categoryFilter === c ? "active" : ""} onClick={() => setCategoryFilter(c)}>{c}</button>)}
            </div>
          </div>
          <div className="filter-group">
            <label>Type</label>
            <div className="filter-pills">
              {types.map(t => <button key={t} className={typeFilter === t ? "active" : ""} onClick={() => setTypeFilter(t)}>{t}</button>)}
            </div>
          </div>
        </div>
      </div>

      <div className="opp-grid">
        {filtered.map((opp, i) => (
          <div className="opp-card" key={opp.id}>
            <div className="opp-image">
              <img src={FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]} alt={opp.ngo_name || "NGO"} loading="lazy" />
              <div className="opp-image-overlay" />
              <span className="opp-spots">Open</span>
              <span className="opp-type-badge">{opp.type || "Volunteer"}</span>
            </div>
            <div className="opp-body">
              <div className="opp-tags"><span className="tag-cat">{opp.category || "General"}</span></div>
              <h3>{opp.title || "Untitled Opportunity"}</h3>
              <p className="opp-desc">{opp.description || "No description available."}</p>
              <div className="opp-meta">
                <span><MapPin size={13} /> {opp.location || "Remote"}</span>
                <span><CalendarDays size={13} /> {opp.duration || "Flexible"}</span>
                <span><Building2 size={13} /> {opp.ngo_name || "NGO"}</span>
              </div>
              <div className="opp-requirements">
                <strong>Requirements:</strong>
                <p>{opp.requirements || "No specific requirements, open to all volunteers"}</p>
              </div>
              <div className="opp-actions">
                <button className="btn-apply" onClick={() => handleApply(opp.id)}>Apply Now <span className="arrow">→</span></button>
                <button className="btn-report" onClick={e => openReport(opp, e)} title="Report this opportunity"><Flag size={13} /> Report</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <div className="opp-empty">No opportunities found.</div>}

      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLoginModal(false)}><X size={16} /></button>
            <div className="modal-icon"><Lock size={22} /></div>
            <h2>Login Required</h2>
            <p>You need to be logged in to apply or report opportunities.</p>
            <div className="modal-buttons">
              <button className="btn-primary" onClick={() => navigate("/login")}>Log In</button>
              <button className="btn-outline" onClick={() => navigate("/register")}>Create Account</button>
            </div>
          </div>
        </div>
      )}

      {reportModal.open && (
        <div className="modal-overlay" onClick={closeReport}>
          <div className="report-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeReport}><X size={16} /></button>
            <div className="modal-icon" style={{ background: "#fef3c7", color: "#92400e" }}><Flag size={20} /></div>
            <h2>Report Opportunity</h2>
            <p className="report-opp-title">"{reportModal.opportunity?.title}"</p>
            <div className="form-group">
              <label>Reason</label>
              <select value={reportModal.reason} onChange={e => setReportModal({ ...reportModal, reason: e.target.value })}>
                <option>Misconduct</option><option>Fraud</option><option>Harassment</option><option>Fake Posting</option><option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea rows="4" placeholder="Explain why you're reporting this opportunity..." value={reportModal.description} onChange={e => setReportModal({ ...reportModal, description: e.target.value })} />
            </div>
            <p className="report-anon"><Lock size={12} /> Your identity is hidden from the NGO. Only admin can see your report.</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={closeReport}>Cancel</button>
              <button className="btn-report-submit" onClick={submitReport} disabled={reportModal.submitting}>{reportModal.submitting ? "Submitting..." : "Submit Report"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Opportunities;
