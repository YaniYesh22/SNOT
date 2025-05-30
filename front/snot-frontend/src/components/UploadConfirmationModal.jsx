import React from 'react';

/**
 * Upload Confirmation Modal Component
 * Shows a list of files to be uploaded and asks for user confirmation
 */
const UploadConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  files, 
  isUploading = false,
  uploadProgress = {}, // Add uploadProgress prop to track individual file states
}) => {
  if (!isOpen) return null;

  const getTotalSize = () => {
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    return (totalBytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const getFileTypeIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{color: '#dc2626'}}>
          <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2Z"/>
        </svg>
      );
    } else if (['doc', 'docx'].includes(ext)) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{color: '#2563eb'}}>
          <path d="M6,2H14L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M18,20V9H13V4H6V20H18Z"/>
        </svg>
      );
    } else if (['csv', 'xlsx', 'xls'].includes(ext)) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{color: '#059669'}}>
          <path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 13.06L8.18 15.28H9.97L8 12.06L9.93 8.89H8.22L7.13 10.9L7.09 10.96L7.06 11.03Q6.8 10.5 6.5 9.96 6.25 9.43 6.07 8.89H4.25L6.2 12.1L4.32 15.28H6.04"/>
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{color: '#6b7280'}}>
        <path d="M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z"/>
      </svg>
    );
  };

  // Function to get the status icon for each file
  const getFileStatusIcon = (file) => {
    const fileProgress = uploadProgress[file.name];
    
    // Debug logging to help troubleshoot
    console.log(`File: ${file.name}, Progress:`, fileProgress);
    
    if (!fileProgress || (!isUploading && !fileProgress?.status)) {
      // Default pending state (orange clock)
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.pendingIcon}>
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
        </svg>
      );
    }

    switch (fileProgress.status) {
      case 'uploading':
        return (
          <div style={styles.uploadingIndicator}>
            <div style={styles.spinner}></div>
          </div>
        );
      
      case 'completed':
        return (
          <div style={styles.successIndicator}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.successIcon}>
              <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
            </svg>
          </div>
        );
      
      case 'error':
        return (
          <div style={styles.errorIndicator}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.errorIcon}>
              <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
            </svg>
          </div>
        );
      
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.pendingIcon}>
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
          </svg>
        );
    }
  };

  // Function to get file item styling based on status
  const getFileItemStyle = (file) => {
    const fileProgress = uploadProgress[file.name];
    const baseStyle = { ...styles.fileItem };
    
    if (fileProgress?.status === 'completed') {
      return {
        ...baseStyle,
        backgroundColor: '#f0fdf4',
        borderLeft: '3px solid #10b981'
      };
    } else if (fileProgress?.status === 'error') {
      return {
        ...baseStyle,
        backgroundColor: '#fef2f2',
        borderLeft: '3px solid #ef4444'
      };
    }
    
    return baseStyle;
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={styles.titleIcon}>
              <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"/>
            </svg>
            Confirm File Upload
          </h2>
          {!isUploading && (
            <button onClick={onClose} style={styles.closeButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            </button>
          )}
        </div>

        <div style={styles.modalContent}>
          <p style={styles.confirmMessage}>
            You're about to upload <strong>{files.length}</strong> file{files.length > 1 ? 's' : ''} 
            with a total size of <strong>{getTotalSize()}</strong>. Do you want to continue?
          </p>

          <div style={styles.filesList}>
            <div style={styles.filesHeader}>
              <span style={styles.filesHeaderText}>Files to upload:</span>
              <span style={styles.filesCount}>{files.length} files</span>
            </div>
            
            <div style={styles.filesContainer}>
              {files.map((file, index) => {
                const fileProgress = uploadProgress[file.name];
                return (
                  <div key={index} style={getFileItemStyle(file)}>
                    <div style={styles.fileIcon}>
                      {getFileTypeIcon(file.name)}
                    </div>
                    <div style={styles.fileInfo}>
                      <div style={styles.fileName}>{file.name}</div>
                      <div style={styles.fileSize}>
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                        {fileProgress?.status === 'error' && fileProgress?.error && (
                          <div style={styles.errorMessage}>
                            Error: {fileProgress.error}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={styles.fileStatus}>
                      {getFileStatusIcon(file)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isUploading && (
            <div style={styles.warningNote}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.warningIcon}>
                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              Make sure all files are correct before proceeding. Maximum file size is 50MB per file.
            </div>
          )}
        </div>

        <div style={styles.modalFooter}>
          {isUploading ? (
            <div style={styles.uploadingStatus}>
              <div style={styles.spinner}></div>
              <span>Uploading files...</span>
            </div>
          ) : (
            <>
              <button 
                onClick={onClose} 
                style={styles.cancelButton}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm} 
                style={styles.confirmButton}
                disabled={isUploading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.buttonIcon}>
                  <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"/>
                </svg>
                Upload {files.length} File{files.length > 1 ? 's' : ''}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem'
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  titleIcon: {
    color: '#3b82f6'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalContent: {
    padding: '1.5rem 2rem',
    flex: 1,
    overflow: 'auto'
  },
  confirmMessage: {
    fontSize: '1rem',
    color: '#374151',
    lineHeight: '1.6',
    marginBottom: '1.5rem',
    margin: '0 0 1.5rem 0'
  },
  filesList: {
    marginBottom: '1.5rem'
  },
  filesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #f3f4f6'
  },
  filesHeaderText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151'
  },
  filesCount: {
    fontSize: '0.75rem',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px'
  },
  filesContainer: {
    maxHeight: '300px',
    overflow: 'auto',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s ease'
  },
  fileIcon: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
  fileSize: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.25rem'
  },
  fileStatus: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pendingIcon: {
    color: '#f59e0b'
  },
  uploadingIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  successIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    animation: 'successPulse 0.6s ease-out'
  },
  successIcon: {
    color: '#ffffff'
  },
  errorIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    backgroundColor: '#ef4444',
    borderRadius: '50%'
  },
  errorIcon: {
    color: '#ffffff'
  },
  errorMessage: {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '0.25rem',
    fontWeight: '500'
  },
  testSection: {
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f0f9ff',
    border: '1px solid #0ea5e9',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  testButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontWeight: '500'
  },
  testNote: {
    fontSize: '0.75rem',
    color: '#0369a1',
    fontStyle: 'italic'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #f3f4f6',
    borderRadius: '50%',
    borderTop: '2px solid #3b82f6',
    animation: 'spin 1s linear infinite'
  },
  warningNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    backgroundColor: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: '#92400e',
    lineHeight: '1.4'
  },
  warningIcon: {
    color: '#f59e0b',
    flexShrink: 0,
    marginTop: '0.125rem'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderTop: '1px solid #e5e7eb',
    flexShrink: 0
  },
  uploadingStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#6b7280',
    fontSize: '0.875rem',
    width: '100%',
    justifyContent: 'center'
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f9fafb',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease'
  },
  confirmButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  buttonIcon: {
    flexShrink: 0
  }
};

// Add CSS animations
const animations = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes successPulse {
    0% { 
      transform: scale(0.8);
      opacity: 0.8;
    }
    50% { 
      transform: scale(1.1);
      opacity: 1;
    }
    100% { 
      transform: scale(1);
      opacity: 1;
    }
  }
`;

// Inject CSS if not already present
if (!document.querySelector('#upload-modal-styles')) {
  const style = document.createElement('style');
  style.id = 'upload-modal-styles';
  style.textContent = animations;
  document.head.appendChild(style);
}

export default UploadConfirmationModal;