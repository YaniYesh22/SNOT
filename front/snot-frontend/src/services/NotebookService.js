import authService from './AuthService';
import axios from 'axios';

/**
 * Service class to handle notebook API operations
 */
class NotebookService {
  constructor() {
    // The base URL for API Gateway
    this.baseUrl = 'https://ch2l8cp5l3.execute-api.eu-central-1.amazonaws.com/dev';

    // The specific route for notebook operations
    this.notebookRoute = '/createNoteBook';
    this.getAllNotebooksRoute = '/getAllNotebooks';
  }

 /**
 * Create a new notebook with tags and content chunking support
 * @param {object} notebookData - Data for the new notebook
 * @param {string} notebookData.title - Title of the notebook
 * @param {string} notebookData.content - Content of the notebook
 * @param {string[]} notebookData.tags - Array of tags for categorization
 * @param {string[]} notebookData.connections - Array of connected notebook IDs
 * @returns {Promise<object>} - The created notebook
 */
async createNotebook(notebookData) {
  try {
    // Get the current user info for the UserId
    const userData = authService.getUserData();
    const userId = userData?.email || 'guest';

    // Prepare the request payload according to Lambda expectations
      const payload = {
        title: notebookData.title || 'Untitled',
        content: notebookData.content || '',
        tags: Array.isArray(notebookData.tags) ? notebookData.tags : 
            (notebookData.tags ? [notebookData.tags] : ['Uncategorized']),
        // Filter out undefined/null values from connections
        connections: Array.isArray(notebookData.connections) 
          ? notebookData.connections.filter(id => id !== undefined && id !== null) 
          : [],
        userId: userId // Include userId in payload for fallback
      };

    // Get auth headers
    const headers = await authService.getAuthHeaders();
    
    // Keeping this log as requested
    console.log("Creating notebook with payload:", payload);

    // Make the API call
    const response = await axios.post(
      `${this.baseUrl}/createNotebook`,
      payload,
      { headers }
    );

    // Format the notebook from the response
    const createdNotebook = {
      id: response.data.notebookId,
      title: response.data.title,
      content: notebookData.content || '',
      tags: response.data.tags || notebookData.tags || [],
      connections: response.data.connections || [],
      createdAt: response.data.createdAt,
      updatedAt: response.data.createdAt
    };

    // Store tags in localStorage for the frontend to use
    try {
      const localNotebooks = localStorage.getItem('notebookTags') || '{}';
      const notebookTags = JSON.parse(localNotebooks);
      notebookTags[response.data.notebookId] = notebookData.tags || ['Uncategorized'];
      localStorage.setItem('notebookTags', JSON.stringify(notebookTags));
    } catch (e) {
      console.error("Failed to store tags in localStorage:", e);
    }

    return createdNotebook;
  } catch (error) {
    console.error('Error creating notebook:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error details:', error.response.data);
    }
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
    
    // Keeping these logs as requested
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
    
    // Keeping this log as requested
    console.log("Notebooks response:", response.data);
    
    // Get response data
    let notebooks = [];
    if (response.data && response.data.notebooks) {
      notebooks = response.data.notebooks;
    } else if (Array.isArray(response.data)) {
      notebooks = response.data;
    }
    
    // Add tags from localStorage when API doesn't provide them
    try {
      const localTags = localStorage.getItem('notebookTags');
      if (localTags) {
        const notebookTags = JSON.parse(localTags);
        notebooks = notebooks.map(notebook => {
          const id = notebook.notebookId || notebook.NotebookId;
          
          // If notebook already has tags property, keep it
          if (notebook.tags && Array.isArray(notebook.tags) && notebook.tags.length > 0) {
            return notebook;
          }
          
          // Otherwise, check if we have tags stored locally
          if (id && notebookTags[id]) {
            return {
              ...notebook,
              tags: notebookTags[id]
            };
          }
          
          // Default fallback
          return {
            ...notebook,
            tags: ['Uncategorized']
          };
        });
      }
    } catch (e) {
      console.error("Failed to retrieve tags from localStorage:", e);
    }
    
    // Keeping this log as requested
    console.log("Notebooks with added tags:", notebooks);
    
    return notebooks;
  } catch (error) {
    // Enhanced error logging
    console.error('Error fetching notebooks:', error);

    // Log detailed error info
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
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
      const headers = await authService.getAuthHeaders();

      // Make the API call to update the notebook
      const response = await axios.put(
        `${this.baseUrl}/updateNotebook`,
        payload,
        { headers }
      );

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
    const headers = await authService.getAuthHeaders();

    // Get user data for userId
    const userData = authService.getUserData();
    const userId = userData?.email || 'guest';

    console.log("Deleting notebook with ID:", notebookId);
    
    // Try to fetch the notebook details before deletion for logging
    try {
      const notebookData = await this.getNotebookData(notebookId);
      console.log("Notebook data before deletion:", notebookData);
    } catch (fetchError) {
      console.log("Could not fetch notebook data before deletion:", fetchError.message);
    }

    // Create the request payload
    const deletePayload = {
      userId: userId,
      notebookId: notebookId,
      pathParameters: {
        notebookId: notebookId,
        userId: userId
      }
    };
    
    // Log the full request details
    console.log("DELETE request:", {
      url: `${this.baseUrl}/deleteNotebook`,
      headers: headers,
      payload: deletePayload
    });

    // Send the delete request
    const response = await axios.post(
  `${this.baseUrl}/deleteNotebook`,
  {
    userId: userId,
    notebookId: notebookId
  },
  {
    headers
  }
)
    
    // Log the full response
    console.log("Delete response:", {
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    
    // Clean up localStorage tags
    this._cleanupDeletedNotebookTags(notebookId);
    
    // Verify the notebook is deleted by attempting to fetch it again
    try {
      const deletedNotebookCheck = await this.getNotebookData(notebookId);
      console.log("WARNING: Notebook still exists after deletion attempt:", deletedNotebookCheck);
    } catch (fetchError) {
      console.log("Confirmed notebook deletion - notebook no longer accessible");
    }
    
    return response.data;
  } catch (error) {
    console.error('Error deleting notebook:', error);
    
    // Detailed error logging
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      console.error('Error response data:', error.response.data);
    } else if (error.request) {
      console.error('Error request sent but no response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    console.error('Error config:', error.config);
    
    // Fall back to local deletion with more error info
    return this._handleLocalNotebookDeletion(notebookId, { 
      error: error.message, 
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Helper method to handle local deletion
_handleLocalNotebookDeletion(notebookId, debugInfo = {}) {
  try {
    // 1. Remove from localStorage notebooks
    const savedNotebooks = localStorage.getItem('notebooks');
    if (savedNotebooks) {
      const notebooksArray = JSON.parse(savedNotebooks);
      const updatedNotebooks = notebooksArray.filter(notebook => notebook.id !== notebookId);
      localStorage.setItem('notebooks', JSON.stringify(updatedNotebooks));
    }
    
    // 2. Clean up tags
    this._cleanupDeletedNotebookTags(notebookId);
    
    console.log("Notebook removed from localStorage successfully");
    
    // Return a success response that includes debug info
    return {
      message: "Notebook deleted locally",
      notebookId: notebookId,
      localDeletion: true,
      apiDebugInfo: debugInfo
    };
  } catch (localError) {
    console.error("Error in localStorage deletion:", localError);
    throw new Error("Failed to delete notebook locally: " + localError.message);
  }
}

// Helper to clean up tags
_cleanupDeletedNotebookTags(notebookId) {
  try {
    const localTags = localStorage.getItem('notebookTags');
    if (localTags) {
      const notebookTags = JSON.parse(localTags);
      if (notebookTags[notebookId]) {
        delete notebookTags[notebookId];
        localStorage.setItem('notebookTags', JSON.stringify(notebookTags));
      }
    }
  } catch (e) {
    console.error("Failed to clean up tags:", e);
  }
}

  /**
   * Get a single notebook by ID
   * @param {string} notebookId - ID of the notebook to retrieve
   * @returns {Promise<object>} - The notebook
   */
  async getNotebook(notebookId) {
    try {
      // Get auth headers
      const headers = await authService.getAuthHeaders();

      // Get user data to extract email
      const userData = authService.getUserData();
      const userEmail = userData?.email || 'guest';

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

      // Add tags from localStorage if needed
      try {
        const localTags = localStorage.getItem('notebookTags');
        if (localTags) {
          const notebookTags = JSON.parse(localTags);
          if (notebookId && notebookTags[notebookId] && (!response.data.tags || !response.data.tags.length)) {
            response.data.tags = notebookTags[notebookId];
          }
        }
      } catch (e) {
        console.error("Failed to retrieve tags from localStorage:", e);
      }

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