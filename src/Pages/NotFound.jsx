import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-emoji">😕</div>
      <h1 className="notfound-title">Page Not Found</h1>
      <p className="notfound-desc">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="notfound-btn">
        ← Go Back Home
      </Link>
    </div>
  );
}

export default NotFound;