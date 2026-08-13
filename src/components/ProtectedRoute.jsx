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
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setRole(data?.role || null);
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