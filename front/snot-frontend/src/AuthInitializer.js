import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Auth } from 'aws-amplify';
import authService from './services/AuthService';

/**
 * AuthInitializer component to handle session management
 * This component runs on app initialization and forces users to log in again
 */
export default function AuthInitializer({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // This effect runs when the app initializes
    const clearAuthState = async () => {
      try {
        // Don't log out if on excluded paths (login, debug, or notebook detail pages)
        if (location.pathname === '/' || 
            location.pathname === '/debug' || 
            location.pathname.startsWith('/notebook/')) {
          setInitialized(true);
          return;
        }
        
        // Don't log out if just logged in (check for a flag in sessionStorage)
        const justLoggedIn = sessionStorage.getItem('justLoggedIn');
        if (justLoggedIn === 'true') {
          // Clear the flag but don't log out
          sessionStorage.removeItem('justLoggedIn');
          setInitialized(true);
          return;
        }
        
        // Sign out the current user
        await Auth.signOut();
        
        // Clear localStorage data
        authService.clearUserData();
        
        // Redirect to login page
        navigate('/');
      } catch (error) {
        // Don't show errors for "not authenticated" as they're expected
        if (!error.message || !error.message.includes('not authenticated')) {
          console.error('Error during auto logout:', error);
        }
        
        // Even if there's an error, still try to redirect to login
        navigate('/');
      } finally {
        setInitialized(true);
      }
    };
    
    // Execute the auto-logout
    clearAuthState();
    
  }, [navigate, location.pathname]);
  
  // Return the children components once initialized
  return initialized ? children : null;
}