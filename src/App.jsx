import NGODetails from "./Pages/NGODetails";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import VolunteerDashboard from "./Pages/VolunteerDashboard";
import NGODashboard from "./Pages/NGODashboard";
import NGORegister from "./Pages/NGORegister";
import NGOProfile from "./Pages/NGOProfile";
import NGOs from "./Pages/NGOs";
import Opportunities from "./Pages/Opportunities";
import OpportunityDetail from "./Pages/OpportunityDetail";
import CreateOpportunity from "./Pages/CreateOpportunity";
import OpportunityEdit from "./Pages/OpportunityEdit";
import VolunteerProfile from "./Pages/VolunteerProfile";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminComplaints from "./Pages/AdminComplaints";
import ApplyPage from "./Pages/ApplyPage";
import About from "./Pages/About";
import NotFound from "./Pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
        <Route path="/volunteer/profile" element={<VolunteerProfile />} />
        <Route path="/ngo/dashboard" element={<NGODashboard />} />
        <Route path="/ngo/register" element={<NGORegister />} />
        <Route path="/ngo/profile" element={<NGOProfile />} />
        <Route path="/ngos" element={<NGOs />} />
        <Route path="/ngos/:id" element={<NGODetails />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/apply/:id" element={<ApplyPage />} />
        <Route path="/opportunity/:id" element={<OpportunityDetail />} />
        <Route path="/opportunity/create" element={<CreateOpportunity />} />
        <Route path="/opportunity/edit/:id" element={<OpportunityEdit />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/complaints" element={<AdminComplaints />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;