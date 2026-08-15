import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ngos");
  const [stats, setStats] = useState({
    approvedNGOs: 0, totalVolunteers: 0, pendingApprovals: 0,
    totalApplications: 0, totalOpportunities: 0, pendingComplaints: 0,
  });

  const [ngos, setNgos] = useState([]);
  const [applications, setApplications] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState({ open: false, action: "", item: null, reason: "" });

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filters
  const [filters, setFilters] = useState({ category: "All", location: "All", dateFrom: "", dateTo: "" });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Real-time flash
  const [flashStat, setFlashStat] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!prof || prof.role !== "admin") { navigate("/"); return; }

      const [
        { count: approvedNGOs }, { count: totalVolunteers }, { count: pendingApprovals },
        { count: totalApplications }, { count: totalOpportunities }, { count: pendingComplaints },
        { data: ngoData }, { data: appData }, { data: volData }, { data: oppData },
      ] = await Promise.all([
        supabase.from("ngos").select("*", { count: "exact", head: true }).eq("approval_status", "approved"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "volunteer"),
        supabase.from("ngos").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
        supabase.from("applications").select("*", { count: "exact", head: true }),
        supabase.from("opportunities").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("ngos").select("*").order("created_at", { ascending: false }),
        supabase.from("applications").select(`*, opportunities:opportunity_id (title, ngo_name, location), profiles:volunteer_id (full_name, email, phone)`).order("applied_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("role", "volunteer").order("created_at", { ascending: false }),
        supabase.from("opportunities").select("*, ngos(name)").order("created_at", { ascending: false }),
      ]);

      setStats({
        approvedNGOs: approvedNGOs || 0, totalVolunteers: totalVolunteers || 0,
        pendingApprovals: pendingApprovals || 0, totalApplications: totalApplications || 0,
        totalOpportunities: totalOpportunities || 0, pendingComplaints: pendingComplaints || 0,
      });
      setNgos(ngoData || []);
      setApplications(appData || []);
      setVolunteers(volData || []);
      setOpportunities(oppData || []);
      setLoading(false);
    };

    fetchAll();
  }, [navigate]);

  // Real-time subscription for new NGOs
  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ngos" }, (payload) => {
        setNgos((prev) => [payload.new, ...prev]);
        setStats((s) => ({ ...s, pendingApprovals: s.pendingApprovals + 1 }));
        showToast("🆕 New NGO registration received!", "info");
        setFlashStat("pendingApprovals");
        setTimeout(() => setFlashStat(null), 2000);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "complaints" }, (payload) => {
        setStats((s) => ({ ...s, pendingComplaints: s.pendingComplaints + 1 }));
        showToast("🚨 New complaint filed!", "error");
        setFlashStat("pendingComplaints");
        setTimeout(() => setFlashStat(null), 2000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3500);
  }, []);

  const logActivity = useCallback((action, target, detail = "") => {
    const entry = {
      id: Date.now(),
      action,
      target,
      detail,
      timestamp: new Date().toISOString(),
    };
    setActivityLog((prev) => [entry, ...prev].slice(0, 100));
  }, []);

  // Confirmation flow
  const openConfirm = (action, item) => {
    setConfirmModal({ open: true, action, item, reason: "" });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, action: "", item: null, reason: "" });
  };

  const executeConfirm = async () => {
    const { action, item, reason } = confirmModal;
    if (!item) return;

    if (action === "approve") await handleApprove(item.id, true);
    else if (action === "reject") await handleReject(item.id, reason, true);
    else if (action === "approveApp") await handleApproveApp(item.id, true);
    else if (action === "rejectApp") await handleRejectApp(item.id, true);
    else if (action === "deleteOpp") await handleDeleteOpportunity(item.id, item.title, true);
    else if (action === "suspend") await handleSuspend(item.id, item.suspended, item.full_name, true);

    closeConfirm();
  };

  const handleApprove = async (id, skipConfirm = false) => {
    if (!skipConfirm) { openConfirm("approve", ngos.find((n) => n.id === id)); return; }
    const { error } = await supabase.from("ngos").update({ approval_status: "approved" }).eq("id", id);
    if (error) showToast("Error approving NGO", "error");
    else {
      setNgos((prev) => prev.map((n) => n.id === id ? { ...n, approval_status: "approved" } : n));
      setStats((s) => ({ ...s, pendingApprovals: Math.max(0, s.pendingApprovals - 1), approvedNGOs: s.approvedNGOs + 1 }));
      showToast("✓ NGO approved successfully!");
      logActivity("Approved NGO", ngos.find((n) => n.id === id)?.name || "NGO");
    }
  };

  const handleReject = async (id, reason = "", skipConfirm = false) => {
    if (!skipConfirm) {
      const item = ngos.find((n) => n.id === id);
      if (!reason && !confirmModal.open) {
        openConfirm("reject", item);
        return;
      }
    }
    const { error } = await supabase.from("ngos").update({ approval_status: "rejected", rejection_reason: reason }).eq("id", id);
    if (error) showToast("Error rejecting NGO", "error");
    else {
      setNgos((prev) => prev.map((n) => n.id === id ? { ...n, approval_status: "rejected" } : n));
      setStats((s) => ({ ...s, pendingApprovals: Math.max(0, s.pendingApprovals - 1) }));
      showToast("✕ NGO rejected.");
      logActivity("Rejected NGO", ngos.find((n) => n.id === id)?.name || "NGO", reason);
    }
  };

  const handleApproveApp = async (id, skipConfirm = false) => {
    if (!skipConfirm) { openConfirm("approveApp", applications.find((a) => a.id === id)); return; }
    const { error } = await supabase.from("applications").update({ status: "approved" }).eq("id", id);
    if (error) showToast("Error", "error");
    else {
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: "approved" } : a));
      showToast("✓ Application approved!");
      logActivity("Approved Application", `#${id.slice(0, 8)}`);
    }
  };

  const handleRejectApp = async (id, skipConfirm = false) => {
    if (!skipConfirm) { openConfirm("rejectApp", applications.find((a) => a.id === id)); return; }
    const { error } = await supabase.from("applications").update({ status: "rejected" }).eq("id", id);
    if (error) showToast("Error", "error");
    else {
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: "rejected" } : a));
      showToast("✕ Application rejected.");
      logActivity("Rejected Application", `#${id.slice(0, 8)}`);
    }
  };

  const handleSuspend = async (userId, currentStatus, name, skipConfirm = false) => {
    const action = currentStatus ? "unsuspend" : "suspend";
    if (!skipConfirm) { openConfirm("suspend", { id: userId, suspended: currentStatus, full_name: name }); return; }
    const { error } = await supabase.from("profiles").update({ suspended: !currentStatus }).eq("id", userId);
    if (error) showToast(`Error: ${error.message}`, "error");
    else {
      setVolunteers((prev) => prev.map((v) => v.id === userId ? { ...v, suspended: !currentStatus } : v));
      showToast(`${name || "User"} ${action === "suspend" ? "suspended" : "unsuspended"}`);
      logActivity(`${action === "suspend" ? "Suspended" : "Unsuspended"} User`, name || "User");
    }
  };

  const handleDeleteOpportunity = async (id, title, skipConfirm = false) => {
    if (!skipConfirm) { openConfirm("deleteOpp", { id, title }); return; }
    const { error } = await supabase.from("opportunities").delete().eq("id", id);
    if (error) showToast("Error deleting opportunity", "error");
    else {
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
      setStats((s) => ({ ...s, totalOpportunities: s.totalOpportunities - 1 }));
      showToast("Opportunity deleted.");
      logActivity("Deleted Opportunity", title || "Untitled");
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

  // Bulk actions
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (list) => {
    if (selectedIds.size === list.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(list.map((i) => i.id)));
  };

  const handleBulkApprove = async () => {
    if (!window.confirm(`Approve ${selectedIds.size} selected NGOs?`)) return;
    setBulkActionLoading(true);
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => supabase.from("ngos").update({ approval_status: "approved" }).eq("id", id)));
    setNgos((prev) => prev.map((n) => selectedIds.has(n.id) ? { ...n, approval_status: "approved" } : n));
    setStats((s) => ({ ...s, pendingApprovals: Math.max(0, s.pendingApprovals - selectedIds.size) }));
    setSelectedIds(new Set());
    setBulkActionLoading(false);
    showToast(`✓ ${ids.length} NGOs approved!`);
    logActivity("Bulk Approved NGOs", `${ids.length} NGOs`);
  };

  const handleBulkReject = async () => {
    if (!window.confirm(`Reject ${selectedIds.size} selected NGOs?`)) return;
    setBulkActionLoading(true);
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => supabase.from("ngos").update({ approval_status: "rejected" }).eq("id", id)));
    setNgos((prev) => prev.map((n) => selectedIds.has(n.id) ? { ...n, approval_status: "rejected" } : n));
    setStats((s) => ({ ...s, pendingApprovals: Math.max(0, s.pendingApprovals - selectedIds.size) }));
    setSelectedIds(new Set());
    setBulkActionLoading(false);
    showToast(`✕ ${ids.length} NGOs rejected.`);
    logActivity("Bulk Rejected NGOs", `${ids.length} NGOs`);
  };

  // Sorting
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortList = (list, keyFn) => {
    if (!sortConfig.key) return list;
    const dir = sortConfig.direction === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = keyFn(a, sortConfig.key);
      const bv = keyFn(b, sortConfig.key);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  };

  // Export CSV
  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`📥 ${filename}.csv downloaded`);
  };

  // Filtering
  const pendingNGOs = ngos.filter((n) => (n.approval_status || "pending") === "pending");
  const approvedNGOsList = ngos.filter((n) => n.approval_status === "approved");
  const rejectedNGOsList = ngos.filter((n) => n.approval_status === "rejected");

  const applyNGOFilters = (list) => {
    return list.filter((ngo) => {
      if (!search && filters.category === "All" && filters.location === "All" && !filters.dateFrom && !filters.dateTo) return true;
      const matchesSearch = !search || ngo.name?.toLowerCase().includes(search.toLowerCase()) || ngo.location?.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filters.category === "All" || (ngo.category || "").toLowerCase().includes(filters.category.toLowerCase());
      const matchesLoc = filters.location === "All" || (ngo.location || "").toLowerCase().includes(filters.location.toLowerCase());
      const matchesDate = (!filters.dateFrom || new Date(ngo.created_at) >= new Date(filters.dateFrom)) &&
                          (!filters.dateTo || new Date(ngo.created_at) <= new Date(filters.dateTo));
      return matchesSearch && matchesCat && matchesLoc && matchesDate;
    });
  };

  const searchedPending = applyNGOFilters(pendingNGOs);
  const searchedApproved = applyNGOFilters(approvedNGOsList);
  const searchedRejected = applyNGOFilters(rejectedNGOsList);

  const currentNGOList = activeTab === "ngos" ? searchedPending : activeTab === "approved" ? searchedApproved : searchedRejected;
  const sortedNGOList = sortList(currentNGOList, (item, key) => {
    if (key === "name") return item.name || "";
    if (key === "category") return item.category || "";
    if (key === "location") return item.location || "";
    if (key === "date") return item.created_at || "";
    return "";
  });

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

  // Pagination
  const paginate = (list) => {
    const start = (currentPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  };

  const totalPages = (list) => Math.ceil(list.length / itemsPerPage) || 1;

  const getCategoryBadge = (cat) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("health")) return { class: "b-health", label: cat || "Healthcare" };
    if (c.includes("edu") || c.includes("school")) return { class: "b-edu", label: cat || "Education" };
    if (c.includes("micro") || c.includes("finance")) return { class: "b-micro", label: cat || "Microfinance" };
    return { class: "b-general", label: cat || "General" };
  };

  if (loading) return <div className="admin-loading">Loading admin dashboard...</div>;

  const statCards = [
    { key: "approvedNGOs", label: "Approved NGOs", icon: "🏛", color: "moss", tab: "approved" },
    { key: "totalVolunteers", label: "Volunteers", icon: "👥", color: "ink", tab: "volunteers" },
    { key: "pendingApprovals", label: "Pending NGOs", icon: "⏳", color: "gold", tab: "ngos" },
    { key: "totalApplications", label: "Applications", icon: "📋", color: "rust", tab: "applications" },
    { key: "totalOpportunities", label: "Opportunities", icon: "📢", color: "blue", tab: "opportunities" },
    { key: "pendingComplaints", label: "Complaints", icon: "🚨", color: "danger", tab: "complaints", nav: "/admin/complaints" },
  ];

  const tabList = [
    { key: "ngos", label: "NGO Approvals", count: pendingNGOs.length },
    { key: "approved", label: "Approved NGOs", count: approvedNGOsList.length },
    { key: "rejected", label: "Rejected NGOs", count: rejectedNGOsList.length },
    { key: "opportunities", label: "Opportunities", count: stats.totalOpportunities },
    { key: "applications", label: "Applications", count: stats.totalApplications },
    { key: "volunteers", label: "Volunteers", count: stats.totalVolunteers },
    { key: "activity", label: "Activity Log", count: activityLog.length },
  ];

  const currentList = activeTab === "ngos" || activeTab === "approved" || activeTab === "rejected" ? sortedNGOList :
                      activeTab === "opportunities" ? filteredOpps :
                      activeTab === "applications" ? filteredApps :
                      activeTab === "volunteers" ? filteredVols : [];
  const currentPaged = paginate(currentList);

  return (
    <div className="admin-page">
      {toast.show && <div className={`admin-toast ${toast.type}`}><span>{toast.msg}</span></div>}

      <div className="admin-header">
        <div className="admin-eyebrow">Admin · Platform Management</div>
        <h1>Admin Dashboard</h1>
        <p>Manage NGOs, volunteers, opportunities, and platform activity</p>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        {statCards.map((s) => (
          <div
            key={s.key}
            className={`admin-stat ${s.color} ${flashStat === s.key ? "flash" : ""}`}
            onClick={() => s.nav ? navigate(s.nav) : setActiveTab(s.tab)}
            style={{ cursor: "pointer" }}
            title={`View ${s.label}`}
          >
            <div className="stat-bar"></div>
            <div className="stat-top"><span className="stat-num">{stats[s.key]}</span><span className="stat-icon">{s.icon}</span></div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-delta">{s.key === "pendingApprovals" && stats[s.key] > 0 ? "needs review" : s.key === "pendingComplaints" && stats[s.key] > 0 ? "click to view" : "live count"}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {tabList.map((tab) => (
          <button key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); setSelectedIds(new Set()); }}>
            {tab.label} <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <span>🔍</span>
          <input type="text" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>

        {/* Filters */}
        {(activeTab === "ngos" || activeTab === "approved" || activeTab === "rejected") && (
          <div className="admin-filters">
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
              <option value="All">All Categories</option>
              <option value="health">Healthcare</option>
              <option value="edu">Education</option>
              <option value="micro">Microfinance</option>
              <option value="env">Environment</option>
            </select>
            <select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
              <option value="All">All Locations</option>
              <option value="karachi">Karachi</option>
              <option value="lahore">Lahore</option>
              <option value="islamabad">Islamabad</option>
            </select>
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} title="From date" />
            <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} title="To date" />
          </div>
        )}

        <div className="admin-actions">
          <button className="btn-export" onClick={() => exportCSV(currentList, activeTab)}>📥 Export CSV</button>
        </div>
      </div>

      {/* Bulk bar */}
      {selectedIds.size > 0 && (activeTab === "ngos" || activeTab === "approved" || activeTab === "rejected") && (
        <div className="bulk-bar">
          <span>{selectedIds.size} selected</span>
          <div className="bulk-actions">
            <button onClick={handleBulkApprove} disabled={bulkActionLoading} className="btn-bulk-approve">✓ Approve All</button>
            <button onClick={handleBulkReject} disabled={bulkActionLoading} className="btn-bulk-reject">✕ Reject All</button>
            <button onClick={() => setSelectedIds(new Set())} className="btn-bulk-clear">Clear</button>
          </div>
        </div>
      )}

      {/* NGO Tables */}
      {(activeTab === "ngos" || activeTab === "approved" || activeTab === "rejected") && (
        <div className="admin-panel">
          <div className="panel-head">
            <h2>{activeTab === "ngos" ? "NGO Approval Requests" : activeTab === "approved" ? "Approved NGOs" : "Rejected NGOs"}</h2>
            <span className="panel-meta">{sortedNGOList.length} result{sortedNGOList.length !== 1 ? "s" : ""}</span>
          </div>
          {sortedNGOList.length === 0 ? (
            <div className="admin-empty">No NGOs found.</div>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="th-check"><input type="checkbox" checked={selectedIds.size === currentNGOList.length && currentNGOList.length > 0} onChange={() => toggleSelectAll(currentNGOList)} /></th>
                      <th className="sortable" onClick={() => handleSort("name")}>NGO {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}</th>
                      <th className="sortable" onClick={() => handleSort("category")}>Category {sortConfig.key === "category" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}</th>
                      <th className="sortable" onClick={() => handleSort("location")}>Location {sortConfig.key === "location" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPaged.map((ngo) => {
                      const badge = getCategoryBadge(ngo.category);
                      const status = (ngo.approval_status || "pending").toLowerCase();
                      return (
                        <tr key={ngo.id} className={selectedIds.has(ngo.id) ? "selected-row" : ""}>
                          <td><input type="checkbox" checked={selectedIds.has(ngo.id)} onChange={() => toggleSelect(ngo.id)} /></td>
                          <td>
                            <div className="ngo-name">{ngo.name || "Unnamed"}</div>
                            <div className="ngo-sub" onClick={() => openModal(ngo, "ngo")} style={{ cursor: "pointer", color: "#28503B" }}>View full profile →</div>
                          </td>
                          <td><span className={`badge ${badge.class}`}>{badge.label}</span></td>
                          <td>{ngo.location || "N/A"}</td>
                          <td>{ngo.email || ngo.phone ? <>{ngo.email && <div>{ngo.email}</div>}{ngo.phone && <div>{ngo.phone}</div>}</> : <span className="contact-missing">⚠️ Not provided</span>}</td>
                          <td><span className={`status-pill s-${status}`}>{status}</span></td>
                          <td>
                            <div className="row-actions">
                              <button className="btn btn-view" onClick={() => openModal(ngo, "ngo")}>👁 View</button>
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
              {/* Pagination */}
              <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>← Prev</button>
                <span>Page {currentPage} of {totalPages(sortedNGOList)}</span>
                <button disabled={currentPage >= totalPages(sortedNGOList)} onClick={() => setCurrentPage((p) => p + 1)}>Next →</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Opportunities */}
      {activeTab === "opportunities" && (
        <div className="admin-panel">
          <div className="panel-head">
            <h2>NGO Opportunities / Posts</h2>
            <span className="panel-meta">{filteredOpps.length} result{filteredOpps.length !== 1 ? "s" : ""}</span>
          </div>
          {filteredOpps.length === 0 ? <div className="admin-empty">No opportunities found.</div> : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Opportunity</th><th>NGO</th><th>Category</th><th>Location</th><th>Type</th><th>Posted</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {paginate(filteredOpps).map((opp) => (
                      <tr key={opp.id}>
                        <td><div className="ngo-name">{opp.title || "Untitled"}</div></td>
                        <td>{opp.ngo_name || opp.ngos?.name || "NGO"}</td>
                        <td><span className={`badge ${getCategoryBadge(opp.category).class}`}>{opp.category || "General"}</span></td>
                        <td>{opp.location || "Remote"}</td>
                        <td>{opp.type || "N/A"}</td>
                        <td>{new Date(opp.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="row-actions">
                            <button className="btn btn-view" onClick={() => openModal(opp, "opportunity")}>👁 View</button>
                            <button className="btn btn-reject" onClick={() => handleDeleteOpportunity(opp.id, opp.title)}>🗑 Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>← Prev</button>
                <span>Page {currentPage} of {totalPages(filteredOpps)}</span>
                <button disabled={currentPage >= totalPages(filteredOpps)} onClick={() => setCurrentPage((p) => p + 1)}>Next →</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Applications */}
      {activeTab === "applications" && (
        <div className="admin-panel">
          <div className="panel-head">
            <h2>All Applications</h2>
            <span className="panel-meta">{filteredApps.length} result{filteredApps.length !== 1 ? "s" : ""}</span>
          </div>
          {filteredApps.length === 0 ? <div className="admin-empty">No applications found.</div> : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Volunteer</th><th>Opportunity</th><th>NGO</th><th>Status</th><th>Applied</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {paginate(filteredApps).map((app) => {
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
                              <button className="btn btn-view" onClick={() => openModal(app, "application")}>👁 View</button>
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
              <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>← Prev</button>
                <span>Page {currentPage} of {totalPages(filteredApps)}</span>
                <button disabled={currentPage >= totalPages(filteredApps)} onClick={() => setCurrentPage((p) => p + 1)}>Next →</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Volunteers */}
      {activeTab === "volunteers" && (
        <div className="admin-panel">
          <div className="panel-head">
            <h2>Volunteers</h2>
            <span className="panel-meta">{filteredVols.length} result{filteredVols.length !== 1 ? "s" : ""}</span>
          </div>
          {filteredVols.length === 0 ? <div className="admin-empty">No volunteers found.</div> : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Volunteer</th><th>Email</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {paginate(filteredVols).map((v) => (
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
                            <button className="btn btn-view" onClick={() => openModal(v, "volunteer")}>👁 View</button>
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
              <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>← Prev</button>
                <span>Page {currentPage} of {totalPages(filteredVols)}</span>
                <button disabled={currentPage >= totalPages(filteredVols)} onClick={() => setCurrentPage((p) => p + 1)}>Next →</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Activity Log */}
      {activeTab === "activity" && (
        <div className="admin-panel">
          <div className="panel-head">
            <h2>Activity Log</h2>
            <span className="panel-meta">{activityLog.length} entries</span>
          </div>
          {activityLog.length === 0 ? <div className="admin-empty">No activity yet. Actions you take will appear here.</div> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Time</th><th>Action</th><th>Target</th><th>Detail</th></tr>
                </thead>
                <tbody>
                  {activityLog.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td><span className={`badge ${log.action.includes("Approved") ? "b-health" : log.action.includes("Rejected") || log.action.includes("Deleted") ? "b-reject" : "b-general"}`}>{log.action}</span></td>
                      <td>{log.target}</td>
                      <td>{log.detail || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
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
                  <div className="modal-row"><label>Email:</label><span>{selectedItem.email || <span className="contact-missing">⚠️ Not provided</span>}</span></div>
                  <div className="modal-row"><label>Phone:</label><span>{selectedItem.phone || <span className="contact-missing">⚠️ Not provided</span>}</span></div>
                  <div className="modal-row"><label>Status:</label><span className={`status-pill s-${(selectedItem.approval_status || "pending").toLowerCase()}`}>{selectedItem.approval_status || "Pending"}</span></div>
                  {selectedItem.rejection_reason && <div className="modal-row"><label>Rejection Reason:</label><span className="reject-reason">{selectedItem.rejection_reason}</span></div>}
                  <div className="modal-desc"><label>About / Mission:</label><p>{selectedItem.description || "No description provided."}</p></div>

                  {/* Document Verification */}
                  <div className="modal-section">
                    <label>📎 Document Verification</label>
                    <div className="doc-verify">
                      <div className="doc-item">
                        <span>Registration Certificate</span>
                        <span className="doc-status pending">⏳ Pending Verification</span>
                      </div>
                      <div className="doc-item">
                        <span>Tax Exemption (NTN)</span>
                        <span className="doc-status pending">⏳ Pending Verification</span>
                      </div>
                      <div className="doc-item">
                        <span>Proof of Address</span>
                        <span className="doc-status pending">⏳ Pending Verification</span>
                      </div>
                      <p className="doc-note">⚠️ Verify documents before approving this NGO to prevent fake registrations.</p>
                    </div>
                  </div>
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

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="admin-modal-overlay" onClick={closeConfirm}>
          <div className="admin-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>
                {confirmModal.action === "approve" ? "Confirm Approval" :
                 confirmModal.action === "reject" ? "Confirm Rejection" :
                 confirmModal.action === "approveApp" ? "Confirm Approval" :
                 confirmModal.action === "rejectApp" ? "Confirm Rejection" :
                 confirmModal.action === "deleteOpp" ? "Confirm Deletion" :
                 confirmModal.action === "suspend" ? "Confirm Suspension" : "Confirm Action"}
              </h2>
              <button className="modal-close" onClick={closeConfirm}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p className="confirm-text">
                {confirmModal.action === "approve" ? `Are you sure you want to approve "${confirmModal.item?.name || "this NGO"}"?` :
                 confirmModal.action === "reject" ? `Are you sure you want to reject "${confirmModal.item?.name || "this NGO"}"?` :
                 confirmModal.action === "deleteOpp" ? `Delete opportunity "${confirmModal.item?.title || "Untitled"}"? This cannot be undone.` :
                 confirmModal.action === "suspend" ? `${confirmModal.item?.suspended ? "Unsuspend" : "Suspend"} ${confirmModal.item?.full_name || "this user"}?` :
                 "Are you sure you want to proceed?"}
              </p>

              {confirmModal.action === "reject" && (
                <div className="form-group">
                  <label>Rejection Reason *</label>
                  <textarea
                    rows="3"
                    placeholder="Explain why this NGO is being rejected..."
                    value={confirmModal.reason}
                    onChange={(e) => setConfirmModal({ ...confirmModal, reason: e.target.value })}
                  />
                  <p className="field-hint">This reason will be stored for audit purposes.</p>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-view" onClick={closeConfirm}>Cancel</button>
              <button
                className={`btn ${confirmModal.action.includes("reject") || confirmModal.action.includes("delete") || confirmModal.action === "suspend" ? "btn-reject" : "btn-approve"}`}
                onClick={executeConfirm}
                disabled={confirmModal.action === "reject" && !confirmModal.reason.trim()}
              >
                {confirmModal.action === "approve" || confirmModal.action === "approveApp" ? "✓ Confirm Approve" :
                 confirmModal.action === "reject" || confirmModal.action === "rejectApp" ? "✕ Confirm Reject" :
                 confirmModal.action === "deleteOpp" ? "🗑 Confirm Delete" :
                 confirmModal.action === "suspend" ? "⛔ Confirm" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;