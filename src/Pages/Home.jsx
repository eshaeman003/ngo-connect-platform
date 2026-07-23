import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  const [connectionStatus, setConnectionStatus] = useState('Checking...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
          console.log('Error:', error.message);
          setConnectionStatus('❌ Failed: ' + error.message);
        } else {
          console.log('Connected! Data:', data);
          setConnectionStatus('✅ Connected to Supabase!');
        }
      } catch (err) {
        setConnectionStatus('❌ Error: ' + err.message);
      }
    };
    testConnection();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Connect. Volunteer. Impact.</h1>
          <p>Join hands with NGOs to create meaningful change in your community</p>
          <div className="hero-buttons">
            <Link to="/ngos" className="btn-primary">Explore NGOs</Link>
            <Link to="/register" className="btn-secondary">Get Started</Link>
          </div>
        </div>
      </section>

      {/* Connection Status */}
      <div className="connection-status">
        <p><strong>Supabase Status:</strong> {connectionStatus}</p>
      </div>

      {/* Stats Section */}
      <section className="stats">
        <div className="stat-card">
          <h3>50+</h3>
          <p>Active NGOs</p>
        </div>
        <div className="stat-card">
          <h3>1,200+</h3>
          <p>Volunteers</p>
        </div>
        <div className="stat-card">
          <h3>300+</h3>
          <p>Opportunities</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>How It Works</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Discover</h3>
            <p>Find NGOs and causes that match your passion</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Connect</h3>
            <p>Apply for volunteer opportunities easily</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track</h3>
            <p>Monitor your applications and impact</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;