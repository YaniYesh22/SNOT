import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import authService from '../services/AuthService';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
  
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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Toggle function with event handling to prevent bubbling
  const toggleSidebar = (e) => {
    e.stopPropagation();
    console.log('Toggle function called');
    setIsExpanded(prev => !prev);
  };

  // Prevent click propagation on navigation links
  const handleNavClick = (e) => {
    e.stopPropagation();
  };

  return (
    <aside style={{
      ...styles.sidebar,
      width: isExpanded ? '280px' : '80px',
      transition: 'width 0.3s ease'
    }}>
      {/* Header Section */}
      <div style={styles.header}>
        {isExpanded ? (
          // Expanded header
          <>
            <div style={styles.logoSection}>
              <div style={styles.logoIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z"/>
                </svg>
              </div>
              <span style={styles.logoText}>SNOT</span>
              <button 
                onClick={toggleSidebar} 
                style={styles.hamburgerButton}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"/>
                </svg>
              </button>
            </div>
            
            {/* User Profile Section */}
            <div style={styles.userSection}>
              <div style={styles.userAvatar}>
                <span style={styles.userInitials}>
                  {getInitials(userData?.name)}
                </span>
              </div>
              <div style={styles.userInfo}>
                <div style={styles.userName}>
                  {userData?.name || 'User'}
                </div>
                <div style={styles.userEmail}>
                  {userData?.email || 'user@example.com'}
                </div>
              </div>
            </div>
          </>
        ) : (
          // Collapsed header - only user avatar with hamburger
          <div style={styles.collapsedHeader}>
            <div style={styles.collapsedUserAvatar}>
              <span style={styles.userInitials}>
                {getInitials(userData?.name)}
              </span>
              {/* Small hamburger indicator */}
              <button 
                onClick={toggleSidebar} 
                style={styles.expandIndicator}
                title="Expand sidebar"
                type="button"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation Section - Expanded */}
      {isExpanded && (
        <nav style={styles.navigation}>
          <div style={styles.navSection}>
            <span style={styles.navSectionTitle}>Workspace</span>
            
            <Link 
              to="/dashboard" 
              style={{
                ...styles.navLink,
                ...(isActiveRoute('/dashboard') ? styles.navLinkActive : {})
              }}
              onClick={handleNavClick}
            >
              <div style={styles.navIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z"/>
                </svg>
              </div>
              <span style={styles.navText}>Notebooks</span>
              {isActiveRoute('/dashboard') && <div style={styles.activeIndicator} />}
            </Link>
            
            <Link 
              to="/topic-map" 
              style={{
                ...styles.navLink,
                ...(isActiveRoute('/topic-map') ? styles.navLinkActive : {})
              }}
              onClick={handleNavClick}
            >
              <div style={styles.navIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M21,9V7L15,1H5A2,2 0 0,0 3,3V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V9M19,19H5V3H14L19,8V19Z"/>
                </svg>
              </div>
              <span style={styles.navText}>Topic Map</span>
              {isActiveRoute('/topic-map') && <div style={styles.activeIndicator} />}
            </Link>
          </div>
          
          <div style={styles.navSection}>
            <span style={styles.navSectionTitle}>Settings</span>
            
            <Link 
              to="/settings" 
              style={{
                ...styles.navLink,
                ...(isActiveRoute('/settings') ? styles.navLinkActive : {})
              }}
              onClick={handleNavClick}
            >
              <div style={styles.navIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                </svg>
              </div>
              <span style={styles.navText}>Settings</span>
              {isActiveRoute('/settings') && <div style={styles.activeIndicator} />}
            </Link>
          </div>
        </nav>
      )}
      
      {/* Navigation Section - Collapsed (Icons only) */}
      {!isExpanded && (
        <div style={styles.collapsedNavigation}>
          <div style={styles.collapsedNavGroup}>
            <Link
              to="/dashboard" 
              style={{
                ...styles.collapsedNavLink,
                ...(isActiveRoute('/dashboard') ? styles.collapsedNavLinkActive : {})
              }}
              title="Notebooks"
              onClick={handleNavClick}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z"/>
              </svg>
              {isActiveRoute('/dashboard') && <div style={styles.collapsedActiveIndicator} />}
            </Link>
            
            <Link
              to="/topic-map" 
              style={{
                ...styles.collapsedNavLink,
                ...(isActiveRoute('/topic-map') ? styles.collapsedNavLinkActive : {})
              }}
              title="Topic Map"
              onClick={handleNavClick}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M21,9V7L15,1H5A2,2 0 0,0 3,3V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V9M19,19H5V3H14L19,8V19Z"/>
              </svg>
              {isActiveRoute('/topic-map') && <div style={styles.collapsedActiveIndicator} />}
            </Link>
            
            <Link
              to="/settings" 
              style={{
                ...styles.collapsedNavLink,
                ...(isActiveRoute('/settings') ? styles.collapsedNavLinkActive : {})
              }}
              title="Settings"
              onClick={handleNavClick}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
              </svg>
              {isActiveRoute('/settings') && <div style={styles.collapsedActiveIndicator} />}
            </Link>
          </div>
        </div>
      )}
      
      {/* Footer Section - Expanded */}
      {isExpanded && (
        <div style={styles.footer}>
          <button onClick={handleLogout} style={styles.logoutButton} type="button">
            <div style={styles.logoutIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
              </svg>
            </div>
            <span style={styles.logoutText}>Sign Out</span>
          </button>
        </div>
      )}

      {/* Footer Section - Collapsed */}
      {!isExpanded && (
        <div style={styles.collapsedFooter}>
          <button 
            onClick={handleLogout} 
            style={styles.collapsedLogoutButton} 
            title="Sign Out"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
}

const styles = {
  sidebar: {
    height: '100vh',
    background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative'
  },
  
  // Header Section
  header: {
    padding: '1.5rem 1.25rem',
    borderBottom: '1px solid #e5e7eb',
    background: 'white',
    flexShrink: 0
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem'
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#111827',
    letterSpacing: '0.5px',
    flex: 1,
    marginLeft: '0.75rem'
  },
  hamburgerButton: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
  },
  userInitials: {
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  userInfo: {
    flex: 1,
    minWidth: 0
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  userEmail: {
    fontSize: '0.75rem',
    color: '#6b7280',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: '0.125rem'
  },

  // Collapsed Header Styles
  collapsedHeader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  collapsedUserAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
  },
  expandIndicator: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    width: '20px',
    height: '20px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '10px',
    border: '2px solid white',
    animation: 'pulse 2s infinite',
    cursor: 'pointer',
    zIndex: 10,
    outline: 'none',
    padding: 0
  },
  
  // Navigation Section
  navigation: {
    flex: 1,
    padding: '1.5rem 1.25rem',
    overflowY: 'auto'
  },
  navSection: {
    marginBottom: '2rem'
  },
  navSectionTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '0.75rem',
    display: 'block'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    marginBottom: '0.25rem',
    borderRadius: '10px',
    textDecoration: 'none',
    color: '#6b7280',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  navLinkActive: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
    transform: 'translateY(-1px)'
  },
  navIcon: {
    flexShrink: 0,
    transition: 'transform 0.2s ease'
  },
  navText: {
    flex: 1
  },
  activeIndicator: {
    position: 'absolute',
    right: '0.75rem',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.8)'
  },

  // Collapsed Navigation Styles
  collapsedNavigation: {
    flex: 1,
    padding: '1rem 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  collapsedNavGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
    alignItems: 'center'
  },
  collapsedNavLink: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    color: '#6b7280',
    transition: 'all 0.2s ease',
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.5)'
  },
  collapsedNavLinkActive: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
  },
  collapsedActiveIndicator: {
    position: 'absolute',
    top: '-3px',
    right: '-3px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#10b981',
    border: '2px solid white'
  },
  
  // Footer Section
  footer: {
    padding: '1.25rem',
    borderTop: '1px solid #e5e7eb',
    background: 'white',
    flexShrink: 0
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: 'none',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    color: '#6b7280',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  logoutIcon: {
    flexShrink: 0
  },
  logoutText: {
    flex: 1,
    textAlign: 'left'
  },

  // Collapsed Footer Styles
  collapsedFooter: {
    padding: '1rem',
    borderTop: '1px solid #e5e7eb',
    background: 'white',
    display: 'flex',
    justifyContent: 'center',
    flexShrink: 0
  },
  collapsedLogoutButton: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};