import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import {
  Bell, Plus, Pencil, ClipboardList, FileText, ShieldAlert,
  Building2, Trash2, AlertTriangle, Briefcase, CheckCircle2, Clock,
  Check, X, Download,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { useToastState, ToastHost } from "../components/Toast";
import { generateNoticePDF } from "../utils/generateNoticePDF";
import "./NGODashboard.css";

const CHART_COLORS = { approved: "#2d6a4f", pending: "#e8a33d", rejected: "#dc2626" };

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

        // Fetch opportunities — NGOs create opportunities with ngo_id set to
        // their own auth user id (see CreateOpportunity.jsx), so that is the
        // reliable filter. We keep the ngos.id and name-match attempts only
        // as a safety net for older/inconsistent rows.
        let ops = [];
        const ngoId = ngoData.id;
        const userId = currentUser.id;
        const ngoName = ngoData.name;

        const { data: opsByUser } = await supabase
          .from("opportunities")
          .select("*")
          .eq("ngo_id", userId)
          .order("created_at", { ascending: false });
        if (opsByUser?.length > 0) ops = opsByUser;

        if (ops.length === 0) {
          const { data: opsByNgoId } = await supabase
            .from("opportunities")
            .select("*")
            .eq("ngo_id", ngoId)
            .order("created_at", { ascending: false });
          if (opsByNgoId?.length > 0) ops = opsByNgoId;
        }

        if (ops.length === 0 && ngoName) {
          const { data: opsByName } = await supabase
            .from("opportunities")
            .select("*")
            .ilike("ngo_name", `%${ngoName}%`)
            .order("created_at", { ascending: false });
          if (opsByName?.length > 0) ops = opsByName;
        }

        if (isMounted) setOpportunities(ops || []);
        const opIds = (ops || []).map(o => o.id).filter(Boolean);

        // Fetch applications received for this NGO's opportunities.
        // Real schema (confirmed via VolunteerDashboard/AdminDashboard):
        // table "applications", columns opportunity_id, volunteer_id, status,
        // applied_at — joined to the volunteer's profile for display.
        let apps = [];
        if (opIds.length > 0) {
          const { data: appsData, error: appsError } = await supabase
            .from("applications")
            .select(`*, opportunities:opportunity_id (title, location, category), profiles:volunteer_id (full_name, email, phone)`)
            .in("opportunity_id", opIds)
            .order("applied_at", { ascending: false });
          if (!appsError && appsData) apps = appsData;
        }

        if (isMounted) setApplications(apps || []);

        // Fetch complaints filed against this NGO. ReportModal / Opportunities.jsx
        // store reported_id as the opportunity's ngo_id, which is the NGO's
        // auth user id — so that's the primary, reliable filter.
        let comps = [];
        const { data: compsByUser } = await supabase
          .from("complaints")
          .select("*")
          .eq("reported_id", userId)
          .order("created_at", { ascending: false });
        if (compsByUser?.length > 0) comps = compsByUser;

        if (comps.length === 0) {
          const { data: compsByNgoId } = await supabase
            .from("complaints")
            .select("*")
            .eq("reported_id", ngoId)
            .order("created_at", { ascending: false });
          if (compsByNgoId?.length > 0) comps = compsByNgoId;
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

  const [appActionLoading, setAppActionLoading] = useState(null);
  const { toasts, showToast, closeToast } = useToastState();
  const updateApplicationStatus = async (appId, newStatus) => {
    setAppActionLoading(appId);
    const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", appId);
    if (error) {
      setAppActionLoading(null);
      showToast("Failed to update application: " + error.message, "error");
      return;
    }
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));

    // Let the volunteer know the outcome.
    const app = applications.find(a => a.id === appId);
    if (app?.volunteer_id) {
      try {
        await supabase.from("notifications").insert([{
          user_id: app.volunteer_id,
          title: newStatus === "approved" ? "Application Approved" : "Application Update",
          message: newStatus === "approved"
            ? `Great news! Your application for "${app.opportunities?.title || "an opportunity"}" with ${ngo?.name || "the NGO"} has been approved.`
            : `Your application for "${app.opportunities?.title || "an opportunity"}" with ${ngo?.name || "the NGO"} was not approved this time. Keep exploring other opportunities.`,
          type: newStatus,
          read: false,
        }]);
      } catch (e) {}
    }

    setAppActionLoading(null);
    showToast(`Application ${newStatus}.`, "success");
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
          <h3><AlertTriangle size={18} /> Error</h3>
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
  const rejectedApps = applications.filter(a => a.status === "rejected").length;
  const approvalRate = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;

  const chartData = [
    { name: "Approved", value: approvedApps, key: "approved" },
    { name: "Pending", value: pendingApps, key: "pending" },
    { name: "Rejected", value: rejectedApps, key: "rejected" },
  ].filter(d => d.value > 0);

  return (
    <div className="ngo-dashboard">
      <ToastHost toasts={toasts} onClose={closeToast} />
      {/* ─── Header ─── */}
      <div className="ngo-header">
        <div className="ngo-header-left">
          <div className="ngo-header-icon"><Building2 size={22} /></div>
          <div>
            <h1>{ngo?.name || "NGO Dashboard"}</h1>
            <div className="ngo-status">
              <span className="status-label">Status:</span>
              <StatusBadge status={ngo?.approval_status || "approved"} />
            </div>
          </div>
        </div>
        <div className="ngo-header-right">
          <div className="notif-wrapper" ref={notifRef}>
            <button className="notif-bell" onClick={() => setShowNotifPanel(!showNotifPanel)} title="Notifications">
              <Bell size={19} />
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
                        {(n.type === "legal_notice" || n.type === "warning") && (
                          <button
                            className="notif-download-btn"
                            onClick={(e) => { e.stopPropagation(); generateNoticePDF(n, ngo); }}
                          >
                            <Download size={13} /> Download {n.type === "legal_notice" ? "Legal Notice" : "Warning Letter"}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button className="btn-post" onClick={() => navigate("/opportunity/create")}><Plus size={16} /> Post Opportunity</button>
          <button className="btn-edit-profile" onClick={() => navigate("/ngo/profile")}><Pencil size={15} /> Edit Profile</button>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="stat-cards-row">
        <StatCard icon={Briefcase} value={totalOpps} label="Opportunities Posted" tone="green" />
        <StatCard icon={FileText} value={totalApps} label="Applications Received" tone="blue" />
        <StatCard icon={CheckCircle2} value={`${approvalRate}%`} label="Approval Rate" tone="coral"
          trend={totalApps > 0 ? `${approvedApps} approved` : undefined} trendDirection="up" />
        <StatCard icon={Clock} value={pendingApps} label="Pending Review" tone="amber" />
      </div>

      {/* ─── Two Column Layout ─── */}
      <div className="dashboard-columns">
        {/* Left Column */}
        <div className="column-left">
          {/* My Opportunities */}
          <div className="card">
            <div className="card-header">
              <h3><ClipboardList size={18} /> My Opportunities</h3>
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
                      <button className="btn-edit-small" onClick={() => navigate(`/opportunity/edit/${op.id}`)}><Pencil size={13} /> Edit</button>
                      <button className="btn-delete-small" onClick={() => handleDeleteOpp(op.id)}><Trash2 size={13} /> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applications Received */}
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <h3><FileText size={18} /> Applications Received</h3>
            </div>
            {applications.length === 0 ? (
              <div className="card-empty">
                <p>No applications received yet.</p>
              </div>
            ) : (
              <div className="app-list">
                {applications.map(app => (
                  <div className="app-item" key={app.id}>
                    <div className="app-avatar">
                      {(app.profiles?.full_name || app.applicant_name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="app-info">
                      <div className="app-name">{app.profiles?.full_name || app.applicant_name || "Unknown Volunteer"}</div>
                      <div className="app-meta">
                        {app.profiles?.email || ""}{app.profiles?.phone ? ` · ${app.profiles.phone}` : ""} · {app.opportunities?.title || "Opportunity"}
                      </div>
                    </div>
                    {(!app.status || app.status === "pending") ? (
                      <div className="app-decision-actions">
                        <button
                          className="btn-app-approve"
                          disabled={appActionLoading === app.id}
                          onClick={() => updateApplicationStatus(app.id, "approved")}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          className="btn-app-reject"
                          disabled={appActionLoading === app.id}
                          onClick={() => updateApplicationStatus(app.id, "rejected")}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <StatusBadge status={app.status} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Complaints Against Your NGO */}
          <div className="card complaints-card" style={{ marginTop: 24 }}>
            <div className="card-header complaints-header">
              <h3><ShieldAlert size={18} /> Complaints Against Your NGO</h3>
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
                    <div className="complaint-icon"><AlertTriangle size={16} /></div>
                    <div className="complaint-body">
                      <div className="complaint-top">
                        <span className="complaint-reporter">A volunteer reported you</span>
                        <StatusBadge status={comp.status || "resolved"} />
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
          <div className="card chart-card">
            <div className="card-header">
              <h3>Application Status Breakdown</h3>
            </div>
            {chartData.length === 0 ? (
              <div className="card-empty"><p>No applications yet to chart.</p></div>
            ) : (
              <>
                <div className="donut-wrap">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                        {chartData.map((d) => <Cell key={d.key} fill={CHART_COLORS[d.key]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="donut-legend">
                  {chartData.map(d => (
                    <div className="donut-legend-item" key={d.key}>
                      <span className="donut-dot" style={{ background: CHART_COLORS[d.key] }} />
                      {d.name} · {d.value}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card profile-card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <h3><Building2 size={18} /> NGO Profile</h3>
            </div>
            <div className="profile-fields">
              <div className="profile-field">
                <span className="field-label">Category:</span>
                <span className="field-value">{ngo?.category || "General"}</span>
              </div>
              <div className="profile-field">
                <span className="field-label">Location:</span>
                <span className="field-value">{ngo?.location || ngo?.address || "N/A"}</span>
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