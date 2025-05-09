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
      <form onSubmit={handleForgotPasswordSubmit} style={styles.form}>
        <div style={styles.header}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/2907/2907432.png"
            alt="SNOT Logo"
            style={styles.logo}
          />
          <h2 style={styles.title}>Reset Password</h2>
          <p style={styles.subtitle}>
            Enter your email address and we'll send you a code to reset your password.
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <button 
          type="submit" 
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Code'}
        </button>
        <p style={styles.footerText}>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              setForgotPassword(false);
            }}
            style={styles.link}
          >
            Back to login
          </a>
        </p>
      </form>
    );
  }

  // Confirm reset code and set new password
  if (forgotPassword === 'confirm') {
    return (
      <form onSubmit={handleResetPasswordSubmit} style={styles.form}>
        <div style={styles.header}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/2907/2907432.png"
            alt="SNOT Logo"
            style={styles.logo}
          />
          <h2 style={styles.title}>Create New Password</h2>
          <p style={styles.subtitle}>
            Enter the code we sent to your email and create a new password.
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <input
          type="text"
          placeholder="Reset Code"
          value={resetCode}
          onChange={e => setResetCode(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button 
          type="submit" 
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
        <p style={styles.footerText}>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              setForgotPassword(false);
            }}
            style={styles.link}
          >
            Back to login
          </a>
        </p>
      </form>
    );
  }

  // Regular login form
  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.header}>
        <img
          src="https://cdn-icons-png.flaticon.com/512/2907/2907432.png"
          alt="SNOT Logo"
          style={styles.logo}
        />
        <h2 style={styles.title}>Smart Notebook Login</h2>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={styles.input}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        style={styles.input}
      />
      <button 
        type="submit" 
        style={styles.button}
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Login'}
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
          Forgot Password?
        </a>
      </div>
      <p style={styles.footerText}>
        Don't have an account? <a href="#" onClick={onSwitch} style={styles.link}>Sign up</a>
      </p>
    </form>
  );
}

const styles = {
  form: {
    background: '#ffffff',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  logo: {
    width: '48px',
    height: '48px',
    marginBottom: '0.5rem'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.5rem',
    textAlign: 'center'
  },
  input: {
    marginBottom: '1rem',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#1f78ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginBottom: '0.5rem'
  },
  options: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem'
  },
  error: {
    color: 'red',
    backgroundColor: '#ffe5e5',
    padding: '0.5rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.95rem'
  },
  footerText: {
    textAlign: 'center',
    fontSize: '0.95rem',
    margin: '1rem 0 0 0',
    color: '#6b7280'
  },
  link: {
    color: '#1f78ff',
    textDecoration: 'none',
    fontWeight: '500'
  }
};