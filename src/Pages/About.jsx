import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./About.css";

/* ===== SVG Icons ===== */
const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
);
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);
const AwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
);
const ChevronDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const ChevronUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
);
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
);
const LinkedinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
);
const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
);
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const HandshakeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/><path d="M12 5.36 8.87 8.5"/><path d="m15.13 8.5-3.13-3.14"/></svg>
);
const QuoteIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#2d6a4f" opacity="0.2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
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
  { icon: <HeartIcon />, title: "Empathy First", desc: "Every decision starts with understanding what communities truly need, not what we assume they need." },
  { icon: <ShieldIcon />, title: "Trust & Transparency", desc: "Verified NGOs, clear processes, and honest communication — because social work deserves accountability." },
  { icon: <UsersIcon />, title: "Community Led", desc: "Built alongside volunteers and NGOs, not for them. Their feedback shapes every feature we ship." },
  { icon: <ZapIcon />, title: "Impact Obsessed", desc: "We don't count clicks. We count lives changed, meals served, and classrooms filled." },
];

const journeyMilestones = [
  {
    date: "Feb 2026",
    title: "Volunteered at HHRD Chakwal",
    desc: "Joined Helping Hand for Relief & Development (HHRD) OSP Region Office for a 12-day Volunteer Internship Service program, working directly with orphan support operations.",
    icon: "🤝",
  },
  {
    date: "Feb 2026",
    title: "Orphan Support Data Management",
    desc: "Entered detailed records for orphan students, managed B-forms, fee slips, and ID documentation in the OSP portal — ensuring accurate sponsor matching.",
    icon: "📋",
  },
  {
    date: "Feb 2026",
    title: "Creative Donor Engagement",
    desc: "Designed artistic artwork on 200+ donor messages to strengthen the emotional connection between sponsors and children, making every donation feel personal.",
    icon: "🎨",
  },
  {
    date: "Feb 2026",
    title: "Field Visits & Flood Relief",
    desc: "Conducted home visits to orphan families and flood-affected households in Chakwal, witnessing ground realities that later inspired NGO Connect's mission.",
    icon: "🏠",
  },
  {
    date: "Aug 2026",
    title: "Founded NGO Connect",
    desc: "Built Pakistan's first digital bridge connecting volunteers and NGOs — turning raw field experience into scalable technology for social good.",
    icon: "🚀",
  },
];

function About() {
  const [showDetails, setShowDetails] = useState(false);

  const heroRef = useReveal();
  const storyRef = useReveal();
  const statsRef = useReveal();
  const valuesRef = useReveal();
  const founderRef = useReveal();
  const ctaRef = useReveal();

  const [volCount, volRef] = useCountUp(500);
  const [ngoCount, ngoRef] = useCountUp(50);
  const [hrCount, hrRef] = useCountUp(10000);
  const [cityCount, cityRef] = useCountUp(15);

  return (
    <div className="about-page">
      {/* ===== HERO: Full-width background with overlay ===== */}
      <section className="about-hero-v2" ref={heroRef}>
        <div className="about-hero-bg">
          <img src="https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1400&h=600&fit=cropp" alt="Hands together" />
          <div className="about-hero-overlay" />
        </div>
        <div className="about-hero-content-v2">
          <span className="about-label light">ABOUT US</span>
          <h1>Bridging the Gap Between <em>Good Intentions</em> and <em>Real Impact</em></h1>
          <p>NGO Connect is Pakistan's first dedicated platform connecting passionate volunteers with verified NGOs. We believe everyone has something to give — and every community deserves reliable support.</p>
        </div>
      </section>

      {/* ===== STORY: Editorial layout with quote ===== */}
      <section className="about-story-v2" ref={storyRef}>
        <div className="story-quote-block">
          <QuoteIcon />
          <blockquote>
            In 2026, I noticed something heartbreaking: thousands of young Pakistanis wanted to volunteer for flood relief and education drives, but had no trusted way to find legitimate NGOs.
          </blockquote>
        </div>
        <div className="story-body">
          <p>
            Meanwhile, incredible organizations like Edhi and Saylani were drowning in manual coordination — struggling to find reliable volunteers. Pakistan had no centralized digital bridge between these two groups. Volunteers relied on WhatsApp forwards. NGOs used paper registers.
          </p>
          <p className="story-highlight">
            That gap became NGO Connect — a platform where one click connects passion with purpose.
          </p>
        </div>
        <div className="story-image-full">
          <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&h=500&fit=crop" alt="Community support" />
        </div>
        <div className="story-meta-bar">
          <div><strong>2026</strong><span>Founded</span></div>
          <div><strong>8+</strong><span>Cities Active</span></div>
          <div><strong>100%</strong><span>Free Forever</span></div>
        </div>
      </section>

      {/* ===== IMPACT STATS: Horizontal bar ===== */}
      <section className="about-impact-v2" ref={statsRef}>
        <div className="impact-bar">
          <div className="impact-bar-item" ref={volRef}>
            <h3>{volCount.toLocaleString()}+</h3>
            <p>Active Volunteers</p>
          </div>
          <div className="impact-divider" />
          <div className="impact-bar-item" ref={ngoRef}>
            <h3>{ngoCount}+</h3>
            <p>Partner NGOs</p>
          </div>
          <div className="impact-divider" />
          <div className="impact-bar-item" ref={hrRef}>
            <h3>{hrCount.toLocaleString()}+</h3>
            <p>Hours Served</p>
          </div>
          <div className="impact-divider" />
          <div className="impact-bar-item" ref={cityRef}>
            <h3>{cityCount}+</h3>
            <p>Cities Covered</p>
          </div>
        </div>
      </section>

      {/* ===== VALUES ===== */}
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

      {/* ===== FOUNDER COMPACT CARD ===== */}
      <section className="about-founder-section" ref={founderRef}>
        <div className="about-founder-header">
          <span className="about-label">THE FOUNDER</span>
          <h2>Meet the Mind Behind NGO Connect</h2>
        </div>

        <div className="founder-compact-card">
          <div className="founder-compact-left">
            <div className="founder-compact-avatar">
              <img src="/esha%20eman.jpg" alt="Esha Eman" />
            </div>
          </div>
          <div className="founder-compact-right">
            <h3>Esha Eman</h3>
            <p className="founder-compact-role">Founder & CEO</p>
            <p className="founder-compact-bio">
              Computer Science student, volunteer at HHRD Chakwal, and builder of NGO Connect. 
              Passionate about using technology to solve real social problems in Pakistan.
            </p>
            <button 
              className="learn-more-btn"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <>Show Less <ChevronUpIcon /></>
              ) : (
                <>Learn More About Me <ChevronDownIcon /></>
              )}
            </button>
          </div>
        </div>

        {/* ===== EXPANDED DETAILS ===== */}
        <div className={`founder-details ${showDetails ? 'open' : ''}`}>

          {/* Who I Am */}
          <div className="detail-block">
            <h4 className="detail-title">Who I Am</h4>
            <div className="detail-content">
              <p>
                I'm Esha Eman, a Computer Science student with a deep-rooted passion for social impact. 
                My journey didn't start with code — it started on the ground, in the field, working directly 
                with communities that needed help.
              </p>
              <p>
                During my 12-day volunteer internship with <strong>HHRD (Helping Hand for Relief & Development)</strong> 
                at their OSP Region Office in Chakwal, I saw the operational chaos NGOs face every day: 
                manual data entry, disconnected volunteers, and no reliable way to match willing hands with 
                organizations that desperately needed them.
              </p>
              <p>
                That experience became the foundation of NGO Connect. I realized that technology could bridge 
                this gap — not by replacing human connection, but by making it easier to form. This platform 
                is my attempt to ensure that no willing volunteer ever struggles to find a cause, and no 
                credible NGO ever lacks the support it needs.
              </p>
            </div>
          </div>

          {/* Journey Timeline */}
          <div className="detail-block">
            <h4 className="detail-title">My Volunteering Journey</h4>
            <div className="journey-timeline">
              {journeyMilestones.map((m, i) => (
                <div className="journey-item" key={i}>
                  <div className="journey-dot">{m.icon}</div>
                  <div className="journey-content">
                    <div className="journey-meta">
                      <span><CalendarIcon /> {m.date}</span>
                      <span><MapPinIcon /> Chakwal, Pakistan</span>
                    </div>
                    <h5>{m.title}</h5>
                    <p>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HHRD Report */}
          <div className="detail-block">
            <div className="hhr-report-card">
              <div className="hhr-report-icon">📄</div>
              <div className="hhr-report-info">
                <h5>HHRD Volunteer Internship Report</h5>
                <p>Complete documentation of my 12-day VIS program at HHRD OSP Region Office, Chakwal — including data management, donor artwork, field visits, and healthcare program exposure.</p>
                <span className="hhr-badge">Feb 11 – Feb 25, 2026</span>
              </div>
            </div>
          </div>

          {/* Contact Me */}
          <div className="detail-block">
            <h4 className="detail-title">Let's Connect</h4>
            <p className="connect-subtitle">
              Whether you want to collaborate on a project, need development services, 
              or have ideas about improving NGO Connect — I'm always open to meaningful conversations.
            </p>
            <div className="connect-grid">
              <a href="mailto:eshaeman003@gmail.com" className="connect-card email">
                <div className="connect-icon"><MailIcon /></div>
                <div className="connect-info">
                  <span className="connect-label">Email</span>
                  <span className="connect-value">eshaeman003@gmail.com</span>
                </div>
              </a>

              <a href="https://www.linkedin.com/in/esha-eman-2133b535a/" target="_blank" rel="noopener noreferrer" className="connect-card linkedin">
                <div className="connect-icon"><LinkedinIcon /></div>
                <div className="connect-info">
                  <span className="connect-label">LinkedIn</span>
                  <span className="connect-value">Esha Eman</span>
                </div>
              </a>

              <a href="https://github.com/eshaeman003" target="_blank" rel="noopener noreferrer" className="connect-card github">
                <div className="connect-icon"><GithubIcon /></div>
                <div className="connect-info">
                  <span className="connect-label">GitHub</span>
                  <span className="connect-value">@eshaeman003</span>
                </div>
              </a>
            </div>

            <div className="collab-box">
              <div className="collab-icon"><HandshakeIcon /></div>
              <div className="collab-text">
                <h5>Open for Collaboration</h5>
                <p>
                  Looking for partners to expand NGO Connect, volunteer opportunities with new NGOs, 
                  or freelance development work. If you have a cause that needs tech, let's build it together.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ===== CTA ===== */}
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