import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./NGODashboard.css";

function NGODashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ngo, setNgo] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const notifRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData?.user;
        if (!currentUser) {
          if (isMounted) { setError("Please login first."); setLoading(false); }
          return;
        }
        if (isMounted) setUser(currentUser);

        let ngoData = null;
        const { data: byUser } = await supabase.from("ngos").select("*").eq("user_id", currentUser.id).maybeSingle();
        if (byUser) ngoData = byUser;
        else {
          const { data: byEmail } = await supabase.from("ngos").select("*").eq("email", currentUser.email).maybeSingle();
          if (byEmail) ngoData = byEmail;
        }

        if (!isMounted) return;
        if (!ngoData) { setError("NGO profile not found."); setLoading(false); return; }
        if (ngoData.suspended) { setError("Account suspended."); await supabase.auth.signOut(); setLoading(false); return; }
        setNgo(ngoData);

        // Fetch opportunities
        let ops = [];
        const ngoId = ngoData.id;
        const userId = currentUser.id;
        const ngoName = ngoData.name;

        const strategies = [
          () => supabase.from("opportunities").select("*").eq("ngo_id", ngoId).order("created_at", { ascending: false }),
          () => supabase.from("opportunities").select("*").eq("created_by", userId).order("created_at", { ascending: false }),
          () => supabase.from("opportunities").select("*").ilike("ngo_name", `%${ngoName}%`).order("created_at", { ascending: false }),
        ];

        for (const strat of strategies) {
          if (ops.length > 0) break;
          try {
            const { data, error } = await strat();
            if (!error && data?.length > 0) ops = data;
          } catch (e) {}
        }

        if (ops.length === 0) {
          try {
            const { data } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false }).limit(200);
            if (data) {
              ops = data.filter(op => op.ngo_id === ngoId || op.created_by === userId || (ngoName && op.ngo_name?.toLowerCase().includes(ngoName.toLowerCase())));
            }
          } catch (e) {}
        }

        if (isMounted) setOpportunities(ops || []);
        const opIds = (ops || []).map(o => o.id).filter(Boolean);

        // Fetch applications
        let apps = [];
        const tables = ["applications", "applies", "volunteer_applications", "apply"];
        for (const table of tables) {
          if (apps.length > 0) break;

          if (opIds.length > 0) {
            try {
              const { data } = await supabase.from(table).select("*").in("opportunity_id", opIds).order("created_at", { ascending: false });
              if (data?.length > 0) { apps = data; break; }
            } catch (e) {}
          }

          try {
            const { data } = await supabase.from(table).select("*").eq("ngo_id", ngoId).order("created_at", { ascending: false });
            if (data?.length > 0) { apps = data; break; }
          } catch (e) {}

          if (opIds.length > 0) {
            try {
              const { data } = await supabase.from(table).select("*").order("created_at", { ascending: false }).limit(500);
              if (data) {
                const filtered = data.filter(a => opIds.includes(a.opportunity_id));
                if (filtered.length > 0) { apps = filtered; break; }
              }
            } catch (e) {}
          }
        }

        if (isMounted) setApplications(apps || []);

        // Fetch complaints against this NGO
        let comps = [];
        const compTables = ["complaints", "reports", "ngo_complaints", "user_reports"];
        for (const table of compTables) {
          if (comps.length > 0) break;

          // Try by ngo_id
          try {
            const { data } = await supabase.from(table).select("*").eq("ngo_id", ngoId).order("created_at", { ascending: false });
            if (data?.length > 0) { comps = data; break; }
          } catch (e) {}

          // Try by reported_ngo_id
          try {
            const { data } = await supabase.from(table).select("*").eq("reported_ngo_id", ngoId).order("created_at", { ascending: false });
            if (data?.length > 0) { comps = data; break; }
          } catch (e) {}

          // Try by opportunity_id
          if (opIds.length > 0) {
            try {
              const { data } = await supabase.from(table).select("*").in("opportunity_id", opIds).order("created_at", { ascending: false });
              if (data?.length > 0) { comps = data; break; }
            } catch (e) {}
          }

          // Fetch all and filter
          try {
            const { data } = await supabase.from(table).select("*").order("created_at", { ascending: false }).limit(200);
            if (data) {
              const filtered = data.filter(c => c.ngo_id === ngoId || c.reported_ngo_id === ngoId || opIds.includes(c.opportunity_id));
              if (filtered.length > 0) { comps = filtered; break; }
            }
          } catch (e) {}
        }

        if (isMounted) setComplaints(comps || []);

        // Fetch notifications
        try {
          const { data } = await supabase.from("notifications").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(20);
          if (isMounted && data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
          }
        } catch (e) {}

        setLoading(false);
      } catch (err) {
        console.error(err);
        if (isMounted) { setError("Something went wrong."); setLoading(false); }
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Realtime notifications
  useEffect(() => {
    if (!user) return;
    let channel = null;

    const setup = async () => {
      channel = supabase
        .channel(`ngo-notifs-${user.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const notif = payload.new;
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();
    };

    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user]);

  const markRead = async (id) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifPanel(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleDeleteOpp = async (id) => {
    if (!window.confirm("Delete this opportunity?")) return;
    await supabase.from("opportunities").delete().eq("id", id);
    setOpportunities(prev => prev.filter(o => o.id !== id));
  };

  if (loading) {
    return (
      <div className="ngo-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ngo-dashboard">
        <div className="error-box">
          <h3>⚠️ Error</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  const totalOpps = opportunities.length;
  const totalApps = applications.length;
  const pendingApps = applications.filter(a => a.status === "pending" || !a.status).length;
  const approvedApps = applications.filter(a => a.status === "approved").length;

  return (
    <div className="ngo-dashboard">
      {/* ─── Header ─── */}
      <div className="ngo-header">
        <div className="ngo-header-left">
          <h1>{ngo?.name || "NGO Dashboard"}</h1>
          <div className="ngo-status">
            <span className="status-label">Status:</span>
            <span className="status-badge">{ngo?.approval_status || "approved"}</span>
          </div>
        </div>
        <div className="ngo-header-right">
          <div className="notif-wrapper" ref={notifRef}>
            <button className="notif-bell" onClick={() => setShowNotifPanel(!showNotifPanel)} title="Notifications">
              🔔
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            {showNotifPanel && (
              <div className="notif-panel">
                <div className="notif-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && <button className="mark-all-btn" onClick={markAllRead}>Mark all read</button>}
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <p className="notif-empty">No notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notif-item ${!n.read ? "unread" : ""} ${n.type || "general"}`} onClick={() => markRead(n.id)}>
                        <strong>{n.title}</strong>
                        <p>{n.message}</p>
                        <small>{new Date(n.created_at).toLocaleString()}</small>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button className="btn-post" onClick={() => navigate("/opportunity/create")}>+ Post Opportunity</button>
          <button className="btn-edit-profile" onClick={() => navigate("/ngo/profile")}>Edit Profile</button>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-number">{totalOpps}</div>
          <div className="stat-label">Opportunities</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{totalApps}</div>
          <div className="stat-label">Applications</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{approvedApps}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{pendingApps}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      {/* ─── Two Column Layout ─── */}
      <div className="dashboard-columns">
        {/* Left Column */}
        <div className="column-left">
          {/* My Opportunities */}
          <div className="card">
            <div className="card-header">
              <h3>📋 My Opportunities</h3>
            </div>
            {opportunities.length === 0 ? (
              <div className="card-empty">
                <p>No opportunities yet.</p>
                <button className="btn-primary" onClick={() => navigate("/opportunity/create")}>Create Opportunity</button>
              </div>
            ) : (
              <div className="opp-list">
                {opportunities.map(op => (
                  <div className="opp-item" key={op.id}>
                    <div className="opp-info">
                      <div className="opp-title">{op.title}</div>
                      <div className="opp-meta">
                        {op.location} · {op.type || "One-time"} · {new Date(op.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="opp-actions">
                      <button className="btn-edit-small" onClick={() => navigate(`/opportunity/edit/${op.id}`)}>Edit</button>
                      <button className="btn-delete-small" onClick={() => handleDeleteOpp(op.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applications Received */}
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <h3>📝 Applications Received</h3>
            </div>
            {applications.length === 0 ? (
              <div className="card-empty">
                <p>No applications received yet.</p>
              </div>
            ) : (
              <div className="app-list">
                {applications.map(app => (
                  <div className="app-item" key={app.id}>
                    <div className="app-info">
                      <div className="app-name">{app.applicant_name || app.name || app.volunteer_name || "Unknown"}</div>
                      <div className="app-meta">
                        {app.email || app.volunteer_email || ""} · {app.opportunity_title || app.title || "Opportunity"}
                      </div>
                    </div>
                    <span className={`app-status ${app.status || "approved"}`}>{app.status || "approved"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🚨 Complaints Against Your NGO */}
          <div className="card complaints-card" style={{ marginTop: 24 }}>
            <div className="card-header complaints-header">
              <h3>🚨 Complaints Against Your NGO</h3>
              {complaints.length > 0 && (
                <span className="complaint-count">{complaints.length} received</span>
              )}
            </div>
            {complaints.length === 0 ? (
              <div className="card-empty">
                <p>No complaints received. Great job!</p>
              </div>
            ) : (
              <div className="complaint-list">
                {complaints.map(comp => (
                  <div className="complaint-item" key={comp.id}>
                    <div className="complaint-icon">⚠️</div>
                    <div className="complaint-body">
                      <div className="complaint-top">
                        <span className="complaint-reporter">A volunteer reported you</span>
                        <span className={`complaint-status ${comp.status || "resolved"}`}>{comp.status || "resolved"}</span>
                      </div>
                      <div className="complaint-reason">{comp.reason || comp.message || comp.description || "No details provided"}</div>
                      <div className="complaint-date">{new Date(comp.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="column-right">
          <div className="card profile-card">
            <div className="card-header">
              <h3>🏢 NGO Profile</h3>
            </div>
            <div className="profile-fields">
              <div className="profile-field">
                <span className="field-label">Category:</span>
                <span className="field-value">{ngo?.category || "General"}</span>
              </div>
              <div className="profile-field">
                <span className="field-label">Location:</span>
                <span className="field-value">{ngo?.location || "N/A"}</span>
              </div>
              <div className="profile-field">
                <span className="field-label">Email:</span>
                <span className="field-value">{ngo?.email || "N/A"}</span>
              </div>
              <div className="profile-field">
                <span className="field-label">Phone:</span>
                <span className="field-value">{ngo?.phone || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NGODashboard;