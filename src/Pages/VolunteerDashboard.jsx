import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./VolunteerDashboard.css";

/* ===== SVG Icons ===== */
const BellIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const TrendUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);

function VolunteerDashboard() {
  const navigate = useNavigate();
  const notifRef = useRef(null);

  // Core data
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [viewApp, setViewApp] = useState(null);
  const [hours, setHours] = useState("");
  const [logNote, setLogNote] = useState("");

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters & UI
  const [appFilter, setAppFilter] = useState("all");
  const [hoursLogged, setHoursLogged] = useState(0);
  const [certificatesEarned, setCertificatesEarned] = useState(0);

  // ===== Data Fetching =====
  const fetchData = async (userId) => {
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(prof);
      await fetchApplications(userId);
      await fetchMyComplaints(userId);
      await fetchNotifications(userId);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const fetchApplications = async (userId) => {
    const { data, error } = await supabase
      .from("applications")
      .select(`*, opportunities:opportunity_id (*)`)
      .eq("volunteer_id", userId)
      .order("applied_at", { ascending: false });

    if (error) console.error("[Volunteer] Applications error:", error);
    else {
      setApplications(data || []);
      const approved = (data || []).filter((a) => a.status?.toLowerCase() === "approved").length;
      setCertificatesEarned(approved > 0 ? approved : 0);
    }
  };

  const fetchMyComplaints = async (userId) => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false });
    if (error) console.error("[Volunteer] Complaints error:", error);
    else setMyComplaints(data || []);
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

  // ===== Realtime Notifications =====
  useEffect(() => {
    if (!user?.id) return;

    const channels = [];

    // 1. Application status changes (volunteer is me)
    const appChannel = supabase
      .channel(`volunteer-apps-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `volunteer_id=eq.${user.id}`,
        },
        async (payload) => {
          const oldSt = payload.old.status;
          const newSt = payload.new.status;
          if (oldSt === newSt) return;

          const title = "Application Updated";
          const msg = `Your application was ${newSt.toLowerCase()}`;
          showToast(msg, "info");

          await supabase.from("notifications").insert({
            user_id: user.id,
            title,
            message: msg,
            type: "application",
            read: false,
          });
          fetchNotifications(user.id);
          fetchApplications(user.id);
        }
      )
      .subscribe();
    channels.push(appChannel);

    // 2. Complaint I filed — admin updated status
    const myReportChannel = supabase
      .channel(`volunteer-reports-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "complaints",
          filter: `reporter_id=eq.${user.id}`,
        },
        async (payload) => {
          const title = "Report Status Updated";
          const msg = `Admin marked your report as ${payload.new.status}`;
          showToast(msg, "info");

          await supabase.from("notifications").insert({
            user_id: user.id,
            title,
            message: msg,
            type: "complaint",
            read: false,
          });
          fetchNotifications(user.id);
          fetchMyComplaints(user.id);
        }
      )
      .subscribe();
    channels.push(myReportChannel);

    // 3. Someone reported ME
    const againstChannel = supabase
      .channel(`volunteer-against-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "complaints",
          filter: `reported_id=eq.${user.id}`,
        },
        async (payload) => {
          const title = "New Complaint Against You";
          const msg = `A ${payload.new.reason} complaint was filed against you`;
          showToast(msg, "warning");

          await supabase.from("notifications").insert({
            user_id: user.id,
            title,
            message: msg,
            type: "report",
            read: false,
          });
          fetchNotifications(user.id);
        }
      )
      .subscribe();
    channels.push(againstChannel);

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [user?.id]);

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
      await fetchData(authUser.id);
      setLoading(false);
    };
    init();
  }, [navigate]);

  // Polling fallback
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      fetchApplications(user.id);
      fetchMyComplaints(user.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Click outside to close notif panel
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

  const handleCancelApp = async (appId) => {
    if (!window.confirm("Cancel this application?")) return;
    const { error } = await supabase.from("applications").delete().eq("id", appId);
    if (error) showToast("Error cancelling", "error");
    else {
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      showToast("Application cancelled.");
    }
  };

  const handleLogHoursSubmit = (e) => {
    e.preventDefault();
    if (!hours || hours <= 0) {
      showToast("Please enter valid hours", "error");
      return;
    }
    setHoursLogged((prev) => prev + Number(hours));
    showToast(`✅ ${hours} hours logged successfully!`);
    setShowLogModal(false);
    setHours("");
    setLogNote("");
  };

  const handleGetCertificate = () => {
    const name = profile?.full_name || "Volunteer";
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Certificate - ${name}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Inter:wght@400;500&display=swap');
body{margin:0;padding:0;background:#F7F5EF;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Inter',sans-serif;}
.cert{width:900px;background:white;border:12px solid #2F5D50;padding:60px 80px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.15);}
.cert-header{font-size:18px;color:#8A8F86;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:30px;}
.cert h1{font-family:'Fraunces',serif;font-size:52px;color:#1B3A28;margin:0 0 30px;}
.cert-line{width:120px;height:3px;background:#B8792A;margin:0 auto 30px;}
.cert-text{font-size:20px;color:#4B534E;line-height:1.6;margin-bottom:20px;}
.cert-name{font-family:'Fraunces',serif;font-size:42px;color:#2F5D50;margin:30px 0;font-weight:600;}
.cert-footer{margin-top:50px;display:flex;justify-content:space-between;align-items:center;padding-top:30px;border-top:1px solid #E4E0D6;}
.cert-date{font-size:14px;color:#8A8F86;}
.cert-logo{font-family:'Fraunces',serif;font-size:18px;color:#1B3A28;font-weight:600;}
</style></head>
<body>
<div class="cert"><div class="cert-header">NGO Connect</div>
<h1>Certificate of Appreciation</h1><div class="cert-line"></div>
<div class="cert-text">This is to certify that</div>
<div class="cert-name">${name}</div>
<div class="cert-text">has demonstrated outstanding commitment and dedication<br>through their volunteer work with NGO Connect.</div>
<div class="cert-footer"><div class="cert-date">Date: ${new Date().toLocaleDateString()}</div><div class="cert-logo">🌿 NGO Connect</div></div>
</div></body></html>`;
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

  const getSeverityColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "resolved") return "#2F5D50";
    if (s === "dismissed") return "#B24444";
    if (s === "investigating") return "#B8792A";
    return "#8A8F86";
  };

  // Derived
  const filteredApps = applications.filter((a) => {
    if (appFilter === "all") return true;
    return (a.status || "pending").toLowerCase() === appFilter;
  });

  const approvedCount = applications.filter((a) => a.status?.toLowerCase() === "approved").length;
  const pendingCount = applications.filter((a) => a.status?.toLowerCase() === "pending").length;
  const impactPercent = Math.min(((approvedCount * 4 + hoursLogged) / 50) * 100, 100);

  if (loading) return <div className="vol-loading">Loading dashboard...</div>;

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
        padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #2F5D50, #4A8F7B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: "20px", fontWeight: 700, fontFamily: "'Fraunces', serif"
          }}>
            {profile?.full_name?.charAt(0) || "V"}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", color: "#1B3A28", fontFamily: "'Fraunces', serif" }}>
              Hello, {profile?.full_name || "Volunteer"} 👋
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6B7268", fontSize: "13px" }}>
              Track your applications, hours, and impact
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
                position: "absolute", right: 0, top: 52, width: 360,
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
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "28px", textAlign: "center", color: "#8A8F86", fontSize: "13px" }}>
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

          <Link to="/volunteer/profile" style={{
            background: "#1B3A28", color: "white", padding: "10px 18px",
            borderRadius: "10px", textDecoration: "none", fontSize: "13px", fontWeight: 600
          }}>
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        {[
          { label: "Total Applications", value: applications.length, icon: "📋", color: "#2F5D50" },
          { label: "Approved", value: approvedCount, icon: "✅", color: "#2F5D50" },
          { label: "Pending", value: pendingCount, icon: "⏳", color: "#B8792A" },
          { label: "Hours Logged", value: hoursLogged, icon: "⏱️", color: "#4A7C59" },
          { label: "Certificates", value: certificatesEarned, icon: "📜", color: "#B8792A" },
          { label: "Reports Filed", value: myComplaints.length, icon: "📝", color: "#8A8F86" },
        ].map((stat, i) => (
          <div key={i} style={{
            background: "white", borderRadius: "14px", padding: "20px",
            border: "1px solid #E4E0D6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "transform 0.2s, box-shadow 0.2s", cursor: "default"
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>{stat.icon}</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: stat.color, fontFamily: "'Fraunces', serif" }}>{stat.value}</div>
            <div style={{ fontSize: "12px", color: "#8A8F86", marginTop: "4px", fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ padding: "0 32px 40px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Applications */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E4E0D6", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F0EDE6", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "17px", color: "#1B3A28", fontFamily: "'Fraunces', serif" }}>My Applications</h2>
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
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
                <div style={{ color: "#6B7268", fontSize: "14px", fontWeight: 500 }}>
                  {appFilter === "all" ? "No applications yet." : `No ${appFilter} applications.`}
                </div>
                <Link to="/opportunities" style={{ color: "#2F5D50", fontSize: "13px", fontWeight: 600, marginTop: "8px", display: "inline-block" }}>
                  Browse opportunities →
                </Link>
              </div>
            ) : (
              <div>
                {filteredApps.map((app) => {
                  const opp = app.opportunities || {};
                  const status = (app.status || "pending").toLowerCase();
                  const statusColor = status === "approved" ? "#2F5D50" : status === "rejected" ? "#B24444" : "#B8792A";
                  const statusBg = status === "approved" ? "#E8F5E9" : status === "rejected" ? "#FBE9E7" : "#FFF8E1";
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
                          width: 44, height: 44, borderRadius: "12px", background: "#F7F5EF",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "18px"
                        }}>
                          {opp.category === "Education" ? "📚" : opp.category === "Health" ? "🏥" : opp.category === "Environment" ? "🌱" : "🌿"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#1B3A28", fontSize: "14px" }}>{opp.title || "Opportunity"}</div>
                          <div style={{ fontSize: "12px", color: "#8A8F86", marginTop: "2px" }}>
                            {opp.ngo_name || "NGO"} · {opp.location || "Remote"} · {new Date(app.applied_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: "20px", fontSize: "11px",
                          fontWeight: 700, background: statusBg, color: statusColor, textTransform: "capitalize"
                        }}>
                          {app.status || "Pending"}
                        </span>
                        <button onClick={() => setViewApp(app)} style={{
                          background: "none", border: "1px solid #E4E0D6", borderRadius: "8px",
                          padding: "6px 12px", fontSize: "12px", color: "#2F5D50", fontWeight: 600, cursor: "pointer"
                        }}>
                          View
                        </button>
                        {status === "pending" && (
                          <button onClick={() => handleCancelApp(app.id)} style={{
                            background: "none", border: "none", color: "#B24444", fontSize: "12px", cursor: "pointer", fontWeight: 600
                          }}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Complaints */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E4E0D6", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F0EDE6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: "17px", color: "#1B3A28", fontFamily: "'Fraunces', serif" }}>My Reports & Complaints</h2>
              <span style={{ fontSize: "12px", color: "#8A8F86", fontWeight: 500 }}>{myComplaints.length} filed</span>
            </div>

            {myComplaints.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                <div style={{ color: "#6B7268", fontSize: "14px", fontWeight: 500 }}>No reports filed yet. All good!</div>
              </div>
            ) : (
              <div>
                {myComplaints.map((c) => (
                  <div key={c.id} style={{
                    padding: "18px 24px", borderBottom: "1px solid #F7F5EF",
                    borderLeft: `4px solid ${getSeverityColor(c.status)}`,
                    transition: "background 0.15s"
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAF8"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ fontWeight: 600, color: "#1B3A28", fontSize: "14px" }}>
                        Reported {c.reported_name || "NGO"}
                      </div>
                      <span className={`status-pill ${getComplaintStatusClass(c.status)}`} style={{
                        padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700
                      }}>
                        {getComplaintStatusLabel(c.status)}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#8A8F86", marginBottom: "6px" }}>
                      {c.reason} · {new Date(c.created_at).toLocaleDateString()}
                    </div>
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Quick Actions */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E4E0D6", padding: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#1B3A28", fontFamily: "'Fraunces', serif" }}>Quick Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "⏱ Log hours", action: () => setShowLogModal(true) },
                { label: "📜 Get certificate", action: handleGetCertificate },
                { label: "🔍 Find opportunities", link: "/opportunities" },
                { label: "👤 Edit profile", link: "/volunteer/profile" },
              ].map((item, i) => (
                item.link ? (
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
                ) : (
                  <button key={i} onClick={item.action} style={{
                    padding: "12px 16px", borderRadius: "10px", background: "#F7F5EF",
                    color: "#1B3A28", border: "1px solid transparent", fontSize: "13px", fontWeight: 600,
                    cursor: "pointer", textAlign: "left", transition: "all 0.2s", width: "100%"
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#E4E0D6"; e.currentTarget.style.background = "white"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "#F7F5EF"; }}
                  >
                    {item.label}
                  </button>
                )
              ))}
            </div>
          </div>

          {/* Impact Visualization */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E4E0D6", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", color: "#1B3A28", fontFamily: "'Fraunces', serif" }}>Impact Score</h3>
              <TrendUpIcon />
            </div>
            <div style={{ height: 8, background: "#F0EDE6", borderRadius: "4px", overflow: "hidden", marginBottom: "10px" }}>
              <div style={{
                width: `${impactPercent}%`, height: "100%",
                background: "linear-gradient(90deg, #2F5D50, #4A8F7B)", borderRadius: "4px",
                transition: "width 0.8s ease"
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#8A8F86" }}>
              <span>Beginner</span>
              <span style={{ color: "#2F5D50", fontWeight: 700 }}>{Math.round(impactPercent)}%</span>
              <span>Champion</span>
            </div>
            <div style={{ marginTop: "16px", padding: "12px", background: "#F7FBF9", borderRadius: "10px", fontSize: "12px", color: "#4B534E", lineHeight: 1.5 }}>
              <b style={{ color: "#2F5D50" }}>Tip:</b> Apply to more opportunities and log your hours to increase your impact score!
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
                {profile?.full_name?.charAt(0) || "V"}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#1B3A28", fontSize: "14px" }}>{profile?.full_name || "Volunteer"}</div>
                <div style={{ fontSize: "12px", color: "#8A8F86" }}>{profile?.email || "No email"}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#4B534E" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Location</span>
                <span style={{ fontWeight: 600 }}>{profile?.location || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Phone</span>
                <span style={{ fontWeight: 600 }}>{profile?.phone || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Role</span>
                <span style={{ fontWeight: 600, color: "#2F5D50" }}>Volunteer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Hours Modal */}
      {showLogModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, backdropFilter: "blur(4px)"
        }} onClick={() => setShowLogModal(false)}>
          <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: 420, padding: "28px", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#1B3A28", fontFamily: "'Fraunces', serif" }}>⏱ Log Volunteer Hours</h2>
              <button onClick={() => setShowLogModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#8A8F86" }}>✕</button>
            </div>
            <form onSubmit={handleLogHoursSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1B3A28", marginBottom: "6px" }}>Hours Worked *</label>
                <input type="number" min="0.5" step="0.5" placeholder="e.g., 4" value={hours} onChange={(e) => setHours(e.target.value)} required
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #E4E0D6", fontSize: "14px", outline: "none" }} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1B3A28", marginBottom: "6px" }}>Note (optional)</label>
                <textarea rows="3" placeholder="What did you work on?" value={logNote} onChange={(e) => setLogNote(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #E4E0D6", fontSize: "14px", outline: "none", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowLogModal(false)} style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #E4E0D6", background: "white", color: "#6B7268", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "#2F5D50", color: "white", fontWeight: 600, cursor: "pointer" }}>Submit Hours</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Application Modal */}
      {viewApp && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, backdropFilter: "blur(4px)", padding: "20px"
        }} onClick={() => setViewApp(null)}>
          <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: 520, maxHeight: "80vh", overflowY: "auto", padding: "28px", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#1B3A28", fontFamily: "'Fraunces', serif" }}>Application Details</h2>
              <button onClick={() => setViewApp(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#8A8F86" }}>✕</button>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "14px", color: "#2F5D50", marginBottom: "10px", fontWeight: 700 }}>🌿 Opportunity</h3>
              <div style={{ background: "#F7F5EF", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#4B534E" }}>
                <p style={{ margin: 0 }}><b>Title:</b> {viewApp.opportunities?.title || "N/A"}</p>
                <p style={{ margin: 0 }}><b>NGO:</b> {viewApp.opportunities?.ngo_name || "N/A"}</p>
                <p style={{ margin: 0 }}><b>Location:</b> {viewApp.opportunities?.location || "Remote"}</p>
                <p style={{ margin: 0 }}><b>Category:</b> {viewApp.opportunities?.category || "General"}</p>
                <p style={{ margin: 0 }}><b>Type:</b> {viewApp.opportunities?.type || "N/A"}</p>
                {viewApp.opportunities?.description && (
                  <p style={{ margin: "6px 0 0", color: "#6B7268", lineHeight: 1.5 }}>{viewApp.opportunities.description}</p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "14px", color: "#2F5D50", marginBottom: "10px", fontWeight: 700 }}>📝 Your Application</h3>
              <div style={{ background: "#F7F5EF", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#4B534E" }}>
                <p style={{ margin: 0 }}><b>Status:</b> <span style={{
                  padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                  background: (viewApp.status || "pending").toLowerCase() === "approved" ? "#E8F5E9" : (viewApp.status || "pending").toLowerCase() === "rejected" ? "#FBE9E7" : "#FFF8E1",
                  color: (viewApp.status || "pending").toLowerCase() === "approved" ? "#2F5D50" : (viewApp.status || "pending").toLowerCase() === "rejected" ? "#B24444" : "#B8792A"
                }}>{viewApp.status || "Pending"}</span></p>
                <p style={{ margin: 0 }}><b>Applied on:</b> {new Date(viewApp.applied_at).toLocaleDateString()}</p>
                {viewApp.experience && <p style={{ margin: 0 }}><b>Experience:</b> {viewApp.experience}</p>}
                {viewApp.motivation && <p style={{ margin: 0 }}><b>Motivation:</b> {viewApp.motivation}</p>}
                {viewApp.availability && <p style={{ margin: 0 }}><b>Availability:</b> {viewApp.availability}</p>}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setViewApp(null)} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "#1B3A28", color: "white", fontWeight: 600, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VolunteerDashboard;