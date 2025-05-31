import React, { useState } from 'react';
import { signIn, signOut, signUp, confirmSignUp, getCurrentUser, fetchUserAttributes, updateUserAttributes, resetPassword, confirmResetPassword, fetchAuthSession, resendSignUpCode } from 'aws-amplify/auth';

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
      const signUpResult = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name
          },
          autoSignIn: {
            enabled: false // Prevent auto sign-in after verification
          }
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
      await confirmSignUp({ 
        username: email, 
        confirmationCode: verificationCode 
      });
      
      setError('');
      
      // Automatically sign in the user after successful verification
      try {
        const user = await signIn({ 
          username: email, 
          password: signupData.password 
        });
        
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
      await resendSignUpCode({ 
        username: email 
      });
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
      <div style={styles.container}>
        <form onSubmit={handleVerification} style={styles.form}>
          <div style={styles.header}>
            <div style={styles.logoContainer}>
              <img
                src="/SNOTLOGO.png"
                alt="SNOT Logo"
                style={styles.logo}
              />
            </div>
            <h2 style={styles.title}>Verify Your Account</h2>
            <p style={styles.subtitle}>
              We've sent a verification code to:
            </p>
            <p style={styles.emailHighlight}>
              {email}
            </p>
            <p style={styles.instructions}>
              Please check your email and enter the code below to complete your registration.
            </p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.inputGroup}>
            <input
              type="text"
              placeholder="Enter 6-digit verification code"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              required
              style={styles.input}
              maxLength={6}
              autoFocus
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
                Verifying...
              </div>
            ) : 'Verify & Complete Signup'}
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
              ← Back to sign up
            </button>
          </div>
          
          <p style={styles.footerText}>
            Code not received? Check your spam folder or try resending.
          </p>
        </form>
      </div>
    );
  }

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
          <h2 style={styles.title}>Create your account</h2>
          <p style={styles.subtitle}>Join SNOT and start organizing your thoughts</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.inputGroup}>
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        
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
        
        <div style={styles.inputGroup}>
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        
        <div style={styles.passwordHint}>
          <div style={styles.passwordHintTitle}>Password requirements:</div>
          <ul style={styles.hintList}>
            <li style={password.length >= 8 ? styles.validHint : styles.invalidHint}>
              <span style={styles.checkIcon}>{password.length >= 8 ? '✓' : '○'}</span>
              At least 8 characters
            </li>
            <li style={/[A-Z]/.test(password) ? styles.validHint : styles.invalidHint}>
              <span style={styles.checkIcon}>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
              One uppercase letter
            </li>
            <li style={/[a-z]/.test(password) ? styles.validHint : styles.invalidHint}>
              <span style={styles.checkIcon}>{/[a-z]/.test(password) ? '✓' : '○'}</span>
              One lowercase letter
            </li>
            <li style={/\d/.test(password) ? styles.validHint : styles.invalidHint}>
              <span style={styles.checkIcon}>{/\d/.test(password) ? '✓' : '○'}</span>
              One number
            </li>
            <li style={/[@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password) ? styles.validHint : styles.invalidHint}>
              <span style={styles.checkIcon}>{/[@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password) ? '✓' : '○'}</span>
              One special character
            </li>
          </ul>
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
              Creating Account...
            </div>
          ) : 'Create Account'}
        </button>
        
        <div style={styles.divider}>
          <span style={styles.dividerText}>or</span>
        </div>
        
        <div style={styles.footerText}>
          Already have an account?{' '}
          <a href="#" onClick={onSwitch} style={styles.linkPrimary}>
            Sign in
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
    padding: '2rem 2rem',
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
    marginBottom: '1.5rem',
    textAlign: 'center'
  },
  logoContainer: {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    boxShadow: '0 8px 25px rgba(186, 230, 253, 0.4)',
    border: '2px solid rgba(186, 230, 253, 0.5)'
  },
  logo: {
    width: '36px',
    height: '36px',
    objectFit: 'contain'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    margin: '0 0 0.25rem 0',
    color: '#0f172a',
    letterSpacing: '-0.025em'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: '0',
    fontWeight: '400'
  },
  emailHighlight: {
    fontSize: '0.875rem',
    color: '#0ea5e9',
    fontWeight: '600',
    margin: '0.5rem 0',
    padding: '0.5rem 1rem',
    background: 'rgba(14, 165, 233, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(14, 165, 233, 0.2)'
  },
  instructions: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginTop: '0.5rem',
    lineHeight: '1.4'
  },
  inputGroup: {
    marginBottom: '1rem',
    position: 'relative'
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    fontSize: '0.95rem',
    border: '2px solid #e0f2fe',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#0f172a',
    fontWeight: '500'
  },
  button: {
    width: '100%',
    padding: '0.875rem 1rem',
    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '1rem',
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
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  divider: {
    position: 'relative',
    textAlign: 'center',
    marginBottom: '1rem'
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
  passwordHint: {
    background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)',
    border: '1px solid rgba(186, 230, 253, 0.3)',
    borderRadius: '10px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  passwordHintTitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '0.5rem'
  },
  hintList: {
    margin: 0,
    padding: 0,
    listStyle: 'none'
  },
  validHint: {
    color: '#059669',
    fontWeight: '500',
    marginBottom: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem'
  },
  invalidHint: {
    color: '#64748b',
    marginBottom: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem'
  },
  checkIcon: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    fontWeight: '700',
    flexShrink: 0
  },
  footerText: {
    textAlign: 'center',
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: '500'
  },
  verificationActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
    alignItems: 'center'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: '0.5rem',
    fontWeight: '500',
    transition: 'color 0.2s ease',
    borderRadius: '6px'
  },
  linkPrimary: {
    color: '#0ea5e9',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.2s ease'
  }
};

// Add CSS animations and enhanced styles
const signupCSS = `
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
  }
  
  button[type="submit"]:not(:disabled):hover {
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4) !important;
  }
  
  /* Link hover styles */
  .linkButton:hover {
    color: #0ea5e9 !important;
    background: rgba(14, 165, 233, 0.1) !important;
  }
  
  a:hover {
    color: #0284c7 !important;
  }
  
  /* Enhanced glassmorphism effect */
  .signup-form::before {
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
  
  /* Password hint animations */
  .hintList li {
    transition: all 0.3s ease;
  }
`;

// Inject CSS if not already present
if (!document.querySelector('#modern-signup-styles')) {
  const style = document.createElement('style');
  style.id = 'modern-signup-styles';
  style.textContent = signupCSS;
  document.head.appendChild(style);
}