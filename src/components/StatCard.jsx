import "./StatCard.css";

/**
 * A bold KPI-style stat card used across the Admin, NGO, and Volunteer dashboards.
 * value: number/string to display big
 * label: small caption under the number
 * icon: a lucide-react icon component (already sized by CSS)
 * trend: optional string like "+12%" — shown as a small pill
 * trendDirection: "up" | "down" | "neutral" — controls pill color
 * tone: "green" | "coral" | "amber" | "blue" — accent color for the icon chip
 */
function StatCard({ icon: Icon, value, label, trend, trendDirection = "up", tone = "green" }) {
  return (
    <div className={`stat-card stat-card-${tone}`}>
      <div className="stat-card-top">
        {Icon && (
          <div className="stat-card-icon">
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
        {trend && (
          <span className={`stat-card-trend trend-${trendDirection}`}>{trend}</span>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

export default StatCard;
