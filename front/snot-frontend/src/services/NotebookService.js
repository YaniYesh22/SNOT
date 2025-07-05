import { timeout } from 'd3';
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
    this.summarizationRoute = '/batch-process';
    this.chatRoute = '/chat';

    // 🆕 ADD: Expose authService for access from components
    this.authService = authService;
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
        userId: userId, // Include userId in payload for fallback
        // Initialize file-related attributes to prevent upload errors
        files: [], // ← ADD THIS: Initialize empty files array
        filesCount: 0, // ← ADD THIS: Initialize files count
        links: [] // ← ADD THIS: Initialize empty links array (optional but good practice)
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
        files: response.data.files || [], // ← ADD THIS: Ensure files array exists
        filesCount: response.data.filesCount || 0, // ← ADD THIS: Ensure filesCount exists
        links: response.data.links || [], // ← ADD THIS: Ensure links array exists
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

  async getNotebook(notebookId, options = {}) {
    try {
      /* ---------- sanity checks ---------- */
      if (!notebookId) throw new Error('Notebook ID is required');
      console.log(`📖 Fetching notebook: ${notebookId}`);

      /* ---------- auth & user ---------- */
      const authHeaders = await authService.getAuthHeaders();
      if (!authHeaders?.Authorization)
        throw new Error('Authentication required – please login');

      const userEmail =
        authService.getUserData()?.email?.toLowerCase() || 'guest@example.com';

      /* ---------- query parameters ---------- */
      const params = {};
      if (options.chunk !== undefined && options.chunk !== null) params.chunk = options.chunk;
      if (options.all === true) params.all = 'true';
      params.includeDownloadUrls = 'true';

      // 🔧 FIX: Use the correct parameter name for Lambda
      if (options.includeSummaryContent !== false) params.includeSummaries = 'true';

      console.log('Request params:', params);

      /* ---------- make the call ---------- */
      const { data: raw } = await axios.get(
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

      /* ---------- unwrap Lambda envelope ---------- */
      let data;
      if (raw && raw.body && typeof raw.body === 'string') {
        data = JSON.parse(raw.body);
      } else if (typeof raw === 'string') {
        data = JSON.parse(raw);
      } else {
        data = raw;
      }

      console.log('Parsed notebook data:', data);

      // 🔧 FIX: Handle different Lambda response formats
      let notebookData;
      if (data.notebook) {
        // Format 1: {notebook: {...}}
        notebookData = data.notebook;
      } else if (data.metadata) {
        // Format 2: {metadata: {...}, chunks: {...}, summaries: {...}, ...}
        notebookData = {
          ...data.metadata,
          chunks: data.chunks,
          files: data.files,
          links: data.links,
          summaries: data.summaries,
          summaryContent: data.summaryContent,
          summaryTypes: data.summaryTypes,
          summariesCount: data.summariesCount,
          hasSummaries: data.summariesCount > 0,
          lastSummarizationDate: data.metadata.lastSummarization || data.metadata.last_summarization_date,
          summaryStatus: data.metadata.summaryStatus || data.metadata.summary_status
        };
      } else {
        notebookData = data;
      }

      if (!notebookData) {
        throw new Error('Invalid response – missing notebook data');
      }

      /* ---------- restore cached tags (optional) ---------- */
      try {
        const tagCache = JSON.parse(localStorage.getItem('notebookTags') || '{}');
        if (tagCache[notebookId] && (!notebookData.tags || !notebookData.tags.length)) {
          notebookData.tags = tagCache[notebookId];
        }
      } catch (e) {
        console.warn('Tag cache read failed:', e);
      }

      /* ---------- map files ---------- */
      const files = (notebookData.files || []).map(f => ({
        id: f.fileId,
        name: f.fileName,
        size: f.fileSize,
        sizeFormatted: f.fileSizeFormatted,
        type: f.fileType,
        extension: f.fileExtension,
        mimeType: f.mimeType,
        uploadedAt: f.uploadedAt,
        isValid: f.isValidFile,
        downloadUrl: f.downloadUrl,
        s3Key: f.s3Key,
        s3Url: f.s3Url
      }));

      /* ---------- map links ---------- */
      const links = (notebookData.links || []).map(l => ({
        id: l.id,
        url: l.url,
        title: l.title,
        addedAt: l.addedAt,
        type: l.type,
        videoId: l.videoId,
        transcriptStatus: l.transcriptStatus,
        downloadStatus: l.downloadStatus,
        description: l.description,
        thumbnailUrl: l.thumbnailUrl,
        isYouTube: l.isYouTube,
        domain: l.domain,
        isValid: l.isValidLink
      }));

      /* ---------- 🔧 FIXED: Process summaries from actual Lambda response format ---------- */
      const summaries = notebookData.summaries || {};
      const summaryContent = notebookData.summaryContent || {};
      const summaryTypes = notebookData.summaryTypes || Object.keys(summaries);

      console.log('🔍 Processing Lambda summaries:', {
        summaries,
        summaryContent,
        summaryTypes,
        hasSummaries: notebookData.hasSummaries,
        summariesType: typeof summaries,
        summariesKeys: Object.keys(summaries)
      });

      // Build enhanced summaries in the format expected by the frontend
      const enhancedSummaries = {};

      // 🔧 FIXED: Process each summary type correctly for the actual response format
      for (const [type, summaryValue] of Object.entries(summaries)) {
        console.log(`📄 Processing ${type} summary:`, {
          summaryValue,
          valueType: typeof summaryValue,
          isString: typeof summaryValue === 'string',
          isObject: typeof summaryValue === 'object'
        });

        // 🔧 FIXED: Handle the actual response format where summaries are objects
        let s3Url = null;

        if (typeof summaryValue === 'string') {
          // Simple string URL (Format 1)
          s3Url = summaryValue;
        } else if (summaryValue && typeof summaryValue === 'object') {
          // Object format (Format 2) - extract the actual URL
          s3Url = summaryValue.s3Path ||
            summaryValue.url ||
            summaryValue.s3Url ||
            summaryValue.downloadUrl ||
            summaryValue.s3_url;
        }

        // 🔧 FIXED: Safe URL validation with type checking
        const hasValidUrl = s3Url &&
          typeof s3Url === 'string' &&
          s3Url !== 'undefined' &&
          s3Url !== 'null' &&
          s3Url.trim() !== '' &&
          (s3Url.startsWith('http') || s3Url.startsWith('s3://'));

        const hasContent = summaryContent[type] &&
          typeof summaryContent[type] === 'string' &&
          summaryContent[type].length > 0;

        console.log(`📄 ${type} summary analysis:`, {
          summaryValue,
          s3Url,
          hasValidUrl,
          hasContent,
          contentLength: summaryContent[type]?.length || 0
        });

        // 🔧 FIXED: Accept summaries with valid URLs even if no content is provided
        if (hasValidUrl || hasContent) {
          enhancedSummaries[type] = {
            // Use real URL if available, otherwise create placeholder for content-only
            url: hasValidUrl ? s3Url : (hasContent ? `#content-${type}` : null),
            ready: true,
            generatedAt: notebookData.lastSummarizationDate || notebookData.lastModified || new Date().toISOString(),
            downloadUrl: hasValidUrl ? s3Url : null,

            // Content from Lambda response (might be empty)
            content: summaryContent[type] || null,
            hasContent: hasContent,

            // Additional metadata from Lambda
            source: 'lambda_response',
            fetchedAt: new Date().toISOString(),

            // 🔧 NEW: Include summary metadata if available
            exists: summaryValue?.exists,
            summaryType: summaryValue?.type || type
          };

          console.log(`✅ Added ${type} summary:`, {
            hasValidUrl,
            hasContent,
            contentLength: summaryContent[type]?.length || 0,
            url: enhancedSummaries[type].url,
            summaryExists: summaryValue?.exists
          });
        } else {
          console.warn(`⚠️ Skipping ${type} summary - no valid URL or content:`, {
            summaryValue,
            s3Url,
            hasValidUrl,
            hasContent
          });
        }
      }

      /* ---------- build enhanced summary result ---------- */
      let finalEnhancedSummaries = enhancedSummaries;

      // 🔧 NEW: Optionally fetch summary content if not provided and URLs are available
      if (options.includeSummaryContent !== false && Object.keys(enhancedSummaries).length > 0) {
        const hasAnySummaryWithoutContent = Object.values(enhancedSummaries).some(s =>
          s.url && s.url.startsWith('s3://') && !s.hasContent
        );

        if (hasAnySummaryWithoutContent) {
          console.log('📥 Some summaries need content fetching...');
          try {
            finalEnhancedSummaries = await this.fetchSummaryContentWhenNeeded(enhancedSummaries);
          } catch (fetchError) {
            console.warn('⚠️ Failed to fetch some summary content:', fetchError.message);
            // Continue with what we have
          }
        }
      }

      const summaryResult = {
        summaries: finalEnhancedSummaries,
        summariesCount: Object.keys(finalEnhancedSummaries).length,
        contentAvailable: Object.values(finalEnhancedSummaries).filter(s => s.hasContent).length,
        lastFetched: new Date().toISOString()
      };

      /* ---------- build final view model ---------- */
      const notebook = {
        /* ids & titles */
        notebookId: notebookData.notebookId || notebookId,
        title: notebookData.title || notebookData.Title || 'Untitled Notebook',

        /* core content */
        content: (notebookData.chunks && notebookData.chunks[0]?.content) ||
          (notebookData.chunks && notebookData.chunks['0']) || '',
        allChunks: notebookData.chunks || [],
        chunkCount: notebookData.chunkCount || 1,

        /* meta */
        tags: notebookData.tags || [],
        tagsCount: notebookData.tags?.length || 0,
        connections: notebookData.connections || [],
        preview: notebookData.preview || '',
        createdBy: notebookData.createdBy,
        createdAt: notebookData.createdAt,
        updatedAt: notebookData.lastModified || notebookData.updatedAt,
        wordCount: notebookData.wordCount || 0,
        byteSize: notebookData.byteSize || 0,

        /* 🔧 FIXED: Enhanced summarization with proper Lambda data */
        summarizationStatus: notebookData.summaryStatus || 'not_started',
        lastSummarization: notebookData.lastSummarizationDate,
        summaryTypesAvailable: summaryTypes,
        summaryLocations: summaries,                               // {type: s3://… or object}
        summaries: summaryResult.summaries,                        // Enhanced format
        summariesCount: summaryResult.summariesCount,
        summaryTypes,

        // Additional summary metadata
        summaryContentAvailable: summaryResult.contentAvailable,
        summaryLastFetched: summaryResult.lastFetched,
        hasSummaries: notebookData.hasSummaries || Object.keys(summaries).length > 0,

        /* files & links */
        files,
        filesCount: notebookData.filesCount ?? files.length,
        filesSummary: notebookData.filesSummary ?? null,
        links,
        linksCount: notebookData.linksCount ?? links.length,
        linksSummary: notebookData.linksSummary ?? null
      };

      console.log('✅ Notebook formatted with Lambda summaries:', {
        notebookId: notebook.notebookId,
        title: notebook.title,
        summariesCount: notebook.summariesCount,
        summaryTypes: Object.keys(notebook.summaries),
        contentAvailable: notebook.summaryContentAvailable,
        hasSummaries: notebook.hasSummaries
      });

      return notebook;

    } catch (error) {
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
      throw error;
    }
  }

  /**
   * 🔧 NEW: Helper function to fetch summary content when not provided in Lambda response
   * Add this to your NotebookService class
   */
  async fetchSummaryContentWhenNeeded(enhancedSummaries) {
    const summariesWithContent = { ...enhancedSummaries };

    for (const [type, summaryData] of Object.entries(enhancedSummaries)) {
      // If summary has a valid URL but no content, try to fetch it
      if (summaryData.url &&
        summaryData.url.startsWith('s3://') &&
        !summaryData.hasContent) {

        try {
          console.log(`📥 Fetching content for ${type} summary from ${summaryData.url}`);

          // Try to use your getSummary method first
          const content = await this.fetchSummaryFromS3(summaryData.url);

          if (content && content.length > 0) {
            summariesWithContent[type] = {
              ...summaryData,
              content: content,
              hasContent: true,
              fetchedAt: new Date().toISOString(),
              url: summaryData.url // Keep the original URL
            };

            console.log(`✅ Fetched content for ${type}: ${content.length} characters`);
          }

        } catch (fetchError) {
          console.warn(`⚠️ Could not fetch content for ${type}:`, fetchError.message);
          // Keep the summary without content - don't remove it
        }
      }
    }

    return summariesWithContent;
  }

  /**
   * 🔧 ENHANCED: Update your existing fetchSummaryFromS3 method to handle S3 URLs better
   */
  async fetchSummaryFromS3(s3Url, notebookId = null, summaryType = null) {
    try {
      console.log(`📄 Fetching summary content from: ${s3Url}`);

      // If we have specific notebook and summary type, try the getSummary endpoint first
      if (notebookId && summaryType) {
        try {
          console.log('🚀 Trying getSummary endpoint first...');
          const result = await this.getSummary(notebookId, summaryType, 'plain');

          if (result && result.content) {
            console.log('✅ Got summary content from getSummary endpoint');
            return result.content;
          }
        } catch (endpointError) {
          console.log('⚠️ getSummary endpoint failed, trying direct S3 fetch:', endpointError.message);
        }
      }

      // Try to convert S3 URL to presigned URL if needed
      if (s3Url.startsWith('s3://')) {
        // For now, try direct fetch - you might need to implement presigned URL generation
        // Or use your existing getSummary endpoint to get the content
        throw new Error('S3 direct access not implemented - use getSummary endpoint');
      }

      // If it's already an HTTP URL, fetch directly
      if (s3Url.startsWith('http')) {
        const response = await fetch(s3Url, {
          method: 'GET',
          timeout: 30000
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const content = await response.text();
        console.log(`✅ Summary content fetched successfully (${content.length} characters)`);
        return content;
      }

      throw new Error('Unsupported URL format');

    } catch (error) {
      console.error(`❌ Error fetching summary content:`, error);
      throw new Error(`Failed to fetch summary: ${error.message}`);
    }
  }

  // 🔧 SIMPLIFIED: Enhanced summary processing function for Lambda response
  async enhanceSummariesWithContent(notebookId, summaries = {}, summaryLocations = {}, includeSummaryContent = true) {
    try {
      console.log('🔍 Enhancing summaries with content:', {
        notebookId,
        summariesCount: Object.keys(summaries).length,
        locationsCount: Object.keys(summaryLocations).length,
        includeSummaryContent
      });

      const enhancedSummaries = {};
      let contentAvailable = 0;

      // 🔧 NEW: Handle Lambda response format directly
      // This function is now mainly for backward compatibility since getNotebook handles it
      for (const [type, summaryData] of Object.entries(summaries)) {
        console.log(`📄 Processing summary ${type}:`, summaryData);

        // If summaryData is already enhanced (object with metadata)
        if (typeof summaryData === 'object' && summaryData !== null) {
          enhancedSummaries[type] = {
            ...summaryData,
            source: summaryData.source || 'enhanced_input'
          };

          if (summaryData.hasContent || summaryData.content) {
            contentAvailable++;
          }

          console.log(`✅ Used pre-enhanced summary: ${type}`);
          continue;
        }

        // If summaryData is just a URL string (legacy format)
        if (typeof summaryData === 'string') {
          const url = summaryData;
          const hasValidUrl = url &&
            url !== 'undefined' &&
            url !== 'null' &&
            !url.startsWith('#') &&
            (url.startsWith('http') || url.startsWith('s3://'));

          if (hasValidUrl) {
            enhancedSummaries[type] = {
              url: url,
              ready: true,
              generatedAt: new Date().toISOString(),
              downloadUrl: url,
              content: null,
              hasContent: false,
              source: 'legacy_string_url'
            };

            console.log(`✅ Processed legacy URL summary: ${type}`);
          }
        }
      }

      // Process legacy summary locations if needed
      if (Object.keys(enhancedSummaries).length === 0 && Object.keys(summaryLocations).length > 0) {
        console.log('📄 Processing legacy summary locations...');

        for (const [type, url] of Object.entries(summaryLocations)) {
          const isValidUrl = url &&
            url !== 'undefined' &&
            url !== 'null' &&
            !url.startsWith('#') &&
            (url.startsWith('http') || url.startsWith('s3://'));

          if (isValidUrl) {
            enhancedSummaries[type] = {
              url: url,
              ready: true,
              generatedAt: new Date().toISOString(),
              downloadUrl: url,
              content: null,
              hasContent: false,
              source: 'legacy_location'
            };
            console.log(`✅ Added legacy summary ${type}`);
          }
        }
      }

      const result = {
        summaries: enhancedSummaries,
        summariesCount: Object.keys(enhancedSummaries).length,
        contentAvailable: contentAvailable,
        lastFetched: new Date().toISOString()
      };

      console.log('✅ Summary enhancement complete:', {
        totalSummaries: result.summariesCount,
        withContent: contentAvailable,
        types: Object.keys(enhancedSummaries)
      });

      return result;

    } catch (error) {
      console.error('❌ Error enhancing summaries:', error);
      return {
        summaries: {},
        summariesCount: 0,
        contentAvailable: 0,
        lastFetched: new Date().toISOString()
      };
    }
  }

  // // 🆕 ADD: Convenience method for enhanced loading
  // async getNotebookWithSummaries(notebookId) {
  //   try {
  //     console.log(`📖 Fetching notebook with summaries: ${notebookId}`);

  //     // Call the enhanced getNotebook with summary content options
  //     const notebook = await this.getNotebook(notebookId, {
  //       includeSummaryContent: true,  // Include summary content if available
  //       includeDownloadUrls: true,    // Include download URLs
  //       all: false                    // Don't get all chunks, just the main content
  //     });

  //     console.log('✅ Retrieved notebook with enhanced summaries:', {
  //       notebookId: notebook.notebookId,
  //       title: notebook.title,
  //       summariesCount: notebook.summariesCount,
  //       summaryTypes: Object.keys(notebook.summaries || {}),
  //       contentAvailable: notebook.summaryContentAvailable
  //     });

  //     return notebook;

  //   } catch (error) {
  //     console.error('❌ getNotebookWithSummaries error:', error);

  //     // Fallback to regular getNotebook
  //     console.log('🔄 Falling back to regular getNotebook...');
  //     return await this.getNotebook(notebookId);
  //   }
  // }

  // /**
  //  * 🆕 NEW: Helper method to enhance summaries with content from getSummary Lambda
  //  * Add this new method to your NotebookService class
  //  */
  // async enhanceSummariesWithContent(notebookId, summaries, summaryLocations, includeSummaryContent = true) {
  //   try {
  //     console.log(`🔄 Enhancing summaries for notebook ${notebookId}`, {
  //       summariesCount: Object.keys(summaries).length,
  //       locationsCount: Object.keys(summaryLocations).length,
  //       includeSummaryContent
  //     });

  //     const enhancedSummaries = {};
  //     let contentAvailable = false;
  //     let successfulFetches = 0;

  //     // Process existing summaries from main response
  //     for (const [type, summaryData] of Object.entries(summaries)) {
  //       enhancedSummaries[type] = {
  //         // Basic metadata from main response
  //         type: type,
  //         ready: true,
  //         generatedAt: summaryData.generatedAt || summaryData.lastModified || new Date().toISOString(),
  //         url: summaryData.s3Url || summaryData.url,
  //         downloadUrl: summaryData.downloadUrl,
  //         fileSize: summaryData.fileSize,
  //         fileSizeFormatted: summaryData.fileSizeFormatted,
  //         wordCount: summaryData.wordCount,

  //         // Content from main response (if available)
  //         content: summaryData.content || null,
  //         preview: summaryData.preview || null,

  //         // Additional metadata
  //         source: 'main_response'
  //       };

  //       // 🆕 NEW: If content not available and includeSummaryContent is true, try getSummary Lambda
  //       if (!summaryData.content && includeSummaryContent) {
  //         try {
  //           console.log(`📄 Fetching content for ${type} summary via getSummary Lambda...`);

  //           const lambdaResult = await this.getSummary(notebookId, type, 'json', false);

  //           if (lambdaResult && lambdaResult.summary) {
  //             enhancedSummaries[type] = {
  //               ...enhancedSummaries[type],
  //               // Enhanced content from Lambda
  //               content: lambdaResult.summary.content,
  //               preview: lambdaResult.summary.preview,
  //               wordCount: lambdaResult.summary.wordCount || enhancedSummaries[type].wordCount,
  //               readingTime: lambdaResult.summary.estimatedReadingTime,
  //               characterCount: lambdaResult.summary.characterCount,
  //               lastModified: lambdaResult.summary.lastModified || enhancedSummaries[type].generatedAt,

  //               // Lambda-specific metadata
  //               source: 'lambda_enhanced',
  //               fetchedAt: new Date().toISOString()
  //             };

  //             contentAvailable = true;
  //             successfulFetches++;

  //             console.log(`✅ Enhanced ${type} summary with Lambda content`);
  //           }

  //         } catch (lambdaError) {
  //           console.log(`⚠️ Could not fetch ${type} summary content via Lambda:`, lambdaError.message);
  //           // Keep the summary without content - don't fail the whole process
  //         }
  //       } else if (summaryData.content) {
  //         contentAvailable = true;
  //       }
  //     }

  //     // 🆕 NEW: Process summary locations that might not be in main summaries
  //     for (const [type, location] of Object.entries(summaryLocations)) {
  //       if (!enhancedSummaries[type]) {
  //         console.log(`📍 Found summary location for ${type} not in main summaries`);

  //         enhancedSummaries[type] = {
  //           type: type,
  //           ready: true,
  //           url: location,
  //           source: 'location_only',
  //           generatedAt: new Date().toISOString() // Fallback timestamp
  //         };

  //         // Try to get content via getSummary Lambda if requested
  //         if (includeSummaryContent) {
  //           try {
  //             console.log(`📄 Fetching ${type} summary via location and getSummary Lambda...`);

  //             const lambdaResult = await this.getSummary(notebookId, type, 'json', false);

  //             if (lambdaResult && lambdaResult.summary) {
  //               enhancedSummaries[type] = {
  //                 ...enhancedSummaries[type],
  //                 content: lambdaResult.summary.content,
  //                 preview: lambdaResult.summary.preview,
  //                 wordCount: lambdaResult.summary.wordCount,
  //                 readingTime: lambdaResult.summary.estimatedReadingTime,
  //                 fileSize: lambdaResult.summary.fileSize,
  //                 fileSizeFormatted: lambdaResult.summary.fileSizeFormatted,
  //                 lastModified: lambdaResult.summary.lastModified,

  //                 source: 'lambda_from_location',
  //                 fetchedAt: new Date().toISOString()
  //               };

  //               contentAvailable = true;
  //               successfulFetches++;

  //               console.log(`✅ Fetched ${type} summary content from location via Lambda`);
  //             }

  //           } catch (lambdaError) {
  //             console.log(`⚠️ Could not fetch ${type} summary from location:`, lambdaError.message);
  //           }
  //         }
  //       }
  //     }

  //     const result = {
  //       summaries: enhancedSummaries,
  //       summariesCount: Object.keys(enhancedSummaries).length,
  //       contentAvailable,
  //       lastFetched: new Date().toISOString(),
  //       successfulFetches,
  //       totalAvailable: Object.keys(summaryLocations).length + Object.keys(summaries).length
  //     };

  //     console.log(`✅ Summary enhancement complete:`, {
  //       totalSummaries: result.summariesCount,
  //       contentAvailable: result.contentAvailable,
  //       successfulFetches: result.successfulFetches,
  //       sources: Object.values(enhancedSummaries).map(s => s.source)
  //     });

  //     return result;

  //   } catch (error) {
  //     console.error('❌ Error enhancing summaries:', error);

  //     // Return basic summaries without enhancement rather than failing
  //     return {
  //       summaries: summaries || {},
  //       summariesCount: Object.keys(summaries || {}).length,
  //       contentAvailable: false,
  //       lastFetched: new Date().toISOString(),
  //       successfulFetches: 0,
  //       error: error.message
  //     };
  //   }
  // }

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

      // Process the response - Fix: Use the correct Lambda response structure
      const responseData = response.data;

      // Extract successful files from Lambda response
      const successfulFiles = responseData.successfulFiles || [];
      const failedFiles = responseData.failedFiles || [];

      const successful = successfulFiles.map(result => ({
        fileId: result.fileId,
        fileName: result.fileName,
        fileSize: result.fileSize,
        fileType: result.fileType,
        mimeType: result.mimeType,
        s3Key: result.s3Key,
        uploadedAt: result.uploadedAt,
        originalFile: validationResults.validFiles.find(f => f.name === result.fileName)
      }));

      const failed = failedFiles.map(result => ({
        fileName: result.filename || result.fileName,
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
    * POST a YouTube link for transcript extraction and processing.
    * Simplified workflow:
    * 1. Extract transcript from local endpoint
    * 2. Send transcript to Lambda for processing
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
      console.log('=== Starting YouTube Transcript Extraction ===');
      console.log(`URL: ${youtubeUrl}`);
      console.log(`Notebook: ${notebookId}, User: ${userEmail}`);

      // Step 1: Extract transcript from local endpoint
      console.log('Step 1: Extracting transcript...');
      const transcriptData = await this.extractTranscript(youtubeUrl);

      // Step 2: Send transcript to Lambda for processing
      console.log('Step 2: Sending transcript to Lambda...');
      const lambdaResult = await this.sendTranscriptToLambda(
        transcriptData,
        notebookId,
        userEmail,
        authHeaders
      );

      console.log('=== SUCCESS: YouTube transcript processed ===');
      return {
        status: 'success',
        message: 'YouTube transcript extracted and processed successfully',
        transcript_data: transcriptData,
        lambda_result: lambdaResult
      };

    } catch (err) {
      console.error('=== YouTube transcript processing error ===', err);
      const apiMsg = err.response?.data || err.message;
      console.error('Error details:', apiMsg);
      throw err;
    }
  }

  async extractTranscript(youtubeUrl) {
    const payload = {
      youtube_url: youtubeUrl,
      timeout: 120000 // 2 minutes timeout for transcript extraction
    };

    try {
      console.log('Calling local transcript extraction endpoint...');
      const response = await axios.post(
        'http://ec2-3-68-76-19.eu-central-1.compute.amazonaws.com:5000/extract',
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 120000, // 2 minutes timeout for transcript extraction
          validateStatus: (status) => status < 500
        }
      );

      console.log('Transcript extraction response:', response.data);

      if (!response.data.success) {
        throw new Error('Transcript extraction failed');
      }

      if (!response.data.transcript) {
        throw new Error('No transcript returned from extraction service');
      }

      return response.data;

    } catch (error) {
      console.error('Transcript extraction failed:', error);

      if (error.code === 'ECONNREFUSED') {
        throw new Error('Local transcript service is not running (localhost:5000)');
      }

      throw new Error(`Failed to extract transcript: ${error.message}`);
    }
  }

  async sendTranscriptToLambda(transcriptData, notebookId, userEmail, authHeaders) {
    // Prepare payload for Lambda
    const lambdaPayload = {
      transcript: transcriptData.transcript,
      video_id: transcriptData.video_id,
      notebook_id: notebookId,
      user_email: userEmail,
      auto_process: true,
      metadata: {
        // You can extract these from YouTube API or set defaults
        title: `YouTube Video ${transcriptData.video_id}`,
        duration: "00:00:00", // Default, could be extracted if needed
        channel: "Unknown Channel", // Default, could be extracted if needed
        upload_date: new Date().toISOString().split('T')[0],
        views: 0, // Default, could be extracted if needed
        likes: 0, // Default, could be extracted if needed
        processing_time: transcriptData.processing_time,
        transcript_length: transcriptData.transcript_length
      }
    };

    const headers = {
      ...authHeaders,
      'Content-Type': 'application/json',
      'X-User-Email': userEmail
    };

    try {
      console.log('Sending transcript to Lambda...');
      console.log('Lambda payload:', {
        ...lambdaPayload,
        transcript: `${lambdaPayload.transcript.substring(0, 100)}...` // Log only first 100 chars
      });

      const response = await axios.post(
        `${this.baseUrl}/put_transcript`, // Your Lambda endpoint
        lambdaPayload,
        {
          headers,
          timeout: 300000, // 5 minutes for Lambda processing
          validateStatus: (status) => status < 500
        }
      );

      console.log('Lambda response:', response.data);

      if (response.data.status === 'error') {
        throw new Error(response.data.error || 'Lambda processing failed');
      }

      return response.data;

    } catch (error) {
      console.error('Lambda processing failed:', error);
      throw new Error(`Failed to process transcript in Lambda: ${error.message}`);
    }
  }

  // Optional: Enhanced version that fetches YouTube metadata
  async addYouTubeLinkWithMetadata(notebookId, youtubeUrl, format = 'mp3', quality = '720p') {
    if (!notebookId) throw new Error('notebookId is required');
    if (!youtubeUrl) throw new Error('youtubeUrl is required');

    const authHeaders = await authService.getAuthHeaders();
    const userEmail = authService.getUserData()?.email;
    if (!authHeaders?.Authorization) throw new Error('Login required');
    if (!userEmail?.includes('@')) throw new Error('Valid e-mail required');

    try {
      console.log('=== Starting YouTube Transcript Extraction with Metadata ===');

      // Step 1: Extract transcript
      const transcriptData = await this.extractTranscript(youtubeUrl);

      // Step 2: Optionally fetch YouTube metadata (if you have YouTube API access)
      let metadata = {
        title: `YouTube Video ${transcriptData.video_id}`,
        duration: "00:00:00",
        channel: "Unknown Channel",
        upload_date: new Date().toISOString().split('T')[0],
        views: 0,
        likes: 0,
        processing_time: transcriptData.processing_time,
        transcript_length: transcriptData.transcript_length
      };

      // If you want to fetch real metadata, uncomment and implement:
      // try {
      //   const youtubeMetadata = await this.fetchYouTubeMetadata(transcriptData.video_id);
      //   metadata = { ...metadata, ...youtubeMetadata };
      // } catch (metaError) {
      //   console.warn('Could not fetch YouTube metadata, using defaults:', metaError.message);
      // }

      // Step 3: Send to Lambda with enhanced metadata
      const enhancedTranscriptData = {
        ...transcriptData,
        metadata
      };

      const lambdaResult = await this.sendTranscriptToLambda(
        enhancedTranscriptData,
        notebookId,
        userEmail,
        authHeaders
      );

      console.log('=== SUCCESS: YouTube transcript processed with metadata ===');
      return {
        status: 'success',
        message: 'YouTube transcript extracted and processed successfully',
        transcript_data: enhancedTranscriptData,
        lambda_result: lambdaResult
      };

    } catch (err) {
      console.error('=== YouTube transcript processing error ===', err);
      throw err;
    }
  }

  // Helper method to extract video ID from YouTube URL
  extractVideoId(youtubeUrl) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = youtubeUrl.match(regex);
    return match ? match[1] : null;
  }

  // Optional: Method to fetch YouTube metadata (requires YouTube Data API)
  // async fetchYouTubeMetadata(videoId) {
  //   // Implement YouTube Data API call here if needed
  //   // This would require API key and proper setup
  //   throw new Error('YouTube metadata fetching not implemented');
  // }


  // /**
  // * POST a YouTube link to Lambda for download-&-transcribe.
  // * Body required by Lambda:
  // * {
  // *   youtube_url : "https://…",
  // *   format      : "mp3",
  // *   notebook_id : "uuid-…",
  // *   user_email  : "someone@example.com"
  // * }
  // */
  // async addYouTubeLink(notebookId, youtubeUrl, format = 'mp3', quality = '720p') {
  //   if (!notebookId) throw new Error('notebookId is required');
  //   if (!youtubeUrl) throw new Error('youtubeUrl is required');

  //   /* ---------- auth ---------- */
  //   const authHeaders = await authService.getAuthHeaders();
  //   const userEmail = authService.getUserData()?.email;
  //   if (!authHeaders?.Authorization) throw new Error('Login required');
  //   if (!userEmail?.includes('@')) throw new Error('Valid e-mail required');

  //   try {
  //     console.log('=== Starting YouTube Download & Transcription ===');
  //     console.log(`URL: ${youtubeUrl}`);
  //     console.log(`Format: ${format}, Quality: ${quality}`);
  //     console.log(`Notebook: ${notebookId}, User: ${userEmail}`);

  //     // Step 1: Start download
  //     console.log('Step 1: Starting download...');
  //     const downloadResult = await this.startYouTubeDownload(
  //       youtubeUrl, format, quality, notebookId, userEmail, authHeaders
  //     );

  //     // Step 2: Wait for download completion
  //     console.log('Step 2: Waiting for download completion...');
  //     const downloadedFile = await this.waitForDownloadCompletion(
  //       downloadResult.task_id, authHeaders
  //     );

  //     // Step 3: Start transcription
  //     console.log('Step 3: Starting transcription...');
  //     const transcriptionResult = await this.startTranscription(
  //       downloadedFile.download_url, notebookId, userEmail, authHeaders
  //     );

  //     console.log('=== SUCCESS: YouTube processing completed ===');
  //     return {
  //       status: 'success',
  //       message: 'YouTube video downloaded and transcribed successfully',
  //       download_result: downloadedFile,
  //       transcription_result: transcriptionResult
  //     };

  //   } catch (err) {
  //     console.error('=== YouTube processing error ===', err);
  //     const apiMsg = err.response?.data || err.message;
  //     console.error('Error details:', apiMsg);
  //     throw err;
  //   }
  // }
  // async startYouTubeDownload(youtubeUrl, format, quality, notebookId, userEmail, authHeaders) {
  //   const downloadPayload = {
  //     url: youtubeUrl,
  //     format: format,
  //     quality: quality,
  //     notebook_id: notebookId,
  //     user_email: userEmail
  //   };

  //   const headers = {
  //     ...authHeaders,
  //     'Content-Type': 'application/json',
  //     'X-User-Email': userEmail
  //   };

  //   try {
  //     console.log('Sending download request...');
  //     const response = await axios.post(
  //       'http://ec2-3-68-76-19.eu-central-1.compute.amazonaws.com:8000/download/notebook',
  //       downloadPayload,
  //       {
  //         headers,
  //         timeout: 30000, // 30 seconds for initial request
  //         validateStatus: (status) => status < 500 // Accept 200-499
  //       }
  //     );

  //     console.log('Download API response:', response.data);

  //     if (!response.data.task_id) {
  //       throw new Error('No task_id returned from download API');
  //     }

  //     return response.data;

  //   } catch (error) {
  //     console.error('Download start failed:', error);
  //     throw new Error(`Failed to start download: ${error.message}`);
  //   }
  // }

  // async waitForDownloadCompletion(taskId, authHeaders, maxAttempts = 60, intervalSeconds = 5) {
  //   console.log(`Waiting for task completion: ${taskId}`);

  //   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  //     try {
  //       console.log(`Checking status (attempt ${attempt}/${maxAttempts})...`);

  //       const response = await axios.get(
  //         `http://ec2-3-68-76-19.eu-central-1.compute.amazonaws.com:8000/status/${taskId}`,
  //         {
  //           headers: authHeaders,
  //           timeout: 15000, // 15 seconds
  //           validateStatus: (status) => status < 500
  //         }
  //       );

  //       const statusData = response.data;
  //       console.log(`Status: ${statusData.status}`, statusData);

  //       if (statusData.status === 'completed') {
  //         if (!statusData.download_url) {
  //           throw new Error('Download completed but no download_url provided');
  //         }

  //         console.log('✅ Download completed!');
  //         console.log(`S3 URL: ${statusData.download_url}`);
  //         return statusData;
  //       }

  //       if (statusData.status === 'failed') {
  //         throw new Error(`Download failed: ${statusData.message || 'Unknown error'}`);
  //       }

  //       if (statusData.status === 'error') {
  //         throw new Error(`Download error: ${statusData.message || 'Unknown error'}`);
  //       }

  //       // Still in progress, wait and retry
  //       console.log(`Status: ${statusData.status} - waiting ${intervalSeconds}s...`);
  //       await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));

  //     } catch (error) {
  //       if (error.response?.status === 404) {
  //         throw new Error(`Task ${taskId} not found`);
  //       }

  //       if (attempt === maxAttempts) {
  //         throw new Error(`Download did not complete after ${maxAttempts} attempts: ${error.message}`);
  //       }

  //       console.log(`Attempt ${attempt} failed, retrying...`, error.message);
  //       await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
  //     }
  //   }

  //   throw new Error(`Download timeout after ${maxAttempts * intervalSeconds} seconds`);
  // }

  // async startTranscription(s3Url, notebookId, userEmail, authHeaders) {
  //   // Convert HTTPS S3 URL to S3 URI format
  //   const s3Uri = this.convertHttpsToS3Uri(s3Url);

  //   const transcriptionPayload = {
  //     s3_path: s3Uri, // Now in s3://bucket/key format
  //     notebook_id: notebookId,
  //     user_email: userEmail,
  //     transcribe_language: 'en-US',
  //     job_name_prefix: 'youtube-transcribe'
  //   };

  //   const headers = {
  //     ...authHeaders,
  //     'Content-Type': 'application/json',
  //     'X-User-Email': userEmail
  //   };

  //   try {
  //     console.log('Sending transcription request...');
  //     console.log('Original URL:', s3Url);
  //     console.log('Converted S3 URI:', s3Uri);
  //     console.log('Payload:', transcriptionPayload);

  //     const response = await axios.post(
  //       `${this.baseUrl}/youtube_video`,
  //       transcriptionPayload,
  //       {
  //         headers,
  //         timeout: 900000, // 15 minutes for transcription
  //         validateStatus: (status) => status < 500
  //       }
  //     );

  //     console.log('Transcription API response:', response.data);

  //     if (response.data.status === 'error') {
  //       throw new Error(response.data.error || 'Transcription failed');
  //     }

  //     return response.data;

  //   } catch (error) {
  //     console.error('Transcription failed:', error);
  //     throw new Error(`Failed to transcribe: ${error.message}`);
  //   }
  // }

  // // Add this helper method to convert HTTPS S3 URL to S3 URI
  // convertHttpsToS3Uri(httpsUrl) {
  //   try {
  //     console.log('Converting HTTPS URL to S3 URI:', httpsUrl);

  //     // Parse the URL
  //     const url = new URL(httpsUrl);

  //     // Extract bucket name and key from different S3 URL formats
  //     let bucket, key;

  //     if (url.hostname.includes('.s3.amazonaws.com')) {
  //       // Format: https://bucket-name.s3.amazonaws.com/path/to/file
  //       bucket = url.hostname.split('.s3.amazonaws.com')[0];
  //       key = url.pathname.substring(1); // Remove leading slash
  //     } else if (url.hostname.includes('.s3.')) {
  //       // Format: https://bucket-name.s3.region.amazonaws.com/path/to/file
  //       bucket = url.hostname.split('.s3.')[0];
  //       key = url.pathname.substring(1); // Remove leading slash
  //     } else if (url.hostname === 's3.amazonaws.com') {
  //       // Format: https://s3.amazonaws.com/bucket-name/path/to/file
  //       const pathParts = url.pathname.substring(1).split('/');
  //       bucket = pathParts[0];
  //       key = pathParts.slice(1).join('/');
  //     } else {
  //       throw new Error('Unrecognized S3 URL format');
  //     }

  //     if (!bucket || !key) {
  //       throw new Error('Could not extract bucket and key from URL');
  //     }

  //     const s3Uri = `s3://${bucket}/${key}`;
  //     console.log(`Converted: ${httpsUrl} → ${s3Uri}`);

  //     return s3Uri;

  //   } catch (error) {
  //     console.error('Failed to convert HTTPS URL to S3 URI:', error);
  //     throw new Error(`Invalid S3 URL format: ${error.message}`);
  //   }
  // }

  // // Optional: Add a method to check transcription status separately
  // async checkTranscriptionStatus(jobName) {
  //   try {
  //     const authHeaders = await authService.getAuthHeaders();
  //     const userEmail = authService.getUserData()?.email;

  //     const response = await axios.post(
  //       `${this.baseUrl}/transcription-status`, // If you create a separate endpoint
  //       { job_name: jobName },
  //       {
  //         headers: {
  //           ...authHeaders,
  //           'Content-Type': 'application/json',
  //           'X-User-Email': userEmail
  //         }
  //       }
  //     );

  //     return response.data;
  //   } catch (error) {
  //     console.error('Failed to check transcription status:', error);
  //     throw error;
  //   }
  // }

  /**
   * 🆕 Start summary generation process (non-blocking)
   * @param {string} notebookId - ID of the notebook to summarize
   * @param {string[]} summaryTypes - Array of summary types ['casual', 'academic', 'simple']
   * @returns {Promise<object>} - Task information for polling
   */
  async startSummary(notebookId, summaryTypes) {
    try {
      if (!notebookId) {
        throw new Error('Notebook ID is required');
      }

      if (!summaryTypes || summaryTypes.length === 0) {
        throw new Error('At least one summary type is required');
      }

      console.log(`🚀 Starting summary generation for notebook: ${notebookId}`);
      console.log(`📝 Summary types: ${summaryTypes.join(', ')}`);

      // Get auth headers
      const headers = await this.authService.getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Authentication required - please login');
      }

      // Get user email
      const userData = this.authService.getUserData();
      const userEmail = userData?.email;
      if (!userEmail || !userEmail.includes('@')) {
        throw new Error('Valid user email required - please login again');
      }

      // Prepare payload for start summary endpoint
      const payload = {
        notebookId: notebookId,
        summaryTypes: summaryTypes
      };

      console.log('🚀 Calling start summary endpoint with payload:', payload);

      // Call the start summary endpoint
      const response = await axios.post(
        `${this.baseUrl}/startSummary`,
        payload,
        {
          headers: {
            'Authorization': headers.Authorization,
            'Content-Type': 'application/json',
            'X-User-Email': userEmail,
            'Accept': 'application/json'
          },
          timeout: 30000, // 30 seconds for start request
          withCredentials: false
        }
      );

      console.log('✅ Summary generation started:', response.data);

      return {
        taskId: response.data.taskId,
        status: response.data.status,
        summaryTypes: response.data.summaryTypes,
        estimatedTime: response.data.estimatedTime,
        checkStatusUrl: response.data.checkStatusUrl,
        pollInterval: response.data.pollInterval || 10, // Default 10 seconds
        filesProcessed: response.data.filesProcessed,
        message: response.data.message
      };

    } catch (error) {
      console.error('❌ Error starting summary generation:', error);

      if (error.response) {
        const { status, data } = error.response;

        // Handle specific error cases
        if (status === 400) {
          throw new Error(data.error || 'Invalid request');
        } else if (status === 401) {
          throw new Error('Please login to generate summaries');
        } else if (status === 404) {
          throw new Error('Notebook not found');
        } else if (status === 409) {
          // Summary already in progress
          throw new Error(data.error || 'Summary generation already in progress');
        } else if (status === 202) {
          // Files still processing
          throw new Error(data.error || data.message || 'Files are still being processed');
        } else if (status >= 500) {
          throw new Error('Server error - please try again in a moment');
        }

        throw new Error(data.error || data.message || `HTTP ${status} error`);
      } else if (error.request) {
        throw new Error('Network error - please check your connection');
      } else {
        throw new Error(`Failed to start summary: ${error.message}`);
      }
    }
  }

  /**
  * 🔧 SIMPLIFIED: Get notebook with enhanced summaries (including content)
  * This method now simply calls getNotebook with the right options
  * @param {string} notebookId - ID of the notebook
  * @returns {Promise<object>} - Notebook with summaries and content
  */
  async getNotebookWithSummaries(notebookId) {
    try {
      console.log(`📖 Fetching notebook with summaries: ${notebookId}`);

      // 🔧 SIMPLIFIED: Just call getNotebook with summary content enabled
      const notebook = await this.getNotebook(notebookId, {
        includeSummaryContent: true,  // This tells Lambda to include summary content
        includeDownloadUrls: true,    // Include download URLs
        all: false                    // Don't get all chunks, just the main content
      });

      console.log('✅ Retrieved notebook with enhanced summaries:', {
        notebookId: notebook.notebookId,
        title: notebook.title,
        summariesCount: notebook.summariesCount,
        summaryTypes: Object.keys(notebook.summaries || {}),
        contentAvailable: notebook.summaryContentAvailable,
        hasSummaries: notebook.hasSummaries
      });

      return notebook;

    } catch (error) {
      console.error('❌ getNotebookWithSummaries error:', error);

      // Fallback to regular getNotebook without summary content
      console.log('🔄 Falling back to regular getNotebook...');
      return await this.getNotebook(notebookId, {
        includeSummaryContent: false
      });
    }
  }

  /**
   * NEW: Get notebook without summary content (faster loading)
   * Add this new method to your NotebookService class  
   */
  async getNotebookMetadataOnly(notebookId) {
    return this.getNotebook(notebookId, {
      includeSummaryContent: false
    });
  }

  /**
 * 🆕 Check summary generation status (works with your Lambda)
 * @param {string} notebookId - ID of the notebook
 * @returns {Promise<object>} - Current status and progress information
 */
  async getSummaryStatus(notebookId) {
    try {
      if (!notebookId) {
        throw new Error('Notebook ID is required');
      }

      // Get auth headers
      const headers = await this.authService.getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Authentication required - please login');
      }

      // Get user email
      const userData = this.authService.getUserData();
      const userEmail = userData?.email;
      if (!userEmail || !userEmail.includes('@')) {
        throw new Error('Valid user email required - please login again');
      }

      // Call the status check endpoint
      const response = await axios.get(
        `${this.baseUrl}/getSummaryStatus/${notebookId}`,
        {
          headers: {
            'Authorization': headers.Authorization,
            'Content-Type': 'application/json',
            'X-User-Email': userEmail,
            'Accept': 'application/json'
          },
          timeout: 15000, // 15 seconds for status check
          withCredentials: false
        }
      );

      const statusData = response.data;

      console.log(`📊 Summary status for ${notebookId}:`, {
        status: statusData.status,
        progress: statusData.progressSummary,
        summariesCount: statusData.summaryCount
      });

      return {
        notebookId: statusData.notebookId,
        status: statusData.status, // "not_started", "processing", "completed", "partial_success", "failed"
        taskId: statusData.taskId,
        summaryTypes: statusData.summaryTypes,
        startedAt: statusData.startedAt,
        completedAt: statusData.completedAt,
        summaryCount: statusData.summaryCount,

        // Progress information
        progress: statusData.progress, // Per-type progress
        progressSummary: statusData.progressSummary, // Overall progress counts
        elapsedTime: statusData.elapsedTime,
        estimatedTimeRemaining: statusData.estimatedTimeRemaining,

        // Completed summaries
        summaries: statusData.summaries, // With download URLs
        totalSize: statusData.totalSize,
        totalSizeFormatted: statusData.totalSizeFormatted,

        // Status messages
        message: statusData.message,
        errors: statusData.errors,
        error: statusData.error,
        partialSuccess: statusData.partialSuccess,

        // Notebook info
        notebookInfo: statusData.notebookInfo
      };

    } catch (error) {
      console.error('❌ Error checking summary status:', error);

      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          throw new Error('Please login to check summary status');
        } else if (status === 404) {
          throw new Error('Notebook not found');
        } else if (status >= 500) {
          throw new Error('Server error - please try again');
        }

        throw new Error(data.error || data.message || `HTTP ${status} error`);
      } else if (error.request) {
        throw new Error('Network error - please check your connection');
      } else {
        throw new Error(`Failed to check status: ${error.message}`);
      }
    }
  }

  /**
   * 🆕 Poll summary status until completion
   * @param {string} notebookId - ID of the notebook
   * @param {function} onProgress - Callback for progress updates
   * @param {number} pollInterval - Polling interval in seconds (default: 10)
   * @param {number} maxAttempts - Maximum polling attempts (default: 60)
   * @returns {Promise<object>} - Final status when completed
   */
  async pollSummaryStatus(notebookId, onProgress = null, pollInterval = 10, maxAttempts = 60) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await this.getSummaryStatus(notebookId);

        // Call progress callback if provided
        if (onProgress && typeof onProgress === 'function') {
          onProgress(status);
        }

        // Check if finished (success or failure)
        if (status.status === 'completed' ||
          status.status === 'partial_success' ||
          status.status === 'failed') {
          console.log(`✅ Summary polling finished with status: ${status.status}`);
          return status;
        }

        // Still processing, wait and continue
        if (status.status === 'processing') {
          console.log(`⏳ Summary still processing (attempt ${attempts + 1}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval * 1000));
          attempts++;
          continue;
        }

        // Unexpected status
        console.warn(`⚠️ Unexpected status: ${status.status}`);
        break;

      } catch (error) {
        console.error(`❌ Polling error (attempt ${attempts + 1}):`, error.message);

        // If it's a network error, retry
        if (error.message.includes('Network error') && attempts < maxAttempts - 1) {
          console.log(`🔄 Retrying in ${pollInterval} seconds...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval * 1000));
          attempts++;
          continue;
        }

        // Other errors or max retries reached
        throw error;
      }
    }

    throw new Error(`Summary polling timeout after ${maxAttempts * pollInterval} seconds`);
  }

  /**
 * 🔄 UPDATED: Enhanced generateSummary method that uses new progress system
 * This maintains backward compatibility while using the new progress endpoints
 * @param {string} notebookId - ID of the notebook to summarize
 * @param {string} summaryType - Type of summary ('casual', 'academic', 'simple')
 * @param {function} onProgress - Optional progress callback
 * @returns {Promise<object>} - Final summarization result in old format
 */
  async generateSummary(notebookId, summaryType, onProgress = null) {
    try {
      console.log(`🚀 Starting enhanced summary generation: ${summaryType}`);

      // Step 1: Start the summary generation
      const startResult = await this.startSummary(notebookId, [summaryType]);
      console.log(`✅ Summary started with task ID: ${startResult.taskId}`);

      // Step 2: Poll for completion with progress updates
      const finalStatus = await this.pollSummaryStatus(
        notebookId,
        onProgress,
        startResult.pollInterval,
        60 // 10 minutes max polling
      );

      // Step 3: Return result in expected format for backward compatibility
      if (finalStatus.status === 'completed' || finalStatus.status === 'partial_success') {
        return {
          overall_success: true,
          summary_locations: finalStatus.summaries ?
            Object.fromEntries(
              Object.entries(finalStatus.summaries).map(([type, data]) => [type, data.s3Url])
            ) : {},
          ready_for_chat: { ready: true },
          workflow_results: {
            summarization: {
              success: true,
              completed_types: Object.keys(finalStatus.summaries || {}),
              task_id: finalStatus.taskId,
              elapsed_time: finalStatus.elapsedTime
            }
          },
          message: finalStatus.message,
          finalStatus: finalStatus
        };
      } else {
        return {
          overall_success: false,
          workflow_results: {
            summarization: {
              error: finalStatus.error || finalStatus.message || 'Summary generation failed',
              status: finalStatus.status,
              task_id: finalStatus.taskId
            }
          },
          error: finalStatus.error || finalStatus.message,
          finalStatus: finalStatus
        };
      }

    } catch (error) {
      console.error('❌ Enhanced summary generation failed:', error);

      return {
        overall_success: false,
        workflow_results: {
          summarization: { error: error.message }
        },
        error: error.message
      };
    }
  }

  /**
 * 🆕 ADD: Get specific summary using Lambda endpoint
 * @param {string} notebookId - ID of the notebook
 * @param {string} summaryType - Type of summary ('casual', 'academic', 'simple')
 * @param {string} format - Response format ('json', 'html', 'plain')
 * @param {boolean} includeMetadata - Whether to include metadata analysis
 * @returns {Promise<object>} - Summary data
 */
  async getSummary(notebookId, summaryType, format = 'json', includeMetadata = true) {
    try {
      if (!notebookId) {
        throw new Error('Notebook ID is required');
      }

      if (!summaryType) {
        throw new Error('Summary type is required');
      }

      console.log(`📄 Getting ${summaryType} summary for notebook: ${notebookId}`);

      // Get auth headers
      const headers = await this.authService.getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Authentication required - please login');
      }

      // Get user email
      const userData = this.authService.getUserData();
      const userEmail = userData?.email;
      if (!userEmail || !userEmail.includes('@')) {
        throw new Error('Valid user email required - please login again');
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (format !== 'json') queryParams.append('format', format);
      if (!includeMetadata) queryParams.append('include_metadata', 'false');

      const queryString = queryParams.toString();
      const url = `${this.baseUrl}/getSummary/${notebookId}/${summaryType}${queryString ? `?${queryString}` : ''}`;

      console.log('📄 Calling getSummary endpoint:', url);

      // Make the API call
      const response = await axios.get(url, {
        headers: {
          'Authorization': headers.Authorization,
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
          'Accept': format === 'json' ? 'application/json' : format === 'html' ? 'text/html' : 'text/plain'
        },
        timeout: 30000, // 30 seconds
        withCredentials: false
      });

      console.log('✅ getSummary response received:', {
        status: response.status,
        contentType: response.headers['content-type'],
        dataType: typeof response.data
      });

      // Handle different response formats
      if (format === 'html' || format === 'plain') {
        // For HTML/plain text, return the raw content
        return {
          content: response.data,
          format: format,
          notebookId: notebookId,
          summaryType: summaryType
        };
      } else {
        // For JSON, return the structured data
        return response.data;
      }

    } catch (error) {
      console.error('❌ Error getting summary:', error);

      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          throw new Error('Please login to access summaries');
        } else if (status === 403) {
          throw new Error('You don\'t have permission to access this summary');
        } else if (status === 404) {
          const errorData = typeof data === 'string' ? { message: data } : data;
          const availableTypes = errorData.available_types || [];
          const suggestion = availableTypes.length > 0
            ? `Available types: ${availableTypes.join(', ')}`
            : 'No summaries available for this notebook';
          throw new Error(`Summary not found. ${suggestion}`);
        } else if (status >= 500) {
          throw new Error('Server error - please try again in a moment');
        }

        const errorMsg = (typeof data === 'string' ? data : data?.message) || `HTTP ${status} error`;
        throw new Error(errorMsg);
      } else if (error.request) {
        throw new Error('Network error - please check your connection');
      } else {
        throw new Error(`Failed to get summary: ${error.message}`);
      }
    }
  }

  /**
   * 🆕 ADD: Get all summaries for a notebook using Lambda endpoint
   * @param {string} notebookId - ID of the notebook
   * @param {string} format - Response format ('json', 'html', 'plain')
   * @param {boolean} includeMetadata - Whether to include metadata analysis
   * @returns {Promise<object>} - All summaries data
   */
  async getAllSummaries(notebookId, format = 'json', includeMetadata = true) {
    try {
      if (!notebookId) {
        throw new Error('Notebook ID is required');
      }

      console.log(`📄 Getting all summaries for notebook: ${notebookId}`);

      // Get auth headers
      const headers = await this.authService.getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Authentication required - please login');
      }

      // Get user email
      const userData = this.authService.getUserData();
      const userEmail = userData?.email;
      if (!userEmail || !userEmail.includes('@')) {
        throw new Error('Valid user email required - please login again');
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (format !== 'json') queryParams.append('format', format);
      if (!includeMetadata) queryParams.append('include_metadata', 'false');

      const queryString = queryParams.toString();
      const url = `${this.baseUrl}/getSummary/${notebookId}${queryString ? `?${queryString}` : ''}`;

      console.log('📄 Calling getAllSummaries endpoint:', url);

      // Make the API call
      const response = await axios.get(url, {
        headers: {
          'Authorization': headers.Authorization,
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
          'Accept': format === 'json' ? 'application/json' : format === 'html' ? 'text/html' : 'text/plain'
        },
        timeout: 30000, // 30 seconds
        withCredentials: false
      });

      console.log('✅ getAllSummaries response received:', {
        status: response.status,
        summaryCount: response.data?.totalCount || 'unknown'
      });

      // Handle different response formats
      if (format === 'html' || format === 'plain') {
        // For HTML/plain text, return the raw content
        return {
          content: response.data,
          format: format,
          notebookId: notebookId
        };
      } else {
        // For JSON, return the structured data
        return response.data;
      }

    } catch (error) {
      console.error('❌ Error getting all summaries:', error);

      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          throw new Error('Please login to access summaries');
        } else if (status === 403) {
          throw new Error('You don\'t have permission to access summaries for this notebook');
        } else if (status === 404) {
          throw new Error('No summaries found for this notebook. Generate summaries first.');
        } else if (status >= 500) {
          throw new Error('Server error - please try again in a moment');
        }

        const errorMsg = (typeof data === 'string' ? data : data?.message) || `HTTP ${status} error`;
        throw new Error(errorMsg);
      } else if (error.request) {
        throw new Error('Network error - please check your connection');
      } else {
        throw new Error(`Failed to get summaries: ${error.message}`);
      }
    }
  }

  // /**
  //  * 🔄 UPDATED: Update your existing fetchSummaryFromS3 method
  //  * Replace your existing fetchSummaryFromS3 method with this enhanced version
  //  */
  // async fetchSummaryFromS3(summaryUrl, notebookId = null, summaryType = null) {
  //   try {
  //     console.log(`📄 Fetching summary content from: ${summaryUrl}`);

  //     // 🆕 NEW: If we have notebookId and summaryType, try Lambda first
  //     if (notebookId && summaryType) {
  //       try {
  //         console.log('🚀 Trying getSummary Lambda first...');
  //         const lambdaResult = await this.getSummary(notebookId, summaryType, 'json');

  //         if (lambdaResult && lambdaResult.summary && lambdaResult.summary.content) {
  //           console.log('✅ Got summary content from Lambda');
  //           return lambdaResult.summary.content;
  //         }
  //       } catch (lambdaError) {
  //         console.log('⚠️ Lambda getSummary failed, falling back to direct S3 fetch:', lambdaError.message);
  //         // Continue to direct S3 fetch below
  //       }
  //     }

  //     // Fallback: Direct fetch from the URL (works for presigned URLs)
  //     const response = await axios.get(summaryUrl, {
  //       timeout: 30000,
  //       responseType: 'text'
  //     });

  //     console.log(`✅ Summary content fetched successfully (${response.data.length} characters)`);
  //     return response.data;

  //   } catch (error) {
  //     console.error(`❌ Error fetching summary content:`, error);

  //     if (error.response) {
  //       if (error.response.status === 403) {
  //         throw new Error('Access denied - summary URL may have expired');
  //       } else if (error.response.status === 404) {
  //         throw new Error('Summary not found');
  //       }
  //     }

  //     throw new Error(`Failed to fetch summary: ${error.message}`);
  //   }
  // }

  /**
   * @param {string} notebookId - ID of the notebook
   * @param {string} message - The message/question to send
   * @param {Array} conversationHistory - Previous conversation messages
   * @param {string} conversationId - Optional conversation ID for tracking
   * @param {number} maxChunks - Maximum number of chunks to retrieve (default: 5)
   * @returns {Promise<object>} - Enhanced chat response with sources and metadata
   */
  async sendChatMessage(notebookId, message, conversationHistory = [], conversationId = null, maxChunks = 5) {
    try {
      if (!notebookId) {
        throw new Error('Notebook ID is required');
      }

      if (!message || !message.trim()) {
        throw new Error('Message is required');
      }

      console.log(`🤖 Sending chat message for notebook: ${notebookId}`);

      // Get auth headers
      const headers = await authService.getAuthHeaders();

      // Validate we have an auth token
      if (!headers.Authorization) {
        throw new Error('Authentication required - please login');
      }

      // Get user email
      const userData = authService.getUserData();
      const userEmail = userData?.email;

      if (!userEmail || !userEmail.includes('@')) {
        throw new Error('Valid user email required - please login again');
      }

      // Prepare the payload for the enhanced chat lambda
      const payload = {
        bucket: "smart-notebook-media", // Your default bucket
        email: userEmail,
        notebook_uuid: notebookId,
        question: message.trim(),
        conversation_history: conversationHistory,
        conversation_id: conversationId,
        max_chunks: maxChunks,
        include_sources: true
      };

      console.log('🤖 Calling enhanced chat service with payload:', {
        ...payload,
        conversation_history_length: conversationHistory.length
      });

      // Make the API call to the chat lambda
      const response = await axios.post(
        `${this.baseUrl}${this.chatRoute}`,
        payload,
        {
          headers: {
            'Authorization': headers.Authorization,
            'Content-Type': 'application/json',
            'X-User-Email': userEmail,
            'Accept': 'application/json'
          },
          timeout: 120000, // 2 minute timeout for chat with conversation history
          withCredentials: false
        }
      );

      console.log('✅ Enhanced chat service response:', response.data);

      // Return enhanced response with all metadata
      return {
        answer: response.data.answer,
        sources: response.data.sources || [],
        chunks_found: response.data.chunks_found || 0,
        search_method: response.data.search_method || 'unknown',
        conversation_id: response.data.conversation_id,
        total_chunks_in_db: response.data.total_chunks_in_db,
        processing_info: response.data.processing_info,
        timestamp: response.data.timestamp
      };

    } catch (error) {
      console.error('❌ Error in enhanced sendChatMessage:', error);

      // Enhanced error handling
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);

        // Handle specific error cases
        if (error.response.status === 400) {
          const errorData = error.response.data;
          if (errorData.error === 'no_vector_db') {
            throw new Error('No vector database found. Please process your files first by generating a summary.');
          }
          throw new Error(errorData.message || 'Bad request');
        } else if (error.response.status === 401) {
          throw new Error('Please login to use chat');
        } else if (error.response.status === 403) {
          throw new Error('You don\'t have permission to chat with this notebook');
        } else if (error.response.status === 404) {
          throw new Error('Notebook not found or chat service unavailable');
        } else if (error.response.status === 429) {
          throw new Error('Too many requests - please wait a moment and try again');
        } else if (error.response.status >= 500) {
          throw new Error('Server error during chat - please try again in a moment');
        }

        // Try to extract error message from response
        const errorMsg = error.response.data?.message ||
          error.response.data?.error ||
          `HTTP ${error.response.status}: ${error.response.statusText}`;
        throw new Error(errorMsg);
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('Network error - please check your internet connection and try again');
      } else {
        console.error('Error setting up request:', error.message);
        throw new Error(`Failed to send chat message: ${error.message}`);
      }
    }
  }

  // Add these methods to your NotebookService class

  /**
   * 🆕 Save current chat conversation
   * @param {string} notebookId - ID of the notebook
   * @param {Array} chatHistory - Array of chat messages
   * @param {string} chatTitle - Optional title for the chat
   * @returns {Promise<object>} - Save result with chat ID
   */
  async saveChatHistory(notebookId, chatHistory, chatTitle = '', chatId = undefined) {
    try {
      if (!notebookId) throw new Error('Notebook ID is required');
      if (!chatHistory || chatHistory.length === 0) throw new Error('Chat history is required');

      const headers = await authService.getAuthHeaders();
      if (!headers.Authorization) throw new Error('Authentication required - please login');
      const userData = authService.getUserData();
      const userEmail = userData?.email;
      if (!userEmail || !userEmail.includes('@')) throw new Error('Valid user email required - please login again');

      // Format chat history for Lambda
      const formattedChatHistory = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message,
        timestamp: msg.timestamp
      }));

      const payload = {
        action: 'save_chat',
        email: userEmail,
        notebook_uuid: notebookId,
        chat_history: formattedChatHistory,
        chat_title: chatTitle
      };
      if (chatId) payload.chat_id = chatId;

      const response = await axios.post(
        `${this.baseUrl}${this.chatRoute}`,
        payload,
        {
          headers: {
            'Authorization': headers.Authorization,
            'Content-Type': 'application/json',
            'X-User-Email': userEmail,
            'Accept': 'application/json'
          },
          timeout: 30000,
          withCredentials: false
        }
      );

      return {
        success: true,
        chat_id: response.data.chat_id,
        title: response.data.title,
        timestamp: response.data.timestamp,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Error saving chat:', error);
      if (error.response) {
        const { status, data } = error.response;
        if (status === 400) throw new Error(data.error || 'Invalid chat data');
        if (status === 401) throw new Error('Please login to save chats');
        if (status === 403) throw new Error('You don\'t have permission to save chats for this notebook');
        if (status === 404) throw new Error('Notebook not found');
        if (status >= 500) throw new Error('Server error - please try again in a moment');
        throw new Error(data.error || data.message || `HTTP ${status} error`);
      } else if (error.request) {
        throw new Error('Network error - please check your connection');
      } else {
        throw new Error(`Failed to save chat: ${error.message}`);
      }
    }
  }

  /**
   * 🆕 Get saved chats for a notebook - Updated to match new POST Lambda
   * @param {string} notebookId - ID of the notebook
   * @returns {Promise<Array>} - Array of saved chats
   */
  async getSavedChats(notebookId) {
    try {
      if (!notebookId) {
        throw new Error('Notebook ID is required');
      }

      console.log(`📚 Getting saved chats for notebook: ${notebookId}`);

      // Get auth headers
      const headers = await authService.getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Authentication required - please login');
      }

      // Get user email
      const userData = authService.getUserData();
      const userEmail = userData?.email;
      if (!userEmail || !userEmail.includes('@')) {
        throw new Error('Valid user email required - please login again');
      }

      // Build request body exactly as the Lambda expects
      const requestBody = {
        email: userEmail
        // Note: notebookId goes in the URL path, not request body
      };

      console.log('📚 Request body:', {
        email: userEmail,
        notebookId: notebookId // This goes in path
      });

      // Call the getSavedChats Lambda endpoint - note it's now POST
      const response = await axios.post(
        `${this.baseUrl}/get_Saved_Chats/${notebookId}`,
        requestBody,
        {
          headers: {
            'Authorization': headers.Authorization,
            'Content-Type': 'application/json',
            'X-User-Email': userEmail,
            'Accept': 'application/json'
          },
          timeout: 15000,
          withCredentials: false
        }
      );

      console.log('📚 Lambda response:', response.data);

      // Handle the Lambda response format
      const responseData = response.data;
      const chats = responseData.chats || [];

      console.log(`✅ Retrieved ${chats.length} saved chats`);

      // Map the Lambda response to the format expected by the frontend
      return chats.map(chat => ({
        chat_id: chat.chat_id,
        title: chat.title || 'Untitled Chat',
        timestamp: chat.timestamp || chat.created_at,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        version: chat.version || 1,
        message_count: chat.message_count || 0,
        word_count: chat.word_count || 0,
        first_message_preview: chat.first_message_preview,
        last_message_preview: chat.last_message_preview,
        file_size: chat.file_size
      }));

    } catch (error) {
      console.error('❌ Error getting saved chats:', error);

      if (error.response?.status === 404) {
        // No saved chats found - return empty array
        return [];
      }

      if (error.response) {
        const { status } = error.response;
        if (status === 401) {
          throw new Error('Please login to view saved chats');
        } else if (status === 403) {
          throw new Error('You don\'t have permission to view chats for this notebook');
        }
      }

      // For network errors or other issues, return empty array
      console.warn('Could not load saved chats, returning empty array');
      return [];
    }
  }

    /**
   * 🆕 Load a specific saved chat - Updated to match new POST Lambda
   * @param {string} notebookId - ID of the notebook
   * @param {string} chatId - ID of the chat to load
   * @returns {Promise<object>} - Chat data with history
   */
  async loadSavedChat(notebookId, chatId) {
    try {
      if (!notebookId || !chatId) {
        throw new Error('Notebook ID and Chat ID are required');
      }

      console.log(`📖 Loading saved chat: ${chatId}`);

      // Get auth headers
      const headers = await authService.getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Authentication required - please login');
      }

      // Get user email
      const userData = authService.getUserData();
      const userEmail = userData?.email;
      if (!userEmail || !userEmail.includes('@')) {
        throw new Error('Valid user email required - please login again');
      }

      // Build request body for specific chat exactly as Lambda expects
      const requestBody = {
        email: userEmail,
        chat_id: chatId
        // Note: notebookId goes in the URL path, not request body
      };

      console.log('📖 Request body:', {
        email: userEmail,
        chat_id: chatId,
        notebookId: notebookId // This goes in path
      });

      // Call the same getSavedChats Lambda endpoint but with chat_id in body
      const response = await axios.post(
        `${this.baseUrl}/get_Saved_Chats/${notebookId}`,
        requestBody,
        {
          headers: {
            'Authorization': headers.Authorization,
            'Content-Type': 'application/json',
            'X-User-Email': userEmail,
            'Accept': 'application/json'
          },
          timeout: 15000,
          withCredentials: false
        }
      );

      console.log('📖 Lambda response for specific chat:', response.data);

      const chatData = response.data;

      // Validate the response has the expected structure
      if (!chatData.chat_id || !chatData.chat_history) {
        throw new Error('Invalid chat data received from server');
      }

      console.log('✅ Chat loaded successfully');

      // Convert the Lambda response to the format expected by the frontend
      const formattedMessages = chatData.chat_history.map((msg, index) => ({
        id: `${chatId}-${index}`,
        message: msg.content,
        sender: msg.role === 'user' ? 'user' : 'ai',
        timestamp: msg.timestamp || chatData.timestamp,
        type: 'message'
      }));

      return {
        chat_id: chatData.chat_id,
        title: chatData.title || 'Untitled Chat',
        timestamp: chatData.timestamp,
        created_at: chatData.created_at,
        updated_at: chatData.updated_at,
        version: chatData.version || 1,
        message_count: chatData.message_count || formattedMessages.length,
        word_count: chatData.word_count,
        participants: chatData.participants,
        retrieved_at: chatData.retrieved_at,
        messages: formattedMessages
      };

    } catch (error) {
      console.error('❌ Error loading saved chat:', error);

      if (error.response) {
        const { status } = error.response;
        if (status === 404) {
          throw new Error('Chat not found');
        } else if (status === 401) {
          throw new Error('Please login to load saved chats');
        } else if (status === 403) {
          throw new Error('You don\'t have permission to access this chat');
        }
      }

      throw new Error(`Failed to load chat: ${error.message}`);
    }
  }


  /**
   * 🆕 Get saved chats with pagination and search - Updated for POST Lambda
   * @param {string} notebookId - ID of the notebook
   * @param {object} options - Options for pagination and search
   * @param {number} options.limit - Number of chats to return (default: 50)
   * @param {number} options.offset - Offset for pagination (default: 0)
   * @param {string} options.search - Search query
   * @returns {Promise<object>} - Paginated chat results
   */
  async getSavedChatsWithPagination(notebookId, options = {}) {
    try {
      if (!notebookId) {
        throw new Error('Notebook ID is required');
      }

      const { limit = 50, offset = 0, search } = options;

      console.log(`📚 Getting saved chats with pagination for notebook: ${notebookId}`);

      // Get auth headers
      const headers = await authService.getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('Authentication required - please login');
      }

      // Get user email
      const userData = authService.getUserData();
      const userEmail = userData?.email;
      if (!userEmail || !userEmail.includes('@')) {
        throw new Error('Valid user email required - please login again');
      }

      // Build request body exactly as the Lambda expects
      const requestBody = {
        email: userEmail,
        limit: limit,
        offset: offset
      };

      // Add search if provided
      if (search) {
        requestBody.search = search;
      }

      console.log('📚 Request body:', {
        email: userEmail,
        notebookId: notebookId,
        limit,
        offset,
        search
      });

      // Call the getSavedChats Lambda endpoint
      const response = await axios.post(
        `${this.baseUrl}/get_Saved_Chats/${notebookId}`,
        requestBody,
        {
          headers: {
            'Authorization': headers.Authorization,
            'Content-Type': 'application/json',
            'X-User-Email': userEmail,
            'Accept': 'application/json'
          },
          timeout: 15000,
          withCredentials: false
        }
      );

      console.log('📚 Lambda response:', response.data);

      // Return the full response including pagination metadata
      return response.data;

    } catch (error) {
      console.error('❌ Error getting saved chats with pagination:', error);

      if (error.response?.status === 404) {
        // No saved chats found
        return {
          chats: [],
          pagination: {
            total: 0,
            limit: options.limit || 50,
            offset: options.offset || 0,
            has_more: false,
            next_offset: null
          }
        };
      }

      if (error.response) {
        const { status } = error.response;
        if (status === 401) {
          throw new Error('Please login to view saved chats');
        } else if (status === 403) {
          throw new Error('You don\'t have permission to view chats for this notebook');
        }
      }

      throw new Error(`Failed to get chats: ${error.message}`);
    }
  }
}

// Create a singleton instance
const notebookService = new NotebookService();

export default notebookService;