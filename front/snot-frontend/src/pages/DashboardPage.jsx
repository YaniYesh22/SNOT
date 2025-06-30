import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import NotebookCard from "../components/NotebookCard";
import Sidebar from "../components/Sidebar";
import CreateNotebookModal from "../components/CreateNotebookModal"; // Import the new modal
import authService from "../services/AuthService";
import notebookService from "../services/NotebookService";

// In DashboardPage.jsx
const getNotebookTags = (notebook) => {
  // First check if notebook.tags exists
  if (notebook.tags && Array.isArray(notebook.tags) && notebook.tags.length > 0) {
    return notebook.tags;
  }
  
  // Then check if notebook.Tags exists (capital T)
  if (notebook.Tags) {
    return Array.isArray(notebook.Tags) ? notebook.Tags : [notebook.Tags];
  }
  
  // Default fallback
  return ['Uncategorized'];
};

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
          // Using the helper function for consistent tag handling
          tags: getNotebookTags(notebook),
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
          // Using the helper function for consistent tag handling
          tags: getNotebookTags(notebook),
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
      console.log("After refresh, notebooks:", notebooks);
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
                // Using the helper function for consistent tag handling
                tags: getNotebookTags(notebook),
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

  // Handle notebook creation from the CreateNotebookModal
  const handleNotebookCreated = (newNotebook) => {
  console.log("Notebook created with data:", newNotebook);
  console.log("Created notebook with tags:", newNotebook.tags); // Add this for debugging
  
  // Format the notebook to match our state format
  const formattedNotebook = {
    id: newNotebook.id,
    title: newNotebook.title,
    content: newNotebook.content || '',
    createdAt: newNotebook.createdAt,
    updatedAt: newNotebook.updatedAt,
    tags: newNotebook.tags && newNotebook.tags.length > 0 ? newNotebook.tags : ['Uncategorized'],
    order: notebooks.length // Set order to be at the end
  };
  
  // Update the state with the new notebook
  const updatedNotebooks = [...notebooks, formattedNotebook];
  setNotebooks(updatedNotebooks);
  
  // Also update localStorage as backup
  localStorage.setItem('notebooks', JSON.stringify(updatedNotebooks));
  
  // Refresh notebooks from server after a short delay to ensure data consistency
  setTimeout(() => {
    refreshNotebooks();
  }, 1000);
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

  // In DashboardPage.jsx - when a user clicks a notebook
const handleCardClick = (notebook) => {
  // Pass the notebook ID via state instead of as a URL parameter
  console.log("Navigating to notebook with ID:", notebook);
  navigate(`/notebook/:id`, {
    state: { 
      notebookId: notebook.id || notebook.notebookId,
      // You can even pass the entire notebook object if needed
      notebookData: notebook
    }
  });
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
            <p style={styles.loadingText}>Loading your notebooks...</p>
          </div>
        ) : (
          <>
            <header style={styles.header}>
              <div style={styles.welcomeSection}>
                <h1 style={styles.welcomeTitle}>
                  Welcome back, {userName} 
                  <span style={styles.waveEmoji}>👋</span>
                </h1>
                <p style={styles.welcomeSubtitle}>Ready to Learn?</p>
              </div>
            </header>

            <section style={styles.content}>
              <div style={styles.contentHeader}>
                <div style={styles.contentHeaderLeft}>
                  <div style={styles.notebooksHeaderSection}>
                    <h2 style={styles.notebooksTitle}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={styles.notebooksTitleIcon}>
                        <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z"/>
                      </svg>
                      Your Notebooks
                    </h2>
                    <span style={styles.notebooksCount}>
                      {filteredNotebooks.length} {filteredNotebooks.length === 1 ? 'notebook' : 'notebooks'}
                    </span>
                  </div>
                  <div style={styles.searchContainer}>
                    <div style={styles.searchInputWrapper}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={styles.searchIcon}>
                        <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                      </svg>
                      <input
                        type="text"
                        placeholder="Search notebooks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchInput}
                      />
                    </div>
                    {searchQuery && (
                      <button
                        style={styles.clearButton}
                        onClick={() => setSearchQuery("")}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                        </svg>
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.refreshIcon}>
                      <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                    </svg>
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    style={styles.createButton}
                    onClick={openCreateModal}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.createIcon}>
                      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                    </svg>
                    New Notebook
                  </button>
                </div>
              </div>

              {apiError && (
                <div style={styles.errorAlert}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={styles.errorIcon}>
                    <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                  </svg>
                  {apiError}
                </div>
              )}

              {filteredNotebooks.length > 0 ? (
                <div style={styles.notebooks}>
                  {filteredNotebooks.map((notebook) => (
                    <div
                      key={notebook.id}
                      style={{
                        ...styles.notebookWrapper,
                        opacity: isDragging && draggedNotebook?.id === notebook.id ? 0.5 : 1,
                        transform: isDragging && draggedNotebook?.id === notebook.id ? 'scale(0.95)' : 'scale(1)'
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
                          tags={notebook.tags}
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                            </svg>
                          </button>
                          <button
                            style={styles.deleteButton}
                            onClick={(e) => openDeleteModal(e, notebook)}
                            title="Delete notebook"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                            </svg>
                          </button>
                          <div
                            style={styles.dragHandle}
                            title="Drag to reorder"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7,19V17H9V19H7M11,19V17H13V19H11M15,19V17H17V19H15M7,15V13H9V15H7M11,15V13H13V15H11M15,15V13H17V15H15M7,11V9H9V11H7M11,11V9H13V11H11M15,11V9H17V11H15M7,7V5H9V7H7M11,7V5H13V7H11M15,7V5H17V7H15Z"/>
                            </svg>
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
                      <div style={styles.emptyStateIcon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                        </svg>
                      </div>
                      <h3 style={styles.emptyStateTitle}>No notebooks match your search</h3>
                      <p style={styles.emptyStateText}>
                        Try adjusting your search terms or browse all notebooks
                      </p>
                      <button
                        style={styles.clearSearchButton}
                        onClick={() => setSearchQuery("")}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.buttonIcon}>
                          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                        </svg>
                        Clear Search
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={styles.emptyStateIcon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z"/>
                        </svg>
                      </div>
                      <h3 style={styles.emptyStateTitle}>Start your knowledge journey</h3>
                      <p style={styles.emptyStateText}>
                        Create your first notebook and begin capturing your ideas, thoughts, and discoveries
                      </p>
                      <button
                        style={styles.createEmptyButton}
                        onClick={openCreateModal}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.buttonIcon}>
                          <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                        </svg>
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

      {/* Create Notebook Modal */}
      {showModal && modalMode === 'create' && (
        <CreateNotebookModal
          onClose={() => setShowModal(false)}
          onNotebookCreated={handleNotebookCreated}
        />
      )}

      {/* Edit Modal */}
      {showModal && modalMode === 'edit' && selectedNotebook && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            {apiError && (
              <div style={styles.apiError}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={styles.errorIcon}>
                  <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
                {apiError}
              </div>
            )}

            <h3 style={styles.modalTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={styles.modalTitleIcon}>
                <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
              </svg>
              Edit Notebook
            </h3>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Notebook name"
              style={styles.modalInput}
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
                style={styles.modalUpdate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div style={styles.buttonSpinner}></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.buttonIcon}>
                      <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                    </svg>
                    Update
                  </>
                )}
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={styles.modalCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showModal && modalMode === 'delete' && selectedNotebook && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            {apiError && (
              <div style={styles.apiError}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={styles.errorIcon}>
                  <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
                {apiError}
              </div>
            )}

            <h3 style={styles.modalTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={styles.modalTitleIcon}>
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
              </svg>
              Delete Notebook
            </h3>
            <div style={styles.deleteWarning}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={styles.warningIcon}>
                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              <div>
                <p style={styles.deleteConfirmText}>
                  Are you sure you want to delete <strong>"{selectedNotebook.title}"</strong>?
                </p>
                <p style={styles.deleteSubtext}>
                  This action cannot be undone and all content will be permanently lost.
                </p>
              </div>
            </div>
            <div style={styles.modalButtons}>
              <button
                onClick={deleteNotebook}
                style={styles.modalDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div style={styles.buttonSpinner}></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.buttonIcon}>
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                    Delete
                  </>
                )}
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={styles.modalCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { 
    display: "flex", 
    height: "100vh", 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  main: {
    flexGrow: 1,
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '2rem',
    overflowY: 'auto'
  },
  header: {
    marginBottom: '2rem',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  welcomeSection: {
    textAlign: 'center'
  },
  welcomeTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    margin: '0 0 0.5rem 0',
    background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  waveEmoji: {
    fontSize: '2rem',
    background: 'none',
    WebkitTextFillColor: 'initial'
  },
  welcomeSubtitle: {
    fontSize: '1.1rem',
    color: '#64748b',
    margin: 0,
    fontWeight: '500'
  },
  content: {
    background: 'white',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxWidth: '1200px',
    margin: '0 auto',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  contentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    gap: "2rem"
  },
  contentHeaderLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    flex: 1
  },
  notebooksHeaderSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem"
  },
  notebooksTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    margin: 0,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  notebooksTitleIcon: {
    color: '#3b82f6'
  },
  notebooksCount: {
    background: 'linear-gradient(135deg,rgb(95, 143, 221) 0%,rgb(83, 127, 247) 100%)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  contentHeaderRight: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    flexShrink: 0
  },
  searchContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "400px"
  },
  searchInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    color: '#94a3b8',
    zIndex: 1
  },
  searchInput: {
    padding: "0.875rem 1rem 0.875rem 2.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    width: "100%",
    fontSize: "0.95rem",
    background: 'white',
    transition: 'all 0.2s ease',
    outline: 'none',
    color: '#374151'
  },
  clearButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    padding: '0.25rem',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  refreshButton: {
    padding: "0.875rem 1.25rem",
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.2s ease",
    fontSize: '0.95rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  },
  refreshIcon: {
    transition: 'transform 0.2s ease'
  },
  createButton: {
    padding: "0.875rem 1.5rem",
    background: 'linear-gradient(135deg,rgb(95, 143, 221) 0%,rgb(83, 127, 247) 100%)',
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  createIcon: {
    transition: 'transform 0.2s ease'
  },
  errorAlert: {
    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontWeight: '500'
  },
  errorIcon: {
    flexShrink: 0
  },
  notebooks: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1.5rem",
  },
  notebookWrapper: {
    position: "relative",
    transition: "all 0.3s ease",
    cursor: "grab"
  },
  cardContainer: {
    cursor: 'pointer',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'all 0.2s ease'
  },
  notebookActions: {
    position: "absolute",
    top: "12px",
    right: "12px",
    display: "flex",
    gap: "6px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "10px",
    padding: "6px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: 10,
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  editButton: {
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteButton: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dragHandle: {
    cursor: "grab",
    padding: "8px",
    borderRadius: "8px",
    color: '#64748b',
    transition: "all 0.2s ease",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyState: {
    padding: "4rem 2rem",
    textAlign: "center",
    color: "#64748b",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem'
  },
  emptyStateIcon: {
    color: '#94a3b8',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '2rem',
    borderRadius: '20px',
    border: '2px dashed #cbd5e1'
  },
  emptyStateTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    margin: 0,
    color: '#374151'
  },
  emptyStateText: {
    fontSize: "1rem",
    margin: 0,
    lineHeight: '1.6',
    maxWidth: '400px'
  },
  clearSearchButton: {
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    border: "1px solid #cbd5e1",
    padding: "0.875rem 1.5rem",
    borderRadius: "12px",
    cursor: "pointer",
    color: "#475569",
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease'
  },
  createEmptyButton: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: "#fff",
    border: "none",
    padding: "1rem 2rem",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: '700',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  buttonIcon: {
    transition: 'transform 0.2s ease'
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: '2rem'
  },
  modal: {
    background: "#fff",
    padding: "2.5rem",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "500px",
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  modalTitle: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "700",
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  modalTitleIcon: {
    color: '#3b82f6'
  },
  modalInput: {
    padding: "1rem 1.25rem",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "1rem",
    outline: 'none',
    transition: 'all 0.2s ease',
    background: 'white'
  },
  deleteWarning: {
    display: 'flex',
    gap: '1rem',
    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '1.5rem'
  },
  warningIcon: {
    color: '#dc2626',
    flexShrink: 0
  },
  deleteConfirmText: {
    margin: '0 0 0.5rem 0',
    color: '#374151',
    fontWeight: '500',
    lineHeight: '1.5'
  },
  deleteSubtext: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.95rem',
    lineHeight: '1.5'
  },
  modalButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
  },
  modalUpdate: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: "#fff",
    border: "none",
    padding: "0.875rem 1.5rem",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  modalDelete: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: "#fff",
    border: "none",
    padding: "0.875rem 1.5rem",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  },
  modalCancel: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    color: "#374151",
    border: "1px solid #d1d5db",
    padding: "0.875rem 1.5rem",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: '600',
    transition: 'all 0.2s ease'
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTop: '2px solid white',
    animation: 'spin 1s linear infinite'
  },
  apiError: {
    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontWeight: '500'
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: '60vh',
    color: "#64748b",
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    margin: '2rem auto',
    maxWidth: '1200px'
  },
  loadingSpinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #f1f5f9",
    borderRadius: "50%",
    borderTop: "4px solid #3b82f6",
    animation: "spin 1s linear infinite",
    marginBottom: "1.5rem",
  },
  loadingText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#475569'
  }
};