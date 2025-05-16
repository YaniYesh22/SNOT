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
    // When app loads for the first time, check if we need to logout
    const checkAppRestart = () => {
      // Check if sessionStorage has a app_session_id
      const appSessionId = sessionStorage.getItem('app_session_id');
      
      // If no app_session_id exists, this is a new browser session (app restart)
      if (!appSessionId) {
        // Create and set a new session ID for this browser session
        const newSessionId = Date.now().toString();
        sessionStorage.setItem('app_session_id', newSessionId);
        
        // Force logout if not on the login page (app was shut down and restarted)
        if (location.pathname !== '/') {
          return false; // Return false to indicate we should logout
        }
      }
      
      return true; // Session is valid
    };
    
    // This effect runs when the app initializes
    const clearAuthState = async () => {
      try {
        // Check if this is an app restart that should trigger logout
        const isValidSession = checkAppRestart();
        
        // Don't log out if on authorized paths (login, debug, notebook pages, or main app pages)
        if (location.pathname === '/' || 
            location.pathname === '/debug' || 
            location.pathname.startsWith('/notebook/') ||
            location.pathname === '/dashboard' ||
            location.pathname === '/topic-map' ||
            location.pathname === '/settings') {
          
          if (isValidSession) {
            setInitialized(true);
            return;
          }
        }
        
        // Don't log out if just logged in (check for a flag in sessionStorage)
        const justLoggedIn = sessionStorage.getItem('justLoggedIn');
        if (justLoggedIn === 'true' && isValidSession) {
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