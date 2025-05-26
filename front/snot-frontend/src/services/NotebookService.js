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
    this.youtubeRoute = '/youtube_video';

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
      notebookId: response.data.notebookId, // Ensure both properties exist
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
 * Update an existing notebook - Fixed to match Lambda expectations
 * @param {string} notebookId - ID of the notebook to update
 * @param {object} notebookData - Updated notebook data
 * @returns {Promise<object>} - The updated notebook
 */
async updateNotebook(notebookId, notebookData) {
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
    
    // Validate we have an auth token
    if (!headers.Authorization) {
      throw new Error("Authentication required - please login");
    }

    // Get user email for X-User-Email header (this is what the Lambda expects)
    const userData = authService.getUserData();
    const userEmail = userData?.email;
    
    if (!userEmail || !userEmail.includes('@')) {
      throw new Error("Valid user email required - please login again");
    }

    console.log(`📧 Using user email: ${userEmail}`);

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
    console.log("Request headers:", {
      'Authorization': 'Bearer [TOKEN]',
      'Content-Type': 'application/json',
      'X-User-Email': userEmail
    });

    // Make the request with X-User-Email header (as Lambda expects)
    const response = await axios.post(
      `${this.baseUrl}/updateNotebook/${notebookId}/update`,
      payload,
      { 
        headers: {
          'Authorization': headers.Authorization,
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,  // This is the key fix - Lambda expects this header
          'Accept': 'application/json'
        },
        timeout: 30000, // 30 second timeout
        withCredentials: false  // Explicitly set for CORS
      }
    );

    console.log("✅ Update API Response:", response.data);

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
    console.error('❌ Error updating notebook:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
      
      // Handle specific error cases with user-friendly messages
      if (error.response.status === 401) {
        throw new Error('Please login to update this notebook');
      } else if (error.response.status === 403) {
        throw new Error('You don\'t have permission to update this notebook');
      } else if (error.response.status === 404) {
        throw new Error('Notebook not found');
      } else if (error.response.status === 500) {
        throw new Error('Server error - please try again in a moment');
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('Connection error - please check your internet connection');
    } else {
      console.error('Error creating request:', error.message);
    }
    
    // Use localStorage as fallback for connection errors
    if (error.message.includes('Network Error') || error.message.includes('Connection error')) {
      console.log("📝 Using localStorage fallback due to connection error");
      const result = this._updateNotebookInLocalStorage(notebookId, {
        chunkContent: notebookData.Content || notebookData.content,
        title: notebookData.Title || notebookData.title,
        tags: notebookData.tags,
        files: notebookData.files,
        links: notebookData.links
      });
      
      return result;
    }
    
    throw error;
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
      const notebookData = await this.getNotebook(notebookId);
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
    );
    
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
      const deletedNotebookCheck = await this.getNotebook(notebookId);
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
 * Fetch a notebook and return it in the unified UI-friendly shape
 *
 * @param {string}  notebookId               – required notebook ID
 * @param {Object=} options
 * @param {number=} options.chunk            – 0-based chunk index to return
 * @param {boolean=} options.all             – if true, return **all** chunks
 * @returns {Promise<object>}                – formatted notebook
 */
async getNotebook(notebookId, options = {}) {
  try {
    /* ---------- sanity checks ---------- */
    if (!notebookId) {
      throw new Error('Notebook ID is required');
    }

    console.log(`📖 Fetching notebook: ${notebookId}`);

    /* ---------- auth & user ---------- */
    // 1. Get the pre-existing auth header from your auth service
    const authHeaders = await authService.getAuthHeaders();
    if (!authHeaders?.Authorization) {
      throw new Error('Authentication required – please login');
    }

    // 2. Always attach the user's e-mail in X-User-Email
    const userEmail =
      authService.getUserData()?.email?.toLowerCase() || 'guest@example.com';

    /* ---------- query parameters ---------- */
    const params = {};
    if (options.chunk !== undefined && options.chunk !== null) {
      params.chunk = options.chunk;
    }
    if (options.all === true) {
      params.all = 'true';
    }
    console.log('Request params:', params);

    /* ---------- make the call ---------- */
    const response = await axios.get(
      `${this.baseUrl}/getNotebook/${notebookId}`,
      {
        headers: {
          Authorization: authHeaders.Authorization,
          'Content-Type': 'application/json',
          'X-User-Email': userEmail
        },
        params
      }
    );

    console.log('✅ Raw API response received');
    console.log(response.data);

    /* ---------- normalise the Lambda payload ---------- */
    let data;
    if (typeof response.data === 'string') {
      data = JSON.parse(response.data);
    } else if (response.data.body && typeof response.data.body === 'string') {
      data = JSON.parse(response.data.body); // APIGW proxy wrapper
    } else {
      data = response.data;
    }
    console.log('Parsed notebook data:', data);

    if (!data.metadata) {
      throw new Error('Invalid response format – missing metadata');
    }

    /* ---------- restore local tags (optional) ---------- */
    try {
      const tagCache = JSON.parse(localStorage.getItem('notebookTags') || '{}');
      if (
        tagCache[notebookId] &&
        (!data.metadata.tags || !data.metadata.tags.length)
      ) {
        data.metadata.tags = tagCache[notebookId];
      }
    } catch (e) {
      console.warn('Tag cache read failed:', e);
    }

    /* ---------- extract first chunk & files ---------- */
    const firstChunk = data.chunks?.['0'] || '';

    const files =
      (data.files || []).map(f => ({
        id: f.fileId,
        name: f.fileName,
        size: f.fileSize,
        sizeFormatted: f.fileSizeFormatted,
        type: f.type,
        extension: f.fileExtension,
        mimeType: f.mimeType,
        lastModified: f.uploadedAt,
        uploadedAt: f.uploadedAt,
        isValid: f.isValidFile,
        downloadUrl: f.downloadUrl,
        s3Key: f.s3Key,
        s3Url: f.s3Url
      })) || [];

    /* ---------- final "view model" ---------- */
    const notebook = {
      notebookId: data.metadata.notebookId || notebookId,
      title: data.metadata.title || 'Untitled Notebook',
      content: firstChunk,
      tags: data.metadata.tags || [],
      connections: data.metadata.connections || [],
      preview: data.metadata.preview || '',
      createdAt: data.metadata.createdAt || new Date().toISOString(),
      updatedAt: data.metadata.updatedAt || new Date().toISOString(),
      createdBy: data.metadata.createdBy,
      wordCount: data.metadata.wordCount || 0,
      byteSize: data.metadata.byteSize || 0,
      chunkCount: data.metadata.chunkCount || 1,
      allChunks: data.chunks || {},
      files,
      filesCount: data.filesCount || files.length,
      filesSummary: data.filesSummary || null
    };

    console.log('✅ Notebook formatted successfully');
    return notebook;
  } catch (error) {
    /* ---------- friendly error mapping ---------- */
    console.error('❌ getNotebook error:', error);

    if (error.response) {
      const { status } = error.response;
      if (status === 401) throw new Error('Please login to access this notebook');
      if (status === 403) throw new Error('You do not have permission');
      if (status === 404) throw new Error('Notebook not found');
      if (status === 500) throw new Error('Server error – please retry later');
    } else if (error.message.includes('Network Error')) {
      throw new Error('Network problem – check your connection');
    }

    throw error; // fallback
  }
}

/**
 * Upload files to a notebook - Updated for batch upload
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

    // Get user email for X-User-Email header (this is what the Lambda expects)
    const userData = authService.getUserData();
    const userEmail = userData?.email;
    
    if (!userEmail || !userEmail.includes('@')) {
      throw new Error("Valid user email required - please login again");
    }

    console.log(`📧 Using user email: ${userEmail}`);

    // Validate all files first
    const validationResults = await this.validateFilesForUpload(files);
    
    if (validationResults.errors.length > 0) {
      return {
        successful: [],
        failed: validationResults.errors.map(error => ({
          fileName: error.fileName,
          error: error.error
        })),
        totalUploaded: 0,
        totalFailed: validationResults.errors.length
      };
    }

    // Convert all files to base64 and prepare payload
    const filePromises = validationResults.validFiles.map(async (file) => {
      const base64Content = await this.fileToBase64(file);
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      
      return {
        fileName: file.name,
        fileContent: base64Content,
        contentType: file.type || this.getContentTypeFromExtension(fileExt)
      };
    });

    // Wait for all files to be converted to base64
    const filesData = await Promise.all(filePromises);

    // Create the batch upload payload
    const payload = {
      files: filesData
    };

    console.log("Batch upload request headers:", {
      'Authorization': 'Bearer [TOKEN]',
      'Content-Type': 'application/json',
      'X-User-Email': userEmail
    });

    console.log(`Uploading ${filesData.length} files in batch to notebook ${notebookId}`);

    // Make the batch upload request
    const response = await axios.post(
      `${this.baseUrl}/uploadFiles/${notebookId}`,
      payload,
      {
        headers: {
          'Authorization': headers.Authorization,
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
          'Accept': 'application/json'
        },
        timeout: 120000, // 2 minute timeout for batch uploads
        withCredentials: false
      }
    );

    console.log(`✅ Batch upload completed successfully`);
    console.log("Batch upload response:", response.data);

    // Process the response - assuming the API returns an array of results
    const uploadResults = response.data.files || response.data.results || [];
    
    const successful = uploadResults
      .filter(result => result.success !== false && result.fileId)
      .map(result => ({
        ...result,
        originalFile: validationResults.validFiles.find(f => f.name === result.fileName)
      }));
    
    const failed = uploadResults
      .filter(result => result.success === false || !result.fileId)
      .map(result => ({
        fileName: result.fileName,
        error: result.error || 'Upload failed'
      }));

    console.log(`✅ Batch upload complete: ${successful.length} successful, ${failed.length} failed`);
    
    return {
      successful,
      failed,
      totalUploaded: successful.length,
      totalFailed: failed.length
    };

  } catch (error) {
    console.error('❌ Error in batch file upload:', error);
    
    // Create failed results for all files
    const allFiles = Array.from(files);
    const failed = allFiles.map(file => ({
      fileName: file.name,
      error: error.message || 'Upload failed'
    }));

    return {
      successful: [],
      failed,
      totalUploaded: 0,
      totalFailed: failed.length
    };
  }
}

/**
 * Validate files for upload - Helper method
 * @param {FileList|File[]} files - Files to validate
 * @returns {Promise<object>} - Validation results
 */
async validateFilesForUpload(files) {
  const validFiles = [];
  const errors = [];
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.csv', '.xlsx', '.xls'];
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB

  Array.from(files).forEach(file => {
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    // Check file type
    if (!allowedExtensions.includes(fileExt)) {
      errors.push({
        fileName: file.name,
        error: `Unsupported file type (${fileExt}). Allowed: ${allowedExtensions.join(', ')}`
      });
      return;
    }
    
    // Check file size
    if (file.size > MAX_SIZE) {
      errors.push({
        fileName: file.name,
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max 50MB)`
      });
      return;
    }
    
    // Check if file is not empty
    if (file.size === 0) {
      errors.push({
        fileName: file.name,
        error: 'File is empty'
      });
      return;
    }
    
    validFiles.push(file);
  });

  return { validFiles, errors };
}

/**
 * DEPRECATED: Upload a single file (keeping for backward compatibility)
 * This method is now deprecated in favor of batch uploads
 * @param {string} notebookId - Notebook ID
 * @param {File} file - File object
 * @param {object} headers - Auth headers
 * @param {string} userEmail - User email for X-User-Email header
 * @returns {Promise<object>} - Upload result
 */
async uploadSingleFile(notebookId, file, headers, userEmail) {
  console.warn('uploadSingleFile is deprecated. Use uploadFiles for batch processing.');
  
  // Convert single file to batch and use the new method
  const result = await this.uploadFiles(notebookId, [file]);
  
  if (result.successful.length > 0) {
    return result.successful[0];
  } else if (result.failed.length > 0) {
    throw new Error(result.failed[0].error);
  } else {
    throw new Error('Upload failed for unknown reason');
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
 * Get uploaded files for a notebook (Not needed since files come with getNotebook)
 * @param {string} notebookId - Notebook ID
 * @returns {Promise<object[]>} - Array of file metadata
 */
async getNotebookFiles(notebookId) {
  try {
    if (!notebookId) {
      throw new Error("Notebook ID is required");
    }

    console.log(`📁 Fetching files for notebook: ${notebookId}`);

    // Since files are included in getNotebook response, we can use that
    const notebook = await this.getNotebook(notebookId);
    
    console.log(`✅ Retrieved ${notebook.files?.length || 0} files`);
    
    return notebook.files || [];

  } catch (error) {
    console.error('❌ Error fetching notebook files:', error);
    
    if (error.message.includes('Notebook not found')) {
      // No notebook found, return empty array
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
    
    // Make the delete request - You'll need to implement this endpoint in your Lambda
    const response = await axios.delete(
      `${this.baseUrl}/uploadFiles/${notebookId}/${fileId}`,
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
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      // Handle specific error cases
      if (error.response.status === 404) {
        throw new Error('File not found');
      } else if (error.response.status === 403) {
        throw new Error('You don\'t have permission to delete this file');
      }
    }
    
    throw error;
  }
}
 /**
 * POST a YouTube link to Lambda for download-&-transcribe.
 * Body required by Lambda:
 * {
 *   youtube_url : "https://…",
 *   format      : "mp3",
 *   notebook_id : "uuid-…",
 *   user_email  : "someone@example.com"
 * }
 */
  async addYouTubeLink(notebookId, youtubeUrl, format = 'mp3', quality = '720p') {
    if (!notebookId) throw new Error('notebookId is required');
    if (!youtubeUrl) throw new Error('youtubeUrl is required');

    /* ---------- auth ---------- */
    const authHeaders = await authService.getAuthHeaders();
    const userEmail = authService.getUserData()?.email;
    if (!authHeaders?.Authorization) throw new Error('Login required');
    if (!userEmail?.includes('@')) throw new Error('Valid e-mail required');

    try {
      console.log('=== Starting YouTube Download & Transcription ===');
      console.log(`URL: ${youtubeUrl}`);
      console.log(`Format: ${format}, Quality: ${quality}`);
      console.log(`Notebook: ${notebookId}, User: ${userEmail}`);

      // Step 1: Start download
      console.log('Step 1: Starting download...');
      const downloadResult = await this.startYouTubeDownload(
        youtubeUrl, format, quality, notebookId, userEmail, authHeaders
      );

      // Step 2: Wait for download completion
      console.log('Step 2: Waiting for download completion...');
      const downloadedFile = await this.waitForDownloadCompletion(
        downloadResult.task_id, authHeaders
      );

      // Step 3: Start transcription
      console.log('Step 3: Starting transcription...');
      const transcriptionResult = await this.startTranscription(
        downloadedFile.download_url, notebookId, userEmail, authHeaders
      );

      console.log('=== SUCCESS: YouTube processing completed ===');
      return {
        status: 'success',
        message: 'YouTube video downloaded and transcribed successfully',
        download_result: downloadedFile,
        transcription_result: transcriptionResult
      };

    } catch (err) {
      console.error('=== YouTube processing error ===', err);
      const apiMsg = err.response?.data || err.message;
      console.error('Error details:', apiMsg);
      throw err;
    }
  }
  async startYouTubeDownload(youtubeUrl, format, quality, notebookId, userEmail, authHeaders) {
    const downloadPayload = {
      url: youtubeUrl,
      format: format,
      quality: quality,
      notebook_id: notebookId,
      user_email: userEmail
    };

    const headers = {
      ...authHeaders,
      'Content-Type': 'application/json',
      'X-User-Email': userEmail
    };

    try {
      console.log('Sending download request...');
      const response = await axios.post(
        'http://ec2-3-68-76-19.eu-central-1.compute.amazonaws.com:8000/download/notebook',
        downloadPayload,
        {
          headers,
          timeout: 30000, // 30 seconds for initial request
          validateStatus: (status) => status < 500 // Accept 200-499
        }
      );

      console.log('Download API response:', response.data);

      if (!response.data.task_id) {
        throw new Error('No task_id returned from download API');
      }

      return response.data;

    } catch (error) {
      console.error('Download start failed:', error);
      throw new Error(`Failed to start download: ${error.message}`);
    }
  }

  async waitForDownloadCompletion(taskId, authHeaders, maxAttempts = 60, intervalSeconds = 5) {
    console.log(`Waiting for task completion: ${taskId}`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Checking status (attempt ${attempt}/${maxAttempts})...`);

        const response = await axios.get(
          `http://ec2-3-68-76-19.eu-central-1.compute.amazonaws.com:8000/status/${taskId}`,
          {
            headers: authHeaders,
            timeout: 15000, // 15 seconds
            validateStatus: (status) => status < 500
          }
        );

        const statusData = response.data;
        console.log(`Status: ${statusData.status}`, statusData);

        if (statusData.status === 'completed') {
          if (!statusData.download_url) {
            throw new Error('Download completed but no download_url provided');
          }

          console.log('✅ Download completed!');
          console.log(`S3 URL: ${statusData.download_url}`);
          return statusData;
        }

        if (statusData.status === 'failed') {
          throw new Error(`Download failed: ${statusData.message || 'Unknown error'}`);
        }

        if (statusData.status === 'error') {
          throw new Error(`Download error: ${statusData.message || 'Unknown error'}`);
        }

        // Still in progress, wait and retry
        console.log(`Status: ${statusData.status} - waiting ${intervalSeconds}s...`);
        await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));

      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error(`Task ${taskId} not found`);
        }

        if (attempt === maxAttempts) {
          throw new Error(`Download did not complete after ${maxAttempts} attempts: ${error.message}`);
        }

        console.log(`Attempt ${attempt} failed, retrying...`, error.message);
        await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
      }
    }

    throw new Error(`Download timeout after ${maxAttempts * intervalSeconds} seconds`);
  }

  async startTranscription(s3Url, notebookId, userEmail, authHeaders) {
    // Convert HTTPS S3 URL to S3 URI format
    const s3Uri = this.convertHttpsToS3Uri(s3Url);

    const transcriptionPayload = {
      s3_path: s3Uri, // Now in s3://bucket/key format
      notebook_id: notebookId,
      user_email: userEmail,
      transcribe_language: 'en-US',
      job_name_prefix: 'youtube-transcribe'
    };

    const headers = {
      ...authHeaders,
      'Content-Type': 'application/json',
      'X-User-Email': userEmail
    };

    try {
      console.log('Sending transcription request...');
      console.log('Original URL:', s3Url);
      console.log('Converted S3 URI:', s3Uri);
      console.log('Payload:', transcriptionPayload);

      const response = await axios.post(
        `${this.baseUrl}/youtube_video`,
        transcriptionPayload,
        {
          headers,
          timeout: 900000, // 15 minutes for transcription
          validateStatus: (status) => status < 500
        }
      );

      console.log('Transcription API response:', response.data);

      if (response.data.status === 'error') {
        throw new Error(response.data.error || 'Transcription failed');
      }

      return response.data;

    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error(`Failed to transcribe: ${error.message}`);
    }
  }

  // Add this helper method to convert HTTPS S3 URL to S3 URI
  convertHttpsToS3Uri(httpsUrl) {
    try {
      console.log('Converting HTTPS URL to S3 URI:', httpsUrl);

      // Parse the URL
      const url = new URL(httpsUrl);

      // Extract bucket name and key from different S3 URL formats
      let bucket, key;

      if (url.hostname.includes('.s3.amazonaws.com')) {
        // Format: https://bucket-name.s3.amazonaws.com/path/to/file
        bucket = url.hostname.split('.s3.amazonaws.com')[0];
        key = url.pathname.substring(1); // Remove leading slash
      } else if (url.hostname.includes('.s3.')) {
        // Format: https://bucket-name.s3.region.amazonaws.com/path/to/file
        bucket = url.hostname.split('.s3.')[0];
        key = url.pathname.substring(1); // Remove leading slash
      } else if (url.hostname === 's3.amazonaws.com') {
        // Format: https://s3.amazonaws.com/bucket-name/path/to/file
        const pathParts = url.pathname.substring(1).split('/');
        bucket = pathParts[0];
        key = pathParts.slice(1).join('/');
      } else {
        throw new Error('Unrecognized S3 URL format');
      }

      if (!bucket || !key) {
        throw new Error('Could not extract bucket and key from URL');
      }

      const s3Uri = `s3://${bucket}/${key}`;
      console.log(`Converted: ${httpsUrl} → ${s3Uri}`);

      return s3Uri;

    } catch (error) {
      console.error('Failed to convert HTTPS URL to S3 URI:', error);
      throw new Error(`Invalid S3 URL format: ${error.message}`);
    }
  }

  // Optional: Add a method to check transcription status separately
  async checkTranscriptionStatus(jobName) {
    try {
      const authHeaders = await authService.getAuthHeaders();
      const userEmail = authService.getUserData()?.email;

      const response = await axios.post(
        `${this.baseUrl}/transcription-status`, // If you create a separate endpoint
        { job_name: jobName },
        {
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
            'X-User-Email': userEmail
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to check transcription status:', error);
      throw error;
    }
  }
  }

// Create a singleton instance
const notebookService = new NotebookService();

export default notebookService;