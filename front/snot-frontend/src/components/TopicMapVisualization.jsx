import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const TopicMapVisualization = ({
    connectionsData,
    searchTerm = '',
    categoryFilter = 'all',
    sortBy = 'relevance',
    minSimilarity = 0.2,
    connectionType = 'all',
    showLabels = true,
    showMetrics = true
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
    const data = hasRealData ? connectionsData : generateEnhancedSampleData();

    console.log("=== Enhanced TopicMapVisualization Debug ===");
    console.log("connectionsData:", connectionsData);
    console.log("hasRealData:", hasRealData);
    console.log("Final data structure:", {
        notebooks: data?.notebooks?.length || 0,
        connections: data?.connections?.length || 0,
        hasNetworkIntelligence: !!data?.networkIntelligence,
        hasSmartClusters: !!data?.smartClusters
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

    // Enhanced data processing with smart filtering
    const processDataForVisualization = () => {
        if (!data.notebooks || data.notebooks.length === 0) {
            return { nodes: [], links: [] };
        }

        let filteredNotebooks = [...data.notebooks];

        // Apply search filter with enhanced matching
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filteredNotebooks = filteredNotebooks.filter(notebook =>
                (notebook.title && notebook.title.toLowerCase().includes(searchLower)) ||
                (notebook.tags && notebook.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
                (notebook.preview && notebook.preview.toLowerCase().includes(searchLower))
            );
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            filteredNotebooks = filteredNotebooks.filter(notebook =>
                notebook.tags && notebook.tags.some(tag =>
                    tag.toLowerCase().includes(categoryFilter.toLowerCase())
                )
            );
        }

        // Create enhanced nodes
        const nodes = filteredNotebooks.map(notebook => {
            const tags = notebook.tags || [];
            const primaryTag = tags.length > 0 ? tags[0] : 'uncategorized';
            const wordCount = notebook.wordCount || 0;
            const title = notebook.title || `Notebook ${notebook.notebookId?.substring(0, 8) || 'Unknown'}`;

            // Calculate connection count for this notebook
            const connectionCount = (data.connections || []).filter(conn =>
                conn.source === notebook.notebookId || conn.target === notebook.notebookId
            ).length;

            // Enhanced size calculation based on multiple factors
            const baseSize = 25;
            const wordSize = Math.min(40, (wordCount / 100) + 5);
            const connectionSize = connectionCount * 3;
            const totalSize = baseSize + wordSize + connectionSize;

            return {
                id: notebook.notebookId,
                title: title,
                tags: tags,
                wordCount: wordCount,
                connectionCount: connectionCount,
                group: primaryTag,
                size: Math.max(30, Math.min(80, totalSize)),
                notebook: notebook,
                updatedAt: notebook.updatedAt,
                preview: notebook.preview || ''
            };
        });

        // Create enhanced links with filtering
        const nodeIds = new Set(nodes.map(n => n.id));
        const availableConnections = data.connections || [];

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
                distance: Math.max(80, 200 - (conn.strength * 120)),
                connection: conn
            }));

        return { nodes, links };
    };

    // Enhanced D3 visualization
    useEffect(() => {
        if (!data || !data.notebooks) {
            return;
        }

        const { nodes, links } = processDataForVisualization();

        if (nodes.length === 0) {
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove();

            svg.append("text")
                .attr("x", dimensions.width / 2)
                .attr("y", dimensions.height / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "18px")
                .attr("fill", "#6b7280")
                .attr("font-weight", "500")
                .text("No notebooks found matching your criteria");

            return;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const { width, height } = dimensions;
        const margin = { top: 40, right: 40, bottom: 40, left: 40 };

        svg.attr("width", width).attr("height", height);

        // Enhanced background with subtle gradient
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "backgroundGradient")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "100%").attr("y2", "100%");
        
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#f8fafc");
        
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#f1f5f9");

        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "url(#backgroundGradient)");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Enhanced color scale with more sophisticated colors
        const allTags = [...new Set(nodes.flatMap(n => n.tags))];
        const colorScale = d3.scaleOrdinal()
            .domain(allTags.concat(['uncategorized']))
            .range([
                '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
                '#8b5cf6', '#f97316', '#ec4899', '#84cc16', '#6366f1',
                '#14b8a6', '#f43f5e', '#a855f7', '#22c55e', '#6b7280',
                '#0ea5e9', '#8b5a2b', '#db2777', '#7c3aed', '#059669'
            ]);

        // Create enhanced force simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links)
                .id(d => d.id)
                .distance(d => d.distance)
                .strength(d => Math.min(0.8, d.strength))
            )
            .force("charge", d3.forceManyBody()
                .strength(d => -300 - (d.connectionCount * 50))
            )
            .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
            .force("collision", d3.forceCollide()
                .radius(d => d.size + 15)
                .strength(0.9)
            );

        // Add repulsion between nodes with same tags
        simulation.force("sameTagRepulsion", d3.forceManyBody()
            .strength((d, i) => {
                const sameTagNodes = nodes.filter(n => 
                    n.id !== d.id && n.tags.some(tag => d.tags.includes(tag))
                );
                return sameTagNodes.length > 0 ? -100 : 0;
            })
        );

        // Create enhanced links with different styles
        const linkGroup = g.append("g").attr("class", "links");
        
        const link = linkGroup.selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", d => {
                if (d.type === 'explicit') return '#ef4444';
                if (d.strengthCategory === 'strong') return '#059669';
                if (d.strengthCategory === 'moderate') return '#3b82f6';
                return '#9ca3af';
            })
            .attr("stroke-opacity", d => {
                if (d.type === 'explicit') return 0.9;
                return Math.max(0.3, d.strength);
            })
            .attr("stroke-width", d => {
                if (d.type === 'explicit') return 4;
                return Math.max(2, d.strength * 6);
            })
            .attr("stroke-dasharray", d => d.type === 'explicit' ? "0" : "5,5")
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                setSelectedConnection(d);
                d3.select(this)
                    .attr("stroke-width", d => d.type === 'explicit' ? 6 : Math.max(4, d.strength * 8))
                    .attr("stroke-opacity", 1);
            })
            .on("mouseout", function(event, d) {
                setSelectedConnection(null);
                d3.select(this)
                    .attr("stroke-width", d => d.type === 'explicit' ? 4 : Math.max(2, d.strength * 6))
                    .attr("stroke-opacity", d => d.type === 'explicit' ? 0.9 : Math.max(0.3, d.strength));
            });

        // Create enhanced nodes with patterns
        const nodeGroup = g.append("g").attr("class", "nodes");
        
        // Add patterns for different node types
        const pattern = defs.selectAll("pattern")
            .data(nodes.filter(d => d.connectionCount > 3))
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

        const node = nodeGroup.selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", d => d.size)
            .attr("fill", d => {
                if (d.connectionCount > 3) {
                    return `url(#pattern-${d.id})`;
                }
                return colorScale(d.group);
            })
            .attr("stroke", d => d.connectionCount > 3 ? "#fbbf24" : "#ffffff")
            .attr("stroke-width", d => d.connectionCount > 3 ? 6 : 4)
            .style("cursor", "pointer")
            .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.25))")
            .on("mouseover", function (event, d) {
                setHoveredNode(d);
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", d.size * 1.2)
                    .attr("stroke-width", d => d.connectionCount > 3 ? 8 : 6)
                    .style("filter", "drop-shadow(0 8px 16px rgba(0,0,0,0.4))");
                
                // Highlight connected nodes and links
                linkGroup.selectAll("line")
                    .attr("stroke-opacity", l => 
                        (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.1
                    );
                    
                nodeGroup.selectAll("circle")
                    .attr("opacity", n => {
                        if (n.id === d.id) return 1;
                        const isConnected = links.some(l => 
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
                    .attr("stroke-width", d => d.connectionCount > 3 ? 6 : 4)
                    .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.25))");
                
                // Reset highlighting
                linkGroup.selectAll("line")
                    .attr("stroke-opacity", d => d.type === 'explicit' ? 0.9 : Math.max(0.3, d.strength));
                    
                nodeGroup.selectAll("circle")
                    .attr("opacity", 1);
            })
            .on("click", function (event, d) {
                event.stopPropagation();
                setSelectedNode(selectedNode?.id === d.id ? null : d);
            })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Enhanced labels with better positioning
        const labelGroup = g.append("g").attr("class", "labels");
        
        if (showLabels) {
            const labels = labelGroup.selectAll("text")
                .data(nodes)
                .enter().append("text")
                .text(d => {
                    const title = d.title || 'Untitled';
                    return title.length > 20 ? title.substring(0, 20) + "..." : title;
                })
                .attr("font-size", d => Math.max(10, Math.min(14, d.size / 4)))
                .attr("font-family", "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
                .attr("fill", "#1f2937")
                .attr("font-weight", "600")
                .attr("text-anchor", "middle")
                .attr("dy", d => d.size + 25)
                .style("pointer-events", "none")
                .style("user-select", "none")
                .style("text-shadow", "2px 2px 4px rgba(255,255,255,0.9)")
                .style("opacity", 0.9);

            // Connection count badges for highly connected nodes
            const badges = labelGroup.selectAll("rect")
                .data(nodes.filter(d => d.connectionCount > 2))
                .enter().append("g");

            badges.append("rect")
                .attr("x", d => -12)
                .attr("y", d => -d.size - 15)
                .attr("width", 24)
                .attr("height", 16)
                .attr("rx", 8)
                .attr("fill", "#ef4444")
                .style("pointer-events", "none");

            badges.append("text")
                .attr("x", 0)
                .attr("y", d => -d.size - 7)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .attr("font-weight", "700")
                .attr("fill", "#ffffff")
                .text(d => d.connectionCount)
                .style("pointer-events", "none");
        }

        // Simulation state tracking
        setSimulationState('running');
        
        simulation.on("tick", () => {
            const padding = 100;

            node
                .attr("cx", d => {
                    d.x = Math.max(padding, Math.min(innerWidth - padding, d.x));
                    return d.x;
                })
                .attr("cy", d => {
                    d.y = Math.max(padding, Math.min(innerHeight - padding, d.y));
                    return d.y;
                });

            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            if (showLabels) {
                labelGroup.selectAll("text")
                    .attr("x", d => d.x)
                    .attr("y", d => d.y);

                labelGroup.selectAll("g")
                    .attr("transform", d => `translate(${d.x},${d.y})`);
            }
        });

        simulation.on("end", () => {
            setSimulationState('stopped');
        });

        // Enhanced zoom and pan
        const zoom = d3.zoom()
            .scaleExtent([0.1, 5])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Control buttons
        const controlsGroup = svg.append("g")
            .attr("class", "controls")
            .attr("transform", `translate(${width - 160}, 15)`);

        // Reset zoom button
        const resetButton = controlsGroup.append("g")
            .style("cursor", "pointer")
            .on("click", () => {
                svg.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity
                );
            });

        resetButton.append("rect")
            .attr("width", 90)
            .attr("height", 30)
            .attr("fill", "#3b82f6")
            .attr("rx", 6);

        resetButton.append("text")
            .attr("x", 45)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .text("Reset View");

        // Simulation control button
        const simButton = controlsGroup.append("g")
            .attr("transform", "translate(0, 35)")
            .style("cursor", "pointer")
            .on("click", () => {
                if (simulationState === 'running') {
                    simulation.stop();
                    setSimulationState('stopped');
                } else {
                    simulation.restart();
                    setSimulationState('running');
                }
            });

        simButton.append("rect")
            .attr("width", 90)
            .attr("height", 30)
            .attr("fill", simulationState === 'running' ? "#ef4444" : "#10b981")
            .attr("rx", 6);

        simButton.append("text")
            .attr("x", 45)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .text(simulationState === 'running' ? "Pause" : "Play");

        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        // Cleanup
        return () => {
            simulation.stop();
        };

    }, [data, searchTerm, categoryFilter, sortBy, minSimilarity, connectionType, dimensions, showLabels]);

    return (
        <div ref={containerRef} style={styles.container}>
            <div style={styles.visualizationContainer}>
                <svg ref={svgRef} style={styles.svg}></svg>

                {/* Enhanced data source indicator */}
                <div style={styles.dataSourceIndicator}>
                    <span style={hasRealData ? styles.realDataText : styles.sampleDataText}>
                        {hasRealData ? 
                            `✅ Smart Analysis: ${data?.notebooks?.length || 0} notebooks, ${data?.connections?.length || 0} connections` : 
                            '📊 Demo Data - Enhanced Smart Mapping'
                        }
                    </span>
                    {simulationState === 'running' && (
                        <span style={styles.simulationIndicator}>🔄 Simulation Active</span>
                    )}
                </div>

                {/* Enhanced tooltip for hovered node */}
                {hoveredNode && (
                    <div style={styles.tooltip}>
                        <h4 style={styles.tooltipTitle}>{hoveredNode.title}</h4>
                        <div style={styles.tooltipSection}>
                            <p style={styles.tooltipText}>
                                <strong>Tags:</strong> {hoveredNode.tags.length > 0 ? hoveredNode.tags.join(', ') : 'No tags'}
                            </p>
                            <p style={styles.tooltipText}>
                                <strong>Words:</strong> {hoveredNode.wordCount.toLocaleString()}
                            </p>
                            <p style={styles.tooltipText}>
                                <strong>Connections:</strong> {hoveredNode.connectionCount}
                            </p>
                            {hoveredNode.updatedAt && (
                                <p style={styles.tooltipText}>
                                    <strong>Updated:</strong> {new Date(hoveredNode.updatedAt).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        {hoveredNode.preview && (
                            <div style={styles.tooltipPreview}>
                                <strong>Preview:</strong>
                                <p>{hoveredNode.preview.substring(0, 100)}...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Connection details tooltip */}
                {selectedConnection && (
                    <div style={styles.connectionTooltip}>
                        <h4 style={styles.tooltipTitle}>Connection Details</h4>
                        <div style={styles.tooltipSection}>
                            <p style={styles.tooltipText}>
                                <strong>Type:</strong> {selectedConnection.type === 'explicit' ? 'Explicit Link' : 'Smart Similarity'}
                            </p>
                            <p style={styles.tooltipText}>
                                <strong>Strength:</strong> {Math.round(selectedConnection.strength * 100)}%
                            </p>
                            <p style={styles.tooltipText}>
                                <strong>Category:</strong> {selectedConnection.strengthCategory}
                            </p>
                            {selectedConnection.commonTags.length > 0 && (
                                <p style={styles.tooltipText}>
                                    <strong>Common Tags:</strong> {selectedConnection.commonTags.join(', ')}
                                </p>
                            )}
                        </div>
                        {selectedConnection.factors && Object.keys(selectedConnection.factors).length > 0 && (
                            <div style={styles.tooltipSection}>
                                <strong>Analysis Factors:</strong>
                                {Object.entries(selectedConnection.factors).map(([key, value]) => (
                                    <p key={key} style={styles.factorText}>
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

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
    },
    visualizationContainer: {
        flex: 1,
        position: 'relative',
        background: '#f8fafc',
        borderRadius: '8px',
        overflow: 'hidden'
    },
    svg: {
        width: '100%',
        height: '100%'
    },
    dataSourceIndicator: {
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        fontSize: '14px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
    },
    realDataText: {
        color: '#059669',
        fontWeight: '500'
    },
    sampleDataText: {
        color: '#6b7280',
        fontWeight: '500'
    },
    simulationIndicator: {
        color: '#3b82f6',
        fontWeight: '500'
    },
    tooltip: {
        position: 'absolute',
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '300px',
        zIndex: 1000
    },
    tooltipTitle: {
        margin: '0 0 12px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: '#1f2937'
    },
    tooltipSection: {
        marginBottom: '12px'
    },
    tooltipText: {
        margin: '4px 0',
        fontSize: '14px',
        color: '#4b5563'
    },
    tooltipPreview: {
        fontSize: '14px',
        color: '#6b7280',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '12px',
        marginTop: '12px'
    },
    connectionTooltip: {
        position: 'absolute',
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '300px',
        zIndex: 1000
    },
    factorText: {
        margin: '4px 0',
        fontSize: '14px',
        color: '#4b5563'
    }
};

export default TopicMapVisualization;