import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import TopicMapVisualization from "../components/TopicMapVisualization";
import ConnectionsService from "../services/ConnectionsService";
import { styles } from "../styles/TopicMapPageStyles";
import { debounce } from 'lodash';

const EnhancedTopicMapPage = () => {
  // Core state
  const [connectionsData, setConnectionsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasRealData, setHasRealData] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minSimilarity, setMinSimilarity] = useState(0.2);
  const [timeRange, setTimeRange] = useState('all');
  const [maxConnections, setMaxConnections] = useState(100);
  
  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showNetworkInsights, setShowNetworkInsights] = useState(true);
  
  // Advanced state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [connectionTypes, setConnectionTypes] = useState(['smart_similarity', 'explicit']);
  const [includeSmartClusters, setIncludeSmartClusters] = useState(true);
  const [includeNetworkIntelligence, setIncludeNetworkIntelligence] = useState(true);

  const navigate = useNavigate();
  const debouncedSearchTerm = useMemo(() => debounce(setSearchTerm, 300), []);

  // Initialize service
  const connectionsService = useMemo(() => new ConnectionsService(), []);

  // Load connections data
  const loadConnectionsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const options = {
        minSimilarity,
        timeRange,
        maxConnections,
        connectionTypes,
        includeSmartClusters,
        includeNetworkIntelligence
      };

      const data = await connectionsService.getConnections(options);
      setConnectionsData(data);
      setHasRealData(!data.isDemoData);
    } catch (err) {
      console.error('Error loading connections:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [
    connectionsService,
    minSimilarity,
    timeRange,
    maxConnections,
    connectionTypes,
    includeSmartClusters,
    includeNetworkIntelligence
  ]);

  // Initial data load
  useEffect(() => {
    loadConnectionsData();
  }, [loadConnectionsData]);

  // Handle search
  const handleSearch = (value) => {
    debouncedSearchTerm(value);
  };

  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle node selection
  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    if (node) {
      navigate(`/notebook/${node.id}`);
    }
  };

  // Handle node hover
  const handleNodeHover = (node) => {
    setHoveredNode(node);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Get available categories
  const getAvailableCategories = () => {
    if (!connectionsData?.notebooks) return [];
    const categories = new Set();
    connectionsData.notebooks.forEach(notebook => {
      if (notebook.categories) {
        notebook.categories.forEach(category => categories.add(category));
      }
    });
    return Array.from(categories);
  };

  // Get filtered notebooks
  const getFilteredNotebooks = () => {
    if (!connectionsData?.notebooks) return [];
    return connectionsData.notebooks.filter(notebook => {
      const matchesSearch = searchTerm === '' || 
        notebook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notebook.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategories = selectedCategories.length === 0 ||
        notebook.categories?.some(category => selectedCategories.includes(category));

      return matchesSearch && matchesCategories;
    });
  };

  // Get network insights
  const getNetworkInsights = () => {
    if (!connectionsData?.networkIntelligence) return null;
    return connectionsData.networkIntelligence;
  };

  // Get smart clusters
  const getSmartClusters = () => {
    if (!connectionsData?.smartClusters) return [];
    return connectionsData.smartClusters;
  };

  // Get quick stats
  const getQuickStats = () => {
    if (!connectionsData) return null;
    return {
      totalNotebooks: connectionsData.notebooks?.length || 0,
      totalConnections: connectionsData.connections?.length || 0,
      averageSimilarity: connectionsData.stats?.averageSimilarity || 0,
      clusterCount: connectionsData.smartClusters?.length || 0
    };
  };

  // Render loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading connections...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Error Loading Connections</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button 
            style={styles.retryButton}
            onClick={loadConnectionsData}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get filtered data
  const filteredNotebooks = getFilteredNotebooks();
  const availableCategories = getAvailableCategories();
  const networkInsights = getNetworkInsights();
  const smartClusters = getSmartClusters();
  const quickStats = getQuickStats();

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        width: sidebarCollapsed ? '60px' : '300px'
      }}>
        {/* Sidebar Header */}
        <div style={styles.sidebarHeader}>
          {!sidebarCollapsed && (
            <h2 style={styles.sidebarTitle}>Topic Map</h2>
          )}
          <button 
            style={styles.sidebarToggle}
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search notebooks..."
              style={styles.searchInput}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        )}

        {/* Quick Stats */}
        {!sidebarCollapsed && quickStats && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h3 style={styles.statValue}>{quickStats.totalNotebooks}</h3>
              <p style={styles.statLabel}>Notebooks</p>
            </div>
            <div style={styles.statCard}>
              <h3 style={styles.statValue}>{quickStats.totalConnections}</h3>
              <p style={styles.statLabel}>Connections</p>
            </div>
            <div style={styles.statCard}>
              <h3 style={styles.statValue}>
                {(quickStats.averageSimilarity * 100).toFixed(1)}%
              </h3>
              <p style={styles.statLabel}>Avg. Similarity</p>
            </div>
            <div style={styles.statCard}>
              <h3 style={styles.statValue}>{quickStats.clusterCount}</h3>
              <p style={styles.statLabel}>Clusters</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {!sidebarCollapsed && (
          <div style={styles.filtersContainer}>
            <h3 style={styles.filtersTitle}>Filters</h3>
            
            {/* Categories */}
            <div style={styles.filterSection}>
              <h4 style={styles.filterLabel}>Categories</h4>
              <div style={styles.categoriesList}>
                {availableCategories.map(category => (
                  <label key={category} style={styles.categoryItem}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>

            {/* Similarity Threshold */}
            <div style={styles.filterSection}>
              <h4 style={styles.filterLabel}>Min. Similarity</h4>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={minSimilarity}
                onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.sliderValue}>
                {(minSimilarity * 100).toFixed(0)}%
              </span>
            </div>

            {/* Time Range */}
            <div style={styles.filterSection}>
              <h4 style={styles.filterLabel}>Time Range</h4>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              style={styles.advancedToggle}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
            </button>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div style={styles.advancedFilters}>
                {/* Connection Types */}
                <div style={styles.filterSection}>
                  <h4 style={styles.filterLabel}>Connection Types</h4>
                  <label style={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={connectionTypes.includes('smart_similarity')}
                      onChange={(e) => {
                        setConnectionTypes(prev =>
                          e.target.checked
                            ? [...prev, 'smart_similarity']
                            : prev.filter(t => t !== 'smart_similarity')
                        );
                      }}
                    />
                    Smart Similarity
                  </label>
                  <label style={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={connectionTypes.includes('explicit')}
                      onChange={(e) => {
                        setConnectionTypes(prev =>
                          e.target.checked
                            ? [...prev, 'explicit']
                            : prev.filter(t => t !== 'explicit')
                        );
                      }}
                    />
                    Explicit
                  </label>
                </div>

                {/* Max Connections */}
                <div style={styles.filterSection}>
                  <h4 style={styles.filterLabel}>Max Connections</h4>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    step="10"
                    value={maxConnections}
                    onChange={(e) => setMaxConnections(parseInt(e.target.value))}
                    style={styles.numberInput}
                  />
                </div>

                {/* Additional Options */}
                <div style={styles.filterSection}>
                  <label style={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={includeSmartClusters}
                      onChange={(e) => setIncludeSmartClusters(e.target.checked)}
                    />
                    Include Smart Clusters
                  </label>
                  <label style={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={includeNetworkIntelligence}
                      onChange={(e) => setIncludeNetworkIntelligence(e.target.checked)}
                    />
                    Include Network Intelligence
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.actionButtons}>
          <button
            style={styles.actionButton}
            onClick={loadConnectionsData}
          >
            Refresh
          </button>
          {!sidebarCollapsed && (
            <button
              style={styles.actionButton}
              onClick={() => setShowNetworkInsights(!showNetworkInsights)}
            >
              {showNetworkInsights ? 'Hide' : 'Show'} Insights
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Visualization */}
        <div style={styles.visualizationWrapper}>
          <TopicMapVisualization
            data={connectionsData}
            searchTerm={searchTerm}
            selectedCategories={selectedCategories}
            onNodeSelect={handleNodeSelect}
            onNodeHover={handleNodeHover}
            selectedNode={selectedNode}
            hoveredNode={hoveredNode}
          />
        </div>

        {/* Network Insights */}
        {showNetworkInsights && networkInsights && (
          <div style={styles.networkInsights}>
            <h3 style={styles.insightsTitle}>Network Insights</h3>
            <div style={styles.insightsGrid}>
              <div style={styles.insightCard}>
                <h4 style={styles.insightLabel}>Central Topics</h4>
                <ul style={styles.insightList}>
                  {networkInsights.centralTopics?.map(topic => (
                    <li key={topic.id} style={styles.insightItem}>
                      {topic.title}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={styles.insightCard}>
                <h4 style={styles.insightLabel}>Emerging Clusters</h4>
                <ul style={styles.insightList}>
                  {networkInsights.emergingClusters?.map(cluster => (
                    <li key={cluster.id} style={styles.insightItem}>
                      {cluster.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTopicMapPage;