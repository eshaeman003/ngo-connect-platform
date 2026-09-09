import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import "./Profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(prof);

        if (prof?.role === "ngo") {
          const { data: ngoData } = await supabase
            .from("ngos")
            .select("*")
            .eq("user_id", user.id)
            .single();
          setNgo(ngoData);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { error: profError } = await supabase
      .from("profiles")
      .update({ 
        full_name: profile.full_name, 
        phone: profile.phone, 
        bio: profile.bio 
      })
      .eq("id", user.id);

    if (profile.role === "ngo" && ngo) {
      await supabase
        .from("ngos")
        .update({
          name: ngo.name,
          phone: ngo.phone,
          address: ngo.address,
          description: ngo.description,
          website: ngo.website,
        })
        .eq("user_id", user.id);
    }

    setSaving(false);
    if (profError) setMessage("Error updating profile");
    else setMessage("Profile updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  const isNGO = profile?.role === "ngo";

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>My Profile</h1>
        <span className={`profile-role-badge ${profile?.role}`}>{profile?.role}</span>

        {message && (
          <div className={`profile-alert ${message.includes("Error") ? "error" : "success"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={profile?.email || ""} disabled className="disabled-input" />
          </div>

          <div className="form-group">
            <label>Full Name {isNGO ? "/ Org Name" : ""}</label>
            <input
              value={isNGO ? ngo?.name || "" : profile?.full_name || ""}
              onChange={(e) => isNGO ? setNgo({ ...ngo, name: e.target.value }) : setProfile({ ...profile, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              value={isNGO ? ngo?.phone || "" : profile?.phone || ""}
              onChange={(e) => isNGO ? setNgo({ ...ngo, phone: e.target.value }) : setProfile({ ...profile, phone: e.target.value })}
            />
          </div>

          {isNGO && (
            <>
              <div className="form-group">
                <label>Address</label>
                <input value={ngo?.address || ""} onChange={(e) => setNgo({ ...ngo, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input value={ngo?.website || ""} onChange={(e) => setNgo({ ...ngo, website: e.target.value })} placeholder="https://" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" value={ngo?.description || ""} onChange={(e) => setNgo({ ...ngo, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Approval Status</label>
                <span className={`ngo-status ${ngo?.status}`}>{ngo?.status || "pending"}</span>
              </div>
            </>
          )}

          {!isNGO && (
            <div className="form-group">
              <label>Bio / About</label>
              <textarea rows="3" value={profile?.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell us about yourself..." />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;