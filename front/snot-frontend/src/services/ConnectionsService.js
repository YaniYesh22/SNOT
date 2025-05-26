// services/ConnectionsService.js
import axios from 'axios';
import authService from './AuthService';

class ConnectionsService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'https://ch2l8cp5l3.execute-api.eu-central-1.amazonaws.com/dev';
    this.endpoints = {
      connections: '/getMapping/connections'
    };
  }

  /**
   * Get notebook connections and topic mapping data
   * @param {Object} options - Query options
   * @param {number} options.minSimilarity - Minimum tag similarity threshold (0-1)
   * @param {boolean} options.includeTagGroups - Include tag grouping analysis
   * @returns {Promise<Object>} Connections data with notebooks, connections, and statistics
   */
  async getConnections(options = {}) {
    const {
      minSimilarity = 0.1,
      includeTagGroups = true
    } = options;

    try {
      // Get auth headers from auth service
      const authHeaders = await authService.getAuthHeaders();

      // Get user data to extract email
      const userData = authService.getUserData();
      const userEmail = userData?.email || 'guest';

      if (!userEmail || userEmail === 'guest') {
        throw new Error('User email not found. Please log in again.');
      }

      // Keeping these logs for debugging
      console.log("Using auth headers:", authHeaders);
      console.log("Fetching connections for user:", userEmail);
      console.log(`API URL: ${this.baseURL}${this.endpoints.connections}`);

      // Build query parameters (matching Lambda expectations)
      const params = {
        minSimilarity: minSimilarity.toString(),
        includeTagGroups: includeTagGroups.toString()
      };

      // Combine auth headers with X-User-Email header (as expected by Lambda)
      const headers = {
        ...authHeaders,
        'X-User-Email': userEmail  // Lambda expects this header
      };

      console.log("Request params:", params);
      console.log("Request headers:", headers);

      // Make API call with auth headers and params
      const response = await axios.get(
        `${this.baseURL}${this.endpoints.connections}`,
        {
          headers,
          params
        }
      );

      // Keeping this log for debugging
      console.log("Connections response:", response.data);

      const data = response.data;

      console.log('Connections data received:', data);

      return this.processConnectionsData(data);

    } catch (error) {
      // Enhanced error logging matching your pattern
      console.error('Error fetching connections:', error);

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
   * Process and normalize the connections data
   */
  processConnectionsData(rawData) {
    const {
      notebooks = [],
      connections = [],
      tagGroups = {},
      statistics = {}
    } = rawData;

    // Normalize notebooks data
    const processedNotebooks = notebooks.map(notebook => ({
      notebookId: notebook.notebookId,
      title: notebook.title || 'Untitled Notebook',
      tags: Array.isArray(notebook.tags) ? notebook.tags : [],
      wordCount: parseInt(notebook.wordCount) || 0,
      chunkCount: parseInt(notebook.chunkCount) || 0,
      createdAt: notebook.createdAt,
      updatedAt: notebook.updatedAt,
      preview: notebook.preview || '',
      connections: Array.isArray(notebook.connections) ? notebook.connections : []
    }));

    // Normalize connections data
    const processedConnections = connections.map(connection => ({
      source: connection.source,
      target: connection.target,
      type: connection.type || 'unknown',
      strength: parseFloat(connection.strength) || 0,
      commonTags: Array.isArray(connection.commonTags) ? connection.commonTags : [],
      metadata: connection.metadata || {}
    }));

    // Process tag groups
    const processedTagGroups = {};
    Object.entries(tagGroups).forEach(([tag, notebooks]) => {
      if (Array.isArray(notebooks) && notebooks.length > 1) {
        processedTagGroups[tag] = notebooks.map(nb => ({
          notebookId: nb.notebookId,
          title: nb.title || 'Untitled',
          tagCount: nb.tagCount || 0
        }));
      }
    });

    return {
      notebooks: processedNotebooks,
      connections: processedConnections,
      tagGroups: processedTagGroups,
      statistics: {
        totalNotebooks: statistics.totalNotebooks || processedNotebooks.length,
        totalConnections: statistics.totalConnections || processedConnections.length,
        tagBasedConnections: statistics.tagBasedConnections || 0,
        explicitConnections: statistics.explicitConnections || 0,
        tagGroups: statistics.tagGroups || Object.keys(processedTagGroups).length,
        minSimilarityUsed: statistics.minSimilarityUsed || 0.1
      }
    };
  }

  /**
   * Find connections for a specific notebook
   * @param {string} notebookId - ID of the notebook
   * @param {Object} connectionsData - Full connections data
   * @returns {Array} Array of connected notebooks
   */
  getNotebookConnections(notebookId, connectionsData) {
    if (!connectionsData.connections) return [];

    return connectionsData.connections
      .filter(conn => conn.source === notebookId || conn.target === notebookId)
      .map(conn => {
        const connectedId = conn.source === notebookId ? conn.target : conn.source;
        const connectedNotebook = connectionsData.notebooks.find(nb => nb.notebookId === connectedId);

        return {
          notebook: connectedNotebook,
          connection: conn
        };
      })
      .filter(item => item.notebook); // Remove any invalid connections
  }

  /**
   * Get notebooks by tag
   * @param {string} tag - Tag to search for
   * @param {Object} connectionsData - Full connections data
   * @returns {Array} Array of notebooks with the tag
   */
  getNotebooksByTag(tag, connectionsData) {
    const tagLower = tag.toLowerCase();

    return connectionsData.notebooks.filter(notebook =>
      notebook.tags.some(t => t.toLowerCase() === tagLower)
    );
  }

  /**
   * Search notebooks by title or tags
   * @param {string} searchTerm - Search term
   * @param {Object} connectionsData - Full connections data
   * @returns {Array} Array of matching notebooks
   */
  searchNotebooks(searchTerm, connectionsData) {
    if (!searchTerm.trim()) return connectionsData.notebooks;

    const searchLower = searchTerm.toLowerCase();

    return connectionsData.notebooks.filter(notebook =>
      notebook.title.toLowerCase().includes(searchLower) ||
      notebook.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      (notebook.preview && notebook.preview.toLowerCase().includes(searchLower))
    );
  }

  /**
   * Get strongest connections (highest strength values)
   * @param {Object} connectionsData - Full connections data
   * @param {number} limit - Maximum number of connections to return
   * @returns {Array} Array of strongest connections
   */
  getStrongestConnections(connectionsData, limit = 10) {
    return [...connectionsData.connections]
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit);
  }

  /**
   * Generate network statistics
   * @param {Object} connectionsData - Full connections data
   * @returns {Object} Network analysis statistics
   */
  analyzeNetwork(connectionsData) {
    const { notebooks, connections } = connectionsData;

    // Calculate node degrees (number of connections per notebook)
    const nodeDegrees = {};
    notebooks.forEach(nb => nodeDegrees[nb.notebookId] = 0);

    connections.forEach(conn => {
      nodeDegrees[conn.source] = (nodeDegrees[conn.source] || 0) + 1;
      nodeDegrees[conn.target] = (nodeDegrees[conn.target] || 0) + 1;
    });

    // Find most connected notebooks
    const mostConnected = Object.entries(nodeDegrees)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([notebookId, degree]) => ({
        notebook: notebooks.find(nb => nb.notebookId === notebookId),
        connections: degree
      }));

    // Calculate average connection strength
    const avgConnectionStrength = connections.length > 0
      ? connections.reduce((sum, conn) => sum + conn.strength, 0) / connections.length
      : 0;

    // Find isolated notebooks (no connections)
    const connectedIds = new Set();
    connections.forEach(conn => {
      connectedIds.add(conn.source);
      connectedIds.add(conn.target);
    });

    const isolatedNotebooks = notebooks.filter(nb => !connectedIds.has(nb.notebookId));

    return {
      totalNotebooks: notebooks.length,
      totalConnections: connections.length,
      averageConnectionStrength: Math.round(avgConnectionStrength * 100) / 100,
      mostConnectedNotebooks: mostConnected,
      isolatedNotebooks: isolatedNotebooks,
      networkDensity: notebooks.length > 1
        ? connections.length / (notebooks.length * (notebooks.length - 1) / 2)
        : 0
    };
  }
}

// Create and export singleton instance
const connectionsService = new ConnectionsService();
export default connectionsService;