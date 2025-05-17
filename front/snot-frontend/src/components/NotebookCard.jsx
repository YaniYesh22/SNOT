import React from 'react';

const NotebookCard = ({ id, title, tags = [] }) => {
  // Limit displayed tags to 3
  const displayTags = tags.slice(0, 3);
  const hasMoreTags = tags.length > 3;
  
  return (
    <div style={styles.card}>
      <div style={styles.cardContent}>
        <h3 style={styles.title}>{title}</h3>
        
        {/* Tags section */}
        {tags && tags.length > 0 && (
          <div style={styles.tagContainer}>
            {displayTags.map((tag, index) => (
              <span key={`${id}-tag-${index}`} style={styles.tag}>
                {tag}
              </span>
            ))}
            {hasMoreTags && (
              <span style={styles.tagMore}>+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
  },
  cardContent: {
    padding: '1rem',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '1rem',
    fontWeight: '600',
    margin: '0 0 0.75rem 0',
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
    marginTop: 'auto',
  },
  tag: {
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    whiteSpace: 'nowrap',
  },
  tagMore: {
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
  },
};

export default NotebookCard;