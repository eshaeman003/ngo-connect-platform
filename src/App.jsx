import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import VolunteerDashboard from "./Pages/VolunteerDashboard";
import VolunteerProfile from "./Pages/VolunteerProfile";
import NGODashboard from "./Pages/NGODashboard";
import NGORegister from "./Pages/NGORegister";
import NGOProfile from "./Pages/NGOProfile";
import NGOs from "./Pages/NGOs";
import NGODetails from "./Pages/NGODetails";
import Opportunities from "./Pages/Opportunities";
import OpportunityDetail from "./Pages/OpportunityDetail";
import CreateOpportunity from "./Pages/CreateOpportunity";
import OpportunityEdit from "./Pages/OpportunityEdit";
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
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/ngo" element={<NGORegister />} />
        <Route path="/ngos" element={<NGOs />} />
        <Route path="/ngos/:id" element={<NGODetails />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/apply/:id" element={<ApplyPage />} />
        <Route path="/opportunity/:id" element={<OpportunityDetail />} />
        <Route path="/about" element={<About />} />

        {/* NGO Routes - Protected */}
        <Route path="/ngo/dashboard" element={
          <ProtectedRoute allowedRole="ngo">
            <NGODashboard />
          </ProtectedRoute>
        } />
        <Route path="/ngo/profile" element={
          <ProtectedRoute allowedRole="ngo">
            <NGOProfile />
          </ProtectedRoute>
        } />
        <Route path="/ngo/applications" element={
          <ProtectedRoute allowedRole="ngo">
            <div style={{ paddingTop: "120px", textAlign: "center" }}>
              <h2>NGO Applications</h2>
              <p>Applications management page coming soon...</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/opportunity/create" element={
          <ProtectedRoute allowedRole="ngo">
            <CreateOpportunity />
          </ProtectedRoute>
        } />
        <Route path="/opportunity/edit/:id" element={
          <ProtectedRoute allowedRole="ngo">
            <OpportunityEdit />
          </ProtectedRoute>
        } />

        {/* Volunteer Routes - Protected */}
        <Route path="/volunteer/dashboard" element={
          <ProtectedRoute allowedRole="volunteer">
            <VolunteerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/volunteer/profile" element={
          <ProtectedRoute allowedRole="volunteer">
            <VolunteerProfile />
          </ProtectedRoute>
        } />

        {/* Admin Routes - Protected */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/complaints" element={
          <ProtectedRoute allowedRole="admin">
            <AdminComplaints />
          </ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;