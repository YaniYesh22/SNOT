import React, { useState, useEffect } from "react";
import notebookService from "../services/NotebookService";

// Available tags for notebooks
const AVAILABLE_TAGS = [
  'Math', 'Science', 'Nature', 'Music', 'Literature', 
  'History', 'Programming', 'Art', 'Business', 'Languages'
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
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  
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
  
  // Handle tag selection/deselection
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Handle notebook connection toggle
  const handleConnectionToggle = (notebookId) => {
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
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
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
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Tags <span style={styles.required}>*</span>
            </label>
            <div style={styles.tagsContainer}>
              {AVAILABLE_TAGS.map(tag => (
                <div 
                  key={tag}
                  style={{
                    ...styles.tagItem,
                    ...(selectedTags.includes(tag) ? styles.selectedTag : {})
                  }}
                  onClick={() => !isLoading && handleTagToggle(tag)}
                >
                  {tag}
                </div>
              ))}
            </div>
            {errors.tags && (
              <div style={styles.fieldError}>{errors.tags}</div>
            )}
          </div>
          
          {/* Advanced Options Toggle */}
          <div style={styles.advancedToggle}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={styles.advancedButton}
              disabled={isLoading}
            >
              {showAdvanced ? "Hide Advanced Options ▲" : "Show Advanced Options ▼"}
            </button>
          </div>
          
          {/* Advanced Section */}
          {showAdvanced && (
            <>
              {/* Initial Content Field */}
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="notebook-content">
                  Initial Content
                </label>
                <textarea
                  id="notebook-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter initial content (optional)"
                  style={styles.textarea}
                  rows={5}
                  disabled={isLoading}
                />
              </div>
              
              {/* Connections Field */}
              {availableNotebooks.length > 0 && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Connect to Other Notebooks
                  </label>
                  <div style={styles.connectionsContainer}>
                    {availableNotebooks.map(notebook => (
                      <div 
                        key={notebook.id}
                        style={{
                          ...styles.connectionItem,
                          ...(connections.includes(notebook.id) ? styles.selectedConnection : {})
                        }}
                        onClick={() => !isLoading && handleConnectionToggle(notebook.id)}
                      >
                        {notebook.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
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
              style={styles.createButton}
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
    width: "500px",
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
  label: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#374151"
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
    fontFamily: "inherit"
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
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  tagItem: {
    padding: "6px 12px",
    borderRadius: "4px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid transparent"
  },
  selectedTag: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    borderColor: "#0ea5e9"
  },
  connectionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "150px",
    overflowY: "auto",
    padding: "4px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb"
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
  advancedToggle: {
    display: "flex",
    justifyContent: "center"
  },
  advancedButton: {
    background: "none",
    border: "none",
    color: "#4b5563",
    fontSize: "0.875rem",
    cursor: "pointer",
    padding: "4px 8px"
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "8px"
  },
  cancelButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "none",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer"
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
    transition: "background-color 0.2s ease",
    opacity: (props) => (props.disabled ? 0.5 : 1)
  }
};

export default CreateNotebookModal;