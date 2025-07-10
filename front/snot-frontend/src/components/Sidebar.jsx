import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import authService from '../services/AuthService';

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };


  // Toggle function calls parent handler
  const toggleSidebar = (e) => {
    e.stopPropagation();
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  } 

  // Prevent click propagation on navigation links
  const handleNavClick = (e) => {
    e.stopPropagation();
  };

  return (
    <aside style={{
      ...styles.sidebar,
      width: !isCollapsed ? '280px' : '80px',
      minWidth: !isCollapsed ? '280px' : '80px', // Enforce min width in collapsed mode
      transition: 'width 0.3s ease, min-width 0.3s ease'
    }}>
      {/* Header Section */}
      <div style={styles.header}>
        {!isCollapsed ? (
          // Expanded header
          <>
            <div style={styles.logoSection}>
              <div style={styles.logoIcon}>
                <img 
                  src="/SNOTLOGO.png" 
                  alt="SNOT Logo" 
                  style={{
                    width: '55px',
                    height: '55px',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <div style={styles.logoContent}>
                <span style={styles.logoText}>SNOT</span>
                <span style={styles.logoSubtext}>Smart Notebooks</span>
              </div>
              <button 
                onClick={toggleSidebar} 
                style={styles.hamburgerButton}
                className="hamburger-button"
                type="button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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
              <div style={styles.userStatus}>
                <div style={styles.statusDot}></div>
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
              className="expand-indicator"
                title="Expand sidebar"
                type="button"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation Section - Expanded */}
      {!isCollapsed && (
        <nav style={styles.navigation}>
          <div style={styles.navSection}>
            <span style={styles.navSectionTitle}>Workspace</span>
            
            <Link 
              to="/dashboard" 
              style={{
                ...styles.navLink,
                ...(isActiveRoute('/dashboard') ? styles.navLinkActive : {})
              }}
              className={isActiveRoute('/dashboard') ? 'nav-link nav-link-active' : 'nav-link'}
              onClick={handleNavClick}
            >
              <div style={styles.navIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z"/>
                </svg>
              </div>
              <span style={styles.navText}>Notebooks</span>
              <div style={styles.navArrow} className="nav-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                </svg>
              </div>
              {isActiveRoute('/dashboard') && <div style={styles.activeIndicator} />}
            </Link>
            
            <Link 
              to="/topic-map" 
              style={{
                ...styles.navLink,
                ...(isActiveRoute('/topic-map') ? styles.navLinkActive : {})
              }}
              className={isActiveRoute('/topic-map') ? 'nav-link nav-link-active' : 'nav-link'}
              onClick={handleNavClick}
            >
              <div style={styles.navIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M21,9V7L15,1H5A2,2 0 0,0 3,3V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V9M19,19H5V3H14L19,8V19Z"/>
                </svg>
              </div>
              <span style={styles.navText}>Topic Map</span>
              <div style={styles.navArrow} className="nav-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                </svg>
              </div>
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
              className={isActiveRoute('/settings') ? 'nav-link nav-link-active' : 'nav-link'}
              onClick={handleNavClick}
            >
              <div style={styles.navIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                </svg>
              </div>
              <span style={styles.navText}>Settings</span>
              <div style={styles.navArrow} className="nav-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                </svg>
              </div>
              {isActiveRoute('/settings') && <div style={styles.activeIndicator} />}
            </Link>
          </div>
        </nav>
      )}
      
      {/* Navigation Section - Collapsed (Icons only) */}
      {isCollapsed && (
        <div style={styles.collapsedNavigation}>
          <div style={styles.collapsedNavGroup}>
            <Link
              to="/dashboard" 
              style={{
                ...styles.collapsedNavLink,
                ...(isActiveRoute('/dashboard') ? styles.collapsedNavLinkActive : {})
              }}
              className={isActiveRoute('/dashboard') ? 'collapsed-nav-link collapsed-nav-link-active' : 'collapsed-nav-link'}
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
              className={isActiveRoute('/topic-map') ? 'collapsed-nav-link collapsed-nav-link-active' : 'collapsed-nav-link'}
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
              className={isActiveRoute('/settings') ? 'collapsed-nav-link collapsed-nav-link-active' : 'collapsed-nav-link'}
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
      {!isCollapsed && (
        <div style={styles.footer}>
          <button onClick={handleLogout} style={styles.logoutButton} className="logout-button" type="button">
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
      {isCollapsed && (
        <div style={styles.collapsedFooter}>
          <button 
            onClick={handleLogout} 
            style={styles.collapsedLogoutButton} 
            className="collapsed-logout-button" 
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
    background: 'linear-gradient(180deg, #fefffe 0%, #f0fdfa 100%)',
    borderRight: '1px solid #a7f3d0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 4px 6px -1px #0ea5e9'
  },
  
  // Header Section
  header: {
    padding: '1.5rem 1.25rem',
    background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
    flexShrink: 0,
    borderBottom: '1px solid #bae6fd'
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  logoIcon: {
    width: '60px',
    height: '60px',
    background: 'transparent',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 25px -8px rgba(125, 211, 252, 0.4)',
    flexShrink: 0,
    border: '0.5px solid #84b2fb'
  },
  logoContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  logoText: {
    fontSize: '1.375rem',
    fontWeight: '800',
    color: '#0369a1',
    letterSpacing: '-0.025em',
    lineHeight: '1.2'
  },
  logoSubtext: {
    fontSize: '0.75rem',
    color: '#0ea5e9',
    fontWeight: '500',
    marginTop: '0.125rem'
  },
  hamburgerButton: {
    background: 'none',
    border: 'none',
    color: '#0ea5e9',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    background: 'linear-gradient(135deg, #dbeafe 0%,rgb(0, 78, 180) 100%)',
    borderRadius: '16px',
    border: '1px solid #93c5fd'
  },
  userAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 14px -6px #3b82f6'
  },
  userInitials: {
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '700'
  },
  userInfo: {
    flex: 1,
    minWidth: 0
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'white',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  userEmail: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: '0.125rem'
  },
  userStatus: {
    flexShrink: 0
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    border: '2px solid white',
    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.3)'
  },

  // Collapsed Header Styles
  collapsedHeader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  collapsedUserAvatar: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
    boxShadow: '0 8px 25px -8px #3b82f6'
  },
  expandIndicator: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '18px',
    height: '18px',
    background: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '8px',
    border: '2px solid white',
    cursor: 'pointer',
    zIndex: 10,
    outline: 'none',
    padding: 0,
    boxShadow: '0 2px 8px #38bdf8'
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
    fontSize: '0.6875rem',
    fontWeight: '700',
    color: '#0ea5e9',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '1rem',
    display: 'block',
    paddingLeft: '0.75rem'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 0.75rem',
    marginBottom: '0.25rem',
    borderRadius: '12px',
    textDecoration: 'none',
    color: '#0891b2',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  navLinkActive: {
    background: 'linear-gradient(135deg, #bae6fd 0%, #7dd3fc 100%)',
    color: '#0369a1',
    boxShadow: '0 4px 14px -6px rgba(125, 211, 252, 0.4)',
    transform: 'translateY(-1px)'
  },
  navIcon: {
    flexShrink: 0,
    transition: 'transform 0.2s ease'
  },
  navText: {
    flex: 1
  },
  navArrow: {
    opacity: 0,
    transition: 'opacity 0.2s ease',
    flexShrink: 0,
    color: '#38bdf8'
  },
  activeIndicator: {
    position: 'absolute',
    right: '0.75rem',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: '#0369a1'
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
    gap: '0.75rem',
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
    color: '#0891b2',
    transition: 'all 0.2s ease',
    position: 'relative',
    background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
    border: '1px solid #bae6fd'
  },
  collapsedNavLinkActive: {
    background: 'linear-gradient(135deg, #bae6fd 0%, #7dd3fc 100%)',
    color: '#0369a1',
    boxShadow: '0 4px 14px -6px rgba(125, 211, 252, 0.4)',
    border: '1px solid rgba(125, 211, 252, 0.3)'
  },
  collapsedActiveIndicator: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#4ade80',
    border: '2px solid white'
  },
  
  // Footer Section
  footer: {
    padding: '1.25rem',
    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
    flexShrink: 0,
    borderTop: '1px solid #a7f3d0'
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 0.75rem',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    border: '1px solid #7dd3fc',
    borderRadius: '12px',
    color: '#0891b2',
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
    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
    display: 'flex',
    justifyContent: 'center',
    flexShrink: 0,
    borderTop: '1px solid #a7f3d0'
  },
  collapsedLogoutButton: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    border: '1px solid #7dd3fc',
    color: '#0891b2',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

const sidebarCSS = `
  /* Hover effects for navigation links */
  .nav-link:hover {
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%) !important;
    color: #0369a1 !important;
    transform: translateX(4px);
  }
  
  .nav-link:hover .nav-arrow {
    opacity: 1 !important;
  }
  
  .nav-link-active:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 25px -8px rgba(125, 211, 252, 0.5) !important;
  }
  
  /* Hover effects for collapsed navigation */
  .collapsed-nav-link:hover {
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%) !important;
    color: #0369a1 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 14px -6px rgba(125, 211, 252, 0.3) !important;
  }
  
  .collapsed-nav-link-active:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px -8px rgba(125, 211, 252, 0.6) !important;
  }
  
  /* Hover effects for buttons */
  .hamburger-button:hover {
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%) !important;
    color: #0369a1 !important;
  }
  
  .logout-button:hover {
    background: linear-gradient(135deg,rgb(243, 119, 74) 0%,rgb(243, 119, 74) 100%) !important;
    color: white !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px -6px rgb(243, 119, 74) !important;
  }
  
  .collapsed-logout-button:hover {
    background: linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%) !important;
    color: white !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 14px -6px rgba(125, 211, 252, 0.4) !important;
  }
  
  /* Pulse animation for expand indicator */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
  }
  
  .expand-indicator {
    animation: pulse 2s infinite;
  }
  
  /* Smooth transitions */
  * {
    transition: all 0.2s ease;
  }
`;

// Inject CSS if not already present
if (!document.querySelector('#modern-sidebar-styles')) {
  const style = document.createElement('style');
  style.id = 'modern-sidebar-styles';
  style.textContent = sidebarCSS;
  document.head.appendChild(style);
}