import { useState, useEffect } from "react";
import "./Testimonials.css";

const testimonials = [
  {
    id: 1,
    name: "Ayesha K.",
    role: "Volunteer",
    initials: "AK",
    color: "#1a5f2a",
    bgColor: "#e8f5e9",
    rating: 5,
    text: "NGO Connect made it so easy to find teaching opportunities near me. Within days I was volunteering at a local school and have already completed 40+ hours. The best platform for anyone who wants to give back!",
  },
  {
    id: 2,
    name: "Bilal A.",
    role: "Student Volunteer",
    initials: "BA",
    color: "#1565c0",
    bgColor: "#e3f2fd",
    rating: 5,
    text: "As a university student, I wanted to volunteer but never knew where to start. NGO Connect matched me with the perfect opportunity in just one week. The application process is smooth and transparent.",
  },
  {
    id: 3,
    name: "Sara M.",
    role: "First-time Volunteer",
    initials: "SM",
    color: "#c2185b",
    bgColor: "#fce4ec",
    rating: 5,
    text: "I was nervous about volunteering for the first time, but this platform made everything so simple. From browsing opportunities to getting approved — every step felt seamless. Highly recommend!",
  },
  {
    id: 4,
    name: "Hassan R.",
    role: "Youth Volunteer",
    initials: "HR",
    color: "#ef6c00",
    bgColor: "#fff3e0",
    rating: 5,
    text: "Finally a platform built for Pakistani youth who want to create change. I found a blood donation camp to volunteer at within my city. The real-time updates and clean interface make it a joy to use.",
  },
  {
    id: 5,
    name: "Fatima Z.",
    role: "Aspiring Volunteer",
    initials: "FZ",
    color: "#6a1b9a",
    bgColor: "#f3e5f5",
    rating: 5,
    text: "I love how NGO Connect brings all verified opportunities in one place. No more scrolling through random groups — everything is organized by cause and location. Found my perfect match in days!",
  },
  {
    id: 6,
    name: "Omar S.",
    role: "Regular Volunteer",
    initials: "OS",
    color: "#00695c",
    bgColor: "#e0f2f1",
    rating: 5,
    text: "This platform bridges the gap between people who want to help and organizations that need help. I have volunteered through NGO Connect multiple times now and every experience has been meaningful.",
  },
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const visibleCount = isMobile ? 1 : 3;
  const visibleTestimonials = testimonials.slice(activeIndex, activeIndex + visibleCount);

  const displayItems = visibleTestimonials.length < visibleCount 
    ? [...visibleTestimonials, ...testimonials.slice(0, visibleCount - visibleTestimonials.length)]
    : visibleTestimonials;

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <div className="testimonials-header">
          <span className="testimonials-label">Testimonials</span>
          <h2 className="testimonials-title">What Our Community Says</h2>
          <p className="testimonials-subtitle">
            Hear from volunteers who found their calling through our platform
          </p>
        </div>

        <div className="testimonials-grid">
          {displayItems.map((t, i) => (
            <div key={`${t.id}-${i}`} className="testimonial-card">
              <div className="testimonial-quote-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
              </div>

              <p className="testimonial-text">{t.text}</p>

              <div className="testimonial-stars">
                {[...Array(t.rating)].map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#d4a017" stroke="#d4a017" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>

              <div className="testimonial-author">
                <div 
                  className="testimonial-avatar"
                  style={{ background: t.bgColor, color: t.color }}
                >
                  {t.initials}
                </div>
                <div className="testimonial-author-info">
                  <span className="testimonial-name">{t.name}</span>
                  <span className="testimonial-role">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="testimonials-nav">
          <button className="testimonials-nav-btn" onClick={prevSlide} aria-label="Previous">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>

          <div className="testimonials-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`testimonials-dot ${i === activeIndex ? "active" : ""}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button className="testimonials-nav-btn" onClick={nextSlide} aria-label="Next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}