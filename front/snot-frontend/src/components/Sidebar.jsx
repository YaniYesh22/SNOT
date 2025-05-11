import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import authService from '../services/AuthService';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    // Get user data when the component mounts
    const loadUserData = async () => {
      try {
        // First try to get from localStorage
        let userData = authService.getUserData();
        
        // If no data or no name, refresh from Cognito
        if (!userData || !userData.name || userData.name === 'User') {
          userData = await authService.refreshUserData();
        }
        
        setUserData(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to localStorage data
        setUserData(authService.getUserData());
      }
    };
    
    loadUserData();
  }, []);
  
  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.topSection}>
        <h2 style={styles.logo}>SNOT</h2>
        
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={styles.userName}>
            {userData?.name || 'User'}
          </div>
        </div>
        
        <ul style={styles.nav}>
          <li style={location.pathname === "/dashboard" ? styles.active : {}}>
            <Link to="/dashboard" style={styles.link}>
              📒 Notebooks
            </Link>
          </li>
          <li style={location.pathname === "/topic-map" ? styles.active : {}}>
            <Link to="/topic-map" style={styles.link}>
              🧠 Topic Map
            </Link>
          </li>
          <li style={location.pathname === "/settings" ? styles.active : {}}>
            <Link to="/settings" style={styles.link}>
              ⚙️ Settings
            </Link>
          </li>
        </ul>
      </div>
      
      <div style={styles.bottomSection}>
        <button onClick={handleLogout} style={styles.logoutButton}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '220px',
    background: '#111827',
    color: '#f9fafb',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    borderRight: '1px solid #1f2937',
    height: '100vh',
    justifyContent: 'space-between'
  },
  topSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  bottomSection: {
    marginTop: 'auto'
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '0.875rem'
  },
  userName: {
    fontWeight: '500',
    fontSize: '0.95rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  nav: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  link: {
    color: '#9ca3af',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    display: 'block',
    transition: 'background 0.2s ease',
    whiteSpace: 'nowrap'
  },
  active: {
    backgroundColor: '#1f2937',
    color: '#fff',
    borderRadius: '6px'
  },
  logoutButton: {
    backgroundColor: 'transparent',
    color: '#9ca3af',
    border: 'none',
    textAlign: 'left',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'background 0.2s ease, color 0.2s ease',
    width: '100%'
  }
};