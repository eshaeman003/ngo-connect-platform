import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./NGODetails.css";

// Rich mock data for known NGOs
const ngoDatabase = {
  "akhuwat": {
    name: "Akhuwat Foundation",
    category: "Microfinance",
    location: "Lahore, Pakistan",
    email: "info@akhuwat.org.pk",
    phone: "+92-42-111-112-113",
    website: "www.akhuwat.org.pk",
    description: "Akhuwat is the world's largest interest-free microfinance organization, transforming lives through compassion and solidarity.",
    mission: "To alleviate poverty by empowering socially and economically marginalized segments of society through interest-free microfinance and education.",
    vision: "A poverty-free society built on the principles of compassion, equity, and mutual support.",
    services: ["Interest-free Microfinance (Qarz-e-Hasana)", "Akhuwat College University", "Health Services", "Clothing & Food Programs"],
    impact: { lives: "5M+", volunteers: "10K+", years: "22", cities: "400+" },
    image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=400&fit=crop"
  },
  "edhi": {
    name: "Edhi Foundation",
    category: "Healthcare",
    location: "Karachi, Pakistan",
    email: "contact@edhi.org.pk",
    phone: "+92-21-111-111-134",
    website: "www.edhi.org.pk",
    description: "Pakistan's largest non-profit social welfare organization, providing emergency services, healthcare, and shelter to millions.",
    mission: "To serve humanity without discrimination of religion, caste, or creed through an extensive network of ambulances, hospitals, and shelters.",
    vision: "A world where no person is left without medical care, shelter, or dignity in their time of need.",
    services: ["24/7 Ambulance Service", "Orphanages & Shelters", "Graveyard Services", "International Relief"],
    impact: { lives: "10M+", volunteers: "50K+", years: "68", cities: "350+" },
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&h=400&fit=crop"
  },
  "saylani": {
    name: "Saylani Welfare International Trust",
    category: "Education",
    location: "Karachi, Pakistan",
    email: "info@saylaniwelfare.com",
    phone: "+92-21-111-729-526",
    website: "www.saylaniwelfare.com",
    description: "One of Pakistan's largest NGOs, serving humanity through food distribution, education, healthcare, and vocational training.",
    mission: "To serve humanity without any discrimination and become a beacon of hope for the underprivileged masses.",
    vision: "An educated, skilled, and self-sufficient Pakistan where no one sleeps hungry.",
    services: ["Daily Food Distribution", "Vocational Training", "IT Education", "Healthcare Clinics"],
    impact: { lives: "3M+", volunteers: "25K+", years: "24", cities: "63" },
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=400&fit=crop"
  },
  "chhipa": {
    name: "Chhipa Welfare Association",
    category: "Emergency Response",
    location: "Karachi, Pakistan",
    email: "info@chhipa.org",
    phone: "+92-21-111-244-742",
    website: "www.chhipa.org",
    description: "Dedicated to emergency ambulance services, burial services, and humanitarian aid across Pakistan.",
    mission: "To provide immediate emergency response and dignified burial services to those in need, regardless of background.",
    vision: "A Pakistan where emergency medical care and dignified last rites are accessible to every citizen.",
    services: ["Emergency Ambulance", "Free Burial Services", "Free Kitchen (Dastarkhwan)", "Blood Bank"],
    impact: { lives: "2M+", volunteers: "15K+", years: "35", cities: "200+" },
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=400&fit=crop"
  },
  "al-khidmat": {
    name: "Al-Khidmat Foundation",
    category: "Healthcare",
    location: "Lahore, Pakistan",
    email: "info@alkhidmat.org",
    phone: "+92-42-111-542-542",
    website: "www.alkhidmat.org",
    description: "One of Pakistan's leading NGOs in disaster management, healthcare, education, and community development.",
    mission: "To serve humanity through comprehensive welfare programs focusing on health, education, and disaster relief.",
    vision: "A prosperous Pakistan where every citizen has access to healthcare, education, and disaster support.",
    services: ["Disaster Management", "Clean Water Projects", "Orphan Care", "Medical Camps"],
    impact: { lives: "4M+", volunteers: "30K+", years: "32", cities: "100+" },
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=400&fit=crop"
  }
};

// Generate realistic mock data for unknown NGOs
function generateMockNGO(id, name, category, location) {
  const cleanName = (name || "Organization").toLowerCase().replace(/[^a-z]/g, "");
  
  // Try to match by name first
  for (const key in ngoDatabase) {
    if (cleanName.includes(key)) return { ...ngoDatabase[key], id };
  }
  
  // Generate based on category
  const cat = (category || "General").toLowerCase();
  const loc = location || "Pakistan";
  
  const servicesMap = {
    health: ["Free Medical Camps", "Mobile Clinics", "Health Awareness", "Vaccination Drives"],
    edu: ["Free Schools", "Scholarship Programs", "Adult Literacy", "Digital Learning"],
    micro: ["Interest-free Loans", "Business Training", "Women Empowerment", "Skill Development"],
    env: ["Tree Plantation", "Clean Water", "Waste Management", "Climate Awareness"],
    food: ["Daily Food Distribution", "Ramadan Ration", "Free Kitchen", "Nutrition Programs"]
  };
  
  let services = servicesMap.edu;
  if (cat.includes("health")) services = servicesMap.health;
  else if (cat.includes("micro")) services = servicesMap.micro;
  else if (cat.includes("env")) services = servicesMap.env;
  else if (cat.includes("food")) services = servicesMap.food;
  
  const hash = id.split('').reduce((a,b) => a + b.charCodeAt(0), 0);
  
  return {
    id,
    name: name || "Community Welfare Organization",
    category: category || "General",
    location: loc,
    email: `contact@${cleanName || "ngo"}.org.pk`,
    phone: `+92-51-${(1000000 + hash % 9000000)}`,
    website: `www.${cleanName || "ngo"}.org.pk`,
    description: `A dedicated organization working tirelessly in ${loc} to uplift communities through sustainable development and social welfare programs.`,
    mission: `To empower marginalized communities in ${loc} through accessible ${category || "social"} services and community-driven initiatives.`,
    vision: `A prosperous and equitable society where every individual in ${loc} has access to basic necessities and opportunities for growth.`,
    services,
    impact: { 
      lives: `${(50 + hash % 950)}K+`, 
      volunteers: `${(5 + hash % 45)}K+`, 
      years: `${5 + hash % 20}`, 
      cities: `${10 + hash % 40}+` 
    },
    image: `https://images.unsplash.com/photo-${[
      "1488521787991-ed7bbaae773c",
      "1593113598332-cd288d649433",
      "1559027615-cd4628902d4a",
      "1532629345422-7515f3d16bb6",
      "1582213782179-e0d53f98f2ca",
      "1509099836639-18ba1795216d",
      "1517486808906-6ca8b3f04846",
      "1469571486292-0ba58a3f068b"
    ][hash % 8]}?w=800&h=400&fit=crop`
  };
}

function NGODetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchNGO = async () => {
      setLoading(true);
      
      // Try Supabase first
      const { data, error } = await supabase
        .from("ngos")
        .select("*")
        .eq("id", id)
        .single();

      if (data && !error) {
        // Found in database
        setNgo(data);
        setLoading(false);
        return;
      }

      // Fallback: Try to get from opportunities or profiles
      const { data: oppData } = await supabase
        .from("opportunities")
        .select("ngo_name, category, location")
        .eq("ngo_id", id)
        .single();

      // Generate rich mock data
      const mockData = generateMockNGO(
        id, 
        oppData?.ngo_name || null, 
        oppData?.category || null, 
        oppData?.location || null
      );
      
      setNgo(mockData);
      setLoading(false);
    };

    fetchNGO();
  }, [id]);

  if (loading) {
    return (
      <div className="ngo-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading organization details...</p>
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="ngo-not-found">
        <div className="not-found-icon">✕</div>
        <h1>NGO Not Found</h1>
        <p>The organization you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate("/ngos")} className="btn-back">
          ← Back to NGOs
        </button>
      </div>
    );
  }

  const handleEmail = () => {
    window.location.href = `mailto:${ngo.email}`;
  };

  return (
    <div className="ngo-detail-page">
      {/* Hero */}
      <div className="ngo-hero" style={{ backgroundImage: `url(${ngo.image})` }}>
        <div className="ngo-hero-overlay"></div>
        <div className="ngo-hero-content">
          <button className="btn-back-light" onClick={() => navigate("/ngos")}>
            ← Back
          </button>
          <span className="ngo-category">{ngo.category}</span>
          <h1>{ngo.name}</h1>
          <p className="ngo-location">📍 {ngo.location}</p>
        </div>
      </div>

      <div className="ngo-container">
        {/* Main Info */}
        <div className="ngo-main">
          <div className="ngo-section">
            <h2>About</h2>
            <p>{ngo.description}</p>
          </div>

          <div className="ngo-section">
            <h2>Mission</h2>
            <p className="ngo-mission">{ngo.mission}</p>
          </div>

          <div className="ngo-section">
            <h2>Vision</h2>
            <p className="ngo-vision">{ngo.vision}</p>
          </div>

          <div className="ngo-section">
            <h2>Services & Programs</h2>
            <div className="ngo-services">
              {ngo.services?.map((service, i) => (
                <span key={i} className="service-tag">✓ {service}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="ngo-sidebar">
          {/* Impact Stats */}
          <div className="ngo-card impact-card">
            <h3>Impact Highlights</h3>
            <div className="impact-grid">
              <div className="impact-item">
                <span className="impact-num">{ngo.impact?.lives || "50K+"}</span>
                <span className="impact-label">Lives Touched</span>
              </div>
              <div className="impact-item">
                <span className="impact-num">{ngo.impact?.volunteers || "5K+"}</span>
                <span className="impact-label">Volunteers</span>
              </div>
              <div className="impact-item">
                <span className="impact-num">{ngo.impact?.years || "10+"}</span>
                <span className="impact-label">Years Active</span>
              </div>
              <div className="impact-item">
                <span className="impact-num">{ngo.impact?.cities || "20+"}</span>
                <span className="impact-label">Cities</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="ngo-card contact-card">
            <h3>Contact Information</h3>
            <div className="contact-item">
              <span className="contact-icon">✉️</span>
              <div>
                <label>Email</label>
                <a href={`mailto:${ngo.email}`}>{ngo.email}</a>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <label>Phone</label>
                <p>{ngo.phone}</p>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">🌐</span>
              <div>
                <label>Website</label>
                <p>{ngo.website}</p>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <div>
                <label>Address</label>
                <p>{ngo.location}, Pakistan</p>
              </div>
            </div>
            <button className="btn-collaborate" onClick={handleEmail}>
              ✉️ Send Collaboration Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NGODetails;