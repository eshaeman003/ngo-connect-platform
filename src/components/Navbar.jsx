import { NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/">Home</NavLink>
      <NavLink to="/ngos">NGOs</NavLink>
      <NavLink to="/opportunities">Opportunities</NavLink>
      <NavLink to="/applications">Applications</NavLink>
    </nav>
  );
}

export default Navbar;