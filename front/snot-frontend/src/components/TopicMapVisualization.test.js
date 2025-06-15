import React from 'react';
import { render, screen, within } from '@testing-library/react';
import TopicMapVisualization from './TopicMapVisualization';

// Mock D3 to prevent actual rendering in tests and to spy on methods if needed
// For basic rendering tests, we might not need complex D3 mocks yet.
// If we were to test D3 interactions, more elaborate mocking would be required.
jest.mock('d3', () => {
  const originalD3 = jest.requireActual('d3');
  return {
    ...originalD3,
    select: jest.fn().mockReturnValue({
      selectAll: jest.fn().mockReturnThis(),
      remove: jest.fn().mockReturnThis(),
      attr: jest.fn().mockReturnThis(),
      style: jest.fn().mockReturnThis(),
      append: jest.fn().mockReturnThis(),
      call: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      enter: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(), // Mock the text method
      classed: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(), // For nested selections like g.select(function(){...})
    }),
    forceSimulation: jest.fn().mockReturnValue({
      force: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      alphaTarget: jest.fn().mockReturnThis(),
      restart: jest.fn().mockReturnThis(),
      stop: jest.fn().mockReturnThis(),
    }),
    forceLink: jest.fn().mockReturnValue({
      id: jest.fn().mockReturnThis(),
      distance: jest.fn().mockReturnThis(),
      strength: jest.fn().mockReturnThis(),
    }),
    forceManyBody: jest.fn().mockReturnThis(),
    forceCenter: jest.fn().mockReturnThis(),
    forceCollide: jest.fn().mockReturnThis(),
    scaleOrdinal: jest.fn().mockReturnValue(jest.fn(value => value)), // Mock scale returns the value itself
    zoom: jest.fn().mockReturnValue({
        scaleExtent: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        transform: jest.fn().mockReturnThis(),
    }),
    zoomIdentity: { k: 1, x: 0, y: 0 }, // Mock d3.zoomIdentity
    drag: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis(),
    }),
  };
});


const mockConnectionsData = {
  notebooks: [
    { notebookId: '1', title: 'Notebook Alpha', tags: ['React', 'JS'], wordCount: 100, preview: 'Alpha preview' },
    { notebookId: '2', title: 'Notebook Beta', tags: ['D3', 'JS'], wordCount: 200, preview: 'Beta preview' },
  ],
  connections: [
    { source: '1', target: '2', strength: 0.8, type: 'smart_similarity', strengthCategory: 'strong' },
  ],
  isDemoData: false,
};

const emptyConnectionsData = {
  notebooks: [],
  connections: [],
  isDemoData: false,
};

describe('TopicMapVisualization', () => {
  let originalResizeObserver;

  beforeAll(() => {
    // Mock ResizeObserver for JSOM environments
    originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterAll(() => {
    window.ResizeObserver = originalResizeObserver;
  });

  beforeEach(() => {
    // Clear all D3 mocks before each test
    jest.clearAllMocks();
  });

  test('renders an SVG element when provided with data', () => {
    render(<TopicMapVisualization connectionsData={mockConnectionsData} />);
    const svgElement = screen.getByTestId('visualization-svg'); // Assuming you add data-testid to SVG
    expect(svgElement).toBeInTheDocument();
  });

  test('displays "No notebooks found" message when processed nodes are empty', () => {
     // Mock processDataForVisualization to return empty nodes/links
     // This is tricky because processDataForVisualization is internal and memoized.
     // A better way would be to pass data that RESULTS in empty nodes.
    render(<TopicMapVisualization connectionsData={emptyConnectionsData} />);
    expect(screen.getByText("No notebooks found matching your criteria")).toBeInTheDocument();
  });

  test('renders nodes and links (approximate check)', () => {
    // This test is more of an integration test for the D3 rendering logic.
    // We are checking if D3's append for circle (nodes) and line (links) is called.
    // This doesn't confirm visual output but that the rendering logic is invoked.

    const mockSvgSelect = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    d3.select.mockImplementation((selector) => {
      if (selector instanceof SVGSVGElement) { // or check by ref
        return mockSvgSelect;
      }
      return originalD3.select(selector); // Fallback for other selections if any
    });

    render(
      <TopicMapVisualization connectionsData={mockConnectionsData} />
    );

    // Check if D3's selection and append for nodes ('circle') and links ('line') were called.
    // This relies on the internal structure of how drawNodes and drawLinks use D3.
    // We expect .append("circle") for nodes and .append("line") for links.
    expect(mockSvgSelect.append).toHaveBeenCalledWith('circle'); // From drawNodes
    expect(mockSvgSelect.append).toHaveBeenCalledWith('line');   // From drawLinks
  });

  test('renders controls (Reset View, Play/Pause)', () => {
    render(<TopicMapVisualization connectionsData={mockConnectionsData} />);
    expect(screen.getByText("Reset View")).toBeInTheDocument();
    // The Play/Pause button text changes, so check for one of its states or a more generic selector
    expect(screen.getByText(/Play|Pause/i)).toBeInTheDocument();
  });

  test('renders data source indicator', () => {
    render(<TopicMapVisualization connectionsData={mockConnectionsData} hasRealData={true} />);
    expect(screen.getByText(/Smart Analysis:/i)).toBeInTheDocument();
  });

  test('renders demo data indicator when isDemoData is true in connectionsData', () => {
    const demoData = { ...generateEnhancedSampleData(), isDemoData: true }; // generateEnhancedSampleData is not in scope here
                                                                          // We'll simulate it
    const sampleDemoData = {
        notebooks: [{ notebookId: 'd1', title: 'Demo Note', tags:['demo'], wordCount: 100 }],
        connections: [],
        isDemoData: true,
    };
    render(<TopicMapVisualization connectionsData={sampleDemoData} />);
    expect(screen.getByText(/Demo Data - Enhanced Smart Mapping/i)).toBeInTheDocument();
  });

});

// Helper to add data-testid to the SVG element for easier selection in tests
// This requires modifying the original component slightly, or using a more complex selector.
// For this example, I'll assume we can add it or select it effectively.
// Modify TopicMapVisualization.jsx: <svg ref={svgRef} className={styles.svg} data-testid="visualization-svg"></svg>

// A simplified version of generateEnhancedSampleData for testing the demo indicator
function generateEnhancedSampleData() {
    return {
        notebooks: [{ notebookId: 's1', title: 'Sample', tags: ['sample'], wordCount: 50 }],
        connections: [],
        isDemoData: true, // Important for the demo indicator test
        networkIntelligence: {},
        smartClusters: []
    };
}
