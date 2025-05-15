import authService from './AuthService';
import axios from 'axios';

// Base URL for the API Gateway
const API_BASE = 'https://ch2l8cp5l3.execute-api.eu-central-1.amazonaws.com/dev';

/**
 * Normalize various shapes of notebook responses into a flat array of notebook objects.
 * @param {Array|Object} data - The raw response data from the API
 * @returns {Array} Array of normalized notebook objects
 */
function normalizeNotebooks(data) {
  let items = [];

  if (Array.isArray(data)) {
    items = data;
  } else if (data.Items && Array.isArray(data.Items)) {
    items = data.Items;
  } else if (data.notebooks && Array.isArray(data.notebooks)) {
    items = data.notebooks;
  } else if (data.data && Array.isArray(data.data)) {
    items = data.data;
  } else if (data) {
    items = [data];
  }

  return items.map(item => ({
    id: item.NotebookId || item.id || item.notebookId || item.uuid,
    title: item.title || item.name,
    content: item.Content || item.content || item.body || '',
    createdAt: item.CreatedAt || item.createdAt || item.created_date || item.tsCreated,
    updatedAt: item.UpdatedAt || item.updatedAt || item.updated_date || item.tsUpdated,
    order: item.Order || item.order || item.sequence || 0,
  }));
}

class NotebookService {
  /**
   * Get Cognito authorization headers
   */
  async getAuthHeaders() {
    try {
      const session = await authService.getCurrentSession();
      const token = session.getIdToken().getJwtToken();
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return { 'Content-Type': 'application/json' };
    }
  }

  /**
   * Fetch and normalize all notebooks for the current user
   */
  async getNotebooks() {
    const userData = authService.getUserData();
    const userId = userData?.email || userData?.username || 'guest';
    const headers = await this.getAuthHeaders();

    const response = await axios.get(
      `${API_BASE}/notebooks`,
      { headers, params: { userId } }
    );
    return normalizeNotebooks(response.data);
  }

  /**
   * Create a new notebook and return the created item
   */
  async createNotebook(notebookData) {
    const userData = authService.getUserData();
    const userId = userData?.email || userData?.username || 'guest';
    const payload = {
      userId,
      ...notebookData,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString()
    };
    const headers = await this.getAuthHeaders();

    const response = await axios.post(
      `${API_BASE}/notebooks`,
      payload,
      { headers }
    );
    return normalizeNotebooks(response.data)[0];
  }

  /**
   * Get a single notebook by ID
   */
  async getNotebookById(notebookId) {
    const userData = authService.getUserData();
    const userId = userData?.email || userData?.username || 'guest';
    const headers = await this.getAuthHeaders();

    const response = await axios.get(
      `${API_BASE}/notebooks/${encodeURIComponent(notebookId)}`,
      { headers, params: { userId } }
    );
    return normalizeNotebooks(response.data)[0];
  }

  /**
   * Update an existing notebook
   */
  async updateNotebook(notebookId, updates) {
    const payload = {
      NotebookId: notebookId,
      ...updates,
      UpdatedAt: new Date().toISOString()
    };
    const headers = await this.getAuthHeaders();

    const response = await axios.put(
      `${API_BASE}/notebooks/${encodeURIComponent(notebookId)}`,
      payload,
      { headers }
    );
    return normalizeNotebooks(response.data)[0];
  }

  /**
   * Delete a notebook by ID
   */
  async deleteNotebook(notebookId) {
    const userData = authService.getUserData();
    const userId = userData?.email || userData?.username || 'guest';
    const headers = await this.getAuthHeaders();

    await axios.delete(
      `${API_BASE}/notebooks/${encodeURIComponent(notebookId)}`,
      { headers, params: { userId } }
    );
  }
}

// Export a singleton instance
export default new NotebookService();