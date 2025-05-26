import 'react-quill/dist/quill.snow.css';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import ReactQuill from 'react-quill';
import Sidebar from '../components/Sidebar';
import UploadConfirmationModal from '../components/UploadConfirmationModal';
import LinkConfirmationModal from '../components/LinkConfirmationModal';
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
  
  // Initialize with the notebookId
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
  const [chatMessage, setChatMessage] = useState('');
  
  // Updated state variables for the new upload confirmation flow
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [fileErrors, setFileErrors] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkToAdd,    setLinkToAdd]    = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [ytJobId, setYtJobId] = useState(null);
  
  // Quill editor modules configuration - simplified
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };
  
  const formats = [
    'header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'
  ];
  
  // Function to count words in HTML content
  const getWordCount = (htmlContent) => {
    if (!htmlContent) return 0;
    const text = htmlContent.replace(/<[^>]*>/g, ' ');
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // File validation function
  const validateFiles = (fileList) => {
    const validFiles = [];
    const errors = [];
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.csv', '.xlsx', '.xls'];
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB

    Array.from(fileList).forEach(file => {
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      
      // Check file type
      if (!allowedExtensions.includes(fileExt)) {
        errors.push(`${file.name}: Unsupported file type (${fileExt})`);
        return;
      }
      
      // Check file size
      if (file.size > MAX_SIZE) {
        errors.push(`${file.name}: File too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max 50MB)`);
        return;
      }
      
      // Check if file is not empty
      if (file.size === 0) {
        errors.push(`${file.name}: File is empty`);
        return;
      }
      
      validFiles.push(file);
    });

    return { validFiles, errors };
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
    }, 2000),
    [autoSave, content, isLoading]
  );
  
  // Trigger auto-save when content changes
  useEffect(() => {
    if (content && !isLoading) {
      debouncedSave();
    }
  }, [content, debouncedSave, isLoading]);
  
  // Load notebook data
  useEffect(() => {
    const loadNotebookData = async () => {
      if (!initialNotebookId || initialNotebookId === 'temp-loading') {
        setNotebook({
          notebookId: null,
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
        setIsLoading(true);
        
        try {
          const notebookData = await notebookService.getNotebook(initialNotebookId);
          
          if (notebookData) {
            const formattedNotebook = {
              notebookId: notebookData.notebookId || initialNotebookId,
              title: notebookData.title || 'Untitled Notebook',
              content: notebookData.content || '',
              createdAt: notebookData.createdAt || new Date().toISOString(),
              lastUpdated: notebookData.updatedAt || new Date().toISOString(),
              files: notebookData.files || [],
              links: notebookData.links || [],
              createdBy: notebookData.createdBy,
              wordCount: notebookData.wordCount || 0,
              tags: notebookData.tags || [],
              connections: notebookData.connections || [],
              filesCount: notebookData.filesCount || 0,
              filesSummary: notebookData.filesSummary
            };

            setNotebook(formattedNotebook);
            setContent(formattedNotebook.content);
            
            if (formattedNotebook.files && formattedNotebook.files.length > 0) {
              setFiles(formattedNotebook.files);
            }
            
            if (formattedNotebook.links) setLinks(formattedNotebook.links);
          }
        } catch (apiError) {
          console.error("Error loading notebook from API:", apiError);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading notebook data:", error);
        setIsLoading(false);
      }
    };
    
    loadNotebookData();
  }, [initialNotebookId]);
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const currentNotebookId = notebook.notebookId;
      
      if (!currentNotebookId || currentNotebookId === 'temp-loading') {
        setIsSaving(false);
        return;
      }
      
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
      
      const updateData = {
        title: updatedNotebook.title,
        chunkNumber: 0,
        chunkContent: content,
        files: files,
        links: links
      };
      
      try {
        await notebookService.updateNotebook(currentNotebookId, updateData);
      } catch (apiError) {
        console.error("Error saving to API:", apiError);
      }
      
      // localStorage backup logic
      const savedNotebooks = localStorage.getItem('notebooks');
      let notebooksArray = [];
      
      if (savedNotebooks) {
        notebooksArray = JSON.parse(savedNotebooks);
        const idToCheck = currentNotebookId;
        let notebookIndex = notebooksArray.findIndex(nb => nb.id === idToCheck);
        
        if (notebookIndex === -1) {
          notebookIndex = notebooksArray.findIndex(nb => nb.notebookId === idToCheck);
        }
        
        if (notebookIndex >= 0) {
          notebooksArray[notebookIndex] = {
            ...updatedNotebook,
            id: idToCheck,
            notebookId: idToCheck
          };
        } else {
          notebooksArray.push({
            ...updatedNotebook,
            id: idToCheck,
            notebookId: idToCheck
          });
        }
      } else {
        const idToStore = currentNotebookId;
        notebooksArray = [{
          ...updatedNotebook,
          id: idToStore,
          notebookId: idToStore
        }];
      }
      
      localStorage.setItem('notebooks', JSON.stringify(notebooksArray));
      setLastSaved(new Date());
      
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

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFileSelection(droppedFiles);
    } else {
      // Handle dropped URLs for links
      const droppedText = e.dataTransfer.getData('text');
      if (droppedText && isValidUrl(droppedText)) {
        addLink(droppedText);
      }
      if (droppedText && isValidUrl(droppedText)) {
        setLinkToAdd(droppedText.trim());
        setShowLinkModal(true);
      }
    }
  };

  // File input change handler
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      handleFileSelection(selectedFiles);
    }
    e.target.value = ''; // Reset input
  };

  // New function to handle file selection and show confirmation modal
  const handleFileSelection = (selectedFiles) => {
    // Clear previous errors
    setFileErrors([]);
    
    // Validate files
    const { validFiles, errors } = validateFiles(selectedFiles);
    
    if (errors.length > 0) {
      setFileErrors(errors);
    }
    
    if (validFiles.length > 0) {
      // Show confirmation modal with valid files
      setFilesToUpload(validFiles);
      setShowUploadModal(true);
    }
  };

  // Function to handle upload confirmation
  const handleUploadConfirm = async () => {
    if (!notebook.notebookId || notebook.notebookId === 'temp-loading') {
      setFileErrors(['Please save the notebook before uploading files']);
      setShowUploadModal(false);
      return;
    }

    setIsUploading(true);
    setUploadProgress({});
    
    try {
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
      
      // Auto-save the notebook to include file references
      if (autoSave && newFiles.length > 0 && notebook.notebookId && notebook.notebookId !== 'temp-loading') {
        setTimeout(() => {
          handleSave();
        }, 1000);
      }
      
      // Close modal after successful upload
      setTimeout(() => {
        setShowUploadModal(false);
        setFilesToUpload([]);
      }, 1500);
      
    } catch (error) {
      console.error('File upload error:', error);
      setFileErrors(prev => [...prev, `Upload failed: ${error.message}`]);
      
      // Update progress to show error state
      const errorProgress = {};
      filesToUpload.forEach(file => {
        errorProgress[file.name] = { status: 'error', progress: 0, error: error.message };
      });
      setUploadProgress(errorProgress);
      
      // Close modal on error
      setTimeout(() => {
        setShowUploadModal(false);
        setFilesToUpload([]);
      }, 2000);
    } finally {
      setIsUploading(false);
      
      // Clear progress after 5 seconds
      setTimeout(() => {
        setUploadProgress({});
      }, 5000);
    }
  };

  // Function to handle upload cancellation
  const handleUploadCancel = () => {
    setShowUploadModal(false);
    setFilesToUpload([]);
    setUploadProgress({});
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const buildLinkObject = (url) => ({
  id:   `link-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  url,
  title: url,                // will show full url; improve later with OG scrape
  addedAt: new Date().toISOString()
});


  const addLink = (url) => {
    if (isValidUrl(url)) {
      const newLink = {
        id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: url,
        title: url,
        addedAt: new Date().toISOString()
      };
      
      setLinks(prevLinks => [...prevLinks, newLink]);
      setNewLink('');
    }
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!newLink) return;
    if (!isValidUrl(newLink)) {
      setFileErrors(prev => [...prev, '❌ Invalid URL']);
      return;
    }
    setLinkToAdd(newLink.trim());
    setShowLinkModal(true);  // 🔔 open modal
  };

   const handleLinkConfirm = async () => {
   if (!linkToAdd) return;
   setIsAddingLink(true);
  const newObj = {
    ...buildLinkObject(linkToAdd),
    status: 'processing'          // 🟢 new field
  };

   setLinks(prev => [...prev, newObj]);
   setShowLinkModal(false);
   setNewLink('');
   setLinkToAdd('');

   try {
      const res = await notebookService.addYouTubeLink(
        notebook.notebookId,
        newObj.url,
        'mp3'
      );

      // If we reached here the request was queued/accepted.
      // Optionally save the Lambda job-id: res.data.job_name / task_id …
      // Later you can poll a /status endpoint and update the link object.

      // Persist the optimistic list to the notebook record
      await notebookService.updateNotebook(notebook.notebookId, {
        links : [...links, newObj],  // merge existing + new
        chunkNumber: 0
      });

    } catch (err) {
      console.error('addYouTubeLink failed:', err.message);

      // Only roll back on true client errors (4xx except 429)
      const status = err.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        setLinks(prev => prev.filter(l => l.id !== newObj.id));
        setFileErrors(p => [...p, `Link failed: ${err.message}`]);
      } else {
        // keep it in “processing” state; UI shows spinner
      }
    } finally {
      setIsAddingLink(false);
    }

 };


  const handleLinkCancel = () => {
    setShowLinkModal(false);
    setLinkToAdd('');
  };


  const removeFile = async (fileId) => {
    try {
      if (fileId && !fileId.startsWith('file-')) {
        await notebookService.deleteFile(notebook.notebookId, fileId);
      }
      
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      
      if (autoSave) {
        setTimeout(() => {
          handleSave();
        }, 500);
      }
    } catch (error) {
      console.error('Error removing file:', error);
      setFileErrors(prev => [...prev, `Failed to remove file: ${error.message}`]);
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    }
  };

  const removeLink = (linkId) => {
    setLinks(prevLinks => prevLinks.filter(link => link.id !== linkId));
  };
  
  const handleSummaryTypeChange = (e) => {
    setSummaryType(e.target.value);
  };
  
  const handleAskAI = () => {
    console.log(`Asking AI for a ${summaryType} summary of the content`);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      console.log('Chat message:', chatMessage);
      // Here you would integrate with your AI chat service
      setChatMessage('');
    }
  };

  // Helper functions for file display
  const getFileTypeColor = (extension) => {
    const colors = {
      'PDF': '#dc2626', 'DOC': '#2563eb', 'DOCX': '#2563eb', 
      'CSV': '#059669', 'XLSX': '#059669', 'XLS': '#059669',
      '.pdf': '#dc2626', '.doc': '#2563eb', '.docx': '#2563eb',
      '.csv': '#059669', '.xlsx': '#059669', '.xls': '#059669'
    };
    return colors[extension] || '#6b7280';
  };

  const getFileTypeIcon = (extension) => {
    const ext = extension?.toUpperCase();
    if (ext === 'PDF' || ext === '.PDF') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2Z"/>
        </svg>
      );
    } else if (ext === 'DOC' || ext === 'DOCX' || ext === '.DOC' || ext === '.DOCX') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6,2H14L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M18,20V9H13V4H6V20H18Z"/>
        </svg>
      );
    } else if (ext === 'CSV' || ext === 'XLSX' || ext === 'XLS' || ext === '.CSV' || ext === '.XLSX' || ext === '.XLS') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 13.06L8.18 15.28H9.97L8 12.06L9.93 8.89H8.22L7.13 10.9L7.09 10.96L7.06 11.03Q6.8 10.5 6.5 9.96 6.25 9.43 6.07 8.89H4.25L6.2 12.1L4.32 15.28H6.04"/>
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
          {/* Upload Confirmation Modal */}
          <UploadConfirmationModal
            isOpen={showUploadModal}
            onClose={handleUploadCancel}
            onConfirm={handleUploadConfirm}
            files={filesToUpload}
            isUploading={isUploading}
          />
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />

      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={handleBack} style={styles.backButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Back to Notebooks
            </button>
          </div>
          <div style={styles.headerCenter}>
            <input
              type="text"
              value={notebook.title}
              onChange={(e) => setNotebook({...notebook, title: e.target.value})}
              style={styles.titleInput}
              placeholder="Untitled notebook"
            />
          </div>
          <div style={styles.headerRight}>
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

        {/* Main Content Area */}
        <div style={styles.contentLayout}>
          {/* Central Sources/Upload Area - Similar to NotebookLM */}
          <div style={styles.centralArea}>
            
            {/* Sources Section */}
            <div style={styles.sourcesSection}>
              <h2 style={styles.sourcesTitle}>Sources</h2>
              <p style={styles.sourcesSubtitle}>
                Add files and links to build your knowledge base. Then start chatting to explore and analyze your content.
              </p>
              
              {/* Upload Area */}
              <div 
                style={{
                  ...styles.uploadArea,
                  ...(isDraggingOver ? styles.uploadAreaActive : {})
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.csv,.xlsx,.xls"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
                
                <div style={styles.uploadContent}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={styles.uploadIcon}>
                    <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"/>
                  </svg>
                  <h3 style={styles.uploadTitle}>
                    Ready to start? Add your sources
                  </h3>
                  <p style={styles.uploadDescription}>
                    Drag and drop files here, or click to browse
                  </p>
                  <button 
                    style={styles.uploadButton}
                    onClick={() => document.getElementById('fileInput')?.click()}
                  >
                    Select Files
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {fileErrors.length > 0 && (
                <div style={styles.errorContainer}>
                  <div style={styles.errorHeader}>
                    <span>Upload Errors</span>
                    <button onClick={() => setFileErrors([])} style={styles.clearButton}>Clear</button>
                  </div>
                  {fileErrors.map((error, index) => (
                    <div key={index} style={styles.errorItem}>{error}</div>
                  ))}
                </div>
              )}

              {/* Link Input */}
              <div style={styles.linkSection}>
                <input
                  type="text"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="Add a link (https://...)"
                  style={styles.linkInput}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLink(e)}
                />
                <button onClick={handleAddLink} style={styles.addLinkButton}>
                  Add Link
                </button>
              </div>

              {/* Files List */}
              {files.length > 0 && (
                <div style={styles.filesList}>
                  <h3 style={styles.filesTitle}>Uploaded Files ({files.length})</h3>
                  {files.map(file => (
                    <div key={file.id} style={styles.fileItem}>
                      <div style={styles.fileIcon}>
                        <div style={{
                          ...styles.fileIconBg,
                          backgroundColor: getFileTypeColor(file.extension || file.type)
                        }}>
                          {getFileTypeIcon(file.extension || file.type)}
                        </div>
                      </div>
                      <div style={styles.fileInfo}>
                        <div style={styles.fileName}>{file.name}</div>
                        <div style={styles.fileDetails}>
                          {file.sizeFormatted || `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                          {file.uploadedAt && ` • ${new Date(file.uploadedAt).toLocaleDateString()}`}
                        </div>
                      </div>
                      <div style={styles.fileActions}>
                        {file.downloadUrl && file.isValid !== false && (
                          <button 
                            onClick={() => window.open(file.downloadUrl, '_blank')}
                            style={styles.actionButton}
                            title="Download"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                            </svg>
                          </button>
                        )}
                        <button 
                          onClick={() => removeFile(file.id)}
                          style={styles.removeButton}
                          title="Remove"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Links List */}
              {links.length > 0 && (
                <div style={styles.linksList}>
                  <h3 style={styles.linksTitle}>Links ({links.length})</h3>

                  {links.map(link => (
                    <div key={link.id} style={styles.linkItem}>
                      {/* link icon */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        style={styles.linkIcon}
                      >
                        <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z" />
                      </svg>

                      {/* clickable URL */}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.linkText}
                        title={link.url}
                      >
                        {link.title}
                      </a>

                      {/* right-side control: spinner OR remove button */}
                      {link.status === 'processing' ? (
                        <div style={styles.linkSpinner} title="Processing…">
                          <div style={styles.spinner16}></div>
                        </div>
                      ) : (
                        <button
                          onClick={() => removeLink(link.id)}
                          style={styles.removeButton}
                          title="Remove"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Similar to NotebookLM */}
          <div style={styles.rightSidebar}>
            {/* Notes Section - Much Smaller */}
            <div style={styles.notesSection}>
              <h3 style={styles.notesSectionTitle}>Quick Notes</h3>
              <div style={styles.notesEditor}>
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  formats={formats}
                  placeholder="Jot down quick notes..."
                  style={styles.quillEditor}
                />
              </div>
              <div style={styles.notesFooter}>
                <span style={styles.wordCount}>
                  {getWordCount(content)} words
                </span>
              </div>
            </div>

            {/* Notebook Info */}
            <div style={styles.infoSection}>
              <h3 style={styles.infoTitle}>Notebook Info</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Sources:</span>
                  <span style={styles.infoValue}>{files.length + links.length}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Files:</span>
                  <span style={styles.infoValue}>{files.length}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Links:</span>
                  <span style={styles.infoValue}>{links.length}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Last updated:</span>
                  <span style={styles.infoValue}>
                    {lastSaved ? formatDate(lastSaved) : formatDate(notebook.lastUpdated)}
                  </span>
                </div>
              </div>
              
              <div style={styles.autoSaveToggle}>
                <label style={styles.autoSaveLabel}>
                  <input
                    type="checkbox"
                    checked={autoSave}
                    onChange={() => setAutoSave(!autoSave)}
                    style={styles.autoSaveCheckbox}
                  />
                  <span style={styles.checkboxCustom}>
                    {autoSave && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                      </svg>
                    )}
                  </span>
                  Auto-save
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Chat Area - Similar to NotebookLM */}
        <div style={styles.chatSection}>
          <div style={styles.chatContainer}>
            <div style={styles.chatHeader}>
              <h3 style={styles.chatTitle}>Ready to chat? Ask me anything about your sources</h3>
            </div>
            
            <form onSubmit={handleChatSubmit} style={styles.chatForm}>
              <div style={styles.chatInputContainer}>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask me anything about your sources..."
                  style={styles.chatInput}
                />
                <button 
                  type="submit" 
                  style={styles.chatSendButton}
                  disabled={!chatMessage.trim()}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
                  </svg>
                </button>
              </div>
            </form>
            
            <div style={styles.chatNote}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.chatNoteIcon}>
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11M11,9H13V7H11"/>
              </svg>
              AI Chat with AWS Bedrock coming soon!
            </div>
          </div>
        </div>
        {/* Upload Confirmation Modal */}
        <UploadConfirmationModal
          isOpen={showUploadModal}
          onClose={handleUploadCancel}
          onConfirm={handleUploadConfirm}
          files={filesToUpload}
          isUploading={isUploading}
        />
        <LinkConfirmationModal
          isOpen={showLinkModal}
          onClose={handleLinkCancel}
          onConfirm={handleLinkConfirm}
          link={linkToAdd}
          isAdding={isAddingLink}
        />
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
    background: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh'
  },

  // Header styles
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0
  },
  headerLeft: {
    flex: 1
  },
  headerCenter: {
    flex: 2,
    display: 'flex',
    justifyContent: 'center'
  },
  headerRight: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease'
  },
  titleInput: {
    border: 'none',
    fontSize: '1.25rem',
    fontWeight: '600',
    padding: '0.5rem 1rem',
    outline: 'none',
    color: '#111827',
    background: 'transparent',
    textAlign: 'center',
    minWidth: '200px'
  },
  saveButton: {
    padding: '0.5rem 1rem',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease'
  },
  savingButton: {
    background: '#9ca3af',
    cursor: 'not-allowed'
  },

  // Main content layout
  contentLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },

  // Central area (main content like NotebookLM)
  centralArea: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
    background: 'white',
    margin: '1rem',
    marginRight: '0.5rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },

  // Sources section
  sourcesSection: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  sourcesTitle: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 0.5rem 0',
    textAlign: 'center'
  },
  sourcesSubtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0 0 3rem 0',
    lineHeight: '1.5'
  },

  // Upload area
  uploadArea: {
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    padding: '3rem 2rem',
    textAlign: 'center',
    marginBottom: '2rem',
    transition: 'all 0.3s ease',
    background: '#fafafa',
    cursor: 'pointer'
  },
  uploadAreaActive: {
    borderColor: '#4f46e5',
    background: '#f8faff'
  },
  uploadContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
  },
  uploadIcon: {
    color: '#9ca3af',
    marginBottom: '1rem'
  },
  uploadTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  uploadDescription: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0
  },
  uploadButton: {
    padding: '0.75rem 1.5rem',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
  },

  // Error styles
  errorContainer: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  errorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: '0.5rem'
  },
  clearButton: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    fontSize: '0.75rem',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  errorItem: {
    fontSize: '0.875rem',
    color: '#dc2626',
    marginBottom: '0.25rem'
  },

  // Link section
  linkSection: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '2rem'
  },
  linkInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.875rem',
    outline: 'none'
  },
  addLinkButton: {
    padding: '0.75rem 1.5rem',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.875rem'
  },
  linkSpinner: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px'
  },
  spinner16: {
    width: '16px',
    height: '16px',
    border: '2px solid #e5e7eb',
    borderTop: '2px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  // Files list
  filesList: {
    marginBottom: '2rem'
  },
  filesTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 1rem 0'
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginBottom: '0.5rem'
  },
  fileIcon: {
    flexShrink: 0
  },
  fileIconBg: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  fileInfo: {
    flex: 1,
    minWidth: 0
  },
  fileName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  fileDetails: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.25rem'
  },
  fileActions: {
    display: 'flex',
    gap: '0.5rem',
    flexShrink: 0
  },
  actionButton: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.375rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.375rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Links list
  linksList: {
    marginBottom: '2rem'
  },
  linksTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 1rem 0'
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginBottom: '0.5rem'
  },
  linkIcon: {
    color: '#6b7280',
    flexShrink: 0
  },
  linkText: {
    fontSize: '0.875rem',
    color: '#4f46e5',
    textDecoration: 'none',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  // Right sidebar
  rightSidebar: {
    width: '320px',
    background: 'white',
    borderLeft: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },

  // Notes section (smaller)
  notesSection: {
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
    flex: '0 0 auto'
  },
  notesSectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 1rem 0'
  },
  notesEditor: {
    height: '200px',
    marginBottom: '0.5rem'
  },
  quillEditor: {
    height: '150px',
    fontSize: '0.875rem'
  },
  notesFooter: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  wordCount: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },

  // Info section
  infoSection: {
    padding: '1.5rem',
    flex: 1
  },
  infoTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 1rem 0'
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  infoValue: {
    fontSize: '0.875rem',
    color: '#111827',
    fontWeight: '500'
  },
  autoSaveToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  autoSaveLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#374151'
  },
  autoSaveCheckbox: {
    display: 'none'
  },
  checkboxCustom: {
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    border: '2px solid #d1d5db',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },

  // Chat section (bottom)
  chatSection: {
    flexShrink: 0,
    background: 'white',
    borderTop: '1px solid #e5e7eb',
    padding: '1.5rem 2rem'
  },
  chatContainer: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  chatHeader: {
    textAlign: 'center',
    marginBottom: '1rem'
  },
  chatTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  chatForm: {
    marginBottom: '1rem'
  },
  chatInputContainer: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center'
  },
  chatInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '24px',
    fontSize: '0.875rem',
    outline: 'none',
    background: '#f9fafb'
  },
  chatSendButton: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  chatNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    fontStyle: 'italic'
  },
  chatNoteIcon: {
    color: '#9ca3af'
  },

  // Loading styles
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#6b7280"
  },
  loadingSpinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #f3f4f6",
    borderRadius: "50%",
    borderTop: "4px solid #4f46e5",
    animation: "spin 1s linear infinite",
    marginBottom: "1.5rem",
  },
  loadingText: {
    fontSize: '1.1rem',
    fontWeight: '500'
  }
};