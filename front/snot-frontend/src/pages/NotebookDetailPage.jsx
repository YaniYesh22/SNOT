import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Sidebar from '../components/Sidebar';

export default function NotebookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notebook, setNotebook] = useState({
    id,
    title: 'Loading...',
    content: '',
    lastUpdated: new Date().toISOString()
  });
  
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load notebook data from localStorage on component mount
  useEffect(() => {
    const loadNotebookData = () => {
      try {
        const savedNotebooks = localStorage.getItem('notebooks');
        
        if (savedNotebooks) {
          const notebooksArray = JSON.parse(savedNotebooks);
          const currentNotebook = notebooksArray.find(nb => nb.id === id);
          
          if (currentNotebook) {
            // If this notebook exists in localStorage
            const fullNotebook = {
              ...currentNotebook,
              content: currentNotebook.content || '',
              lastUpdated: currentNotebook.lastUpdated || new Date().toISOString()
            };
            
            setNotebook(fullNotebook);
            setContent(fullNotebook.content || '');
          } else {
            // If not found, use the ID to create a title (for newly created notebooks)
            const title = id.replace(/-/g, ' ');
            setNotebook({
              id,
              title: title,
              content: '',
              lastUpdated: new Date().toISOString()
            });
          }
        } else {
          // If no notebooks in localStorage, use defaults
          const title = id.replace(/-/g, ' ');
          setNotebook({
            id,
            title: title,
            content: '',
            lastUpdated: new Date().toISOString()
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading notebook data:", error);
        // Set default values on error
        setNotebook({
          id,
          title: id ? id.replace(/-/g, ' ') : 'Untitled Notebook',
          content: '',
          lastUpdated: new Date().toISOString()
        });
        setIsLoading(false);
      }
    };
    
    // Simulate loading delay for better UX
    setTimeout(loadNotebookData, 300);
  }, [id]);
  
  const handleSave = () => {
    setIsSaving(true);
    
    try {
      // Update the current notebook
      const updatedNotebook = {
        ...notebook,
        content: content,
        lastUpdated: new Date().toISOString()
      };
      
      setNotebook(updatedNotebook);
      
      // Get all notebooks from localStorage
      const savedNotebooks = localStorage.getItem('notebooks');
      let notebooksArray = [];
      
      if (savedNotebooks) {
        notebooksArray = JSON.parse(savedNotebooks);
        
        // Find this notebook in the array and update it
        const notebookIndex = notebooksArray.findIndex(nb => nb.id === id);
        
        if (notebookIndex >= 0) {
          notebooksArray[notebookIndex] = updatedNotebook;
        } else {
          // If not found, add it
          notebooksArray.push(updatedNotebook);
        }
      } else {
        // If no notebooks in localStorage, create an array with just this one
        notebooksArray = [updatedNotebook];
      }
      
      // Save the updated array back to localStorage
      localStorage.setItem('notebooks', JSON.stringify(notebooksArray));
      
      // Show success feedback
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    } catch (error) {
      console.error("Error saving notebook:", error);
      setIsSaving(false);
    }
  };
  
  const handleBack = () => {
    navigate('/dashboard');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <main style={styles.main}>
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading notebook...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />

      <main style={styles.main}>
        <header style={styles.header}>
          <button onClick={handleBack} style={styles.backButton}>
            ← Back to Notebooks
          </button>
          <div style={styles.headerRight}>
            <span style={styles.lastUpdated}>
              Last updated: {formatDate(notebook.lastUpdated)}
            </span>
            <button 
              onClick={handleSave} 
              style={{
                ...styles.saveButton,
                ...(isSaving ? styles.savingButton : {})
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </header>

        <div style={styles.editorContainer}>
          <input
            type="text"
            value={notebook.title}
            onChange={(e) => setNotebook({...notebook, title: e.target.value})}
            style={styles.titleInput}
            placeholder="Notebook Title"
          />
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={styles.editor}
            placeholder="Start taking notes..."
          />
        </div>
        
        <div style={styles.features}>
          <div style={styles.featureCard}>
            <h3 style={styles.featureTitle}>
              <span style={styles.featureIcon}>🧠</span> AI Assistant
            </h3>
            <p style={styles.featureDescription}>
              Get help from our AI to summarize your notes, generate questions, or explain concepts.
            </p>
            <button style={styles.featureButton}>Ask AI</button>
          </div>
          
          <div style={styles.featureCard}>
            <h3 style={styles.featureTitle}>
              <span style={styles.featureIcon}>🔄</span> Topic Connections
            </h3>
            <p style={styles.featureDescription}>
              See how this notebook connects to other topics in your knowledge map.
            </p>
            <button style={styles.featureButton}>View Connections</button>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { 
    display: "flex", 
    height: "100vh"
  },
  main: {
    flexGrow: 1,
    background: '#f9fafb',
    padding: '2rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#4b5563',
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease',
    fontWeight: '500'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  lastUpdated: {
    color: '#6b7280',
    fontSize: '0.875rem'
  },
  saveButton: {
    padding: '0.5rem 1rem',
    background: '#1f78ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'background-color 0.2s ease'
  },
  savingButton: {
    background: '#90caf9',
    cursor: 'not-allowed'
  },
  editorContainer: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    flexGrow: 1
  },
  titleInput: {
    border: 'none',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '1.5rem',
    fontWeight: '600',
    padding: '0.5rem 0',
    outline: 'none',
    marginBottom: '1rem'
  },
  editor: {
    border: 'none',
    outline: 'none',
    fontSize: '1rem',
    lineHeight: '1.5',
    resize: 'none',
    flexGrow: 1,
    height: '400px',
    fontFamily: 'inherit'
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginTop: '1rem'
  },
  featureCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  featureTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  featureIcon: {
    fontSize: '1.3rem'
  },
  featureDescription: {
    margin: 0,
    color: '#6b7280',
    fontSize: '0.95rem',
    lineHeight: '1.5'
  },
  featureButton: {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    color: '#374151',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.95rem',
    alignSelf: 'flex-start'
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#6b7280",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #f3f4f6",
    borderRadius: "50%",
    borderTop: "3px solid #1f78ff",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  }
};