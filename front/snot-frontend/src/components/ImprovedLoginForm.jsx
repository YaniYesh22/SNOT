import React, { useState } from 'react';

import authService from '../services/AuthService';

export default function LoginForm({ onSubmit, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const user = await authService.login(email, password);
      onSubmit(user);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await authService.forgotPassword(email);
      setForgotPassword('confirm');
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error.message || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await authService.forgotPasswordSubmit(email, resetCode, newPassword);
      setError('');
      setForgotPassword(false);
      // Show success message
      alert('Password reset successful. You can now log in with your new password.');
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password request form
  if (forgotPassword === true) {
    return (
      <div style={styles.container}>
        <form onSubmit={handleForgotPasswordSubmit} style={styles.form}>
          <div style={styles.header}>
            <div style={styles.logoContainer}>
              <img
                src="/SNOTLOGO.png"
                alt="SNOT Logo"
                style={styles.logo}
              />
            </div>
            <h2 style={styles.title}>Reset Password</h2>
            <p style={styles.subtitle}>
              Enter your email address and we'll send you a code to reset your password.
            </p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.inputGroup}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          
          <button 
            type="submit" 
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonLoading : {})
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={styles.buttonContent}>
                <div style={styles.spinner}></div>
                Sending...
              </div>
            ) : 'Send Reset Code'}
          </button>
          
          <div style={styles.footerLinks}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setForgotPassword(false);
              }}
              style={styles.link}
            >
              ← Back to login
            </a>
          </div>
        </form>
      </div>
    );
  }

  // Confirm reset code and set new password
  if (forgotPassword === 'confirm') {
    return (
      <div style={styles.container}>
        <form onSubmit={handleResetPasswordSubmit} style={styles.form}>
          <div style={styles.header}>
            <div style={styles.logoContainer}>
              <img
                src="/SNOTLOGO.png"
                alt="SNOT Logo"
                style={styles.logo}
              />
            </div>
            <h2 style={styles.title}>Create New Password</h2>
            <p style={styles.subtitle}>
              Enter the code we sent to your email and create a new password.
            </p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.inputGroup}>
            <input
              type="text"
              placeholder="Reset code"
              value={resetCode}
              onChange={e => setResetCode(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          
          <button 
            type="submit" 
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonLoading : {})
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={styles.buttonContent}>
                <div style={styles.spinner}></div>
                Resetting...
              </div>
            ) : 'Reset Password'}
          </button>
          
          <div style={styles.footerLinks}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setForgotPassword(false);
              }}
              style={styles.link}
            >
              ← Back to login
            </a>
          </div>
        </form>
      </div>
    );
  }

  // Regular login form
  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <img
              src="/SNOTLOGO.png"
              alt="SNOT Logo"
              style={styles.logo}
            />
          </div>
          <h2 style={styles.title}>Welcome back</h2>
          <p style={styles.subtitle}>Sign in to your SNOT account</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.inputGroup}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        
        <div style={styles.inputGroup}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        
        <button 
          type="submit" 
          style={{
            ...styles.button,
            ...(isLoading ? styles.buttonLoading : {})
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <div style={styles.buttonContent}>
              <div style={styles.spinner}></div>
              Signing in...
            </div>
          ) : 'Sign in'}
        </button>
        
        <div style={styles.options}>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              setForgotPassword(true);
            }}
            style={styles.link}
          >
            Forgot your password?
          </a>
        </div>
        
        <div style={styles.divider}>
          <span style={styles.dividerText}>or</span>
        </div>
        
        <div style={styles.footerText}>
          Don't have an account?{' '}
          <a href="#" onClick={onSwitch} style={styles.linkPrimary}>
            Sign up for free
          </a>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '420px',
    margin: '0 auto'
  },
  form: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    padding: '3rem 2.5rem',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 25px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(186, 230, 253, 0.3)',
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '2.5rem',
    textAlign: 'center'
  },
  logoContainer: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    boxShadow: '0 12px 40px rgba(186, 230, 253, 0.4)',
    border: '2px solid rgba(186, 230, 253, 0.5)'
  },
  logo: {
    width: '50px',
    height: '50px',
    objectFit: 'contain'
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    margin: '0 0 0.5rem 0',
    color: '#0f172a',
    letterSpacing: '-0.025em'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748b',
    margin: '0',
    fontWeight: '400'
  },
  inputGroup: {
    marginBottom: '1.5rem',
    position: 'relative'
  },
  input: {
    width: '100%',
    padding: '1rem 1.25rem',
    fontSize: '1rem',
    border: '2px solid #e0f2fe',
    borderRadius: '12px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#0f172a',
    fontWeight: '500',
    '::placeholder': {
      color: '#94a3b8'
    }
  },
  button: {
    width: '100%',
    padding: '1rem 1.25rem',
    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)',
    position: 'relative',
    overflow: 'hidden'
  },
  buttonLoading: {
    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    cursor: 'not-allowed',
    boxShadow: '0 4px 14px rgba(100, 116, 139, 0.3)'
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  options: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  },
  divider: {
    position: 'relative',
    textAlign: 'center',
    marginBottom: '1.5rem',
    '::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '0',
      right: '0',
      height: '1px',
      background: '#e0f2fe'
    }
  },
  dividerText: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '0 1rem',
    color: '#94a3b8',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  error: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '1rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    textAlign: 'center'
  },
  footerText: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500'
  },
  footerLinks: {
    textAlign: 'center',
    marginTop: '1.5rem'
  },
  link: {
    color: '#64748b',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'color 0.2s ease',
    ':hover': {
      color: '#0ea5e9'
    }
  },
  linkPrimary: {
    color: '#0ea5e9',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.2s ease',
    ':hover': {
      color: '#0284c7'
    }
  }
};

// Add CSS animations
const loginCSS = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Input focus styles */
  input:focus {
    border-color: #0ea5e9 !important;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1) !important;
    transform: translateY(-1px);
  }
  
  input::placeholder {
    color: #94a3b8 !important;
  }
  
  /* Button hover styles */
  button:not(:disabled):hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4) !important;
  }
  
  /* Link hover styles */
  a:hover {
    color: #0ea5e9 !important;
  }
  
  /* Glassmorphism effect enhancement */
  .login-form::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(186, 230, 253, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
    border-radius: 24px;
  }
`;

// Inject CSS if not already present
if (!document.querySelector('#modern-login-styles')) {
  const style = document.createElement('style');
  style.id = 'modern-login-styles';
  style.textContent = loginCSS;
  document.head.appendChild(style);
}