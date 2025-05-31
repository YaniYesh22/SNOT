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
    <div style={styles.container}>
      {/* Background Elements */}
      <div style={styles.backgroundDecorations}>
        {/* Animated gradient orbs */}
        <div style={styles.orb1}></div>
        <div style={styles.orb2}></div>
        <div style={styles.orb3}></div>
        
        {/* Grid pattern overlay */}
        <div style={styles.gridPattern}></div>
      </div>
      
      {/* Main Content */}
      <div style={styles.contentWrapper}>
        {/* Left side - Branding */}
        <div style={styles.brandingSection}>
          {/* Logo and brand name */}
          <div style={styles.brandHeader}>
            <div style={styles.brandLogoContainer}>
              <img
                src="/SNOTLOGO.png"
                alt="SNOT Logo"
                style={styles.brandLogo}
              />
            </div>
            <div style={styles.brandText}>
              <h1 style={styles.brandTitle}>SNOT</h1>
              <p style={styles.brandTagline}>Smart Notebooks for Organized Thinking</p>
            </div>
          </div>
          
          {/* Main heading */}
          <h2 style={styles.mainTitle}>
            Transform your ideas into
            <span style={styles.highlightText}> organized knowledge</span>
          </h2>
          
          <p style={styles.description}>
            Connect your thoughts, visualize relationships, and let AI help you learn 
            more effectively. Your personal knowledge companion awaits.
          </p>
          
          {/* Features grid */}
          <div style={styles.featuresGrid}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>
                <span style={styles.featureEmoji}>🧠</span>
              </div>
              <div style={styles.featureContent}>
                <h4 style={styles.featureTitle}>AI-Powered Insights</h4>
                <p style={styles.featureDescription}>Let AI help organize and connect your ideas</p>
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureIcon}>
                <span style={styles.featureEmoji}>🔗</span>
              </div>
              <div style={styles.featureContent}>
                <h4 style={styles.featureTitle}>Knowledge Connections</h4>
                <p style={styles.featureDescription}>Visualize relationships between concepts</p>
              </div>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureIcon}>
                <span style={styles.featureEmoji}>🚀</span>
              </div>
              <div style={styles.featureContent}>
                <h4 style={styles.featureTitle}>Boost Productivity</h4>
                <p style={styles.featureDescription}>Streamline your learning and research process</p>
              </div>
            </div>
          </div>
          
          {/* Steps */}
          <div style={styles.stepsSection}>
            <h3 style={styles.stepsTitle}>Get started in seconds</h3>
            <div style={styles.steps}>
              <div style={styles.step}>
                <div style={styles.stepNumber}>1</div>
                <p style={styles.stepText}>Create your account</p>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>2</div>
                <p style={styles.stepText}>Verify your email</p>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>3</div>
                <p style={styles.stepText}>Start organizing!</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Login/Signup Form */}
        <div style={styles.formSection}>
          {showSignup 
            ? <SignupForm onSwitch={toggleForm} onSignupSuccess={handleSignupSuccess} />
            : <ImprovedLoginForm onSubmit={handleLogin} onSwitch={toggleForm} />
          }
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #fefffe 0%, #f0fdfa 100%)',
    position: 'relative',
    overflow: 'hidden',
    padding: '2rem 1rem'
  },
  
  backgroundDecorations: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none'
  },
  
  orb1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(186, 230, 253, 0.15) 0%, transparent 70%)',
    top: '-300px',
    left: '-200px',
    animation: 'float 20s ease-in-out infinite'
  },
  
  orb2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(219, 234, 254, 0.2) 0%, transparent 70%)',
    bottom: '-150px',
    right: '-100px',
    animation: 'float 15s ease-in-out infinite reverse'
  },
  
  orb3: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(224, 242, 254, 0.15) 0%, transparent 70%)',
    top: '50%',
    right: '10%',
    animation: 'float 25s ease-in-out infinite'
  },
  
  gridPattern: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(14, 165, 233, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(14, 165, 233, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px'
  },
  
  contentWrapper: {
    maxWidth: '1400px',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    alignItems: 'center',
    zIndex: 1,
    position: 'relative'
  },
  
  brandingSection: {
    color: '#0f172a',
    padding: '2rem'
  },
  
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '3rem'
  },
  
  brandLogoContainer: {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(186, 230, 253, 0.5)',
    boxShadow: '0 8px 25px rgba(186, 230, 253, 0.3)'
  },
  
  brandLogo: {
    width: '36px',
    height: '36px',
    objectFit: 'contain'
  },
  
  brandText: {
    flex: 1
  },
  
  brandTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    margin: '0',
    letterSpacing: '-0.025em',
    color: '#0f172a'
  },
  
  brandTagline: {
    fontSize: '0.875rem',
    margin: '0.25rem 0 0 0',
    color: '#0ea5e9',
    fontWeight: '600'
  },
  
  mainTitle: {
    fontSize: '3rem',
    fontWeight: '800',
    lineHeight: '1.1',
    marginBottom: '1.5rem',
    letterSpacing: '-0.025em',
    color: '#0f172a'
  },
  
  highlightText: {
    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  
  description: {
    fontSize: '1.25rem',
    lineHeight: '1.6',
    marginBottom: '3rem',
    color: '#475569',
    fontWeight: '400'
  },
  
  featuresGrid: {
    display: 'grid',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  
  feature: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start'
  },
  
  featureIcon: {
    width: '48px',
    height: '48px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    flexShrink: 0
  },
  
  featureEmoji: {
    fontSize: '1.5rem'
  },
  
  featureContent: {
    flex: 1
  },
  
  featureTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0'
  },
  
  featureDescription: {
    fontSize: '0.875rem',
    margin: '0',
    opacity: 0.8,
    lineHeight: '1.4'
  },
  
  stepsSection: {
    marginTop: '2rem'
  },
  
  stepsTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1.5rem'
  },
  
  steps: {
    display: 'flex',
    gap: '2rem'
  },
  
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  
  stepNumber: {
    width: '32px',
    height: '32px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '600',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  
  stepText: {
    fontSize: '0.875rem',
    margin: '0',
    opacity: 0.9
  },
  
  formSection: {
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem'
  }
};

// Add CSS animations
const pageCSS = `
  @keyframes float {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    33% {
      transform: translateY(-20px) rotate(2deg);
    }
    66% {
      transform: translateY(-10px) rotate(-1deg);
    }
  }
  
  @media (max-width: 768px) {
    .content-wrapper {
      grid-template-columns: 1fr !important;
      gap: 2rem !important;
      text-align: center;
    }
    
    .main-title {
      fontSize: 2rem !important;
    }
    
    .features-grid {
      grid-template-columns: 1fr !important;
    }
    
    .steps {
      flex-direction: column !important;
      gap: 1rem !important;
    }
  }
  
  /* Smooth transitions for all interactive elements */
  * {
    transition: all 0.2s ease;
  }
  
  /* Enhanced glassmorphism effects */
  .brand-logo-container {
    backdrop-filter: blur(20px);
  }
  
  .feature-icon {
    backdrop-filter: blur(20px);
  }
`;

// Inject CSS if not already present
if (!document.querySelector('#modern-login-page-styles')) {
  const style = document.createElement('style');
  style.id = 'modern-login-page-styles';
  style.textContent = pageCSS;
  document.head.appendChild(style);
}