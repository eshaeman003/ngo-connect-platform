import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Opportunities.css';

const mockOpportunities = [
  {
    id: 1,
    title: 'Teach English to Children',
    ngo: 'Akhuwat Foundation',
    location: 'Lahore',
    category: 'Education',
    description: 'Volunteer to teach basic English to underprivileged children.',
    type: 'Part-time'
  },
  {
    id: 2,
    title: 'Medical Camp Assistant',
    ngo: 'Edhi Foundation',
    location: 'Karachi',
    category: 'Healthcare',
    description: 'Assist doctors and staff in free medical camps.',
    type: 'Weekend'
  },
  {
    id: 3,
    title: 'Microfinance Field Officer',
    ngo: 'Kashf Foundation',
    location: 'Lahore',
    category: 'Microfinance',
    description: 'Help assess loan applications in rural areas.',
    type: 'Full-time'
  }
];

function Opportunities() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Education', 'Healthcare', 'Microfinance'];

  const filtered = mockOpportunities.filter((opp) => {
    const searchMatch = opp.title.toLowerCase().includes(search.toLowerCase());
    const categoryMatch = selectedCategory === 'All' || opp.category === selectedCategory;
    return searchMatch && categoryMatch;
  });

  return (
    <div className="opportunities-page">
      <div className="opportunities-header">
        <h1>Volunteer Opportunities</h1>
        <p>Find meaningful ways to contribute to your community</p>
      </div>

      <div className="opportunities-filters">
        <input
          type="text"
          placeholder="Search opportunities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <div className="category-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={selectedCategory === cat ? 'active' : ''}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="opportunities-grid">
        {filtered.length === 0 ? (
          <p className="no-results">No opportunities found.</p>
        ) : (
          filtered.map((opp) => (
            <div key={opp.id} className="opportunity-card">
              <div className="opportunity-header">
                <span className="opp-category">{opp.category}</span>
                <span className="opp-type">{opp.type}</span>
              </div>
              <h3>{opp.title}</h3>
              <p className="opp-ngo">🏛️ {opp.ngo}</p>
              <p className="opp-location">📍 {opp.location}</p>
              <p className="opp-desc">{opp.description}</p>
              <button className="apply-btn">Apply Now</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Opportunities;