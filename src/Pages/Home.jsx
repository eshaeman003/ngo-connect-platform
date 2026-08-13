import { Link } from "react-router-dom";
import "./Home.css";

const ngos = [
  { id: 1, name: "Community Welfare", category: "General", city: "islamabad", initial: "C" },
  { id: 2, name: "Edhi Foundation", category: "Healthcare", city: "Karachi", initial: "E" },
  { id: 3, name: "Saylani Welfare Trust", category: "Education", city: "Karachi", initial: "S" },
  { id: 4, name: "Akhuwat Foundation", category: "Microfinance", city: "Lahore", initial: "A" },
];

const opportunities = [
  {
    id: 1,
    title: "teach urdu to children",
    description: "teach students urdu with speech disorder...",
    category: "Education",
    location: "islamabad",
    type: "Full-time",
    icon: "📚",
  },
  {
    id: 2,
    title: "food drive",
    description: "distributing food among 200+ locals...",
    category: "Environment",
    location: "rawalpindi",
    type: "Weekend",
    icon: "🌱",
  },
];

function Home() {
  return (
    <div className="home-page">
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-left">
          <h1 className="hero-title">
            Your Empathy<br />
            <span className="hero-title-accent">Transforms Lives</span>
          </h1>
          <p className="hero-desc">
            Join thousands of volunteers making a real difference.
            Connect with NGOs, find meaningful opportunities, and
            create lasting impact in communities that need you most.
          </p>
          <div className="hero-buttons">
            <Link to="/opportunities" className="btn-primary">Explore Opportunities</Link>
            <Link to="/register" className="btn-outline">Join as Volunteer</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card">
            <div className="hero-badge top-right">
              <span>❤️</span> Make an Impact
            </div>
            <div className="hero-emoji">🤝</div>
            <div className="hero-badge bottom-left">
              <span>🌐</span> Global Reach
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section">
        <div className="stat-item">
          <h3>500+</h3>
          <p>Active Volunteers</p>
        </div>
        <div className="stat-item">
          <h3>50+</h3>
          <p>Partner NGOs</p>
        </div>
        <div className="stat-item">
          <h3>10K+</h3>
          <p>Hours Served</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <span className="section-label">HOW IT WORKS</span>
        <h2 className="section-title">Three Steps to Make a Difference</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-header">
              <div className="step-icon">👤</div>
              <span className="step-number">01</span>
            </div>
            <h4>Create Your Profile</h4>
            <p>Sign up as a volunteer or NGO. Tell us about your skills, passions, and availability.</p>
          </div>
          <div className="step-card">
            <div className="step-header">
              <div className="step-icon">🔍</div>
              <span className="step-number">02</span>
            </div>
            <h4>Discover Opportunities</h4>
            <p>Browse through hundreds of volunteering opportunities that match your interests.</p>
          </div>
          <div className="step-card">
            <div className="step-header">
              <div className="step-icon">🚀</div>
              <span className="step-number">03</span>
            </div>
            <h4>Start Volunteering</h4>
            <p>Apply, get approved, and begin your journey of creating positive change.</p>
          </div>
        </div>
      </section>

      {/* NGOs */}
      <section className="ngos-section">
        <span className="section-label">OUR PARTNERS</span>
        <h2 className="section-title">NGOs Making Real Impact</h2>
        <div className="ngos-grid">
          {ngos.map((ngo) => (
            <Link to={`/ngos/${ngo.id}`} key={ngo.id} className="ngo-home-card">
              <div className="ngo-home-avatar">{ngo.initial}</div>
              <h4>{ngo.name}</h4>
              <span className="ngo-home-category">{ngo.category}</span>
              <div className="ngo-home-location">📍 {ngo.city}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED OPPORTUNITIES */}
      <section className="opp-section">
        <h2 className="section-title center">Featured Opportunities</h2>
        <div className="opp-grid">
          {opportunities.map((opp) => (
            <div key={opp.id} className="opp-home-card">
              <div className="opp-home-visual">
                <span className="opp-home-icon">{opp.icon}</span>
              </div>
              <div className="opp-home-body">
                <span className="opp-home-category">{opp.category}</span>
                <h4>{opp.title}</h4>
                <p>{opp.description}</p>
                <div className="opp-home-meta">
                  <span>📍 {opp.location}</span>
                  <span>⏱ {opp.type}</span>
                </div>
                <Link to="/opportunities" className="opp-home-link">Apply Now →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to Make a Difference?</h2>
        <p>
          Whether you're an NGO seeking passionate volunteers or an individual
          wanting to give back, NGO Connect is your bridge to meaningful impact.
        </p>
        <div className="cta-buttons">
          <Link to="/register" className="btn-white">Get Started</Link>
          <Link to="/ngos" className="btn-transparent">Explore NGOs</Link>
        </div>
      </section>
    </div>
  );
}

export default Home;