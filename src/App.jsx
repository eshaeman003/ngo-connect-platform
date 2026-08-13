import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "./utils/supabase";
import { NotificationProvider } from "./Context/NotificationContext";
import MainLayout from "./Layouts/MainLayout";
import Home from "./Pages/Home";
import NGOs from "./Pages/NGOs";
import NGODetails from "./Pages/NGODetails";
import Opportunities from "./Pages/Opportunities";
import OpportunityDetail from "./Pages/OpportunityDetail";
import Applications from "./Pages/Applications";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import NGORegister from "./Pages/NGORegister";
import VolunteerDashboard from "./Pages/VolunteerDashboard";
import VolunteerProfile from "./Pages/VolunteerProfile";
import NGODashboard from "./Pages/NGODashboard";
import NGOProfile from "./Pages/NGOProfile";
import CreateOpportunity from "./Pages/CreateOpportunity";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminComplaints from "./Pages/AdminComplaints";
import ProtectedRoute from "./components/ProtectedRoute";

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profile?.role === "admin") {
            navigate("/admin", { replace: true });
          } else if (profile?.role === "ngo") {
            navigate("/ngo/dashboard", { replace: true });
          } else if (profile?.role === "volunteer") {
            navigate("/volunteer/dashboard", { replace: true });
          }
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ngos" element={<NGOs />} />
        <Route path="/ngos/:id" element={<NGODetails />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/opportunities/:id" element={<OpportunityDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/ngo" element={<NGORegister />} />

        <Route
          path="/opportunity/create"
          element={
            <ProtectedRoute allowedRole="ngo">
              <CreateOpportunity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/opportunity/edit/:id"
          element={
            <ProtectedRoute allowedRole="ngo">
              <CreateOpportunity />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/complaints"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminComplaints />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer/dashboard"
          element={
            <ProtectedRoute allowedRole="volunteer">
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer/profile"
          element={
            <ProtectedRoute allowedRole="volunteer">
              <VolunteerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ngo/dashboard"
          element={
            <ProtectedRoute allowedRole="ngo">
              <NGODashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ngo/profile"
          element={
            <ProtectedRoute allowedRole="ngo">
              <NGOProfile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MainLayout>
  );
}

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;