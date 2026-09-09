import "./StatusBadge.css";

/**
 * Consistent color-coded status pill used across dashboards
 * (applications, NGO approvals, complaints, opportunities).
 */
const TONE_MAP = {
  approved: "good",
  active: "good",
  resolved: "good",
  completed: "good",
  pending: "warn",
  reviewed: "warn",
  rejected: "bad",
  suspended: "bad",
  closed: "neutral",
};

function StatusBadge({ status }) {
  const normalized = (status || "pending").toLowerCase();
  const tone = TONE_MAP[normalized] || "neutral";
  return <span className={`status-badge-pill tone-${tone}`}>{normalized}</span>;
}

export default StatusBadge;
