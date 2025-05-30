import React, { useState, useEffect, useRef } from "react";
import notebookService from "../services/NotebookService";

// Available tags for notebooks
const AVAILABLE_TAGS = [
  'Math', 'Science', 'Nature', 'Music', 'Literature', 
  'History', 'Programming', 'Art', 'Business', 'Languages',
  'Technology', 'Psychology', 'Philosophy', 'Economics',
  'Health', 'Sports', 'Travel', 'Photography', 'Design'
];

/**
 * Modal component for creating a new notebook
 */
const CreateNotebookModal = ({ onClose, onNotebookCreated }) => {
  // Form state
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [content, setContent] = useState("");
  const [connections, setConnections] = useState([]);
  const [availableNotebooks, setAvailableNotebooks] = useState([]);
  
  // Tags dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTags, setFilteredTags] = useState(AVAILABLE_TAGS);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showTagsError, setShowTagsError] = useState(false);
  
  // Refs
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Fetch existing notebooks for connections
  useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        const notebooks = await notebookService.getNotebooks();
        if (Array.isArray(notebooks)) {
          setAvailableNotebooks(notebooks);
        }
      } catch (error) {
        console.error("Error fetching notebooks:", error);
      }
    };
    
    fetchNotebooks();
  }, []);
  
  // Filter tags based on search query
  useEffect(() => {
    const filtered = AVAILABLE_TAGS.filter(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTags(filtered);
  }, [searchQuery]);
  
  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchQuery("");
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);
  
  // Handle tag selection/deselection
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
      setShowTagsError(false); // Clear error when user selects a tag
    }
    setSearchQuery("");
  };
  
  // Remove selected tag
  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle notebook connection toggle
  const handleConnectionToggle = (notebookId) => {
    if (!notebookId) {
      console.error("Attempted to toggle invalid notebookId:", notebookId);
      return;
    }
    if (connections.includes(notebookId)) {
      setConnections(connections.filter(id => id !== notebookId));
    } else {
      setConnections([...connections, notebookId]);
    }
  };
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (selectedTags.length === 0) {
      newErrors.tags = "At least one tag is required";
      setShowTagsError(true);
    } else {
      setShowTagsError(false);
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // If tags are missing, show a more prominent error
      if (selectedTags.length === 0) {
        setShowTagsError(true);
        // Scroll to tags section or focus it
        const tagsSection = document.getElementById('tags-section');
        if (tagsSection) {
          tagsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      const notebookData = {
        title: title.trim(),
        content: content.trim(),
        tags: selectedTags,
        connections: connections
      };
      console.log("About to create notebook with connections:", connections);
      
      const createdNotebook = await notebookService.createNotebook(notebookData);
      
      if (onNotebookCreated) {
        onNotebookCreated(createdNotebook);
      }
      
      onClose();
    } catch (error) {
      console.error("Error creating notebook:", error);
      setErrors({ submit: "Failed to create notebook. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>Create New Notebook</h2>
        
        {errors.submit && (
          <div style={styles.errorMessage}>{errors.submit}</div>
        )}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Title Field */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="notebook-title">
              Title <span style={styles.required}>*</span>
            </label>
            <input
              id="notebook-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notebook title"
              style={{
                ...styles.input,
                ...(errors.title ? styles.inputError : {})
              }}
              disabled={isLoading}
              autoFocus
            />
            {errors.title && (
              <div style={styles.fieldError}>{errors.title}</div>
            )}
          </div>
          
          {/* Tags Field */}
          <div style={styles.formGroup} id="tags-section">
            <label style={styles.label}>
              Tags <span style={styles.required}>*</span>
            </label>
            
            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div style={styles.selectedTagsContainer}>
                {selectedTags.map(tag => (
                  <div key={tag} style={styles.selectedTagChip}>
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={styles.removeTagButton}
                      disabled={isLoading}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Tags Dropdown */}
            <div style={styles.dropdownContainer} ref={dropdownRef}>
              <div 
                style={{
                  ...styles.dropdownTrigger,
                  ...(showTagsError ? styles.dropdownError : {}),
                  ...(isDropdownOpen ? styles.dropdownTriggerOpen : {})
                }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span style={styles.dropdownPlaceholder}>
                  {selectedTags.length === 0 ? "Search and select tags..." : "Add more tags..."}
                </span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  style={{
                    ...styles.dropdownIcon,
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                >
                  <path d="M7,10L12,15L17,10H7Z"/>
                </svg>
              </div>
              
              {isDropdownOpen && (
                <div style={styles.dropdownMenu}>
                  <div style={styles.searchContainer}>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tags..."
                      style={styles.searchInput}
                    />
                  </div>
                  
                  <div style={styles.tagsScrollContainer}>
                    {filteredTags.length > 0 ? (
                      filteredTags.map(tag => (
                        <div
                          key={tag}
                          style={{
                            ...styles.dropdownTagItem,
                            ...(selectedTags.includes(tag) ? styles.dropdownTagSelected : {})
                          }}
                          onClick={() => handleTagToggle(tag)}
                        >
                          <span>{tag}</span>
                          {selectedTags.includes(tag) && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.checkIcon}>
                              <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                            </svg>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={styles.noResults}>No tags found matching "{searchQuery}"</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Tags Error with Enhanced Styling */}
            {showTagsError && (
              <div style={styles.tagsErrorContainer}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.errorIcon}>
                  <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
                </svg>
                <span>Please select at least one tag to categorize your notebook</span>
              </div>
            )}
          </div>
          
          {/* Preview Field */}
          <div style={styles.formGroup}>
            <div style={styles.labelContainer}>
              <label style={styles.label} htmlFor="notebook-content">
                Preview
              </label>
              <span style={styles.infoText}>Start writing your first note</span>
            </div>
            <textarea
              id="notebook-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter initial content for your notebook..."
              style={styles.textarea}
              rows={5}
              disabled={isLoading}
            />
          </div>
          
          {/* Connections Field */}
          <div style={styles.formGroup}>
            <div style={styles.labelContainer}>
              <label style={styles.label}>Connections</label>
              <span style={styles.infoText}>Link to relevant notebooks</span>
            </div>
            <div style={styles.connectionsContainer}>
              {availableNotebooks.length > 0 ? (
                availableNotebooks.map(notebook => (
                  <div 
                    key={notebook.notebookId}
                    style={{
                      ...styles.connectionItem,
                      ...(connections.includes(notebook.notebookId) ? styles.selectedConnection : {})
                    }}
                    onClick={() => !isLoading && handleConnectionToggle(notebook.notebookId)}
                  >
                    {notebook.title}
                  </div>
                ))
              ) : (
                <div style={styles.noConnections}>No other notebooks available to connect with.</div>
              )}
            </div>
          </div>
          
          {/* Form Actions */}
          <div style={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.createButton,
                ...(isLoading || !title.trim() || selectedTags.length === 0 ? styles.createButtonDisabled : {})
              }}
              disabled={isLoading || !title.trim() || selectedTags.length === 0}
            >
              {isLoading ? "Creating..." : "Create Notebook"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Component styles
const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    padding: "24px",
    width: "550px",
    maxWidth: "90%",
    maxHeight: "90vh",
    overflow: "auto"
  },
  modalTitle: {
    margin: "0 0 24px 0",
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#111827"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  labelContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#374151"
  },
  infoText: {
    color: "#6b7280",
    fontSize: "0.75rem",
    fontWeight: "normal",
    fontStyle: "italic"
  },
  required: {
    color: "#ef4444"
  },
  input: {
    padding: "10px 12px",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    transition: "border-color 0.2s ease"
  },
  inputError: {
    borderColor: "#ef4444"
  },
  textarea: {
    padding: "10px 12px",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    transition: "border-color 0.2s ease",
    resize: "vertical",
    fontFamily: "inherit",
    minHeight: "100px"
  },
  fieldError: {
    color: "#ef4444",
    fontSize: "0.75rem",
    marginTop: "4px"
  },
  errorMessage: {
    backgroundColor: "#fee2e2",
    color: "#ef4444",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "16px",
    fontSize: "0.875rem"
  },
  
  // Selected tags display
  selectedTagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "8px"
  },
  selectedTagChip: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    borderRadius: "16px",
    fontSize: "0.875rem",
    border: "1px solid #0ea5e9"
  },
  removeTagButton: {
    background: "none",
    border: "none",
    color: "#0369a1",
    cursor: "pointer",
    padding: "2px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s ease"
  },
  
  // Dropdown styles
  dropdownContainer: {
    position: "relative"
  },
  dropdownTrigger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  dropdownTriggerOpen: {
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
  },
  dropdownError: {
    borderColor: "#ef4444",
    boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.1)"
  },
  dropdownPlaceholder: {
    color: "#6b7280"
  },
  dropdownIcon: {
    color: "#6b7280",
    transition: "transform 0.2s ease"
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    zIndex: 10,
    marginTop: "4px"
  },
  searchContainer: {
    padding: "8px"
  },
  searchInput: {
    width: "100%",
    padding: "8px 12px",
    fontSize: "0.875rem",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    outline: "none"
  },
  tagsScrollContainer: {
    maxHeight: "200px",
    overflowY: "auto"
  },
  dropdownTagItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    borderBottom: "1px solid #f3f4f6"
  },
  dropdownTagSelected: {
    backgroundColor: "#f0f9ff",
    color: "#0369a1"
  },
  checkIcon: {
    color: "#0369a1"
  },
  noResults: {
    padding: "12px",
    color: "#6b7280",
    fontSize: "0.875rem",
    textAlign: "center",
    fontStyle: "italic"
  },
  
  // Enhanced error styling for tags
  tagsErrorContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    color: "#dc2626",
    fontSize: "0.875rem"
  },
  errorIcon: {
    color: "#dc2626",
    flexShrink: 0
  },
  
  // Existing styles...
  connectionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "150px",
    overflowY: "auto",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #d1d5db"
  },
  connectionItem: {
    padding: "8px 12px",
    borderRadius: "4px",
    backgroundColor: "#f9fafb",
    color: "#4b5563",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  selectedConnection: {
    backgroundColor: "#f0f9ff",
    color: "#0369a1",
    fontWeight: "500"
  },
  noConnections: {
    padding: "10px",
    color: "#6b7280",
    fontSize: "0.875rem",
    fontStyle: "italic",
    textAlign: "center"
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "16px"
  },
  cancelButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "none",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease"
  },
  createButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    backgroundColor: "#1f78ff",
    color: "#fff",
    border: "none",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  createButtonDisabled: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed"
  }
};

export default CreateNotebookModal;