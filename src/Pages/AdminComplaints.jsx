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
      c.reporter?.full_name?.toLowerCase().includes(term) ||
      c.reported_id?.toLowerCase().includes(term)
    );
  });

  if (loading) return <div className="admin-loading">Loading complaints...</div>;

  return (
    <div className="admin-page">
      {toast.show && <div className={`admin-toast ${toast.type}`}><span>{toast.msg}</span></div>}

      <div className="admin-header">
        <div className="admin-eyebrow">Admin · Complaint Management</div>
        <h1>Complaints & Reports</h1>
        <p>Review and manage user-submitted complaints</p>
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
                  <th>Reported User</th>
                  <th>Reason</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="ngo-name">{c.reporter?.full_name || "Unknown"}</div>
                      <div className="ngo-sub">{c.reporter?.email || "No email"}</div>
                    </td>
                    <td>
                      <code style={{ background: "#f3f4f6", padding: "4px 8px", borderRadius: "6px", fontSize: "0.85rem" }}>
                        {c.reported_id?.slice(0, 12)}...
                      </code>
                    </td>
                    <td>
                      <span className={`badge ${
                        c.reason === "Misconduct" ? "b-health" :
                        c.reason === "Fraud" ? "b-reject" :
                        c.reason === "Harassment" ? "b-gold" : "b-general"
                      }`}>
                        {c.reason}
                      </span>
                    </td>
                    <td>
                      <div style={{ maxWidth: "280px", fontSize: "0.9rem", color: "#4b5563" }}>
                        {c.description?.length > 80 ? c.description.slice(0, 80) + "..." : c.description}
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
                          <button
                            className="btn btn-approve"
                            onClick={() => handleStatusUpdate(c.id, "resolved")}
                          >
                            ✓ Resolve
                          </button>
                        )}
                        {c.status !== "pending" && (
                          <button
                            className="btn btn-view"
                            onClick={() => handleStatusUpdate(c.id, "pending")}
                          >
                            ↩ Reopen
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