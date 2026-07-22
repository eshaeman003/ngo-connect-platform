import { useParams, Link } from "react-router-dom";
import ngos from "../data/ngos";

function NGODetails() {
  const { id } = useParams();
  const ngo = ngos.find((item) => item.id === Number(id));

  if (!ngo) {
    return (
      <div className="ngo-not-found">
        <h2>NGO Not Found</h2>
        <Link to="/ngos" className="back-btn">← Back to NGOs</Link>
      </div>
    );
  }

  return (
    <div className="ngo-details">
      <div className="details-card">
        
        <div className="details-header">
          <span className="details-icon">🏛️</span>
          <h1>{ngo.name}</h1>
          <span className="details-category">{ngo.category}</span>
        </div>

        <div className="details-body">
          <div className="detail-row">
            <span className="detail-label">📍 Location</span>
            <span className="detail-value">{ngo.location}</span>
          </div>

          <div className="detail-section">
            <h3>About NGO</h3>
            <p>{ngo.description}</p>
          </div>

          <div className="detail-row">
            <span className="detail-label">📞 Contact</span>
            <span className="detail-value">{ngo.contact}</span>
          </div>
        </div>

        <div className="details-footer">
          <Link to="/ngos" className="back-btn">← Back to NGOs</Link>
          <button className="contact-btn">Contact NGO</button>
        </div>

      </div>
    </div>
  );
}

export default NGODetails;