import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./VolunteerDashboard.css";

function VolunteerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  // Fetch all data
  const fetchData = async (userId) => {
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(prof);

      const { data: apps } = await supabase
        .from("applications")
        .select(`*, opportunities:opportunity_id (title, ngo_name, location, category)`)
        .eq("volunteer_id", userId)
        .order("applied_at", { ascending: false });
      setApplications(apps || []);

      await fetchMyComplaints(userId);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // Fetch complaints filed BY this volunteer
  const fetchMyComplaints = async (userId) => {
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false });
    setMyComplaints(data || []);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/login");
        return;
      }
      setUser(authUser);
      await fetchData(authUser.id);
      setLoading(false);
    };
    init();
  }, [navigate]);

  // 🔥 POLLING: Har 5 sec mein complaints refresh jab admin status change kare
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      fetchMyComplaints(user.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleCancelApp = async (appId) => {
    if (!window.confirm("Cancel this application?")) return;
    const { error } = await supabase.from("applications").delete().eq("id", appId);
    if (error) showToast("Error cancelling", "error");
    else {
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      showToast("Application cancelled.");
    }
  };

  const getStatusClass = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "resolved") return "s-approved";
    if (s === "dismissed") return "s-rejected";
    if (s === "investigating") return "s-pending";
    return "s-pending";
  };

  const getStatusLabel = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "resolved") return "Resolved ✅";
    if (s === "dismissed") return "Dismissed ❌";
    if (s === "investigating") return "Investigating 🔍";
    return "Pending 🚨";
  };

  if (loading) return <div className="vol-loading">Loading dashboard...</div>;

  return (
    <div className="vol-dashboard">
      {toast.show && <div className={`vol-toast ${toast.type}`}>{toast.msg}</div>}

      <div className="vol-header">
        <div>
          <h1>Hello, {profile?.full_name || "Volunteer"} 👋</h1>
          <p>Track your applications, hours, and impact</p>
        </div>
        <Link to="/volunteer/profile" className="vol-btn-secondary">Edit Profile</Link>
      </div>

      <div className="vol-grid">
        <div className="vol-left">
          {/* Applications */}
          <div className="vol-panel">
            <div className="vol-panel-head">
              <h2>My Applications</h2>
              <Link to="/opportunities" className="vol-link">Find opportunities →</Link>
            </div>
            {applications.length === 0 ? (
              <div className="vol-empty">No applications yet. <Link to="/opportunities">Browse now →</Link></div>
            ) : (
              applications.map((app) => {
                const opp = app.opportunities || {};
                const status = (app.status || "pending").toLowerCase();
                return (
                  <div key={app.id} className="vol-app-row">
                    <div className="vol-app-icon">{opp.category?.charAt(0) || "🌿"}</div>
                    <div className="vol-app-info">
                      <div className="vol-app-title">{opp.title || "Opportunity"}</div>
                      <div className="vol-app-meta">
                        {opp.ngo_name || "NGO"} · {opp.location || "Remote"} · 
                        <span className={`vol-status s-${status}`}>{app.status || "Pending"}</span>
                      </div>
                    </div>
                    <div className="vol-app-actions">
                      {status === "pending" && (
                        <button className="vol-btn-cancel" onClick={() => handleCancelApp(app.id)}>Cancel</button>
                      )}
                      <Link to={`/opportunities/${app.opportunity_id}`} className="vol-btn-view">View →</Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 🔥 My Reports & Complaints — Auto-updating */}
          <div className="vol-panel" style={{ marginTop: "24px", border: "1.5px solid #FBE9E7" }}>
            <div className="vol-panel-head">
              <h2 style={{ color: "#B24444" }}>🚨 My Reports & Complaints</h2>
              <span className="vol-panel-meta">{myComplaints.length} filed</span>
            </div>
            {myComplaints.length === 0 ? (
              <div className="vol-empty">No reports filed yet.</div>
            ) : (
              <div className="vol-complaints-list">
                {myComplaints.map((c) => (
                  <div key={c.id} className="vol-complaint-row">
                    <div className="vol-complaint-icon">📝</div>
                    <div className="vol-complaint-info">
                      <div className="vol-complaint-title">
                        <strong>Reported {c.reported_name || "NGO"}</strong>
                        <span className={`status-pill ${getStatusClass(c.status)}`}>
                          {getStatusLabel(c.status)}
                        </span>
                      </div>
                      <div className="vol-complaint-meta">
                        {c.reason} · {new Date(c.created_at).toLocaleDateString()}
                      </div>
                      {c.description && (
                        <div className="vol-complaint-desc">{c.description}</div>
                      )}
                      {c.admin_notes && (
                        <div className="vol-complaint-admin-note">
                          <b>Admin Update:</b> {c.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="vol-right">
          <div className="vol-panel vol-quick-actions">
            <h3>Quick Actions</h3>
            <button className="vol-action-btn">⏱ Log hours</button>
            <button className="vol-action-btn">📜 Get certificate</button>
            <Link to="/opportunities" className="vol-action-btn">🔍 Find opportunities</Link>
            <Link to="/volunteer/profile" className="vol-action-btn">👤 Edit profile</Link>
          </div>

          <div className="vol-panel" style={{ marginTop: "20px" }}>
            <h3>Upcoming Events</h3>
            <div className="vol-empty" style={{ padding: "1.5rem 0" }}>No upcoming events.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VolunteerDashboard;