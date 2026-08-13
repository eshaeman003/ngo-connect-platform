import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./AdminDashboard.css";

function AdminComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  useEffect(() => {
    const fetchComplaints = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!prof || prof.role !== "admin") { navigate("/"); return; }

      const { data } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      setComplaints(data || []);
      setLoading(false);
    };
    fetchComplaints();
  }, [navigate]);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const handleStatusUpdate = async (id, status) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status })
      .eq("id", id);

    if (error) {
      showToast("Error updating complaint", "error");
    } else {
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
      showToast(`Complaint marked as ${status.toLowerCase()}`);
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
    if (s === "resolved") return "Resolved";
    if (s === "dismissed") return "Dismissed";
    if (s === "investigating") return "Investigating";
    return "Pending";
  };

  const pendingCount = complaints.filter((c) => (c.status || "pending") === "pending").length;
  const investigatingCount = complaints.filter((c) => c.status === "investigating").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;
  const dismissedCount = complaints.filter((c) => c.status === "dismissed").length;
  const totalCount = complaints.length;

  // Chart data
  const chartData = [
    { label: "Pending", value: pendingCount, color: "#ce6363", bg: "#FBF1DF" },
    { label: "Investigating", value: investigatingCount, color: "#1565c0", bg: "#e3f2fd" },
    { label: "Resolved", value: resolvedCount, color: "#2F5D50", bg: "#E7EFEA" },
    { label: "Dismissed", value: dismissedCount, color: "#B24444", bg: "#FBE9E7" },
  ];

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  const filtered = complaints.filter((c) => {
    const statusMatch = activeFilter === "all" || (c.status || "pending") === activeFilter;
    const searchMatch =
      !search ||
      c.reporter_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.reported_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.reason?.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  if (loading) return <div className="admin-loading">Loading complaints...</div>;

  return (
    <div className="admin-page">
      {toast.show && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}

      <div className="admin-header">
        <div className="admin-eyebrow">Admin · Complaint Management</div>
        <h1>Complaints & Reports</h1>
        <p>Monitor, investigate, and resolve user complaints in real-time</p>
      </div>

      {/* Stats */}
      <div className="admin-stats complaints-stats">
        <div className="admin-stat danger">
          <div className="stat-bar"></div>
          <div className="stat-top"><span className="stat-num">{pendingCount}</span><span className="stat-icon">🚨</span></div>
          <div className="stat-label">Pending</div>
          <div className="stat-delta flag">needs action</div>
        </div>
        <div className="admin-stat gold">
          <div className="stat-bar"></div>
          <div className="stat-top"><span className="stat-num">{investigatingCount}</span><span className="stat-icon">🔍</span></div>
          <div className="stat-label">Investigating</div>
          <div className="stat-delta">under review</div>
        </div>
        <div className="admin-stat moss">
          <div className="stat-bar"></div>
          <div className="stat-top"><span className="stat-num">{resolvedCount}</span><span className="stat-icon">✓</span></div>
          <div className="stat-label">Resolved</div>
          <div className="stat-delta up">closed cases</div>
        </div>
        <div className="admin-stat rust">
          <div className="stat-bar"></div>
          <div className="stat-top"><span className="stat-num">{dismissedCount}</span><span className="stat-icon">✕</span></div>
          <div className="stat-label">Dismissed</div>
          <div className="stat-delta">no action</div>
        </div>
        <div className="admin-stat ink">
          <div className="stat-bar"></div>
          <div className="stat-top"><span className="stat-num">{totalCount}</span><span className="stat-icon">📋</span></div>
          <div className="stat-label">Total</div>
          <div className="stat-delta">all time</div>
        </div>
      </div>

      {/* Chart */}
      <div className="complaint-chart">
        <div className="panel-head" style={{ padding: "0 0 16px", borderBottom: "1px solid #E4E0D6", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "17px", color: "#1B3A28", margin: 0 }}>Complaint Breakdown</h2>
          <span className="panel-meta">Visual overview</span>
        </div>
        <div className="chart-bars">
          {chartData.map((item) => (
            <div className="chart-bar-wrap" key={item.label}>
              <div className="chart-label">{item.label}</div>
              <div className="chart-track">
                <div
                  className="chart-fill"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    background: item.color,
                  }}
                />
              </div>
              <div className="chart-val">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-filterchips">
          {[
            { key: "all", label: "All", count: totalCount },
            { key: "pending", label: "Pending", count: pendingCount },
            { key: "investigating", label: "Investigating", count: investigatingCount },
            { key: "resolved", label: "Resolved", count: resolvedCount },
            { key: "dismissed", label: "Dismissed", count: dismissedCount },
          ].map((f) => (
            <button
              key={f.key}
              className={activeFilter === f.key ? "on" : ""}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-panel">
        <div className="panel-head">
          <h2>All Complaints</h2>
          <span className="panel-meta">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        {filtered.length === 0 ? (
          <div className="admin-empty">No complaints found.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Reported</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className={c.status === "pending" ? "urgent-row" : ""}>
                    <td>
                      <div className="ngo-name">{c.reporter_name || "Anonymous"}</div>
                    </td>
                    <td>
                      <div className="ngo-name">{c.reported_name || "Unknown"}</div>
                    </td>
                    <td>
                      <span className="badge b-general">{c.type || "N/A"}</span>
                    </td>
                    <td>{c.reason || "N/A"}</td>
                    <td>
                      <span className={`status-pill ${getStatusClass(c.status)}`}>
                        {getStatusLabel(c.status)}
                      </span>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="row-actions">
                        {c.status !== "investigating" && (
                          <button
                            className="btn btn-view"
                            onClick={() => handleStatusUpdate(c.id, "investigating")}
                          >
                            Investigate
                          </button>
                        )}
                        {c.status !== "resolved" && (
                          <button
                            className="btn btn-approve"
                            onClick={() => handleStatusUpdate(c.id, "resolved")}
                          >
                            Mark Resolved
                          </button>
                        )}
                        {c.status !== "dismissed" && (
                          <button
                            className="btn btn-reject"
                            onClick={() => handleStatusUpdate(c.id, "dismissed")}
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminComplaints;