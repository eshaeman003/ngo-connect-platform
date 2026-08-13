import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import ReportModal from "../components/ReportModal";
import "./Opportunities.css";

function Opportunities() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [experience, setExperience] = useState("");
  const [motivation, setMotivation] = useState("");
  const [availability, setAvailability] = useState("Weekdays");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [reportModal, setReportModal] = useState(null);

  const categories = ["All", "Education", "Healthcare", "Microfinance", "Environment", "Food & Shelter"];

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setProfile(prof);

        const { data: apps } = await supabase
          .from("applications")
          .select("opportunity_id")
          .eq("volunteer_id", user.id);
        setAppliedIds(new Set(apps?.map(a => a.opportunity_id) || []));
      }

      // ✅ SIMPLIFIED: Sirf active opportunities fetch karo
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("[Opportunities] Fetch error:", error);
      }
      
      setOpportunities(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const showToastMsg = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const openApplyModal = (opp) => {
    if (!user) {
      showToastMsg("Please login first to apply!", "error");
      return;
    }
    setSelectedOpp(opp);
    setExperience("");
    setMotivation("");
    setAvailability("Weekdays");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOpp(null);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedOpp) return;
    setSubmitting(true);

    const { error } = await supabase.from("applications").insert({
      opportunity_id: selectedOpp.id,
      volunteer_id: user.id,
      ngo_id: selectedOpp.ngo_id,
      status: "pending",
    });

    setSubmitting(false);
    if (error) {
      showToastMsg("Error: " + error.message, "error");
    } else {
      setAppliedIds(prev => new Set([...prev, selectedOpp.id]));
      showToastMsg("✅ Application submitted successfully!");
      closeModal();
    }
  };

  const allLocations = ["All", ...new Set(opportunities.map(o => o.location).filter(Boolean))];
  const allTypes = ["All", ...new Set(opportunities.map(o => o.type).filter(Boolean))];

  const filtered = opportunities.filter((opp) => {
    const searchMatch = !search || opp.title?.toLowerCase().includes(search.toLowerCase());
    const categoryMatch = selectedCategory === "All" || opp.category === selectedCategory;
    const locationMatch = selectedLocation === "All" || opp.location === selectedLocation;
    const typeMatch = selectedType === "All" || opp.type === selectedType;
    return searchMatch && categoryMatch && locationMatch && typeMatch;
  });

  if (loading) return <div className="opp-page"><div className="opp-loading">Loading opportunities...</div></div>;

  return (
    <div className="opp-page">
      {toast.show && (
        <div className={`opp-toast ${toast.type}`}><span>{toast.message}</span></div>
      )}

      <div className="opp-header">
        <h1>Volunteer Opportunities</h1>
        <p>Find meaningful ways to contribute to your community</p>
      </div>

      <div className="opp-filters">
        <input
          type="text"
          placeholder="Search opportunities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="opp-search"
        />
        <div className="opp-categories">
          {categories.map((cat) => (
            <button
              key={cat}
              className={selectedCategory === cat ? "active" : ""}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="opp-extra-filters">
          <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="opp-filter-select">
            {allLocations.map((loc) => <option key={loc} value={loc}>📍 {loc}</option>)}
          </select>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="opp-filter-select">
            {allTypes.map((t) => <option key={t} value={t}>⏰ {t}</option>)}
          </select>
        </div>
      </div>

      {profile?.role === "ngo" && (
        <div className="opp-cta">
          <Link to="/opportunity/create" className="opp-btn-primary">+ Create New Opportunity</Link>
        </div>
      )}

      <div className="opp-grid">
        {filtered.length === 0 ? (
          <p className="opp-empty">No opportunities found.</p>
        ) : (
          filtered.map((opp) => (
            <div key={opp.id} className="opp-card" onClick={() => navigate(`/opportunities/${opp.id}`)}>
              <div className="opp-card-top">
                <span className="opp-cat-badge">{opp.category}</span>
                <span className="opp-type-badge">{opp.type}</span>
              </div>
              <h3>{opp.title}</h3>
              <p className="opp-ngo">🏛️ {opp.ngo_name || "NGO"}</p>
              <p className="opp-loc">📍 {opp.location}</p>
              <p className="opp-desc">{opp.description}</p>
              
              {user && appliedIds.has(opp.id) ? (
                <span className="opp-applied-badge">✓ Applied</span>
              ) : (!user || profile?.role === "volunteer") && (
                <button 
                  className="opp-apply-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    openApplyModal(opp);
                  }}
                >
                  Apply Now
                </button>
              )}
              {profile?.role === "ngo" && (
                <span className="opp-posted-badge">Posted</span>
              )}

              {user && profile?.role !== "ngo" && (
                <button
                  className="opp-report-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReportModal({
                      reportedId: opp.ngo_id,
                      reportedName: opp.ngo_name || "This Opportunity",
                      type: "ngo"
                    });
                  }}
                >
                  🚨 Report Fake / Scam
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && selectedOpp && (
        <div className="opp-modal-overlay" onClick={closeModal}>
          <div className="opp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="opp-modal-header">
              <h2>Apply for: {selectedOpp.title}</h2>
              <button className="opp-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="opp-modal-info">
              <p><strong>🏛️ NGO:</strong> {selectedOpp.ngo_name || "NGO"}</p>
              <p><strong>📍 Location:</strong> {selectedOpp.location}</p>
              <p><strong>🏷️ Category:</strong> {selectedOpp.category}</p>
            </div>
            <form onSubmit={handleApplySubmit} className="opp-modal-form">
              <div className="opp-form-group">
                <label>Relevant Experience *</label>
                <textarea rows="3" placeholder="Tell us about your relevant experience..." value={experience} onChange={(e) => setExperience(e.target.value)} required />
              </div>
              <div className="opp-form-group">
                <label>Why do you want to volunteer? *</label>
                <textarea rows="3" placeholder="Share your motivation..." value={motivation} onChange={(e) => setMotivation(e.target.value)} required />
              </div>
              <div className="opp-form-group">
                <label>Availability *</label>
                <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
                  <option>Weekdays</option>
                  <option>Weekends</option>
                  <option>Both</option>
                  <option>Flexible</option>
                </select>
              </div>
              <div className="opp-modal-actions">
                <button type="button" className="opp-btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="opp-btn-submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default Opportunities;