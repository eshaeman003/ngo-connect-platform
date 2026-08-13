import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./VolunteerDashboard.css";

function VolunteerDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogHours, setShowLogHours] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [logForm, setLogForm] = useState({ oppId: "", hours: "" });
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  const GOAL_HOURS = 60;

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(prof);

        const { data: oppData } = await supabase.from("opportunities").select("*");
        setOpportunities(oppData || []);

        const { data: appData } = await supabase
          .from("applications")
          .select(`*, opportunities:opportunity_id (title, location, category, ngo_name, created_at)`)
          .eq("volunteer_id", user.id)
          .order("applied_at", { ascending: false });
        setApplications(appData || []);

        const { data: compData } = await supabase
          .from("complaints")
          .select("*")
          .eq("reporter_id", user.id)
          .order("created_at", { ascending: false });
        setMyComplaints(compData || []);
      }
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel("volunteer-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "applications",
          filter: `volunteer_id=eq.${user?.id}`,
        },
        async (payload) => {
          const { data: oppData } = await supabase
            .from("opportunities")
            .select("title, location, category, ngo_name")
            .eq("id", payload.new.opportunity_id)
            .single();
          const newApp = { ...payload.new, opportunities: oppData || {} };
          setApplications((prev) => [newApp, ...prev]);
          showToast(`🆕 Application submitted for ${oppData?.title || "opportunity"}!`, "success");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `volunteer_id=eq.${user?.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;
          if (newStatus !== oldStatus) {
            showToast(`Your application was ${newStatus.toLowerCase()}!`, "success");
          }
          setApplications((prev) =>
            prev.map((a) => (a.id === payload.new.id ? { ...a, status: newStatus } : a))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const handleCancelApplication = async (appId) => {
    if (!window.confirm("Cancel this application?")) return;
    const { error } = await supabase.from("applications").delete().eq("id", appId);
    if (error) showToast("Error cancelling application", "error");
    else {
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      showToast("Application cancelled successfully", "success");
    }
  };

  const getOpp = (app) => app.opportunities || {};
  const approvedApps = applications.filter((a) => a.status?.toLowerCase() === "approved");
  const pendingApps = applications.filter((a) => a.status?.toLowerCase() === "pending");
  const rejectedApps = applications.filter((a) => a.status?.toLowerCase() === "rejected");
  const totalHours = approvedApps.length * 12;
  const progressPercent = Math.min((totalHours / GOAL_HOURS) * 100, 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const upcomingEvents = approvedApps
    .map((app) => {
      const opp = getOpp(app);
      return opp ? { ...opp, appStatus: app.status } : null;
    })
    .filter(Boolean);

  const handleLogHours = (e) => {
    e.preventDefault();
    showToast(`Logged ${logForm.hours} hours!`, "success");
    setShowLogHours(false);
    setLogForm({ oppId: "", hours: "" });
  };

  const handleDownloadCertificate = () => {
    const certWindow = window.open("", "_blank");
    if (!certWindow) {
      showToast("Popup blocked! Allow popups for this site.", "error");
      return;
    }
    
    const certHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Certificate - NGO Connect</title>
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            background: #f5f5f0; 
            font-family: 'Inter', sans-serif; 
            padding: 20px;
          }
          .cert { 
            width: 100%; 
            max-width: 900px; 
            background: linear-gradient(135deg, #fff 0%, #faf8f3 100%); 
            border: 12px solid #1B3A28; 
            padding: 60px 70px; 
            position: relative; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.15); 
          }
          .cert-border { 
            position: absolute; 
            inset: 8px; 
            border: 2px solid #B8792A; 
            pointer-events: none; 
          }
          .cert-header { 
            text-align: center; 
            margin-bottom: 40px; 
          }
          .cert-logo { 
            font-size: 40px; 
            margin-bottom: 10px; 
          }
          .cert-org { 
            font-family: 'Fraunces', serif; 
            font-size: 20px; 
            color: #1B3A28; 
            font-weight: 600; 
            letter-spacing: 3px; 
            text-transform: uppercase;
          }
          .cert-title { 
            font-family: 'Fraunces', serif; 
            font-size: 48px; 
            color: #1B3A28; 
            text-align: center; 
            margin-bottom: 12px; 
            line-height: 1.2;
          }
          .cert-sub { 
            text-align: center; 
            color: #6B7268; 
            font-size: 18px; 
            margin-bottom: 30px; 
          }
          .cert-name { 
            font-family: 'Fraunces', serif; 
            font-size: 42px; 
            color: #B8792A; 
            text-align: center; 
            margin: 24px 0; 
            padding-bottom: 14px; 
            border-bottom: 3px solid #E4E0D6; 
          }
          .cert-body { 
            text-align: center; 
            font-size: 16px; 
            color: #1C2B22; 
            line-height: 1.8; 
            margin-bottom: 50px; 
          }
          .cert-body b { 
            color: #1B3A28; 
            font-weight: 600;
          }
          .cert-footer { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
            margin-top: 60px; 
            padding: 0 20px;
          }
          .cert-sig { 
            text-align: center; 
          }
          .cert-sig-line { 
            width: 160px; 
            height: 2px; 
            background: #1B3A28; 
            margin-bottom: 8px; 
          }
          .cert-sig-label { 
            font-size: 12px; 
            color: #6B7268; 
            text-transform: uppercase; 
            letter-spacing: 1.5px; 
          }
          .cert-stamp { 
            position: absolute; 
            bottom: 50px; 
            right: 60px; 
            width: 90px; 
            height: 90px; 
            border: 3px solid #B8792A; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #B8792A; 
            font-size: 11px; 
            font-weight: 700; 
            text-transform: uppercase; 
            text-align: center; 
            line-height: 1.3; 
            transform: rotate(-15deg); 
            opacity: 0.8; 
          }
          .cert-badge {
            display: inline-block;
            background: #E7EFEA;
            color: #1F4038;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            margin-top: 10px;
          }
          @media print { 
            body { background: white; } 
            .cert { box-shadow: none; max-width: 100%; } 
          }
          @media (max-width: 768px) {
            .cert { padding: 40px 30px; }
            .cert-title { font-size: 32px; }
            .cert-name { font-size: 28px; }
            .cert-body { font-size: 14px; }
            .cert-footer { flex-direction: column; gap: 30px; align-items: center; }
            .cert-stamp { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="cert">
          <div class="cert-border"></div>
          <div class="cert-header">
            <div class="cert-logo">🌿</div>
            <div class="cert-org">NGO Connect Platform</div>
          </div>
          <div class="cert-title">Certificate<br>of Appreciation</div>
          <div class="cert-sub">This certificate is proudly presented to</div>
          <div class="cert-name">${profile?.full_name || "Volunteer"}</div>
          <div class="cert-body">
            For dedicating <b>${totalHours} volunteer hours</b> to community service<br>
            through various NGO opportunities and making a positive impact.<br>
            <span class="cert-badge">${totalHours >= GOAL_HOURS ? 'Goal Achieved 🏆' : 'In Progress'}</span>
          </div>
          <div class="cert-footer">
            <div class="cert-sig">
              <div class="cert-sig-line"></div>
              <div class="cert-sig-label">${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
            </div>
            <div class="cert-sig">
              <div class="cert-sig-line"></div>
              <div class="cert-sig-label">Director, NGO Connect</div>
            </div>
          </div>
          <div class="cert-stamp">Official<br>Seal</div>
        </div>
        <script>
          window.onload = () => { 
            setTimeout(() => {
              document.title = "Certificate - ${profile?.full_name || 'Volunteer'}";
              window.print();
            }, 800); 
          }
        </script>
      </body>
      </html>
    `;
    
    certWindow.document.open();
    certWindow.document.write(certHTML);
    certWindow.document.close();
    showToast("Certificate opened! Save as PDF or print.", "success");
  };

  const getAppIcon = (title) => {
    const t = (title || "").toLowerCase();
    if (t.includes("tree") || t.includes("plant")) return "🌳";
    if (t.includes("blood")) return "🩸";
    if (t.includes("ration") || t.includes("pack")) return "📦";
    if (t.includes("school") || t.includes("teach") || t.includes("urdu")) return "📚";
    if (t.includes("food")) return "🍲";
    return "🤝";
  };

  const getActivityText = (app) => {
    const opp = getOpp(app);
    const title = opp?.title || "Opportunity";
    if (app.status?.toLowerCase() === "approved") return { bold: opp?.ngo_name || "NGO", text: `approved your application for ${title}.` };
    if (app.status?.toLowerCase() === "rejected") return { bold: opp?.ngo_name || "NGO", text: `rejected your application — event was full.` };
    return { bold: "You", text: `applied to ${title}.` };
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

  if (loading) return <div className="vd-loading">Loading your dashboard...</div>;

  return (
    <div className="volunteer-dashboard">
      {toast.show && <div className={`vd-toast ${toast.type}`}>{toast.msg}</div>}

      <section className="vd-hero">
        <div className="vd-hero-left">
          <h1>Assalam-o-Alaikum, {profile?.full_name || "Volunteer"} 👋</h1>
          <p>
            Volunteering since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Jul 2026"}
            <span className="vd-badge-pill">Level 2 Volunteer</span>
          </p>
        </div>
        <div className="vd-ring-wrap">
          <div className="vd-ring">
            <svg width="92" height="92" viewBox="0 0 92 92">
              <circle cx="46" cy="46" r="40" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="8"/>
              <circle cx="46" cy="46" r="40" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 46 46)"/>
            </svg>
            <div className="vd-ring-label">
              <b>{totalHours}</b>
              <span>/ {GOAL_HOURS} HRS</span>
            </div>
          </div>
          <div className="vd-ring-text">
            <b>{Math.round(progressPercent)}% to goal</b>
            {GOAL_HOURS - totalHours} hours left to unlock your Q3 certificate.
          </div>
        </div>
      </section>

      <section className="vd-stats">
        <div className="vd-stat-card total">
          <div className="vd-stat-top">
            <div className="vd-stat-icon-box">⏱️</div>
            <span className="vd-stat-trend">↑ {Math.min(totalHours, 6)} this week</span>
          </div>
          <div className="vd-stat-label">Total hours</div>
          <div className="vd-stat-value">{totalHours}</div>
        </div>
        <div className="vd-stat-card approved">
          <div className="vd-stat-top"><div className="vd-stat-icon-box">✓</div></div>
          <div className="vd-stat-label">Approved</div>
          <div className="vd-stat-value">{approvedApps.length}</div>
        </div>
        <div className="vd-stat-card pending">
          <div className="vd-stat-top"><div className="vd-stat-icon-box">◔</div></div>
          <div className="vd-stat-label">Pending review</div>
          <div className="vd-stat-value">{pendingApps.length}</div>
        </div>
        <div className="vd-stat-card rejected">
          <div className="vd-stat-top"><div className="vd-stat-icon-box">✕</div></div>
          <div className="vd-stat-label">Rejected</div>
          <div className="vd-stat-value">{rejectedApps.length}</div>
        </div>
      </section>

      <section className="vd-grid">
        <div className="vd-left-col">
          <div className="vd-panel">
            <div className="vd-panel-head">
              <h2>My applications</h2>
              <Link to="/applications" className="vd-viewall">View all →</Link>
            </div>

            {applications.length === 0 ? (
              <div className="vd-empty">
                <p>No applications yet.</p>
                <Link to="/opportunities" className="vd-btn-primary">Find Opportunities</Link>
              </div>
            ) : (
              applications.map((app) => {
                const opp = getOpp(app);
                const isPending = app.status?.toLowerCase() === "pending";
                return (
                  <div key={app.id} className="vd-app-row">
                    <div className="vd-app-icon">{getAppIcon(opp.title)}</div>
                    <div className="vd-app-info">
                      <div className="vd-app-title">{opp.title || "Opportunity"}</div>
                      <div className="vd-app-meta">
                        {opp.ngo_name || "NGO"} · {opp.location || "Remote"} · {" "}
                        <span className={`vd-status vd-status-${app.status?.toLowerCase() || "pending"}`}>
                          {app.status || "Pending"}
                        </span>
                      </div>
                    </div>
                    <div className="vd-app-actions">
                      {isPending && (
                        <button className="vd-btn-ghost" onClick={() => handleCancelApplication(app.id)}>
                          Cancel
                        </button>
                      )}
                      <Link to={`/opportunities/${app.opportunity_id}`} className="vd-btn-link">View →</Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="vd-panel" style={{ marginTop: "24px" }}>
            <div className="vd-panel-head">
              <h2>🚨 My Reports & Complaints</h2>
              <span className="vd-panel-meta">{myComplaints.length} filed</span>
            </div>
            
            {myComplaints.length === 0 ? (
              <div className="vd-empty">
                <p>You haven't filed any reports yet.</p>
                <span style={{ fontSize: "13px", color: "#6B7268" }}>
                  Report fake posts or scam NGOs from their detail pages.
                </span>
              </div>
            ) : (
              <div className="vd-complaints-list">
                {myComplaints.map((c) => (
                  <div key={c.id} className="vd-complaint-row">
                    <div className="vd-complaint-icon">📝</div>
                    <div className="vd-complaint-info">
                      <div className="vd-complaint-title">
                        Reported <strong>{c.reported_name || "Unknown"}</strong>
                        <span className={`vd-status ${getComplaintStatusClass(c.status)}`}>
                          {getComplaintStatusLabel(c.status)}
                        </span>
                      </div>
                      <div className="vd-complaint-meta">
                        {c.reason} · {new Date(c.created_at).toLocaleDateString()}
                      </div>
                      {c.admin_notes && (
                        <div className="vd-complaint-note">
                          <b>Admin note:</b> {c.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="vd-right-col">
          <div className="vd-panel vd-actions">
            <h3>Quick actions</h3>
            <button className="vd-action-btn" onClick={() => setShowLogHours(true)}>
              <span>⏱️</span> Log hours
            </button>
            <button className="vd-action-btn" onClick={() => setShowCertificate(true)}>
              <span>📜</span> Get certificate
            </button>
            <Link to="/opportunities" className="vd-action-btn">
              <span>🔍</span> Find opportunities
            </Link>
            <Link to="/volunteer/profile" className="vd-action-btn">
              <span>👤</span> Edit profile
            </Link>
          </div>

          <div className="vd-panel vd-upcoming">
            <div className="vd-panel-head"><h2>Upcoming events</h2></div>
            {upcomingEvents.length === 0 ? (
              <div className="vd-empty-small">No upcoming events.</div>
            ) : (
              upcomingEvents.slice(0, 4).map((evt, i) => (
                <div key={i} className="vd-event-row">
                  <div className="vd-event-date">
                    <b>{new Date(evt.created_at).toLocaleDateString("en-US", { day: "numeric" })}</b>
                    <span>{new Date(evt.created_at).toLocaleDateString("en-US", { month: "short" })}</span>
                  </div>
                  <div className="vd-event-info">
                    <div className="vd-event-title">{evt.title}</div>
                    <div className="vd-event-loc">{evt.location || "Remote"}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="vd-panel vd-activity">
            <div className="vd-panel-head"><h2>Recent activity</h2></div>
            {applications.slice(0, 5).map((app, i) => {
              const act = getActivityText(app);
              return (
                <div key={i} className="vd-activity-row">
                  <div className="vd-activity-dot" />
                  <div>
                    <b>{act.bold}</b> {act.text}
                    <div className="vd-activity-time">{new Date(app.applied_at).toLocaleDateString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {showLogHours && (
        <div className="vd-modal-overlay" onClick={() => setShowLogHours(false)}>
          <div className="vd-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Log volunteer hours</h3>
            <form onSubmit={handleLogHours}>
              <label>Opportunity</label>
              <select required value={logForm.oppId} onChange={(e) => setLogForm({ ...logForm, oppId: e.target.value })}>
                <option value="">Select opportunity</option>
                {approvedApps.map((app) => {
                  const opp = getOpp(app);
                  return <option key={app.id} value={app.id}>{opp.title}</option>;
                })}
              </select>
              <label>Hours</label>
              <input type="number" required min="1" max="24" value={logForm.hours} onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })} />
              <div className="vd-modal-actions">
                <button type="button" className="vd-btn-secondary" onClick={() => setShowLogHours(false)}>Cancel</button>
                <button type="submit" className="vd-btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCertificate && (
        <div className="vd-modal-overlay" onClick={() => setShowCertificate(false)}>
          <div className="vd-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🏆 Download Certificate</h3>
            <p style={{ color: "#6B7268", fontSize: "14px", lineHeight: 1.6, marginBottom: "8px" }}>
              You've completed <b>{totalHours} hours</b> of volunteer work. 
              {totalHours >= GOAL_HOURS 
                ? " Congratulations! You can now download your certificate." 
                : ` Complete ${GOAL_HOURS - totalHours} more hours to officially unlock your certificate.`}
            </p>
            <div className="vd-modal-actions">
              <button className="vd-btn-secondary" onClick={() => setShowCertificate(false)}>Close</button>
              <button className="vd-btn-primary" onClick={handleDownloadCertificate}>
                {totalHours >= GOAL_HOURS ? "Download Certificate" : "Preview Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VolunteerDashboard;