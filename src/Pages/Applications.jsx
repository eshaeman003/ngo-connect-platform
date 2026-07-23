import { useState } from 'react';
import './Applications.css';

const mockApplications = [
  {
    id: 1,
    opportunity: 'Teach English to Children',
    ngo: 'Akhuwat Foundation',
    appliedDate: '2026-07-20',
    status: 'Pending'
  },
  {
    id: 2,
    opportunity: 'Medical Camp Assistant',
    ngo: 'Edhi Foundation',
    appliedDate: '2026-07-18',
    status: 'Approved'
  },
  {
    id: 3,
    opportunity: 'Microfinance Field Officer',
    ngo: 'Kashf Foundation',
    appliedDate: '2026-07-15',
    status: 'Rejected'
  }
];

function Applications() {
  const [filter, setFilter] = useState('All');

  const statusColors = {
    Pending: 'status-pending',
    Approved: 'status-approved',
    Rejected: 'status-rejected'
  };

  const filtered = filter === 'All' 
    ? mockApplications 
    : mockApplications.filter(app => app.status === filter);

  return (
    <div className="applications-page">
      <div className="applications-header">
        <h1>My Applications</h1>
        <p>Track all your volunteer applications in one place</p>
      </div>

      <div className="filter-tabs">
        {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
          <button
            key={status}
            className={filter === status ? 'active' : ''}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="applications-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No applications found.</p>
          </div>
        ) : (
          filtered.map((app) => (
            <div key={app.id} className="application-card">
              <div className="app-info">
                <h3>{app.opportunity}</h3>
                <p className="app-ngo">🏛️ {app.ngo}</p>
                <p className="app-date">📅 Applied: {app.appliedDate}</p>
              </div>
              <div className="app-status">
                <span className={`status-badge ${statusColors[app.status]}`}>
                  {app.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Applications;