import React, { useState } from 'react';
import { changePassword, confirmSignUp, currentAuthenticatedUser, forgotPassword, forgotPasswordSubmit, signIn, signOut, signUp, updateUserAttributes } from 'aws-amplify/auth';

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
  const [signupData, setSignupData] = useState(null);

  const validateForm = () => {
    setError('');
    if (!name) return 'Name is required';
    if (!email) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address';
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*()_+\-=\[\]{};':"\\|,.<>?])/.test(password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }
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
      const signUpResult = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          name
        },
        autoSignIn: {
          enabled: false // Prevent auto sign-in after verification
        }
      });

      // Store signup data for after verification
      setSignupData({
        email,
        name,
        password
      });

      setShowVerification(true);
      setError('');
    } catch (err) {
      console.error('Signup error:', err);
      if (err.code === 'UsernameExistsException') {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(err.message || 'Failed to sign up. Please try again.');
      }
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
      // Confirm the signup with the verification code
      await Auth.confirmSignUp(email, verificationCode);
      
      setError('');
      
      // Automatically sign in the user after successful verification
      try {
        const user = await Auth.signIn(email, signupData.password);
        
        // Store user info
        if (onSignupSuccess) {
          onSignupSuccess({ email, name: signupData.name });
        }
      } catch (signInError) {
        console.error('Auto sign-in failed:', signInError);
        // If auto sign-in fails, just notify success
        if (onSignupSuccess) {
          onSignupSuccess({ email, name: signupData.name });
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      if (err.code === 'CodeMismatchException') {
        setError('Invalid verification code. Please check and try again.');
      } else if (err.code === 'ExpiredCodeException') {
        setError('Verification code has expired. Please request a new one.');
      } else {
        setError(err.message || 'Failed to verify account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    setIsLoading(true);
    try {
      await Auth.resendSignUp(email);
      setError('');
      alert('A new verification code has been sent to your email.');
    } catch (err) {
      console.error('Resend code error:', err);
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const backToSignUp = () => {
    setShowVerification(false);
    setError('');
    setVerificationCode('');
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
            We've sent a verification code to:
            <br />
            <strong>{email}</strong>
          </p>
          <p style={styles.instructions}>
            Please check your email and enter the code below to complete your registration.
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <input
          type="text"
          placeholder="Enter 6-digit verification Code"
          value={verificationCode}
          onChange={e => setVerificationCode(e.target.value)}
          required
          style={styles.input}
          maxLength={6}
          autoFocus
        />
        
        <button 
          type="submit" 
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify & Complete Signup'}
        </button>
        
        <div style={styles.verificationActions}>
          <button
            type="button"
            onClick={resendVerificationCode}
            style={styles.linkButton}
            disabled={isLoading}
          >
            Resend verification code
          </button>
          
          <button
            type="button"
            onClick={backToSignUp}
            style={styles.linkButton}
          >
            Back to sign up
          </button>
        </div>
        
        <p style={styles.footerText}>
          Code not received? Check your spam folder or try resending.
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
        placeholder="Password (8+ characters)"
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
      
      <div style={styles.passwordHint}>
        Password must contain:
        <ul style={styles.hintList}>
          <li style={password.length >= 8 ? styles.validHint : {}}>At least 8 characters</li>
          <li style={/[A-Z]/.test(password) ? styles.validHint : {}}>One uppercase letter</li>
          <li style={/[a-z]/.test(password) ? styles.validHint : {}}>One lowercase letter</li>
          <li style={/\d/.test(password) ? styles.validHint : {}}>One number</li>
          <li style={/[@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password) ? styles.validHint : {}}>One special character (@#$%^&*...)</li>
        </ul>
      </div>
      
      <button 
        type="submit" 
        style={styles.button}
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Sign Up'}
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
  instructions: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.75rem',
    textAlign: 'center',
    lineHeight: '1.4'
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
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.95rem',
    textAlign: 'center'
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
  },
  passwordHint: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px'
  },
  hintList: {
    margin: '0.5rem 0 0 1.5rem',
    padding: 0,
    listStyle: 'disc'
  },
  validHint: {
    color: '#16a34a'
  },
  verificationActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#1f78ff',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '0.95rem',
    padding: '0.5rem'
  }
};