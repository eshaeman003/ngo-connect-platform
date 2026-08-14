import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import "./NGODetails.css";

const ngoImages = [
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&h=500&fit=crop",
];

function getNgoImage(name) {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ngoImages[hash % ngoImages.length];
}

export default function NGODetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNGO();
  }, [id]);

  async function fetchNGO() {
    setLoading(true);
    const { data, error } = await supabase.from("ngos").select("*").eq("id", id).single();
    if (!error && data) {
      setNgo(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="ngo-detail-page">
        <div className="ngo-detail-skeleton">
          <div className="detail-skeleton-hero" />
          <div className="detail-skeleton-content">
            <div className="detail-skeleton-title" />
            <div className="detail-skeleton-line" />
            <div className="detail-skeleton-line" />
            <div className="detail-skeleton-line short" />
          </div>
        </div>
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="ngo-detail-page">
        <div className="ngo-not-found">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
          </svg>
          <h2>NGO Not Found</h2>
          <p>The organization you're looking for doesn't exist or has been removed.</p>
          <button className="back-btn" onClick={() => navigate("/ngos")}>
            Back to NGOs
          </button>
        </div>
      </div>
    );
  }

  const coverImage = getNgoImage(ngo.name || "NGO");

  return (
    <div className="ngo-detail-page">
      <div className="ngo-detail-hero" style={{ backgroundImage: `url(${coverImage})` }}>
        <div className="ngo-detail-hero-overlay" />
        <div className="ngo-detail-hero-content">
          <button className="ngo-back-link" onClick={() => navigate("/ngos")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
            </svg>
            Back to NGOs
          </button>
          <div className="ngo-hero-tags">
            <span className="ngo-hero-category">{ngo.category || "General"}</span>
            {ngo.verified && (
              <span className="ngo-hero-verified">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Verified Organization
              </span>
            )}
          </div>
          <h1 className="ngo-detail-name">{ngo.name}</h1>
          <div className="ngo-detail-location">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {ngo.location || "Pakistan"}
          </div>
        </div>
      </div>

      <div className="ngo-detail-container">
        <div className="ngo-detail-main">
          <section className="ngo-section">
            <h2 className="ngo-section-title">About</h2>
            <p className="ngo-section-text">
              {ngo.description || "This organization is dedicated to making a meaningful impact in the community through dedicated service and outreach programs."}
            </p>
          </section>

          {ngo.mission && (
            <section className="ngo-section">
              <h2 className="ngo-section-title">Mission</h2>
              <p className="ngo-section-text">{ngo.mission}</p>
            </section>
          )}

          {ngo.vision && (
            <section className="ngo-section">
              <h2 className="ngo-section-title">Vision</h2>
              <p className="ngo-section-text">{ngo.vision}</p>
            </section>
          )}

          {ngo.services && (
            <section className="ngo-section">
              <h2 className="ngo-section-title">Services</h2>
              <div className="ngo-services-grid">
                {ngo.services.split(",").map((service, i) => (
                  <span key={i} className="ngo-service-tag">{service.trim()}</span>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="ngo-detail-sidebar">
          <div className="ngo-contact-card">
            <h3 className="contact-card-title">Contact Information</h3>

            {ngo.email && (
              <a href={`mailto:${ngo.email}`} className="contact-item">
                <div className="contact-icon-wrap email">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <div className="contact-info">
                  <span className="contact-label">Email</span>
                  <span className="contact-value">{ngo.email}</span>
                </div>
              </a>
            )}

            {ngo.phone && (
              <a href={`tel:${ngo.phone}`} className="contact-item">
                <div className="contact-icon-wrap phone">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div className="contact-info">
                  <span className="contact-label">Phone</span>
                  <span className="contact-value">{ngo.phone}</span>
                </div>
              </a>
            )}

            {ngo.website && (
              <a href={ngo.website.startsWith("http") ? ngo.website : `https://${ngo.website}`} target="_blank" rel="noopener noreferrer" className="contact-item">
                <div className="contact-icon-wrap web">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <div className="contact-info">
                  <span className="contact-label">Website</span>
                  <span className="contact-value">{ngo.website.replace(/^https?:\/\//, "")}</span>
                </div>
              </a>
            )}

            {ngo.address && (
              <div className="contact-item no-link">
                <div className="contact-icon-wrap address">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div className="contact-info">
                  <span className="contact-label">Address</span>
                  <span className="contact-value">{ngo.address}</span>
                </div>
              </div>
            )}

            <div className="contact-divider" />

            <h3 className="contact-card-title">Connect</h3>
            <p className="contact-invite">
              Reach out for collaborations, volunteering, or services.
            </p>

            {ngo.email && (
              <a href={`mailto:${ngo.email}?subject=Collaboration Inquiry - NGO Connect Platform`} className="contact-cta-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                Send Email
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}