import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

function ProtectedRoute({ children, allowedRole }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Check profiles table first (admin, volunteer)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, suspended, legal_notice_received")
          .eq("id", user.id)
          .single();

        if (profile?.role) {
          // Check if suspended
          if (profile.suspended || profile.legal_notice_received) {
            await supabase.auth.signOut();
            setUser(null);
            setRole(null);
            setLoading(false);
            return;
          }
          setRole(profile.role);
          setLoading(false);
          return;
        }

        // Check ngos table (ngo user)
        const { data: ngo } = await supabase
          .from("ngos")
          .select("id, approval_status, suspended, legal_notice_received")
          .eq("user_id", user.id)
          .single();

        if (ngo) {
          // Check if suspended or not approved
          if (ngo.suspended || ngo.legal_notice_received) {
            await supabase.auth.signOut();
            setUser(null);
            setRole(null);
            setLoading(false);
            return;
          }
          if (ngo.approval_status !== "approved") {
            await supabase.auth.signOut();
            setUser(null);
            setRole(null);
            setLoading(false);
            return;
          }
          setRole("ngo");
          setLoading(false);
          return;
        }

        setRole(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: "3rem" }}>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;