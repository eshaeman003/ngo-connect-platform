import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Pages
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import VolunteerDashboard from "./Pages/VolunteerDashboard";
import NGODashboard from "./Pages/NGODashboard";
import NGORegister from "./Pages/NGORegister";
import NGOProfile from "./Pages/NGOProfile";
import Opportunities from "./Pages/Opportunities";
import OpportunityDetail from "./Pages/OpportunityDetail";
import OpportunityCreate from "./Pages/OpportunityCreate";
import OpportunityEdit from "./Pages/OpportunityEdit";
import VolunteerProfile from "./Pages/VolunteerProfile";
import AdminDashboard from "./Pages/AdminDashboard";
import ComplaintForm from "./Pages/ComplaintForm";
import NotFound from "./Pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Volunteer Routes */}
        <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
        <Route path="/volunteer/profile" element={<VolunteerProfile />} />
        
        {/* NGO Routes */}
        <Route path="/ngo/dashboard" element={<NGODashboard />} />
        <Route path="/ngo/register" element={<NGORegister />} />
        <Route path="/ngo/profile" element={<NGOProfile />} />
        
        {/* Opportunities */}
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/opportunity/:id" element={<OpportunityDetail />} />
        <Route path="/opportunity/create" element={<OpportunityCreate />} />
        <Route path="/opportunity/edit/:id" element={<OpportunityEdit />} />
        
        {/* Other */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/complaint" element={<ComplaintForm />} />
        
        {/* 404 - Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;