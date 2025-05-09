import React, { useState } from 'react';

import ImprovedLoginForm from '../components/ImprovedLoginForm';
import SignupForm from '../components/SignupForm';
import authService from '../services/AuthService';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showSignup, setShowSignup] = useState(false);
  
  const handleLogin = async (user) => {
    console.log('Logged in user:', user);
    // Login already saves user data in AuthService
    navigate('/dashboard');
  };
  
  const handleSignupSuccess = async (userData) => {
    setShowSignup(false);
    // Store some basic user info for convenience
    authService.setUserData({
      email: userData.email,
      name: userData.name || 'User'
    });
    
    // Show a success message
    alert('Account created successfully! You can now log in.');
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
              <span style={{ fontSize: '1.5rem' }}>📝</span>
              <span style={{ fontWeight: '500' }}>Smart Notes</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🧠</span>
              <span style={{ fontWeight: '500' }}>Topic Maps</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🤖</span>
              <span style={{ fontWeight: '500' }}>AI Assistance</span>
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