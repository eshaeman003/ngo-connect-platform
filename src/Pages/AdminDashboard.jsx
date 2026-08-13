import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ngos");
  const [stats, setStats] = useState({
    approvedNGOs: 0,
    totalVolunteers: 0,
    pendingApprovals: 0,
    totalApplications: 0,
    totalOpportunities: 0,
    pendingComplaints: 0,
  });

  const [ngos, setNgos] = useState([]);
  const [applications, setApplications] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      // Auth check + role verification (fast)
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!prof || prof.role !== "admin") { navigate("/"); return; }

      // 🚀 EVERYTHING PARALLEL — loads in under 2 seconds
      const [
        { count: approvedNGOs },
        { count: totalVolunteers },
        { count: pendingApprovals },
        { count: totalApplications },
        { count: totalOpportunities },
        { count: pendingComplaints },
        { data: ngoData },
        { data: appData },
        { data: volData },
        { data: oppData },
      ] = await Promise.all([
        supabase.from("ngos").select("*", { count: "exact", head: true }).eq("approval_status", "approved"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "volunteer"),
        supabase.from("ngos").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
        supabase.from("applications").select("*", { count: "exact", head: true }),
        supabase.from("opportunities").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("ngos").select("*").order("created_at", { ascending: false }),
        supabase
          .from("applications")
          .select(`*, opportunities:opportunity_id (title, ngo_name, location), profiles:volunteer_id (full_name, email, phone)`)
          .order("applied_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("role", "volunteer").order("created_at", { ascending: false }),
        supabase.from("opportunities").select("*, ngos(name)").order("created_at", { ascending: false }),
      ]);

      setStats({
        approvedNGOs: approvedNGOs || 0,
        totalVolunteers: totalVolunteers || 0,
        pendingApprovals: pendingApprovals || 0,
        totalApplications: totalApplications || 0,
        totalOpportunities: totalOpportunities || 0,
        pendingComplaints: pendingComplaints || 0,
      });

      setNgos(ngoData || []);
      setApplications(appData || []);
      setVolunteers(volData || []);
      setOpportunities(oppData || []);
      setLoading(false);
    };

    fetchAll();
  }, [navigate]);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this NGO?")) return;
    const { error } = await supabase.from("ngos").update({ approval_status: "approved" }).eq("id", id);
    if (error) showToast("Error approving NGO", "error");
    else {
      setNgos((prev) => prev.map((n) => n.id === id ? { ...n, approval_status: "approved" } : n));
      setStats((s) => ({ ...s, pendingApprovals: Math.max(0, s.pendingApprovals - 1), approvedNGOs: s.approvedNGOs + 1 }));
      showToast("✓ NGO approved successfully!");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this NGO?")) return;
    const { error } = await supabase.from("ngos").update({ approval_status: "rejected" }).eq("id", id);
    if (error) showToast("Error rejecting NGO", "error");
    else {
      setNgos((prev) => prev.map((n) => n.id === id ? { ...n, approval_status: "rejected" } : n));
      setStats((s) => ({ ...s, pendingApprovals: Math.max(0, s.pendingApprovals - 1) }));
      showToast("✕ NGO rejected.");
    }
  };

  const handleApproveApp = async (id) => {
    if (!window.confirm("Approve this application?")) return;
    const { error } = await supabase.from("applications").update({ status: "approved" }).eq("id", id);
    if (error) showToast("Error", "error");
    else {
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: "approved" } : a));
      showToast("✓ Application approved!");
    }
  };

  const handleRejectApp = async (id) => {
    if (!window.confirm("Reject this application?")) return;
    const { error } = await supabase.from("applications").update({ status: "rejected" }).eq("id", id);
    if (error) showToast("Error", "error");
    else {
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: "rejected" } : a));
      showToast("✕ Application rejected.");
    }
  };

  const handleSuspend = async (userId, currentStatus, name) => {
    const action = currentStatus ? "unsuspend" : "suspend";
    if (!window.confirm(`${action === "suspend" ? "SUSPEND" : "Unsuspend"} ${name || "this user"}?`)) return;
    const { error } = await supabase.from("profiles").update({ suspended: !currentStatus }).eq("id", userId);
    if (error) showToast(`Error: ${error.message}`, "error");
    else {
      setVolunteers((prev) => prev.map((v) => v.id === userId ? { ...v, suspended: !currentStatus } : v));
      showToast(`${name || "User"} ${action === "suspend" ? "suspended" : "unsuspended"}`, "success");
    }
  };

  const handleDeleteOpportunity = async (id, title) => {
    if (!window.confirm(`Delete opportunity "${title}"?`)) return;
    const { error } = await supabase.from("opportunities").delete().eq("id", id);
    if (error) showToast("Error deleting opportunity", "error");
    else {
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
      setStats((s) => ({ ...s, totalOpportunities: s.totalOpportunities - 1 }));
      showToast("Opportunity deleted.");
    }
  };

  const openModal = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setModalType(null);
  };

  const getCategoryBadge = (cat) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("health")) return { class: "b-health", label: cat || "Healthcare" };
    if (c.includes("edu") || c.includes("school")) return { class: "b-edu", label: cat || "Education" };
    if (c.includes("micro") || c.includes("finance")) return { class: "b-micro", label: cat || "Microfinance" };
    return { class: "b-general", label: cat || "General" };
  };

  const pendingNGOs = ngos.filter((n) => (n.approval_status || "pending") === "pending");
  const approvedNGOsList = ngos.filter((n) => n.approval_status === "approved");
  const rejectedNGOsList = ngos.filter((n) => n.approval_status === "rejected");

  const filterBySearch = (list) => list.filter((ngo) => {
    if (!search) return true;
    return ngo.name?.toLowerCase().includes(search.toLowerCase()) || ngo.location?.toLowerCase().includes(search.toLowerCase());
  });

  const searchedPending = filterBySearch(pendingNGOs);
  const searchedApproved = filterBySearch(approvedNGOsList);
  const searchedRejected = filterBySearch(rejectedNGOsList);

  const currentNGOList = activeTab === "ngos" ? searchedPending : activeTab === "approved" ? searchedApproved : searchedRejected;
  const currentNGOCount = activeTab === "ngos" ? searchedPending.length : activeTab === "approved" ? searchedApproved.length : searchedRejected.length;

  const filteredApps = applications.filter((app) => {
    if (!search) return true;
    const opp = app.opportunities || {};
    const prof = app.profiles || {};
    return opp.title?.toLowerCase().includes(search.toLowerCase()) || prof.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  const filteredVols = volunteers.filter((v) => {
    if (!search) return true;
    return v.full_name?.toLowerCase().includes(search.toLowerCase()) || v.email?.toLowerCase().includes(search.toLowerCase());
  });

  const filteredOpps = opportunities.filter((o) => {
    if (!search) return true;
    return o.title?.toLowerCase().includes(search.toLowerCase()) || (o.ngos?.name || "").toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div className="admin-loading">Loading admin dashboard...</div>;

  return (
    <div className="admin-page">
      {toast.show && <div className={`admin-toast ${toast.type}`}><span>{toast.msg}</span></div>}

      <div className="admin-header">
        <div className="admin-eyebrow">Admin · Platform Management</div>
        <h1>Admin Dashboard</h1>
        <p>Manage NGOs, volunteers, opportunities, and platform activity</p>
      </div>

      <div className="admin-stats">
        <div className="admin-stat moss">
          <div className="stat-bar"></div>
          <div className="stat-top"><span className="stat-num">{stats.approvedNGOs}</span><span className="stat-icon">🏛</span></div>
          <div className="stat-label">Approved NGOs</div>
          <div className="stat-delta up">live count</div>
        </div>
        <div className="admin-stat ink">
          <div className="stat-bar"></div>
          <div className="stat-top"><span className="stat-num">{stats.totalVolunteers}</span><span className="stat-icon">👥</span></div>
          <div className="stat-label">Volunteers</div>
          <div className="stat-delta">platform total</div>
        </div>
        <div className="admin-stat gold">
          <div className="stat-bar"></div>
          <div className="stat-top"><span className="stat-num">{stats.pendingApprovals}</span><span className="stat-icon">⏳</span></div>
          <div className="stat-label">Pending NGOs</div>
          <div className="stat-delta flag">needs review</div>
        </div>
        <div className="admin-stat rust">
          <div className="stat-bar"></div>
          <div className="stat-top"><span className="stat-num">{stats.totalApplications}</span><span className="stat-icon">📋</span></div>
          <div className="stat-label">Applications</div>
          <div className="stat-delta up">total tracked</div>
        </div>
        <div className="admin-stat blue">
          <div className="stat-bar"></div>
          <div className="stat-top"><span className="stat-num">{stats.totalOpportunities}</span><span className="stat-icon">📢</span></div>
          <div className="stat-label">Opportunities</div>
          <div className="stat-delta up">NGO posts</div>
        </div>
        <div className="admin-stat danger" onClick={() => navigate("/admin/complaints")} style={{ cursor: "pointer" }}>
          <div className="stat-bar"></div>
          <div className="stat-top"><span className="stat-num">{stats.pendingComplaints}</span><span className="stat-icon">🚨</span></div>
          <div className="stat-label">Complaints</div>
          <div className="stat-delta flag">{stats.pendingComplaints > 0 ? "click to view" : "all clear"}</div>
        </div>
      </div>

      <div className="admin-tabs">
        {[
          { key: "ngos", label: "NGO Approvals", count: pendingNGOs.length },
          { key: "approved", label: "Approved NGOs", count: approvedNGOsList.length },
          { key: "rejected", label: "Rejected NGOs", count: rejectedNGOsList.length },
          { key: "opportunities", label: "Opportunities", count: stats.totalOpportunities },
          { key: "applications", label: "Applications", count: stats.totalApplications },
          { key: "volunteers", label: "Volunteers", count: stats.totalVolunteers },
        ].map((tab) => (
          <button key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => setActiveTab(tab.key)}>
            {tab.label} <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder={
              activeTab === "ngos" ? "Search pending NGOs..." :
              activeTab === "approved" ? "Search approved NGOs..." :
              activeTab === "rejected" ? "Search rejected NGOs..." :
              activeTab === "opportunities" ? "Search opportunities..." :
              activeTab === "applications" ? "Search applications..." : "Search volunteers..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {(activeTab === "ngos" || activeTab === "approved" || activeTab === "rejected") && (
        <div className="admin-panel">
          <div className="panel-head">
            <h2>
              {activeTab === "ngos" ? "NGO Approval Requests" : 
               activeTab === "approved" ? "Approved NGOs" : "Rejected NGOs"}
            </h2>
            <span className="panel-meta">{currentNGOCount} result{currentNGOCount !== 1 ? "s" : ""}</span>
          </div>
          {currentNGOList.length === 0 ? (
            <div className="admin-empty">
              {activeTab === "ngos" ? "No pending NGO approvals." :
               activeTab === "approved" ? "No approved NGOs yet." : "No rejected NGOs."}
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>NGO</th><th>Category</th><th>Location</th><th>Contact</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {currentNGOList.map((ngo) => {
                    const badge = getCategoryBadge(ngo.category);
                    const status = (ngo.approval_status || "pending").toLowerCase();
                    return (
                      <tr key={ngo.id}>
                        <td>
                          <div className="ngo-name">{ngo.name || "Unnamed"}</div>
                          <div className="ngo-sub" onClick={() => openModal(ngo, "ngo")} style={{ cursor: "pointer", color: "#28503B" }}>View full profile →</div>
                        </td>
                        <td><span className={`badge ${badge.class}`}>{badge.label}</span></td>
                        <td>{ngo.location || "N/A"}</td>
                        <td>{ngo.email || ngo.phone ? <>{ngo.email && <div>{ngo.email}</div>}{ngo.phone && <div>{ngo.phone}</div>}</> : <span className="contact-missing">Not provided</span>}</td>
                        <td><span className={`status-pill s-${status}`}>{status}</span></td>
                        <td>
                          <div className="row-actions">
                            <button className="btn btn-view" onClick={() => openModal(ngo, "ngo")}>View</button>
                            {status === "pending" && (
                              <>
                                <button className="btn btn-approve" onClick={() => handleApprove(ngo.id)}>✓ Approve</button>
                                <button className="btn btn-reject" onClick={() => handleReject(ngo.id)}>✕ Reject</button>
                              </>
                            )}
                            {status === "rejected" && (
                              <button className="btn btn-approve" onClick={() => handleApprove(ngo.id)}>↩ Re-approve</button>
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
      )}

      {activeTab === "opportunities" && (
        <div className="admin-panel">
          <div className="panel-head">
            <h2>NGO Opportunities / Posts</h2>
            <span className="panel-meta">{filteredOpps.length} result{filteredOpps.length !== 1 ? "s" : ""}</span>
          </div>
          {filteredOpps.length === 0 ? <div className="admin-empty">No opportunities found.</div> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Opportunity</th><th>NGO</th><th>Category</th><th>Location</th><th>Type</th><th>Posted</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredOpps.map((opp) => (
                    <tr key={opp.id}>
                      <td><div className="ngo-name">{opp.title || "Untitled"}</div></td>
                      <td>{opp.ngo_name || opp.ngos?.name || "NGO"}</td>
                      <td><span className={`badge ${getCategoryBadge(opp.category).class}`}>{opp.category || "General"}</span></td>
                      <td>{opp.location || "Remote"}</td>
                      <td>{opp.type || "N/A"}</td>
                      <td>{new Date(opp.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-view" onClick={() => openModal(opp, "opportunity")}>View</button>
                          <button className="btn btn-reject" onClick={() => handleDeleteOpportunity(opp.id, opp.title)}>🗑 Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "applications" && (
        <div className="admin-panel">
          <div className="panel-head">
            <h2>All Applications</h2>
            <span className="panel-meta">{filteredApps.length} result{filteredApps.length !== 1 ? "s" : ""}</span>
          </div>
          {filteredApps.length === 0 ? <div className="admin-empty">No applications found.</div> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Volunteer</th><th>Opportunity</th><th>NGO</th><th>Status</th><th>Applied</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => {
                    const opp = app.opportunities || {};
                    const prof = app.profiles || {};
                    const status = (app.status || "pending").toLowerCase();
                    return (
                      <tr key={app.id}>
                        <td>
                          <div className="ngo-name">{prof.full_name || "Unknown"}</div>
                          <div className="ngo-sub">{prof.email || "No email"}</div>
                        </td>
                        <td>{opp.title || "Opportunity"}</td>
                        <td>{opp.ngo_name || "NGO"}</td>
                        <td><span className={`status-pill s-${status}`}>{app.status || "Pending"}</span></td>
                        <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                        <td>
                          <div className="row-actions">
                            <button className="btn btn-view" onClick={() => openModal(app, "application")}>View</button>
                            {status === "pending" && (
                              <>
                                <button className="btn btn-approve" onClick={() => handleApproveApp(app.id)}>✓ Approve</button>
                                <button className="btn btn-reject" onClick={() => handleRejectApp(app.id)}>✕ Reject</button>
                              </>
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
      )}

      {activeTab === "volunteers" && (
        <div className="admin-panel">
          <div className="panel-head">
            <h2>Volunteers</h2>
            <span className="panel-meta">{filteredVols.length} result{filteredVols.length !== 1 ? "s" : ""}</span>
          </div>
          {filteredVols.length === 0 ? <div className="admin-empty">No volunteers found.</div> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Volunteer</th><th>Email</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredVols.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <div className="vol-row-cell">
                          <div className="vol-avatar">{v.full_name?.charAt(0) || "V"}</div>
                          <div>
                            <div className="ngo-name">{v.full_name || "Unknown"}</div>
                            <div className="ngo-sub">{v.email || "No email"}</div>
                          </div>
                        </div>
                      </td>
                      <td>{v.email || "N/A"}</td>
                      <td>{new Date(v.created_at).toLocaleDateString()}</td>
                      <td>{v.suspended ? <span className="status-pill s-rejected">Suspended</span> : <span className="status-pill s-approved">Active</span>}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-view" onClick={() => openModal(v, "volunteer")}>View</button>
                          <button className={`btn ${v.suspended ? "btn-unsuspend" : "btn-suspend"}`} onClick={() => handleSuspend(v.id, v.suspended, v.full_name)}>
                            {v.suspended ? "↩ Unsuspend" : "⛔ Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && selectedItem && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>
                {modalType === "ngo" ? (selectedItem.name || "NGO Profile") :
                 modalType === "volunteer" ? (selectedItem.full_name || "Volunteer Profile") :
                 modalType === "application" ? "Application Details" :
                 modalType === "opportunity" ? (selectedItem.title || "Opportunity") : "Details"}
              </h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="admin-modal-body">
              {modalType === "ngo" && (
                <>
                  <div className="modal-row"><label>Category:</label><span className={`badge ${getCategoryBadge(selectedItem.category).class}`}>{getCategoryBadge(selectedItem.category).label}</span></div>
                  <div className="modal-row"><label>Location:</label><span>{selectedItem.location || "N/A"}</span></div>
                  <div className="modal-row"><label>Email:</label><span>{selectedItem.email || <span className="contact-missing">Not provided</span>}</span></div>
                  <div className="modal-row"><label>Phone:</label><span>{selectedItem.phone || <span className="contact-missing">Not provided</span>}</span></div>
                  <div className="modal-row"><label>Status:</label><span className={`status-pill s-${(selectedItem.approval_status || "pending").toLowerCase()}`}>{selectedItem.approval_status || "Pending"}</span></div>
                  <div className="modal-desc"><label>About / Mission:</label><p>{selectedItem.description || "No description provided."}</p></div>
                </>
              )}
              {modalType === "volunteer" && (
                <>
                  <div className="modal-row"><label>Name:</label><span>{selectedItem.full_name || "Unknown"}</span></div>
                  <div className="modal-row"><label>Email:</label><span>{selectedItem.email || "N/A"}</span></div>
                  <div className="modal-row"><label>Phone:</label><span>{selectedItem.phone || "N/A"}</span></div>
                  <div className="modal-row"><label>Joined:</label><span>{new Date(selectedItem.created_at).toLocaleDateString()}</span></div>
                  <div className="modal-row"><label>Status:</label><span>{selectedItem.suspended ? <span className="status-pill s-rejected">Suspended</span> : <span className="status-pill s-approved">Active</span>}</span></div>
                </>
              )}
              {modalType === "application" && (
                <>
                  <div className="modal-row"><label>Volunteer:</label><span>{selectedItem.profiles?.full_name || "Unknown"} ({selectedItem.profiles?.email || "No email"})</span></div>
                  <div className="modal-row"><label>Opportunity:</label><span>{selectedItem.opportunities?.title || "N/A"}</span></div>
                  <div className="modal-row"><label>NGO:</label><span>{selectedItem.opportunities?.ngo_name || "N/A"}</span></div>
                  <div className="modal-row"><label>Location:</label><span>{selectedItem.opportunities?.location || "Remote"}</span></div>
                  <div className="modal-row"><label>Status:</label><span className={`status-pill s-${(selectedItem.status || "pending").toLowerCase()}`}>{selectedItem.status || "Pending"}</span></div>
                  <div className="modal-row"><label>Applied:</label><span>{new Date(selectedItem.applied_at).toLocaleDateString()}</span></div>
                  {selectedItem.experience && <div className="modal-desc"><label>Experience:</label><p>{selectedItem.experience}</p></div>}
                  {selectedItem.motivation && <div className="modal-desc"><label>Motivation:</label><p>{selectedItem.motivation}</p></div>}
                </>
              )}
              {modalType === "opportunity" && (
                <>
                  <div className="modal-row"><label>Title:</label><span>{selectedItem.title || "Untitled"}</span></div>
                  <div className="modal-row"><label>NGO:</label><span>{selectedItem.ngo_name || selectedItem.ngos?.name || "NGO"}</span></div>
                  <div className="modal-row"><label>Category:</label><span className={`badge ${getCategoryBadge(selectedItem.category).class}`}>{selectedItem.category || "General"}</span></div>
                  <div className="modal-row"><label>Location:</label><span>{selectedItem.location || "Remote"}</span></div>
                  <div className="modal-row"><label>Type:</label><span>{selectedItem.type || "N/A"}</span></div>
                  <div className="modal-desc"><label>Description:</label><p>{selectedItem.description || "No description."}</p></div>
                </>
              )}
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-view" onClick={closeModal}>Close</button>
              {modalType === "ngo" && (selectedItem.approval_status || "pending").toLowerCase() === "pending" && (
                <>
                  <button className="btn btn-reject" onClick={() => { handleReject(selectedItem.id); closeModal(); }}>✕ Reject</button>
                  <button className="btn btn-approve" onClick={() => { handleApprove(selectedItem.id); closeModal(); }}>✓ Approve</button>
                </>
              )}
              {modalType === "application" && (selectedItem.status || "pending").toLowerCase() === "pending" && (
                <>
                  <button className="btn btn-reject" onClick={() => { handleRejectApp(selectedItem.id); closeModal(); }}>✕ Reject</button>
                  <button className="btn btn-approve" onClick={() => { handleApproveApp(selectedItem.id); closeModal(); }}>✓ Approve</button>
                </>
              )}
              {modalType === "opportunity" && (
                <button className="btn btn-reject" onClick={() => { handleDeleteOpportunity(selectedItem.id, selectedItem.title); closeModal(); }}>🗑 Delete Post</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;