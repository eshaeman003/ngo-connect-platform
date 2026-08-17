import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
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

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from("complaints").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      const updated = complaints.map(c => c.id === id ? { ...c, status: newStatus } : c);
      setComplaints(updated);
      calculateStats(updated);
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const sendLegalNotice = async (complaint) => {
    const ngoId = complaint._ngo_id;
    if (!ngoId) { showToast("No NGO ID found", "error"); return; }
    try {
      await supabase.from("notifications").insert([{
        user_id: ngoId,
        title: "Legal Notice Received",
        message: `A legal notice has been issued regarding: ${complaint.reason}. Please take immediate action.`,
        type: "legal_notice",
        read: false,
      }]);
      showToast("Legal notice sent to NGO", "success");
    } catch (err) {
      showToast("Failed to send legal notice", "error");
    }
  };

  const sendWarning = async (complaint) => {
    const ngoId = complaint._ngo_id;
    if (!ngoId) { showToast("No NGO ID found", "error"); return; }
    try {
      await supabase.from("notifications").insert([{
        user_id: ngoId,
        title: "Warning Letter",
        message: `Warning: Your opportunity has been reported. Reason: ${complaint.reason}. Please review and comply with platform guidelines.`,
        type: "warning",
        read: false,
      }]);
      showToast("Warning letter sent to NGO", "success");
    } catch (err) {
      showToast("Failed to send warning", "error");
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
          <span>{toast.type === "success" ? "✓" : "⚠"} {toast.message}</span>
          <button onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <div className="complaints-container">
        <div className="page-header">
          <div className="header-left">
            <div className="header-icon">🛡</div>
            <div>
              <h1>Complaints Center</h1>
              <p>Monitor and manage all platform complaints</p>
            </div>
          </div>
          <button className="refresh-btn" onClick={fetchComplaints} disabled={loading}>
            {loading ? "⟳" : "↻"} Refresh
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">📊</div>
            <div className="stat-info"><h3>{stats.total}</h3><p>Total Complaints</p></div>
            <div className="stat-trend">📈 All time</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-info"><h3>{stats.pending}</h3><p>Pending</p></div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{width: `${stats.total ? (stats.pending/stats.total)*100 : 0}%`}}></div></div>
          </div>
          <div className="stat-card reviewed">
            <div className="stat-icon">👁</div>
            <div className="stat-info"><h3>{stats.reviewed}</h3><p>Under Review</p></div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{width: `${stats.total ? (stats.reviewed/stats.total)*100 : 0}%`}}></div></div>
          </div>
          <div className="stat-card resolved">
            <div className="stat-icon">✅</div>
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
                    {c.status === "pending" ? "⏳" : c.status === "reviewed" ? "👁" : "✅"}
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">Complaint against <strong>{c.ngo_name}</strong></p>
                    <span className="activity-time">{formatDate(c.created_at)}</span>
                  </div>
                  <span className={`activity-badge ${getStatusColor(c.status)}`}>{c.status}</span>
                </div>
              ))}
              {complaints.length === 0 && <div className="empty-activity">🔔<p>No recent activity</p></div>}
            </div>
          </div>
        </div>

        <div className="filters-bar">
          <div className="search-box">
            <span>🔍</span>
            <input type="text" placeholder="Search by NGO, reason, or opportunity..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-tabs">
            <button className={statusFilter === "all" ? "active" : ""} onClick={() => setStatusFilter("all")}>All</button>
            <button className={statusFilter === "pending" ? "active" : ""} onClick={() => setStatusFilter("pending")}>⏳ Pending</button>
            <button className={statusFilter === "reviewed" ? "active" : ""} onClick={() => setStatusFilter("reviewed")}>👁 Reviewed</button>
            <button className={statusFilter === "resolved" ? "active" : ""} onClick={() => setStatusFilter("resolved")}>✅ Resolved</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner"></div><p>Loading complaints...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
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
                      {complaint.status === "pending" ? "⏳" : complaint.status === "reviewed" ? "👁" : "✅"} {complaint.status}
                    </span>
                    <span className="date-badge">📅 {formatDate(complaint.created_at)}</span>
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
                      <span className="ngo-email">✉ {complaint.ngo_email}</span>
                    </div>
                  </div>

                  <div className="complaint-reason-box">
                    <div className="reason-label">🚨 Report Reason:</div>
                    <p className="reason-text">{complaint.reason}</p>
                  </div>
                </div>

                <div className="card-footer">
                  <button className="action-btn legal" onClick={() => sendLegalNotice(complaint)} title="Send Legal Notice">⚖ Legal Notice</button>
                  <button className="action-btn warning" onClick={() => sendWarning(complaint)} title="Send Warning">⚠ Warning</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}