import React, { useState } from 'react';

import { Auth } from 'aws-amplify';

export default function SignupForm({ onSwitch, onSignupSuccess }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  const validateForm = () => {
    setError('');
    if (!name) return 'Name is required';
    if (!email) return 'Email is required';
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          name // Include the user's name in the attributes
        }
      });
      setShowVerification(true);
      setError('');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!verificationCode) {
      setError('Verification code is required');
      return;
    }

    setIsLoading(true);
    try {
      await Auth.confirmSignUp(email, verificationCode);
      setError('');
      if (onSignupSuccess) {
        onSignupSuccess({ email, name });
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify account');
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return (
      <form onSubmit={handleVerification} style={styles.form}>
        <div style={styles.header}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/2907/2907432.png"
            alt="SNOT Logo"
            style={styles.logo}
          />
          <h2 style={styles.title}>Verify Your Account</h2>
          <p style={styles.subtitle}>
            We've sent a verification code to your email address.
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <input
          type="text"
          placeholder="Verification Code"
          value={verificationCode}
          onChange={e => setVerificationCode(e.target.value)}
          required
          style={styles.input}
        />
        <button 
          type="submit" 
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify Account'}
        </button>
        <p style={styles.footerText}>
          <a href="#" 
            onClick={(e) => {
              e.preventDefault();
              setShowVerification(false);
            }}
            style={styles.link}
          >
            Back to sign up
          </a>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.header}>
        <img
          src="https://cdn-icons-png.flaticon.com/512/2907/2907432.png"
          alt="SNOT Logo"
          style={styles.logo}
        />
        <h2 style={styles.title}>Sign Up for Smart Notebook</h2>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        style={styles.input}
      />
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
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        required
        style={styles.input}
      />
      <button 
        type="submit" 
        style={styles.button}
        disabled={isLoading}
      >
        {isLoading ? 'Signing up...' : 'Sign Up'}
      </button>
      <p style={styles.footerText}>
        Already have an account? <a href="#" onClick={onSwitch} style={styles.link}>Log in</a>
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