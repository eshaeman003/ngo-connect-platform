import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./About.css";

/* ===== Icons ===== */
const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
);
const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const TargetIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);
const GlobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);
const AwardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
);
const TrendingUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
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

/* ===== Scroll Reveal ===== */
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

const values = [
  { icon: <HeartIcon />, title: "Empathy First", desc: "Every decision we make starts with understanding the real needs of communities and volunteers." },
  { icon: <ShieldIcon />, title: "Trust & Safety", desc: "Verified NGOs, transparent processes, and a safe environment for every volunteer." },
  { icon: <UsersIcon />, title: "Community Driven", desc: "Built by the community, for the community. We grow when our NGOs and volunteers grow." },
  { icon: <ZapIcon />, title: "Impact Focused", desc: "We measure success not by numbers, but by the real, lasting change we create together." },
];

const team = [
  { name: "Ayesha Khan", role: "Founder & CEO", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face" },
  { name: "Bilal Ahmed", role: "Head of Operations", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" },
  { name: "Sara Malik", role: "Community Lead", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face" },
  { name: "Omar Farooq", role: "Tech Lead", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face" },
];

function About() {
  const heroRef = useReveal();
  const storyRef = useReveal();
  const statsRef = useReveal();
  const valuesRef = useReveal();
  const teamRef = useReveal();
  const ctaRef = useReveal();

  const [volCount, volRef] = useCountUp(500);
  const [ngoCount, ngoRef] = useCountUp(50);
  const [hrCount, hrRef] = useCountUp(10000);
  const [cityCount, cityRef] = useCountUp(15);

  return (
    <div className="about-page">
      {/* HERO */}
      <section className="about-hero" ref={heroRef}>
        <div className="about-hero-content">
          <span className="about-label">ABOUT US</span>
          <h1>Bridging the Gap Between <span>Good Intentions</span> and <span>Real Impact</span></h1>
          <p>NGO Connect is Pakistan's first digital bridge connecting passionate volunteers with verified NGOs. We believe everyone has something to give — and every community deserves support.</p>
        </div>
        <div className="about-hero-visual">
          <img src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=450&fit=crop" alt="Volunteers" />
          <div className="about-float-card">
            <TargetIcon />
            <div>
              <strong>Our Mission</strong>
              <span>Empower communities</span>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="about-story" ref={storyRef}>
        <div className="about-story-img">
          <img src="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&h=500&fit=crop" alt="Community work" />
        </div>
        <div className="about-story-text">
          <h2>Why We Started</h2>
          <p>In 2023, we saw thousands of young Pakistanis eager to volunteer but with no easy way to find trusted NGOs. At the same time, incredible organizations struggled to find reliable help.</p>
          <p>NGO Connect was born to solve both problems — a single platform where volunteers discover meaningful opportunities and NGOs find passionate supporters.</p>
          <div className="about-story-stats">
            <div><strong>2023</strong><span>Founded</span></div>
            <div><strong>8</strong><span>Cities Active</span></div>
            <div><strong>100%</strong><span>Free Platform</span></div>
          </div>
        </div>
      </section>

      {/* IMPACT STATS */}
      <section className="about-impact" ref={statsRef}>
        <div className="about-impact-header">
          <span className="about-label">OUR IMPACT</span>
          <h2>Numbers That Tell a Story</h2>
        </div>
        <div className="about-impact-grid">
          <div className="impact-card" ref={volRef}>
            <div className="impact-icon green"><UsersIcon /></div>
            <h3>{volCount.toLocaleString()}+</h3>
            <p>Active Volunteers</p>
          </div>
          <div className="impact-card" ref={ngoRef}>
            <div className="impact-icon dark"><ShieldIcon /></div>
            <h3>{ngoCount}+</h3>
            <p>Partner NGOs</p>
          </div>
          <div className="impact-card" ref={hrRef}>
            <div className="impact-icon gold"><AwardIcon /></div>
            <h3>{hrCount.toLocaleString()}+</h3>
            <p>Hours Served</p>
          </div>
          <div className="impact-card" ref={cityRef}>
            <div className="impact-icon teal"><GlobeIcon /></div>
            <h3>{cityCount}+</h3>
            <p>Cities Covered</p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="about-values" ref={valuesRef}>
        <div className="about-values-header">
          <span className="about-label">OUR VALUES</span>
          <h2>What Drives Us Every Day</h2>
        </div>
        <div className="about-values-grid">
          {values.map((v, i) => (
            <div className="value-card" key={i}>
              <div className="value-icon">{v.icon}</div>
              <h4>{v.title}</h4>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="about-team" ref={teamRef}>
        <div className="about-team-header">
          <span className="about-label">THE TEAM</span>
          <h2>Meet the People Behind NGO Connect</h2>
        </div>
        <div className="about-team-grid">
          {team.map((t, i) => (
            <div className="team-card" key={i}>
              <div className="team-img-wrap">
                <img src={t.img} alt={t.name} />
              </div>
              <h4>{t.name}</h4>
              <p>{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta" ref={ctaRef}>
        <div className="about-cta-pattern" />
        <div className="about-cta-content">
          <h2>Be Part of the Change</h2>
          <p>Whether you have an hour or a lifetime, your contribution matters. Join thousands of Pakistanis making a real difference.</p>
          <div className="about-cta-buttons">
            <Link to="/register" className="btn-white">Join as Volunteer</Link>
            <Link to="/ngo/register" className="btn-transparent">Register Your NGO</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;