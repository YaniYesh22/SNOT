import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

// Color mapping for different tag categories
const TAG_COLORS = {
  // STEM subjects
  'Math': { bg: '#fef3c7', color: '#92400e', border: '#fbbf24' },
  'Science': { bg: '#dbeafe', color: '#1e40af', border: '#60a5fa' },
  'Technology': { bg: '#e0e7ff', color: '#3730a3', border: '#818cf8' },
  'Programming': { bg: '#ecfdf5', color: '#065f46', border: '#34d399' },
  
  // Arts & Humanities
  'Art': { bg: '#fce7f3', color: '#be185d', border: '#f472b6' },
  'Music': { bg: '#f3e8ff', color: '#7c2d12', border: '#c084fc' },
  'Literature': { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
  'History': { bg: '#f0f9ff', color: '#0c4a6e', border: '#7dd3fc' },
  'Philosophy': { bg: '#f7fee7', color: '#365314', border: '#a3e635' },
  
  // Nature & Life
  'Nature': { bg: '#ecfdf5', color: '#14532d', border: '#4ade80' },
  'Health': { bg: '#fef7ed', color: '#9a3412', border: '#fb923c' },
  'Sports': { bg: '#eff6ff', color: '#1e3a8a', border: '#3b82f6' },
  'Travel': { bg: '#f0fdfa', color: '#134e4a', border: '#5eead4' },
  
  // Social & Business
  'Business': { bg: '#f8fafc', color: '#0f172a', border: '#94a3b8' },
  'Economics': { bg: '#fefce8', color: '#713f12', border: '#eab308' },
  'Psychology': { bg: '#fdf4ff', color: '#86198f', border: '#d946ef' },
  'Languages': { bg: '#fff7ed', color: '#9a3412', border: '#fb923c' },
  
  // Creative & Design
  'Design': { bg: '#f1f5f9', color: '#0f172a', border: '#64748b' },
  'Photography': { bg: '#fafaf9', color: '#292524', border: '#a8a29e' },
  
  // Default for unknown tags
  'default': { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db' }
};

// Function to get tag color
const getTagColor = (tag) => {
  return TAG_COLORS[tag] || TAG_COLORS.default;
};

const NotebookCard = ({ 
  id, 
  title, 
  tags = [], 
  onEdit, 
  onDelete, 
  onOpen,
  createdAt,
  preview 
}) => {
  const [showAllTags, setShowAllTags] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  const cardRef = useRef(null);

  // Ensure tags is an array and has elements
  const tagArray = Array.isArray(tags) ? tags : ['Uncategorized'];
  
  // Limit displayed tags to 3
  const displayTags = tagArray.slice(0, 3);
  const hiddenTags = tagArray.slice(3);
  const hasMoreTags = tagArray.length > 3;

  // Calculate optimal popover position using fixed positioning
  const calculatePopoverPosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Popover dimensions
    const popoverWidth = 280;
    const popoverHeight = 150;
    
    // Center the popover horizontally on the trigger button
    let left = triggerRect.left + (triggerRect.width / 2) - (popoverWidth / 2);
    
    // Position it just below the trigger
    let top = triggerRect.bottom + 8;
    
    // Adjust if it goes off the right edge
    if (left + popoverWidth > viewportWidth - 20) {
      left = viewportWidth - popoverWidth - 20;
    }
    
    // Adjust if it goes off the left edge
    if (left < 20) {
      left = 20;
    }
    
    // If there's not enough space below, position above
    if (top + popoverHeight > viewportHeight - 20) {
      top = triggerRect.top - popoverHeight - 8;
    }
    
    // Final check - make sure it doesn't go off the top
    if (top < 20) {
      top = triggerRect.bottom + 8;
    }
    
    setPopoverStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 1001,
    });
  };

  // Handle clicks outside the popover to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target) && 
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setShowAllTags(false);
      }
    };

    if (showAllTags) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAllTags]);

  const handleMoreTagsClick = (e) => {
    e.stopPropagation(); // Prevent card click events
    calculatePopoverPosition();
    setShowAllTags(!showAllTags);
  };

  const handleCardClick = () => {
    if (onOpen) {
      onOpen(id);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(id);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };
  
  return (
    <>
      <div 
        ref={cardRef}
        style={{
          ...styles.card,
          ...(isHovered ? styles.cardHovered : {})
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Compact hover actions */}
        {isHovered && (
          <div style={styles.hoverActions}>
            <button
              style={styles.actionButton}
              onClick={handleEditClick}
              title="Edit notebook"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button
              style={{...styles.actionButton, ...styles.deleteButton}}
              onClick={handleDeleteClick}
              title="Delete notebook"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        )}

        <div style={styles.cardContent}>
          <h3 style={styles.title}>{title}</h3>
          
          {/* Preview text if available */}
          {preview && (
            <p style={styles.preview}>{preview}</p>
          )}
          
          {/* Date */}
          {createdAt && (
            <p style={styles.date}>
              {new Date(createdAt).toLocaleDateString()}
            </p>
          )}
          
          {/* Tags section */}
          <div style={styles.tagContainer}>
            {displayTags.map((tag, index) => {
              const tagColors = getTagColor(tag);
              return (
                <span 
                  key={`${id}-tag-${index}`} 
                  style={{
                    ...styles.tag,
                    backgroundColor: tagColors.bg,
                    color: tagColors.color,
                    border: `1px solid ${tagColors.border}20` // 20 for slight transparency
                  }}
                >
                  {tag}
                </span>
              );
            })}
            {hasMoreTags && (
              <span 
                ref={triggerRef}
                style={{
                  ...styles.tagMore,
                  ...(showAllTags ? styles.tagMoreActive : {})
                }}
                onClick={handleMoreTagsClick}
                title="Click to see all tags"
              >
                +{hiddenTags.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Popover rendered as a portal directly in document.body */}
      {showAllTags && ReactDOM.createPortal(
        <div 
          ref={popoverRef} 
          style={{
            ...styles.tagsPopover,
            ...popoverStyle
          }}
        >
          <div style={styles.popoverContent}>
            <div style={styles.popoverTitle}>All Tags ({tagArray.length})</div>
            <div style={styles.popoverTagsContainer}>
              {tagArray.map((tag, index) => {
                const tagColors = getTagColor(tag);
                return (
                  <span 
                    key={`${id}-popover-tag-${index}`} 
                    style={{
                      ...styles.popoverTag,
                      backgroundColor: tagColors.bg,
                      color: tagColors.color,
                      border: `1px solid ${tagColors.border}20`
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const styles = {
  card: {
    background: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    cursor: 'pointer',
  },
  cardHovered: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
    borderColor: '#d1d5db',
  },
  hoverActions: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    display: 'flex',
    gap: '4px',
    zIndex: 5,
    opacity: 1,
    animation: 'fadeIn 0.2s ease',
  },
  actionButton: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.2s ease',
    fontSize: '12px',
  },
  deleteButton: {
    color: '#dc2626',
  },
  cardContent: {
    padding: '1rem',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '2.5rem', // Add space for hover actions
  },
  title: {
    fontSize: '1rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    lineHeight: '1.4',
  },
  preview: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: '0 0 0.5rem 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    lineHeight: '1.4',
  },
  date: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    margin: '0 0 0.75rem 0',
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.25rem',
    marginTop: 'auto',
  },
  tag: {
    fontSize: '0.7rem',
    padding: '0.2rem 0.4rem',
    borderRadius: '0.25rem',
    whiteSpace: 'nowrap',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  tagMore: {
    fontSize: '0.7rem',
    padding: '0.2rem 0.4rem',
    borderRadius: '0.25rem',
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    fontWeight: '500',
    border: '1px solid #d1d5db20',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
  },
  tagMoreActive: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    border: '1px solid #60a5fa40',
  },
  tagsPopover: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    minWidth: '200px',
    maxWidth: '280px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  popoverContent: {
    padding: '12px',
  },
  popoverTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
    paddingBottom: '6px',
    borderBottom: '1px solid #f3f4f6',
  },
  popoverTagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
  },
  popoverTag: {
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    whiteSpace: 'nowrap',
    fontWeight: '500',
  },
};

// Add CSS animation
const fadeInCSS = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
`;

// Inject CSS if not already present
if (!document.querySelector('#notebook-card-animations')) {
  const style = document.createElement('style');
  style.id = 'notebook-card-animations';
  style.textContent = fadeInCSS;
  document.head.appendChild(style);
}

export default NotebookCard;