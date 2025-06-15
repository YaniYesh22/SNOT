// Enhanced ConnectionsService.js
class EnhancedConnectionsService {
  constructor() {
      this.baseURL = process.env.REACT_APP_API_BASE_URL || 'https://api.yourapp.com';
      this.cache = new Map();
      this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get enhanced smart connections with intelligent analysis
   */
  async getConnections(options = {}) {
      try {
          console.log("=== Enhanced ConnectionsService.getConnections ===");
          console.log("Options:", options);

          // Build query parameters with enhanced options
          const params = new URLSearchParams();
          
          // Core parameters
          if (options.minSimilarity !== undefined) {
              params.append('minSimilarity', Math.max(0.05, Math.min(1.0, options.minSimilarity)));
          } else {
              params.append('minSimilarity', '0.2'); // Better default
          }

          // Enhanced features
          if (options.includeSmartClusters !== false) {
              params.append('includeSmartClusters', 'true');
          }
          
          if (options.includeNetworkIntelligence !== false) {
              params.append('includeNetworkIntelligence', 'true');
          }

          // Connection type filtering
          const connectionTypes = options.connectionTypes || ['smart_similarity', 'explicit'];
          if (Array.isArray(connectionTypes) && connectionTypes.length > 0) {
              params.append('connectionTypes', connectionTypes.join(','));
          }

          // Performance optimization
          if (options.maxConnections && options.maxConnections > 0) {
              params.append('maxConnections', options.maxConnections.toString());
          }

          // Time-based filtering
          if (options.timeRange && options.timeRange !== 'all') {
              params.append('timeRange', options.timeRange);
          }

          // Cache key for intelligent caching
          const cacheKey = `connections_${params.toString()}`;
          
          // Check cache first
          if (this.cache.has(cacheKey)) {
              const cached = this.cache.get(cacheKey);
              if (Date.now() - cached.timestamp < this.cacheTimeout) {
                  console.log("✓ Returning cached connections data");
                  return cached.data;
              }
              this.cache.delete(cacheKey);
          }

          // Get user email for authentication
          const userEmail = this.getUserEmail();
          if (!userEmail) {
              throw new Error('User email not found. Please log in again.');
          }

          console.log("✓ Making API request to enhanced lambda");
          
          const response = await fetch(`${this.baseURL}/getMapping/connections?${params}`, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json',
                  'X-User-Email': userEmail,
                  'Accept': 'application/json'
              }
          });

          if (!response.ok) {
              const errorText = await response.text();
              console.error("API Error Response:", errorText);
              
              if (response.status === 401) {
                  throw new Error('Authentication failed. Please log in again.');
              } else if (response.status === 403) {
                  throw new Error('Access denied. Please check your permissions.');
              } else if (response.status >= 500) {
                  throw new Error('Server error occurred. Please try again later.');
              } else {
                  throw new Error(`Request failed: ${response.status} ${response.statusText}`);
              }
          }

          const data = await response.json();
          console.log("✓ Received enhanced connections data:", {
              notebooks: data.notebooks?.length || 0,
              connections: data.connections?.length || 0,
              hasNetworkIntelligence: !!data.networkIntelligence,
              hasSmartClusters: !!data.smartClusters
          });

          // Validate and enhance the response data
          const enhancedData = this.processConnectionsData(data);
          enhancedData.isDemoData = false; // Mark as real data

          // Cache the enhanced data
          this.cache.set(cacheKey, {
              data: enhancedData,
              timestamp: Date.now()
          });

          return enhancedData;

      } catch (error) {
          console.error("❌ Enhanced ConnectionsService Error:", error);
          
          // Return graceful fallback data instead of throwing
          if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
              throw error; // Re-throw auth errors
          }
          
          // For other errors, return minimal data structure
          console.warn("Returning fallback data due to error");
          const fallbackData = this.getFallbackData();
          fallbackData.isDemoData = true; // Mark as demo data
          return fallbackData;
      }
  }

  /**
   * Process and enhance the raw connections data
   */
  processConnectionsData(rawData) {
      console.log("Processing enhanced connections data...");

      // Ensure we have valid data structures
      const notebooks = rawData.notebooks || [];
      const connections = rawData.connections || [];

      // Enhanced notebook processing
      const processedNotebooks = notebooks.map(notebook => ({
          ...notebook,
          // Ensure required fields
          notebookId: notebook.notebookId || notebook.id || 'unknown',
          title: notebook.title || 'Untitled Notebook',
          tags: Array.isArray(notebook.tags) ? notebook.tags.filter(tag => tag && tag.trim()) : [],
          wordCount: Math.max(0, parseInt(notebook.wordCount) || 0),
          connections: Array.isArray(notebook.connections) ? notebook.connections : [],
          preview: notebook.preview || notebook.content?.substring(0, 200) || '',
          updatedAt: notebook.updatedAt || notebook.createdAt || new Date().toISOString(),
          // Enhanced fields
          connectionCount: 0, // Will be calculated below
          hubScore: 0,
          topicRelevance: 0
      }));

      // Enhanced connection processing with validation
      const processedConnections = connections
          .filter(conn => conn.source && conn.target && conn.source !== conn.target)
          .map(conn => ({
              ...conn,
              // Ensure required fields
              source: conn.source,
              target: conn.target,
              type: conn.type || 'unknown',
              strength: Math.max(0, Math.min(1, parseFloat(conn.strength) || 0.5)),
              strengthCategory: conn.strengthCategory || this.categorizeStrength(conn.strength || 0.5),
              commonTags: Array.isArray(conn.commonTags) ? conn.commonTags : [],
              // Enhanced fields
              factors: conn.factors || {},
              metadata: conn.metadata || {},
              bidirectional: conn.metadata?.bidirectional || false
          }));

      // Calculate enhanced metrics for notebooks
      const connectionCounts = new Map();
      processedConnections.forEach(conn => {
          connectionCounts.set(conn.source, (connectionCounts.get(conn.source) || 0) + 1);
          connectionCounts.set(conn.target, (connectionCounts.get(conn.target) || 0) + 1);
      });

      // Update notebooks with calculated metrics
      processedNotebooks.forEach(notebook => {
          const connCount = connectionCounts.get(notebook.notebookId) || 0;
          notebook.connectionCount = connCount;
          notebook.hubScore = this.calculateHubScore(notebook, processedConnections);
          notebook.topicRelevance = this.calculateTopicRelevance(notebook, processedNotebooks);
      });

      // Process network intelligence
      const networkIntelligence = rawData.networkIntelligence || this.calculateBasicNetworkMetrics(processedNotebooks, processedConnections);

      // Process smart clusters
      const smartClusters = rawData.smartClusters || this.calculateBasicClusters(processedNotebooks, processedConnections);

      return {
          notebooks: processedNotebooks,
          connections: processedConnections,
          networkIntelligence: networkIntelligence,
          smartClusters: smartClusters,
          statistics: {
              ...rawData.statistics,
              totalNotebooks: processedNotebooks.length,
              totalConnections: processedConnections.length,
              enhancedProcessing: true,
              processedAt: new Date().toISOString()
          }
      };
  }

  /**
   * Calculate hub score for a notebook
   */
  calculateHubScore(notebook, connections) {
      const directConnections = connections.filter(conn => 
          conn.source === notebook.notebookId || conn.target === notebook.notebookId
      );

      if (directConnections.length === 0) return 0;

      // Calculate weighted score based on connection strength and types
      let score = 0;
      directConnections.forEach(conn => {
          const baseScore = conn.strength || 0.5;
          const typeMultiplier = conn.type === 'explicit' ? 1.5 : 1.0;
          const strengthMultiplier = conn.strengthCategory === 'strong' ? 1.3 : 
                                   conn.strengthCategory === 'moderate' ? 1.1 : 1.0;
          score += baseScore * typeMultiplier * strengthMultiplier;
      });

      return Math.min(1.0, score / Math.max(1, directConnections.length));
  }

  /**
   * Calculate topic relevance for a notebook
   */
  calculateTopicRelevance(notebook, allNotebooks) {
      if (!notebook.tags || notebook.tags.length === 0) return 0;

      const totalNotebooks = allNotebooks.length;
      if (totalNotebooks <= 1) return 1;

      // Calculate tag frequency across all notebooks
      const tagFrequency = new Map();
      allNotebooks.forEach(nb => {
          nb.tags.forEach(tag => {
              tagFrequency.set(tag.toLowerCase(), (tagFrequency.get(tag.toLowerCase()) || 0) + 1);
          });
      });

      // Calculate relevance based on tag rarity and notebook properties
      let relevanceScore = 0;
      notebook.tags.forEach(tag => {
          const frequency = tagFrequency.get(tag.toLowerCase()) || 1;
          const rarity = 1 - (frequency / totalNotebooks);
          relevanceScore += rarity;
      });

      // Normalize and add word count factor
      relevanceScore = relevanceScore / notebook.tags.length;
      const wordCountFactor = Math.min(0.2, (notebook.wordCount || 0) / 10000);
      
      return Math.min(1.0, relevanceScore + wordCountFactor);
  }

  /**
   * Categorize connection strength
   */
  categorizeStrength(strength) {
      if (strength >= 0.7) return 'strong';
      if (strength >= 0.4) return 'moderate';
      return 'weak';
  }

  /**
   * Calculate basic network metrics when not provided by lambda
   */
  calculateBasicNetworkMetrics(notebooks, connections) {
      const totalNodes = notebooks.length;
      const totalConnections = connections.length;

      if (totalNodes === 0) {
          return {
              totalNodes: 0,
              totalConnections: 0,
              density: 0,
              averageConnections: 0,
              networkHealth: { connected: false, wellConnected: false, hasHubs: false, diverse: false }
          };
      }

      const maxPossibleConnections = (totalNodes * (totalNodes - 1)) / 2;
      const density = totalConnections / maxPossibleConnections;

      // Calculate connection distribution
      const connectionCounts = new Map();
      connections.forEach(conn => {
          connectionCounts.set(conn.source, (connectionCounts.get(conn.source) || 0) + 1);
          connectionCounts.set(conn.target, (connectionCounts.get(conn.target) || 0) + 1);
      });

      const avgConnections = Array.from(connectionCounts.values()).reduce((a, b) => a + b, 0) / totalNodes;

      // Analyze tags
      const allTags = notebooks.flatMap(nb => nb.tags || []);
      const uniqueTags = new Set(allTags.map(tag => tag.toLowerCase())).size;
      const tagDiversity = uniqueTags / totalNodes;

      return {
          totalNodes,
          totalConnections,
          density: Math.round(density * 10000) / 10000,
          averageConnections: Math.round(avgConnections * 100) / 100,
          networkHealth: {
              connected: totalConnections > 0,
              wellConnected: density > 0.1,
              hasHubs: Array.from(connectionCounts.values()).some(count => count >= 3),
              diverse: tagDiversity > 0.3
          },
          tagAnalysis: {
              uniqueTags,
              totalTags: allTags.length,
              diversity: Math.round(tagDiversity * 1000) / 1000
          }
      };
  }

  /**
   * Calculate basic clusters when not provided by lambda
   */
  calculateBasicClusters(notebooks, connections) {
      // Tag-based clustering
      const tagClusters = new Map();
      notebooks.forEach(notebook => {
          (notebook.tags || []).forEach(tag => {
              const normalizedTag = tag.toLowerCase();
              if (!tagClusters.has(normalizedTag)) {
                  tagClusters.set(normalizedTag, []);
              }
              tagClusters.get(normalizedTag).push(notebook.notebookId);
          });
      });

      // Convert to array format and filter meaningful clusters
      const clusterArray = Array.from(tagClusters.entries())
          .filter(([tag, notebooks]) => notebooks.length >= 2)
          .map(([tag, notebookIds]) => ({
              tag,
              notebooks: notebookIds,
              size: notebookIds.length
          }))
          .sort((a, b) => b.size - a.size);

      return {
          tagClusters: Object.fromEntries(clusterArray.map(cluster => [cluster.tag, cluster.notebooks])),
          statistics: {
              totalClusters: clusterArray.length,
              averageClusterSize: clusterArray.length > 0 ? 
                  clusterArray.reduce((sum, cluster) => sum + cluster.size, 0) / clusterArray.length : 0
          }
      };
  }

  /**
   * Analyze network patterns and health
   */
  analyzeNetwork(data) {
      if (!data || !data.notebooks || !data.connections) {
          return this.getEmptyNetworkAnalysis();
      }

      const { notebooks, connections } = data;
      
      // Use existing analysis if available, otherwise calculate
      if (data.networkIntelligence) {
          return {
              ...data.networkIntelligence,
              // Add any additional analysis
              recommendations: this.generateNetworkRecommendations(data),
              insights: this.generateNetworkInsights(data)
          };
      }

      // Fallback to basic analysis
      const basicMetrics = this.calculateBasicNetworkMetrics(notebooks, connections);
      return {
          ...basicMetrics,
          recommendations: this.generateNetworkRecommendations(data),
          insights: this.generateNetworkInsights(data)
      };
  }

  /**
   * Generate network recommendations
   */
  generateNetworkRecommendations(data) {
      const recommendations = [];
      const { notebooks, connections, networkIntelligence } = data;

      if (!networkIntelligence) return recommendations;

      // Check network density
      if (networkIntelligence.density < 0.1) {
          recommendations.push({
              type: 'connectivity',
              priority: 'high',
              message: 'Your network has low connectivity. Consider adding more tags or explicit connections between related notebooks.',
              action: 'Add tags or create links between similar notebooks'
          });
      }

      // Check for isolated notebooks
      const connectedNotebooks = new Set();
      connections.forEach(conn => {
          connectedNotebooks.add(conn.source);
          connectedNotebooks.add(conn.target);
      });

      const isolatedCount = notebooks.length - connectedNotebooks.size;
      if (isolatedCount > 0) {
          recommendations.push({
              type: 'isolation',
              priority: 'medium',
              message: `${isolatedCount} notebook(s) are isolated. Consider tagging them or creating connections.`,
              action: 'Review and tag isolated notebooks'
          });
      }

      // Check tag diversity
      if (networkIntelligence.tagAnalysis?.diversity < 0.3) {
          recommendations.push({
              type: 'diversity',
              priority: 'medium',
              message: 'Low tag diversity detected. Consider using more varied and specific tags.',
              action: 'Add more diverse tags to improve categorization'
          });
      }

      return recommendations;
  }

  /**
   * Generate network insights
   */
  generateNetworkInsights(data) {
      const insights = [];
      const { notebooks, connections, networkIntelligence } = data;

      if (!networkIntelligence) return insights;

      // Identify most connected notebooks
      if (networkIntelligence.hubs && networkIntelligence.hubs.length > 0) {
          const topHub = networkIntelligence.hubs[0];
          insights.push({
              type: 'hub',
              message: `"${topHub.notebook?.title || 'Unknown'}" is your most connected notebook with ${topHub.connections} connections.`,
              importance: 'high'
          });
      }

      // Analyze connection types
      const explicitCount = connections.filter(c => c.type === 'explicit').length;
      const smartCount = connections.filter(c => c.type === 'smart_similarity').length;
      
      if (explicitCount > 0 && smartCount > 0) {
          insights.push({
              type: 'connection_mix',
              message: `Your network has a good mix of explicit links (${explicitCount}) and smart connections (${smartCount}).`,
              importance: 'medium'
          });
      }

      // Tag usage insights
      if (networkIntelligence.tagAnalysis?.mostCommon) {
          const topTags = networkIntelligence.tagAnalysis.mostCommon.slice(0, 3);
          insights.push({
              type: 'tags',
              message: `Most used tags: ${topTags.map(t => `${t.tag} (${t.count})`).join(', ')}`,
              importance: 'low'
          });
      }

      return insights;
  }

  /**
   * Get fallback data when API fails
   */
  getFallbackData() {
      return {
          notebooks: [],
          connections: [],
          networkIntelligence: this.getEmptyNetworkAnalysis(),
          smartClusters: { tagClusters: {}, statistics: { totalClusters: 0 } },
          statistics: {
              totalNotebooks: 0,
              totalConnections: 0,
              fallbackMode: true,
              message: 'Unable to load data. Please check your connection and try again.'
          }
      };
  }

  /**
   * Get empty network analysis structure
   */
  getEmptyNetworkAnalysis() {
      return {
          totalNodes: 0,
          totalConnections: 0,
          density: 0,
          averageConnections: 0,
          networkHealth: {
              connected: false,
              wellConnected: false,
              hasHubs: false,
              diverse: false
          },
          tagAnalysis: {
              uniqueTags: 0,
              totalTags: 0,
              diversity: 0,
              mostCommon: []
          }
      };
  }

  /**
   * Get user email from storage or auth context
   */
  getUserEmail() {
      // This should be implemented based on your auth system
      // Example implementations:
      
      // From localStorage
      const stored = localStorage.getItem('userEmail') || localStorage.getItem('user');
      if (stored) {
          try {
              const parsed = JSON.parse(stored);
              return parsed.email || parsed;
          } catch {
              return stored.includes('@') ? stored : null;
          }
      }

      // From sessionStorage
      const session = sessionStorage.getItem('userEmail') || sessionStorage.getItem('user');
      if (session) {
          try {
              const parsed = JSON.parse(session);
              return parsed.email || parsed;
          } catch {
              return session.includes('@') ? session : null;
          }
      }

      // From context or other auth providers
      // return authContext.user?.email;
      
      console.warn('No user email found. Please implement getUserEmail() based on your auth system.');
      return null;
  }

  /**
   * Clear cache
   */
  clearCache() {
      this.cache.clear();
      console.log('ConnectionsService cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
      return {
          size: this.cache.size,
          entries: Array.from(this.cache.keys()),
          timeout: this.cacheTimeout
      };
  }
}

export default EnhancedConnectionsService;