//topicmappage.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import TopicMapVisualization from "../components/TopicMapVisualization";
import connectionsService from "../services/ConnectionsService";

export default function TopicMapPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [minSimilarity, setMinSimilarity] = useState(0.1);
  const [connectionsData, setConnectionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkStats, setNetworkStats] = useState(null);

  // Load connections data on component mount
  useEffect(() => {
    loadConnectionsData();
  }, [minSimilarity]);


  const loadConnectionsData = async () => {
    try {
      console.log("=== TopicMapPage Debug - Loading Data ===");
      setLoading(true);
      setError(null);

      const data = await connectionsService.getConnections({
        minSimilarity: minSimilarity,
        includeTagGroups: true
      });

      console.log("Raw data from connectionsService:", data);
      console.log("Data structure check:");
      console.log("- data.notebooks exists:", !!data.notebooks);
      console.log("- data.notebooks length:", data.notebooks?.length || 0);
      console.log("- data.connections exists:", !!data.connections);
      console.log("- data.connections length:", data.connections?.length || 0);
      console.log("- Sample notebook:", data.notebooks?.[0]);
      console.log("- Sample connection:", data.connections?.[0]);

      setConnectionsData(data);
      console.log("Set connectionsData state with:", data);

      // Generate network statistics
      const stats = connectionsService.analyzeNetwork(data);
      setNetworkStats(stats);
      console.log("Generated network stats:", stats);

    } catch (err) {
      console.error('=== TopicMapPage Error ===');
      console.error('Error loading connections:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      });
      setError(err.message);
    } finally {
      setLoading(false);
      console.log("=== TopicMapPage Debug - Loading Complete ===");
    }
  };

  // Also add this useEffect to monitor connectionsData changes
  useEffect(() => {
    console.log("=== TopicMapPage State Change ===");
    console.log("connectionsData updated:", connectionsData);
    console.log("loading:", loading);
    console.log("error:", error);
  }, [connectionsData, loading, error]);

  // Get unique categories from notebooks
  const getCategories = () => {
    if (!connectionsData?.notebooks) return [];

    const categories = new Set(['all']);
    connectionsData.notebooks.forEach(notebook => {
      notebook.tags.forEach(tag => categories.add(tag));
    });

    return Array.from(categories).sort();
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle category filter change
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Handle similarity threshold change
  const handleSimilarityChange = (e) => {
    const newSimilarity = parseFloat(e.target.value);
    setMinSimilarity(newSimilarity);
  };

  // Get filtered and sorted notebooks for display
  const getFilteredNotebooks = () => {
    if (!connectionsData?.notebooks) return [];

    let filtered = connectionsData.notebooks;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = connectionsService.searchNotebooks(searchTerm, connectionsData);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(notebook =>
        notebook.tags.some(tag => tag.toLowerCase().includes(categoryFilter.toLowerCase()))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'connections':
        // Sort by number of connections
        const connectionCounts = {};
        connectionsData.connections.forEach(conn => {
          connectionCounts[conn.source] = (connectionCounts[conn.source] || 0) + 1;
          connectionCounts[conn.target] = (connectionCounts[conn.target] || 0) + 1;
        });
        filtered.sort((a, b) => (connectionCounts[b.notebookId] || 0) - (connectionCounts[a.notebookId] || 0));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'wordcount':
        filtered.sort((a, b) => b.wordCount - a.wordCount);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        break;
      default: // relevance
        // Keep original order or sort by word count as relevance proxy
        filtered.sort((a, b) => b.wordCount - a.wordCount);
    }

    return filtered;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <main style={styles.main}>
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Loading topic map...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <main style={styles.main}>
          <div style={styles.errorContainer}>
            <h2 style={styles.errorTitle}>Unable to Load Topic Map</h2>
            <p style={styles.errorText}>{error}</p>
            <button onClick={loadConnectionsData} style={styles.retryButton}>
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const filteredNotebooks = getFilteredNotebooks();
  const categories = getCategories();

  return (
    <div style={styles.container}>
      <Sidebar />

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.titleSection}>
              <h1 style={styles.title}>Topic Map Visualization</h1>
              <p style={styles.description}>
                Explore how concepts in your notebooks are connected. Click on topics to see their relationships.
              </p>
            </div>

            {/* Statistics Summary */}
            {networkStats && (
              <div style={styles.statsContainer}>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{networkStats.totalNotebooks}</span>
                  <span style={styles.statLabel}>Notebooks</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{networkStats.totalConnections}</span>
                  <span style={styles.statLabel}>Connections</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{networkStats.isolatedNotebooks.length}</span>
                  <span style={styles.statLabel}>Isolated</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{Math.round(networkStats.networkDensity * 100)}%</span>
                  <span style={styles.statLabel}>Density</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <section style={styles.controlsSection}>
          <div style={styles.controls}>
            {/* Search and Filters Row */}
            <div style={styles.controlsRow}>
              <div style={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search notebooks and tags..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={styles.searchInput}
                />
                <svg style={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </div>

              <div style={styles.filtersContainer}>
                <select
                  value={categoryFilter}
                  onChange={handleCategoryChange}
                  style={styles.filterSelect}
                >
                  <option value="all">All Categories</option>
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  style={styles.filterSelect}
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="connections">Most Connections</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="wordcount">Word Count</option>
                  <option value="recent">Recently Updated</option>
                </select>
              </div>
            </div>

            {/* Advanced Controls Row */}
            <div style={styles.advancedControls}>
              <div style={styles.sliderContainer}>
                <label style={styles.sliderLabel}>
                  Connection Sensitivity: {Math.round(minSimilarity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={minSimilarity}
                  onChange={handleSimilarityChange}
                  style={styles.slider}
                />
                <div style={styles.sliderTicks}>
                  <span>Loose</span>
                  <span>Strict</span>
                </div>
              </div>

              <div style={styles.resultCount}>
                Showing {filteredNotebooks.length} of {connectionsData?.notebooks?.length || 0} notebooks
              </div>
            </div>
          </div>
        </section>

        <section style={styles.visualizationSection}>
          <div style={styles.visualizationContainer}>
            <TopicMapVisualization
              key={`viz-${connectionsData ? 'real' : 'none'}-${connectionsData?.notebooks?.length || 0}-${Date.now()}`}
              connectionsData={connectionsData}
              searchTerm={searchTerm}
              categoryFilter={categoryFilter}
              sortBy={sortBy}
              minSimilarity={minSimilarity}
            />
          </div>
        </section>

        {/* Most Connected Notebooks */}
        {networkStats?.mostConnectedNotebooks && networkStats.mostConnectedNotebooks.length > 0 && (
          <section style={styles.insightsSection}>
            <h3 style={styles.insightsTitle}>Network Insights</h3>

            <div style={styles.insightsGrid}>
              <div style={styles.insightCard}>
                <h4 style={styles.insightCardTitle}>Most Connected Notebooks</h4>
                <div style={styles.connectedList}>
                  {networkStats.mostConnectedNotebooks.slice(0, 3).map((item, index) => (
                    <div key={item.notebook?.notebookId || index} style={styles.connectedItem}>
                      <span style={styles.connectedTitle}>
                        {item.notebook?.title || 'Unknown'}
                      </span>
                      <span style={styles.connectedCount}>
                        {item.connections} connections
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.insightCard}>
                <h4 style={styles.insightCardTitle}>Tag Groups</h4>
                <div style={styles.tagGroupsList}>
                  {Object.entries(connectionsData?.tagGroups || {}).slice(0, 3).map(([tag, notebooks]) => (
                    <div key={tag} style={styles.tagGroupItem}>
                      <span style={styles.tagName}>{tag}</span>
                      <span style={styles.tagCount}>{notebooks.length} notebooks</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.insightCard}>
                <h4 style={styles.insightCardTitle}>Network Health</h4>
                <div style={styles.healthMetrics}>
                  <div style={styles.healthItem}>
                    <span>Connection Strength</span>
                    <span style={styles.healthValue}>
                      {Math.round(networkStats.averageConnectionStrength * 100)}%
                    </span>
                  </div>
                  <div style={styles.healthItem}>
                    <span>Network Coverage</span>
                    <span style={styles.healthValue}>
                      {Math.round((1 - networkStats.isolatedNotebooks.length / networkStats.totalNotebooks) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  main: {
    flexGrow: 1,
    background: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '2rem',
    flexShrink: 0
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '2rem'
  },
  titleSection: {
    flex: 1
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 0.5rem 0'
  },
  description: {
    color: '#6b7280',
    fontSize: '1.1rem',
    margin: 0,
    lineHeight: '1.5'
  },
  statsContainer: {
    display: 'flex',
    gap: '2rem'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem'
  },
  statNumber: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#3b82f6'
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '500'
  },
  controlsSection: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '1.5rem 2rem',
    flexShrink: 0
  },
  controls: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  controlsRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  searchContainer: {
    position: 'relative',
    flex: '1',
    minWidth: '300px',
    maxWidth: '400px'
  },
  searchInput: {
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    width: '100%',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  },
  searchIcon: {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    pointerEvents: 'none'
  },
  filtersContainer: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  filterSelect: {
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: 'white',
    fontSize: '0.95rem',
    color: '#374151',
    cursor: 'pointer',
    outline: 'none'
  },
  advancedControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    padding: '1rem',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  sliderContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minWidth: '200px'
  },
  sliderLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151'
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#e5e7eb',
    outline: 'none',
    cursor: 'pointer'
  },
  sliderTicks: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#9ca3af'
  },
  resultCount: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '500'
  },
  visualizationSection: {
    flex: 1,
    padding: '2rem',
    overflow: 'hidden'
  },
  visualizationContainer: {
    height: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb'
  },
  insightsSection: {
    background: 'white',
    borderTop: '1px solid #e5e7eb',
    padding: '2rem',
    flexShrink: 0
  },
  insightsTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 1.5rem 0',
    textAlign: 'center'
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  insightCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1.5rem'
  },
  insightCardTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 1rem 0'
  },
  connectedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  connectedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem',
    background: 'white',
    borderRadius: '6px',
    border: '1px solid #e5e7eb'
  },
  connectedTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  connectedCount: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '500'
  },
  tagGroupsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  tagGroupItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem',
    background: 'white',
    borderRadius: '6px',
    border: '1px solid #e5e7eb'
  },
  tagName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#3b82f6',
    textTransform: 'capitalize'
  },
  tagCount: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  healthMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  healthItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem',
    background: 'white',
    borderRadius: '6px',
    border: '1px solid #e5e7eb'
  },
  healthValue: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#059669'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#6b7280'
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  },
  loadingText: {
    fontSize: '1.1rem',
    fontWeight: '500'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '2rem',
    textAlign: 'center'
  },
  errorTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#dc2626',
    margin: '0 0 1rem 0'
  },
  errorText: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: '0 0 2rem 0',
    maxWidth: '400px'
  },
  retryButton: {
    padding: '0.75rem 1.5rem',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  }
};