import React, { useEffect, useState } from "react";

import NotebookCard from "../components/NotebookCard";
import Sidebar from "../components/Sidebar";
import authService from "../services/AuthService";
import { useNavigate } from "react-router-dom";

// Initial notebook data
const initialNotebooks = [
  { id: "AI-Course-Notes", title: "AI Course Notes", order: 0 },
  { id: "Research-Summary", title: "Research Summary", order: 1 },
  { id: "Final-Project", title: "Final Project", order: 2 },
];

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
  const navigate = useNavigate();

  // Load user data and notebooks from localStorage on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user data
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          const userData = authService.getUserData();
          setUserData(userData);
        } else {
          // If no authenticated user, redirect to login
          navigate('/');
          return;
        }
        
        // Get notebooks
        const savedNotebooks = localStorage.getItem('notebooks');
        
        if (savedNotebooks) {
          // If notebooks exist in localStorage, use them and ensure they have order properties
          const loadedNotebooks = JSON.parse(savedNotebooks);
          
          // Make sure each notebook has an order property
          const notebooksWithOrder = loadedNotebooks.map((notebook, index) => ({
            ...notebook,
            order: notebook.order !== undefined ? notebook.order : index
          }));
          
          // Sort by order
          const sortedNotebooks = notebooksWithOrder.sort((a, b) => a.order - b.order);
          setNotebooks(sortedNotebooks);
        } else {
          // Otherwise use the initial data and save it
          setNotebooks(initialNotebooks);
          localStorage.setItem('notebooks', JSON.stringify(initialNotebooks));
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setNotebooks(initialNotebooks);
      } finally {
        setIsLoading(false);
      }
    };

    // Simulate a short loading delay for better UX
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  // Save notebooks to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && notebooks.length > 0) {
      localStorage.setItem('notebooks', JSON.stringify(notebooks));
    }
  }, [notebooks, isLoading]);

  const addNotebook = () => {
    if (newTitle.trim() !== "") {
      const normalizedId = newTitle.trim().replace(/\s+/g, '-');
      // Set the new notebook's order to be at the end
      const maxOrder = notebooks.length > 0 
        ? Math.max(...notebooks.map(nb => nb.order)) + 1 
        : 0;
        
      const updatedNotebooks = [
        ...notebooks, 
        { 
          id: normalizedId, 
          title: newTitle.trim(),
          order: maxOrder
        }
      ];
      
      setNotebooks(updatedNotebooks);
      localStorage.setItem('notebooks', JSON.stringify(updatedNotebooks));
      
      setNewTitle("");
      setShowModal(false);
    }
  };

  const updateNotebook = () => {
    if (newTitle.trim() !== "" && selectedNotebook) {
      const updatedNotebooks = notebooks.map(notebook => {
        if (notebook.id === selectedNotebook.id) {
          return {
            ...notebook,
            title: newTitle.trim()
          };
        }
        return notebook;
      });
      
      setNotebooks(updatedNotebooks);
      localStorage.setItem('notebooks', JSON.stringify(updatedNotebooks));
      
      setNewTitle("");
      setSelectedNotebook(null);
      setShowModal(false);
    }
  };

  const deleteNotebook = () => {
    if (selectedNotebook) {
      const updatedNotebooks = notebooks.filter(
        notebook => notebook.id !== selectedNotebook.id
      );
      
      // Update the order of remaining notebooks
      const reorderedNotebooks = updatedNotebooks.map((notebook, index) => ({
        ...notebook,
        order: index
      }));
      
      setNotebooks(reorderedNotebooks);
      localStorage.setItem('notebooks', JSON.stringify(reorderedNotebooks));
      
      setSelectedNotebook(null);
      setShowModal(false);
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
    notebook.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.order - b.order);

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
                <button
                  style={styles.createButton}
                  onClick={openCreateModal}
                >
                  ＋ New Notebook
                </button>
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
                  <button onClick={addNotebook} style={styles.modalCreate}>
                    Create
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    style={styles.modalCancel}
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
                    if (e.key === 'Enter') {
                      updateNotebook();
                    }
                  }}
                />
                <div style={styles.modalButtons}>
                  <button onClick={updateNotebook} style={styles.modalCreate}>
                    Update
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    style={styles.modalCancel}
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
                  <button onClick={deleteNotebook} style={styles.modalDelete}>
                    Delete
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    style={styles.modalCancel}
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