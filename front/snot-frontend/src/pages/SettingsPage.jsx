import React, { useState } from 'react';

import { Auth } from 'aws-amplify';
import Sidebar from '../components/Sidebar';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('light');
  const [aiEnabled, setAiEnabled] = useState(true);

  // In a real app, you would fetch the user's current info
  React.useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setEmail(user.attributes.email || '');
        setName(user.attributes.name || '');
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    
    fetchUserInfo();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(user, currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const user = await Auth.currentAuthenticatedUser();
      const result = await Auth.updateUserAttributes(user, {
        name,
      });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      
      <main style={styles.main}>
        <header style={styles.header}>
          <h1>Settings</h1>
        </header>
        
        <div style={styles.settingsContainer}>
          {/* Account Section */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Account Information</h2>
            
            <form onSubmit={handleProfileUpdate} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input 
                  type="email"
                  value={email}
                  disabled
                  style={styles.input}
                />
                <p style={styles.helpText}>Email address cannot be changed</p>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={styles.input}
                />
              </div>
              
              <button 
                type="submit" 
                style={styles.button}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </section>
          
          {/* Security Section */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Security</h2>
            
            <form onSubmit={handleChangePassword} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Current Password</label>
                <input 
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>New Password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm New Password</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              
              <button 
                type="submit" 
                style={styles.button}
                disabled={loading}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </section>
          
          {/* Preferences Section */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Preferences</h2>
            
            <div style={styles.preference}>
              <div style={styles.preferenceInfo}>
                <h3 style={styles.preferenceTitle}>Theme</h3>
                <p style={styles.preferenceDescription}>Choose between light and dark mode</p>
              </div>
              
              <div style={styles.preferenceControl}>
                <select 
                  value={theme} 
                  onChange={e => setTheme(e.target.value)}
                  style={styles.select}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
            </div>
            
            <div style={styles.preference}>
              <div style={styles.preferenceInfo}>
                <h3 style={styles.preferenceTitle}>AI Features</h3>
                <p style={styles.preferenceDescription}>Enable AI assistance for your notes</p>
              </div>
              
              <div style={styles.preferenceControl}>
                <label style={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={aiEnabled}
                    onChange={() => setAiEnabled(!aiEnabled)}
                  />
                  <span style={styles.slider}></span>
                </label>
              </div>
            </div>
          </section>
        </div>
        
        {message.text && (
          <div 
            style={{
              ...styles.message,
              backgroundColor: message.type === 'error' ? '#fee2e2' : '#ecfdf5',
              color: message.type === 'error' ? '#b91c1c' : '#065f46'
            }}
          >
            {message.text}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { 
    display: "flex", 
    height: "100vh"
  },
  main: {
    flexGrow: 1,
    background: '#f9fafb',
    padding: '2rem',
    overflowY: 'auto'
  },
  header: {
    marginBottom: '2rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '1rem'
  },
  settingsContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  section: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #f3f4f6'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '1rem'
  },
  helpText: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: '0.25rem 0 0 0'
  },
  button: {
    padding: '0.75rem 1rem',
    backgroundColor: '#1f78ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.95rem',
    marginTop: '0.5rem',
    alignSelf: 'flex-start'
  },
  preference: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '1rem',
    marginBottom: '1rem',
    borderBottom: '1px solid #f3f4f6'
  },
  preferenceInfo: {
    flex: '1'
  },
  preferenceTitle: {
    fontSize: '1rem',
    fontWeight: '500',
    margin: '0 0 0.25rem 0',
    color: '#374151'
  },
  preferenceDescription: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0
  },
  preferenceControl: {
    display: 'flex',
    alignItems: 'center'
  },
  select: {
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem'
  },
  // Toggle switch styles
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '50px',
    height: '24px'
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#e5e7eb',
    transition: '0.4s',
    borderRadius: '34px',
    ':before': {
      position: 'absolute',
      content: '',
      height: '16px',
      width: '16px',
      left: '4px',
      bottom: '4px',
      backgroundColor: 'white',
      transition: '0.4s',
      borderRadius: '50%'
    }
  },
  message: {
    maxWidth: '800px',
    margin: '1rem auto 0',
    padding: '1rem',
    borderRadius: '6px',
    fontSize: '0.95rem'
  }
};