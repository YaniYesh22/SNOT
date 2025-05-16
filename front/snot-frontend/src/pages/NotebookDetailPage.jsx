import 'react-quill/dist/quill.snow.css'; // Import Quill styles

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ReactQuill from 'react-quill';
import Sidebar from '../components/Sidebar';
import notebookService from '../services/NotebookService';

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
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSave, setAutoSave] = useState(true);
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [summaryType, setSummaryType] = useState('normal');
  
  // Quill editor modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      [{'color': []}, {'background': []}],
      ['link', 'code-block'],
      ['clean']
    ],
  };
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'code-block'
  ];
  
  // Function to count words in HTML content
  const getWordCount = (htmlContent) => {
    if (!htmlContent) return 0;
    
    // Remove HTML tags
    const text = htmlContent.replace(/<[^>]*>/g, ' ');
    
    // Remove extra spaces and count words
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  // Debounce function for auto-save
  const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  };
  
  // Create a debounced save function
  const debouncedSave = useCallback(
    debounce(() => {
      if (autoSave && !isLoading && content) {
        handleSave();
      }
    }, 2000), // 2 seconds delay
    [autoSave, content, isLoading] // Dependencies
  );
  
  // Trigger auto-save when content changes
  useEffect(() => {
    if (content && !isLoading) {
      debouncedSave();
    }
  }, [content, debouncedSave, isLoading]);
  
  // Load notebook data from API on component mount
  useEffect(() => {
    const loadNotebookData = async () => {
      try {
        setIsLoading(true);
        
        // Try to get the notebook from the API
        try {
          const notebookData = await notebookService.getNotebook(id);
          
          if (notebookData) {
            // Format the notebook data
            const formattedNotebook = {
              id: notebookData.NotebookId || notebookData.notebookId || id,
              title: notebookData.Title || notebookData.title || 'Untitled Notebook',
              content: notebookData.Content || notebookData.content || '',
              createdAt: notebookData.CreatedAt || notebookData.createdAt || new Date().toISOString(),
              lastUpdated: notebookData.UpdatedAt || notebookData.updatedAt || new Date().toISOString(),
              files: notebookData.files || [],
              links: notebookData.links || []
            };
            
            setNotebook(formattedNotebook);
            setContent(formattedNotebook.content);
            if (formattedNotebook.files) setFiles(formattedNotebook.files);
            if (formattedNotebook.links) setLinks(formattedNotebook.links);
            
            console.log("Loaded notebook from API:", formattedNotebook);
          } else {
            // If no data returned, create a new notebook with this ID
            const title = id.replace(/-/g, ' ');
            const newNotebook = {
              id,
              title: title,
              content: '',
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              files: [],
              links: []
            };
            setNotebook(newNotebook);
            console.log("Created new notebook:", newNotebook);
          }
        } catch (apiError) {
          console.error("Error loading notebook from API:", apiError);
          
          // Fallback to localStorage
          const savedNotebooks = localStorage.getItem('notebooks');
          
          if (savedNotebooks) {
            const notebooksArray = JSON.parse(savedNotebooks);
            const currentNotebook = notebooksArray.find(nb => nb.id === id);
            
            if (currentNotebook) {
              // If this notebook exists in localStorage
              const fullNotebook = {
                ...currentNotebook,
                content: currentNotebook.content || '',
                lastUpdated: currentNotebook.updatedAt || currentNotebook.lastUpdated || new Date().toISOString(),
                files: currentNotebook.files || [],
                links: currentNotebook.links || []
              };
              
              setNotebook(fullNotebook);
              setContent(fullNotebook.content || '');
              if (fullNotebook.files) setFiles(fullNotebook.files);
              if (fullNotebook.links) setLinks(fullNotebook.links);
              
              console.log("Loaded notebook from localStorage:", fullNotebook);
            } else {
              // If not found, use the ID to create a title
              const title = id.replace(/-/g, ' ');
              const newNotebook = {
                id,
                title: title,
                content: '',
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                files: [],
                links: []
              };
              setNotebook(newNotebook);
              console.log("Created new notebook (localStorage fallback):", newNotebook);
            }
          } else {
            // If no notebooks in localStorage, use defaults
            const title = id.replace(/-/g, ' ');
            setNotebook({
              id,
              title: title,
              content: '',
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              files: [],
              links: []
            });
            console.log("Created new notebook (no localStorage):", { id, title });
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading notebook data:", error);
        // Set default values on error
        setNotebook({
          id,
          title: id ? id.replace(/-/g, ' ') : 'Untitled Notebook',
          content: '',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          files: [],
          links: []
        });
        setIsLoading(false);
      }
    };
    
    // Load the notebook data
    loadNotebookData();
  }, [id]);
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Update the current notebook
      const updatedNotebook = {
        ...notebook,
        title: notebook.title,
        content: content,
        lastUpdated: new Date().toISOString(),
        files: files,
        links: links
      };
      
      setNotebook(updatedNotebook);
      
      // Prepare data for API update
      const updateData = {
        NotebookId: updatedNotebook.id,
        userId: updatedNotebook.userId,
        title: updatedNotebook.title,
        Content: content,
        files: files,
        links: links
      };
      
      // Call the API to update the notebook
      try {
        await notebookService.updateNotebook(updatedNotebook.id, updateData);
        console.log("Notebook saved to API successfully");
      } catch (apiError) {
        console.error("Error saving to API:", apiError);
        // Fallback to localStorage even if API fails
      }
      
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
      
      // Update last saved timestamp
      setLastSaved(new Date());
      
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

  // File drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Handle dropped files
      const droppedFiles = Array.from(e.dataTransfer.files);
      
      // Create file metadata (in a real app, you would upload these to S3 or another storage)
      const newFiles = droppedFiles.map(file => ({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
        url: URL.createObjectURL(file) // This is temporary and will only work during the current session
      }));
      
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    } else {
      // Check if a URL was dropped
      const droppedText = e.dataTransfer.getData('text');
      if (droppedText && isValidUrl(droppedText)) {
        addLink(droppedText);
      }
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const addLink = (url) => {
    if (isValidUrl(url)) {
      const newLink = {
        id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: url,
        title: url, // You could fetch the page title in a real app
        addedAt: new Date().toISOString()
      };
      
      setLinks(prevLinks => [...prevLinks, newLink]);
      setNewLink('');
    }
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    if (newLink) {
      addLink(newLink);
    }
  };

  const removeFile = (fileId) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
  };

  const removeLink = (linkId) => {
    setLinks(prevLinks => prevLinks.filter(link => link.id !== linkId));
  };
  
  // Handle AI chat summarization type change
  const handleSummaryTypeChange = (e) => {
    setSummaryType(e.target.value);
  };
  
  // Handle asking AI
  const handleAskAI = () => {
    // In a real app, this would call AWS Bedrock
    console.log(`Asking AI for a ${summaryType} summary of the content`);
    // You would implement the API call to AWS Bedrock here
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
              {lastSaved ? `Last saved: ${formatDate(lastSaved)}` : 
                          `Last updated: ${formatDate(notebook.lastUpdated)}`}
            </span>
            <div style={styles.saveOptions}>
              <label style={styles.autoSaveToggle}>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={() => setAutoSave(!autoSave)}
                  style={styles.autoSaveCheckbox}
                />
                <span style={styles.autoSaveLabel}>Auto-save</span>
              </label>
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
          
          <div style={styles.contentArea}>
            {/* Notes editor section */}
            <div style={styles.editorSection}>
              <h3 style={styles.sectionTitle}>Notes</h3>
              <div style={styles.editorWrapper}>
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  formats={formats}
                  placeholder="Start taking notes..."
                  style={styles.quillEditor}
                />
                <div style={styles.wordCount}>
                  {getWordCount(content)} words
                </div>
              </div>
            </div>
            
            {/* Resources section */}
            <div style={styles.resourcesSection}>
              <h3 style={styles.sectionTitle}>Resources</h3>
              
              {/* Drop zone for files and links */}
              <div 
                style={{
                  ...styles.dropZone,
                  ...(isDraggingOver ? styles.dropZoneActive : {})
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div style={styles.dropZoneContent}>
                  <div style={styles.dropIcon}>📁</div>
                  <p style={styles.dropText}>
                    Drag and drop files or links here
                  </p>
                </div>
              </div>
              
              {/* Link input form */}
              <form onSubmit={handleAddLink} style={styles.linkForm}>
                <input
                  type="text"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="Add a link (https://...)"
                  style={styles.linkInput}
                />
                <button type="submit" style={styles.addLinkButton}>
                  Add
                </button>
              </form>
              
              {/* Files list */}
              {files.length > 0 && (
                <div style={styles.filesContainer}>
                  <h4 style={styles.resourcesHeading}>Files</h4>
                  <ul style={styles.resourcesList}>
                    {files.map(file => (
                      <li key={file.id} style={styles.resourceItem}>
                        <span style={styles.resourceIcon}>📄</span>
                        <span style={styles.resourceName}>{file.name}</span>
                        <button 
                          onClick={() => removeFile(file.id)}
                          style={styles.removeButton}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Links list */}
              {links.length > 0 && (
                <div style={styles.linksContainer}>
                  <h4 style={styles.resourcesHeading}>Links</h4>
                  <ul style={styles.resourcesList}>
                    {links.map(link => (
                      <li key={link.id} style={styles.resourceItem}>
                        <span style={styles.resourceIcon}>🔗</span>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={styles.resourceLink}
                        >
                          {link.title}
                        </a>
                        <button 
                          onClick={() => removeLink(link.id)}
                          style={styles.removeButton}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom section with AI Chat and Topic Connections */}
        <div style={styles.featuresGrid}>
          {/* AI Chat card */}
          <div style={styles.featureCard}>
            <h3 style={styles.featureTitle}>
              <span style={styles.featureIcon}>🧠</span> AI Chat
            </h3>
            <p style={styles.featureDescription}>
              Get help from our AI to summarize your notes, generate questions, or explain concepts.
            </p>
            
            {/* Summarization type selector */}
            <div style={styles.summaryTypeContainer}>
              <label style={styles.summaryTypeLabel}>Summarization type:</label>
              <div style={styles.summaryTypeOptions}>
                <label style={styles.summaryTypeOption}>
                  <input
                    type="radio"
                    name="summaryType"
                    value="normal"
                    checked={summaryType === 'normal'}
                    onChange={handleSummaryTypeChange}
                  />
                  <span>Normal</span>
                </label>
                <label style={styles.summaryTypeOption}>
                  <input
                    type="radio"
                    name="summaryType"
                    value="concise"
                    checked={summaryType === 'concise'}
                    onChange={handleSummaryTypeChange}
                  />
                  <span>Concise</span>
                </label>
                <label style={styles.summaryTypeOption}>
                  <input
                    type="radio"
                    name="summaryType"
                    value="explanatory"
                    checked={summaryType === 'explanatory'}
                    onChange={handleSummaryTypeChange}
                  />
                  <span>Explanatory</span>
                </label>
                <label style={styles.summaryTypeOption}>
                  <input
                    type="radio"
                    name="summaryType"
                    value="formal"
                    checked={summaryType === 'formal'}
                    onChange={handleSummaryTypeChange}
                  />
                  <span>Formal</span>
                </label>
              </div>
            </div>
            
            <button 
              style={styles.featureButton}
              onClick={handleAskAI}
            >
              Ask AI
            </button>
            
            <div style={styles.comingSoon}>
              AI Chat with AWS Bedrock coming soon!
            </div>
          </div>
          
          {/* Topic Connections card */}
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
  saveOptions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  autoSaveToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer'
  },
  autoSaveCheckbox: {
    cursor: 'pointer'
  },
  autoSaveLabel: {
    fontSize: '0.875rem',
    color: '#6b7280'
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
    flexGrow: 1,
    height: 'calc(100vh - 330px)' // Adjusted to make room for features at bottom
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
  contentArea: {
    display: 'flex',
    gap: '1.5rem',
    height: 'calc(100% - 60px)', // Adjust for title input
    flexGrow: 1
  },
  editorSection: {
    flex: '2',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  resourcesSection: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #e5e7eb',
    paddingLeft: '1.5rem',
    height: '100%',
    overflowY: 'auto'
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '1rem',
    color: '#374151'
  },
  editorWrapper: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 40px)' // Adjust for section title
  },
  quillEditor: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  wordCount: {
    fontSize: '0.875rem',
    color: '#6b7280',
    textAlign: 'right',
    marginTop: '0.5rem',
    paddingRight: '0.5rem'
  },
  dropZone: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  dropZoneActive: {
    borderColor: '#1f78ff',
    backgroundColor: 'rgba(31, 120, 255, 0.05)'
  },
  dropZoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  dropIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: '#6b7280'
  },
  dropText: {
    margin: 0,
    fontSize: '0.95rem',
    color: '#6b7280'
  },
  linkForm: {
    display: 'flex',
    marginBottom: '1.5rem'
  },
  linkInput: {
    flexGrow: 1,
    padding: '0.5rem 0.75rem',
    borderRadius: '6px 0 0 6px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    outline: 'none'
  },
  addLinkButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#1f78ff',
    color: 'white',
    border: 'none',
    borderRadius: '0 6px 6px 0',
    cursor: 'pointer',
    fontWeight: '500'
  },
  filesContainer: {
    marginBottom: '1.5rem'
  },
  linksContainer: {
    marginBottom: '1.5rem'
  },
  resourcesHeading: {
    fontSize: '1rem',
    fontWeight: '600',
    margin: '0 0 0.75rem 0',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '0.5rem'
  },
  resourcesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  resourceItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #f3f4f6'
  },
  resourceIcon: {
    marginRight: '0.5rem',
    fontSize: '1.1rem'
  },
  resourceName: {
    flexGrow: 1,
    fontSize: '0.95rem',
    color: '#374151',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  resourceLink: {
    flexGrow: 1,
    fontSize: '0.95rem',
    color: '#1f78ff',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  removeButton: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '0 0.25rem'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
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
  summaryTypeContainer: {
    marginTop: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  summaryTypeLabel: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#4b5563'
  },
  summaryTypeOptions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  summaryTypeOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: 'pointer',
    fontSize: '0.95rem',
    color: '#4b5563'
  },
  featureButton: {
    marginTop: '0.75rem',
    padding: '0.5rem 1rem',
    background: '#1f78ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.95rem',
    alignSelf: 'flex-start'
  },
  comingSoon: {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    fontStyle: 'italic',
    color: '#6b7280',
    alignSelf: 'center'
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