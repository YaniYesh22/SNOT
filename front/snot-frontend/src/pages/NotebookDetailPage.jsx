import 'react-quill/dist/quill.snow.css'; // Import Quill styles

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import ReactQuill from 'react-quill';
import Sidebar from '../components/Sidebar';
import notebookService from '../services/NotebookService';

export default function NotebookDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get notebookId from location state or URL params
  const locationNotebookId = location.state?.notebookId;
  const notebookData = location.state?.notebookData;
  
  // Try to get from URL params if not in location state
  const urlParams = new URLSearchParams(location.search);
  const urlNotebookId = urlParams.get('id');
  
  // Use the notebook ID from location state, URL params, or generate fallback
  const initialNotebookId = locationNotebookId || urlNotebookId;
  
  console.log("NotebookDetailPage - IDs:", {
    locationNotebookId,
    urlNotebookId,
    initialNotebookId,
    hasNotebookData: !!notebookData
  });
  
  // Initialize with the notebookId - DON'T use fallback ID if we don't have a real ID
  const [notebook, setNotebook] = useState(notebookData || {
    notebookId: initialNotebookId || 'temp-loading',
    title: initialNotebookId ? 'Loading...' : 'New Notebook',
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
  
  // New state variables for file upload functionality
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [fileErrors, setFileErrors] = useState([]);
  
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
      // Don't load if we don't have a real notebook ID
      if (!initialNotebookId || initialNotebookId === 'temp-loading') {
        console.log("No valid notebook ID found - staying in create mode");
        setNotebook({
          notebookId: null, // Set to null to indicate this is a new notebook
          title: 'New Notebook',
          content: '',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          files: [],
          links: []
        });
        setIsLoading(false);
        return;
      }

      try {
        console.log("Loading notebook with ID:", initialNotebookId);
        
        setIsLoading(true);
        
        // Try to get the notebook from the API
        try {
          const notebookData = await notebookService.getNotebook(initialNotebookId);
          
          if (notebookData) {
            // Format the notebook data - ENSURE notebookId is set
            const formattedNotebook = {
              notebookId: notebookData.notebookId || initialNotebookId, // Always use the ID we're loading
              title: notebookData.title || 'Untitled Notebook',
              content: notebookData.content || '',
              createdAt: notebookData.createdAt || new Date().toISOString(),
              lastUpdated: notebookData.updatedAt || new Date().toISOString(),
              files: notebookData.files || [], // Files are already formatted by the service
              links: notebookData.links || [],
              // Additional metadata from your API
              createdBy: notebookData.createdBy,
              wordCount: notebookData.wordCount || 0,
              tags: notebookData.tags || [],
              connections: notebookData.connections || [],
              filesCount: notebookData.filesCount || 0,
              filesSummary: notebookData.filesSummary
            };

            setNotebook(formattedNotebook);
            setContent(formattedNotebook.content);
            
            // Set files - they're already properly formatted from the service
            if (formattedNotebook.files && formattedNotebook.files.length > 0) {
              setFiles(formattedNotebook.files);
              console.log("Loaded files:", formattedNotebook.files);
            }
            
            if (formattedNotebook.links) setLinks(formattedNotebook.links);
            
            console.log("Loaded notebook from API:", formattedNotebook);
            console.log("Files summary:", formattedNotebook.filesSummary);
          } else {
            // If no data returned, create a new notebook with this ID
            const title = initialNotebookId.replace(/-/g, ' ');
            const newNotebook = {
              notebookId: initialNotebookId,
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
            const currentNotebook = notebooksArray.find(nb => 
              (nb.notebookId === initialNotebookId) || (nb.id === initialNotebookId)
            );
            
            if (currentNotebook) {
              // If this notebook exists in localStorage
              const fullNotebook = {
                ...currentNotebook,
                notebookId: initialNotebookId, // Force set the correct ID
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
              const title = initialNotebookId.replace(/-/g, ' ');
              const newNotebook = {
                notebookId: initialNotebookId,
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
            const title = initialNotebookId.replace(/-/g, ' ');
            setNotebook({
              notebookId: initialNotebookId,
              title: title,
              content: '',
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              files: [],
              links: []
            });
            console.log("Created new notebook (no localStorage):", { notebookId: initialNotebookId, title });
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading notebook data:", error);
        // Set default values on error
        setNotebook({
          notebookId: initialNotebookId,
          title: initialNotebookId ? initialNotebookId.replace(/-/g, ' ') : 'Untitled Notebook',
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
  }, [initialNotebookId]);

  // Files are now loaded with the notebook data, so we don't need a separate effect
  // This effect is kept for any additional file operations if needed
  useEffect(() => {
    // Since files are loaded with notebook data, we can add any additional file processing here
    console.log("Current files loaded:", files.length);
  }, [files]);
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Get the current notebook ID - use the one from state
      const currentNotebookId = notebook.notebookId;
      
      // Don't save if we don't have a valid notebook ID
      if (!currentNotebookId || currentNotebookId === 'temp-loading') {
        console.log("Cannot save - no valid notebook ID");
        setIsSaving(false);
        return;
      }
      
      console.log("Saving notebook with ID:", currentNotebookId);
      
      // Update the current notebook
      const updatedNotebook = {
        ...notebook,
        notebookId: currentNotebookId,
        title: notebook.title,
        content: content,
        lastUpdated: new Date().toISOString(),
        files: files,
        links: links
      };
      
      setNotebook(updatedNotebook);
      
      // Prepare simplified data for API update - only what Lambda expects
      const updateData = {
        title: updatedNotebook.title,
        chunkNumber: 0, // Required by Lambda function
        chunkContent: content, // Required by Lambda function
        files: files, // Include files
        links: links  // Include links
      };
      
      // Call the API to update the notebook
      try {
        await notebookService.updateNotebook(
          currentNotebookId, // Explicitly pass the ID as the first parameter
          updateData
        );
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
        
        // Find this notebook in the array - check both id and notebookId
        const idToCheck = currentNotebookId;
        let notebookIndex = notebooksArray.findIndex(nb => nb.id === idToCheck);
        
        // If not found by id, try notebookId
        if (notebookIndex === -1) {
          notebookIndex = notebooksArray.findIndex(nb => nb.notebookId === idToCheck);
        }
        
        if (notebookIndex >= 0) {
          // Make sure to preserve both id and notebookId properties
          notebooksArray[notebookIndex] = {
            ...updatedNotebook,
            id: idToCheck,
            notebookId: idToCheck
          };
        } else {
          // If not found, add it with both id and notebookId properties
          notebooksArray.push({
            ...updatedNotebook,
            id: idToCheck,
            notebookId: idToCheck
          });
        }
      } else {
        // If no notebooks in localStorage, create an array with just this one
        const idToStore = currentNotebookId;
        notebooksArray = [{
          ...updatedNotebook,
          id: idToStore,
          notebookId: idToStore
        }];
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

  // Updated handleDrop function to actually upload files
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    setFileErrors([]);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      
      // Filter for supported file types
      const supportedFiles = droppedFiles.filter(file => {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        return ['.pdf', '.doc', '.docx', '.csv', '.xlsx', '.xls'].includes(ext);
      });
      
      const unsupportedFiles = droppedFiles.filter(file => {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        return !['.pdf', '.doc', '.docx', '.csv', '.xlsx', '.xls'].includes(ext);
      });
      
      // Show errors for unsupported files
      if (unsupportedFiles.length > 0) {
        setFileErrors(prev => [
          ...prev,
          ...unsupportedFiles.map(file => `${file.name}: Unsupported file type`)
        ]);
      }
      
      // Upload supported files
      if (supportedFiles.length > 0) {
        await handleFileUpload(supportedFiles);
      }
    } else {
      // Handle dropped URLs (existing logic)
      const droppedText = e.dataTransfer.getData('text');
      if (droppedText && isValidUrl(droppedText)) {
        addLink(droppedText);
      }
    }
  };

  // New function to handle file uploads
  const handleFileUpload = async (filesToUpload) => {
    // Check if we have a valid notebook ID before uploading
    if (!notebook.notebookId || notebook.notebookId === 'temp-loading') {
      setFileErrors(prev => [...prev, 'Please save the notebook before uploading files']);
      return;
    }

    setUploadingFiles(true);
    setUploadProgress({});
    
    try {
      console.log(`Starting upload of ${filesToUpload.length} files to notebook ${notebook.notebookId}`);
      
      // Initialize progress tracking
      const initialProgress = {};
      filesToUpload.forEach(file => {
        initialProgress[file.name] = { status: 'uploading', progress: 0 };
      });
      setUploadProgress(initialProgress);
      
      // Upload files using the notebook service
      const uploadResult = await notebookService.uploadFiles(notebook.notebookId, filesToUpload);
      
      // Update progress for successful uploads
      const updatedProgress = { ...initialProgress };
      uploadResult.successful.forEach(result => {
        updatedProgress[result.originalFile.name] = { 
          status: 'completed', 
          progress: 100,
          fileId: result.fileId 
        };
      });
      
      // Update progress for failed uploads
      uploadResult.failed.forEach(failure => {
        updatedProgress[failure.fileName] = { 
          status: 'error', 
          progress: 0,
          error: failure.error 
        };
      });
      
      setUploadProgress(updatedProgress);
      
      // Add successful files to the files state
      const newFiles = uploadResult.successful.map(result => ({
        id: result.fileId,
        name: result.fileName || result.originalFile.name,
        size: result.fileSize || result.originalFile.size,
        type: result.fileType || result.originalFile.type,
        lastModified: new Date().toISOString(),
        s3Url: result.s3Url,
        uploadedAt: result.uploadedAt || new Date().toISOString()
      }));
      
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // Show errors for failed uploads
      if (uploadResult.failed.length > 0) {
        setFileErrors(prev => [
          ...prev,
          ...uploadResult.failed.map(failure => `${failure.fileName}: ${failure.error}`)
        ]);
      }
      
      // Auto-save the notebook to include file references (only if we have a valid ID)
      if (autoSave && newFiles.length > 0 && notebook.notebookId && notebook.notebookId !== 'temp-loading') {
        setTimeout(() => {
          handleSave();
        }, 1000);
      }
      
      console.log(`Upload completed: ${uploadResult.totalUploaded} successful, ${uploadResult.totalFailed} failed`);
      
    } catch (error) {
      console.error('File upload error:', error);
      setFileErrors(prev => [...prev, `Upload failed: ${error.message}`]);
      
      // Update progress to show error state
      const errorProgress = {};
      filesToUpload.forEach(file => {
        errorProgress[file.name] = { status: 'error', progress: 0, error: error.message };
      });
      setUploadProgress(errorProgress);
    } finally {
      setUploadingFiles(false);
      
      // Clear progress after 5 seconds
      setTimeout(() => {
        setUploadProgress({});
      }, 5000);
    }
  };

  // Add a file input handler for the browse button
  const handleFileInputChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      await handleFileUpload(selectedFiles);
    }
    // Clear the input so the same file can be selected again
    e.target.value = '';
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

  // Updated removeFile function to also delete from server
  const removeFile = async (fileId) => {
    try {
      // Remove from server if it's a real uploaded file (has fileId that's not temporary)
      if (fileId && !fileId.startsWith('file-')) {
        await notebookService.deleteFile(notebook.notebookId, fileId);
      }
      
      // Remove from local state
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      
      // Auto-save to update file references
      if (autoSave) {
        setTimeout(() => {
          handleSave();
        }, 500);
      }
    } catch (error) {
      console.error('Error removing file:', error);
      setFileErrors(prev => [...prev, `Failed to remove file: ${error.message}`]);
      
      // Still remove from local state even if server deletion fails
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    }
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

  // Helper functions for file display
  const getFileTypeColor = (extension) => {
    const colors = {
      'PDF': '#dc2626',
      'DOC': '#2563eb',
      'DOCX': '#2563eb', 
      'CSV': '#059669',
      'XLSX': '#059669',
      'XLS': '#059669',
      '.pdf': '#dc2626',
      '.doc': '#2563eb',
      '.docx': '#2563eb',
      '.csv': '#059669',
      '.xlsx': '#059669',
      '.xls': '#059669'
    };
    return colors[extension] || '#6b7280';
  };

  const getFileTypeIcon = (extension) => {
    const ext = extension?.toUpperCase();
    if (ext === 'PDF' || ext === '.PDF') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2Z"/>
        </svg>
      );
    } else if (ext === 'DOC' || ext === 'DOCX' || ext === '.DOC' || ext === '.DOCX') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6,2H14L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M18,20V9H13V4H6V20H18Z"/>
        </svg>
      );
    } else if (ext === 'CSV' || ext === 'XLSX' || ext === 'XLS' || ext === '.CSV' || ext === '.XLSX' || ext === '.XLS') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 13.06L8.18 15.28H9.97L8 12.06L9.93 8.89H8.22L7.13 10.9L7.09 10.96L7.06 11.03Q6.8 10.5 6.5 9.96 6.25 9.43 6.07 8.89H4.25L6.2 12.1L4.32 15.28H6.04"/>
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z"/>
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <main style={styles.main}>
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Loading notebook...</p>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.backIcon}>
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Notebooks
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
                <span style={{
                  ...styles.checkboxCustom,
                  ...(autoSave ? styles.checkboxChecked : {})
                }}>
                  {autoSave && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={styles.checkIcon}>
                      <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                    </svg>
                  )}
                </span>
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
                {isSaving ? (
                  <>
                    <div style={styles.saveSpinner}></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.saveIcon}>
                      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                    </svg>
                    Save
                  </>
                )}
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
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={styles.sectionIcon}>
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  Notes
                </h3>
              </div>
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
                <div style={styles.editorFooter}>
                  <div style={styles.wordCount}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={styles.wordCountIcon}>
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    {getWordCount(content)} words
                  </div>
                </div>
              </div>
            </div>
            
            {/* Resources section */}
            <div style={styles.resourcesSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={styles.sectionIcon}>
                    <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
                  </svg>
                  Resources
                </h3>
              </div>
              
              {/* Drop zone for files and links - Updated with file input */}
              <div 
                style={{
                  ...styles.dropZone,
                  ...(isDraggingOver ? styles.dropZoneActive : {})
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.csv,.xlsx,.xls"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
                <div style={styles.dropZoneContent}>
                  <div style={styles.dropIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"/>
                    </svg>
                  </div>
                  <p style={styles.dropText}>
                    {uploadingFiles ? 'Uploading files...' : 'Drag and drop files or links here'}
                  </p>
                  <p style={styles.dropSubtext}>
                    {uploadingFiles ? 'Please wait...' : 'or click to browse (PDF, Word, CSV, Excel)'}
                  </p>
                </div>
              </div>

              {/* File upload progress */}
              {(uploadingFiles || Object.keys(uploadProgress).length > 0) && (
                <div style={styles.uploadProgress}>
                  <h4 style={styles.uploadProgressTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.uploadIcon}>
                      <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"/>
                    </svg>
                    File Upload Progress
                  </h4>
                  {Object.entries(uploadProgress).map(([fileName, progress]) => (
                    <div key={fileName} style={styles.progressItem}>
                      <div style={styles.progressHeader}>
                        <span style={styles.progressFileName}>{fileName}</span>
                        <span style={styles.progressStatus}>
                          {progress.status === 'uploading' && '⏳ Uploading...'}
                          {progress.status === 'completed' && '✅ Complete'}
                          {progress.status === 'error' && '❌ Failed'}
                        </span>
                      </div>
                      {progress.status === 'uploading' && (
                        <div style={styles.progressBar}>
                          <div style={{...styles.progressFill, width: `${progress.progress}%`}}></div>
                        </div>
                      )}
                      {progress.error && (
                        <div style={styles.progressError}>{progress.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* File upload errors */}
              {fileErrors.length > 0 && (
                <div style={styles.errorContainer}>
                  <h4 style={styles.errorTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.errorIcon}>
                      <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                    </svg>
                    Upload Errors
                  </h4>
                  {fileErrors.map((error, index) => (
                    <div key={index} style={styles.errorItem}>{error}</div>
                  ))}
                  <button 
                    onClick={() => setFileErrors([])} 
                    style={styles.clearErrorsButton}
                  >
                    Clear Errors
                  </button>
                </div>
              )}
              
              {/* Link input form */}
              <form onSubmit={handleAddLink} style={styles.linkForm}>
                <div style={styles.linkInputWrapper}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.linkInputIcon}>
                    <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z"/>
                  </svg>
                  <input
                    type="text"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="Add a link (https://...)"
                    style={styles.linkInput}
                  />
                </div>
                <button type="submit" style={styles.addLinkButton}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                  </svg>
                  Add
                </button>
              </form>
              
              {/* Files list */}
              {files.length > 0 && (
                <div style={styles.resourcesContainer}>
                  <div style={styles.filesHeader}>
                    <h4 style={styles.resourcesHeading}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={styles.resourcesHeadingIcon}>
                        <path d="M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z"/>
                      </svg>
                      Files
                    </h4>
                    <span style={styles.filesCount}>{files.length} file{files.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={styles.filesGrid}>
                    {files.map(file => (
                      <div key={file.id} style={{
                        ...styles.fileCard,
                        ...(file.isValid === false ? styles.fileCardCorrupted : {})
                      }}>
                        {/* File status indicator */}
                        {file.isValid === false && (
                          <div style={styles.fileStatusBadge}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={styles.warningIcon}>
                              <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z"/>
                            </svg>
                            Corrupted
                          </div>
                        )}
                        
                        {/* File icon and type */}
                        <div style={styles.fileIconContainer}>
                          <div style={{
                            ...styles.fileIcon,
                            backgroundColor: getFileTypeColor(file.extension || file.type)
                          }}>
                            {getFileTypeIcon(file.extension || file.type)}
                          </div>
                          {file.extension && (
                            <span style={styles.fileExtension}>{file.extension}</span>
                          )}
                        </div>
                        
                        {/* File details */}
                        <div style={styles.fileCardContent}>
                          <div style={styles.fileName} title={file.name}>
                            {file.name}
                          </div>
                          <div style={styles.fileMetadata}>
                            <span style={styles.fileSize}>
                              {file.sizeFormatted || `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                            </span>
                            {file.uploadedAt && (
                              <span style={styles.fileDate}>
                                {new Date(file.uploadedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* File actions */}
                        <div style={styles.fileCardActions}>
                          {file.downloadUrl && file.isValid !== false && (
                            <button 
                              onClick={() => window.open(file.downloadUrl, '_blank')}
                              style={styles.actionButton}
                              title="Download file"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                              </svg>
                            </button>
                          )}
                          <button 
                            onClick={() => removeFile(file.id)}
                            style={styles.actionButtonDanger}
                            title="Remove file"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links list */}
              {links.length > 0 && (
                <div style={styles.resourcesContainer}>
                  <h4 style={styles.resourcesHeading}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.resourcesHeadingIcon}>
                      <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z"/>
                    </svg>
                    Links
                  </h4>
                  <ul style={styles.resourcesList}>
                    {links.map(link => (
                      <li key={link.id} style={styles.resourceItem}>
                        <div style={styles.resourceItemContent}>
                          <span style={styles.resourceIcon}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z"/>
                            </svg>
                          </span>
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={styles.resourceLink}
                          >
                            {link.title}
                          </a>
                        </div>
                        <button 
                          onClick={() => removeLink(link.id)}
                          style={styles.removeButton}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                          </svg>
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
              <span style={styles.featureIconContainer}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={styles.featureIcon}>
                  <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"/>
                </svg>
              </span>
              AI Chat
            </h3>
            <p style={styles.featureDescription}>
              Get help from our AI to summarize your notes, generate questions, or explain concepts.
            </p>
            
            {/* Summarization type selector */}
            <div style={styles.summaryTypeContainer}>
              <label style={styles.summaryTypeLabel}>Summarization type:</label>
              <div style={styles.summaryTypeOptions}>
                {[
                  { value: 'normal', label: 'Normal' },
                  { value: 'concise', label: 'Concise' },
                  { value: 'explanatory', label: 'Explanatory' },
                  { value: 'formal', label: 'Formal' }
                ].map(option => (
                  <label key={option.value} style={styles.summaryTypeOption}>
                    <input
                      type="radio"
                      name="summaryType"
                      value={option.value}
                      checked={summaryType === option.value}
                      onChange={handleSummaryTypeChange}
                      style={styles.radioInput}
                    />
                    <span style={styles.radioCustom}></span>
                    <span style={styles.radioLabel}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <button 
              style={styles.featureButton}
              onClick={handleAskAI}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.buttonIcon}>
                <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
              </svg>
              Ask AI
            </button>
            
            <div style={styles.comingSoon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.comingSoonIcon}>
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11M11,9H13V7H11"/>
              </svg>
              AI Chat with AWS Bedrock coming soon!
            </div>
          </div>
          
          {/* Topic Connections card */}
          <div style={styles.featureCard}>
            <h3 style={styles.featureTitle}>
              <span style={styles.featureIconContainer}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={styles.featureIcon}>
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
                </svg>
              </span>
              Topic Connections
            </h3>
            <p style={styles.featureDescription}>
              See how this notebook connects to other topics in your knowledge map.
            </p>
            <button style={styles.featureButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.buttonIcon}>
                <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5A2,2 0 0,0 3,3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21V12H21V9M19,3.5L20.5,5H19V3.5Z"/>
              </svg>
              View Connections
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { 
    display: "flex", 
    height: "100vh",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  main: {
    flexGrow: 1,
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
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
    marginBottom: '1rem',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '1rem 1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },
  backButton: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    border: '1px solid #e2e8f0',
    color: '#475569',
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    fontWeight: '500',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
  },
  backIcon: {
    transition: 'transform 0.2s ease'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  lastUpdated: {
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  saveOptions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  autoSaveToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    position: 'relative'
  },
  autoSaveCheckbox: {
    display: 'none'
  },
  checkboxCustom: {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: '2px solid #cbd5e1',
    background: 'white',
    transition: 'all 0.2s ease',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  checkboxChecked: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    borderColor: '#3b82f6',
    color: 'white'
  },
  checkIcon: {
    color: 'white'
  },
  autoSaveLabel: {
    fontSize: '0.875rem',
    color: '#475569',
    fontWeight: '500',
    userSelect: 'none'
  },
  saveButton: {
    padding: '0.75rem 1.25rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  saveIcon: {
    transition: 'transform 0.2s ease'
  },
  saveSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTop: '2px solid white',
    animation: 'spin 1s linear infinite'
  },
  savingButton: {
    background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
    cursor: 'not-allowed',
    boxShadow: '0 2px 4px rgba(148, 163, 184, 0.3)'
  },
  editorContainer: {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    flexGrow: 1,
    height: 'calc(100vh - 330px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  titleInput: {
    border: 'none',
    borderBottom: '2px solid #f1f5f9',
    fontSize: '1.75rem',
    fontWeight: '700',
    padding: '0.75rem 0',
    outline: 'none',
    marginBottom: '1.5rem',
    color: '#1e293b',
    transition: 'border-color 0.2s ease',
    background: 'transparent'
  },
  contentArea: {
    display: 'flex',
    gap: '2rem',
    height: 'calc(100% - 80px)',
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
    borderLeft: '2px solid #f1f5f9',
    paddingLeft: '2rem',
    height: '100%',
    overflowY: 'auto'
  },
  sectionHeader: {
    marginBottom: '1.5rem'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    margin: 0,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  sectionIcon: {
    color: '#3b82f6'
  },
  editorWrapper: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 60px)',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0'
  },
  quillEditor: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px'
  },
  editorFooter: {
    background: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    padding: '0.75rem 1rem'
  },
  wordCount: {
    fontSize: '0.875rem',
    color: '#64748b',
    textAlign: 'right',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem'
  },
  wordCountIcon: {
    color: '#94a3b8'
  },
  dropZone: {
    border: '2px dashed #cbd5e1',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '1.5rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden'
  },
  dropZoneActive: {
    borderColor: '#3b82f6',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(29, 78, 216, 0.05) 100%)',
    transform: 'scale(1.02)'
  },
  dropZoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1
  },
  dropIcon: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.1)',
    padding: '1rem',
    borderRadius: '16px'
  },
  dropText: {
    margin: '0 0 0.5rem 0',
    fontSize: '1rem',
    color: '#374151',
    fontWeight: '600'
  },
  dropSubtext: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#64748b'
  },
  // New styles for file upload functionality
  uploadProgress: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem'
  },
  uploadProgressTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    margin: '0 0 1rem 0',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  uploadIcon: {
    color: '#3b82f6'
  },
  progressItem: {
    marginBottom: '1rem',
    padding: '0.75rem',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  progressFileName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#374151',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    marginRight: '1rem'
  },
  progressStatus: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#64748b'
  },
  progressBar: {
    width: '100%',
    height: '4px',
    background: '#e2e8f0',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
    borderRadius: '2px',
    transition: 'width 0.3s ease'
  },
  progressError: {
    fontSize: '0.875rem',
    color: '#dc2626',
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: '#fef2f2',
    borderRadius: '4px',
    border: '1px solid #fecaca'
  },
  errorContainer: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem'
  },
  errorTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    margin: '0 0 1rem 0',
    color: '#dc2626',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  errorIcon: {
    color: '#dc2626'
  },
  errorItem: {
    fontSize: '0.875rem',
    color: '#dc2626',
    marginBottom: '0.5rem',
    padding: '0.5rem',
    background: 'white',
    borderRadius: '6px',
    border: '1px solid #fecaca'
  },
  clearErrorsButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  linkForm: {
    display: 'flex',
    marginBottom: '2rem',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    background: 'white'
  },
  linkInputWrapper: {
    flexGrow: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  linkInputIcon: {
    position: 'absolute',
    left: '1rem',
    color: '#94a3b8',
    zIndex: 1
  },
  linkInput: {
    flexGrow: 1,
    padding: '0.875rem 1rem 0.875rem 2.75rem',
    border: 'none',
    fontSize: '0.95rem',
    outline: 'none',
    background: 'transparent',
    color: '#374151'
  },
  addLinkButton: {
    padding: '0.875rem 1.25rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease'
  },
  resourcesContainer: {
    marginBottom: '2rem'
  },
  filesHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #f1f5f9'
  },
  resourcesHeading: {
    fontSize: '1rem',
    fontWeight: '700',
    margin: 0,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  resourcesHeadingIcon: {
    color: '#3b82f6'
  },
  filesCount: {
    fontSize: '0.875rem',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontWeight: '500'
  },
  filesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem'
  },
  fileCard: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1rem',
    transition: 'all 0.2s ease',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: 'default'
  },
  fileCardCorrupted: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2'
  },
  fileStatusBadge: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  warningIcon: {
    color: 'white'
  },
  fileIconContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  fileIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0
  },
  fileExtension: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px'
  },
  fileCardContent: {
    flexGrow: 1,
    minWidth: 0
  },
  fileName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '0.5rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: '1.4'
  },
  fileMetadata: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.8rem',
    color: '#64748b'
  },
  fileSize: {
    fontWeight: '500'
  },
  fileDate: {
    fontWeight: '400'
  },
  fileCardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto'
  },
  actionButton: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    border: 'none',
    color: 'white',
    padding: '0.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  actionButtonDanger: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    border: 'none',
    color: 'white',
    padding: '0.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  resourcesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  resourceIcon: {
    marginRight: '0.75rem',
    color: '#64748b',
    flexShrink: 0
  },
  resourceName: {
    fontSize: '0.95rem',
    color: '#374151',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: '500'
  },
  resourceLink: {
    fontSize: '0.95rem',
    color: '#3b82f6',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: '500',
    transition: 'color 0.2s ease'
  },
  removeButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '2rem',
    marginTop: '1rem'
  },
  featureCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#1e293b'
  },
  featureIconContainer: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    padding: '0.75rem',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  featureIcon: {
    color: 'white'
  },
  featureDescription: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    fontWeight: '500'
  },
  summaryTypeContainer: {
    marginTop: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  summaryTypeLabel: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#374151'
  },
  summaryTypeOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem'
  },
  summaryTypeOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.95rem',
    color: '#475569',
    fontWeight: '500',
    position: 'relative'
  },
  radioInput: {
    display: 'none'
  },
  radioCustom: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid #cbd5e1',
    background: 'white',
    transition: 'all 0.2s ease',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioLabel: {
    userSelect: 'none'
  },
  featureButton: {
    marginTop: '1rem',
    padding: '0.875rem 1.25rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.95rem',
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  buttonIcon: {
    transition: 'transform 0.2s ease'
  },
  comingSoon: {
    marginTop: '1rem',
    fontSize: '0.875rem',
    fontStyle: 'italic',
    color: '#64748b',
    alignSelf: 'center',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '500'
  },
  comingSoonIcon: {
    color: '#94a3b8'
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#64748b",
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  loadingSpinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #f1f5f9",
    borderRadius: "50%",
    borderTop: "4px solid #3b82f6",
    animation: "spin 0.1s linear infinite",
    marginBottom: "1.5rem",
  },
  loadingText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#475569'
  }
};