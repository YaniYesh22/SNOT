import { useState, useCallback, useMemo } from 'react';
import ConnectionsService from '../services/ConnectionsService';

/**
 * Custom hook to manage fetching and state for connections data.
 * @param {object} initialFilters - Initial filter values.
 * @returns {object} { connectionsData, isLoading, error, hasRealData, loadConnectionsData }
 */
export const useConnectionsData = (initialFilters) => {
  const [connectionsData, setConnectionsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasRealData, setHasRealData] = useState(false);

  const connectionsService = useMemo(() => new ConnectionsService(), []);

  const loadConnectionsData = useCallback(async (filters) => {
    try {
      setIsLoading(true);
      setError(null);

      const options = {
        minSimilarity: filters.minSimilarity,
        timeRange: filters.timeRange,
        maxConnections: filters.maxConnections,
        connectionTypes: filters.connectionTypes,
        includeSmartClusters: filters.includeSmartClusters,
        includeNetworkIntelligence: filters.includeNetworkIntelligence,
        // Note: searchTerm and categoryFilter/selectedCategories are applied client-side
        // by TopicMapVisualization's processDataForVisualization, so not passed to service here.
        // If service supported them, they would be passed.
      };

      const data = await connectionsService.getConnections(options);
      setConnectionsData(data);
      setHasRealData(!data.isDemoData); // Assuming isDemoData is a boolean property
    } catch (err) {
      console.error('Error loading connections in useConnectionsData hook:', err);
      setError(err.message || 'Failed to load connections');
      setConnectionsData(connectionsService.getFallbackData()); // Use fallback data from service
      setHasRealData(false);
    } finally {
      setIsLoading(false);
    }
  }, [connectionsService]); // connectionsService is memoized and stable

  return {
    connectionsData,
    isLoading,
    error,
    hasRealData,
    loadConnectionsData,
  };
};