import authService from './AuthService';
import axios from 'axios';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  fetchUserAttributes,
  updateUserAttributes,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
  getAuthHeaders
} from 'aws-amplify/auth';

/**
 * Service class to handle notebook API operations
 */
class NotebookService {
  constructor() {
    // The base URL for API Gateway
    this.baseUrl = 'https://ch2l8cp5l3.execute-api.eu-central-1.amazonaws.com/dev';

    // The specific route for notebook operations
    this.notebookRoute = '/createNotbook';
    this.getAllNotebooksRoute = '/getAllNotebooks';
  }

  /**
   * Get authorization headers with Cognito token
   * @returns {Object} - Headers object
   */
  /**
   * Get authentication headers with JWT token
   * @returns {Promise<Object>} - Headers object with Authorization
   */
  
  /**
   * Create a new notebook in the database
   * @param {object} notebookData - Data for the new notebook
   * @returns {Promise<object>} - The created notebook
   */
  async createNotebook(notebookData) {
    try {
      // Get the current user info for the UserId
      const userData = authService.getUserData();

      // Generate a unique ID for the notebook
      const notebookId = `notebook_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Prepare the notebook data
      const payload = {
        NotebookId: notebookId,
        userId: userData?.email || 'guest', // Use email as user ID
        title: notebookData.title,
        Content: notebookData.content || '',
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        Order: notebookData.order || 0
      };

      console.log("Creating notebook with payload:", payload);

      // Get auth headers
      const headers = await this.getAuthHeaders();
      console.log("Using headers:", headers);

      // Make the API call to create the notebook
      const response = await axios.post(
        `${this.baseUrl}${this.notebookRoute}`,
        payload,
        { headers }
      );

      console.log("API response:", response);

      // Return the response data
      return {
        ...payload,
        ...response.data
      };
    } catch (error) {
      console.error('Error creating notebook:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      throw error;
    }
  }
  async getNotebooks() {
  try {
    // Get auth headers from auth service
    const headers = await authService.getAuthHeaders();
    
    // Get user data to extract email
    const userData = authService.getUserData();
    const userEmail = userData?.email || 'guest';
    
    console.log("Using headers:", headers);
    console.log("Fetching notebooks with auth for user:", userEmail);
    console.log(`API URL: ${this.baseUrl}${this.getAllNotebooksRoute}`);

    // Make API call with auth headers and userId in query string
    const response = await axios.get(
      `${this.baseUrl}${this.getAllNotebooksRoute}`,
      { 
        headers,
        params: {
          userId: userEmail  // Add email as userId in query string
        }
      }
    );

    console.log("Notebooks response:", response.data);

    // Process response data
    if (response.data && response.data.notebooks) {
      return response.data.notebooks;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  } catch (error) {
    // Enhanced error logging
    console.error('Error fetching notebooks:', error);

    // Log detailed error info
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
      console.error(`Headers:`, error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error creating request:', error.message);
    }

    throw error;
  }
}
  /**
   * Update an existing notebook
   * @param {string} notebookId - ID of the notebook to update
   * @param {object} notebookData - Updated notebook data
   * @returns {Promise<object>} - The updated notebook
   */
  async updateNotebook(notebookId, notebookData) {
    try {
      // Prepare the update data
      const payload = {
        NotebookId: notebookId,
        ...notebookData,
        UpdatedAt: new Date().toISOString()
      };

      // Ensure content is properly encoded if it's HTML
      if (payload.Content && typeof payload.Content === 'string') {
        // No explicit encoding needed as axios handles this,
        // but make sure the Content-Type is correct
      }

      // Get auth headers
      const headers = await this.getAuthHeaders();

      console.log("Updating notebook:", notebookId);

      // Make the API call to update the notebook
      const response = await axios.put(
        `${this.baseUrl}/updateNotebook`,
        payload,
        { headers }
      );

      console.log("Update response:", response.data);

      // Return the response data
      return response.data;
    } catch (error) {
      console.error('Error updating notebook:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      throw error;
    }
  }

  /**
   * Delete a notebook
   * @param {string} notebookId - ID of the notebook to delete
   * @returns {Promise<void>}
   */
  async deleteNotebook(notebookId) {
    try {
      // Get auth headers
      const headers = await this.getAuthHeaders();

      console.log("Deleting notebook:", notebookId);

      // Get current user data
      const userData = authService.getUserData();
      const userId = userData?.email || 'guest';

      // This is the correct structure based on your Lambda input
      const response = await axios.delete(
        `${this.baseUrl}/deleteNotbook`,
        {
          headers,
          data: {
            user_id: userId,  // This matches what your Lambda receives
            id: notebookId    // This matches what your Lambda receives
          }
        }
      );

      console.log("Delete response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting notebook:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');

      // Client-side fallback
      try {
        const savedNotebooks = localStorage.getItem('notebooks');
        if (savedNotebooks) {
          const notebooksArray = JSON.parse(savedNotebooks);
          const updatedNotebooks = notebooksArray.filter(notebook => notebook.id !== notebookId);
          localStorage.setItem('notebooks', JSON.stringify(updatedNotebooks));
          console.log("Notebook removed from localStorage successfully");
        }
      } catch (localError) {
        console.error("Error in localStorage fallback:", localError);
      }

      throw error;
    }
  }

  /**
   * Get a single notebook by ID
   * @param {string} notebookId - ID of the notebook to retrieve
   * @returns {Promise<object>} - The notebook
   */
  /**
 * Get a single notebook by ID
 * @param {string} notebookId - ID of the notebook to retrieve
 * @returns {Promise<object>} - The notebook
 */
  async getNotebook(notebookId) {
    try {
      // Get auth headers
      const headers = await this.getAuthHeaders();

      // Get user data to extract email
      const userData = authService.getUserData();
      const userEmail = userData?.email || 'guest';

      console.log("Fetching notebook:", notebookId, "for user:", userEmail);

      // Make the API call to get the notebook with userId in query string
      const response = await axios.get(
        `${this.baseUrl}/getNotebook/${notebookId}`,
        {
          headers,
          params: {
            userId: userEmail  // Add email as userId in query string
          }
        }
      );

      console.log("Get notebook response:", response.data);

      // Return the response data
      return response.data;
    } catch (error) {
      console.error('Error fetching notebook:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      throw error;
    }
  }
}

// Create a singleton instance
const notebookService = new NotebookService();

export default notebookService;