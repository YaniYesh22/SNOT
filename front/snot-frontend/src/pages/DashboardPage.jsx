import React, { useEffect, useState } from "react";

import NotebookCard from "../components/NotebookCard";
import Sidebar from "../components/Sidebar";
import authService from "../services/AuthService";
import notebookService from "../services/NotebookService";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const [notebooks, setNotebooks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'delete'
  const [newTitle, setNewTitle] = useState("");
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userData, setUserData] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNotebook, setDraggedNotebook] = useState(null);
  const [apiError, setApiError] = useState(null);
  const navigate = useNavigate();

  // Refresh notebooks from API
  const refreshNotebooks = async () => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      const notebookData = await notebookService.getNotebooks();
      
      if (Array.isArray(notebookData)) {
        // Make sure each notebook has an order property and required fields
        const notebooksWithOrder = notebookData.map((notebook, index) => ({
          id: notebook.NotebookId || notebook.notebookId || `notebook-${index}`,
          title: notebook.Title || notebook.title || 'Untitled Notebook',
          content: notebook.Content || notebook.content || '',
          createdAt: notebook.CreatedAt || notebook.createdAt || new Date().toISOString(),
          updatedAt: notebook.UpdatedAt || notebook.updatedAt || new Date().toISOString(),
          order: notebook.Order !== undefined ? notebook.Order : 
                 notebook.order !== undefined ? notebook.order : index
        }));
        
        // Sort by order
        const sortedNotebooks = notebooksWithOrder.sort((a, b) => (a.order || 0) - (b.order || 0));
        setNotebooks(sortedNotebooks);
        
        // Also update localStorage as backup
        localStorage.setItem('notebooks', JSON.stringify(sortedNotebooks));
      } else if (notebookData && typeof notebookData === 'object') {
        // Handle case where API returns object with Items array
        const notebooks = notebookData.Items || notebookData.notebooks || [];
        
        // Process the notebooks as above
        const notebooksWithOrder = notebooks.map((notebook, index) => ({
          id: notebook.NotebookId || notebook.notebookId || `notebook-${index}`,
          title: notebook.Title || notebook.title || 'Untitled Notebook',
          content: notebook.Content || notebook.content || '',
          createdAt: notebook.CreatedAt || notebook.createdAt || new Date().toISOString(),
          updatedAt: notebook.UpdatedAt || notebook.updatedAt || new Date().toISOString(),
          order: notebook.Order !== undefined ? notebook.Order : 
                 notebook.order !== undefined ? notebook.order : index
        }));
        
        const sortedNotebooks = notebooksWithOrder.sort((a, b) => (a.order || 0) - (b.order || 0));
        setNotebooks(sortedNotebooks);
        
        // Update localStorage
        localStorage.setItem('notebooks', JSON.stringify(sortedNotebooks));
      } else {
        console.error("API returned invalid data format:", notebookData);
        setApiError("Invalid data format received from server.");
      }
    } catch (error) {
      console.error("Error refreshing notebooks:", error);
      setApiError("Failed to refresh notebooks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load user data and notebooks from DynamoDB on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setApiError(null);
      
      try {
        // Get user data
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          // First try to get from localStorage
          let userData = authService.getUserData();
          
          // If no data or no name, refresh from Cognito
          if (!userData || !userData.name || userData.name === 'User') {
            userData = await authService.refreshUserData();
          }
          
          setUserData(userData);
          
          // Fetch notebooks from the DynamoDB via API Gateway
          try {
            const notebookData = await notebookService.getNotebooks();
            
            if (Array.isArray(notebookData)) {
              // Make sure each notebook has an order property and required fields
              const notebooksWithOrder = notebookData.map((notebook, index) => ({
                id: notebook.NotebookId || notebook.notebookId || `notebook-${index}`,
                title: notebook.Title || notebook.title || 'Untitled Notebook',
                content: notebook.Content || notebook.content || '',
                createdAt: notebook.CreatedAt || notebook.createdAt || new Date().toISOString(),
                updatedAt: notebook.UpdatedAt || notebook.updatedAt || new Date().toISOString(),
                order: notebook.Order !== undefined ? notebook.Order : 
                       notebook.order !== undefined ? notebook.order : index
              }));
              
              // Sort by order
              const sortedNotebooks = notebooksWithOrder.sort((a, b) => (a.order || 0) - (b.order || 0));
              setNotebooks(sortedNotebooks);
            } else {
              console.error("API returned non-array data:", notebookData);
              setApiError("Invalid data format received from server.");
              setNotebooks([]);
            }
          } catch (apiError) {
            console.error("Error fetching notebooks from API:", apiError);
            setApiError("Failed to load notebooks. Please try again later.");
            
            // Fallback to localStorage if API fails
            const savedNotebooks = localStorage.getItem('notebooks');
            if (savedNotebooks) {
              setNotebooks(JSON.parse(savedNotebooks));
            } else {
              setNotebooks([]);
            }
          }
        } else {
          // If no authenticated user, redirect to login
          navigate('/');
          return;
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setApiError("Error loading your data. Please try logging in again.");
        setNotebooks([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Load data
    loadData();
  }, [navigate]);

  // Save notebooks to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && notebooks.length > 0) {
      localStorage.setItem('notebooks', JSON.stringify(notebooks));
    }
  }, [notebooks, isLoading]);

  const addNotebook = async () => {
    if (newTitle.trim() !== "") {
      setIsLoading(true);
      setApiError(null);
      
      try {
        // Create the new notebook via API
        const notebookData = {
          title: newTitle.trim(),
          content: ''
        };
        
        // Call the API to create the notebook
        const createdNotebook = await notebookService.createNotebook(notebookData);
        
        // Format the response to match our state format
        const newNotebook = {
          id: createdNotebook.NotebookId || createdNotebook.notebookId,
          title: createdNotebook.Title || createdNotebook.title,
          content: createdNotebook.Content || createdNotebook.content || '',
          createdAt: createdNotebook.CreatedAt || createdNotebook.createdAt,
          updatedAt: createdNotebook.UpdatedAt || createdNotebook.updatedAt,
          order: notebooks.length // Set order to be at the end
        };
        
        // Update the state with the new notebook
        const updatedNotebooks = [...notebooks, newNotebook];
        setNotebooks(updatedNotebooks);
        
        // Also update localStorage as backup
        localStorage.setItem('notebooks', JSON.stringify(updatedNotebooks));
        
        // Reset form and close modal
        setNewTitle("");
        setShowModal(false);
        
        // Refresh notebooks from server after a short delay to ensure data consistency
        setTimeout(() => {
          refreshNotebooks();
        }, 1000);
      } catch (error) {
        console.error("Error creating notebook:", error);
        setApiError("Failed to create notebook. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updateNotebook = async () => {
    if (newTitle.trim() !== "" && selectedNotebook) {
      setIsLoading(true);
      setApiError(null);
      
      try {
        // Prepare update data
        const updateData = {
          Title: newTitle.trim()
        };
        
        // Call API to update the notebook
        await notebookService.updateNotebook(selectedNotebook.id, updateData);
        
        // Update local state
        const updatedNotebooks = notebooks.map(notebook => {
          if (notebook.id === selectedNotebook.id) {
            return {
              ...notebook,
              title: newTitle.trim(),
              updatedAt: new Date().toISOString()
            };
          }
          return notebook;
        });
        
        setNotebooks(updatedNotebooks);
        
        // Update localStorage as backup
        localStorage.setItem('notebooks', JSON.stringify(updatedNotebooks));
        
        // Reset and close modal
        setNewTitle("");
        setSelectedNotebook(null);
        setShowModal(false);
      } catch (error) {
        console.error("Error updating notebook:", error);
        setApiError("Failed to update notebook. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deleteNotebook = async () => {
    if (selectedNotebook) {
      setIsLoading(true);
      setApiError(null);
      
      try {
        // Call API to delete the notebook
        await notebookService.deleteNotebook(selectedNotebook.id);
        
        // Update local state
        const updatedNotebooks = notebooks.filter(
          notebook => notebook.id !== selectedNotebook.id
        );
        
        // Update the order of remaining notebooks
        const reorderedNotebooks = updatedNotebooks.map((notebook, index) => ({
          ...notebook,
          order: index
        }));
        
        setNotebooks(reorderedNotebooks);
        
        // Update localStorage as backup
        localStorage.setItem('notebooks', JSON.stringify(reorderedNotebooks));
        
        // Reset and close modal
        setSelectedNotebook(null);
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting notebook:", error);
        setApiError("Failed to delete notebook. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setNewTitle("");
    setSelectedNotebook(null);
    setShowModal(true);
  };

  const openEditModal = (e, notebook) => {
    e.stopPropagation(); // Prevent card click
    setModalMode('edit');
    setNewTitle(notebook.title);
    setSelectedNotebook(notebook);
    setShowModal(true);
  };

  const openDeleteModal = (e, notebook) => {
    e.stopPropagation(); // Prevent card click
    setModalMode('delete');
    setSelectedNotebook(notebook);
    setShowModal(true);
  };

  const handleDragStart = (e, notebook) => {
    e.stopPropagation(); // Prevent card click
    setIsDragging(true);
    setDraggedNotebook(notebook);
  };

  const handleDragOver = (e, overNotebook) => {
    e.preventDefault();

    if (!draggedNotebook || draggedNotebook.id === overNotebook.id) {
      return;
    }

    // Reorder the notebooks
    const updatedNotebooks = [...notebooks];
    const draggedIndex = notebooks.findIndex(n => n.id === draggedNotebook.id);
    const overIndex = notebooks.findIndex(n => n.id === overNotebook.id);

    if (draggedIndex === -1 || overIndex === -1) return;

    // Remove the dragged notebook
    const [movedNotebook] = updatedNotebooks.splice(draggedIndex, 1);
    
    // Insert it at the new position
    updatedNotebooks.splice(overIndex, 0, movedNotebook);

    // Update the order of all notebooks
    const reorderedNotebooks = updatedNotebooks.map((notebook, index) => ({
      ...notebook,
      order: index
    }));

    setNotebooks(reorderedNotebooks);
  };

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedNotebook(null);
      
      // Save the new order to localStorage
      localStorage.setItem('notebooks', JSON.stringify(notebooks));
    }
  };

  const filteredNotebooks = notebooks.filter(notebook => 
    notebook && notebook.title && typeof notebook.title === 'string' && 
    notebook.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleCardClick = (notebook) => {
    navigate(`/notebook/${encodeURIComponent(notebook.id)}`);
  };

  // Get user's name or default to "User"
  const userName = userData?.name || "User";

  return (
    <div style={styles.container}>
      <Sidebar />

      <main style={styles.main}>
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading your notebooks...</p>
          </div>
        ) : (
          <>
            <header style={styles.header}>
              <h1>Welcome back, {userName} 👋</h1>
            </header>

            <section style={styles.content}>
              <div style={styles.contentHeader}>
                <div style={styles.contentHeaderLeft}>
                  <h2>Your Notebooks</h2>
                  <div style={styles.searchContainer}>
                    <input
                      type="text"
                      placeholder="Search notebooks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={styles.searchInput}
                    />
                    {searchQuery && (
                      <button
                        style={styles.clearButton}
                        onClick={() => setSearchQuery("")}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                <div style={styles.contentHeaderRight}>
                  <button
                    style={styles.refreshButton}
                    onClick={refreshNotebooks}
                    disabled={isLoading}
                  >
                    {isLoading ? '↻ Refreshing...' : '↻ Refresh'}
                  </button>
                  <button
                    style={styles.createButton}
                    onClick={openCreateModal}
                  >
                    ＋ New Notebook
                  </button>
                </div>
              </div>

              {filteredNotebooks.length > 0 ? (
                <div style={styles.notebooks}>
                  {filteredNotebooks.map((notebook) => (
                    <div 
                      key={notebook.id}
                      style={{
                        ...styles.notebookWrapper,
                        opacity: isDragging && draggedNotebook?.id === notebook.id ? 0.5 : 1
                      }}
                      onMouseEnter={() => setHoveredCardId(notebook.id)}
                      onMouseLeave={() => setHoveredCardId(null)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, notebook)}
                      onDragOver={(e) => handleDragOver(e, notebook)}
                      onDragEnd={handleDragEnd}
                    >
                      {/* This div wraps the card to allow clicking */}
                      <div 
                        onClick={() => handleCardClick(notebook)}
                        style={styles.cardContainer}
                      >
                        <NotebookCard 
                          id={notebook.id} 
                          title={notebook.title} 
                        />
                      </div>
                      
                      {/* Action buttons displayed on hover */}
                      {hoveredCardId === notebook.id && (
                        <div style={styles.notebookActions}>
                          <button 
                            style={styles.editButton}
                            onClick={(e) => openEditModal(e, notebook)}
                            title="Edit notebook"
                          >
                            ✏️
                          </button>
                          <button 
                            style={styles.deleteButton}
                            onClick={(e) => openDeleteModal(e, notebook)}
                            title="Delete notebook"
                          >
                            🗑️
                          </button>
                          <div 
                            style={styles.dragHandle}
                            title="Drag to reorder"
                          >
                            ⋮⋮
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  {searchQuery ? (
                    <>
                      <p style={styles.emptyStateText}>
                        No notebooks match your search criteria
                      </p>
                      <button
                        style={styles.clearSearchButton}
                        onClick={() => setSearchQuery("")}
                      >
                        Clear Search
                      </button>
                    </>
                  ) : (
                    <>
                      <p style={styles.emptyStateText}>
                        You don't have any notebooks yet
                      </p>
                      <button
                        style={styles.createEmptyButton}
                        onClick={openCreateModal}
                      >
                        Create Your First Notebook
                      </button>
                    </>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            {apiError && (
              <div style={styles.apiError}>
                {apiError}
              </div>
            )}
            
            {modalMode === 'create' && (
              <>
                <h3 style={styles.modalTitle}>Create New Notebook</h3>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Notebook name"
                  style={styles.input}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addNotebook();
                    }
                  }}
                />
                <div style={styles.modalButtons}>
                  <button 
                    onClick={addNotebook} 
                    style={styles.modalCreate}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    style={styles.modalCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            
            {modalMode === 'edit' && (
              <>
                <h3 style={styles.modalTitle}>Edit Notebook</h3>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Notebook name"
                  style={styles.input}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      updateNotebook();
                    }
                  }}
                />
                <div style={styles.modalButtons}>
                  <button 
                    onClick={updateNotebook} 
                    style={styles.modalCreate}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    style={styles.modalCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            
            {modalMode === 'delete' && selectedNotebook && (
              <>
                <h3 style={styles.modalTitle}>Delete Notebook</h3>
                <p style={styles.deleteConfirmText}>
                  Are you sure you want to delete "{selectedNotebook.title}"? This action cannot be undone.
                </p>
                <div style={styles.modalButtons}>
                  <button 
                    onClick={deleteNotebook} 
                    style={styles.modalDelete}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    style={styles.modalCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: "flex", height: "100vh", fontFamily: "sans-serif" },
  main: {
    flexGrow: 1,
    background: '#f9fafb',
    padding: '2rem',
    overflowY: 'auto'
  },
  header: {
    marginBottom: '2rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '1rem'
  },
  content: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  contentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  contentHeaderLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  contentHeaderRight: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  },
  searchContainer: {
    position: "relative",
    width: "300px",
  },
  searchInput: {
    padding: "0.5rem 0.75rem",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    width: "100%",
    fontSize: "0.95rem",
  },
  clearButton: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
    color: "#9ca3af",
  },
  refreshButton: {
    padding: "0.5rem 0.75rem",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    transition: "background-color 0.2s ease",
  },
  createButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#1f78ff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  notebooks: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1.5rem",
  },
  notebookWrapper: {
    position: "relative",
    transition: "transform 0.2s ease",
    cursor: "grab",
  },
  cardContainer: {
    cursor: 'pointer',
  },
  notebookActions: {
    position: "absolute",
    top: "10px",
    right: "10px",
    display: "flex",
    gap: "8px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "4px",
    padding: "4px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    zIndex: 10,
  },
  editButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    fontSize: "14px",
    borderRadius: "4px",
    transition: "background-color 0.2s ease",
  },
  deleteButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    fontSize: "14px",
    borderRadius: "4px",
    transition: "background-color 0.2s ease",
  },
  dragHandle: {
    cursor: "grab",
    padding: "4px",
    fontSize: "14px",
    userSelect: "none",
  },
  emptyState: {
    padding: "3rem 0",
    textAlign: "center",
    color: "#6b7280",
  },
  emptyStateText: {
    fontSize: "1.1rem",
    marginBottom: "1rem",
  },
  clearSearchButton: {
    background: "none",
    border: "1px solid #d1d5db",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#4b5563",
  },
  createEmptyButton: {
    backgroundColor: "#1f78ff",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    width: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  modalTitle: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "600",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  modalButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
  },
  modalCreate: {
    backgroundColor: "#1f78ff",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
  modalDelete: {
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
  modalCancel: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deleteConfirmText: {
    margin: 0,
    color: "#4b5563",
    lineHeight: "1.5",
  },
  apiError: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.95rem',
    textAlign: 'center'
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#6b7280",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #f3f4f6",
    borderRadius: "50%",
    borderTop: "3px solid #1f78ff",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },
};