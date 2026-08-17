import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./NGOs.css";

// Curated unique NGO images - each NGO gets a different image
const ngoImages = [
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1524069290683-0457abfe42c3?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1560252829-804f1aedf1be?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1609234656388-0ff363383899?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1594708767771-a7502f4e6f59?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=400&fit=crop",
];

function getNgoImage(ngoName, index) {
  const hash = ngoName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ngoImages[(hash + index) % ngoImages.length];
}

// Rich fallback descriptions for popular NGOs
const fallbackDescriptions = {
  "akhuwat": "Pakistan's largest interest-free microfinance organization, empowering low-income families through loans, education, and healthcare services.",
  "edhi": "Pakistan's largest volunteer ambulance network providing emergency medical aid, shelter, orphan care, and burial services nationwide.",
  "saylani": "Serving millions through free meals, education, healthcare, and welfare programs for the underprivileged across Pakistan.",
  "chhipa": "24/7 emergency ambulance service and free food distribution to those in need across Karachi and beyond.",
  "al-khidmat": "Leading disaster management, healthcare, education, and clean water initiatives for communities in need.",
};

function getFallbackDesc(name) {
  const lower = (name || "").toLowerCase();
  for (const key of Object.keys(fallbackDescriptions)) {
    if (lower.includes(key)) return fallbackDescriptions[key];
  }
  return "Dedicated to creating lasting positive change through community-driven programs, outreach initiatives, and sustainable development projects.";
}

export default function NGOs() {
  const [ngos, setNgos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNGOs();
  }, []);

  async function fetchNGOs() {
    setLoading(true);
    const { data, error } = await supabase.from("ngos").select("*");
    if (!error && data) {
      // Enrich data with fallbacks
      const enriched = data.map((ngo, idx) => ({
        ...ngo,
        description: ngo.description || getFallbackDesc(ngo.name),
        location: ngo.location || "Pakistan",
        category: ngo.category || "General",
        _image: getNgoImage(ngo.name || "NGO", idx),
      }));
      setNgos(enriched);
      setFiltered(enriched);
    }
    setLoading(false);
  }

  useEffect(() => {
    let result = ngos;
    if (category !== "All") {
      result = result.filter((n) =>
        (n.category || "").toLowerCase().includes(category.toLowerCase())
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          (n.name || "").toLowerCase().includes(q) ||
          (n.description || "").toLowerCase().includes(q) ||
          (n.location || "").toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, category, ngos]);

  const categories = ["All", "Education", "Health", "Environment", "Food", "Shelter", "Women Empowerment", "Child Welfare", "Disaster Relief"];

  return (
    <div className="ngos-page">
      <div className="ngos-hero">
        <h1 className="ngos-hero-title">Discover NGOs</h1>
        <p className="ngos-hero-subtitle">
          Find and connect with verified organizations making real impact
        </p>
      </div>

      <div className="ngos-controls">
        <div className="ngos-search-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="ngos-search"
            placeholder="Search by name, cause, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ngos-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-pill ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="ngos-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="ngo-skeleton">
              <div className="skeleton-img" />
              <div className="skeleton-text" />
              <div className="skeleton-text short" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ngos-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <h3>No NGOs found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="ngos-grid">
          {filtered.map((ngo) => (
            <div key={ngo.id} className="ngo-card">
              <div className="ngo-card-img-wrap">
                <img
                  src={ngo._image}
                  alt={ngo.name}
                  className="ngo-card-img"
                  loading="lazy"
                />
                <div className="ngo-card-overlay">
                  <button
                    className="ngo-view-btn"
                    onClick={() => navigate(`/ngos/${ngo.id}`)}
                  >
                    View Profile
                  </button>
                </div>
                {ngo.verified && (
                  <span className="ngo-verified-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <div className="ngo-card-body">
                <span className="ngo-card-category">{ngo.category}</span>
                <h3 className="ngo-card-title">{ngo.name}</h3>
                <p className="ngo-card-desc">{ngo.description}</p>
                <div className="ngo-card-meta">
                  <span className="ngo-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {ngo.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}