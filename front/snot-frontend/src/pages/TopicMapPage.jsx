import React from "react";
import Sidebar from "../components/Sidebar";
import TopicMapVisualization from "../components/TopicMapVisualization";

export default function TopicMapPage() {
  return (
    <div style={styles.container}>
      <Sidebar />

      <main style={styles.main}>
        <header style={styles.header}>
          <h1>Topic Map Visualization</h1>
          <p style={styles.description}>
            Explore how concepts in your notebooks are connected. Click on topics to see their relationships.
          </p>
        </header>

        <section style={styles.visual}>
          <div style={styles.mapControls}>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search topics..."
                style={styles.searchInput}
              />
            </div>
            <div style={styles.filtersContainer}>
              <select style={styles.filterSelect}>
                <option value="all">All Categories</option>
                <option value="AI">AI</option>
                <option value="Models">Models</option>
                <option value="Data">Data</option>
              </select>
              <select style={styles.filterSelect}>
                <option value="relevance">Sort by Relevance</option>
                <option value="connections">Most Connections</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>
          
          <TopicMapVisualization />
          
          <div style={styles.mapInfo}>
            <p style={styles.infoText}>
              This visualization shows the connections between topics in your notebooks. 
              The size of each node represents its importance, and the thickness of the lines 
              shows the strength of the connection.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  container: { display: "flex", height: "100vh", fontFamily: "sans-serif" },
  main: {
    flexGrow: 1,
    background: '#f9fafb',
    padding: '2rem',
    overflowY: 'auto'
  },
  header: {
    marginBottom: '2rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '1rem'
  },
  description: {
    color: '#6b7280',
    fontSize: '1.1rem',
    maxWidth: '800px',
    margin: '0.5rem 0 0 0'
  },
  visual: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  mapControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  searchContainer: {
    flex: '1',
    minWidth: '200px',
    maxWidth: '300px'
  },
  searchInput: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    width: '100%',
    fontSize: '0.95rem'
  },
  filtersContainer: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  filterSelect: {
    padding: '0.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: 'white',
    fontSize: '0.95rem',
    color: '#374151'
  },
  mapInfo: {
    borderTop: '1px solid #f3f4f6',
    paddingTop: '1rem',
    marginTop: '1rem'
  },
  infoText: {
    color: '#6b7280',
    fontSize: '0.95rem',
    margin: 0,
    lineHeight: '1.5'
  }
};