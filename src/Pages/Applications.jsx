import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./Applications.css";

function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("applications")
          .select(`
            *,
            opportunities:opportunity_id (title, location, category, ngo_name)
          `)
          .eq("volunteer_id", user.id)
          .order("applied_at", { ascending: false });

        setApplications(data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  // ✅ CANCEL APPLICATION
  const handleCancel = async (appId) => {
    if (!window.confirm("Are you sure you want to cancel this application?")) return;
    const { error } = await supabase.from("applications").delete().eq("id", appId);
    if (error) {
      showToast("Failed to cancel: " + error.message, "error");
    } else {
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      showToast("Application cancelled successfully", "success");
    }
  };

  const filtered = applications.filter((app) => {
    if (filter === "all") return true;
    return app.status?.toLowerCase() === filter.toLowerCase();
  });

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status?.toLowerCase() === "pending").length,
    approved: applications.filter((a) => a.status?.toLowerCase() === "approved").length,
    rejected: applications.filter((a) => a.status?.toLowerCase() === "rejected").length,
  };

  const getStatusClass = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved") return "status-approved";
    if (s === "rejected") return "status-rejected";
    return "status-pending";
  };

  if (loading) return <div className="app-page"><div className="app-loading">Loading applications...</div></div>;

  return (
    <div className="app-page">
      {toast.show && <div className={`app-toast ${toast.type}`}>{toast.msg}</div>}

      <div className="app-header">
        <h1>My Applications</h1>
        <p>Track all your volunteer applications in one place</p>
      </div>

      <div className="app-filters">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} <span>{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="app-list">
        {filtered.length === 0 ? (
          <div className="app-empty">
            <p>No {filter !== "all" ? filter : ""} applications found.</p>
            <Link to="/opportunities" className="app-btn">Browse Opportunities</Link>
          </div>
        ) : (
          filtered.map((app) => {
            const opp = app.opportunities || {};
            const isPending = app.status?.toLowerCase() === "pending";
            return (
              <div key={app.id} className="app-card">
                <div className="app-card-left">
                  <div className="app-icon">🏛️</div>
                  <div>
                    <h3>{opp.title || "Opportunity"}</h3>
                    <p className="app-meta">🏛 {opp.ngo_name || "NGO"} · 📍 {opp.location || "Remote"}</p>
                    <p className="app-date">Applied on {new Date(app.applied_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="app-card-right">
                  <span className={`app-status ${getStatusClass(app.status)}`}>{app.status}</span>
                  {isPending && (
                    <button 
                      className="app-cancel-btn"
                      onClick={() => handleCancel(app.id)}
                      title="Cancel application"
                    >
                      ✕ Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Applications;