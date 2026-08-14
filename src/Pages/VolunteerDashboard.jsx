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

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [viewApp, setViewApp] = useState(null);
  const [hours, setHours] = useState("");
  const [logNote, setLogNote] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  // Fetch complaints filed BY this volunteer
  const fetchMyComplaints = async (userId) => {
    console.log("[Volunteer Poll] Fetching complaints for:", userId);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Volunteer Poll] Error:", error);
      return;
    }

    console.log("[Volunteer Poll] Got:", data?.length || 0, "complaints", data);
    setMyComplaints(data || []);
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/login");
        return;
      }
      setUser(authUser);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();
      setProfile(prof);

      const { data: apps } = await supabase
        .from("applications")
        .select(`*, opportunities:opportunity_id (*)`)
        .eq("volunteer_id", authUser.id)
        .order("applied_at", { ascending: false });
      setApplications(apps || []);

      await fetchMyComplaints(authUser.id);
      setLoading(false);
    };
    init();
  }, [navigate]);

  // 🔥 POLLING: Har 3 sec mein complaints refresh
  useEffect(() => {
    if (!user?.id) return;
    console.log("[Volunteer Poll] Started for user:", user.id);

    const interval = setInterval(() => {
      fetchMyComplaints(user.id);
    }, 3000);

    return () => {
      console.log("[Volunteer Poll] Stopped");
      clearInterval(interval);
    };
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

  // Log Hours
  const handleLogHoursSubmit = (e) => {
    e.preventDefault();
    if (!hours || hours <= 0) {
      showToast("Please enter valid hours", "error");
      return;
    }
    showToast(`✅ ${hours} hours logged successfully!`);
    setShowLogModal(false);
    setHours("");
    setLogNote("");
  };

  // Certificate Download
  const handleGetCertificate = () => {
    const name = profile?.full_name || "Volunteer";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Certificate - ${name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Inter:wght@400;500&display=swap');
            body { margin: 0; padding: 0; background: #F7F5EF; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', sans-serif; }
            .cert { width: 900px; background: white; border: 12px solid #2F5D50; padding: 60px 80px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
            .cert-header { font-size: 18px; color: #8A8F86; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 30px; }
            .cert h1 { font-family: 'Fraunces', serif; font-size: 52px; color: #1B3A28; margin: 0 0 30px; }
            .cert-line { width: 120px; height: 3px; background: #B8792A; margin: 0 auto 30px; }
            .cert-text { font-size: 20px; color: #4B534E; line-height: 1.6; margin-bottom: 20px; }
            .cert-name { font-family: 'Fraunces', serif; font-size: 42px; color: #2F5D50; margin: 30px 0; font-weight: 600; }
            .cert-footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: center; padding-top: 30px; border-top: 1px solid #E4E0D6; }
            .cert-date { font-size: 14px; color: #8A8F86; }
            .cert-logo { font-family: 'Fraunces', serif; font-size: 18px; color: #1B3A28; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="cert">
            <div class="cert-header">NGO Connect</div>
            <h1>Certificate of Appreciation</h1>
            <div class="cert-line"></div>
            <div class="cert-text">This is to certify that</div>
            <div class="cert-name">${name}</div>
            <div class="cert-text">has demonstrated outstanding commitment and dedication<br>through their volunteer work with NGO Connect.<br>We recognize their valuable contribution to the community.</div>
            <div class="cert-footer"><div class="cert-date">Date: ${new Date().toLocaleDateString()}</div><div class="cert-logo">🌿 NGO Connect</div></div>
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Certificate_${name.replace(/\s+/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("📜 Certificate downloaded!");
  };

  const getComplaintStatusClass = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "resolved") return "s-approved";
    if (s === "dismissed") return "s-rejected";
    if (s === "investigating") return "s-pending";
    return "s-pending";
  };

  const getComplaintStatusLabel = (status) => {
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
        <div className="vol-header-left">
          <div className="vol-avatar-large">{profile?.full_name?.charAt(0) || "V"}</div>
          <div>
            <h1>Hello, {profile?.full_name || "Volunteer"} 👋</h1>
            <p>Track your applications, hours, and impact</p>
          </div>
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
                    <div className="vol-app-icon">{opp.title?.charAt(0) || "🌿"}</div>
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
                      <button className="vol-btn-view" onClick={() => setViewApp(app)}>View →</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Complaints */}
          <div className="vol-panel vol-complaints-panel">
            <div className="vol-panel-head">
              <h2>🚨 My Reports & Complaints</h2>
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
                        <span className={`status-pill ${getComplaintStatusClass(c.status)}`}>
                          {getComplaintStatusLabel(c.status)}
                        </span>
                      </div>
                      <div className="vol-complaint-meta">
                        {c.reason} · {new Date(c.created_at).toLocaleDateString()}
                      </div>
                      {c.description && <div className="vol-complaint-desc">{c.description}</div>}
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

        <div className="vol-right">
          <div className="vol-panel vol-quick-actions">
            <h3>Quick Actions</h3>
            <button className="vol-action-btn" onClick={() => setShowLogModal(true)}>⏱ Log hours</button>
            <button className="vol-action-btn" onClick={handleGetCertificate}>📜 Get certificate</button>
            <Link to="/opportunities" className="vol-action-btn">🔍 Find opportunities</Link>
            <Link to="/volunteer/profile" className="vol-action-btn">👤 Edit profile</Link>
          </div>

          <div className="vol-panel" style={{ marginTop: "20px" }}>
            <h3>Upcoming Events</h3>
            <div className="vol-empty" style={{ padding: "1.5rem 0" }}>No upcoming events.</div>
          </div>
        </div>
      </div>

      {/* Log Hours Modal */}
      {showLogModal && (
        <div className="vol-modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="vol-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vol-modal-header">
              <h2>⏱ Log Volunteer Hours</h2>
              <button className="vol-modal-close" onClick={() => setShowLogModal(false)}>✕</button>
            </div>
            <form onSubmit={handleLogHoursSubmit} className="vol-modal-form">
              <div className="vol-form-group">
                <label>Hours Worked *</label>
                <input type="number" min="0.5" step="0.5" placeholder="e.g., 4" value={hours} onChange={(e) => setHours(e.target.value)} required />
              </div>
              <div className="vol-form-group">
                <label>Note (optional)</label>
                <textarea rows="3" placeholder="What did you work on?" value={logNote} onChange={(e) => setLogNote(e.target.value)} />
              </div>
              <div className="vol-modal-actions">
                <button type="button" className="vol-btn-cancel" onClick={() => setShowLogModal(false)}>Cancel</button>
                <button type="submit" className="vol-btn-submit">Submit Hours</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Application Modal */}
      {viewApp && (
        <div className="vol-modal-overlay" onClick={() => setViewApp(null)}>
          <div className="vol-modal vol-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="vol-modal-header">
              <h2>Application Details</h2>
              <button className="vol-modal-close" onClick={() => setViewApp(null)}>✕</button>
            </div>
            <div className="vol-modal-body">
              <div className="vol-app-detail-section">
                <h3>🌿 Opportunity</h3>
                <p><strong>Title:</strong> {viewApp.opportunities?.title || "N/A"}</p>
                <p><strong>NGO:</strong> {viewApp.opportunities?.ngo_name || "N/A"}</p>
                <p><strong>Location:</strong> {viewApp.opportunities?.location || "Remote"}</p>
                <p><strong>Category:</strong> {viewApp.opportunities?.category || "General"}</p>
                <p><strong>Type:</strong> {viewApp.opportunities?.type || "N/A"}</p>
                {viewApp.opportunities?.description && <p className="vol-app-detail-desc">{viewApp.opportunities.description}</p>}
              </div>
              <div className="vol-app-detail-section" style={{ marginTop: "20px", borderTop: "1px solid #E4E0D6", paddingTop: "20px" }}>
                <h3>📝 Your Application</h3>
                <p><strong>Status:</strong> <span className={`vol-status s-${viewApp.status?.toLowerCase() || "pending"}`}>{viewApp.status || "Pending"}</span></p>
                <p><strong>Applied on:</strong> {new Date(viewApp.applied_at).toLocaleDateString()}</p>
                {viewApp.experience && <p><strong>Experience:</strong> {viewApp.experience}</p>}
                {viewApp.motivation && <p><strong>Motivation:</strong> {viewApp.motivation}</p>}
                {viewApp.availability && <p><strong>Availability:</strong> {viewApp.availability}</p>}
              </div>
            </div>
            <div className="vol-modal-footer">
              <button className="vol-btn-view" onClick={() => setViewApp(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VolunteerDashboard;