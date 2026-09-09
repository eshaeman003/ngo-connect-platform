import { useState } from "react";
import { supabase } from "../utils/supabase";
import "./ReportModal.css";

export default function ReportModal({ reportedId, reportedName, type, onClose }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  const reasons = [
    "Fake post / Scam",
    "Misleading information",
    "Harassment",
    "Spam",
    "Inappropriate content",
    "Other",
  ];

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Please login first", "error");
      setLoading(false);
      return;
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const { error } = await supabase.from("complaints").insert({
      reporter_id: user.id,
      reported_id: reportedId,
      reporter_name: prof?.full_name || user.email,
      reported_name: reportedName,
      type,
      reason,
      description,
      status: "pending",
    });

    setLoading(false);
    if (error) showToast("Failed to submit report", "error");
    else {
      showToast("Report submitted! Admin will review.");
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        {toast.show && <div className={`report-toast ${toast.type}`}>{toast.msg}</div>}
        <div className="report-header">
          <h3>🚨 Report {type === "ngo" ? "NGO / Post" : "Volunteer"}</h3>
          <button className="report-close" onClick={onClose}>✕</button>
        </div>
        <div className="report-body">
          <p className="report-target">
            Reporting: <strong>{reportedName}</strong>
          </p>
          <form onSubmit={handleSubmit}>
            <div className="report-group">
              <label>Reason *</label>
              <select required value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="">Select a reason</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="report-group">
              <label>Description *</label>
              <textarea
                required
                rows="4"
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="report-actions">
              <button type="button" className="rbtn rbtn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="rbtn rbtn-submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}