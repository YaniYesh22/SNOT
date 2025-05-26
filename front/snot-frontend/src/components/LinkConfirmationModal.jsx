import React from 'react';

/**
 * Link Confirmation Modal Component
 * Shows a preview of the YouTube link to be added and asks for user confirmation
 */
const LinkConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  link, 
  isAdding = false 
}) => {
  if (!isOpen || !link) return null;

  // Extract video ID from YouTube URL for thumbnail
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // Get video title from URL (basic extraction, you might want to enhance this)
  const getVideoTitle = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        return 'YouTube Video';
      }
      return urlObj.hostname;
    } catch {
      return 'Web Link';
    }
  };

  const videoId = getYouTubeVideoId(link);
  const videoTitle = getVideoTitle(link);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={styles.titleIcon}>
              <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z"/>
            </svg>
            Confirm Link Addition
          </h2>
          {!isAdding && (
            <button onClick={onClose} style={styles.closeButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
            </button>
          )}
        </div>

        <div style={styles.modalContent}>
          <p style={styles.confirmMessage}>
            You're about to add this link to your notebook sources. Do you want to continue?
          </p>

          <div style={styles.linkPreview}>
            <div style={styles.linkHeader}>
              <span style={styles.linkHeaderText}>Link Preview:</span>
              <span style={styles.linkType}>
                {videoId ? 'YouTube Video' : 'Web Link'}
              </span>
            </div>
            
            <div style={styles.linkContainer}>
              <div style={styles.linkItem}>
                <div style={styles.linkIconContainer}>
                  {thumbnailUrl ? (
                    <div style={styles.videoThumbnail}>
                      <img 
                        src={thumbnailUrl} 
                        alt="Video thumbnail" 
                        style={styles.thumbnailImage}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div style={{...styles.fallbackIcon, display: 'none'}}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={styles.youtubeIcon}>
                          <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/>
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.linkIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={styles.genericLinkIcon}>
                        <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div style={styles.linkInfo}>
                  <div style={styles.linkTitle}>{videoTitle}</div>
                  <div style={styles.linkUrl}>{link}</div>
                  {videoId && (
                    <div style={styles.linkMeta}>
                      Video ID: {videoId}
                    </div>
                  )}
                </div>
                <div style={styles.linkStatus}>
                  {isAdding ? (
                    <div style={styles.addingIndicator}>
                      <div style={styles.spinner}></div>
                    </div>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.pendingIcon}>
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!isAdding && (
            <div style={styles.warningNote}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.warningIcon}>
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11M11,9H13V7H11"/>
              </svg>
              Make sure the link is correct and accessible. YouTube videos will be processed for content analysis.
            </div>
          )}
        </div>

        <div style={styles.modalFooter}>
          {isAdding ? (
            <div style={styles.addingStatus}>
              <div style={styles.spinner}></div>
              <span>Adding link...</span>
            </div>
          ) : (
            <>
              <button 
                onClick={onClose} 
                style={styles.cancelButton}
                disabled={isAdding}
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm} 
                style={styles.confirmButton}
                disabled={isAdding}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.buttonIcon}>
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                </svg>
                Add Link
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
  linkPreview: {
    marginBottom: '1.5rem'
  },
  linkHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #f3f4f6'
  },
  linkHeaderText: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151'
  },
  linkType: {
    fontSize: '0.75rem',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px'
  },
  linkContainer: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  linkItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1rem',
    transition: 'background-color 0.2s ease'
  },
  linkIconContainer: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  videoThumbnail: {
    position: 'relative',
    width: '80px',
    height: '60px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6'
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  fallbackIcon: {
    width: '80px',
    height: '60px',
    backgroundColor: '#dc2626',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  youtubeIcon: {
    color: 'white'
  },
  linkIcon: {
    width: '48px',
    height: '48px',
    backgroundColor: '#3b82f6',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  genericLinkIcon: {
    color: 'white'
  },
  linkInfo: {
    flex: 1,
    minWidth: 0
  },
  linkTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.25rem'
  },
  linkUrl: {
    fontSize: '0.75rem',
    color: '#3b82f6',
    wordBreak: 'break-all',
    marginBottom: '0.25rem'
  },
  linkMeta: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  linkStatus: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pendingIcon: {
    color: '#f59e0b'
  },
  addingIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
    backgroundColor: '#eff6ff',
    border: '1px solid #3b82f6',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: '#1e40af',
    lineHeight: '1.4'
  },
  warningIcon: {
    color: '#3b82f6',
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
  addingStatus: {
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

// Add CSS animation for spinner
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject CSS if not already present
if (!document.querySelector('#link-modal-styles')) {
  const style = document.createElement('style');
  style.id = 'link-modal-styles';
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

export default LinkConfirmationModal;