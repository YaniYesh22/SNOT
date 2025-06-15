import { renderHook, act } from '@testing-library/react';
import { useConnectionsData } from './useConnectionsData';
import ConnectionsService from '../services/ConnectionsService';

// Mock the ConnectionsService
jest.mock('../services/ConnectionsService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getConnections: jest.fn(),
    getFallbackData: jest.fn(() => ({
        notebooks: [],
        connections: [],
        isDemoData: true,
        stats: { averageSimilarity: 0 },
        smartClusters: [],
        networkIntelligence: {}
    }))
  })),
}));

const mockInitialFilters = {
  minSimilarity: 0.1,
  timeRange: 'all',
  maxConnections: 50,
  connectionTypes: ['smart_similarity'],
  includeSmartClusters: false,
  includeNetworkIntelligence: false,
};

describe('useConnectionsData', () => {
  let mockConnectionsServiceInstance;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    ConnectionsService.mockClear();
    // Get the instance of the mocked service
    // ConnectionsService.mock.instances will have one item after the hook is rendered for the first time.
    // To ensure we get it even if the hook hasn't run, we can check length or rely on tests running sequentially.
    // For simplicity in this setup, we'll assume it's created when the hook runs.
    // A more robust way might be to grab it after initial render if needed for pre-render setup.
  });

  test('should return initial state correctly', () => {
    const { result } = renderHook(() => useConnectionsData(mockInitialFilters));

    expect(result.current.connectionsData).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.hasRealData).toBe(false);
  });

  test('should fetch and set data on successful loadConnectionsData call', async () => {
    const mockData = {
      notebooks: [{ id: '1', title: 'Test Notebook' }],
      connections: [{ source: '1', target: '1' }],
      isDemoData: false,
      stats: { averageSimilarity: 0.5 },
      smartClusters: [{name: 'Cluster 1', notebooks: ['1']}],
      networkIntelligence: { totalNodes: 1}
    };

    // Ensure the service mock instance is available and methods are mock functions
    // This relies on the hook instantiating the service.
    const { result } = renderHook(() => useConnectionsData(mockInitialFilters));
    mockConnectionsServiceInstance = ConnectionsService.mock.instances[0];
    mockConnectionsServiceInstance.getConnections.mockResolvedValue(mockData);

    await act(async () => {
      result.current.loadConnectionsData(mockInitialFilters);
    });

    // Wait for state updates, isLoading should be true initially then false
    // The hook sets isLoading to true at the start of loadConnectionsData
    // and false in the finally block.

    // We need to wait for the async operations within loadConnectionsData to complete
    // and for React to re-render the hook with the new state.
    // The `await act(...)` above handles this for the call itself.

    expect(mockConnectionsServiceInstance.getConnections).toHaveBeenCalledWith(mockInitialFilters);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.connectionsData).toEqual(mockData);
    expect(result.current.hasRealData).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test('should set error state and fallback data on failed loadConnectionsData call', async () => {
    const errorMessage = 'Network Error';
    const fallbackData = {
        notebooks: [],
        connections: [],
        isDemoData: true,
        stats: { averageSimilarity: 0 },
        smartClusters: [],
        networkIntelligence: {}
    };

    const { result } = renderHook(() => useConnectionsData(mockInitialFilters));
    mockConnectionsServiceInstance = ConnectionsService.mock.instances[0];
    mockConnectionsServiceInstance.getConnections.mockRejectedValue(new Error(errorMessage));
    mockConnectionsServiceInstance.getFallbackData.mockReturnValue(fallbackData);


    await act(async () => {
      result.current.loadConnectionsData(mockInitialFilters);
    });

    expect(mockConnectionsServiceInstance.getConnections).toHaveBeenCalledWith(mockInitialFilters);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.connectionsData).toEqual(fallbackData);
    expect(result.current.hasRealData).toBe(false);
  });

  test('loadConnectionsData should be callable and use provided filters', async () => {
    const { result } = renderHook(() => useConnectionsData(mockInitialFilters));
    mockConnectionsServiceInstance = ConnectionsService.mock.instances[0];
    mockConnectionsServiceInstance.getConnections.mockResolvedValue({ notebooks: [], connections: [], isDemoData: true });

    const newFilters = { ...mockInitialFilters, minSimilarity: 0.5 };
    await act(async () => {
      result.current.loadConnectionsData(newFilters);
    });

    expect(mockConnectionsServiceInstance.getConnections).toHaveBeenCalledWith(newFilters);
  });
});
