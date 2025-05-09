import { Auth } from 'aws-amplify';

/**
 * Service class to handle authentication operations and user data
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
      const user = await Auth.signIn(email, password);
      
      // Store user info in localStorage
      if (user && user.attributes) {
        this.setUserData({
          email: user.attributes.email,
          name: user.attributes.name || 'User'
        });
      }
      
      return user;
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
      
      const result = await Auth.signUp({
        username,
        password,
        attributes: {
          email,
          name
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
      await Auth.signOut();
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
      const user = await Auth.currentAuthenticatedUser();
      
      // Update stored user data
      if (user && user.attributes) {
        this.setUserData({
          email: user.attributes.email,
          name: user.attributes.name || 'User'
        });
      }
      
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
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
      const user = await Auth.currentAuthenticatedUser();
      const result = await Auth.updateUserAttributes(user, attributes);
      
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
}

// Create a singleton instance
const authService = new AuthService();

export default authService;