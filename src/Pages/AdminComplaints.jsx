import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import {
  ShieldCheck, RefreshCw, BarChart3, TrendingUp, Clock, Eye, CheckCircle2,
  BellRing, Search, MessagesSquare, CalendarDays, Mail, AlertTriangle, Scale, X,
} from "lucide-react";
import "./AdminComplaints.css";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0, resolved: 0 });
  const navigate = useNavigate();

  useEffect(() => { fetchComplaints(); }, []);
  useEffect(() => { filterComplaints(); }, [complaints, search, statusFilter]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      let data = null;

      try {
        const res = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
        if (!res.error && res.data && res.data.length > 0) {
          data = res.data;
        }
      } catch (e) {}

      const safeData = (data || []).map(c => {
        let status = (c.status || "pending").toLowerCase();
        if (status === "investigating") status = "reviewed";

        return {
          ...c,
          _ngo_id: c.reported_id,
          ngo_name: c.reported_name || "Unknown NGO",
          ngo_email: c.reported_email || "N/A",
          status: status,
          reason: c.reason || "No reason provided",
          description: c.description || "",
          created_at: c.created_at || new Date().toISOString(),
        };
      });

      setComplaints(safeData);
      calculateStats(safeData);
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("Could not load complaints. Please retry.", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const pending = data.filter(c => c.status === "pending").length;
    const reviewed = data.filter(c => c.status === "reviewed").length;
    const resolved = data.filter(c => c.status === "resolved").length;
    setStats({ total, pending, reviewed, resolved });
  };

  const filterComplaints = () => {
    let result = [...complaints];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => 
        (c.reason || "").toLowerCase().includes(q) ||
        (c.ngo_name || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(c => c.status === statusFilter);
    }
    setFiltered(result);
  };

  // The DB only allows 'pending' | 'investigating' | 'resolved' for complaints.status.
  // The UI shows "Reviewed" for what the DB calls "investigating", so we need to
  // translate before writing back.
  const toDbStatus = (uiStatus) => (uiStatus === "reviewed" ? "investigating" : uiStatus);

  const updateStatus = async (id, newStatus) => {
    try {
      const dbStatus = toDbStatus(newStatus);
      const { error } = await supabase.from("complaints").update({ status: dbStatus }).eq("id", id);
      if (error) throw error;
      const updated = complaints.map(c => c.id === id ? { ...c, status: newStatus } : c);
      setComplaints(updated);
      calculateStats(updated);
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error("updateStatus error:", err);
      showToast(`Failed to update status: ${err.message || "unknown error"}`, "error");
    }
  };

  // Resolves the NGO's auth user_id from its ngos.id (or falls back to the id itself
  // if it's already a user_id / no matching row is found).
  const resolveNgoUserId = async (ngoId) => {
    const { data } = await supabase.from("ngos").select("user_id").eq("id", ngoId).maybeSingle();
    return data?.user_id || ngoId;
  };

  const sendLegalNotice = async (complaint) => {
    const ngoId = complaint._ngo_id;
    if (!ngoId) { showToast("No NGO ID found", "error"); return; }
    try {
      const targetUserId = await resolveNgoUserId(ngoId);
      const refNumber = `LN-${new Date().getFullYear()}-${String(complaint.id || Date.now()).toString().slice(-5)}`;
      const bodyMessage = [
        `Reference Number: ${refNumber}`,
        `Complaint Filed Against: ${complaint.ngo_name}`,
        `Reported Reason: ${complaint.reason}`,
        ``,
        `The NGO Connect Trust & Safety team has reviewed a complaint submitted by a platform volunteer regarding the above organization. Based on our review of the reported details and the organization's posting history, we have found sufficient grounds to issue this formal legal notice.`,
        ``,
        `Volunteer's Reported Details (basis for this notice):`,
        complaint.description ? `"${complaint.description}"` : "No further details were provided by the reporter.",
        ``,
        `You are required to address the reported issue and respond with corrective action within 7 business days of receiving this notice. Failure to respond or continued violations of platform guidelines may result in suspension of your NGO account and removal of all active listings.`,
        ``,
        `This notice has been logged on your account and is available for download as an official letter from your dashboard.`,
      ].join("\n");

      const { error } = await supabase.from("notifications").insert([{
        user_id: targetUserId,
        title: "Legal Notice Received",
        message: bodyMessage,
        type: "legal_notice",
        read: false,
      }]);
      if (error) throw error;
      showToast("Legal notice sent to NGO", "success");
    } catch (err) {
      console.error("sendLegalNotice error:", err);
      showToast(`Failed to send legal notice: ${err.message || "unknown error"}`, "error");
    }
  };

  const sendWarning = async (complaint) => {
    const ngoId = complaint._ngo_id;
    if (!ngoId) { showToast("No NGO ID found", "error"); return; }
    try {
      const targetUserId = await resolveNgoUserId(ngoId);
      const refNumber = `WL-${new Date().getFullYear()}-${String(complaint.id || Date.now()).toString().slice(-5)}`;
      const bodyMessage = [
        `Reference Number: ${refNumber}`,
        `Complaint Filed Against: ${complaint.ngo_name}`,
        `Reported Reason: ${complaint.reason}`,
        ``,
        `A volunteer on the NGO Connect platform has reported one of your posted opportunities. Upon initial review, our compliance team has identified a possible violation of platform guidelines and is issuing this warning as a first-level advisory.`,
        ``,
        `Volunteer's Reported Details (basis for this warning):`,
        complaint.description ? `"${complaint.description}"` : "No further details were provided by the reporter.",
        ``,
        `Please review the reported opportunity and ensure it complies with our community guidelines. No account action has been taken at this time, but repeated or unresolved reports may escalate to a formal legal notice or account suspension.`,
        ``,
        `This warning has been logged on your account and is available for download as an official letter from your dashboard.`,
      ].join("\n");

      const { error } = await supabase.from("notifications").insert([{
        user_id: targetUserId,
        title: "Warning Letter",
        message: bodyMessage,
        type: "warning",
        read: false,
      }]);
      if (error) throw error;
      showToast("Warning letter sent to NGO", "success");
    } catch (err) {
      console.error("sendWarning error:", err);
      showToast(`Failed to send warning: ${err.message || "unknown error"}`, "error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "status-pending";
      case "reviewed": return "status-reviewed";
      case "resolved": return "status-resolved";
      default: return "status-pending";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="admin-complaints-page">
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {toast.message}
          </span>
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      <div className="complaints-container">
        <div className="page-header">
          <div className="header-left">
            <div className="header-icon"><ShieldCheck size={22} /></div>
            <div>
              <h1>Complaints Center</h1>
              <p>Monitor and manage all platform complaints</p>
            </div>
          </div>
          <button className="refresh-btn" onClick={fetchComplaints} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon"><BarChart3 size={20} /></div>
            <div className="stat-info"><h3>{stats.total}</h3><p>Total Complaints</p></div>
            <div className="stat-trend"><TrendingUp size={13} /> All time</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon"><Clock size={20} /></div>
            <div className="stat-info"><h3>{stats.pending}</h3><p>Pending</p></div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{width: `${stats.total ? (stats.pending/stats.total)*100 : 0}%`}}></div></div>
          </div>
          <div className="stat-card reviewed">
            <div className="stat-icon"><Eye size={20} /></div>
            <div className="stat-info"><h3>{stats.reviewed}</h3><p>Under Review</p></div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{width: `${stats.total ? (stats.reviewed/stats.total)*100 : 0}%`}}></div></div>
          </div>
          <div className="stat-card resolved">
            <div className="stat-icon"><CheckCircle2 size={20} /></div>
            <div className="stat-info"><h3>{stats.resolved}</h3><p>Resolved</p></div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{width: `${stats.total ? (stats.resolved/stats.total)*100 : 0}%`}}></div></div>
          </div>
        </div>

        <div className="visual-summary">
          <div className="summary-card">
            <h3>Complaint Distribution</h3>
            <div className="donut-chart">
              <svg viewBox="0 0 100 100" className="donut-svg">
                {stats.total > 0 ? (
                  <>
                    <circle className="donut-bg" cx="50" cy="50" r="40" />
                    <circle className="donut-segment pending-seg" cx="50" cy="50" r="40" 
                      strokeDasharray={`${(stats.pending/stats.total)*251} 251`} strokeDashoffset="0" />
                    <circle className="donut-segment reviewed-seg" cx="50" cy="50" r="40" 
                      strokeDasharray={`${(stats.reviewed/stats.total)*251} 251`} strokeDashoffset={`-${(stats.pending/stats.total)*251}`} />
                    <circle className="donut-segment resolved-seg" cx="50" cy="50" r="40" 
                      strokeDasharray={`${(stats.resolved/stats.total)*251} 251`} strokeDashoffset={`-${((stats.pending+stats.reviewed)/stats.total)*251}`} />
                  </>
                ) : <circle className="donut-bg" cx="50" cy="50" r="40" />}
              </svg>
              <div className="donut-center"><span className="donut-number">{stats.total}</span><span className="donut-label">Total</span></div>
            </div>
            <div className="donut-legend">
              <div className="legend-item"><span className="legend-dot pending-dot"></span><span>Pending ({stats.pending})</span></div>
              <div className="legend-item"><span className="legend-dot reviewed-dot"></span><span>Reviewed ({stats.reviewed})</span></div>
              <div className="legend-item"><span className="legend-dot resolved-dot"></span><span>Resolved ({stats.resolved})</span></div>
            </div>
          </div>

          <div className="summary-card recent-activity">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {complaints.slice(0, 5).map((c, idx) => (
                <div key={idx} className="activity-item">
                  <div className={`activity-icon ${c.status}`}>
                    {c.status === "pending" ? <Clock size={15} /> : c.status === "reviewed" ? <Eye size={15} /> : <CheckCircle2 size={15} />}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">Complaint against <strong>{c.ngo_name}</strong></p>
                    <span className="activity-time">{formatDate(c.created_at)}</span>
                  </div>
                  <span className={`activity-badge ${getStatusColor(c.status)}`}>{c.status}</span>
                </div>
              ))}
              {complaints.length === 0 && <div className="empty-activity"><BellRing size={22} /><p>No recent activity</p></div>}
            </div>
          </div>
        </div>

        <div className="filters-bar">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search by NGO, reason, or opportunity..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-tabs">
            <button className={statusFilter === "all" ? "active" : ""} onClick={() => setStatusFilter("all")}>All</button>
            <button className={statusFilter === "pending" ? "active" : ""} onClick={() => setStatusFilter("pending")}><Clock size={13} /> Pending</button>
            <button className={statusFilter === "reviewed" ? "active" : ""} onClick={() => setStatusFilter("reviewed")}><Eye size={13} /> Reviewed</button>
            <button className={statusFilter === "resolved" ? "active" : ""} onClick={() => setStatusFilter("resolved")}><CheckCircle2 size={13} /> Resolved</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner"></div><p>Loading complaints...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><MessagesSquare size={32} /></div>
            <h3>No complaints found</h3>
            <p>{search || statusFilter !== "all" ? "Try adjusting your filters" : "No complaints have been submitted yet"}</p>
          </div>
        ) : (
          <div className="complaints-grid">
            {filtered.map((complaint) => (
              <div key={complaint.id} className="complaint-card">
                <div className="card-header">
                  <div className="card-meta">
                    <span className={`status-badge ${getStatusColor(complaint.status)}`}>
                      {complaint.status === "pending" ? <Clock size={12} /> : complaint.status === "reviewed" ? <Eye size={12} /> : <CheckCircle2 size={12} />} {complaint.status}
                    </span>
                    <span className="date-badge"><CalendarDays size={12} /> {formatDate(complaint.created_at)}</span>
                  </div>
                  <div className="card-actions-top">
                    <select value={complaint.status} onChange={(e) => updateStatus(complaint.id, e.target.value)} className="status-select">
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="card-body">
                  <div className="ngo-info">
                    <div className="ngo-avatar">{(complaint.ngo_name || "N").charAt(0).toUpperCase()}</div>
                    <div className="ngo-details">
                      <h4>{complaint.ngo_name}</h4>
                      <span className="ngo-email"><Mail size={12} /> {complaint.ngo_email}</span>
                    </div>
                  </div>

                  <div className="complaint-reason-box">
                    <div className="reason-label"><AlertTriangle size={13} /> Report Reason:</div>
                    <p className="reason-text">{complaint.reason}</p>
                    {complaint.description && (
                      <>
                        <div className="reason-label" style={{ marginTop: 10 }}><AlertTriangle size={13} /> Volunteer's Report:</div>
                        <p className="reason-text">{complaint.description}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="card-footer">
                  <button className="action-btn legal" onClick={() => sendLegalNotice(complaint)} title="Send Legal Notice"><Scale size={14} /> Legal Notice</button>
                  <button className="action-btn warning" onClick={() => sendWarning(complaint)} title="Send Warning"><AlertTriangle size={14} /> Warning</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}