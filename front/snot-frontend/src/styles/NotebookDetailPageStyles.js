// Complete Updated NotebookDetailPageStyles.js with Reading Mode
export const styles = {
  // Main container styles
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  main: {
    flexGrow: 1,
    background: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh'
  },

  // Original Header styles (for normal mode)
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
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
    color: '#64748b',
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  },
  saveButton: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)'
  },
  savingButton: {
    background: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },

  // NEW: Minimal Reading Mode Header Styles
  readingModeHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 2rem',
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
  },

  readingHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },

  readingBackButton: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.5rem',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    fontWeight: '500'
  },

  readingNotebookTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },

  readingNotebookIcon: {
    width: '20px',
    height: '20px',
    color: '#4f46e5'
  },

  readingHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },

  readingInfoItem: {
    fontSize: '0.75rem',
    color: '#64748b',
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontWeight: '500',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },

  // Enhanced Toolbar Section Styles
  toolbarSection: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderBottom: '2px solid #e2e8f0',
    padding: '1.25rem 2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '3rem',
    flexShrink: 0,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    position: 'relative'
  },

  // Title Container
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
    color: '#0f172a',
    background: 'transparent',
    width: '100%',
    fontFamily: 'inherit',
    lineHeight: '1.2'
  },

  // Enhanced Toolbar Styles
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    flex: 1
  },
  toolbarActionsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.5rem 1rem',
    background: 'rgba(255, 255, 255, 0.7)',
    borderRadius: '12px',
    border: '1px solid rgba(79, 70, 229, 0.1)'
  },
  sectionLabel: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#1f2937',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    opacity: 1,
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  sectionIcon: {
    width: '18px',
    height: '18px',
    color: '#4f46e5',
    flexShrink: 0
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
    padding: '0.75rem 1.25rem',
    background: 'white',
    color: '#374151',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06)',
    position: 'relative'
  },
  toolbarButtonIcon: {
    flexShrink: 0,
    opacity: 0.8
  },
  toolbarButtonLoading: {
    background: '#f3f4f6',
    cursor: 'not-allowed',
    color: '#9ca3af',
    border: '2px solid #e5e7eb'
  },

  // Notebook Info Section
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
    color: '#64748b'
  },
  notebookInfoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  notebookInfoLabel: {
    fontWeight: '600',
    color: '#374151'
  },
  notebookInfoValue: {
    color: '#4f46e5',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)',
    padding: '0.125rem 0.375rem',
    borderRadius: '6px',
    fontSize: '0.875rem'
  },
  notebookInfoSeparator: {
    color: '#cbd5e1'
  },

  // Summary and Link Dropdowns
  summaryContainer: {
    position: 'relative'
  },
  summarySpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(71, 85, 105, 0.3)',
    borderTop: '2px solid #475569',
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
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    zIndex: 1001
  },
  summaryDropdownHeader: {
    padding: '1rem 1.25rem 0.75rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#475569',
    borderBottom: '1px solid #f1f5f9'
  },
  summaryOption: {
    width: '100%',
    padding: '1rem 1.25rem',
    background: 'white',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    borderBottom: '1px solid #f8fafc'
  },
  summaryOptionTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '0.25rem'
  },
  summaryOptionDesc: {
    fontSize: '0.8rem',
    color: '#64748b',
    lineHeight: '1.4'
  },

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
    border: '1px solid #e2e8f0',
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
    color: '#0f172a',
    borderBottom: '1px solid #f1f5f9',
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
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    background: '#f8fafc',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
    color: '#64748b',
    border: '2px solid #e2e8f0',
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
    background: '#e2e8f0',
    color: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  linkDropdownNote: {
    padding: '0.75rem 1.5rem 1.25rem',
    fontSize: '0.8rem',
    color: '#64748b',
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
    color: '#94a3b8'
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

  // 3-COLUMN LAYOUT STYLES
  contentLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    gap: '1rem',
    padding: '1rem',
    background: '#f8fafc'
  },

  // Left Panel - Sources
  leftPanel: {
    width: '320px',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    flexShrink: 0,
    overflow: 'hidden'
  },

  // Middle Panel - Chat
  middlePanel: {
    flex: 1,
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    minWidth: 0,
    overflow: 'hidden'
  },

  // Enhanced Saved Chats Button
  savedChatsButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.75rem 1rem',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    color: '#475569',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06)'
  },

  // Enhanced Save Chat Button
  saveChatButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
  },

  // Enhanced Dropdown
  savedChatsDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '0.75rem',
    width: '420px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    zIndex: 1001,
    animation: 'savedChatsSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Enhanced Dropdown Header
  savedChatsDropdownHeader: {
    padding: '1.5rem 1.75rem 1.25rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderBottom: '2px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#0f172a'
  },

  // Enhanced Content
  savedChatsContent: {
    maxHeight: '400px',
    overflow: 'auto',
    background: 'linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)'
  },

  // Enhanced Loading
  savedChatsLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
    gap: '1rem',
    color: '#64748b'
  },

  // Enhanced Empty State
  savedChatsEmpty: {
    padding: '3rem 2rem',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)'
  },

  savedChatsEmptyText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#475569',
    margin: '0 0 0.75rem 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },

  savedChatsEmptySubtext: {
    fontSize: '0.9rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.6'
  },

  // Enhanced Chat List
  savedChatsList: {
    padding: '1rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },

  // Enhanced Chat Item
  savedChatItem: {
    padding: '1.25rem 1.5rem',
    background: 'white',
    border: '2px solid transparent',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06)',
    margin: '0 0.5rem'
  },

  // Enhanced Item Header
  savedChatItemHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
    gap: '1rem'
  },

  savedChatItemTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: '1.4',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    flex: 1,
    minWidth: 0
  },

  savedChatItemDate: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500',
    background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    padding: '0.375rem 0.75rem',
    borderRadius: '8px',
    flexShrink: 0,
    border: '1px solid #e2e8f0'
  },

  // Enhanced Meta
  savedChatItemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: '500',
    flexWrap: 'wrap'
  },

  // Enhanced Footer
  savedChatsFooter: {
    padding: '1.25rem 1.75rem',
    borderTop: '2px solid #e2e8f0',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  savedChatsCloseButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
    color: '#64748b',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  },

  // Enhanced Modal
  saveChatModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    backdropFilter: 'blur(8px)',
    animation: 'modalFadeIn 0.3s ease-out'
  },

  saveChatModalContent: {
    background: 'white',
    borderRadius: '20px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
    animation: 'modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    border: '2px solid #e2e8f0'
  },

  saveChatModalHeader: {
    padding: '2rem 2rem 1rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderBottom: '2px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  saveChatModalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },

  saveChatModalClose: {
    background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
    border: '2px solid #e2e8f0',
    fontSize: '1.25rem',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '10px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  },

  saveChatModalBody: {
    padding: '2rem'
  },

  saveChatInfo: {
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border: '2px solid #bfdbfe',
    borderRadius: '12px',
    padding: '1.25rem',
    marginBottom: '1.5rem',
    textAlign: 'center'
  },

  saveChatInfoText: {
    fontSize: '1rem',
    color: '#1e40af',
    margin: 0,
    fontWeight: '600'
  },

  saveChatInputContainer: {
    marginBottom: '2rem'
  },

  saveChatLabel: {
    display: 'block',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem'
  },

  saveChatInput: {
    width: '100%',
    padding: '1rem 1.25rem',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s ease',
    background: '#f8fafc',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    fontFamily: 'inherit'
  },

  saveChatInputHint: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '0.5rem',
    fontStyle: 'italic'
  },

  saveChatModalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end'
  },

  saveChatCancelButton: {
    padding: '0.875rem 1.5rem',
    background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
    color: '#64748b',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  },

  saveChatConfirmButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.875rem 1.5rem',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
    minWidth: '140px',
    justifyContent: 'center'
  },

  saveChatConfirmButtonLoading: {
    background: 'linear-gradient(135deg, #6b7280, #4b5563)',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },

  // Right Panel - Notes and Summaries
  rightPanel: {
    width: '320px',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    flexShrink: 0,
    overflow: 'auto',
    maxHeight: '100%'
  },
  // Empty Summaries State Styles
  noSummariesMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
    textAlign: 'center',
    minHeight: '200px',
    background: 'linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    margin: '0.5rem 0'
  },

  noSummariesIcon: {
    color: '#cbd5e1',
    marginBottom: '1.5rem',
    opacity: 0.8
  },

  noSummariesText: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#475569',
    margin: '0 0 0.75rem 0',
    lineHeight: '1.3'
  },

  noSummariesSubtext: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5',
    maxWidth: '280px'
  },

  // Sources Panel Styles
  sourcesPanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  },

  sourcesPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.5rem 1.5rem 1rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0
  },

  sourcesPanelTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },

  sourcesCount: {
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: 'white',
    borderRadius: '12px',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '700',
    minWidth: '24px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)'
  },

  sourcesContent: {
    flex: 1,
    overflow: 'auto',
    padding: '1rem 0',
    background: 'linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)'
  },

  sourcesSection: {
    marginBottom: '1.5rem',
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden'
  },

  sourcesSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)',
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },

  sourcesSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#475569'
  },

  sourcesSectionIcon: {
    color: '#64748b'
  },

  sourcesSectionCount: {
    background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
    color: '#475569',
    borderRadius: '10px',
    padding: '0.25rem 0.625rem',
    fontSize: '0.7rem',
    fontWeight: '600',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
  },

  sourcesItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '0.75rem 0'
  },

  sourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    border: '1px solid transparent',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    background: 'white',
    margin: '0 0.75rem'
  },

  sourceItemIcon: {
    flexShrink: 0
  },

  fileTypeIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },

  sourceItemContent: {
    flex: 1,
    minWidth: 0
  },

  sourceItemTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '0.375rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: '1.2'
  },

  sourceItemLink: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#3b82f6',
    textDecoration: 'none',
    marginBottom: '0.375rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
    transition: 'color 0.2s ease',
    lineHeight: '1.2'
  },

  sourceItemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500'
  },

  sourceItemSeparator: {
    color: '#cbd5e1'
  },

  linkStatusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.125rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: '600'
  },

  sourceItemActions: {
    display: 'flex',
    gap: '0.375rem',
    flexShrink: 0,
    opacity: 0,
    transition: 'opacity 0.2s ease'
  },

  sourceActionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    color: '#64748b',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  sourceRemoveButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
    color: '#dc2626',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  // No Sources Empty State
  noSourcesMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
    height: '100%'
  },

  noSourcesIcon: {
    color: '#cbd5e1',
    marginBottom: '1.5rem'
  },

  noSourcesText: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#475569',
    margin: '0 0 0.5rem 0'
  },

  noSourcesSubtext: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5'
  },

  // Chat Panel Styles
  chatPanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  },

  chatPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.5rem 1.5rem 1rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0
  },

  chatPanelTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },

  chatHeaderActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center'
  },

  summariesSelect: {
    background: 'white',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    color: '#475569',
    cursor: 'pointer',
    minWidth: '120px',
    fontWeight: '500',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  clearChatButton: {
    background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  // Chat Messages
  chatMessages: {
    flex: 1,
    overflow: 'auto',
    padding: '1.5rem',
    background: 'linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)'
  },

  chatMessage: {
    marginBottom: '1.5rem'
  },

  chatMessageContent: {
    borderRadius: '16px',
    padding: '1rem 1.25rem',
    maxWidth: '85%',
    position: 'relative',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },

  chatMessageUser: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: 'white',
    marginLeft: 'auto',
    borderBottomRightRadius: '6px'
  },

  chatMessageAI: {
    background: 'white',
    border: '1px solid #e2e8f0',
    marginRight: 'auto',
    borderBottomLeftRadius: '6px',
    color: '#0f172a'
  },

  chatMessageSystem: {
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border: '1px solid #bfdbfe',
    color: '#1e40af',
    marginRight: 'auto',
    borderBottomLeftRadius: '6px'
  },

  chatMessageError: {
    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    border: '1px solid #fecaca',
    color: '#dc2626',
    marginRight: 'auto',
    borderBottomLeftRadius: '6px'
  },

  chatMessageSummary: {
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    border: '1px solid #bbf7d0',
    color: '#15803d',
    marginRight: 'auto',
    borderBottomLeftRadius: '6px'
  },

  chatMessageSources: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    border: '1px solid #e2e8f0',
    color: '#475569',
    marginRight: 'auto',
    borderBottomLeftRadius: '6px',
    fontSize: '0.8rem'
  },

  chatMessageText: {
    fontSize: '0.875rem',
    lineHeight: '1.6',
    marginBottom: '0.5rem',
    whiteSpace: 'pre-wrap'
  },

  chatMessageTime: {
    fontSize: '0.75rem',
    opacity: 0.7,
    textAlign: 'right',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: '500'
  },

  chatMessageMeta: {
    fontSize: '0.65rem',
    opacity: 0.8,
    fontStyle: 'italic'
  },

  // Chat Empty State
  chatEmptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    minHeight: '400px',
    padding: '2rem'
  },

  chatEmptyIcon: {
    color: '#cbd5e1',
    marginBottom: '1.5rem'
  },

  chatEmptyText: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#475569',
    margin: '0 0 0.5rem 0'
  },

  chatEmptySubtext: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5'
  },

  // Typing indicator
  chatTypingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.75rem 0'
  },

  typingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#64748b',
    animation: 'typingAnimation 1.4s infinite ease-in-out'
  },

  // Chat Form
  chatForm: {
    padding: '1.5rem',
    borderTop: '1px solid #e2e8f0',
    background: 'white',
    flexShrink: 0
  },

  chatFormInner: {
    margin: 0
  },

  chatInputContainer: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  },

  chatInput: {
    flex: 1,
    padding: '1rem 1.25rem',
    border: '2px solid #e2e8f0',
    borderRadius: '24px',
    fontSize: '0.875rem',
    outline: 'none',
    background: '#f8fafc',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    lineHeight: '1.5'
  },

  chatSendButton: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
  },

  chatSendButtonDisabled: {
    background: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },

  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  chatNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },

  chatNoteIcon: {
    color: '#94a3b8'
  },

  // Source information in chat
  sourcesInfo: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: 'rgba(79, 70, 229, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(79, 70, 229, 0.1)'
  },

  sourcesHeader: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#4f46e5',
    marginBottom: '0.5rem'
  },

  sourceNumber: {
    fontWeight: '600',
    color: '#4f46e5',
    minWidth: '14px'
  },

  sourceText: {
    color: '#64748b',
    lineHeight: '1.4'
  },

  sourceScore: {
    color: '#059669',
    fontWeight: '500'
  },

  // Notes Section
  notesSection: {
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
    flex: '0 0 auto',
    background: 'linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)',
    maxHeight: '300px',
    display: 'flex',
    flexDirection: 'column'
  },

  notesSectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 1rem 0',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },

  notesEditor: {
    height: '200px',
    marginBottom: '0.5rem',
    flex: '1 1 auto',
    maxHeight: '200px',
    overflow: 'hidden'
  },

  quillEditor: {
    height: '150px',
    fontSize: '0.875rem',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  // Generated Summaries Section
  summariesSection: {
    padding: '1.5rem',
    flex: '1 1 auto',
    background: 'linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)',
    minHeight: 'fit-content',
    overflow: 'visible'
  },

  summariesHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e2e8f0'
  },

  summariesTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },

  summariesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },

  summaryCard: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
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
    width: '52px',
    height: '52px',
    background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
    borderRadius: '14px',
    border: '2px solid #e2e8f0',
    flexShrink: 0,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },

  summaryCardTitle: {
    flex: 1,
    minWidth: 0
  },

  summaryTypeName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '0.375rem',
    lineHeight: 1.2
  },

  summaryStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#059669',
    fontWeight: '600'
  },

  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10b981',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },

  summaryCardAction: {
    color: '#64748b',
    transition: 'all 0.3s ease',
    transform: 'translateX(0)',
    opacity: 0.7
  },

  summaryMetadata: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem'
  },

  metadataItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.8rem',
    transition: 'all 0.2s ease',
    padding: '0.375rem 0.5rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
  },

  metadataIcon: {
    fontSize: '0.9rem',
    flexShrink: 0,
    width: '16px',
    textAlign: 'center'
  },

  metadataLabel: {
    color: '#64748b',
    fontWeight: '500',
    minWidth: '60px'
  },

  metadataValue: {
    color: '#0f172a',
    fontWeight: '600'
  },

  summaryProgress: {
    marginTop: 'auto'
  },

  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '1rem'
  },

  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
    width: '100%',
    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%)',
    backgroundSize: '16px 16px',
    animation: 'progressStripes 1s linear infinite'
  },

  // Progress Popup Styles
  summaryProgressPopup: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '350px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    zIndex: 2000,
    animation: 'slideInFromRight 0.3s ease-out',
    overflow: 'hidden'
  },

  progressPopupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #f1f5f9',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
  },

  progressPopupTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1rem',
    fontWeight: '700',
    color: '#0f172a'
  },

  // Floating Progress Indicator Styles
  floatingProgressIndicator: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    zIndex: 1500,
    animation: 'floatingSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    minWidth: '280px'
  },

  floatingProgressContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.25rem',
    position: 'relative',
    zIndex: 2
  },

  floatingProgressIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
    flexShrink: 0
  },

  floatingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  floatingProgressText: {
    flex: 1,
    minWidth: 0
  },

  floatingProgressTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '0.25rem',
    lineHeight: '1.2'
  },

  floatingProgressSubtext: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500',
    lineHeight: '1.2'
  },

  floatingProgressPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(124, 58, 237, 0.05))',
    animation: 'floatingPulse 2s ease-in-out infinite',
    zIndex: 1
  },

  progressIcon: {
    fontSize: '1rem',
    animation: 'pulse 2s infinite'
  },

  progressPopupClose: {
    background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
    border: '1px solid #e2e8f0',
    fontSize: '1.1rem',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  progressPopupContent: {
    padding: '1.5rem'
  },

  progressPopupStats: {
    fontSize: '0.8rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    padding: '0.75rem 1rem',
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },

  progressPopupText: {
    fontSize: '0.875rem',
    color: '#475569',
    marginBottom: '1rem',
    fontWeight: '500'
  },

  progressPopupTime: {
    fontSize: '0.75rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },

  progressTypeDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '1rem'
  },

  progressTypeItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.75rem',
    background: 'white',
    border: '1px solid #f1f5f9',
    borderRadius: '8px',
    fontSize: '0.8rem'
  },

  progressTypeName: {
    fontWeight: '600',
    color: '#475569'
  },

  progressTypeStatus: {
    fontWeight: '600',
    fontSize: '0.75rem'
  },

  taskId: {
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    color: '#64748b'
  },

  // Compact Summary Page Header Styles
  summaryPageContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'white',
    /* Remove margin to prevent sidebar compression */
    padding: '1rem',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    minWidth: 0 // Prevent flexbox from shrinking sidebar
  },

  summaryPageHeader: {
    padding: '1rem 2rem 0.75rem', // Reduced from 2rem 2rem 1.5rem
    borderBottom: '1px solid #e2e8f0',
    background: 'linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%)',
    flexShrink: 0
  },

  backToNotebookButton: {
    background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    fontSize: '0.8rem', // Smaller font
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem', // Reduced gap
    padding: '0.5rem 0.75rem', // Smaller padding
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    marginBottom: '0.75rem', // Reduced margin
    fontWeight: '500',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  summaryPageTitle: {
    marginLeft: '0'
  },

  summaryPageMainTitle: {
    fontSize: '1.5rem', // Reduced from 2rem
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 0.25rem 0', // Reduced bottom margin
    lineHeight: '1.3'
  },

  summaryPageSubtitle: {
    fontSize: '0.875rem', // Reduced from 1rem
    color: '#64748b',
    margin: 0
  },

  summaryPageContent: {
    flex: 1,
    overflow: 'auto',
    padding: '1rem 2rem 2rem' // Reduced top padding
  },

  summaryPageText: {
    maxWidth: '800px',
    margin: '0 auto'
  },

  summaryPageMeta: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem', // Reduced from 2rem
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },

  summaryPageMetaItem: {
    fontSize: '0.75rem', // Reduced from 0.875rem
    color: '#64748b',
    background: 'white',
    padding: '0.25rem 0.5rem', // Reduced padding
    borderRadius: '6px',
    fontWeight: '500',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },

  summaryPageTextContent: {
    fontSize: '1rem',
    lineHeight: '1.7',
    color: '#475569',
    whiteSpace: 'pre-wrap',
    marginBottom: '2rem',
    background: 'linear-gradient(135deg, #fafbfc, #f8fafc)',
    padding: '2rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  summaryPageActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },

  summaryPageCopyButton: {
    background: 'linear-gradient(135deg, #059669, #047857)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)'
  },

  summaryPageDownloadButton: {
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
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
    border: '4px solid #f1f5f9',
    borderRadius: '50%',
    borderTop: '4px solid #4f46e5',
    animation: 'spin 1s linear infinite'
  },

  // Loading States
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#64748b"
  },

  loadingSpinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #f1f5f9",
    borderRadius: "50%",
    borderTop: "4px solid #4f46e5",
    animation: "spin 1s linear infinite",
    marginBottom: "1.5rem",
  },

  loadingText: {
    fontSize: '1.1rem',
    fontWeight: '500'
  },

  // Status styles for links
  statusProcessing: {
    color: '#f59e0b',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    borderRadius: '6px'
  },

  statusCompleted: {
    color: '#059669',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    borderRadius: '6px'
  },

  statusError: {
    color: '#dc2626',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    borderRadius: '6px'
  },

  // YouTube thumbnail styles
  youtubeThumbnailContainer: {
    width: '36px',
    height: '27px',
    borderRadius: '6px',
    overflow: 'hidden',
    position: 'relative',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
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
    width: '14px',
    height: '14px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '8px'
  },

  modernLinkIcon: {
    width: '36px',
    height: '27px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    color: 'white',
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
  }
};

// Enhanced animations with Reading Mode hover effects
// Add this to your enhancedAnimations in NotebookDetailPageStyles.js:

export const enhancedAnimations = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes progressStripes {
    0% { background-position: 0 0; }
    100% { background-position: 32px 0; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes typingAnimation {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
  }

  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
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

  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }

  /* NEW: Reading Mode Back Button Hover Effect */
  .reading-back-button:hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0) !important;
    color: #374151 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
  }

  /* Enhanced hover effects */
  .source-item:hover {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
    transform: translateY(-2px) translateX(2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
    border-color: #e2e8f0 !important;
  }

  .source-item:hover .sourceItemActions {
    opacity: 1 !important;
  }

  .source-action-button:hover {
    background: linear-gradient(135deg, #e2e8f0, #cbd5e1) !important;
    color: #475569 !important;
    transform: translateY(-1px) scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }

  .source-remove-button:hover {
    background: linear-gradient(135deg, #fee2e2, #fca5a5) !important;
    color: #dc2626 !important;
    transform: translateY(-1px) scale(1.05);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3) !important;
  }

  .source-item-link:hover {
    color: #1d4ed8 !important;
    text-decoration: underline;
  }

  .sourcesItems {
    transition: all 0.3s ease;
  }

  .sourceItem {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Enhanced toolbar button hover effects */
  .toolbar-button:hover:not(:disabled) {
    background: #f3f4f6 !important;
    border-color: #9ca3af !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
    color: #0f172a !important;
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

  /* Enhanced summary card hover effects */
  .modern-summary-card:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
    border-color: #4f46e5 !important;
  }

  .modern-summary-card:hover .summaryTypeIcon {
    background: linear-gradient(135deg, #4f46e5, #7c3aed) !important;
    color: white !important;
    transform: scale(1.1);
  }

  @keyframes floatingSlideIn {
  from {
    opacity: 0;
    transform: translateY(60px) translateX(20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(0) scale(1);
  }
}

@keyframes floatingPulse {
  0%, 100% { 
    opacity: 0.3; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.1; 
    transform: scale(1.02);
  }
}

/* Enhanced hover effect for floating indicator */
.floating-progress-indicator:hover {
  transform: translateY(-4px) scale(1.02) !important;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2), 0 8px 20px rgba(0, 0, 0, 0.15) !important;
  border-color: #4f46e5 !important;
}

.floating-progress-indicator:hover .floatingProgressIcon {
  background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.6) !important;
}

.floating-progress-indicator:hover .floatingProgressTitle {
  color: #4f46e5 !important;
}a

.floating-progress-indicator:active {
  transform: translateY(-2px) scale(1.01) !important;
}


  /* Enhanced link dropdown animations and hover effects */
  .linkInput:focus {
    border-color: #3b82f6 !important;
    background: white !important;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    transform: translateY(-1px);
  }

  .linkCancelButton:hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0) !important;
    border-color: #cbd5e1 !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
  }

  .linkConfirmButton:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 12px 25px rgba(59, 130, 246, 0.5) !important;
  }

  /* Enhanced chat input hover effects */
  .chatInput:focus {
    border-color: #4f46e5 !important;
    background: white !important;
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1), 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    transform: translateY(-1px);
  }

  .chatSendButton:hover:not(:disabled) {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 12px 25px rgba(79, 70, 229, 0.5) !important;
  }

  .progress-popup-close:hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0) !important;
    color: #475569 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
  }

  /* Enhanced modal and button hover effects */
  .summary-modal-close:hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0) !important;
    color: #475569 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
  }
  
  .summary-copy-button:hover {
    background: linear-gradient(135deg, #047857, #065f46) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(5, 150, 105, 0.5) !important;
  }
  
  .summary-download-button:hover {
    background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.5) !important;
  }

  .clear-chat-button:hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0) !important;
    border-color: #cbd5e1 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
  }

  .back-button:hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
  }

  .save-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.5) !important;
  }

  /* Summary dropdown hover effects */
  .summary-option:hover {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9) !important;
    transform: translateX(4px);
  }

  /* Add typing animation delay for dots */
  .typingDot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typingDot:nth-child(3) {
    animation-delay: 0.4s;
  }

  /* Enhanced responsive adjustments for 3-column layout */
  @media (max-width: 1400px) {
    .leftPanel,
    .rightPanel {
      width: 300px !important;
    }
  }

  @media (max-width: 1200px) {
    .leftPanel,
    .rightPanel {
      width: 280px !important;
    }
    
    .contentLayout {
      gap: 0.75rem !important;
    }
  }

  @media (max-width: 1024px) {
    .leftPanel,
    .rightPanel {
      width: 240px !important;
    }
    
    .contentLayout {
      gap: 0.5rem !important;
      padding: 0.5rem !important;
    }
  }

  @media (max-width: 768px) {
    .contentLayout {
      flex-direction: column !important;
      gap: 0.5rem !important;
    }
    
    .leftPanel,
    .rightPanel {
      width: 100% !important;
      height: 300px !important;
    }
    
    .middlePanel {
      flex: 1 !important;
      min-height: 400px !important;
    }

    // Add these animations to your existing enhancedAnimations string:

  @keyframes savedChatsSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Enhanced hover effects for saved chats */
  .saved-chats-button:hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0) !important;
    border-color: #cbd5e1 !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
    color: #374151 !important;
  }

  .save-chat-button:hover {
    background: linear-gradient(135deg, #059669, #047857) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5) !important;
  }

  .saved-chat-item:hover {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
    border-color: #4f46e5 !important;
    transform: translateY(-3px) translateX(3px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15) !important;
  }

  .saved-chat-item:hover .savedChatItemTitle {
    color: #4f46e5 !important;
  }

  .saved-chats-close-button:hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0) !important;
    border-color: #cbd5e1 !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
    color: #374151 !important;
  }

  .save-chat-modal-close:hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0) !important;
    border-color: #cbd5e1 !important;
    color: #374151 !important;
    transform: translateY(-1px);
  }

  .save-chat-cancel-button:hover {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0) !important;
    border-color: #cbd5e1 !important;
    color: #374151 !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
  }

  .save-chat-confirm-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669, #047857) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5) !important;
  }

  .save-chat-input:focus {
    border-color: #4f46e5 !important;
    background: white !important;
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1), 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    transform: translateY(-1px);
  }

  /* Responsive adjustments for saved chats */
  @media (max-width: 768px) {
    .savedChatsDropdown {
      width: 350px !important;
      right: -50px !important;
    }
    
    .save-chat-modal-content {
      width: 95% !important;
      margin: 1rem !important;
    }
  }

  @media (max-width: 480px) {
    .savedChatsDropdown {
      width: 320px !important;
      right: -80px !important;
    }
  }

    /* Make reading mode header more compact on mobile */
    .readingModeHeader {
      padding: 0.5rem 1rem !important;
      flex-direction: column !important;
      gap: 0.5rem !important;
    }

    .readingHeaderLeft,
    .readingHeaderRight {
      width: 100% !important;
      justify-content: center !important;
    }

    .readingHeaderRight {
      gap: 0.5rem !important;
    }

    .readingInfoItem {
      font-size: 0.7rem !important;
      padding: 0.125rem 0.375rem !important;
    }
  }

  /* Smooth panel transitions */
  .leftPanel,
  .middlePanel,
  .rightPanel {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Enhanced scrollbar styling */
  .sourcesContent::-webkit-scrollbar,
  .chatMessages::-webkit-scrollbar,
  .rightPanel::-webkit-scrollbar {
    width: 6px;
  }

  .sourcesContent::-webkit-scrollbar-track,
  .chatMessages::-webkit-scrollbar-track,
  .rightPanel::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  .sourcesContent::-webkit-scrollbar-thumb,
  .chatMessages::-webkit-scrollbar-thumb,
  .rightPanel::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #cbd5e1, #94a3b8);
    border-radius: 3px;
  }

  .sourcesContent::-webkit-scrollbar-thumb:hover,
  .chatMessages::-webkit-scrollbar-thumb:hover,
  .rightPanel::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #94a3b8, #64748b);
  }
`;

export const injectNotebookDetailCSS = () => {
  if (!document.querySelector('#notebook-detail-styles')) {
    const style = document.createElement('style');
    style.id = 'notebook-detail-styles';
    style.textContent = enhancedAnimations;
    document.head.appendChild(style);
  }
};