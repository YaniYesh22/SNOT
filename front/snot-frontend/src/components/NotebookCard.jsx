import React, { useState } from 'react';

export default function NotebookCard({ id, title = 'Untitled Notebook' }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      style={{
        ...styles.card,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 4px 12px rgba(0,0,0,0.1)' 
          : '0 1px 4px rgba(0,0,0,0.05)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.icon}>📓</div>
      <div style={styles.title}>{title}</div>
      <div style={{
        ...styles.openIndicator,
        transform: isHovered ? 'translateY(0)' : 'translateY(100%)'
      }}>
        <span style={styles.openText}>Open</span>
        <span style={styles.arrow}>→</span>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    position: 'relative',
    overflow: 'hidden',
    height: '160px',
    width: '100%'
  },
  icon: {
    fontSize: '2.5rem',
    marginBottom: '1rem'
  },
  title: {
    fontWeight: '500',
    fontSize: '1.1rem',
    color: '#111827',
    // Ensure long titles don't overflow
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },
  openIndicator: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    backgroundColor: '#f9fafb',
    padding: '0.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderTop: '1px solid #f3f4f6',
    transition: 'transform 0.2s ease-in-out',
    transform: 'translateY(100%)'
  },
  openText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#4b5563'
  },
  arrow: {
    marginLeft: '0.25rem',
    fontWeight: 'bold'
  }
};