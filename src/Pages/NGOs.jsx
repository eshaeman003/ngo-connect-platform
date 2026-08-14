import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./NGOs.css";

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);

const staticNgos = [
  { id: 1, name: "Community Welfare", category: "General", city: "Islamabad", description: "Working for community development and social welfare since 2010.", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop" },
  { id: 2, name: "Edhi Foundation", category: "Healthcare", city: "Karachi", description: "Pakistan's largest welfare organization providing medical and burial services.", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop" },
  { id: 3, name: "Saylani Welfare Trust", category: "Education", city: "Karachi", description: "Feeding the hungry and educating the underprivileged across Pakistan.", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop" },
  { id: 4, name: "Akhuwat Foundation", category: "Microfinance", city: "Lahore", description: "Interest-free microfinance to empower low-income families.", image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=300&fit=crop" },
  { id: 5, name: "Shaukat Khanum", category: "Health", city: "Lahore", description: "State-of-the-art cancer hospital providing free treatment to needy patients.", image: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=300&fit=crop" },
  { id: 6, name: "Al-Khidmat Foundation", category: "General", city: "Multan", description: "Disaster relief, health services, and education for all.", image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=300&fit=crop" },
  { id: 7, name: "TCF Pakistan", category: "Education", city: "Karachi", description: "The Citizens Foundation building schools in underserved communities.", image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop" },
  { id: 8, name: "Chhipa Welfare", category: "Healthcare", city: "Karachi", description: "Emergency ambulance services and free food distribution.", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop" },
];

const categories = ["All", "General", "Healthcare", "Education", "Microfinance", "Health"];

function NGOs() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => {
      setNgos(staticNgos);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = ngos.filter((n) => {
    const matchSearch = n.name.toLowerCase().includes(search.toLowerCase()) || n.city.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || n.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="ngos-page">
      {/* Hero */}
      <div className="ngos-hero">
        <h1>Our Partner NGOs</h1>
        <p>Discover organizations making real change across Pakistan. Connect, volunteer, and contribute to causes that matter.</p>
      </div>

      {/* Search & Filter */}
      <div className="ngos-toolbar">
        <div className="ngos-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ngos-filters">
          {categories.map((c) => (
            <button
              key={c}
              className={activeCategory === c ? "active" : ""}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="ngos-list-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ngo-card skeleton">
              <div className="skeleton-img" />
              <div className="skeleton-body">
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
                <div className="skeleton-line mid" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="ngos-empty">No NGOs found matching your criteria.</div>
        ) : (
          filtered.map((ngo) => (
            <Link to={`/ngos/${ngo.id}`} key={ngo.id} className="ngo-card">
              <div className="ngo-card-img">
                <img src={ngo.image} alt={ngo.name} loading="lazy" />
                <span className="ngo-card-badge">{ngo.category}</span>
              </div>
              <div className="ngo-card-body">
                <h3>{ngo.name}</h3>
                <p>{ngo.description}</p>
                <div className="ngo-card-footer">
                  <span><MapPinIcon /> {ngo.city}</span>
                  <span className="ngo-card-link">View <ArrowRightIcon /></span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default NGOs;