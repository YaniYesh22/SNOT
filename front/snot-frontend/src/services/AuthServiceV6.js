import { 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser, 
  fetchUserAttributes, 
  updateUserAttributes, 
  resetPassword, 
  confirmResetPassword,
  fetchAuthSession
} from 'aws-amplify/auth';

/**
 * Service class for authentication with AWS Amplify v6
 */
class AuthService {
  /**
   * Login user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<object>} - User data
   */
  async login(email, password) {
    try {
      const signInOutput = await signIn({ username: email, password });
      
      // Fetch user attributes after successful login
      try {
        const attributes = await fetchUserAttributes();
        
        // Store user info in localStorage
        if (attributes) {
          this.setUserData({
            email: attributes.email,
            name: attributes.name || 'User'
          });
        }
      } catch (attrError) {
        console.error('Error fetching user attributes:', attrError);
        // Fallback - set basic user data
        this.setUserData({
          email: email,
          name: 'User'
        });
      }
      
      return signInOutput;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Sign up a new user
   * @param {object} userData - User data for registration
   * @returns {Promise<object>} - Sign up result
   */
  async signUp(userData) {
    try {
      const { username, password, email, name } = userData;
      
      const result = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
            name
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }
  
  /**
   * Logout current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await signOut();
      this.clearUserData();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
  
  /**
   * Get current authenticated user
   * @returns {Promise<object|null>} - User data or null if not authenticated
   */
  async getCurrentUser() {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      // Update stored user data with attributes
      if (attributes) {
        this.setUserData({
          email: attributes.email,
          name: attributes.name || 'User'
        });
      }
      
      return { ...user, attributes };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
  
  /**
   * Refresh user data from Cognito
   * @returns {Promise<object|null>} - Updated user data or null if not authenticated
   */
  async refreshUserData() {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      if (attributes) {
        const userData = {
          email: attributes.email,
          name: attributes.name || 'User'
        };
        
        this.setUserData(userData);
        return userData;
      }
      
      return null;
    } catch (error) {
      console.error('Refresh user data error:', error);
      return null;
    }
  }
  
  /**
   * Get user data from localStorage
   * @returns {object|null} - User data or null if not found
   */
  getUserData() {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  }
  
  /**
   * Set user data in localStorage
   * @param {object} userData - User data to store
   */
  setUserData(userData) {
    try {
      localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Set user data error:', error);
    }
  }
  
  /**
   * Clear user data from localStorage
   */
  clearUserData() {
    try {
      localStorage.removeItem('userData');
    } catch (error) {
      console.error('Clear user data error:', error);
    }
  }
  
  /**
   * Update user attributes
   * @param {object} attributes - User attributes to update
   * @returns {Promise<object>} - Update result
   */
  async updateUserAttributes(attributes) {
    try {
      const result = await updateUserAttributes({ userAttributes: attributes });
      
      // Update stored user data
      const userData = this.getUserData();
      if (userData) {
        this.setUserData({
          ...userData,
          ...attributes
        });
      }
      
      return result;
    } catch (error) {
      console.error('Update user attributes error:', error);
      throw error;
    }
  }
  
  /**
   * Send a password reset code
   * @param {string} email - User's email
   * @returns {Promise} - Result
   */
  async forgotPassword(email) {
    try {
      return await resetPassword({ username: email });
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }
  
  /**
   * Complete the password reset process
   * @param {string} email - User's email
   * @param {string} code - Reset code
   * @param {string} newPassword - New password
   * @returns {Promise} - Result
   */
  async forgotPasswordSubmit(email, code, newPassword) {
    try {
      return await confirmResetPassword({ 
        username: email, 
        confirmationCode: code, 
        newPassword 
      });
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
  
  /**
   * Get the current user's session
   * @returns {Promise<object>} - The session object
   */
  async getCurrentSession() {
    try {
      const session = await fetchAuthSession();
      return session;
    } catch (error) {
      console.error('Get current session error:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const authService = new AuthService();
export default authService;
