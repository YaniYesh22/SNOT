import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EnhancedTopicMapPage from './TopicMapPage';
import { useConnectionsData } from '../hooks/useConnectionsData';
import TopicMapVisualization from '../components/TopicMapVisualization';

// Mock hooks and components
jest.mock('../hooks/useConnectionsData');
jest.mock('../components/TopicMapVisualization', () => jest.fn(() => <div data-testid="topic-map-visualization">Mocked Visualization</div>));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // import and retain default behavior
  useNavigate: () => jest.fn(), // Manual mock for useNavigate
}));
jest.mock('lodash', () => ({ // Also mock lodash if its debounce is an issue in test environment
    debounce: (fn) => fn,
}));


describe('EnhancedTopicMapPage', () => {
  const mockLoadConnectionsData = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    useConnectionsData.mockReturnValue({
      connectionsData: null,
      isLoading: true,
      error: null,
      hasRealData: false,
      loadConnectionsData: mockLoadConnectionsData,
    });

    render(<EnhancedTopicMapPage />);
    expect(screen.getByText(/Loading connections.../i)).toBeInTheDocument();
    expect(mockLoadConnectionsData).toHaveBeenCalledTimes(1); // Initial load
  });

  test('renders error state', () => {
    useConnectionsData.mockReturnValue({
      connectionsData: null,
      isLoading: false,
      error: 'Failed to fetch',
      hasRealData: false,
      loadConnectionsData: mockLoadConnectionsData,
    });

    render(<EnhancedTopicMapPage />);
    expect(screen.getByText(/Error Loading Connections/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();

    // Test retry button
    fireEvent.click(screen.getByText(/Retry/i));
    expect(mockLoadConnectionsData).toHaveBeenCalledTimes(2); // Initial load + 1 retry
  });

  test('renders main layout with data', () => {
    const mockData = {
      notebooks: [{ id: '1', title: 'Notebook 1', tags: ['test'], content: 'Some content' }],
      connections: [],
      isDemoData: false,
      stats: { averageSimilarity: 0.75 },
      smartClusters: [{ name: 'Cluster A', notebooks: ['1']}],
      networkIntelligence: { totalNodes: 1 }
    };
    useConnectionsData.mockReturnValue({
      connectionsData: mockData,
      isLoading: false,
      error: null,
      hasRealData: true,
      loadConnectionsData: mockLoadConnectionsData,
    });

    render(<EnhancedTopicMapPage />);
    expect(screen.getByText(/Topic Map/i)).toBeInTheDocument(); // Sidebar title
    expect(screen.getByPlaceholderText(/Search notebooks.../i)).toBeInTheDocument(); // Search input
    expect(screen.getByTestId('topic-map-visualization')).toBeInTheDocument(); // Mocked visualization
    expect(screen.getByText(/Notebooks/i)).toBeInTheDocument(); // Quick stat label
  });

  test('sidebar toggle button works', () => {
     useConnectionsData.mockReturnValue({
      connectionsData: { notebooks: [], connections: [] }, // Minimal data
      isLoading: false, error: null, hasRealData: false, loadConnectionsData: mockLoadConnectionsData,
    });
    render(<EnhancedTopicMapPage />);

    const toggleButton = screen.getByText('←'); // Assuming this is the initial text for expanded
    expect(screen.getByText(/Topic Map/i)).toBeVisible(); // Sidebar title should be visible

    fireEvent.click(toggleButton);
    // After click, the text should change and title should ideally not be found or be handled by CSS
    // For simplicity, we'll check if the button text changes or if a specific element is no longer visible
    // This depends on how the collapsed state hides elements.
    // As an example, we'll check if the "Topic Map" title (which is only in expanded) is not visible.
    // This requires that the styles actually hide it or remove it from DOM.
    // If it's just CSS visually hidden, this test might need adjustment or a different assertion.
    // For now, let's assume the title is removed or truly hidden.
    // It's better to check for a class change or an attribute that indicates collapsed state.
    // Since the button text changes, we can check that:
    expect(screen.getByText('→')).toBeInTheDocument();
  });

   test('filter changes trigger data reload', () => {
    useConnectionsData.mockReturnValue({
      connectionsData: { notebooks: [], connections: [] },
      isLoading: false, error: null, hasRealData: true, loadConnectionsData: mockLoadConnectionsData,
    });

    render(<EnhancedTopicMapPage />);
    expect(mockLoadConnectionsData).toHaveBeenCalledTimes(1); // Initial load

    // Simulate changing min similarity
    const similaritySlider = screen.getByLabelText(/Min. Similarity/i); // Assuming label is associated
    fireEvent.change(similaritySlider, { target: { value: '0.5' } });

    // The hook's useEffect for currentFilters should trigger loadConnectionsData
    // The number of calls depends on how currentFilters memoization and useEffect are set up.
    // If currentFilters changes identity, loadConnectionsData will be called.
    // Given the setup, changing minSimilarity will change currentFilters object.
    expect(mockLoadConnectionsData).toHaveBeenCalledTimes(2);
  });

});
