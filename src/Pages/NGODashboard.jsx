import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./NGODashboard.css";

function NGODashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ngo, setNgo] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [complaintsAgainstMe, setComplaintsAgainstMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const loadApprovedData = async (ngoData, userId) => {
    const [{ data: oppData }, { data: compData }] = await Promise.all([
      supabase
        .from("opportunities")
        .select("*")
        .eq("ngo_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("complaints")
        .select("*")
        .eq("reported_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    setOpportunities(oppData || []);
    setComplaintsAgainstMe(compData || []);

    const { data: appData } = await supabase
      .from("applications")
      .select(`*, opportunities:opportunity_id (title), profiles:volunteer_id (full_name, email, phone)`)
      .in("opportunity_id", oppData?.map((o) => o.id) || [])
      .order("applied_at", { ascending: false });

    setApplications(appData || []);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { navigate("/login"); return; }
      setUser(authUser);

      const { data: ngoData } = await supabase
        .from("ngos")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      setNgo(ngoData);

      if (ngoData?.approval_status === "approved") {
        await loadApprovedData(ngoData, authUser.id);
      }

      setLoading(false);
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (!user?.id || !ngo?.id || ngo.approval_status === "approved") return;

    const timer = setInterval(async () => {
      setCheckCount((c) => c + 1);
      const { data } = await supabase
        .from("ngos")
        .select("approval_status, name, id")
        .eq("user_id", user.id)
        .single();

      if (data?.approval_status === "approved") {
        setNgo(data);
        await loadApprovedData(data, user.id);
        clearInterval(timer);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [user?.id, ngo?.id, ngo?.approval_status]);

  const handleAppStatus = async (appId, status) => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", appId);
    if (error) showToast("Error", "error");
    else {
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
      showToast(`Application ${status.toLowerCase()}!`);
    }
  };

  const handleDeleteOpp = async (id) => {
    if (!window.confirm("Delete?")) return;
    await supabase.from("opportunities").delete().eq("id", id);
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    showToast("Deleted.");
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

  if (loading) return <div className="ngo-loading">Loading...</div>;

  if (!ngo) {
    return (
      <div className="ngo-dashboard" style={{ textAlign: "center", padding: "5rem 2rem" }}>
        <div style={{ fontSize: "56px" }}>🏛️</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", color: "#1B3A28" }}>Complete Registration</h1>
        <p style={{ color: "#6B7268", marginBottom: "24px" }}>Your NGO profile not found.</p>
        <Link to="/ngo/register" className="ngo-btn-primary">Register NGO</Link>
      </div>
    );
  }

  if (ngo.approval_status !== "approved") {
    const isRejected = ngo.approval_status === "rejected";
    return (
      <div className="ngo-dashboard">
        {toast.show && <div className={`ngo-toast ${toast.type}`}>{toast.msg}</div>}
        <div style={{ textAlign: "center", padding: "5rem 2rem", maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>{isRejected ? "❌" : "⏳"}</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.8rem", color: "#1B3A28", marginBottom: "12px" }}>
            {isRejected ? "Registration Rejected" : "Account Under Review"}
          </h1>
          <p style={{ color: "#6B7268", fontSize: "15px", lineHeight: 1.7, marginBottom: "28px" }}>
            {isRejected
              ? "Your NGO registration was rejected by the admin."
              : "Your NGO registration is pending admin approval. Auto-checking every 3 seconds..."}
          </p>
          <div style={{ background: "white", border: "1px solid #E4E0D6", borderRadius: "12px", padding: "20px 24px", marginBottom: "24px", textAlign: "left" }}>
            <div style={{ fontSize: "13px", color: "#8A8F86" }}>NGO Name</div>
            <div style={{ fontWeight: 600, color: "#1C2B22", marginBottom: "12px" }}>{ngo.name}</div>
            <div style={{ fontSize: "13px", color: "#8A8F86" }}>Status</div>
            <span className={`ngo-status ngo-status-${ngo.approval_status}`} style={{ fontSize: "12px" }}>
              {ngo.approval_status}
            </span>
            <div style={{ fontSize: "11px", color: "#8A8F86", marginTop: "8px" }}>
              Auto-checks: {checkCount} {checkCount > 0 ? "✓" : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link to="/ngo/profile" className="ngo-btn-secondary">Edit Profile</Link>
            <button className="ngo-btn-primary" onClick={() => window.location.reload()}>Refresh Page</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ngo-dashboard">
      {toast.show && <div className={`ngo-toast ${toast.type}`}>{toast.msg}</div>}

      <div className="ngo-header">
        <div>
          <h1>{ngo.name}</h1>
          <p>Status: <span className={`ngo-status ngo-status-${ngo.approval_status}`}>{ngo.approval_status}</span></p>
        </div>
        <div className="ngo-actions">
          <Link to="/opportunity/create" className="ngo-btn-primary">+ Post Opportunity</Link>
          <Link to="/ngo/profile" className="ngo-btn-secondary">Edit Profile</Link>
        </div>
      </div>

      <div className="ngo-stats">
        <div className="ngo-stat"><div className="ngo-stat-value">{opportunities.length}</div><div className="ngo-stat-label">Opportunities</div></div>
        <div className="ngo-stat"><div className="ngo-stat-value">{applications.length}</div><div className="ngo-stat-label">Applications</div></div>
        <div className="ngo-stat"><div className="ngo-stat-value">{applications.filter((a) => a.status?.toLowerCase() === "approved").length}</div><div className="ngo-stat-label">Approved</div></div>
        <div className="ngo-stat"><div className="ngo-stat-value">{applications.filter((a) => a.status?.toLowerCase() === "pending").length}</div><div className="ngo-stat-label">Pending</div></div>
      </div>

      <div className="ngo-grid">
        <div className="ngo-left">
          <div className="ngo-panel">
            <div className="ngo-panel-head"><h2>My Opportunities</h2></div>
            {opportunities.length === 0 ? (
              <div className="ngo-empty">No opportunities yet. <Link to="/opportunity/create">Create one →</Link></div>
            ) : (
              opportunities.map((opp) => (
                <div key={opp.id} className="ngo-opp-row">
                  <div>
                    <div className="ngo-opp-title">{opp.title}</div>
                    <div className="ngo-opp-meta">{opp.location || "Remote"} · {opp.type || "N/A"} · {new Date(opp.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="ngo-opp-actions">
                    <Link to={`/opportunity/edit/${opp.id}`} className="ngo-btn-ghost">Edit</Link>
                    <button className="ngo-btn-danger" onClick={() => handleDeleteOpp(opp.id)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="ngo-panel" style={{ marginTop: "24px" }}>
            <div className="ngo-panel-head"><h2>Applications Received</h2></div>
            {applications.length === 0 ? (
              <div className="ngo-empty">No applications yet.</div>
            ) : (
              applications.map((app) => {
                const prof = app.profiles || {};
                const isPending = app.status?.toLowerCase() === "pending";
                return (
                  <div key={app.id} className="ngo-app-row">
                    <div className="ngo-app-info">
                      <div className="ngo-app-name">{prof.full_name || "Unknown"}</div>
                      <div className="ngo-app-meta">{prof.email || "No email"} · {app.opportunities?.title || "Opportunity"}</div>
                    </div>
                    <div className="ngo-app-actions">
                      {isPending && (
                        <>
                          <button className="ngo-btn-approve" onClick={() => handleAppStatus(app.id, "approved")}>✓ Approve</button>
                          <button className="ngo-btn-reject" onClick={() => handleAppStatus(app.id, "rejected")}>✕ Reject</button>
                        </>
                      )}
                      <span className={`ngo-status-pill s-${app.status?.toLowerCase() || "pending"}`}>{app.status || "Pending"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="ngo-panel" style={{ marginTop: "24px", border: "1.5px solid #FBE9E7" }}>
            <div className="ngo-panel-head">
              <h2 style={{ color: "#B24444" }}>🚨 Complaints Against Your NGO</h2>
              <span className="ngo-panel-meta">{complaintsAgainstMe.length} received</span>
            </div>
            {complaintsAgainstMe.length === 0 ? (
              <div className="ngo-empty">No complaints. Great work! 🎉</div>
            ) : (
              <div className="ngo-complaints-list">
                {complaintsAgainstMe.map((c) => (
                  <div key={c.id} className="ngo-complaint-row">
                    <div className="ngo-complaint-icon">⚠️</div>
                    <div className="ngo-complaint-info">
                      <div className="ngo-complaint-title">
                        <strong>{c.reporter_name || "Anonymous"}</strong> reported you
                        <span className={`status-pill ${getComplaintStatusClass(c.status)}`}>{getComplaintStatusLabel(c.status)}</span>
                      </div>
                      <div className="ngo-complaint-meta">{c.reason} · {new Date(c.created_at).toLocaleDateString()}</div>
                      <div className="ngo-complaint-desc">{c.description || "No details."}</div>
                      {c.admin_notes && <div className="ngo-complaint-admin-note"><b>Admin:</b> {c.admin_notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ngo-right">
          <div className="ngo-panel ngo-profile-mini">
            <h3>NGO Profile</h3>
            <p><b>Category:</b> {ngo.category || "N/A"}</p>
            <p><b>Location:</b> {ngo.location || "N/A"}</p>
            <p><b>Email:</b> {ngo.email || "N/A"}</p>
            <p><b>Phone:</b> {ngo.phone || "N/A"}</p>
            <Link to="/ngo/profile" className="ngo-btn-secondary" style={{ width: "100%", marginTop: "10px", textAlign: "center" }}>Edit Profile</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NGODashboard;