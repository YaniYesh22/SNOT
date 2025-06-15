import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import TopicMapVisualization from "../components/TopicMapVisualization";
// import ConnectionsService from "../services/ConnectionsService"; // Service is now used in the hook
import { useConnectionsData } from "../hooks/useConnectionsData"; // Import the custom hook
import { styles } from "../styles/TopicMapPageStyles"; // Assuming this is a local style object for the page
import { debounce } from 'lodash';


const EnhancedTopicMapPage = () => {
  // Filter state - these will be managed by the page and passed to the hook
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minSimilarity, setMinSimilarity] = useState(0.2);
  const [timeRange, setTimeRange] = useState('all');
  const [maxConnections, setMaxConnections] = useState(100); // Default value
  const [connectionTypes, setConnectionTypes] = useState(['smart_similarity', 'explicit']);
  const [includeSmartClusters, setIncludeSmartClusters] = useState(true);
  const [includeNetworkIntelligence, setIncludeNetworkIntelligence] = useState(true);
  const [sortBy, setSortBy] = useState('relevance'); // Added sortBy state

  // UI state - remains in the page component
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null); // For interacting with the visualization
  const [hoveredNode, setHoveredNode] = useState(null);   // For interacting with the visualization
  const [showNetworkInsights, setShowNetworkInsights] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const navigate = useNavigate();

  // Memoize filter object to pass to the hook, preventing unnecessary re-fetches if filters don't change
  const currentFilters = useMemo(() => ({
    minSimilarity,
    timeRange,
    maxConnections,
    connectionTypes,
    includeSmartClusters,
    includeNetworkIntelligence,
    // searchTerm and selectedCategories are for client-side filtering in TopicMapVisualization,
    // but if the hook needed them for fetching, they'd be here.
  }), [minSimilarity, timeRange, maxConnections, connectionTypes, includeSmartClusters, includeNetworkIntelligence]);

  // Use the custom hook for data fetching
  const {
    connectionsData,
    isLoading,
    error,
    hasRealData,
    loadConnectionsData
  } = useConnectionsData(currentFilters);


  // Debounced search term update
  const debouncedSetSearchTerm = useMemo(() => debounce(setSearchTerm, 300), []);

  // Initial data load and reload when filters change
  useEffect(() => {
    loadConnectionsData(currentFilters);
  }, [loadConnectionsData, currentFilters]);


  // Handle search input change
  const handleSearchChange = (e) => {
    debouncedSetSearchTerm(e.target.value);
  };

  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategories(prevSelectedCategories =>
      prevSelectedCategories.includes(category)
        ? prevSelectedCategories.filter(c => c !== category)
        : [...prevSelectedCategories, category]
    );
    // Data will refetch due to currentFilters changing if selectedCategories were part of its deps for fetching
    // Since category filtering is client-side in TopicMapVisualization, no explicit reload needed here
    // that isn't already handled by prop changes to the visualization.
  };

  // Handle node selection (navigates to notebook detail)
  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node); // For potential local UI changes if needed
    if (node && node.id) {
      navigate(`/notebook/${node.id}`);
    }
  }, [navigate]);

  // Handle node hover (passed to visualization)
  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node);
  }, []);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Get available categories from connectionsData for filter UI
  const availableCategories = useMemo(() => {
    if (!connectionsData?.notebooks) return [];
    const categoriesSet = new Set();
    connectionsData.notebooks.forEach(notebook => {
      // Assuming tags are the categories. Adjust if there's a specific 'categories' field.
      if (notebook.tags) {
        notebook.tags.forEach(tag => categoriesSet.add(tag));
      }
    });
    return Array.from(categoriesSet).sort();
  }, [connectionsData]);

  // Get network insights - remains the same, uses connectionsData from hook
  const networkInsights = useMemo(() => {
    if (!connectionsData?.networkIntelligence) return null;
    return connectionsData.networkIntelligence;
  }, [connectionsData]);

  // Get smart clusters - remains the same
  const smartClusters = useMemo(() => {
    if (!connectionsData?.smartClusters) return []; // Ensure it's an array
    return connectionsData.smartClusters;
  }, [connectionsData]);

  // Get quick stats - remains the same
  const quickStats = useMemo(() => {
    if (!connectionsData) return null;
    // Ensure stats object and averageSimilarity exist, providing defaults if not
    const avgSim = connectionsData.stats?.averageSimilarity !== undefined
                   ? connectionsData.stats.averageSimilarity
                   : 0;
    return {
      totalNotebooks: connectionsData.notebooks?.length || 0,
      totalConnections: connectionsData.connections?.length || 0,
      averageSimilarity: avgSim,
      // Ensure smartClusters is an array before accessing its length
      clusterCount: Array.isArray(connectionsData.smartClusters) ? connectionsData.smartClusters.length : 0
    };
  }, [connectionsData]);

  // Helper function to create filter control props
  const createFilterControlProps = (id, value, onChange, type = "checkbox", options = {}) => ({
    id,
    type,
    checked: type === "checkbox" ? value : undefined,
    value: type !== "checkbox" ? value : undefined,
    onChange,
    ...options,
  });


  // Render loading state
  if (isLoading && !connectionsData) { // Show loading only if there's no data yet
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
  if (error && !connectionsData) { // Show full page error only if there's no data to display
    return (
      <div style={styles.container}> {/* Assuming styles.container is defined in TopicMapPageStyles.js */}
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Error Loading Connections</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button 
            style={styles.retryButton}
            onClick={() => loadConnectionsData(currentFilters)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If there's an error but we have some (possibly stale or fallback) data, we can show it with an error message.
  // This part is optional and depends on desired UX. For now, we prioritize showing data if available.

  return (
    <div style={styles.container}> {/* Using styles from TopicMapPageStyles.js */}
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
              onChange={handleSearchChange} // Use updated handler
              defaultValue={searchTerm} // Controlled by debounced update
            />
          </div>
        )}

        {/* Quick Stats */}
        {!sidebarCollapsed && quickStats && (
          <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <h3 style={styles.statValue}>{quickStats?.totalNotebooks || 0}</h3>
                <p style={styles.statLabel}>Notebooks</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statValue}>{quickStats?.totalConnections || 0}</h3>
                <p style={styles.statLabel}>Connections</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statValue}>
                  {((quickStats?.averageSimilarity || 0) * 100).toFixed(1)}%
                </h3>
                <p style={styles.statLabel}>Avg. Similarity</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statValue}>{quickStats?.clusterCount || 0}</h3>
                <p style={styles.statLabel}>Clusters</p>
              </div>
            </div>
        )}

        {/* Error display within sidebar if data is partially loaded or stale */}
        {error && connectionsData && (
           <div style={{...styles.filterSection, background: '#fff0f0', border: '1px solid red', padding: '10px', borderRadius: '4px'}}>
             <p style={{color: 'red', margin: 0}}>Error: {error}. Displaying cached/fallback data.</p>
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
          {connectionsData && ( // Render visualization only if data is available
            <TopicMapVisualization
              connectionsData={connectionsData} // Pass the connectionsData from the hook
              searchTerm={searchTerm}
              selectedCategories={selectedCategories} // Pass selectedCategories array
              sortBy={sortBy}
              minSimilarity={minSimilarity}
              connectionType={connectionTypes.join(',')} // Assuming TopicMapVisualization expects a string if not 'all'
              showLabels={true} // Example, manage this via state if needed
              showMetrics={true} // Example, manage this via state if needed
              onNodeSelect={handleNodeSelect}
              onNodeHover={handleNodeHover}
              // selectedNode and hoveredNode are for a different feature, not directly props for data filtering
            />
          )}
        </div>

        {/* Network Insights - ensure networkInsights and its properties are checked before rendering */}
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
                  {/* Ensure smartClusters is an array before mapping */}
                  {Array.isArray(smartClusters) && smartClusters.map(cluster => (
                    <li key={cluster.id || cluster.name} style={styles.insightItem}> {/* Use name as key if id is missing */}
                      {cluster.name}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Add more insights display as needed */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTopicMapPage;