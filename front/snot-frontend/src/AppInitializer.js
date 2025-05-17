import { useEffect, useState } from 'react';
import { signIn, signUp, confirmSignUp, signOut, getCurrentUser, fetchUserAttributes, updateUserAttributes, resetPassword, confirmResetPassword, fetchAuthSession } from 'aws-amplify/auth';

export default function AppInitializer({ children }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // Check if this is a fresh app load (browser was closed and reopened)
      const lastActiveTimestamp = sessionStorage.getItem('app_last_active');
      const currentTime = Date.now();

      if (!lastActiveTimestamp) {
        console.log('App restart detected - clearing auth state');
        try {
          // Force sign out on app startup
          await signOut({ global: true });
          localStorage.removeItem('userData');

          // Clear any stale Amplify data from localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('amplify') || key.startsWith('CognitoIdentityServiceProvider')) {
              localStorage.removeItem(key);
            }
          });
        } catch (error) {
          console.error('Error clearing auth state:', error);
        }
      }

      // Set a new session marker
      sessionStorage.setItem('app_last_active', currentTime.toString());
      setInitialized(true);
    };

    initializeApp();
  }, []);

  return initialized ? children : null;
}