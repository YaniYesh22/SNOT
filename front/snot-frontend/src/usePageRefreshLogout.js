import { changePassword, confirmSignUp, signIn, signOut, signUp, updateUserAttributes, getCurrentUser, fetchUserAttributes, resetPassword, confirmResetPassword, fetchAuthSession } from 'aws-amplify/auth';
import { useEffect } from 'react';

/**
 * Custom hook to force logout when the page is refreshed
 */
export function usePageRefreshLogout() {
  useEffect(() => {
    // Store a timestamp when the page loads
    const pageLoadTimestamp = Date.now().toString();
    sessionStorage.setItem('pageLoadTimestamp', pageLoadTimestamp);
    
    // This function handles when storage changes in another tab
    const handleStorageChange = (event) => {
      if (event.key === 'pageLoadTimestamp' && event.newValue !== pageLoadTimestamp) {
        // Page was refreshed in another tab, trigger logout
        signOut().catch(error => {
          console.error('Error signing out:', error);
        });
      }
    };
    
    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // This function will run on page unload (refresh or close)
    const handleBeforeUnload = () => {
      // Clear auth state when navigating away or refreshing
      sessionStorage.removeItem('pageLoadTimestamp');
    };
    
    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up event listeners when component unmounts
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}

export default usePageRefreshLogout;