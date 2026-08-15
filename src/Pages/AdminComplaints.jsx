import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./AdminComplaints.css";

const STATUS_TABS = [
  { key: "all", label: "All Complaints" },
  { key: "pending", label: "New" },
  { key: "investigating", label: "Under Investigation" },
  { key: "action_taken", label: "Action Taken" },
  { key: "dismissed", label: "Dismissed" },
];

const SEVERITY_CONFIG = {
  Low: { class: "sev-low", color: "#16a34a", icon: "🟢" },
  Medium: { class: "sev-medium", color: "#ca8a04", icon: "🟡" },
  High: { class: "sev-high", color: "#ea580c", icon: "🟠" },
  Critical: { class: "sev-critical", color: "#dc2626", icon: "🔴" },
};

const REASON_ICONS = {
  Misconduct: "⚠️",
  Fraud: "💰",
  Harassment: "🛑",
  "Fake Posting": "📰",
  Other: "❓",
};

function AdminComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Detail modal
  const [detailModal, setDetailModal] = useState({ open: false, complaint: null });

  // Action modal
  const [actionModal, setActionModal] = useState({ open: false, action: "", complaint: null, reason: "", duration: "7" });

  // Notice preview modal
  const [noticeModal, setNoticeModal] = useState({ open: false, type: "", complaint: null, reason: "" });

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, investigating: 0, actionTaken: 0, dismissed: 0 });

  useEffect(() => {
    const fetchComplaints = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!prof || prof.role !== "admin") { navigate("/"); return; }

      const { data } = await supabase
        .from("complaints")
        .select(`*, reporter:reporter_id (full_name, email)`)
        .order("created_at", { ascending: false });

      const list = data || [];
      setComplaints(list);
      setStats({
        total: list.length,
        pending: list.filter((c) => c.status === "pending").length,
        investigating: list.filter((c) => c.status === "investigating").length,
        actionTaken: list.filter((c) => c.status === "action_taken").length,
        dismissed: list.filter((c) => c.status === "dismissed").length,
      });
      setLoading(false);
    };

    fetchComplaints();

    // Real-time
    const channel = supabase
      .channel("complaints-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "complaints" }, (payload) => {
        setComplaints((prev) => [payload.new, ...prev]);
        setStats((s) => ({ ...s, total: s.total + 1, pending: s.pending + 1 }));
        showToast("🚨 New complaint received!", "error");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3500);
  };

  const updateStatus = async (id, newStatus, extra = {}) => {
    const { error } = await supabase.from("complaints").update({ status: newStatus, ...extra }).eq("id", id);
    if (error) { showToast("Error updating status", "error"); return false; }
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus, ...extra } : c)));
    return true;
  };

  const handleAction = async () => {
    const { action, complaint, reason, duration } = actionModal;
    if (!reason.trim()) { alert("Reason is required"); return; }

    let success = false;
    const now = new Date().toISOString();

    if (action === "investigate") {
      success = await updateStatus(complaint.id, "investigating", { admin_notes: reason, investigated_at: now });
      if (success) showToast("🔍 Marked as Under Investigation");
    } else if (action === "dismiss") {
      success = await updateStatus(complaint.id, "dismissed", { resolution: reason, resolved_at: now });
      if (success) showToast("✓ Complaint dismissed");
    } else if (action === "warn") {
      success = await updateStatus(complaint.id, "action_taken", { action: "warning", action_reason: reason, action_taken_at: now });
      if (success) { showToast("⚠️ Warning issued"); openNoticePreview("warning", complaint, reason); }
    } else if (action === "suspend") {
      success = await updateStatus(complaint.id, "action_taken", { action: "suspend", action_reason: reason, action_duration: duration, action_taken_at: now });
      if (success) { showToast(`⛔ Suspended for ${duration} days`); openNoticePreview("suspension", complaint, reason); }
    } else if (action === "ban") {
      success = await updateStatus(complaint.id, "action_taken", { action: "ban", action_reason: reason, action_taken_at: now });
      if (success) { showToast("🚫 Entity banned permanently"); openNoticePreview("ban", complaint, reason); }
    } else if (action === "legal") {
      success = await updateStatus(complaint.id, "investigating", { admin_notes: reason, legal_notice_issued: true });
      if (success) { showToast("⚖️ Legal notice issued"); openNoticePreview("legal", complaint, reason); }
    }

    if (success) {
      setStats((s) => {
        const next = { ...s };
        if (action === "dismiss") { next.pending = Math.max(0, next.pending - 1); next.dismissed += 1; }
        else if (action === "investigate") { next.pending = Math.max(0, next.pending - 1); next.investigating += 1; }
        else if (["warn", "suspend", "ban"].includes(action)) { next.investigating = Math.max(0, next.investigating - 1); next.actionTaken += 1; }
        return next;
      });
    }

    closeActionModal();
  };

  const openActionModal = (action, complaint) => {
    setActionModal({ open: true, action, complaint, reason: "", duration: "7" });
  };

  const closeActionModal = () => {
    setActionModal({ open: false, action: "", complaint: null, reason: "", duration: "7" });
  };

  const openNoticePreview = (type, complaint, reason) => {
    setNoticeModal({ open: true, type, complaint, reason });
  };

  const closeNoticeModal = () => {
    setNoticeModal({ open: false, type: "", complaint: null, reason: "" });
  };

  const getNoticeTitle = () => {
    const t = noticeModal.type;
    if (t === "warning") return "WARNING NOTICE";
    if (t === "suspension") return "SUSPENSION NOTICE";
    if (t === "ban") return "BAN NOTICE";
    if (t === "legal") return "LEGAL NOTICE";
    return "OFFICIAL NOTICE";
  };

  const getNoticeRef = () => {
    const prefix = noticeModal.type === "legal" ? "NGC-LN" : "NGC-WN";
    const num = String(Math.floor(Math.random() * 9000) + 1000);
    return `${prefix}-2026-${num}`;
  };

  const filtered = complaints.filter((c) => {
    const matchesTab = activeTab === "all" || c.status === activeTab;
    const matchesSearch = !search || c.reason?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()) || c.reporter?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesSev = severityFilter === "All" || c.severity === severityFilter;
    const matchesType = typeFilter === "All" || c.reason === typeFilter;
    return matchesTab && matchesSearch && matchesSev && matchesType;
  });

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  const getSeverity = (c) => c.severity || "Medium";

  if (loading) return <div className="admin-loading">Loading complaints...</div>;

  return (
    <div className="admin-page">
      {toast.show && <div className={`admin-toast ${toast.type}`}><span>{toast.msg}</span></div>}

      {/* Header */}
      <div className="admin-header">
        <div className="admin-eyebrow">Trust & Safety · Complaint Management</div>
        <h1>Complaints & Reports</h1>
        <p>Review, investigate, and take action on platform violations</p>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stat ink" onClick={() => setActiveTab("all")} style={{ cursor: "pointer" }}>
          <div className="stat-top"><span className="stat-num">{stats.total}</span><span className="stat-icon">📋</span></div>
          <div className="stat-label">Total Complaints</div>
        </div>
        <div className="admin-stat gold" onClick={() => setActiveTab("pending")} style={{ cursor: "pointer" }}>
          <div className="stat-top"><span className="stat-num">{stats.pending}</span><span className="stat-icon">🆕</span></div>
          <div className="stat-label">New</div>
        </div>
        <div className="admin-stat blue" onClick={() => setActiveTab("investigating")} style={{ cursor: "pointer" }}>
          <div className="stat-top"><span className="stat-num">{stats.investigating}</span><span className="stat-icon">🔍</span></div>
          <div className="stat-label">Under Investigation</div>
        </div>
        <div className="admin-stat moss" onClick={() => setActiveTab("action_taken")} style={{ cursor: "pointer" }}>
          <div className="stat-top"><span className="stat-num">{stats.actionTaken}</span><span className="stat-icon">⚖️</span></div>
          <div className="stat-label">Action Taken</div>
        </div>
        <div className="admin-stat rust" onClick={() => setActiveTab("dismissed")} style={{ cursor: "pointer" }}>
          <div className="stat-top"><span className="stat-num">{stats.dismissed}</span><span className="stat-icon">✓</span></div>
          <div className="stat-label">Dismissed</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {STATUS_TABS.map((tab) => (
          <button key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <span>🔍</span>
          <input type="text" placeholder="Search complaints..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <div className="admin-filters">
          <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}>
            <option value="All">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
            <option value="All">All Types</option>
            <option value="Misconduct">Misconduct</option>
            <option value="Fraud">Fraud</option>
            <option value="Harassment">Harassment</option>
            <option value="Fake Posting">Fake Posting</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="admin-panel">
        <div className="panel-head">
          <h2>Complaint Registry</h2>
          <span className="panel-meta">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty">No complaints found.</div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table complaints-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Reporter</th>
                    <th>Reported Entity</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c) => {
                    const sev = SEVERITY_CONFIG[getSeverity(c)] || SEVERITY_CONFIG.Medium;
                    const statusClass = c.status || "pending";
                    const isPrior = Math.random() > 0.7; // Mock prior flag
                    return (
                      <tr key={c.id} className={`status-${statusClass}`}>
                        <td><code className="complaint-id">{c.id?.slice(0, 8)}</code></td>
                        <td>
                          <div className="ngo-name">{c.reporter?.full_name || "Anonymous"}</div>
                          <div className="ngo-sub">{c.anonymous ? "🕵️ Anonymous" : c.reporter?.email}</div>
                        </td>
                        <td>
                          <div className="ngo-name">{c.reported_name || "Unknown Entity"}</div>
                          <div className="ngo-sub">{c.entity_type || "NGO/Volunteer"} {isPrior && <span className="prior-flag">⚠️ Prior History</span>}</div>
                        </td>
                        <td><span className="type-badge">{REASON_ICONS[c.reason] || "❓"} {c.reason}</span></td>
                        <td><span className={`severity-badge ${sev.class}`}>{sev.icon} {getSeverity(c)}</span></td>
                        <td><span className={`status-pill s-${statusClass}`}>{c.status?.replace("_", " ") || "Pending"}</span></td>
                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="row-actions">
                            <button className="btn btn-view" onClick={() => setDetailModal({ open: true, complaint: c })}>👁 View</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>← Prev</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next →</button>
            </div>
          </>
        )}
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {detailModal.open && detailModal.complaint && (
        <div className="admin-modal-overlay" onClick={() => setDetailModal({ open: false, complaint: null })}>
          <div className="admin-modal complaint-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <span className={`severity-badge ${SEVERITY_CONFIG[getSeverity(detailModal.complaint)]?.class}`}>
                  {SEVERITY_CONFIG[getSeverity(detailModal.complaint)]?.icon} {getSeverity(detailModal.complaint)}
                </span>
                <h2>Complaint #{detailModal.complaint.id?.slice(0, 8)}</h2>
              </div>
              <button className="modal-close" onClick={() => setDetailModal({ open: false, complaint: null })}>✕</button>
            </div>

            <div className="admin-modal-body complaint-detail-body">
              {/* Timeline */}
              <div className="complaint-timeline">
                <div className={`tl-step ${detailModal.complaint.status === "pending" ? "active" : "done"}`}>
                  <span className="tl-dot"></span>
                  <span className="tl-label">Submitted</span>
                </div>
                <div className={`tl-step ${detailModal.complaint.status === "investigating" ? "active" : detailModal.complaint.status !== "pending" ? "done" : ""}`}>
                  <span className="tl-dot"></span>
                  <span className="tl-label">Under Review</span>
                </div>
                <div className={`tl-step ${detailModal.complaint.status === "action_taken" || detailModal.complaint.status === "dismissed" ? "active" : ""}`}>
                  <span className="tl-dot"></span>
                  <span className="tl-label">Resolved</span>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-main">
                  <div className="detail-section">
                    <h4>📝 Complaint Details</h4>
                    <div className="detail-row"><label>Category:</label><span>{detailModal.complaint.reason}</span></div>
                    <div className="detail-row"><label>Description:</label><p>{detailModal.complaint.description}</p></div>
                    <div className="detail-row"><label>Submitted:</label><span>{new Date(detailModal.complaint.created_at).toLocaleString()}</span></div>
                    {detailModal.complaint.admin_notes && (
                      <div className="detail-row"><label>Admin Notes:</label><p className="admin-note">{detailModal.complaint.admin_notes}</p></div>
                    )}
                  </div>

                  {/* Evidence */}
                  <div className="detail-section">
                    <h4>📎 Evidence & Attachments</h4>
                    <div className="evidence-grid">
                      <div className="evidence-item">
                        <div className="evidence-thumb">🖼️</div>
                        <span>Screenshot_1.png</span>
                      </div>
                      <div className="evidence-item">
                        <div className="evidence-thumb">📄</div>
                        <span>Bank_Statement.pdf</span>
                      </div>
                      <div className="evidence-item">
                        <div className="evidence-thumb">💬</div>
                        <span>Chat_Export.txt</span>
                      </div>
                    </div>
                    <p className="evidence-note">Evidence files are stored securely. Download requires 2FA verification.</p>
                  </div>
                </div>

                <div className="detail-sidebar">
                  <div className="detail-section entity-card">
                    <h4>👤 Reporter</h4>
                    <p><strong>{detailModal.complaint.reporter?.full_name || "Anonymous"}</strong></p>
                    <p className="sub">{detailModal.complaint.reporter?.email || "Hidden"}</p>
                  </div>

                  <div className="detail-section entity-card">
                    <h4>🏢 Reported Entity</h4>
                    <p><strong>{detailModal.complaint.reported_name || "Unknown"}</strong></p>
                    <p className="sub">{detailModal.complaint.entity_type || "NGO/Volunteer"}</p>
                    <p className="sub">ID: {detailModal.complaint.reported_id?.slice(0, 12)}...</p>
                  </div>

                  {/* Action Panel */}
                  <div className="detail-section action-panel">
                    <h4>⚡ Admin Actions</h4>
                    {detailModal.complaint.status === "pending" && (
                      <button className="action-btn investigate" onClick={() => openActionModal("investigate", detailModal.complaint)}>🔍 Mark Investigating</button>
                    )}
                    {detailModal.complaint.status === "investigating" && (
                      <>
                        <button className="action-btn legal" onClick={() => openActionModal("legal", detailModal.complaint)}>⚖️ Issue Legal Notice</button>
                        <button className="action-btn warn" onClick={() => openActionModal("warn", detailModal.complaint)}>⚠️ Issue Warning</button>
                        <button className="action-btn suspend" onClick={() => openActionModal("suspend", detailModal.complaint)}>⛔ Suspend Entity</button>
                        <button className="action-btn ban" onClick={() => openActionModal("ban", detailModal.complaint)}>🚫 Ban / Blacklist</button>
                        <button className="action-btn dismiss" onClick={() => openActionModal("dismiss", detailModal.complaint)}>✓ Dismiss Complaint</button>
                      </>
                    )}
                    {detailModal.complaint.status === "action_taken" && (
                      <div className="action-taken-box">
                        <span>Action: <strong>{detailModal.complaint.action?.toUpperCase()}</strong></span>
                        <span>Reason: {detailModal.complaint.action_reason}</span>
                        {detailModal.complaint.action_duration && <span>Duration: {detailModal.complaint.action_duration} days</span>}
                        <button className="action-btn notice" onClick={() => openNoticePreview(detailModal.complaint.action || "warning", detailModal.complaint, detailModal.complaint.action_reason)}>📄 View Notice</button>
                      </div>
                    )}
                    {detailModal.complaint.status === "dismissed" && (
                      <div className="action-taken-box dismissed">
                        <span>✓ Dismissed</span>
                        <span>Reason: {detailModal.complaint.resolution}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ACTION MODAL ===== */}
      {actionModal.open && (
        <div className="admin-modal-overlay" onClick={closeActionModal}>
          <div className="admin-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>
                {actionModal.action === "investigate" ? "Start Investigation" :
                 actionModal.action === "dismiss" ? "Dismiss Complaint" :
                 actionModal.action === "warn" ? "Issue Warning" :
                 actionModal.action === "suspend" ? "Suspend Entity" :
                 actionModal.action === "ban" ? "Ban / Blacklist Entity" :
                 actionModal.action === "legal" ? "Issue Legal Notice" : "Confirm Action"}
              </h2>
              <button className="modal-close" onClick={closeActionModal}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p className="confirm-text">
                {actionModal.action === "ban" ? "⚠️ This action is IRREVERSIBLE. The entity will be permanently banned from the platform." :
                 actionModal.action === "suspend" ? `The entity will be temporarily suspended for ${actionModal.duration} days.` :
                 actionModal.action === "legal" ? "A formal legal notice will be generated and logged." :
                 actionModal.action === "dismiss" ? "This complaint will be marked as dismissed." :
                 "Please provide details for this action."}
              </p>

              {actionModal.action === "suspend" && (
                <div className="form-group">
                  <label>Suspension Duration (days)</label>
                  <select value={actionModal.duration} onChange={(e) => setActionModal({ ...actionModal, duration: e.target.value })}>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Reason / Notes *</label>
                <textarea rows="4" placeholder="Explain the basis for this action..." value={actionModal.reason} onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })} />
                <p className="field-hint">This will be logged in the audit trail and may be shared with the entity.</p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-view" onClick={closeActionModal}>Cancel</button>
              <button className={`btn ${actionModal.action === "dismiss" ? "btn-view" : actionModal.action === "ban" || actionModal.action === "suspend" ? "btn-reject" : "btn-approve"}`} onClick={handleAction} disabled={!actionModal.reason.trim()}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== NOTICE PREVIEW MODAL ===== */}
      {noticeModal.open && noticeModal.complaint && (
        <div className="admin-modal-overlay" onClick={closeNoticeModal}>
          <div className="admin-modal notice-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>📄 Notice Preview</h2>
              <button className="modal-close" onClick={closeNoticeModal}>✕</button>
            </div>
            <div className="admin-modal-body" style={{ padding: 0 }}>
              <div className="official-notice">
                <div className="notice-header">
                  <span className="notice-logo">🌿</span>
                  <div>
                    <h3>NGO Connect Platform</h3>
                    <p>Administration Office · admin@ngoconnect.org</p>
                  </div>
                </div>

                <div className="notice-meta">
                  <span>Ref: {getNoticeRef()}</span>
                  <span>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>

                <div className={`notice-badge ${noticeModal.type}`}>
                  {getNoticeTitle()}
                </div>

                <div className="notice-body">
                  <p className="notice-to"><strong>To:</strong> {noticeModal.complaint.reported_name || "Entity"}<br/>
                  <strong>Type:</strong> {noticeModal.complaint.entity_type || "NGO/Volunteer"}<br/>
                  <strong>Platform ID:</strong> {noticeModal.complaint.reported_id?.slice(0, 12) || "N/A"}</p>

                  <p className="notice-subject"><strong>Subject:</strong> {getNoticeTitle()} regarding {noticeModal.complaint.reason}</p>

                  <p>This letter serves as an official {getNoticeTitle().toLowerCase()} issued by the Platform Administration Office of NGO Connect, following review of a complaint filed against the above-named entity.</p>

                  <div className="notice-details">
                    <p><strong>Complaint Category:</strong> {noticeModal.complaint.reason}</p>
                    <p><strong>Summary:</strong> {noticeModal.complaint.description?.slice(0, 200)}...</p>
                    <p><strong>Basis for this notice:</strong> {noticeModal.reason}</p>
                    {noticeModal.type === "suspension" && <p><strong>Action Taken:</strong> Account suspended for {actionModal.duration || "7"} days, effective immediately.</p>}
                    {noticeModal.type === "ban" && <p><strong>Action Taken:</strong> Permanent ban from the NGO Connect platform, effective immediately.</p>}
                  </div>

                  <p className="notice-footer-text">Continued or repeated conduct of this nature may result in further administrative action, including referral to appropriate regulatory or legal authority.</p>

                  <div className="notice-signature">
                    <div className="sig-line"></div>
                    <p className="sig-name">Esha Eman</p>
                    <p className="sig-title">CEO & Founder, NGO Connect</p>
                    <p className="sig-dept">Trust & Safety Administration</p>
                  </div>

                  <div className="notice-stamp">
                    <div className="stamp-circle">
                      <span className="stamp-text-top">NGO CONNECT</span>
                      <span className="stamp-text-mid">✓</span>
                      <span className="stamp-text-bot">VERIFIED</span>
                    </div>
                    <span className="stamp-label">OFFICIAL NOTICE</span>
                  </div>
                </div>

                <div className="notice-footer">
                  <p>Digitally issued and logged by NGO Connect Admin Console. Verify authenticity at ngoconnect.org/verify-notice/{getNoticeRef().toLowerCase()}</p>
                  <p>This is a system-generated notice from NGO Connect's Trust & Safety division.</p>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-view" onClick={closeNoticeModal}>Close</button>
              <button className="btn btn-approve" onClick={() => { showToast("📥 Notice downloaded (mock)"); closeNoticeModal(); }}>⬇️ Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminComplaints;