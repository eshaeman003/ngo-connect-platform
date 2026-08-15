import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

/* ===== SVG Icons ===== */
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);
const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
);
const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);
const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#B8792A" stroke="#B8792A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);
const QuoteIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#2d6a4f" opacity="0.12"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
);
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
);
const RocketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
);
const BuildingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M9 21v-6h6v6"/></svg>
);
const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
);

/* ===== useCountUp Hook ===== */
function useCountUp(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return [count, ref];
}

/* ===== Scroll Reveal Hook ===== */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("reveal-hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove("reveal-hidden");
          el.classList.add("reveal-visible");
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ===== Skeleton Components ===== */
const OppSkeleton = () => (
  <div className="opp-home-card skeleton">
    <div className="skeleton-visual" />
    <div className="skeleton-body">
      <div className="skeleton-line short" />
      <div className="skeleton-line" />
      <div className="skeleton-line mid" />
    </div>
  </div>
);

const NgoSkeleton = () => (
  <div className="ngo-home-card skeleton">
    <div className="skeleton-avatar" />
    <div className="skeleton-line" />
    <div className="skeleton-line short" />
  </div>
);

/* ===== Data ===== */
const testimonials = [
  {
    id: 1,
    name: "Esha E.",
    role: "Volunteer",
    initials: "EE",
    bgColor: "#e8f5e9",
    color: "#1a5f2a",
    text: "NGO Connect made it so easy to find teaching opportunities near me. Within days I was volunteering at a local school and have already completed 40+ hours. The best platform for anyone who wants to give back!",
  },
  {
    id: 2,
    name: "Ahmed S.",
    role: "Student Volunteer",
    initials: "AS",
    bgColor: "#e3f2fd",
    color: "#1565c0",
    text: "As a university student, I wanted to volunteer but never knew where to start. NGO Connect matched me with the perfect opportunity in just one week. The application process is smooth and transparent.",
  },
  {
    id: 3,
    name: "Abdul H.",
    role: "First-time Volunteer",
    initials: "AH",
    bgColor: "#fce4ec",
    color: "#c2185b",
    text: "I was nervous about volunteering for the first time, but this platform made everything so simple. From browsing opportunities to getting approved — every step felt seamless. Highly recommend!",
  },
];

const staticNgos = [
  { id: 1, name: "Community Welfare", category: "General", city: "Islamabad", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop" },
  { id: 2, name: "Edhi Foundation", category: "Healthcare", city: "Karachi", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop" },
  { id: 3, name: "Saylani Welfare", category: "Education", city: "Karachi", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop" },
  { id: 4, name: "Akhuwat Foundation", category: "Microfinance", city: "Lahore", image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=300&fit=crop" },
];

const staticOpps = [
  {
    id: 1,
    title: "Teach Urdu to Children",
    description: "Help students with speech disorders learn Urdu through interactive sessions and creative storytelling.",
    category: "Education",
    location: "Islamabad",
    type: "Full-time",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Community Food Drive",
    description: "Distribute meals to 200+ locals in underserved areas. Every hand makes a difference.",
    category: "Environment",
    location: "Rawalpindi",
    type: "Weekend",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&h=400&fit=crop",
  },
  {
    id: 3,
    title: "Medical Camp Support",
    description: "Assist doctors and nurses in free medical camps across rural communities.",
    category: "Health",
    location: "Lahore",
    type: "Part-time",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop",
  },
];

function Home() {
  const [loadingNgos, setLoadingNgos] = useState(true);
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [ngos, setNgos] = useState([]);
  const [opportunities, setOpportunities] = useState([]);

  const heroRef = useReveal();
  const statsRef = useReveal();
  const howRef = useReveal();
  const ngosRef = useReveal();
  const oppRef = useReveal();
  const testRef = useReveal();
  const ctaRef = useReveal();

  const [volCount, volRef] = useCountUp(500);
  const [ngoCount, ngoRef] = useCountUp(50);
  const [hrCount, hrRef] = useCountUp(10000);

  useEffect(() => {
    const t1 = setTimeout(() => { setNgos(staticNgos); setLoadingNgos(false); }, 800);
    const t2 = setTimeout(() => { setOpportunities(staticOpps); setLoadingOpps(false); }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="home-page">
      {/* ===== HERO ===== */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-left">
          <div className="hero-badge-top">
            <span className="hero-badge-dot" /> Trusted by 50+ NGOs across Pakistan
          </div>
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
            <Link to="/opportunities" className="btn-primary">
              Explore Opportunities <ArrowRightIcon />
            </Link>
            <Link to="/register" className="btn-outline">Join as Volunteer</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card">
            <img
              src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=500&h=400&fit=crop"
              alt="Volunteers helping community"
              className="hero-img"
            />
            <div className="hero-floating-card top-right">
              <HeartIcon />
              <span>Make an Impact</span>
            </div>
            <div className="hero-floating-card bottom-left">
              <GlobeIcon />
              <span>Global Reach</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="stats-bar" ref={statsRef}>
        <div className="stats-bar-inner">
          <div className="stat-bar-item" ref={volRef}>
            <div className="stat-bar-number">{volCount.toLocaleString()}+</div>
            <div className="stat-bar-label">Active Volunteers</div>
          </div>
          <div className="stat-bar-divider" />
          <div className="stat-bar-item" ref={ngoRef}>
            <div className="stat-bar-number">{ngoCount}+</div>
            <div className="stat-bar-label">Partner NGOs</div>
          </div>
          <div className="stat-bar-divider" />
          <div className="stat-bar-item" ref={hrRef}>
            <div className="stat-bar-number">{hrCount.toLocaleString()}+</div>
            <div className="stat-bar-label">Hours Served</div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="how-section" ref={howRef}>
        <span className="section-label">HOW IT WORKS</span>
        <h2 className="section-title">Three Steps to Make a Difference</h2>
        <div className="steps-grid">
          {[
            { icon: <UserIcon />, title: "Create Your Profile", desc: "Sign up as a volunteer or NGO. Tell us about your skills, passions, and availability.", num: "01" },
            { icon: <SearchIcon />, title: "Discover Opportunities", desc: "Browse through hundreds of volunteering opportunities that match your interests.", num: "02" },
            { icon: <RocketIcon />, title: "Start Volunteering", desc: "Apply, get approved, and begin your journey of creating positive change.", num: "03" },
          ].map((step, i) => (
            <div className="step-card" key={i}>
              <div className="step-icon-wrap">{step.icon}</div>
              <span className="step-number">{step.num}</span>
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== NGOs ===== */}
      <section className="ngos-section" ref={ngosRef}>
        <div className="ngos-section-header">
          <span className="section-label">OUR PARTNERS</span>
          <h2 className="section-title">NGOs Making Real Impact</h2>
          <p className="section-subtitle">Trusted organizations working tirelessly for a better Pakistan</p>
        </div>
        <div className="ngos-grid">
          {loadingNgos ? (
            Array.from({ length: 4 }).map((_, i) => <NgoSkeleton key={i} />)
          ) : ngos.length === 0 ? (
            <div className="empty-state">No NGOs found.</div>
          ) : (
            ngos.map((ngo) => (
              <Link to={`/ngos/${ngo.id}`} key={ngo.id} className="ngo-home-card">
                <div className="ngo-home-img-wrap">
                  <img src={ngo.image} alt={ngo.name} loading="lazy" />
                  <div className="ngo-home-img-overlay" />
                </div>
                <div className="ngo-home-body">
                  <span className="ngo-home-category">{ngo.category}</span>
                  <h4>{ngo.name}</h4>
                  <div className="ngo-home-location"><MapPinIcon /> {ngo.city}</div>
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="section-cta">
          <Link to="/ngos" className="section-cta-link">
            View All NGOs <ChevronRightIcon />
          </Link>
        </div>
      </section>

      {/* ===== FEATURED OPPORTUNITIES ===== */}
      <section className="opp-section" ref={oppRef}>
        <div className="opp-section-header">
          <span className="section-label">FEATURED</span>
          <h2 className="section-title">Opportunities Waiting for You</h2>
          <p className="section-subtitle">Handpicked volunteer roles that need passionate people like you</p>
        </div>
        <div className="opp-grid">
          {loadingOpps ? (
            Array.from({ length: 3 }).map((_, i) => <OppSkeleton key={i} />)
          ) : opportunities.length === 0 ? (
            <div className="empty-state">No opportunities available right now.</div>
          ) : (
            opportunities.map((opp) => (
              <div key={opp.id} className="opp-home-card">
                <div className="opp-home-visual">
                  <img src={opp.image} alt={opp.title} loading="lazy" />
                  <div className="opp-home-img-overlay" />
                  <span className="opp-home-type">{opp.type}</span>
                </div>
                <div className="opp-home-body">
                  <span className="opp-home-category">{opp.category}</span>
                  <h4>{opp.title}</h4>
                  <p>{opp.description}</p>
                  <div className="opp-home-meta">
                    <span><MapPinIcon /> {opp.location}</span>
                    <span><ClockIcon /> {opp.type}</span>
                  </div>
                  <Link to="/opportunities" className="opp-home-link">
                    Apply Now <ArrowRightIcon />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="section-cta">
          <Link to="/opportunities" className="section-cta-link">
            Browse All Opportunities <ChevronRightIcon />
          </Link>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="testimonials-section" ref={testRef}>
        <div className="testimonials-header">
          <span className="section-label">TESTIMONIALS</span>
          <h2 className="section-title">What Our Community Says</h2>
          <p className="section-subtitle">Real stories from real volunteers making a difference</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <div key={t.id} className="testimonial-card">
              <QuoteIcon />
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div 
                  className="testimonial-avatar"
                  style={{ background: t.bgColor, color: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
              <div className="testimonial-stars">
                <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section" ref={ctaRef}>
        <div className="cta-pattern" />
        <div className="cta-content">
          <h2>Ready to Make a Difference?</h2>
          <p>
            Whether you're an NGO seeking passionate volunteers or an individual
            wanting to give back, NGO Connect is your bridge to meaningful impact.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="btn-white">Get Started</Link>
            <Link to="/ngos" className="btn-transparent">Explore NGOs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;