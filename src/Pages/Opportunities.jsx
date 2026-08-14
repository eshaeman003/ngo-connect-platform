import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import "./Opportunities.css";

// Rich fallback data generator
const opportunityImages = [
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=350&fit=crop",
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=350&fit=crop",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&h=350&fit=crop",
  "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=600&h=350&fit=crop",
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&h=350&fit=crop",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&h=350&fit=crop",
  "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&h=350&fit=crop",
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&h=350&fit=crop",
  "https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=600&h=350&fit=crop",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&h=350&fit=crop",
  "https://images.unsplash.com/photo-1524069290683-0457abfe42c3?w=600&h=350&fit=crop",
  "https://images.unsplash.com/photo-1560252829-804f1aedf1be?w=600&h=350&fit=crop",
];

function getOppImage(title, index) {
  const hash = (title || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return opportunityImages[(hash + index) % opportunityImages.length];
}

function enrichOpportunity(opp, index) {
  const title = opp.title || "Volunteer Opportunity";
  const lower = title.toLowerCase();

  // Rich description fallback
  let description = opp.description;
  if (!description || description.length < 30) {
    const descMap = {
      "teach": "Join us in making education accessible to underprivileged communities. Your time and skills can transform lives and create lasting change.",
      "blood": "Help us save lives by volunteering at our blood donation camps. Every drop counts and your support can make a critical difference.",
      "drive": "Empower women through mobility and independence. Teach driving skills that open doors to new opportunities and freedom.",
      "orphan": "Bring joy to orphaned children through care, companionship, and support. Your kindness can light up a child's world.",
      "food": "Help distribute meals to those in need. Be part of a mission that ensures no one goes to bed hungry.",
      "health": "Support healthcare initiatives that provide free medical care to underserved communities. Every hand helps heal.",
      "environment": "Contribute to a greener planet through tree planting, clean-up drives, and environmental awareness campaigns.",
      "digital": "Bridge the digital divide by teaching essential tech skills. Empower communities with knowledge for the modern world.",
      "sign": "Make communication accessible for everyone. Teach sign language and create inclusive spaces for the hearing impaired.",
      "finance": "Build financial literacy in youth and communities. Help people make informed decisions for a secure future.",
    };

    let matched = false;
    for (const key of Object.keys(descMap)) {
      if (lower.includes(key)) { description = descMap[key]; matched = true; break; }
    }
    if (!matched) {
      description = `We are looking for passionate volunteers to join our ${opp.category || "community"} initiative. Your contribution will directly impact lives and create meaningful change in ${opp.location || "our community"}.`;
    }
  }

  // Requirements fallback
  let requirements = opp.requirements;
  if (!requirements || requirements.length < 10) {
    requirements = "No prior experience required. Must be 18+ years old. Commitment of 4-8 hours per week. Passion for community service is essential.";
  }

  // Duration fallback
  const duration = opp.duration || "Flexible";

  // Type fallback
  const type = opp.type || "Part-time";

  // Location fallback
  const location = opp.location || "Pakistan";

  // Category fallback
  const category = opp.category || "Community";

  // Organization fallback
  const organization = opp.organization || "Community Welfare Organization";

  // Spots fallback
  const spots = opp.spots_available || Math.floor(Math.random() * 15) + 5;

  return {
    ...opp,
    title,
    description,
    requirements,
    duration,
    type,
    location,
    category,
    organization,
    spots_available: spots,
    _image: getOppImage(title, index),
  };
}

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  async function fetchOpportunities() {
    setLoading(true);
    const { data, error } = await supabase.from("opportunities").select("*");
    if (!error && data) {
      const enriched = data.map((opp, idx) => enrichOpportunity(opp, idx));
      setOpportunities(enriched);
      setFiltered(enriched);
    }
    setLoading(false);
  }

  useEffect(() => {
    let result = opportunities;
    if (category !== "All") {
      result = result.filter((o) =>
        (o.category || "").toLowerCase().includes(category.toLowerCase())
      );
    }
    if (type !== "All") {
      result = result.filter((o) =>
        (o.type || "").toLowerCase().includes(type.toLowerCase())
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          (o.title || "").toLowerCase().includes(q) ||
          (o.description || "").toLowerCase().includes(q) ||
          (o.location || "").toLowerCase().includes(q) ||
          (o.organization || "").toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, category, type, opportunities]);

  const categories = ["All", "Education", "Healthcare", "Microfinance", "Environment", "Food & Shelter", "Women Empowerment", "Disaster Relief"];
  const types = ["All", "Part-time", "Full-time", "One-time", "Weekend", "Remote", "On-site"];

  return (
    <div className="opportunities-page">
      {/* Hero Banner */}
      <div className="opp-hero">
        <div className="opp-hero-content">
          <h1 className="opp-hero-title">Volunteer Opportunities</h1>
          <p className="opp-hero-subtitle">
            Find meaningful ways to contribute to your community and make a real difference
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="opp-controls">
        <div className="opp-search-wrapper">
          <svg className="opp-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="opp-search"
            placeholder="Search opportunities by title, cause, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="opp-filters-row">
          <div className="opp-filter-group">
            <span className="opp-filter-label">Category</span>
            <div className="opp-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`opp-pill ${category === cat ? "active" : ""}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="opp-filter-group">
            <span className="opp-filter-label">Type</span>
            <div className="opp-pills">
              {types.map((t) => (
                <button
                  key={t}
                  className={`opp-pill ${type === t ? "active" : ""}`}
                  onClick={() => setType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="opp-results-bar">
        <span className="opp-results-count">
          {filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"} found
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="opp-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="opp-skeleton">
              <div className="opp-skeleton-img" />
              <div className="opp-skeleton-body">
                <div className="opp-skeleton-tags" />
                <div className="opp-skeleton-title" />
                <div className="opp-skeleton-text" />
                <div className="opp-skeleton-text short" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="opp-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <h3>No opportunities found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="opp-grid">
          {filtered.map((opp) => (
            <div key={opp.id} className="opp-card">
              <div className="opp-card-img-wrap">
                <img src={opp._image} alt={opp.title} className="opp-card-img" loading="lazy" />
                <div className="opp-card-img-overlay" />
                <div className="opp-card-spots">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {opp.spots_available} spots left
                </div>
              </div>

              <div className="opp-card-body">
                <div className="opp-card-tags">
                  <span className="opp-tag category">{opp.category}</span>
                  <span className="opp-tag type">{opp.type}</span>
                </div>

                <h3 className="opp-card-title">{opp.title}</h3>
                <p className="opp-card-desc">{opp.description}</p>

                <div className="opp-card-meta">
                  <span className="opp-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {opp.location}
                  </span>
                  <span className="opp-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                    </svg>
                    {opp.duration}
                  </span>
                  <span className="opp-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    {opp.organization}
                  </span>
                </div>

                <div className="opp-card-requirements">
                  <span className="req-label">Requirements:</span>
                  <span className="req-text">{opp.requirements}</span>
                </div>

                <button className="opp-apply-btn">
                  Apply Now
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}