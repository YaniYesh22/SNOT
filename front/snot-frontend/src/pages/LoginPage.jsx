import React, { useEffect, useState } from 'react';

import ImprovedLoginForm from '../components/ImprovedLoginForm';
import SignupForm from '../components/SignupForm';
import authService from '../services/AuthService';
import { useNavigate } from 'react-router-dom';
import usePageRefreshLogout from '../usePageRefreshLogout';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showSignup, setShowSignup] = useState(false);
  
  // Use the custom hook to handle page refresh logout
  usePageRefreshLogout();
  
  // Check for existing sessions and clear them
  // Check for existing sessions and clear them
  useEffect(() => {
    const clearExistingSession = async () => {
      try {
        // Check if there's an active session
        try {
          const currentUser = await authService.getCurrentUser();
          
          if (currentUser) {
            // If user is already logged in, force logout
            await authService.logout();
            console.log('Previous session cleared');
          }
        } catch (error) {
          // Ignore "user not authenticated" errors as they're expected on the login page
          if (!error.message || !error.message.includes('not authenticated')) {
            console.error('Error checking session:', error);
          }
        }
      } catch (error) {
        console.error('Error in session handling:', error);
      }
    };
    
    clearExistingSession();
  }, []);
  
  const handleLogin = async (user) => {
    console.log('Logged in user:', user);
    
    // Set a flag to prevent immediate logout
    sessionStorage.setItem('justLoggedIn', 'true');
    
    // Navigate to dashboard
    navigate('/dashboard');
  };
  
  const handleSignupSuccess = async (userData) => {
    // After successful verification and login, navigate to dashboard
    console.log('Signup successful for:', userData);
    
    // Set a flag to prevent immediate logout
    sessionStorage.setItem('justLoggedIn', 'true');
    
    // Navigate to dashboard
    navigate('/dashboard');
  };
  
  const toggleForm = () => {
    setShowSignup(!showSignup);
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f2f5',
      backgroundImage: 'linear-gradient(135deg, #f0f2f5 0%, #e2e8f0 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
        top: '-250px',
        left: '-150px',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%)',
        bottom: '-100px',
        right: '-50px',
        zIndex: 0
      }}></div>
      
      {/* Content */}
      <div style={{
        zIndex: 1,
        maxWidth: '1200px',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 2rem'
      }}>
        {/* Left side - Branding */}
        <div style={{
          flex: '1',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '1rem',
            color: '#1e293b'
          }}>Smart Notebook for Organized Thinking</h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#475569',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            Connect your ideas, visualize knowledge, and let AI help you learn more effectively.
          </p>
          
          <div style={{
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#1e293b'
            }}>How it works:</h3>
            <ol style={{
              marginLeft: '1.5rem',
              color: '#475569',
              lineHeight: '1.8'
            }}>
              <li>Sign up with your email and create a password</li>
              <li>Check your email for a verification code</li>
              <li>Enter the code to verify your account</li>
              <li>Start organizing your knowledge!</li>
            </ol>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>✉️</span>
              <span style={{ fontWeight: '500' }}>Email Verification</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🔒</span>
              <span style={{ fontWeight: '500' }}>Secure Access</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🧠</span>
              <span style={{ fontWeight: '500' }}>AI-Powered Features</span>
            </div>
          </div>
        </div>
        
        {/* Right side - Login/Signup Form */}
        <div style={{
          flex: '1',
          maxWidth: '500px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {showSignup 
            ? <SignupForm onSwitch={toggleForm} onSignupSuccess={handleSignupSuccess} />
            : <ImprovedLoginForm onSubmit={handleLogin} onSwitch={toggleForm} />
          }
        </div>
      </div>
    </div>
  );
}