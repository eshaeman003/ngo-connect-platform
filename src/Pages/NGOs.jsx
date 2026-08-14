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

const categories = ["All", "General", "Healthcare", "Education", "Microfinance", "Health"];

const staticNgos = [
  { id: 1, name: "Community Welfare", category: "General", city: "Islamabad", description: "Working for the upliftment of underprivileged communities through education and healthcare initiatives.", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop" },
  { id: 2, name: "Edhi Foundation", category: "Healthcare", city: "Karachi", description: "Pakistan's largest welfare organization providing emergency services, healthcare, and shelter.", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop" },
  { id: 3, name: "Saylani Welfare", category: "Education", city: "Karachi", description: "Providing free meals, education, and healthcare to thousands of deserving families daily.", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop" },
  { id: 4, name: "Akhuwat Foundation", category: "Microfinance", city: "Lahore", description: "Interest-free microfinance and education programs empowering low-income families.", image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&h=400&fit=crop" },
  { id: 5, name: "Al-Khidmat Foundation", category: "General", city: "Lahore", description: "Humanitarian services including disaster relief, healthcare, and orphan care across Pakistan.", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&h=400&fit=crop" },
  { id: 6, name: "Chhipa Welfare", category: "Healthcare", city: "Karachi", description: "Emergency ambulance services and welfare programs for the needy.", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop" },
  { id: 7, name: "TCF Pakistan", category: "Education", city: "Karachi", description: "The Citizens Foundation building schools in underserved communities across Pakistan.", image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop" },
  { id: 8, name: "Shaukat Khanum", category: "Health", city: "Lahore", description: "State-of-the-art cancer hospital providing free treatment to underprivileged patients.", image: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=400&fit=crop" },
];

function NGOs() {
  const [ngos, setNgos] = useState(staticNgos);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const fetchNgos = async () => {
      setLoading(true);
      const { data } = await supabase.from("ngos").select("*").eq("approval_status", "approved");
      if (data && data.length > 0) setNgos(data);
      setLoading(false);
    };
    fetchNgos();
  }, []);

  const filtered = ngos.filter((n) => {
    const matchesSearch =
      (n.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (n.city || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || (n.category || "") === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="ngos-page">
      {/* Header */}
      <div className="ngos-header">
        <span className="ngos-label">OUR PARTNERS</span>
        <h1>Our Partner NGOs</h1>
        <p>Discover organizations making real change across Pakistan. Connect, volunteer, and contribute to causes that matter.</p>
      </div>

      {/* Search & Filters — Centered */}
      <div className="ngos-controls">
        <div className="ngos-search-wrap">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ngos-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={activeCategory === cat ? "active" : ""}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="ngos-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div className="ngo-skeleton" key={i}>
              <div className="sk-img" />
              <div className="sk-body">
                <div className="sk-line short" />
                <div className="sk-line" />
                <div className="sk-line mid" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="ngos-empty">
            <div className="empty-icon">🔍</div>
            <h3>No NGOs found</h3>
            <p>Try adjusting your search or filter.</p>
          </div>
        ) : (
          filtered.map((ngo) => (
            <div className="ngo-card" key={ngo.id}>
              <div className="ngo-card-visual">
                <img src={ngo.image || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop"} alt={ngo.name} loading="lazy" />
                <span className="ngo-card-badge">{ngo.category || "General"}</span>
                <div className="ngo-card-overlay">
                  <Link to={`/ngos/${ngo.id}`} className="ngo-view-btn">
                    View Profile <ArrowRightIcon />
                  </Link>
                </div>
              </div>
              <div className="ngo-card-body">
                <h3>{ngo.name}</h3>
                <p className="ngo-card-desc">{ngo.description || "Dedicated to serving the community through impactful programs and volunteer support."}</p>
                <div className="ngo-card-meta">
                  <span><MapPinIcon /> {ngo.city || "Pakistan"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NGOs;