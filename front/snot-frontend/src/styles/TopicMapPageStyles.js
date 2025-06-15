export const styles = {
    container: {
        display: 'flex',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5'
    },

    // Sidebar styles
    sidebar: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e0e0e0',
        transition: 'width 0.3s ease',
        overflow: 'hidden'
    },

    sidebarHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        borderBottom: '1px solid #e0e0e0'
    },

    sidebarTitle: {
        margin: 0,
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#333'
    },

    sidebarToggle: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem',
        fontSize: '1.25rem',
        color: '#666',
        '&:hover': {
            color: '#333'
        }
    },

    // Main content styles
    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '1rem'
    },

    // Search styles
    searchContainer: {
        padding: '1rem',
        borderBottom: '1px solid #e0e0e0'
    },

    searchInput: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        fontSize: '0.875rem',
        '&:focus': {
            outline: 'none',
            borderColor: '#2196f3'
        }
    },

    // Stats styles
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.5rem',
        padding: '1rem',
        borderBottom: '1px solid #e0e0e0'
    },

    statCard: {
        backgroundColor: '#f8f9fa',
        padding: '0.75rem',
        borderRadius: '4px',
        textAlign: 'center'
    },

    statValue: {
        margin: 0,
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#2196f3'
    },

    statLabel: {
        margin: '0.25rem 0 0',
        fontSize: '0.75rem',
        color: '#666'
    },

    // Filters styles
    filtersContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: '1rem'
    },

    filtersTitle: {
        margin: '0 0 1rem',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#333'
    },

    filterSection: {
        marginBottom: '1.5rem'
    },

    filterLabel: {
        margin: '0 0 0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#666'
    },

    categoriesList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    },

    categoryItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        color: '#333',
        cursor: 'pointer'
    },

    slider: {
        width: '100%',
        margin: '0.5rem 0'
    },

    sliderValue: {
        fontSize: '0.75rem',
        color: '#666'
    },

    select: {
        width: '100%',
        padding: '0.5rem',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        fontSize: '0.875rem',
        backgroundColor: '#fff'
    },

    // Advanced filters styles
    advancedToggle: {
        width: '100%',
        padding: '0.5rem',
        margin: '1rem 0',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        color: '#666',
        '&:hover': {
            backgroundColor: '#e9ecef'
        }
    },

    advancedFilters: {
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
    },

    checkboxItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.5rem',
        fontSize: '0.875rem',
        color: '#333'
    },

    numberInput: {
        width: '100%',
        padding: '0.5rem',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        fontSize: '0.875rem'
    },

    // Action buttons styles
    actionButtons: {
        display: 'flex',
        gap: '0.5rem',
        padding: '1rem',
        borderTop: '1px solid #e0e0e0'
    },

    actionButton: {
        flex: 1,
        padding: '0.75rem',
        backgroundColor: '#2196f3',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: '500',
        '&:hover': {
            backgroundColor: '#1976d2'
        }
    },

    // Visualization styles
    visualizationWrapper: {
        flex: 1,
        minHeight: 0,
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
    },

    // Network insights styles
    networkInsights: {
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },

    insightsTitle: {
        margin: '0 0 1rem',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#333'
    },

    insightsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem'
    },

    insightCard: {
        backgroundColor: '#f8f9fa',
        padding: '1rem',
        borderRadius: '4px'
    },

    insightLabel: {
        margin: '0 0 0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#666'
    },

    insightList: {
        margin: 0,
        padding: 0,
        listStyle: 'none'
    },

    insightItem: {
        fontSize: '0.875rem',
        color: '#333',
        marginBottom: '0.25rem'
    },

    // Loading styles
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
    },

    loadingSpinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #2196f3',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },

    loadingText: {
        marginTop: '1rem',
        fontSize: '1rem',
        color: '#666'
    },

    // Error styles
    errorContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '2rem'
    },

    errorTitle: {
        margin: '0 0 1rem',
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#d32f2f'
    },

    errorMessage: {
        margin: '0 0 1.5rem',
        fontSize: '1rem',
        color: '#666',
        textAlign: 'center'
    },

    retryButton: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#2196f3',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '500',
        '&:hover': {
            backgroundColor: '#1976d2'
        }
    }
}; 