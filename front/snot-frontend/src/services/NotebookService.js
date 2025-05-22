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
    
    // // Add tags from localStorage when API doesn't provide them
    // try {
    //   const localTags = localStorage.getItem('notebookTags');
    //   if (localTags) {
    //     const notebookTags = JSON.parse(localTags);
    //     notebooks = notebooks.map(notebook => {
    //       const id = notebook.notebookId || notebook.NotebookId;
          
    //       // If notebook already has tags property, keep it
    //       if (notebook.tags && Array.isArray(notebook.tags) && notebook.tags.length > 0) {
    //         return notebook;
    //       }
          
    //       // Otherwise, check if we have tags stored locally
    //       if (id && notebookTags[id]) {
    //         return {
    //           ...notebook,
    //           tags: notebookTags[id]
    //         };
    //       }
          
    //       // Default fallback
    //       return {
    //         ...notebook,
    //         tags: ['Uncategorized']
    //       };
    //     });
    //   }
    // } catch (e) {
    //   console.error("Failed to retrieve tags from localStorage:", e);
    // }
    
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
  // Get user data outside try block so it's accessible everywhere
  const userData = authService.getUserData();
  const userEmail = userData?.email || 'guest';
  
  // Make sure notebookId is defined and valid
  if (!notebookId) {
    console.error("Missing notebookId in updateNotebook call");
    
    // Try to get from notebookData if it's there
    notebookId = notebookData.notebookId || notebookData.NotebookId;
    
    if (!notebookId) {
      throw new Error("Notebook ID is required");
    }
  }
  
  console.log("Updating notebook with ID:", notebookId);
  
  try {
    // Get auth headers
    const headers = await authService.getAuthHeaders();

    // Create a simplified payload that matches the Lambda function's expectations
    const payload = {
      chunkNumber: notebookData.chunkNumber || 0,
      chunkContent: notebookData.chunkContent || notebookData.Content || notebookData.content || ''
    };
    
    // Optional fields - only add if they exist
    if (notebookData.title || notebookData.Title) {
      payload.title = notebookData.Title || notebookData.title;
    }
    
    if (notebookData.tags) {
      payload.tags = Array.isArray(notebookData.tags) ? 
        notebookData.tags : [notebookData.tags];
    }
    
    if (notebookData.connections) {
      payload.connections = Array.isArray(notebookData.connections) ? 
        notebookData.connections.filter(id => id !== undefined && id !== null) : 
        [];
    }
    
    // Add files and links if provided
    if (notebookData.files) {
      payload.files = notebookData.files;
    }
    
    if (notebookData.links) {
      payload.links = notebookData.links;
    }
    
    console.log("Updating notebook with payload:", payload);
    console.log("Request URL:", `${this.baseUrl}/updateNotebook/${notebookId}/update`);
    console.log("Headers:", {
      'Authorization': headers.Authorization ? 'Bearer [TOKEN]' : 'Missing',
      'Content-Type': 'application/json'
    });

    // Make the request
    const response = await axios.post(
      `${this.baseUrl}/updateNotebook/${notebookId}/update`,
      payload,
      { 
        headers: {
          'Authorization': headers.Authorization,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log("API Response:", response.data);

    // Update localStorage for consistency and fallback
    this._updateNotebookInLocalStorage(notebookId, {
      chunkContent: payload.chunkContent,
      title: payload.title,
      tags: payload.tags,
      files: payload.files,
      links: payload.links
    });

    return response.data;
  } catch (error) {
    console.error('Error updating notebook:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error details:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error creating request:', error.message);
    }
    
    // // Log request details for debugging
    // console.error('Request details:', {
    //   url: `${this.baseUrl}/updateNotebook/${notebookId}/update`,
    //   payload: payload,
    //   headers: headers
    // });
    
    // Use localStorage as fallback
    const result = this._updateNotebookInLocalStorage(notebookId, {
      chunkContent: notebookData.Content || notebookData.content,
      title: notebookData.Title || notebookData.title,
      tags: notebookData.tags,
      files: notebookData.files,
      links: notebookData.links
    });
    
    return result;
  }
}

// Updated helper method to handle files and links
_updateNotebookInLocalStorage(notebookId, updateData) {
  try {
    // Get all notebooks from localStorage
    const savedNotebooks = localStorage.getItem('notebooks');
    if (savedNotebooks) {
      const notebooksArray = JSON.parse(savedNotebooks);
      
      // First try to find by id
      let notebookIndex = notebooksArray.findIndex(nb => nb.id === notebookId);
      
      // If not found, try by notebookId
      if (notebookIndex === -1) {
        notebookIndex = notebooksArray.findIndex(nb => nb.notebookId === notebookId);
      }
      
      if (notebookIndex >= 0) {
        // Update the content if provided
        if (updateData.chunkContent) {
          notebooksArray[notebookIndex].content = updateData.chunkContent;
        }
        
        // Update title if provided
        if (updateData.title) {
          notebooksArray[notebookIndex].title = updateData.title;
        }
        
        // Update tags if provided
        if (updateData.tags) {
          notebooksArray[notebookIndex].tags = Array.isArray(updateData.tags) ? 
            updateData.tags : [updateData.tags];
        }
        
        // Update files if provided
        if (updateData.files) {
          notebooksArray[notebookIndex].files = updateData.files;
        }
        
        // Update links if provided
        if (updateData.links) {
          notebooksArray[notebookIndex].links = updateData.links;
        }
        
        // Ensure both id and notebookId properties exist
        notebooksArray[notebookIndex].id = notebookId;
        notebooksArray[notebookIndex].notebookId = notebookId;
        
        // Update lastUpdated timestamp
        notebooksArray[notebookIndex].updatedAt = new Date().toISOString();
        
        // Save back to localStorage
        localStorage.setItem('notebooks', JSON.stringify(notebooksArray));
        console.log("Notebook updated in localStorage");
        
        // Update tags in localStorage if provided
        if (updateData.tags) {
          try {
            const localTags = localStorage.getItem('notebookTags') || '{}';
            const notebookTags = JSON.parse(localTags);
            notebookTags[notebookId] = Array.isArray(updateData.tags) ? 
              updateData.tags : [updateData.tags];
            localStorage.setItem('notebookTags', JSON.stringify(notebookTags));
          } catch (e) {
            console.error("Failed to update tags in localStorage:", e);
          }
        }
        
        return {
          success: true,
          message: "Notebook updated in localStorage",
          notebookId: notebookId,
          updatedAt: notebooksArray[notebookIndex].updatedAt
        };
      }
    }
    
    return {
      success: false,
      message: "Notebook not found in localStorage",
      notebookId: notebookId
    };
  } catch (localError) {
    console.error("Error updating notebook in localStorage:", localError);
    throw localError;
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
 * @param {Object} options - Optional parameters
 * @param {number} options.chunk - Specific chunk to retrieve (0-based index)
 * @param {boolean} options.all - If true, return all chunks
 * @returns {Promise<object>} - The notebook data
 */
async getNotebook(notebookId, options = {}) {
    try {
        // Make sure notebookId is defined
        if (!notebookId) {
            throw new Error("Notebook ID is required");
        }

        console.log(`📖 Fetching notebook: ${notebookId}`);

        // Get auth headers - Lambda will extract email from JWT automatically
        const headers = await authService.getAuthHeaders();
        
        // Validate we have an auth token
        if (!headers.Authorization) {
            throw new Error("Authentication required - please login");
        }

        // Create query parameters based on options only
        const params = {};

        // Add optional chunk parameter if specified
        if (options.chunk !== undefined && options.chunk !== null) {
            params.chunk = options.chunk;
        }

        // Add optional all parameter if specified
        if (options.all === true) {
            params.all = 'true';
        }

        console.log("Request params:", params);

        // Make the API call - Lambda will extract email from JWT token
        const response = await axios.get(
            `${this.baseUrl}/getNotebook/${notebookId}`,
            {
                headers: {
                    'Authorization': headers.Authorization,
                    'Content-Type': 'application/json'
                },
                params: params
            }
        );

        console.log("✅ Response received successfully");

        // Process the response
        const notebookData = response.data;

        // Validate response structure
        if (!notebookData.metadata) {
            throw new Error("Invalid response format - missing metadata");
        }

        // Add tags from localStorage if needed
        try {
            const localTags = localStorage.getItem('notebookTags');
            if (localTags) {
                const notebookTags = JSON.parse(localTags);
                if (notebookId && notebookTags[notebookId] && 
                    (!notebookData.metadata?.tags || !notebookData.metadata.tags.length)) {
                    notebookData.metadata.tags = notebookTags[notebookId];
                }
            }
        } catch (e) {
            console.error("Failed to retrieve tags from localStorage:", e);
        }

        // Get the content from first chunk by default
        let content = '';
        if (notebookData.chunks && notebookData.chunks['0']) {
            content = notebookData.chunks['0'];
        }

        // Format the notebook into a standard structure
        const formattedNotebook = {
            notebookId: notebookId,
            title: notebookData.metadata?.title || 'Untitled Notebook',
            content: content,
            tags: notebookData.metadata?.tags || [],
            connections: notebookData.metadata?.connections || [],
            preview: notebookData.metadata?.preview || '',
            createdAt: notebookData.metadata?.createdAt || new Date().toISOString(),
            updatedAt: notebookData.metadata?.updatedAt || new Date().toISOString(),
            allChunks: notebookData.chunks || {}
        };

        console.log("✅ Notebook formatted successfully");
        return formattedNotebook;

    } catch (error) {
        console.error('❌ Error fetching notebook:', error);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            
            // Handle specific error cases with user-friendly messages
            if (error.response.status === 401) {
                throw new Error('Please login to access this notebook');
            } else if (error.response.status === 403) {
                throw new Error('You don\'t have permission to access this notebook');
            } else if (error.response.status === 404) {
                throw new Error('Notebook not found');
            } else if (error.response.status === 500) {
                throw new Error('Server error - please try again in a moment');
            }
        } else if (error.message.includes('Network Error')) {
            throw new Error('Connection error - please check your internet connection');
        }
        
        throw error;
    }
}

// Add this method to your NotebookService class

/**
 * Upload files to a notebook
 * @param {string} notebookId - ID of the notebook
 * @param {FileList|File[]} files - Files to upload
 * @returns {Promise<object[]>} - Array of upload results
 */
async uploadFiles(notebookId, files) {
  try {
    if (!notebookId) {
      throw new Error("Notebook ID is required");
    }

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    console.log(`📁 Uploading ${files.length} file(s) to notebook: ${notebookId}`);

    // Get auth headers
    const headers = await authService.getAuthHeaders();
    
    // Validate we have an auth token
    if (!headers.Authorization) {
      throw new Error("Authentication required - please login");
    }

    // Process each file
    const uploadPromises = Array.from(files).map(async (file) => {
      return await this.uploadSingleFile(notebookId, file, headers);
    });

    // Wait for all uploads to complete
    const results = await Promise.allSettled(uploadPromises);
    
    // Process results
    const successful = [];
    const failed = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          fileName: files[index].name,
          error: result.reason.message || 'Upload failed'
        });
      }
    });

    console.log(`✅ Upload complete: ${successful.length} successful, ${failed.length} failed`);
    
    return {
      successful,
      failed,
      totalUploaded: successful.length,
      totalFailed: failed.length
    };

  } catch (error) {
    console.error('❌ Error in file upload process:', error);
    throw error;
  }
}

/**
 * Upload a single file
 * @param {string} notebookId - Notebook ID
 * @param {File} file - File object
 * @param {object} headers - Auth headers
 * @returns {Promise<object>} - Upload result
 */
async uploadSingleFile(notebookId, file, headers) {
  try {
    // Validate file size (50MB limit)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error(`File "${file.name}" exceeds 50MB limit`);
    }

    // Validate file type
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.csv', '.xlsx', '.xls'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      throw new Error(`File type "${fileExt}" not supported. Allowed: ${allowedExtensions.join(', ')}`);
    }

    console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Convert file to base64
    const base64Content = await this.fileToBase64(file);

    // Prepare the request payload
    const payload = {
      fileName: file.name,
      fileContent: base64Content,
      contentType: file.type || this.getContentTypeFromExtension(fileExt)
    };

    // Make the upload request
    const response = await axios.post(
      `${this.baseUrl}/uploadFiles/${notebookId}`,
      payload,
      {
        headers: {
          'Authorization': headers.Authorization,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout for large files
      }
    );

    console.log(`✅ File uploaded successfully: ${file.name}`);
    
    return {
      ...response.data.file,
      originalFile: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    };

  } catch (error) {
    console.error(`❌ Error uploading file "${file.name}":`, error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      // Handle specific error cases
      if (error.response.status === 400) {
        throw new Error(`File validation failed: ${error.response.data.error || 'Invalid file'}`);
      } else if (error.response.status === 401) {
        throw new Error('Authentication required - please login');
      } else if (error.response.status === 403) {
        throw new Error('You don\'t have permission to upload to this notebook');
      } else if (error.response.status === 404) {
        throw new Error('Notebook not found');
      } else if (error.response.status === 413) {
        throw new Error('File too large - maximum 50MB allowed');
      }
    }
    
    throw error;
  }
}

/**
 * Convert file to base64
 * @param {File} file - File object
 * @returns {Promise<string>} - Base64 encoded content
 */
fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Get content type from file extension
 * @param {string} extension - File extension with dot
 * @returns {string} - MIME type
 */
getContentTypeFromExtension(extension) {
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.csv': 'text/csv',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel'
  };
  
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Get uploaded files for a notebook
 * @param {string} notebookId - Notebook ID
 * @returns {Promise<object[]>} - Array of file metadata
 */
async getNotebookFiles(notebookId) {
  try {
    if (!notebookId) {
      throw new Error("Notebook ID is required");
    }

    console.log(`📁 Fetching files for notebook: ${notebookId}`);

    // Get auth headers
    const headers = await authService.getAuthHeaders();
    
    // Make the request to get files (you'll need to implement this endpoint)
    const response = await axios.get(
      `${this.baseUrl}/notebooks/${notebookId}/files`,
      {
        headers: {
          'Authorization': headers.Authorization,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Retrieved ${response.data.files?.length || 0} files`);
    
    return response.data.files || [];

  } catch (error) {
    console.error('❌ Error fetching notebook files:', error);
    
    if (error.response?.status === 404) {
      // No files found, return empty array
      return [];
    }
    
    throw error;
  }
}

/**
 * Delete a file from a notebook
 * @param {string} notebookId - Notebook ID
 * @param {string} fileId - File ID to delete
 * @returns {Promise<object>} - Delete result
 */
async deleteFile(notebookId, fileId) {
  try {
    if (!notebookId || !fileId) {
      throw new Error("Notebook ID and File ID are required");
    }

    console.log(`🗑️ Deleting file: ${fileId} from notebook: ${notebookId}`);

    // Get auth headers
    const headers = await authService.getAuthHeaders();
    
    // Make the delete request
    const response = await axios.delete(
      `${this.baseUrl}/notebooks/${notebookId}/files/${fileId}`,
      {
        headers: {
          'Authorization': headers.Authorization,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ File deleted successfully: ${fileId}`);
    
    return response.data;

  } catch (error) {
    console.error('❌ Error deleting file:', error);
    throw error;
  }
}
}

// Create a singleton instance
const notebookService = new NotebookService();

export default notebookService;