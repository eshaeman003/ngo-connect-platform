import { Link } from "react-router-dom";
import "./NGOCard.css";

function NGOCard({ id, name, city, category }) {
  return (
    <div className="ngo-card">
      <div className="ngo-card-image-wrapper">
        <div className="ngo-card-placeholder-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="ngo-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21c-4.97-4.02-8-7.5-8-11a8 8 0 0116 0c0 3.5-3.03 6.98-8 11z"
            />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </div>
      </div>

      <div className="ngo-card-body">
        <h3 className="ngo-card-title">{name}</h3>
        <div className="ngo-card-location">
          <span>📍 {city}</span>
        </div>
        <span className="ngo-card-badge">{category}</span>
        <Link to={`/ngos/${id}`}>
          <button className="ngo-card-button">View Details</button>
        </Link>
      </div>
    </div>
  );
}

export default NGOCard;