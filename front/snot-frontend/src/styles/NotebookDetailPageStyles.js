// NotebookDetailPageStyles.js

export const styles = {
  // Main container styles
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

  // Toolbar Section Styles
  toolbarSection: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '1rem 2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '3rem',
    flexShrink: 0
  },

  // Title Container (moved to toolbar)
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    minWidth: '200px'
  },
  notebookIcon: {
    color: '#4f46e5',
    flexShrink: 0
  },
  titleContent: {
    flex: 1,
    minWidth: 0
  },
  titleInput: {
    border: 'none',
    fontSize: '1.5rem',
    fontWeight: '700',
    padding: '0',
    outline: 'none',
    color: ' #111827',
    background: 'transparent',
    width: '100%',
    fontFamily: 'inherit',
    lineHeight: '1.2'
  },

  // Modern Toolbar Styles
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    flex: 1
  },
  toolbarActionsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  sectionLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: ' #374151',
    whiteSpace: 'nowrap'
  },
  toolbarButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  toolbarButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    color: '#374151',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
  },
  toolbarButtonIcon: {
    flexShrink: 0,
    opacity: 0.8
  },
  toolbarButtonLoading: {
    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    cursor: 'not-allowed',
    color: '#6b7280'
  },

  // Horizontal Notebook Info Styles
  notebookInfoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  notebookInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  notebookInfoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  notebookInfoLabel: {
    fontWeight: '500'
  },
  notebookInfoValue: {
    color: '#4f46e5',
    fontWeight: '600'
  },
  notebookInfoSeparator: {
    color: '#d1d5db'
  },

  // Summary container and dropdown
  summaryContainer: {
    position: 'relative'
  },
  summarySpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(55, 65, 81, 0.3)',
    borderTop: '2px solid #374151',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    flexShrink: 0
  },
  summaryDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '0.5rem',
    width: '280px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    zIndex: 1001
  },
  summaryDropdownHeader: {
    padding: '1rem 1.25rem 0.75rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6'
  },
  summaryOption: {
    width: '100%',
    padding: '1rem 1.25rem',
    background: 'white',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    borderBottom: '1px solid #f9fafb'
  },
  summaryOptionTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.25rem'
  },
  summaryOptionDesc: {
    fontSize: '0.8rem',
    color: '#6b7280',
    lineHeight: '1.4'
  },

  // Link dropdown styles (keep existing)
  linkContainer: {
    position: 'relative'
  },
  linkDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '0.75rem',
    width: '380px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    zIndex: 1001,
    animation: 'linkDropdownSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  linkDropdownHeader: {
    padding: '1.25rem 1.5rem 1rem',
    fontSize: '1rem',
    fontWeight: '700',
    color: '#111827',
    borderBottom: '1px solid #f3f4f6',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  linkDropdownIcon: {
    width: '20px',
    height: '20px',
    color: '#3b82f6'
  },
  linkInputContainer: {
    padding: '1.5rem'
  },
  linkInput: {
    width: '100%',
    padding: '1rem 1.25rem',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    background: '#fafafa',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    lineHeight: '1.5'
  },
  linkDropdownActions: {
    display: 'flex',
    gap: '1rem',
    padding: '0 1.5rem 1.5rem',
    justifyContent: 'flex-end'
  },
  linkCancelButton: {
    padding: '0.75rem 1.25rem',
    background: 'white',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '80px'
  },
  linkConfirmButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
    minWidth: '120px',
    justifyContent: 'center'
  },
  linkConfirmButtonDisabled: {
    background: '#e5e7eb',
    color: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  linkDropdownNote: {
    padding: '0.75rem 1.5rem 1.25rem',
    fontSize: '0.8rem',
    color: '#6b7280',
    textAlign: 'center',
    background: '#f8fafc',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  linkDropdownNoteIcon: {
    width: '14px',
    height: '14px',
    color: '#9ca3af'
  },
  buttonIcon: {
    flexShrink: 0
  },

  // Error styles
  errorContainer: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '1rem',
    margin: '1rem 2rem',
    flexShrink: 0
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

  // Content layout
  contentLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },

  // Central area (updated)
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

  // UPDATED: Compact horizontal sources section
  sourcesSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '1.5rem'
  },

  // Welcome Section Styles (keep existing)
  welcomeContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '500px'
  },
  welcomeContent: {
    textAlign: 'center',
    maxWidth: '600px',
    padding: '2rem'
  },
  welcomeIcon: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem',
    color: '#6366f1'
  },
  welcomeTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '1rem',
    margin: '0 0 1rem 0'
  },
  welcomeDescription: {
    fontSize: '1.125rem',
    color: '#6b7280',
    lineHeight: '1.6',
    marginBottom: '3rem',
    margin: '0 0 3rem 0'
  },
  welcomeFeatures: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'center'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.5rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    minWidth: '280px',
    transition: 'all 0.2s ease'
  },
  featureIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    flexShrink: 0
  },
  featureText: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#374151'
  },

  sourcesContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row', // Changed from 'column'
    gap: '2rem',
    alignItems: 'flex-start'
  },

  // NEW: Individual section containers
  filesList: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column'
  },

  linksList: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column'
  },
  emptyStateMessage: {
    padding: '1rem',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '0.875rem',
    fontStyle: 'italic',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px dashed #e5e7eb'
  },
  // UPDATED: Smaller, more subtle section headers
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #f1f5f9'
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    margin: 0
  },
  sectionCount: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
    height: '20px',
    borderRadius: '10px',
    background: '#e5e7eb',
    color: '#6b7280',
    fontSize: '0.7rem',
    fontWeight: '600',
    padding: '0 0.4rem'
  },

  // UPDATED: Horizontal grid instead of vertical
  itemsGrid: {
    display: 'flex',
    gap: '0.75rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem',
    scrollbarWidth: 'thin',
    scrollbarColor: '#e5e7eb transparent'
  },

  // UPDATED: Much smaller, compact file items
  modernFileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: '200px',
    maxWidth: '250px',
    padding: '0.5rem 0.75rem',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    flexShrink: 0
  },
  fileIconContainer: {
    flexShrink: 0
  },
  modernFileIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: 'none'
  },
  fileContent: {
    flex: 1,
    minWidth: 0
  },
  fileName: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: '0.125rem'
  },
  fileMetadata: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.7rem',
    color: '#6b7280'
  },
  metadataSeparator: {
    color: '#d1d5db'
  },
  fileActions: {
    display: 'flex',
    gap: '0.25rem',
    flexShrink: 0
  },

  // UPDATED: Much smaller, compact link items
  modernLinkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: '280px',
    maxWidth: '320px',
    padding: '0.75rem',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    flexShrink: 0
  },

  linkIconContainer: {
    flexShrink: 0
  },

  modernLinkIcon: {
    width: '60px',
    height: '45px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    color: 'white',
    boxShadow: 'none'
  },
  youtubeThumbnailContainer: {
    width: '60px',
    height: '45px',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.2s ease'
  },

  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '16px',
    height: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '8px'
  },

  linkTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#111827',
    lineHeight: '1.3',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: '0.125rem'
  },

  linkUrl: {
    fontSize: '0.7rem',
    color: '#6b7280',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    opacity: 0.8
  },

  statusIndicator: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0
  },
  linkContent: {
    flex: 1,
    minWidth: 0
  },
  modernLinkText: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#0ea5e9',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
    marginBottom: '0.125rem',
    transition: 'color 0.2s ease'
  },
  linkStatus: {
    fontSize: '0.7rem'
  },
  statusProcessing: {
    color: '#f59e0b',
    fontWeight: '500'
  },
  statusCompleted: {
    color: '#10b981',
    fontWeight: '500'
  },
  statusError: {
    color: '#ef4444',
    fontWeight: '500'
  },
  linkActions: {
    display: 'flex',
    gap: '0.25rem',
    flexShrink: 0
  },

  // UPDATED: Smaller action buttons
  modernActionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  modernRemoveButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    background: '#fef2f2',
    color: '#dc2626',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // Progress styles
  progressBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1999,
    backdropFilter: 'blur(2px)'
  },
  progressContainer: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '500px',
    padding: '1.5rem',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '0.875rem',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    zIndex: 2000
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem'
  },
  progressTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  progressIcon: {
    fontSize: '1rem',
    animation: 'pulse 2s infinite'
  },
  progressStats: {
    color: '#64748b',
    fontSize: '0.8rem',
    fontWeight: '500'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '0.75rem'
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%)',
    backgroundSize: '16px 16px',
    animation: 'progressStripes 1s linear infinite'
  },
  progressDetails: {
    marginBottom: '0.5rem'
  },
  progressText: {
    color: '#475569',
    marginBottom: '0.25rem',
    fontWeight: '500'
  },
  progressTime: {
    color: '#64748b',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  taskId: {
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    padding: '0.125rem 0.25rem',
    borderRadius: '3px',
    fontSize: '0.7rem'
  },
  progressTypeDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid #e2e8f0'
  },
  progressTypeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressTypeName: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500'
  },
  progressTypeStatus: {
    fontSize: '0.75rem',
    fontWeight: '600'
  },

  // Right sidebar styles
  rightSidebar: {
    width: '320px',
    background: 'white',
    borderLeft: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto'
  },

  // Notes section
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

  // Generated Summaries Section
  summariesSection: {
    padding: '1.5rem',
    borderTop: '1px solid #e5e7eb',
    flex: '0 0 auto',
    background: 'linear-gradient(135deg, #fafafa 0%, #f8fafc 100%)',
    minHeight: 'fit-content'
  },
  summariesHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #e5e7eb'
  },
  summariesTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  summariesCount: {
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: 'white',
    borderRadius: '12px',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    minWidth: '24px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
  },
  summariesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  summaryCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  summaryCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem'
  },
  summaryTypeIcon: {
    fontSize: '1.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    flexShrink: 0,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  summaryCardTitle: {
    flex: 1,
    minWidth: 0
  },
  summaryTypeName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.25rem',
    lineHeight: 1.2
  },
  summaryStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#059669',
    fontWeight: '500'
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10b981',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },
  summaryCardAction: {
    color: '#6b7280',
    transition: 'all 0.3s ease',
    transform: 'translateX(0)',
    opacity: 0.7
  },
  summaryMetadata: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  metadataItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
    transition: 'all 0.2s ease',
    padding: '0.25rem',
    borderRadius: '6px'
  },
  metadataIcon: {
    fontSize: '0.9rem',
    flexShrink: 0,
    width: '16px',
    textAlign: 'center'
  },
  metadataLabel: {
    color: '#6b7280',
    fontWeight: '500',
    minWidth: '60px'
  },
  metadataValue: {
    color: '#111827',
    fontWeight: '600'
  },
  summaryProgress: {
    marginTop: 'auto'
  },
  progressFill: {
    height: '100%',
    width: '100%',
    background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
    borderRadius: '2px'
  },

  // Summary Page Styles
  summaryPageContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'white',
    margin: '1rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  },
  summaryPageHeader: {
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #e5e7eb',
    background: '#fafafa',
    flexShrink: 0
  },
  backToNotebookButton: {
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
    transition: 'background-color 0.2s ease',
    marginBottom: '1rem'
  },
  summaryPageTitle: {
    marginLeft: '0.5rem'
  },
  summaryPageMainTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 0.5rem 0',
    lineHeight: '1.2'
  },
  summaryPageSubtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0
  },
  summaryPageContent: {
    flex: 1,
    overflow: 'auto',
    padding: '2rem'
  },
  summaryPageText: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  summaryPageMeta: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap'
  },
  summaryPageMetaItem: {
    fontSize: '0.875rem',
    color: '#6b7280',
    background: '#f3f4f6',
    padding: '0.5rem 1rem',
    borderRadius: '6px'
  },
  summaryPageTextContent: {
    fontSize: '1rem',
    lineHeight: '1.7',
    color: '#374151',
    whiteSpace: 'pre-wrap',
    marginBottom: '2rem',
    background: '#fafafa',
    padding: '2rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  summaryPageActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  summaryPageCopyButton: {
    background: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  summaryPageDownloadButton: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  summaryPageLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '1rem'
  },
  summaryPageLoadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f3f4f6',
    borderRadius: '50%',
    borderTop: '4px solid #4f46e5',
    animation: 'spin 1s linear infinite'
  },

  // Chat section
  chatSection: {
    flexShrink: 0,
    background: 'white',
    borderTop: '1px solid #e5e7eb',
    padding: '1.5rem 2rem',
    maxHeight: '60vh',
    display: 'flex',
    flexDirection: 'column'
  },
  chatContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  chatHeader: {
    textAlign: 'center',
    marginBottom: '1rem',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chatTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    flex: 1,
    textAlign: 'left'
  },
  chatHeaderActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center'
  },
  summariesDropdown: {
    position: 'relative'
  },
  summariesSelect: {
    background: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    color: '#374151',
    cursor: 'pointer',
    minWidth: '120px'
  },
  clearChatButton: {
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // Chat messages
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '1rem',
    maxHeight: '400px',
    padding: '0.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: '#fafafa'
  },
  chatMessage: {
    marginBottom: '1rem'
  },
  chatMessageContent: {
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    maxWidth: '80%',
    position: 'relative'
  },
  chatMessageUser: {
    background: '#4f46e5',
    color: 'white',
    marginLeft: 'auto',
    borderBottomRightRadius: '4px'
  },
  chatMessageAI: {
    background: 'white',
    border: '1px solid #e5e7eb',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px'
  },
  chatMessageSystem: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    color: '#0369a1',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px'
  },
  chatMessageSummary: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#15803d',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px'
  },
  chatMessageError: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px'
  },
  chatMessageSources: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#475569',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px',
    fontSize: '0.8rem'
  },
  chatMessageText: {
    fontSize: '0.875rem',
    lineHeight: '1.4',
    marginBottom: '0.25rem',
    whiteSpace: 'pre-wrap'
  },
  chatMessageTime: {
    fontSize: '0.75rem',
    opacity: 0.7,
    textAlign: 'right',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chatMessageMeta: {
    fontSize: '0.65rem',
    opacity: 0.8,
    fontStyle: 'italic'
  },

  // Source information
  sourcesInfo: {
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: 'rgba(79, 70, 229, 0.05)',
    borderRadius: '4px',
    border: '1px solid rgba(79, 70, 229, 0.1)'
  },
  sourcesHeader: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#4f46e5',
    marginBottom: '0.25rem'
  },
  sourceItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.25rem',
    marginBottom: '0.125rem',
    fontSize: '0.7rem'
  },
  sourceNumber: {
    fontWeight: '600',
    color: '#4f46e5',
    minWidth: '12px'
  },
  sourceText: {
    color: '#6b7280',
    lineHeight: '1.3'
  },
  sourceScore: {
    color: '#059669',
    fontWeight: '500'
  },

  // Typing indicator
  chatTypingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem 0'
  },
  typingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#6b7280',
    animation: 'typingAnimation 1.4s infinite ease-in-out'
  },

  // Chat form
  chatForm: {
    marginBottom: '1rem',
    flexShrink: 0
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
  chatSendButtonDisabled: {
    background: '#9ca3af',
    cursor: 'not-allowed'
  },

  // Button spinner
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  // Chat note
  chatNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    fontStyle: 'italic',
    flexShrink: 0
  },
  chatNoteIcon: {
    color: '#9ca3af'
  },

  // Summary modal
  summaryModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '2rem'
  },
  summaryModalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  summaryModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0
  },
  summaryModalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0
  },
  summaryModalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '6px',
    transition: 'all 0.2s ease'
  },
  summaryModalBody: {
    flex: 1,
    overflow: 'auto',
    padding: '2rem'
  },
  summaryContent: {
    height: '100%'
  },
  summaryMeta: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap'
  },
  summaryMetaItem: {
    fontSize: '0.875rem',
    color: '#6b7280',
    background: '#f3f4f6',
    padding: '0.375rem 0.75rem',
    borderRadius: '6px'
  },
  summaryText: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1.5rem',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    color: '#374151',
    whiteSpace: 'pre-wrap',
    marginBottom: '1.5rem',
    minHeight: '300px',
    overflow: 'auto'
  },
  summaryActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  summaryCopyButton: {
    background: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  summaryDownloadButton: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  summaryLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: '1rem'
  },
  summaryLoadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f3f4f6',
    borderRadius: '50%',
    borderTop: '4px solid #4f46e5',
    animation: 'spin 1s linear infinite'
  },

  // Loading
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

// Enhanced animations for the styles
export const enhancedAnimations = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes progressStripes {
    0% { background-position: 0 0; }
    100% { background-position: 16px 0; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes typingAnimation {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes compactItemSlideIn {
    from {
      opacity: 0;
      transform: translateX(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }

  @keyframes linkDropdownSlideIn {
    from {
      opacity: 0;
      transform: translateY(-15px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Welcome section animations */
  .welcome-content {
    animation: fadeInUp 0.6s ease-out;
  }

  /* Feature item hover effects */
  .feature-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  }

  /* UPDATED: Compact modern file item hover effects */
  .modern-file-item:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    border-color: #d1d5db !important;
  }

  /* UPDATED: Compact modern link item hover effects */
  .modern-link-item:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    border-color: #d1d5db !important;
  }

  .modern-link-item:hover .thumbnailImage {
    transform: scale(1.05);
  }

  .modern-link-item:hover .youtubeThumbnailContainer {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .modern-link-item .linkTitle:hover {
    color: #0369a1 !important;
  }

  @media (max-width: 768px) {
    .youtubeThumbnailContainer,
    .modernLinkIcon {
      width: 48px !important;
      height: 36px !important;
    }
  }

  /* Modern link text hover */
  .modern-link-text:hover {
    color: #0369a1 !important;
    text-decoration: underline;
  }

  /* UPDATED: Smaller modern action button hovers */
  .modern-action-button:hover {
    background: #e5e7eb !important;
    color: #374151 !important;
    transform: translateY(-1px);
  }

  .modern-remove-button:hover {
    background: #fee2e2 !important;
    color: #dc2626 !important;
    transform: translateY(-1px);
  }

  /* Modern toolbar button hover effects */
  .toolbar-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%) !important;
    border-color: #94a3b8 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    color: #1e293b !important;
  }

  .toolbar-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  .toolbar-button:active:not(:disabled) {
    transform: translateY(0px) !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  }

  /* Summary dropdown hover effects */
  .summary-dropdown-container .summary-option:hover {
    background-color: #f9fafb !important;
  }
  
  .summary-dropdown-container .summary-option:last-child {
    border-bottom: none !important;
  }

  /* Modern summary card hover effects */
  .modern-summary-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .modern-summary-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15) !important;
    border-color: #4f46e5 !important;
  }

  /* Link dropdown animations and hover effects */
  .link-dropdown-container .linkInput:focus {
    border-color: #3b82f6 !important;
    background: white !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05) !important;
  }

  .link-dropdown-container .linkCancelButton:hover {
    background: #f3f4f6 !important;
    border-color: #d1d5db !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  }

  .link-dropdown-container .linkConfirmButton:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4) !important;
  }

  /* NEW: Horizontal scrollbar styling for itemsGrid */
  .itemsGrid::-webkit-scrollbar {
    height: 4px;
  }

  .itemsGrid::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
  }

  .itemsGrid::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 2px;
  }

  .itemsGrid::-webkit-scrollbar-thumb:hover {
    background: #d1d5db;
  }

  /* NEW: Fade effect for overflow scrolling */
  .itemsGrid::after {
    content: '';
    position: sticky;
    right: 0;
    width: 20px;
    height: 100%;
    background: linear-gradient(to left, white, transparent);
    pointer-events: none;
    flex-shrink: 0;
  }

  /* Add typing animation delay for dots */
  .typingDot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typingDot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  /* Summary modal animations */
  .summary-modal-close:hover {
    background-color: #f3f4f6 !important;
    color: #374151 !important;
  }
  
  .summary-copy-button:hover {
    background-color: #047857 !important;
  }
  
  .summary-download-button:hover {
    background-color: #3730a3 !important;
  }

  /* Smooth entrance animations */
  .feature-item {
    animation: fadeInUp 0.5s ease-out;
  }

  .feature-item:nth-child(1) { animation-delay: 0.1s; }
  .feature-item:nth-child(2) { animation-delay: 0.2s; }
  .feature-item:nth-child(3) { animation-delay: 0.3s; }

  /* UPDATED: Compact file and link item animations */
  .modern-file-item {
    animation: compactItemSlideIn 0.3s ease-out;
  }

  .modern-link-item {
    animation: compactItemSlideIn 0.3s ease-out;
  }

  /* NEW: Responsive adjustments for smaller screens */
  @media (max-width: 768px) {
    .modern-file-item,
    .modern-link-item {
      min-width: 180px !important;
      max-width: 200px !important;
      padding: 0.4rem 0.6rem !important;
    }
    
    .fileName,
    .modern-link-text {
      font-size: 0.75rem !important;
    }
    
    .fileMetadata,
    .linkStatus {
      font-size: 0.65rem !important;
    }
  }

  @media (max-width: 480px) {
    .itemsGrid {
      gap: 0.5rem !important;
    }
    
    .modern-file-item,
    .modern-link-item {
      min-width: 160px !important;
      max-width: 180px !important;
    }
    
    .sectionTitle {
      font-size: 0.8rem !important;
    }
    
    .sectionCount {
      min-width: 18px !important;
      height: 18px !important;
      font-size: 0.65rem !important;
    }
  }

  /* NEW: Focus states for accessibility */
  .modern-action-button:focus,
  .modern-remove-button:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 1px;
  }

  .modern-link-text:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 1px;
    border-radius: 2px;
  }

  /* NEW: Status indicators for links */
  .modern-link-item[data-status="processing"] .linkStatus {
    color: #f59e0b !important;
  }

  .modern-link-item[data-status="completed"] .linkStatus {
    color: #10b981 !important;
  }

  .modern-link-item[data-status="error"] .linkStatus {
    color: #ef4444 !important;
  }

  /* NEW: Enhanced input placeholder styling for link dropdown */
  .link-dropdown-container .linkInput::placeholder {
    color: #9ca3af;
    opacity: 1;
    font-style: italic;
  }

  .link-dropdown-container .linkInput:hover:not(:focus) {
    border-color: #d1d5db !important;
    background: #f9fafb !important;
  }

  /* NEW: Responsive improvements for link dropdown */
  @media (max-width: 768px) {
    .link-dropdown-container .linkDropdown {
      width: 320px !important;
      left: auto !important;
      right: 0 !important;
      margin-right: -10px;
    }
    
    .link-dropdown-container .linkInput {
      font-size: 16px !important; /* Prevents zoom on mobile */
    }
  }

  @media (max-width: 480px) {
    .link-dropdown-container .linkDropdown {
      width: 280px !important;
      right: -20px !important;
    }
    
    .link-dropdown-container .linkDropdownActions {
      flex-direction: column !important;
      gap: 0.75rem !important;
    }
    
    .link-dropdown-container .linkCancelButton,
    .link-dropdown-container .linkConfirmButton {
      width: 100% !important;
      justify-content: center !important;
    }
  }
`;

// Function to inject the CSS if not already present
export const injectNotebookDetailCSS = () => {
  if (!document.querySelector('#notebook-detail-styles')) {
    const style = document.createElement('style');
    style.id = 'notebook-detail-styles';
    style.textContent = enhancedAnimations;
    document.head.appendChild(style);
  }
};