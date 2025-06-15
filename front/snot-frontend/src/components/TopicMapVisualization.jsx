import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import styles from './TopicMapVisualization.module.css'; // Import CSS Module

// D3 Specific Constants (can be part of a config object if they grow)
const DEFAULT_NODE_BASE_SIZE = 25;
const DEFAULT_NODE_WORD_SIZE_FACTOR = 100;
const DEFAULT_NODE_WORD_SIZE_ADD = 5;
const DEFAULT_NODE_MAX_WORD_SIZE = 40;
const DEFAULT_NODE_CONNECTION_SIZE_FACTOR = 3;
const MIN_NODE_SIZE = 30;
const MAX_NODE_SIZE = 80;
const NODE_STROKE_WIDTH = 4;
const HUB_NODE_STROKE_WIDTH = 6;
const HUB_NODE_CONNECTION_THRESHOLD = 3; // Min connections to be considered a "hub" for styling
const LINK_BASE_DISTANCE = 80;
const LINK_STRENGTH_DISTANCE_FACTOR = 120;
const LINK_BASE_STROKE_WIDTH = 2;
const LINK_STRENGTH_STROKE_FACTOR = 6;
const LINK_EXPLICIT_STROKE_WIDTH = 4;
const LABEL_FONT_SIZE_MIN = 10;
const LABEL_FONT_SIZE_MAX = 14;
const LABEL_SIZE_DIVISOR = 4;
const LABEL_DY_OFFSET = 25; // Offset for label below the node
const ZOOM_SCALE_EXTENT = [0.1, 5];
const SIMULATION_CHARGE_BASE = -300;
const SIMULATION_CHARGE_CONNECTION_FACTOR = -50;
const SIMULATION_COLLISION_RADIUS_PADDING = 15;
const SIMULATION_COLLISION_STRENGTH = 0.9;
const SIMULATION_SAME_TAG_REPULSION = -100;


/**
 * Sets up the SVG container and main group element.
 * @param {d3.Selection} svg - The D3 selection for the SVG element.
 * @param {object} dimensions - The width and height of the SVG.
 * @param {object} margin - The margin object { top, right, bottom, left }.
 * @returns {d3.Selection} The main D3 group element (g).
 */
const setupSVG = (svg, dimensions, margin) => {
  svg.selectAll("*").remove(); // Clear previous rendering
  svg.attr("width", dimensions.width).attr("height", dimensions.height);

  // Background - can be styled via CSS module for the SVG if preferred, or keep gradient def here
  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
      .attr("id", "backgroundGradientDef") // Unique ID for the gradient definition
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "100%");
  gradient.append("stop").attr("offset", "0%").style("stop-color", "#f8fafc");
  gradient.append("stop").attr("offset", "100%").style("stop-color", "#f1f5f9");

  svg.append("rect")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .attr("fill", "url(#backgroundGradientDef)"); // Use the unique ID

  return svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
};

/**
 * Creates and configures the D3 force simulation.
 * @param {Array} nodes - Array of node objects.
 * @param {Array} links - Array of link objects.
 * @param {number} innerWidth - The width of the simulation area.
 * @param {number} innerHeight - The height of the simulation area.
 * @returns {d3.ForceSimulation} The configured D3 simulation.
 */
const createSimulation = (nodes, links, innerWidth, innerHeight) => {
  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links)
          .id(d => d.id)
          .distance(d => d.distance)
          .strength(d => Math.min(0.8, d.strength))
      )
      .force("charge", d3.forceManyBody()
          .strength(d => SIMULATION_CHARGE_BASE + (d.connectionCount * SIMULATION_CHARGE_CONNECTION_FACTOR))
      )
      .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force("collision", d3.forceCollide()
          .radius(d => d.size + SIMULATION_COLLISION_RADIUS_PADDING)
          .strength(SIMULATION_COLLISION_STRENGTH)
      );

  simulation.force("sameTagRepulsion", d3.forceManyBody()
      .strength((d) => {
          const sameTagNodes = nodes.filter(n =>
              n.id !== d.id && n.tags.some(tag => d.tags.includes(tag))
          );
          return sameTagNodes.length > 0 ? SIMULATION_SAME_TAG_REPULSION : 0;
      })
  );
  return simulation;
};

/**
 * Draws the links (edges) on the graph.
 * @param {d3.Selection} g - The main D3 group element.
 * @param {Array} linksData - Array of link objects.
 * @param {Function} setSelectedConnection - React state setter for the selected connection.
 * @returns {d3.Selection} The D3 selection of link elements.
 */
const drawLinks = (g, linksData, setSelectedConnection) => {
  const linkGroup = g.append("g").attr("class", styles.links); // Use CSS module class
  return linkGroup.selectAll("line")
      .data(linksData)
      .enter().append("line")
      .attr("class", d => { // Apply classes based on type/strength
          if (d.type === 'explicit') return `${styles.link} ${styles.linkExplicit}`;
          if (d.strengthCategory === 'strong') return `${styles.link} ${styles.linkStrong}`;
          if (d.strengthCategory === 'moderate') return `${styles.link} ${styles.linkModerate}`;
          return `${styles.link} ${styles.linkWeak}`;
      })
      .attr("stroke-opacity", d => d.type === 'explicit' ? 0.9 : Math.max(0.3, d.strength)) // Dynamic
      .attr("stroke-width", d => d.type === 'explicit' ? LINK_EXPLICIT_STROKE_WIDTH : Math.max(LINK_BASE_STROKE_WIDTH, d.strength * LINK_STRENGTH_STROKE_FACTOR)) // Dynamic
      .attr("stroke-dasharray", d => d.type === 'explicit' ? "0" : "5,5") // Dynamic (or could be classes)
      // .style("cursor", "pointer") // Moved to .link class in CSS module
      .on("mouseover", function(event, d) {
          setSelectedConnection(d);
          d3.select(this) // Keep dynamic hover styles if they differ significantly from CSS :hover
              .attr("stroke-width", currentD => currentD.type === 'explicit' ? LINK_EXPLICIT_STROKE_WIDTH + 2 : Math.max(LINK_BASE_STROKE_WIDTH + 2, currentD.strength * (LINK_STRENGTH_STROKE_FACTOR + 2)))
              .attr("stroke-opacity", 1);
      })
      .on("mouseout", function(event, d) {
          setSelectedConnection(null);
          d3.select(this)
              .attr("stroke-width", currentD => currentD.type === 'explicit' ? LINK_EXPLICIT_STROKE_WIDTH : Math.max(LINK_BASE_STROKE_WIDTH, currentD.strength * LINK_STRENGTH_STROKE_FACTOR))
              .attr("stroke-opacity", currentD => currentD.type === 'explicit' ? 0.9 : Math.max(0.3, currentD.strength));
      });
};

/**
 * Draws the nodes (circles) on the graph.
 * @param {d3.Selection} g - The main D3 group element.
 * @param {Array} nodesData - Array of node objects.
 * @param {d3.ScaleOrdinal} colorScale - D3 color scale for node groups.
 * @param {Function} setHoveredNode - React state setter for hovered node.
 * @param {Function} setSelectedNode - React state setter for selected node.
 * @param {object} selectedNodeState - The current selectedNode state.
 * @param {d3.DragBehavior} dragBehavior - The D3 drag behavior.
 * @param {d3.Selection} linkElements - The D3 selection of link elements.
 * @param {Array} linksData - Array of link objects for highlighting.
 * @returns {d3.Selection} The D3 selection of node elements.
 */
const drawNodes = (g, nodesData, colorScale, setHoveredNode, setSelectedNode, selectedNodeState, dragBehavior, linkElements, linksData) => {
  const nodeGroup = g.append("g").attr("class", styles.nodes); // Use CSS module class

  const defs = g.select(function() { return this.parentNode; }).select("defs");

  // Add patterns for hub nodes (pattern definition itself is fine in JS)
  const pattern = defs.selectAll("pattern")
      .data(nodesData.filter(d => d.connectionCount > HUB_NODE_CONNECTION_THRESHOLD))
      .enter().append("pattern")
      .attr("id", d => `pattern-${d.id}`)
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 4)
      .attr("height", 4);

  pattern.append("circle")
      .attr("cx", 2)
      .attr("cy", 2)
      .attr("r", 1)
      .attr("fill", "#ffffff")
      .attr("opacity", 0.3);

  const nodesSelection = nodeGroup.selectAll("circle")
      .data(nodesData)
      .enter().append("circle")
      .attr("r", d => d.size) // Dynamic
      .attr("fill", d => { // Dynamic
          if (d.connectionCount > HUB_NODE_CONNECTION_THRESHOLD) {
              return `url(#pattern-${d.id})`;
          }
          return colorScale(d.group);
      })
      .attr("class", d => d.connectionCount > HUB_NODE_CONNECTION_THRESHOLD ? `${styles.node} ${styles.nodeHub}` : `${styles.node} ${styles.nodeDefaultStroke}`)
      .attr("stroke-width", d => d.connectionCount > HUB_NODE_CONNECTION_THRESHOLD ? HUB_NODE_STROKE_WIDTH : NODE_STROKE_WIDTH) // Dynamic or could be classes
      // .style("cursor", "pointer") // Moved to .node class
      // .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.25))") // Moved to .node class
      .on("mouseover", function (event, d) {
          setHoveredNode(d);
          d3.select(this)
              .transition()
              .duration(200)
              .attr("r", d.size * 1.2)
              .attr("stroke-width", currentD => currentD.connectionCount > HUB_NODE_CONNECTION_THRESHOLD ? HUB_NODE_STROKE_WIDTH + 2 : NODE_STROKE_WIDTH + 2) // Enhanced hover
              .style("filter", "drop-shadow(0 8px 16px rgba(0,0,0,0.4))"); // Enhanced hover

          linkElements
              .attr("stroke-opacity", l =>
                  (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.1
              );

          nodeGroup.selectAll("circle") // Could use nodesSelection here
              .attr("opacity", n => {
                  if (n.id === d.id) return 1;
                  const isConnected = linksData.some(l =>
                      (l.source.id === d.id && l.target.id === n.id) ||
                      (l.target.id === d.id && l.source.id === n.id)
                  );
                  return isConnected ? 1 : 0.3;
              });
      })
      .on("mouseout", function (event, d) {
          setHoveredNode(null);
          d3.select(this)
              .transition()
              .duration(200)
              .attr("r", d.size)
              .attr("stroke-width", currentD => currentD.connectionCount > HUB_NODE_CONNECTION_THRESHOLD ? HUB_NODE_STROKE_WIDTH : NODE_STROKE_WIDTH)
              .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.25))");

          linkElements
              .attr("stroke-opacity", l => l.type === 'explicit' ? 0.9 : Math.max(0.3, l.strength));

          nodeGroup.selectAll("circle") // Could use nodesSelection here
              .attr("opacity", 1);
      })
      .on("click", function (event, d) {
          event.stopPropagation();
          setSelectedNode(selectedNodeState?.id === d.id ? null : d);
      })
      .call(dragBehavior);
  return nodesSelection;
};

/**
 * Draws labels for the nodes.
 * @param {d3.Selection} g - The main D3 group element.
 * @param {Array} nodesData - Array of node objects.
 * @param {boolean} showLabels - Flag to determine if labels should be shown.
 * @returns {d3.Selection|null} The D3 selection of label group elements, or null if labels are not shown.
 */
const drawLabels = (g, nodesData, showLabelsFlag) => {
  if (!showLabelsFlag) {
    g.select(".labels").remove();
    return null;
  }
  const labelGroup = g.append("g").attr("class", styles.labels); // Use CSS module class

  labelGroup.selectAll("text")
      .data(nodesData)
      .enter().append("text")
      .attr("class", styles.labelText) // Use CSS module class
      .text(d => {
          const title = d.title || 'Untitled';
          return title.length > 20 ? title.substring(0, 20) + "..." : title;
      })
      .attr("font-size", d => Math.max(LABEL_FONT_SIZE_MIN, Math.min(LABEL_FONT_SIZE_MAX, d.size / LABEL_SIZE_DIVISOR))) // Dynamic
      .attr("dy", d => d.size + LABEL_DY_OFFSET); // Dynamic

  const badges = labelGroup.selectAll("g.badge-group")
      .data(nodesData.filter(d => d.connectionCount > HUB_NODE_CONNECTION_THRESHOLD))
      .enter().append("g").attr("class", "badge-group"); // Keep class for selection if needed

  badges.append("rect")
      .attr("class", styles.badgeRect) // Use CSS module class
      .attr("x", -12)
      .attr("y", d => -d.size - 15) // Dynamic
      .attr("width", 24)
      .attr("height", 16)
      .attr("rx", 8);

  badges.append("text")
      .attr("class", styles.badgeText) // Use CSS module class
      .attr("x", 0)
      .attr("y", d => -d.size - 7) // Dynamic
      .text(d => d.connectionCount);

  return labelGroup;
};

/**
 * Sets up zoom and pan functionality.
 * @param {d3.Selection} svg - The D3 selection for the SVG element.
 * @param {d3.Selection} g - The main D3 group element to apply zoom to.
 * @returns {d3.ZoomBehavior} The configured D3 zoom behavior.
 */
const setupZoom = (svg, g) => {
  const zoomBehavior = d3.zoom()
      .scaleExtent(ZOOM_SCALE_EXTENT)
      .on("zoom", (event) => {
          g.attr("transform", event.transform);
      });
  svg.call(zoomBehavior);
  return zoomBehavior; // Return for potential use with controls
};

/**
 * Creates control buttons for the visualization.
 * @param {d3.Selection} svg - The D3 selection for the SVG element.
 * @param {number} width - The width of the SVG.
 * @param {d3.ForceSimulation} simulation - The D3 simulation object.
 * @param {string} currentSimState - The current simulation state ('running' or 'stopped').
 * @param {Function} setSimState - React state setter for simulation state.
 * @param {d3.ZoomBehavior} zoomBehavior - The D3 zoom behavior object.
 */
const createControls = (svg, width, simulation, currentSimState, setSimState, zoomBehavior) => {
  svg.select(".controls").remove(); // Clear previous controls
  const controlsGroup = svg.append("g")
      .attr("class", styles.controls) // Use CSS module class for the group
      .attr("transform", `translate(${width - 160}, 15)`);

  // Reset zoom button
  const resetButton = controlsGroup.append("g")
      .attr("class", `${styles.controlButton} ${styles.resetButton}`)
      .on("click", () => {
          svg.transition().duration(750).call(
              zoomBehavior.transform,
              d3.zoomIdentity
          );
      });
  resetButton.append("rect").attr("width", 90).attr("height", 30);
  resetButton.append("text").attr("x", 45).attr("y", 20).text("Reset View");

  // Simulation control button
  const simButton = controlsGroup.append("g")
      .attr("class", styles.controlButton) // General class
      .classed(styles.playPauseButtonRunning, currentSimState === 'running')
      .classed(styles.playPauseButtonStopped, currentSimState !== 'running')
      .attr("transform", "translate(0, 35)")
      .on("click", () => {
          if (currentSimState === 'running') {
              simulation.stop();
              setSimState('stopped');
          } else {
              simulation.alpha(0.3).restart();
              setSimState('running');
          }
      });
  simButton.append("rect").attr("width", 90).attr("height", 30);
  simButton.append("text").attr("x", 45).attr("y", 20)
      .text(currentSimState === 'running' ? "Pause" : "Play");
};


const TopicMapVisualization = ({
    connectionsData,
    searchTerm = '',
    selectedCategories = [], // Changed from categoryFilter to selectedCategories (array)
    sortBy = 'relevance', // This prop is received but not used in processDataForVisualization yet
    minSimilarity = 0.2,
    connectionType = 'all',
    showLabels = true,
    showMetrics = true // This prop is received but not currently used in the component's rendering
}) => {
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [hoveredNode, setHoveredNode] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [simulationState, setSimulationState] = useState('stopped');

    // Check if we have real data
    const hasRealData = connectionsData?.notebooks?.length > 0 && 
                       connectionsData?.connections?.length > 0 &&
                       !connectionsData?.isDemoData;

    // Enhanced data validation and fallback
    const rawData = hasRealData ? connectionsData : generateEnhancedSampleData();

    console.log("=== Enhanced TopicMapVisualization Debug ===");
    console.log("connectionsData:", connectionsData);
    console.log("hasRealData:", hasRealData);
    console.log("Final data structure:", {
        notebooks: rawData?.notebooks?.length || 0,
        connections: rawData?.connections?.length || 0,
        hasNetworkIntelligence: !!rawData?.networkIntelligence,
        hasSmartClusters: !!rawData?.smartClusters
    });

    // Generate enhanced sample data for testing
    function generateEnhancedSampleData() {
        const notebooks = [
            { 
                notebookId: '1', 
                title: 'Machine Learning Fundamentals', 
                tags: ['AI', 'Machine Learning', 'Python', 'Research'], 
                wordCount: 2500,
                updatedAt: '2024-01-15T10:00:00Z',
                preview: 'Comprehensive guide to machine learning algorithms including supervised and unsupervised learning techniques.'
            },
            { 
                notebookId: '2', 
                title: 'Data Science Pipeline', 
                tags: ['Data Science', 'Python', 'Analytics', 'ETL'], 
                wordCount: 1800,
                updatedAt: '2024-01-16T14:30:00Z',
                preview: 'Building robust data pipelines for analytics and machine learning workflows.'
            },
            { 
                notebookId: '3', 
                title: 'Deep Learning with TensorFlow', 
                tags: ['Deep Learning', 'TensorFlow', 'Neural Networks', 'AI'], 
                wordCount: 3200,
                updatedAt: '2024-01-14T09:15:00Z',
                preview: 'Advanced deep learning concepts using TensorFlow framework for neural network implementation.'
            },
            { 
                notebookId: '4', 
                title: 'Python Programming Best Practices', 
                tags: ['Python', 'Programming', 'Best Practices', 'Code Quality'], 
                wordCount: 1200,
                updatedAt: '2024-01-12T16:45:00Z',
                preview: 'Essential Python programming patterns and best practices for clean, maintainable code.'
            },
            { 
                notebookId: '5', 
                title: 'Research Methodology in AI', 
                tags: ['Research', 'AI', 'Methodology', 'Academic'], 
                wordCount: 2800,
                updatedAt: '2024-01-10T11:20:00Z',
                preview: 'Systematic approach to conducting research in artificial intelligence and machine learning.'
            },
            { 
                notebookId: '6', 
                title: 'Data Visualization Techniques', 
                tags: ['Visualization', 'Analytics', 'D3.js', 'Charts'], 
                wordCount: 1500,
                updatedAt: '2024-01-18T13:10:00Z',
                preview: 'Creating effective data visualizations using modern web technologies and design principles.'
            },
            { 
                notebookId: '7', 
                title: 'Cloud Computing Architecture', 
                tags: ['Cloud', 'AWS', 'Architecture', 'Scalability'], 
                wordCount: 2200,
                updatedAt: '2024-01-08T08:30:00Z',
                preview: 'Designing scalable cloud architectures using AWS services and modern cloud-native patterns.'
            }
        ];

        const connections = [
            { 
                source: '1', target: '3', type: 'smart_similarity', strength: 0.85, 
                strengthCategory: 'strong',
                commonTags: ['AI', 'Machine Learning'],
                factors: { tagSimilarity: 0.7, contentSimilarity: 0.6, temporalBonus: 0.2, wordCountBonus: 0.05 }
            },
            { 
                source: '1', target: '5', type: 'smart_similarity', strength: 0.72, 
                strengthCategory: 'strong',
                commonTags: ['AI', 'Research'],
                factors: { tagSimilarity: 0.5, contentSimilarity: 0.4, temporalBonus: 0.1, wordCountBonus: 0.08 }
            },
            { 
                source: '2', target: '4', type: 'smart_similarity', strength: 0.68, 
                strengthCategory: 'moderate',
                commonTags: ['Python'],
                factors: { tagSimilarity: 0.4, contentSimilarity: 0.5, temporalBonus: 0.15, wordCountBonus: 0.03 }
            },
            { 
                source: '2', target: '6', type: 'smart_similarity', strength: 0.55, 
                strengthCategory: 'moderate',
                commonTags: ['Analytics'],
                factors: { tagSimilarity: 0.3, contentSimilarity: 0.4, temporalBonus: 0.05, wordCountBonus: 0.02 }
            },
            { 
                source: '1', target: '4', type: 'smart_similarity', strength: 0.45, 
                strengthCategory: 'weak',
                commonTags: ['Python'],
                factors: { tagSimilarity: 0.25, contentSimilarity: 0.3, temporalBonus: 0.0, wordCountBonus: 0.01 }
            },
            { 
                source: '3', target: '5', type: 'explicit', strength: 1.0,
                strengthCategory: 'explicit',
                commonTags: ['AI'],
                factors: {}
            }
        ];

        return { 
            notebooks, 
            connections,
            networkIntelligence: {
                totalNodes: notebooks.length,
                totalConnections: connections.length,
                density: 0.42,
                averageConnections: 2.1,
                clusteringCoefficient: 0.35,
                networkHealth: {
                    connected: true,
                    wellConnected: true,
                    hasHubs: true,
                    diverse: true
                },
                strengthDistribution: {
                    strong: 2,
                    moderate: 2,
                    weak: 1,
                    explicit: 1
                },
                tagAnalysis: {
                    uniqueTags: 15,
                    diversity: 0.8,
                    mostCommon: [
                        { tag: 'AI', count: 3 },
                        { tag: 'Python', count: 3 },
                        { tag: 'Research', count: 2 }
                    ]
                }
            }
        };
    }

    // Handle container resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setDimensions({
                    width: Math.max(clientWidth, 700),
                    height: Math.max(clientHeight, 500)
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Enhanced data processing with smart filtering, wrapped in useMemo
    const processedData = useMemo(() => {
        console.log("Processing data for visualization...", {
            rawDataAvailable: !!(rawData.notebooks && rawData.notebooks.length > 0),
            searchTerm, selectedCategories, sortBy, minSimilarity, connectionType
        });
        if (!rawData.notebooks || rawData.notebooks.length === 0) {
            return { nodes: [], links: [] };
        }

        let filteredNotebooks = [...rawData.notebooks];

        // Apply search filter with enhanced matching
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filteredNotebooks = filteredNotebooks.filter(notebook =>
                (notebook.title && notebook.title.toLowerCase().includes(searchLower)) ||
                (notebook.tags && notebook.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
                (notebook.preview && notebook.preview.toLowerCase().includes(searchLower))
            );
        }

        // Apply category filter (using selectedCategories array)
        if (selectedCategories && selectedCategories.length > 0) {
            filteredNotebooks = filteredNotebooks.filter(notebook =>
                notebook.tags && notebook.tags.some(tag =>
                    selectedCategories.includes(tag) // Assuming selectedCategories contains exact tag names
                )
            );
        }

        // TODO: Implement sortBy logic if needed. Currently, sortBy prop is not used.

        // Create enhanced nodes
        const nodes = filteredNotebooks.map(notebook => {
            const tags = notebook.tags || [];
            const primaryTag = tags.length > 0 ? tags[0] : 'uncategorized';
            const wordCount = notebook.wordCount || 0;
            const title = notebook.title || `Notebook ${notebook.notebookId?.substring(0, 8) || 'Unknown'}`;
            const connectionCount = (rawData.connections || []).filter(conn =>
                conn.source === notebook.notebookId || conn.target === notebook.notebookId
            ).length;

            const wordSize = Math.min(DEFAULT_NODE_MAX_WORD_SIZE, (wordCount / DEFAULT_NODE_WORD_SIZE_FACTOR) + DEFAULT_NODE_WORD_SIZE_ADD);
            const connectionSize = connectionCount * DEFAULT_NODE_CONNECTION_SIZE_FACTOR;
            const totalSize = DEFAULT_NODE_BASE_SIZE + wordSize + connectionSize;

            return {
                id: notebook.notebookId,
                title: title,
                tags: tags,
                wordCount: wordCount,
                connectionCount: connectionCount,
                group: primaryTag,
                size: Math.max(MIN_NODE_SIZE, Math.min(MAX_NODE_SIZE, totalSize)),
                notebook: notebook,
                updatedAt: notebook.updatedAt,
                preview: notebook.preview || ''
            };
        });

        // Create enhanced links with filtering
        const nodeIds = new Set(nodes.map(n => n.id));
        const availableConnections = rawData.connections || [];

        const links = availableConnections
            .filter(conn => {
                const hasSource = nodeIds.has(conn.source);
                const hasTarget = nodeIds.has(conn.target);
                const meetsThreshold = conn.strength >= minSimilarity;
                const meetsType = connectionType === 'all' || conn.type === connectionType;

                return hasSource && hasTarget && meetsThreshold && meetsType;
            })
            .map(conn => ({
                source: conn.source,
                target: conn.target,
                strength: conn.strength || 0.5,
                type: conn.type || 'unknown',
                strengthCategory: conn.strengthCategory || 'weak',
                commonTags: conn.commonTags || [],
                factors: conn.factors || {},
                distance: Math.max(LINK_BASE_DISTANCE, 200 - (conn.strength * LINK_STRENGTH_DISTANCE_FACTOR)), // Adjusted distance logic
                connection: conn
            }));

        return { nodes, links };
    }, [rawData, searchTerm, selectedCategories, sortBy, minSimilarity, connectionType]);

    // Drag handler functions
    const dragstarted = useCallback((event, d, simulation) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }, []);

    const dragged = useCallback((event, d) => {
        d.fx = event.x;
        d.fy = event.y;
    }, []);

    const dragended = useCallback((event, d, simulation) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }, []);


    // Enhanced D3 visualization
    useEffect(() => {
        if (!processedData || !processedData.nodes || !dimensions.width || !dimensions.height) {
            return;
        }
        const { nodes, links } = processedData; // Use memoized data

        const svgElement = d3.select(svgRef.current);
        const margin = { top: 40, right: 40, bottom: 40, left: 40 }; // Keep margin, innerWidth/Height local to useEffect
        const innerWidth = dimensions.width - margin.left - margin.right;
        const innerHeight = dimensions.height - margin.top - margin.bottom;

        if (nodes.length === 0) {
            svgElement.selectAll("*").remove();
            svgElement.append("text")
                .attr("class", styles.noDataText) // Use CSS Module class
                .attr("x", dimensions.width / 2)
                .attr("y", dimensions.height / 2)
                .text("No notebooks found matching your criteria");
            return;
        }
        
        const g = setupSVG(svgElement, dimensions, margin); // g is local to this effect

        const allTags = [...new Set(nodes.flatMap(n => n.tags))];
        const colorScale = d3.scaleOrdinal()
            .domain(allTags.concat(['uncategorized']))
            .range([
                '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
                '#8b5cf6', '#f97316', '#ec4899', '#84cc16', '#6366f1',
                '#14b8a6', '#f43f5e', '#a855f7', '#22c55e', '#6b7280',
                '#0ea5e9', '#8b5a2b', '#db2777', '#7c3aed', '#059669'
            ]);

        const simulation = createSimulation(nodes, links, innerWidth, innerHeight);
        
        const linkElements = drawLinks(g, links, setSelectedConnection);

        const dragBehavior = d3.drag()
            .on("start", (event, d) => dragstarted(event, d, simulation))
            .on("drag", dragged)
            .on("end", (event, d) => dragended(event, d, simulation));

        const nodeElements = drawNodes(g, nodes, colorScale, setHoveredNode, setSelectedNode, selectedNode, dragBehavior, linkElements, links);
        
        let labelElementsGroup = drawLabels(g, nodes, showLabels);

        setSimulationState('running');

        simulation.on("tick", () => {
            const padding = 100; // Keep nodes away from edges

            nodeElements
                .attr("cx", d => d.x = Math.max(d.size + NODE_STROKE_WIDTH, Math.min(innerWidth - d.size - NODE_STROKE_WIDTH, d.x)))
                .attr("cy", d => d.y = Math.max(d.size + NODE_STROKE_WIDTH, Math.min(innerHeight - d.size - NODE_STROKE_WIDTH, d.y)));

            linkElements
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            if (showLabels && labelElementsGroup) {
                labelElementsGroup.selectAll("text")
                    .attr("x", d => d.x)
                    .attr("y", d => d.y + d.size + LABEL_DY_OFFSET / 2); // Adjust dy based on label position (below node)

                labelElementsGroup.selectAll("g.badge-group") // Select the group for badges
                     .attr("transform", d => `translate(${d.x},${d.y})`);
            }
        });

        simulation.on("end", () => setSimulationState('stopped'));

        const zoomBehavior = setupZoom(svgElement, g);
        createControls(svgElement, dimensions.width, simulation, simulationState, setSimulationState, zoomBehavior);

        // Update controls if simulationState changes from outside (e.g. initial state)
        // This ensures the play/pause button is correct if the effect re-runs.
        d3.select(svgRef.current).select(".controls").remove(); // Remove old controls before re-creating
        createControls(svgElement, dimensions.width, simulation, simulationState, setSimulationState, zoomBehavior);


        return () => {
            simulation.stop();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        processedData,
        dimensions,
        showLabels,
        simulationState,
        dragstarted,
        dragged,
        dragended,
        // Prop `sortBy` is not directly used in this effect but is part of processedData dependency
        // Prop `showMetrics` is not directly used in this effect
    ]);

    // Re-draw labels when showLabels prop changes without re-running the entire simulation
    useEffect(() => {
        // Use processedData.nodes here
        if (!svgRef.current || !processedData || !processedData.nodes || processedData.nodes.length === 0) return;

        const svg = d3.select(svgRef.current);
        const g = svg.select("g"); // Assuming 'g' is the main group where elements are drawn

        if (g.empty()) return; // Ensure g exists

        // If nodes are already drawn (i.e., nodeElements exist and have data)
        const nodesData = g.selectAll(".nodes circle").data();
        if(nodesData.length > 0) {
             // Clear existing labels before redrawing
            g.select(".labels").remove();
            if (showLabels) {
                // Pass nodesData (which are the D3 bound data objects) to drawLabels
                const labelElementsGroup = drawLabels(g, nodesData, true);
                // Need to update positions if simulation is not running
                if (simulationState !== 'running' && labelElementsGroup) {
                     labelElementsGroup.selectAll("text")
                        .attr("x", d => d.x)
                        .attr("y", d => d.y + d.size + LABEL_DY_OFFSET / 2);
                    labelElementsGroup.selectAll("g.badge-group")
                        .attr("transform", d => `translate(${d.x},${d.y})`);
                }
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showLabels, processedData.nodes, simulationState]);


    return (
        <div ref={containerRef} className={styles.container}>
            <div className={styles.visualizationContainer}>
                <svg ref={svgRef} className={styles.svg} data-testid="visualization-svg"></svg>

                {/* Enhanced data source indicator */}
                <div className={styles.dataSourceIndicator}>
                    <span className={hasRealData ? styles.realDataText : styles.sampleDataText}>
                        {hasRealData ? 
                            `✅ Smart Analysis: ${processedData.nodes.length} notebooks, ${processedData.links.length} connections` :
                            '📊 Demo Data - Enhanced Smart Mapping'
                        }
                    </span>
                    {simulationState === 'running' && (
                        <span className={styles.simulationIndicator}>🔄 Simulation Active</span>
                    )}
                </div>

                {/* Enhanced tooltip for hovered node */}
                {hoveredNode && (
                    <div className={styles.tooltip} style={{ left: hoveredNode.x ? hoveredNode.x + hoveredNode.size + 20 : 0, top: hoveredNode.y ? hoveredNode.y - 20 : 0 }}>
                        <h4 className={styles.tooltipTitle}>{hoveredNode.title}</h4>
                        <div className={styles.tooltipSection}>
                            <p className={styles.tooltipText}>
                                <strong>Tags:</strong> {hoveredNode.tags.length > 0 ? hoveredNode.tags.join(', ') : 'No tags'}
                            </p>
                            <p className={styles.tooltipText}>
                                <strong>Words:</strong> {hoveredNode.wordCount.toLocaleString()}
                            </p>
                            <p className={styles.tooltipText}>
                                <strong>Connections:</strong> {hoveredNode.connectionCount}
                            </p>
                            {hoveredNode.updatedAt && (
                                <p className={styles.tooltipText}>
                                    <strong>Updated:</strong> {new Date(hoveredNode.updatedAt).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        {hoveredNode.preview && (
                            <div className={styles.tooltipPreview}>
                                <strong>Preview:</strong>
                                <p>{hoveredNode.preview.substring(0, 100)}...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Connection details tooltip */}
                {selectedConnection && (
                     <div className={styles.connectionTooltip} style={{ left: selectedConnection.source.x ? (selectedConnection.source.x + selectedConnection.target.x) / 2 + 15 : 0, top: selectedConnection.source.y ? (selectedConnection.source.y + selectedConnection.target.y) / 2 + 15 : 0 }}>
                        <h4 className={styles.tooltipTitle}>Connection Details</h4>
                        <div className={styles.tooltipSection}>
                            <p className={styles.tooltipText}>
                                <strong>Type:</strong> {selectedConnection.type === 'explicit' ? 'Explicit Link' : 'Smart Similarity'}
                            </p>
                            <p className={styles.tooltipText}>
                                <strong>Strength:</strong> {Math.round(selectedConnection.strength * 100)}%
                            </p>
                            <p className={styles.tooltipText}>
                                <strong>Category:</strong> {selectedConnection.strengthCategory}
                            </p>
                            {selectedConnection.commonTags.length > 0 && (
                                <p className={styles.tooltipText}>
                                    <strong>Common Tags:</strong> {selectedConnection.commonTags.join(', ')}
                                </p>
                            )}
                        </div>
                        {selectedConnection.factors && Object.keys(selectedConnection.factors).length > 0 && (
                            <div className={styles.tooltipSection}>
                                <strong>Analysis Factors:</strong>
                                {Object.entries(selectedConnection.factors).map(([key, value]) => (
                                    <p key={key} className={styles.factorText}>
                                        {key}: {Math.round(value * 100)}%
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Original styles object is removed as styles are now in TopicMapVisualization.module.css
// const styles = { ... };

export default TopicMapVisualization;