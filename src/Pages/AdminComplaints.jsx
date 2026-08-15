import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./AdminDashboard.css";

function AdminComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
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
        .select(`*, reporter:reporter_id (full_name, email)`)
        .order("created_at", { ascending: false });

      setComplaints(data || []);
      setLoading(false);
    };

    fetchComplaints();

    // Real-time subscription
    const channel = supabase
      .channel("complaints-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "complaints" }, (payload) => {
        setComplaints((prev) => [payload.new, ...prev]);
        showToast("🚨 New complaint received!", "error");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      showToast("Error updating status", "error");
    } else {
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
      showToast(`Complaint marked as ${newStatus}`);
    }
  };

  const filtered = complaints.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      c.reason?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term) ||
      c.reporter?.full_name?.toLowerCase().includes(term)
    );
  });

  if (loading) return <div className="admin-loading">Loading complaints...</div>;

  return (
    <div className="admin-page">
      {toast.show && <div className={`admin-toast ${toast.type}`}><span>{toast.msg}</span></div>}

      <div className="admin-header">
        <div className="admin-eyebrow">Admin · Complaint Management</div>
        <h1>Complaints & Reports</h1>
        <p>Review and manage user-submitted complaints & opportunity reports</p>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search complaints by reason, reporter, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

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
                  <th>Reason</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isOppReport = c.description?.includes("Reported Opportunity:");
                  return (
                    <tr key={c.id} className={isOppReport ? "highlight-row" : ""}>
                      <td>
                        <div className="ngo-name">{c.reporter?.full_name || "Anonymous"}</div>
                        <div className="ngo-sub">{c.reporter?.email || "Hidden for privacy"}</div>
                      </td>
                      <td>
                        <span className={`badge ${
                          c.reason === "Misconduct" ? "b-health" :
                          c.reason === "Fraud" ? "b-reject" :
                          c.reason === "Harassment" ? "b-gold" : "b-general"
                        }`}>
                          {c.reason}
                        </span>
                        {isOppReport && <span className="opp-report-badge">📢 Opportunity</span>}
                      </td>
                      <td>
                        <div style={{ maxWidth: "320px", fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.5 }}>
                          {c.description?.length > 120 ? c.description.slice(0, 120) + "..." : c.description}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill s-${(c.status || "pending").toLowerCase()}`}>
                          {c.status || "Pending"}
                        </span>
                      </td>
                      <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="row-actions">
                          {c.status !== "resolved" && (
                            <button className="btn btn-approve" onClick={() => handleStatusUpdate(c.id, "resolved")}>
                              ✓ Resolve
                            </button>
                          )}
                          {c.status !== "pending" && (
                            <button className="btn btn-view" onClick={() => handleStatusUpdate(c.id, "pending")}>
                              ↩ Reopen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminComplaints;