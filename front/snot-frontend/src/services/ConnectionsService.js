// Enhanced ConnectionsService.js
import authService from './AuthService'; // Import your auth service

class EnhancedConnectionsService {
  constructor() {
      // Fix the baseURL to use your actual API endpoint
      this.baseURL = 'https://ch2l8cp5l3.execute-api.eu-central-1.amazonaws.com/dev';
      this.cache = new Map();
      this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
      
      // Add auth service reference
      this.authService = authService;
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
          
          if (options.includeTagGroups !== false) {
              params.append('includeTagGroups', 'true');
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

          // Try to get user email using auth service
          const userEmail = this.getUserEmail();
          if (!userEmail) {
              console.warn('No user email found, proceeding with fallback data');
              return this.getFallbackData();
          }

          console.log("✓ Making API request to enhanced lambda");
          
          // Try the enhanced API endpoint first
          try {
              const response = await fetch(`${this.baseURL}/getMapping/connections?${params}`, {
                  method: 'GET',
                  headers: {
                      'Content-Type': 'application/json',
                      'X-User-Email': userEmail,
                      'Accept': 'application/json',
                      'Authorization': await this.getAuthToken()
                  }
              });

              if (response.ok) {
                  const data = await response.json();
                  console.log("✓ Received enhanced connections data from API");
                  
                  // Validate and enhance the response data
                  const enhancedData = this.processConnectionsData(data);
                  enhancedData.isDemoData = false;

                  // Cache the enhanced data
                  this.cache.set(cacheKey, {
                      data: enhancedData,
                      timestamp: Date.now()
                  });

                  return enhancedData;
              } else {
                  console.warn(`API request failed with status ${response.status}, falling back to notebook-based analysis`);
              }
          } catch (apiError) {
              console.warn('Enhanced API not available, falling back to notebook-based analysis:', apiError.message);
          }

          // Fallback: Use notebook service to build connections
          return await this.buildConnectionsFromNotebooks(options);

      } catch (error) {
          console.error("❌ Enhanced ConnectionsService Error:", error);
          
          // Return graceful fallback data instead of throwing
          if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
              console.warn('Authentication issue, returning fallback data');
          }
          
          console.warn("Returning fallback data due to error");
          const fallbackData = this.getFallbackData();
          fallbackData.isDemoData = true;
          return fallbackData;
      }
  }

  /**
   * Build connections from notebook service when enhanced API is not available
   */
  async buildConnectionsFromNotebooks(options = {}) {
      try {
          console.log("Building connections from notebook service...");
          
          // Import notebook service dynamically to avoid circular dependencies
          const { default: notebookService } = await import('./NotebookService');
          
          // Get all notebooks
          const notebooks = await notebookService.getNotebooks();
          
          if (!notebooks || notebooks.length === 0) {
              console.log('No notebooks found, returning demo data');
              return this.getFallbackData();
          }

          console.log(`Found ${notebooks.length} notebooks, analyzing connections...`);

          // Normalize notebook data
          const normalizedNotebooks = this.normalizeNotebooks(notebooks);
          
          // Analyze connections
          const connections = this.analyzeConnections(normalizedNotebooks, options.minSimilarity || 0.2);
          
          // Build tag groups if requested
          const tagGroups = options.includeTagGroups ? this.groupNotebooksByTags(normalizedNotebooks) : {};
          
          // Calculate network metrics
          const networkIntelligence = this.calculateBasicNetworkMetrics(normalizedNotebooks, connections);
          
          // Build smart clusters
          const smartClusters = this.calculateBasicClusters(normalizedNotebooks, connections);

          const result = {
              notebooks: normalizedNotebooks,
              connections: connections,
              tagGroups: tagGroups,
              networkIntelligence: networkIntelligence,
              smartClusters: smartClusters,
              statistics: {
                  totalNotebooks: normalizedNotebooks.length,
                  totalConnections: connections.length,
                  source: 'notebook_service_fallback',
                  processedAt: new Date().toISOString()
              },
              isDemoData: false
          };

          console.log("✓ Successfully built connections from notebooks:", {
              notebooks: result.notebooks.length,
              connections: result.connections.length,
              tagGroups: Object.keys(result.tagGroups).length
          });

          return result;

      } catch (error) {
          console.error('Error building connections from notebooks:', error);
          return this.getFallbackData();
      }
  }

  /**
   * Normalize notebook data for consistent structure
   */
  normalizeNotebooks(notebooks) {
      return notebooks.map(notebook => {
          // Handle different notebook ID formats
          const notebookId = notebook.notebookId || notebook.id || notebook.NotebookId;
          
          // Handle different title formats
          const title = notebook.title || notebook.Title || `Untitled (${notebookId?.substring(0, 8) || 'Unknown'})`;
          
          // Handle different tag formats
          let tags = [];
          if (Array.isArray(notebook.tags)) {
              tags = notebook.tags.filter(tag => tag && tag.trim());
          } else if (notebook.tags && typeof notebook.tags === 'string') {
              tags = [notebook.tags];
          } else if (notebook.Tags && Array.isArray(notebook.Tags)) {
              tags = notebook.Tags.filter(tag => tag && tag.trim());
          }
          
          // Ensure we have at least one tag
          if (tags.length === 0) {
              tags = ['Uncategorized'];
          }

          // Calculate word count
          const wordCount = notebook.wordCount || 
                          notebook.WordCount || 
                          (notebook.content ? notebook.content.split(' ').length : 0) ||
                          (notebook.Content ? notebook.Content.split(' ').length : 0) ||
                          Math.floor(Math.random() * 2000) + 100; // Random fallback for demo

          return {
              notebookId: notebookId,
              title: title,
              tags: tags,
              wordCount: wordCount,
              content: notebook.content || notebook.Content || '',
              connections: notebook.connections || [],
              createdAt: notebook.createdAt || notebook.CreatedAt || new Date().toISOString(),
              updatedAt: notebook.updatedAt || notebook.UpdatedAt || notebook.lastModified || new Date().toISOString(),
              filesCount: notebook.filesCount || notebook.files?.length || 0,
              linksCount: notebook.linksCount || notebook.links?.length || 0,
              preview: notebook.preview || (notebook.content || notebook.Content || '').substring(0, 200) || ''
          };
      });
  }

  /**
   * Analyze connections between notebooks based on tags and explicit connections
   */
  analyzeConnections(notebooks, minSimilarity = 0.2) {
      const connections = [];
      const processedPairs = new Set();

      for (let i = 0; i < notebooks.length; i++) {
          const notebook1 = notebooks[i];
          
          for (let j = i + 1; j < notebooks.length; j++) {
              const notebook2 = notebooks[j];
              
              // Create unique pair identifier
              const pairId = `${notebook1.notebookId}-${notebook2.notebookId}`;
              if (processedPairs.has(pairId)) continue;
              processedPairs.add(pairId);

              // Check for explicit connections first
              const hasExplicitConnection = 
                  notebook1.connections.includes(notebook2.notebookId) ||
                  notebook2.connections.includes(notebook1.notebookId);

              if (hasExplicitConnection) {
                  connections.push({
                      source: notebook1.notebookId,
                      target: notebook2.notebookId,
                      type: 'explicit',
                      strength: 1.0,
                      strengthCategory: 'strong',
                      commonTags: this.findCommonTags(notebook1.tags, notebook2.tags),
                      factors: { explicit: true },
                      metadata: { bidirectional: true }
                  });
                  continue;
              }

              // Calculate tag similarity
              const similarity = this.calculateTagSimilarity(notebook1.tags, notebook2.tags);
              
              if (similarity >= minSimilarity) {
                  connections.push({
                      source: notebook1.notebookId,
                      target: notebook2.notebookId,
                      type: 'smart_similarity',
                      strength: similarity,
                      strengthCategory: this.categorizeStrength(similarity),
                      commonTags: this.findCommonTags(notebook1.tags, notebook2.tags),
                      factors: { tagSimilarity: similarity },
                      metadata: { bidirectional: false }
                  });
              }
          }
      }

      console.log(`Analyzed connections: ${connections.length} found`);
      return connections;
  }

  /**
   * Calculate similarity between two sets of tags
   */
  calculateTagSimilarity(tags1, tags2) {
      if (!tags1.length || !tags2.length) return 0;

      // Normalize tags to lowercase for comparison
      const normalizedTags1 = tags1.map(tag => tag.toLowerCase());
      const normalizedTags2 = tags2.map(tag => tag.toLowerCase());

      // Find common tags
      const commonTags = normalizedTags1.filter(tag => normalizedTags2.includes(tag));
      
      // Calculate Jaccard similarity: |intersection| / |union|
      const union = new Set([...normalizedTags1, ...normalizedTags2]);
      const similarity = commonTags.length / union.size;

      return Math.round(similarity * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Find common tags between two notebooks
   */
  findCommonTags(tags1, tags2) {
      const normalizedTags1 = tags1.map(tag => tag.toLowerCase());
      const normalizedTags2 = tags2.map(tag => tag.toLowerCase());
      
      return tags1.filter(tag => normalizedTags2.includes(tag.toLowerCase()));
  }

  /**
   * Group notebooks by their tags
   */
  groupNotebooksByTags(notebooks) {
      const tagGroups = {};

      notebooks.forEach(notebook => {
          notebook.tags.forEach(tag => {
              const normalizedTag = tag.toLowerCase();
              if (!tagGroups[normalizedTag]) {
                  tagGroups[normalizedTag] = [];
              }
              tagGroups[normalizedTag].push(notebook.notebookId);
          });
      });

      return tagGroups;
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
          tagGroups: rawData.tagGroups || this.groupNotebooksByTags(processedNotebooks),
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
      const density = maxPossibleConnections > 0 ? totalConnections / maxPossibleConnections : 0;

      // Calculate connection distribution
      const connectionCounts = new Map();
      connections.forEach(conn => {
          connectionCounts.set(conn.source, (connectionCounts.get(conn.source) || 0) + 1);
          connectionCounts.set(conn.target, (connectionCounts.get(conn.target) || 0) + 1);
      });

      const avgConnections = totalNodes > 0 ? Array.from(connectionCounts.values()).reduce((a, b) => a + b, 0) / totalNodes : 0;

      // Analyze tags
      const allTags = notebooks.flatMap(nb => nb.tags || []);
      const uniqueTags = new Set(allTags.map(tag => tag.toLowerCase())).size;
      const tagDiversity = totalNodes > 0 ? uniqueTags / totalNodes : 0;

      // Find most connected notebooks
      const mostConnectedNotebooks = notebooks
          .map(notebook => ({
              notebook,
              connections: connectionCounts.get(notebook.notebookId) || 0
          }))
          .sort((a, b) => b.connections - a.connections)
          .slice(0, 5);

      // Find isolated notebooks
      const connectedNotebooks = new Set();
      connections.forEach(conn => {
          connectedNotebooks.add(conn.source);
          connectedNotebooks.add(conn.target);
      });
      const isolatedNotebooks = notebooks.filter(nb => !connectedNotebooks.has(nb.notebookId));

      return {
          totalNodes: totalNodes,
          totalConnections: totalConnections,
          density: Math.round(density * 10000) / 10000,
          averageConnections: Math.round(avgConnections * 100) / 100,
          networkDensity: density, // For backward compatibility
          isolatedNotebooks: isolatedNotebooks,
          mostConnectedNotebooks: mostConnectedNotebooks,
          averageConnectionStrength: connections.length > 0 ? 
              connections.reduce((sum, conn) => sum + conn.strength, 0) / connections.length : 0,
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
   * Search notebooks by title or tags - for backward compatibility
   */
  searchNotebooks(searchTerm, connectionsData) {
      if (!searchTerm.trim() || !connectionsData.notebooks) {
          return connectionsData.notebooks || [];
      }

      const searchLower = searchTerm.toLowerCase();
      
      return connectionsData.notebooks.filter(notebook => {
          // Search in title
          if (notebook.title && notebook.title.toLowerCase().includes(searchLower)) {
              return true;
          }
          
          // Search in tags
          if (notebook.tags && notebook.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
              return true;
          }
          
          // Search in content preview
          if (notebook.preview && notebook.preview.toLowerCase().includes(searchLower)) {
              return true;
          }
          
          return false;
      });
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
      if (networkIntelligence.isolatedNotebooks && networkIntelligence.isolatedNotebooks.length > 0) {
          recommendations.push({
              type: 'isolation',
              priority: 'medium',
              message: `${networkIntelligence.isolatedNotebooks.length} notebook(s) are isolated. Consider tagging them or creating connections.`,
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
      if (networkIntelligence.mostConnectedNotebooks && networkIntelligence.mostConnectedNotebooks.length > 0) {
          const topHub = networkIntelligence.mostConnectedNotebooks[0];
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
      // Generate some sample data for demonstration
      const sampleNotebooks = [
          { 
              notebookId: 'demo-1', 
              title: 'AI Research Notes', 
              tags: ['AI', 'Research', 'Machine Learning'], 
              wordCount: 1500,
              preview: 'Notes on artificial intelligence and machine learning research...'
          },
          { 
              notebookId: 'demo-2', 
              title: 'Data Science Project', 
              tags: ['Data Science', 'Python', 'Analytics'], 
              wordCount: 2000,
              preview: 'Project documentation for data science work...'
          },
          { 
              notebookId: 'demo-3', 
              title: 'Programming Best Practices', 
              tags: ['Programming', 'Best Practices', 'Code'], 
              wordCount: 1200,
              preview: 'Guidelines and best practices for programming...'
          },
          { 
              notebookId: 'demo-4', 
              title: 'Research Papers Collection', 
              tags: ['Research', 'Papers', 'Academic'], 
              wordCount: 3000,
              preview: 'Collection of research papers and analysis...'
          }
      ];

      const sampleConnections = [
          { source: 'demo-1', target: 'demo-4', type: 'smart_similarity', strength: 0.8, commonTags: ['Research'] },
          { source: 'demo-1', target: 'demo-2', type: 'smart_similarity', strength: 0.6, commonTags: [] },
          { source: 'demo-2', target: 'demo-3', type: 'smart_similarity', strength: 0.7, commonTags: ['Programming'] }
      ];

      return {
          notebooks: sampleNotebooks,
          connections: sampleConnections,
          tagGroups: {
              'ai': ['demo-1'],
              'research': ['demo-1', 'demo-4'],
              'data science': ['demo-2'],
              'programming': ['demo-2', 'demo-3']
          },
          networkIntelligence: this.calculateBasicNetworkMetrics(sampleNotebooks, sampleConnections),
          smartClusters: { tagClusters: {}, statistics: { totalClusters: 0 } },
          statistics: {
              totalNotebooks: sampleNotebooks.length,
              totalConnections: sampleConnections.length,
              fallbackMode: true,
              message: 'Demo data displayed. Connect to your account to see real data.'
          },
          isDemoData: true
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
          networkDensity: 0,
          isolatedNotebooks: [],
          mostConnectedNotebooks: [],
          averageConnectionStrength: 0,
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
   * Get user email from auth service
   */
  getUserEmail() {
      try {
          // Try to get from auth service first
          if (this.authService && this.authService.getUserData) {
              const userData = this.authService.getUserData();
              if (userData && userData.email) {
                  return userData.email;
              }
          }

          // Fallback to localStorage/sessionStorage
          const stored = localStorage.getItem('userEmail') || localStorage.getItem('user');
          if (stored) {
              try {
                  const parsed = JSON.parse(stored);
                  return parsed.email || (typeof parsed === 'string' && parsed.includes('@') ? parsed : null);
              } catch {
                  return stored.includes('@') ? stored : null;
              }
          }

          const session = sessionStorage.getItem('userEmail') || sessionStorage.getItem('user');
          if (session) {
              try {
                  const parsed = JSON.parse(session);
                  return parsed.email || (typeof parsed === 'string' && parsed.includes('@') ? parsed : null);
              } catch {
                  return session.includes('@') ? session : null;
              }
          }

          return null;
      } catch (error) {
          console.warn('Error getting user email:', error);
          return null;
      }
  }

  /**
   * Get auth token
   */
  async getAuthToken() {
      try {
          if (this.authService && this.authService.getAuthHeaders) {
              const headers = await this.authService.getAuthHeaders();
              return headers.Authorization || '';
          }
          return '';
      } catch (error) {
          console.warn('Error getting auth token:', error);
          return '';
      }
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

// Create and export singleton instance
const connectionsService = new EnhancedConnectionsService();

export default connectionsService;