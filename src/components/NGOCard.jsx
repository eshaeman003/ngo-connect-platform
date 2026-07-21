import React from 'react';
import './NGOCard.css';

const NGOCard = ({ name, city, category }) => {
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
            <circle cx="12" cy="10" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="ngo-card-body">
        <h3 className="ngo-card-title">{name}</h3>

        <div className="ngo-card-location">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="location-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
          <span>{city}</span>
        </div>

        <span className="ngo-card-badge">{category}</span>

        <button className="ngo-card-button">View Details</button>
      </div>
    </div>
  );
};

export default NGOCard;