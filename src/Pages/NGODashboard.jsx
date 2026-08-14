import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./NGODashboard.css";

/* ===== Inline SVG Icons ===== */
const BellIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const MessageSquareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

function NGODashboard() {
  const navigate = useNavigate();
  const notifRef = useRef(null);

  const [user, setUser] = useState(null);
  const [ngo, setNgo] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [complaintsAgainstMe, setComplaintsAgainstMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters & Search
  const [oppSearch, setOppSearch] = useState("");
  const [appFilter, setAppFilter] = useState("all");

  // Activity feed
  const [activityFeed, setActivityFeed] = useState([]);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  // ===== Fetch Core Data =====
  const fetchOppsAndApps = async (userId) => {
    console.log("[NGO] Fetching opportunities for ngo_id:", userId);
    const { data: oppData, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("ngo_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[NGO] Opportunities error:", error);
      return;
    }

    console.log("[NGO] Opportunities found:", oppData?.length || 0);
    setOpportunities(oppData || []);

    if (!oppData || oppData.length === 0) {
      setApplications([]);
      return;
    }

    const oppIds = oppData.map((o) => o.id);
    console.log("[NGO] Fetching applications for opp IDs:", oppIds);

    const { data: appData, error: appError } = await supabase
      .from("applications")
      .select("*")
      .in("opportunity_id", oppIds)
      .order("applied_at", { ascending: false });

    if (appError) {
      console.error("[NGO] Applications error:", appError);
      setApplications([]);
      return;
    }

    console.log("[NGO] Raw applications found:", appData?.length || 0);

    // Fetch volunteer profiles
    const volunteerIds = [
      ...new Set((appData || []).map((a) => a.volunteer_id).filter(Boolean)),
    ];
    let profilesMap = {};
    if (volunteerIds.length > 0) {
      const { data: profData, error: profError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", volunteerIds);
      if (!profError) {
        (profData || []).forEach((p) => (profilesMap[p.id] = p));
      }
    }

    const mergedApps = (appData || []).map((app) => ({
      ...app,
      opportunities: oppData.find((o) => o.id === app.opportunity_id) || { title: "Unknown" },
      profiles: profilesMap[app.volunteer_id] || {},
    }));

    console.log("[NGO] Merged applications:", mergedApps.length);
    setApplications(mergedApps);

    // Build activity feed
    const feed = [];
    mergedApps.slice(0, 5).forEach((a) => {
      feed.push({
        id: `app-${a.id}`,
        text: `${a.profiles?.full_name || "Someone"} applied to ${a.opportunities?.title || "opportunity"}`,
        time: a.applied_at,
        type: "application",
        icon: "users",
      });
    });
    feed.sort((a, b) => new Date(b.time) - new Date(a.time));
    setActivityFeed(feed.slice(0, 6));
  };

  const fetchComplaints = async (userId) => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("reported_id", userId)
      .order("created_at", { ascending: false });
    if (error) console.error("[NGO] Complaints error:", error);
    else setComplaintsAgainstMe(data || []);
  };

  const fetchNotifications = async (userId) => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    const list = data || [];
    setNotifications(list);
    setUnreadCount(list.filter((n) => !n.read).length);
  };

  // ===== Realtime Channels for NGO =====
  useEffect(() => {
    if (!user?.id || !ngo?.id) return;

    const channels = [];

    // 1. New application on MY opportunity
    const appChannel = supabase
      .channel(`ngo-apps-${ngo.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "applications" },
        async (payload) => {
          const opp = opportunities.find((o) => o.id === payload.new.opportunity_id);
          if (!opp) return; // not my opportunity

          const title = "New Application Received";
          const msg = `Someone applied to "${opp.title}"`;
          showToast(msg, "info");

          await supabase.from("notifications").insert({
            user_id: user.id,
            title,
            message: msg,
            type: "application",
            read: false,
          });
          fetchNotifications(user.id);
          fetchOppsAndApps(user.id);
        }
      )
      .subscribe();
    channels.push(appChannel);

    // 2. New complaint filed AGAINST me
    const complaintChannel = supabase
      .channel(`ngo-complaints-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "complaints",
          filter: `reported_id=eq.${user.id}`,
        },
        async (payload) => {
          const title = "⚠️ New Complaint Filed Against You";
          const msg = `Reason: ${payload.new.reason}. Status: Pending review.`;
          showToast(msg, "warning");

          await supabase.from("notifications").insert({
            user_id: user.id,
            title,
            message: msg,
            type: "report",
            read: false,
          });
          fetchNotifications(user.id);
          fetchComplaints(user.id);
        }
      )
      .subscribe();
    channels.push(complaintChannel);

    // 3. Admin updated complaint against me
    const complaintUpdateChannel = supabase
      .channel(`ngo-complaint-updates-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "complaints",
          filter: `reported_id=eq.${user.id}`,
        },
        async (payload) => {
          const title = "Complaint Status Updated";
          const msg = `Admin marked a complaint as ${payload.new.status}`;
          showToast(msg, "info");

          await supabase.from("notifications").insert({
            user_id: user.id,
            title,
            message: msg,
            type: "complaint",
            read: false,
          });
          fetchNotifications(user.id);
          fetchComplaints(user.id);
        }
      )
      .subscribe();
    channels.push(complaintUpdateChannel);

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [user?.id, ngo?.id, opportunities]);

  // ===== Init =====
  useEffect(() => {
    const init = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/login");
        return;
      }
      setUser(authUser);
      console.log("[NGO] Logged in as:", authUser.id);

      const { data: ngoData } = await supabase
        .from("ngos")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      setNgo(ngoData);
      console.log("[NGO] NGO data:", ngoData);

      if (ngoData?.approval_status === "approved") {
        await fetchOppsAndApps(authUser.id);
        await fetchComplaints(authUser.id);
        await fetchNotifications(authUser.id);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  // Approval polling
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
        await fetchOppsAndApps(user.id);
        await fetchComplaints(user.id);
        await fetchNotifications(user.id);
        clearInterval(timer);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [user?.id, ngo?.id, ngo?.approval_status]);

  // Data polling fallback
  useEffect(() => {
    if (!user?.id || ngo?.approval_status !== "approved") return;
    const interval = setInterval(() => {
      fetchOppsAndApps(user.id);
      fetchComplaints(user.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id, ngo?.approval_status]);

  // Click outside notif panel
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ===== Handlers =====
  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleAppStatus = async (appId, status) => {
    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", appId);
    if (error) showToast("Error", "error");
    else {
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status } : a))
      );
      showToast(`Application ${status.toLowerCase()}!`);
    }
  };

  const handleDeleteOpp = async (id) => {
    if (!window.confirm("Delete this opportunity?")) return;
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

  const getSeverityBadge = (status) => {
    const s = (status || "pending").toLowerCase();
    const map = {
      resolved: { label: "Low", color: "#2F5D50", bg: "#E8F5E9" },
      dismissed: { label: "Low", color: "#6B7268", bg: "#F0EDE6" },
      investigating: { label: "Medium", color: "#B8792A", bg: "#FFF8E1" },
      pending: { label: "High", color: "#B24444", bg: "#FBE9E7" },
    };
    return map[s] || map.pending;
  };

  // Derived
  const filteredOpps = opportunities.filter((o) =>
    o.title?.toLowerCase().includes(oppSearch.toLowerCase()) ||
    o.location?.toLowerCase().includes(oppSearch.toLowerCase())
  );

  const filteredApps = applications.filter((a) => {
    if (appFilter === "all") return true;
    return (a.status || "pending").toLowerCase() === appFilter;
  });

  const approvedApps = applications.filter((a) => a.status?.toLowerCase() === "approved").length;
  const pendingApps = applications.filter((a) => a.status?.toLowerCase() === "pending").length;
  const responseRate = applications.length > 0 ? Math.round((approvedApps / applications.length) * 100) : 0;

  if (loading) return <div style={{ padding: "5rem", textAlign: "center", color: "#8A8F86" }}>Loading dashboard...</div>;

  if (!ngo) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 2rem", background: "#F7F5EF", minHeight: "100vh" }}>
        <div style={{ fontSize: "56px" }}>🏛️</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", color: "#1B3A28" }}>Complete Registration</h1>
        <p style={{ color: "#6B7268", marginBottom: "24px" }}>Your NGO profile not found.</p>
        <Link to="/ngo/register" style={{ background: "#1B3A28", color: "white", padding: "12px 24px", borderRadius: "10px", textDecoration: "none", fontWeight: 600 }}>Register NGO</Link>
      </div>
    );
  }

  if (ngo.approval_status !== "approved") {
    const isRejected = ngo.approval_status === "rejected";
    return (
      <div style={{ background: "#F7F5EF", minHeight: "100vh", padding: "4rem 2rem" }}>
        {toast.show && (
          <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: "#B24444", color: "white", padding: "12px 20px", borderRadius: "10px", fontWeight: 500 }}>
            {toast.msg}
          </div>
        )}
        <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto", background: "white", padding: "48px", borderRadius: "20px", border: "1px solid #E4E0D6" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>{isRejected ? "❌" : "⏳"}</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.8rem", color: "#1B3A28", marginBottom: "12px" }}>
            {isRejected ? "Registration Rejected" : "Account Under Review"}
          </h1>
          <p style={{ color: "#6B7268", fontSize: "15px", lineHeight: 1.7, marginBottom: "28px" }}>
            {isRejected ? "Your NGO registration was rejected by the admin." : "Your NGO registration is pending admin approval. Auto-checking every 3 seconds..."}
          </p>
          <div style={{ background: "#F7F5EF", borderRadius: "12px", padding: "20px 24px", marginBottom: "24px", textAlign: "left" }}>
            <div style={{ fontSize: "13px", color: "#8A8F86" }}>NGO Name</div>
            <div style={{ fontWeight: 600, color: "#1C2B22", marginBottom: "12px" }}>{ngo.name}</div>
            <div style={{ fontSize: "13px", color: "#8A8F86" }}>Status</div>
            <span style={{ display: "inline-block", marginTop: "4px", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, background: isRejected ? "#FBE9E7" : "#FFF8E1", color: isRejected ? "#B24444" : "#B8792A" }}>
              {ngo.approval_status}
            </span>
            <div style={{ fontSize: "11px", color: "#8A8F86", marginTop: "8px" }}>Auto-checks: {checkCount} {checkCount > 0 ? "✓" : ""}</div>
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link to="/ngo/profile" style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid #E4E0D6", color: "#1B3A28", textDecoration: "none", fontWeight: 600, background: "white" }}>Edit Profile</Link>
            <button style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "#1B3A28", color: "white", fontWeight: 600, cursor: "pointer" }} onClick={() => window.location.reload()}>Refresh Page</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F7F5EF", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* Toast */}
      {toast.show && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "error" ? "#B24444" : toast.type === "warning" ? "#B8792A" : "#2F5D50",
          color: "white", padding: "12px 20px", borderRadius: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)", fontWeight: 500, fontSize: "14px"
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: "white", borderBottom: "1px solid #E4E0D6",
        padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", color: "#1B3A28", fontFamily: "'Fraunces', serif" }}>{ngo.name}</h1>
          <p style={{ margin: "4px 0 0", color: "#6B7268", fontSize: "13px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <ShieldIcon /> {ngo.category || "NGO"} · {ngo.location || "N/A"}
            </span>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Bell */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              style={{
                position: "relative", background: "white", border: "1px solid #E4E0D6",
                borderRadius: "10px", width: 42, height: 42, display: "flex",
                alignItems: "center", justifyContent: "center", cursor: "pointer",
                color: "#1B3A28", transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F0EDE6"}
              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#B24444", color: "white", fontSize: "11px",
                  fontWeight: 700, width: 18, height: 18, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid white"
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifPanel && (
              <div style={{
                position: "absolute", right: 0, top: 52, width: 380,
                background: "white", borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
                border: "1px solid #E4E0D6", overflow: "hidden", zIndex: 200
              }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0EDE6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, color: "#1B3A28", fontSize: "15px" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#2F5D50", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "32px", textAlign: "center", color: "#8A8F86", fontSize: "13px" }}>
                      🔔 No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} style={{
                        padding: "14px 20px", borderBottom: "1px solid #F7F5EF",
                        background: n.read ? "white" : "#F7FBF9", cursor: "pointer",
                        transition: "background 0.15s"
                      }} onClick={() => {
                        if (!n.read) {
                          supabase.from("notifications").update({ read: true }).eq("id", n.id);
                          setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
                          setUnreadCount((c) => Math.max(0, c - 1));
                        }
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0,
                            background: n.type === "application" ? "#2F5D50" : n.type === "complaint" ? "#B8792A" : "#B24444",
                            opacity: n.read ? 0.3 : 1
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1B3A28", marginBottom: "2px" }}>{n.title}</div>
                            <div style={{ fontSize: "12px", color: "#6B7268", lineHeight: 1.4 }}>{n.message}</div>
                            <div style={{ fontSize: "11px", color: "#8A8F86", marginTop: "6px" }}>
                              {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link to="/opportunity/create" style={{
            background: "#1B3A28", color: "white", padding: "10px 18px",
            borderRadius: "10px", textDecoration: "none", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px"
          }}>
            + Post Opportunity
          </Link>
          <Link to="/ngo/profile" style={{
            background: "white", color: "#1B3A28", padding: "10px 18px",
            borderRadius: "10px", textDecoration: "none", fontSize: "13px", fontWeight: 600, border: "1px solid #E4E0D6"
          }}>
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {[
          { label: "Opportunities", value: opportunities.length, icon: <BriefcaseIcon />, color: "#2F5D50", bg: "#E8F5E9" },
          { label: "Total Applications", value: applications.length, icon: <UsersIcon />, color: "#1B3A28", bg: "#F0EDE6" },
          { label: "Approved", value: approvedApps, icon: <CheckCircleIcon />, color: "#2F5D50", bg: "#E8F5E9" },
          { label: "Pending Review", value: pendingApps, icon: <ClockIcon />, color: "#B8792A", bg: "#FFF8E1" },
          { label: "Complaints", value: complaintsAgainstMe.length, icon: <AlertTriangleIcon />, color: "#B24444", bg: "#FBE9E7" },
          { label: "Response Rate", value: `${responseRate}%`, icon: <TrendingUpIcon />, color: "#4A7C59", bg: "#E8F5E9" },
        ].map((stat, i) => (
          <div key={i} style={{
            background: "white", borderRadius: "14px", padding: "20px",
            border: "1px solid #E4E0D6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "transform 0.2s, box-shadow 0.2s", cursor: "default",
            display: "flex", alignItems: "center", gap: "14px"
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: "12px", background: stat.bg,
              color: stat.color, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: stat.color, fontFamily: "'Fraunces', serif" }}>{stat.value}</div>
              <div style={{ fontSize: "12px", color: "#8A8F86", marginTop: "2px", fontWeight: 500 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ padding: "0 32px 40px", display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px" }}>
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Opportunities */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E4E0D6", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F0EDE6", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "17px", color: "#1B3A28", fontFamily: "'Fraunces', serif" }}>My Opportunities</h2>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8A8F86" }}><SearchIcon /></span>
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  value={oppSearch}
                  onChange={(e) => setOppSearch(e.target.value)}
                  style={{ padding: "8px 12px 8px 36px", borderRadius: "10px", border: "1px solid #E4E0D6", fontSize: "13px", width: 220, outline: "none" }}
                />
              </div>
            </div>

            {filteredOpps.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
                <div style={{ color: "#6B7268", fontSize: "14px", fontWeight: 500 }}>
                  {oppSearch ? "No matching opportunities found." : "No opportunities yet."}
                </div>
                {!oppSearch && (
                  <Link to="/opportunity/create" style={{ color: "#2F5D50", fontSize: "13px", fontWeight: 600, marginTop: "8px", display: "inline-block" }}>
                    Create your first opportunity →
                  </Link>
                )}
              </div>
            ) : (
              <div>
                {filteredOpps.map((opp) => (
                  <div key={opp.id} style={{
                    padding: "18px 24px", borderBottom: "1px solid #F7F5EF",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "background 0.15s", cursor: "default"
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAF8"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "12px", background: "#F7F5EF",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px"
                      }}>
                        {opp.category === "Education" ? "📚" : opp.category === "Health" ? "🏥" : opp.category === "Environment" ? "🌱" : "🌿"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#1B3A28", fontSize: "14px" }}>{opp.title}</div>
                        <div style={{ fontSize: "12px", color: "#8A8F86", marginTop: "2px" }}>
                          {opp.location || "Remote"} · {opp.type || "N/A"} · {new Date(opp.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Link to={`/opportunity/edit/${opp.id}`} style={{
                        padding: "6px 14px", borderRadius: "8px", border: "1px solid #E4E0D6",
                        color: "#2F5D50", textDecoration: "none", fontSize: "12px", fontWeight: 600, background: "white"
                      }}>
                        Edit
                      </Link>
                      <button onClick={() => handleDeleteOpp(opp.id)} style={{
                        padding: "6px 14px", borderRadius: "8px", border: "none",
                        background: "#FBE9E7", color: "#B24444", fontSize: "12px", fontWeight: 600, cursor: "pointer"
                      }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applications */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E4E0D6", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F0EDE6", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "17px", color: "#1B3A28", fontFamily: "'Fraunces', serif" }}>Applications Received</h2>
              <div style={{ display: "flex", gap: "6px" }}>
                {["all", "pending", "approved", "rejected"].map((f) => (
                  <button key={f} onClick={() => setAppFilter(f)} style={{
                    padding: "6px 14px", borderRadius: "20px", border: "none",
                    fontSize: "12px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                    background: appFilter === f ? "#1B3A28" : "#F7F5EF",
                    color: appFilter === f ? "white" : "#6B7268",
                    transition: "all 0.2s"
                  }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredApps.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
                <div style={{ color: "#6B7268", fontSize: "14px", fontWeight: 500 }}>
                  {appFilter === "all" ? "No applications yet." : `No ${appFilter} applications.`}
                </div>
              </div>
            ) : (
              <div>
                {filteredApps.map((app) => {
                  const prof = app.profiles || {};
                  const status = (app.status || "pending").toLowerCase();
                  const statusColor = status === "approved" ? "#2F5D50" : status === "rejected" ? "#B24444" : "#B8792A";
                  const statusBg = status === "approved" ? "#E8F5E9" : status === "rejected" ? "#FBE9E7" : "#FFF8E1";
                  const isPending = status === "pending";
                  return (
                    <div key={app.id} style={{
                      padding: "18px 24px", borderBottom: "1px solid #F7F5EF",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "background 0.15s", cursor: "default"
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAF8"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: "linear-gradient(135deg, #2F5D50, #4A8F7B)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontSize: "14px", fontWeight: 700
                        }}>
                          {prof.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#1B3A28", fontSize: "14px" }}>{prof.full_name || "Unknown"}</div>
                          <div style={{ fontSize: "12px", color: "#8A8F86", marginTop: "2px" }}>
                            {prof.email || "No email"} · {app.opportunities?.title || "Opportunity"}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {isPending && (
                          <>
                            <button onClick={() => handleAppStatus(app.id, "approved")} style={{
                              padding: "6px 14px", borderRadius: "8px", border: "none",
                              background: "#E8F5E9", color: "#2F5D50", fontSize: "12px", fontWeight: 700, cursor: "pointer"
                            }}>
                              ✓ Approve
                            </button>
                            <button onClick={() => handleAppStatus(app.id, "rejected")} style={{
                              padding: "6px 14px", borderRadius: "8px", border: "none",
                              background: "#FBE9E7", color: "#B24444", fontSize: "12px", fontWeight: 700, cursor: "pointer"
                            }}>
                              ✕ Reject
                            </button>
                          </>
                        )}
                        <span style={{
                          padding: "4px 10px", borderRadius: "20px", fontSize: "11px",
                          fontWeight: 700, background: statusBg, color: statusColor, textTransform: "capitalize"
                        }}>
                          {app.status || "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Complaints */}
          <div style={{ background: "white", borderRadius: "16px", border: "1.5px solid #FBE9E7", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F0EDE6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: "17px", color: "#B24444", fontFamily: "'Fraunces', serif" }}>🚨 Complaints Against Your NGO</h2>
              <span style={{ fontSize: "12px", color: "#8A8F86", fontWeight: 500 }}>{complaintsAgainstMe.length} received</span>
            </div>

            {complaintsAgainstMe.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
                <div style={{ color: "#6B7268", fontSize: "14px", fontWeight: 500 }}>No complaints. Great work!</div>
              </div>
            ) : (
              <div>
                {complaintsAgainstMe.map((c) => {
                  const sev = getSeverityBadge(c.status);
                  return (
                    <div key={c.id} style={{
                      padding: "18px 24px", borderBottom: "1px solid #F7F5EF",
                      borderLeft: `4px solid ${sev.color}`,
                      transition: "background 0.15s"
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAF8"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                            background: sev.bg, color: sev.color
                          }}>
                            {sev.label} Severity
                          </span>
                          <span style={{
                            padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                            background: c.status?.toLowerCase() === "resolved" ? "#E8F5E9" : c.status?.toLowerCase() === "dismissed" ? "#F0EDE6" : "#FFF8E1",
                            color: c.status?.toLowerCase() === "resolved" ? "#2F5D50" : c.status?.toLowerCase() === "dismissed" ? "#6B7268" : "#B8792A"
                          }}>
                            {getComplaintStatusLabel(c.status)}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#8A8F86" }}>
                          {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, color: "#1B3A28", fontSize: "14px", marginBottom: "4px" }}>
                        Reported by {c.reporter_name || "Anonymous"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#8A8F86", marginBottom: "8px" }}>Reason: {c.reason}</div>
                      {c.description && (
                        <div style={{ fontSize: "13px", color: "#4B534E", lineHeight: 1.5, background: "#F7F5EF", padding: "10px 12px", borderRadius: "8px" }}>
                          {c.description}
                        </div>
                      )}
                      {c.admin_notes && (
                        <div style={{ fontSize: "12px", color: "#2F5D50", marginTop: "8px", fontWeight: 500, background: "#E8F5E9", padding: "8px 12px", borderRadius: "8px" }}>
                          <b>Admin:</b> {c.admin_notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Activity Feed */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E4E0D6", padding: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1B3A28", fontFamily: "'Fraunces', serif" }}>Recent Activity</h3>
            {activityFeed.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#8A8F86", fontSize: "13px" }}>
                No recent activity
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {activityFeed.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "8px", background: "#F7F5EF",
                      color: "#2F5D50", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      {item.type === "application" ? <UsersIcon /> : <MessageSquareIcon />}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", color: "#1B3A28", fontWeight: 500, lineHeight: 1.4 }}>{item.text}</div>
                      <div style={{ fontSize: "11px", color: "#8A8F86", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <CalendarIcon /> {new Date(item.time).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E4E0D6", padding: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1B3A28", fontFamily: "'Fraunces', serif" }}>Quick Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "➕ Post new opportunity", link: "/opportunity/create" },
                { label: "👤 Edit NGO profile", link: "/ngo/profile" },
                { label: "🔍 Browse volunteers", link: "/volunteers" },
              ].map((item, i) => (
                <Link key={i} to={item.link} style={{
                  padding: "12px 16px", borderRadius: "10px", background: "#F7F5EF",
                  color: "#1B3A28", textDecoration: "none", fontSize: "13px", fontWeight: 600,
                  border: "1px solid transparent", transition: "all 0.2s", display: "block"
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#E4E0D6"; e.currentTarget.style.background = "white"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "#F7F5EF"; }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Mini Profile */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E4E0D6", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "linear-gradient(135deg, #2F5D50, #4A8F7B)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: "18px", fontWeight: 700
              }}>
                {ngo.name?.charAt(0) || "N"}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#1B3A28", fontSize: "14px" }}>{ngo.name}</div>
                <div style={{ fontSize: "12px", color: "#8A8F86" }}>{ngo.email || "No email"}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#4B534E" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Category</span>
                <span style={{ fontWeight: 600 }}>{ngo.category || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Location</span>
                <span style={{ fontWeight: 600 }}>{ngo.location || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Phone</span>
                <span style={{ fontWeight: 600 }}>{ngo.phone || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Status</span>
                <span style={{ fontWeight: 600, color: "#2F5D50" }}>Approved ✅</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NGODashboard;