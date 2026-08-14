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
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);

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
  { icon: <HeartIcon />, title: "Empathy First", desc: "Every decision starts with understanding what communities truly need, not what we assume they need." },
  { icon: <ShieldIcon />, title: "Trust & Transparency", desc: "Verified NGOs, clear processes, and honest communication — because social work deserves accountability." },
  { icon: <UsersIcon />, title: "Community Led", desc: "Built alongside volunteers and NGOs, not for them. Their feedback shapes every feature we ship." },
  { icon: <ZapIcon />, title: "Impact Obsessed", desc: "We don't count clicks. We count lives changed, meals served, and classrooms filled." },
];

const journeyMilestones = [
  {
    date: "Feb 2026",
    title: "Volunteered at HHRD Chakwal",
    desc: "Joined Helping Hand for Relief & Development (HHRD) OSP Region Office for a 12-day Volunteer Internship Service program.",
    icon: "🤝",
  },
  {
    date: "Feb 2026",
    title: "Orphan Support Data Management",
    desc: "Entered detailed records for orphan students, managed B-forms, fee slips, and ID documentation in the OSP portal.",
    icon: "📋",
  },
  {
    date: "Feb 2026",
    title: "Creative Donor Engagement",
    desc: "Designed artistic artwork on 200+ donor messages to strengthen the emotional connection between sponsors and children.",
    icon: "🎨",
  },
  {
    date: "Feb 2026",
    title: "Field Visits & Flood Relief",
    desc: "Conducted home visits to orphan families and flood-affected households in Chakwal, witnessing ground realities firsthand.",
    icon: "🏠",
  },
  {
    date: "Aug 2026",
    title: "Founded NGO Connect",
    desc: "Built Pakistan's first digital bridge connecting volunteers and NGOs — turning field experience into scalable technology.",
    icon: "🚀",
  },
];

function About() {
  const heroRef = useReveal();
  const storyRef = useReveal();
  const statsRef = useReveal();
  const valuesRef = useReveal();
  const journeyRef = useReveal();
  const founderRef = useReveal();
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
          <p>NGO Connect is Pakistan's first dedicated platform connecting passionate volunteers with verified NGOs. We believe everyone has something to give — and every community deserves reliable support.</p>
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
          <h2>Why We Built This</h2>
          <p>
            In 2026, I noticed something heartbreaking: thousands of young Pakistanis wanted to volunteer for flood relief and education drives, but had no trusted way to find legitimate NGOs. Meanwhile, incredible organizations like Edhi and Saylani were drowning in manual coordination — struggling to find reliable volunteers.
          </p>
          <p>
            Pakistan had no centralized digital bridge between these two groups. Volunteers relied on WhatsApp forwards. NGOs used paper registers. That gap became NGO Connect — a platform where one click connects passion with purpose.
          </p>
          <div className="about-story-stats">
            <div><strong>2026</strong><span>Founded</span></div>
            <div><strong>8+</strong><span>Cities Active</span></div>
            <div><strong>100%</strong><span>Free Forever</span></div>
          </div>
        </div>
      </section>

      {/* IMPACT STATS */}
      <section className="about-impact" ref={statsRef}>
        <div className="about-impact-header">
          <span className="about-label">OUR IMPACT</span>
          <h2>Numbers That Matter</h2>
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
          <h2>What We Stand For</h2>
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

      {/* VOLUNTEERING JOURNEY — NEW SECTION */}
      <section className="about-journey" ref={journeyRef}>
        <div className="about-journey-header">
          <span className="about-label">MY JOURNEY</span>
          <h2>From the Field to the Screen</h2>
          <p className="journey-subtitle">
            Before building NGO Connect, I volunteered on the ground with HHRD Chakwal. 
            That experience shaped every feature of this platform.
          </p>
        </div>

        <div className="journey-timeline">
          {journeyMilestones.map((m, i) => (
            <div className="journey-item" key={i}>
              <div className="journey-icon">{m.icon}</div>
              <div className="journey-content">
                <div className="journey-meta">
                  <span className="journey-date"><CalendarIcon /> {m.date}</span>
                  <span className="journey-location"><MapPinIcon /> Chakwal, Pakistan</span>
                </div>
                <h4>{m.title}</h4>
                <p>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="journey-report">
          <div className="journey-report-card">
            <div className="journey-report-icon">📄</div>
            <div className="journey-report-text">
              <h4>HHRD Volunteer Internship Report</h4>
              <p>Complete documentation of my 12-day VIS program at HHRD OSP Region Office, Chakwal — including data management, donor artwork, field visits, and healthcare program exposure.</p>
              <span className="journey-report-badge">Feb 11 – Feb 25, 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="about-founder" ref={founderRef}>
        <div className="about-founder-header">
          <span className="about-label">THE FOUNDER</span>
          <h2>The Story Behind the Platform</h2>
        </div>
        <div className="about-founder-card">
          <div className="founder-avatar">
            <img src="/esha%20eman.jpg" alt="Esha Eman" />
          </div>
          <h3>Esha Eman</h3>
          <p className="founder-role">Founder & CEO</p>
          <p className="founder-bio">
            I built NGO Connect after volunteering with HHRD Chakwal and watching passionate students struggle to find verified volunteering opportunities during the 2022 floods. What started as an internship project became a mission: to ensure no willing hand ever goes unmatched in Pakistan.
          </p>
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