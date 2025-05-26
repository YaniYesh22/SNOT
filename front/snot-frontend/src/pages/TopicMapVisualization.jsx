import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const TopicMapVisualization = ({
    connectionsData,
    searchTerm = '',
    categoryFilter = 'all',
    sortBy = 'relevance',
    minSimilarity = 0.1
}) => {
    const svgRef = useRef();
    const containerRef = useRef();
    const [selectedNode, setSelectedNode] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Better data handling - only use sample data if explicitly no data is available
    const hasRealData = connectionsData && connectionsData.notebooks && connectionsData.notebooks.length > 0;
    const data = hasRealData ? connectionsData : generateSampleData();

    console.log("=== TopicMapVisualization Debug ===");
    console.log("connectionsData prop:", connectionsData);
    console.log("hasRealData:", hasRealData);
    console.log("Using data source:", hasRealData ? "REAL API DATA" : "SAMPLE DATA");
    console.log("Final data:", data);
    console.log("Notebooks count:", data?.notebooks?.length || 0);
    console.log("Connections count:", data?.connections?.length || 0);

    // Generate sample data for testing
    function generateSampleData() {
        const notebooks = [
            { notebookId: '1', title: 'AI Research Notes', tags: ['AI', 'Machine Learning', 'Research'], wordCount: 1500 },
            { notebookId: '2', title: 'Data Science Projects', tags: ['Data Science', 'Python', 'Analytics'], wordCount: 2000 },
            { notebookId: '3', title: 'ML Model Training', tags: ['Machine Learning', 'Training', 'Models'], wordCount: 1200 },
            { notebookId: '4', title: 'Python Programming', tags: ['Python', 'Programming', 'Code'], wordCount: 800 },
            { notebookId: '5', title: 'Research Papers', tags: ['Research', 'Academic', 'Papers'], wordCount: 3000 },
            { notebookId: '6', title: 'Analytics Dashboard', tags: ['Analytics', 'Visualization', 'Dashboard'], wordCount: 1000 }
        ];

        const connections = [
            { source: '1', target: '3', type: 'tag_similarity', strength: 0.8, commonTags: ['Machine Learning'] },
            { source: '1', target: '5', type: 'tag_similarity', strength: 0.6, commonTags: ['Research'] },
            { source: '2', target: '4', type: 'tag_similarity', strength: 0.7, commonTags: ['Python'] },
            { source: '2', target: '6', type: 'tag_similarity', strength: 0.5, commonTags: ['Analytics'] },
            { source: '3', target: '1', type: 'explicit', strength: 1.0 }
        ];

        return { notebooks, connections, tagGroups: {} };
    }

    // Handle container resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setDimensions({
                    width: Math.max(clientWidth, 600),
                    height: Math.max(clientHeight, 500)
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Process data for D3 visualization
    const processDataForVisualization = () => {
        if (!data.notebooks || data.notebooks.length === 0) {
            console.log("No notebooks found in data");
            return { nodes: [], links: [] };
        }

        console.log("Processing data - raw notebooks:", data.notebooks.length);
        console.log("Sample notebook structure:", data.notebooks[0]);

        // Create nodes from notebooks with filtering
        let filteredNotebooks = [...data.notebooks];

        // Apply search filter
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filteredNotebooks = filteredNotebooks.filter(notebook =>
                (notebook.title && notebook.title.toLowerCase().includes(searchLower)) ||
                (notebook.tags && notebook.tags.some(tag => tag.toLowerCase().includes(searchLower)))
            );
            console.log("After search filter:", filteredNotebooks.length);
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            filteredNotebooks = filteredNotebooks.filter(notebook =>
                notebook.tags && notebook.tags.some(tag =>
                    tag.toLowerCase().includes(categoryFilter.toLowerCase())
                )
            );
            console.log("After category filter:", filteredNotebooks.length);
        }

        // Create nodes with better error handling
        const nodes = filteredNotebooks.map(notebook => {
            const tags = notebook.tags || [];
            const primaryTag = tags.length > 0 ? tags[0] : 'uncategorized';
            const wordCount = notebook.wordCount || 0;
            const title = notebook.title || `Notebook ${notebook.notebookId?.substring(0, 8) || 'Unknown'}`;

            console.log(`Creating node for: ${title}, tags: [${tags.join(', ')}], wordCount: ${wordCount}`);

            return {
                id: notebook.notebookId,
                title: title,
                tags: tags,
                wordCount: wordCount,
                group: primaryTag,
                size: Math.max(30, Math.min(70, wordCount > 0 ? (wordCount / 50 + 35) : 40)), // Better size for 0 word count
                notebook: notebook
            };
        });

        console.log("Created nodes:", nodes.length);
        console.log("Sample node:", nodes[0]);

        // Create links from connections
        const nodeIds = new Set(nodes.map(n => n.id));
        console.log("Node IDs:", Array.from(nodeIds));

        const availableConnections = data.connections || [];
        console.log("Available connections:", availableConnections.length);
        console.log("Sample connection:", availableConnections[0]);

        const links = availableConnections
            .filter(conn => {
                const hasSource = nodeIds.has(conn.source);
                const hasTarget = nodeIds.has(conn.target);
                const meetsThreshold = conn.strength >= minSimilarity;

                if (!hasSource) console.log(`Connection source ${conn.source} not found in nodes`);
                if (!hasTarget) console.log(`Connection target ${conn.target} not found in nodes`);
                if (!meetsThreshold) console.log(`Connection strength ${conn.strength} below threshold ${minSimilarity}`);

                return hasSource && hasTarget && meetsThreshold;
            })
            .map(conn => ({
                source: conn.source,
                target: conn.target,
                strength: conn.strength || 0.5,
                type: conn.type || 'unknown',
                commonTags: conn.commonTags || [],
                distance: Math.max(100, 250 - (conn.strength * 150))
            }));

        console.log("Created links:", links.length);
        console.log("Sample link:", links[0]);

        return { nodes, links };
    };

    // D3 visualization effect
    useEffect(() => {
        console.log("Effect triggered with data:", data);
        console.log("connectionsData prop:", connectionsData);

        if (!data || !data.notebooks) {
            console.log("No data available for visualization");
            return;
        }

        const { nodes, links } = processDataForVisualization();

        if (nodes.length === 0) {
            console.log("No nodes to render - showing empty state");
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

        console.log("Rendering visualization with", nodes.length, "nodes and", links.length, "links");

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const { width, height } = dimensions;
        const margin = { top: 40, right: 40, bottom: 40, left: 40 };

        svg.attr("width", width).attr("height", height);

        // Add background
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "#fafafa");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Create color scale
        const allTags = [...new Set(nodes.flatMap(n => n.tags))];
        const colorScale = d3.scaleOrdinal()
            .domain(allTags.concat(['uncategorized']))
            .range([
                '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
                '#8b5cf6', '#f97316', '#ec4899', '#84cc16', '#6366f1',
                '#14b8a6', '#f43f5e', '#a855f7', '#22c55e', '#6b7280'
            ]);

        console.log("Color scale domain:", colorScale.domain());

        // Create force simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links)
                .id(d => d.id)
                .distance(d => d.distance)
                .strength(0.4)
            )
            .force("charge", d3.forceManyBody()
                .strength(-500)
            )
            .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
            .force("collision", d3.forceCollide()
                .radius(d => d.size + 20)
                .strength(0.9)
            );

        // Create links
        const link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", d => d.type === 'explicit' ? '#ef4444' : '#6b7280')
            .attr("stroke-opacity", d => d.type === 'explicit' ? 0.9 : 0.6)
            .attr("stroke-width", d => Math.max(3, d.strength * 8))
            .style("cursor", "pointer");

        // Create nodes
        const node = g.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", d => d.size)
            .attr("fill", d => colorScale(d.group))
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 4)
            .style("cursor", "pointer")
            .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.25))")
            .on("mouseover", function (event, d) {
                setHoveredNode(d);
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", d.size * 1.3)
                    .attr("stroke-width", 6)
                    .style("filter", "drop-shadow(0 8px 16px rgba(0,0,0,0.4))");
            })
            .on("mouseout", function (event, d) {
                setHoveredNode(null);
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", d.size)
                    .attr("stroke-width", 4)
                    .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.25))");
            })
            .on("click", function (event, d) {
                event.stopPropagation();
                setSelectedNode(selectedNode?.id === d.id ? null : d);
            })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Add labels
        const labels = g.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes)
            .enter().append("text")
            .text(d => {
                const title = d.title || 'Untitled';
                return title.length > 25 ? title.substring(0, 25) + "..." : title;
            })
            .attr("font-size", "13px")
            .attr("font-family", "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
            .attr("fill", "#1f2937")
            .attr("font-weight", "600")
            .attr("text-anchor", "middle")
            .attr("dy", d => d.size + 30)
            .style("pointer-events", "none")
            .style("user-select", "none")
            .style("text-shadow", "2px 2px 4px rgba(255,255,255,0.9)");

        // Add word count indicators
        const wordCountLabels = g.append("g")
            .attr("class", "word-counts")
            .selectAll("text")
            .data(nodes)
            .enter().append("text")
            .text(d => {
                if (d.wordCount > 1000) return `${Math.round(d.wordCount / 1000)}k`;
                if (d.wordCount > 100) return `${Math.round(d.wordCount / 100)}00+`;
                if (d.wordCount > 0) return d.wordCount;
                return "0";
            })
            .attr("font-size", "11px")
            .attr("font-family", "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
            .attr("fill", "#ffffff")
            .attr("font-weight", "700")
            .attr("text-anchor", "middle")
            .attr("dy", "4px")
            .style("pointer-events", "none")
            .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)");

        // Update positions on simulation tick
        simulation.on("tick", () => {
            const padding = 80;

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

            labels
                .attr("x", d => d.x)
                .attr("y", d => d.y);

            wordCountLabels
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });

        // Add zoom and pan
        const zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Reset zoom button
        svg.append("rect")
            .attr("x", width - 120)
            .attr("y", 15)
            .attr("width", 100)
            .attr("height", 35)
            .attr("fill", "#3b82f6")
            .attr("rx", 8)
            .style("cursor", "pointer")
            .on("click", () => {
                svg.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity
                );
            });

        svg.append("text")
            .attr("x", width - 70)
            .attr("y", 38)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "13px")
            .attr("font-weight", "600")
            .style("pointer-events", "none")
            .text("Reset Zoom");

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

    }, [connectionsData, data, searchTerm, categoryFilter, sortBy, minSimilarity, dimensions]);

    return (
        <div ref={containerRef} style={styles.container}>
            <div style={styles.visualizationContainer}>
                <svg ref={svgRef} style={styles.svg}></svg>

                {/* Show data source indicator */}
                <div style={styles.dataSourceIndicator}>
                    <span style={hasRealData ? styles.realDataText : styles.sampleDataText}>
                        {hasRealData ? `✅ Real Data: ${data.notebooks.length} notebooks` : '📊 Sample Data'}
                    </span>
                </div>

                {/* Tooltip for hovered node */}
                {hoveredNode && (
                    <div style={styles.tooltip}>
                        <h4 style={styles.tooltipTitle}>{hoveredNode.title}</h4>
                        <p style={styles.tooltipText}>
                            <strong>Tags:</strong> {hoveredNode.tags.length > 0 ? hoveredNode.tags.join(', ') : 'No tags'}
                        </p>
                        <p style={styles.tooltipText}>
                            <strong>Words:</strong> {hoveredNode.wordCount.toLocaleString()}
                        </p>
                        <p style={styles.tooltipText}>
                            <strong>Category:</strong> {hoveredNode.group}
                        </p>
                    </div>
                )}

                {/* Selected node details panel */}
                {selectedNode && (
                    <div style={styles.detailsPanel}>
                        <div style={styles.detailsHeader}>
                            <h3 style={styles.detailsTitle}>{selectedNode.title}</h3>
                            <button
                                onClick={() => setSelectedNode(null)}
                                style={styles.closeButton}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>
                        <div style={styles.detailsContent}>
                            <div style={styles.detailSection}>
                                <h4 style={styles.detailSectionTitle}>Overview</h4>
                                <p style={styles.detailItem}>
                                    <span style={styles.detailLabel}>Tags:</span>
                                    <span style={styles.detailValue}>
                                        {selectedNode.tags.length > 0 ? selectedNode.tags.join(', ') : 'No tags'}
                                    </span>
                                </p>
                                <p style={styles.detailItem}>
                                    <span style={styles.detailLabel}>Word Count:</span>
                                    <span style={styles.detailValue}>{selectedNode.wordCount.toLocaleString()}</span>
                                </p>
                                <p style={styles.detailItem}>
                                    <span style={styles.detailLabel}>Primary Category:</span>
                                    <span style={styles.detailValue}>{selectedNode.group}</span>
                                </p>
                            </div>

                            {/* Connected notebooks */}
                            {data.connections && (
                                <div style={styles.detailSection}>
                                    <h4 style={styles.detailSectionTitle}>Connected Notebooks</h4>
                                    <div style={styles.connectionsList}>
                                        {data.connections
                                            .filter(conn => conn.source === selectedNode.id || conn.target === selectedNode.id)
                                            .map((conn, index) => {
                                                const connectedId = conn.source === selectedNode.id ? conn.target : conn.source;
                                                const connectedNotebook = data.notebooks.find(nb => nb.notebookId === connectedId);
                                                if (!connectedNotebook) return null;

                                                return (
                                                    <div key={index} style={styles.connectionItem}>
                                                        <div style={styles.connectionInfo}>
                                                            <span style={styles.connectionTitle}>{connectedNotebook.title}</span>
                                                            <span style={styles.connectionMeta}>
                                                                {conn.type === 'explicit' ? 'Explicit Link' : 'Tag Similarity'} •
                                                                {Math.round(conn.strength * 100)}% match
                                                            </span>
                                                            {conn.commonTags && conn.commonTags.length > 0 && (
                                                                <span style={styles.connectionTags}>
                                                                    Common tags: {conn.commonTags.join(', ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={styles.connectionStrength}>
                                                            <div
                                                                style={{
                                                                    ...styles.strengthBar,
                                                                    width: `${conn.strength * 100}%`,
                                                                    backgroundColor: conn.type === 'explicit' ? '#ef4444' : '#3b82f6'
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>

                                    {data.connections.filter(conn =>
                                        conn.source === selectedNode.id || conn.target === selectedNode.id
                                    ).length === 0 && (
                                            <p style={styles.noConnections}>
                                                This notebook has no connections to other notebooks.
                                            </p>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Visualization stats overlay */}
                <div style={styles.controlsOverlay}>
                    <div style={styles.controlItem}>
                        <span style={styles.controlLabel}>Nodes:</span>
                        <span style={styles.controlValue}>
                            {processDataForVisualization().nodes.length}
                        </span>
                    </div>
                    <div style={styles.controlItem}>
                        <span style={styles.controlLabel}>Links:</span>
                        <span style={styles.controlValue}>
                            {processDataForVisualization().links.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div style={styles.legend}>
                <h4 style={styles.legendTitle}>Topic Map</h4>
                <div style={styles.legendItems}>
                    <div style={styles.legendCategory}>
                        <h5 style={styles.legendCategoryTitle}>Nodes</h5>
                        <div style={styles.legendItem}>
                            <div style={{ ...styles.legendColor, backgroundColor: '#3b82f6' }}></div>
                            <span style={styles.legendText}>Notebooks by primary tag</span>
                        </div>
                        <div style={styles.legendItem}>
                            <div style={{ ...styles.legendDot, width: '16px', height: '16px' }}></div>
                            <span style={styles.legendText}>Size = word count</span>
                        </div>
                    </div>

                    <div style={styles.legendCategory}>
                        <h5 style={styles.legendCategoryTitle}>Connections</h5>
                        <div style={styles.legendItem}>
                            <div style={{ ...styles.legendLine, backgroundColor: '#ef4444' }}></div>
                            <span style={styles.legendText}>Explicit Links</span>
                        </div>
                        <div style={styles.legendItem}>
                            <div style={{ ...styles.legendLine, backgroundColor: '#6b7280' }}></div>
                            <span style={styles.legendText}>Tag Similarity</span>
                        </div>
                    </div>
                </div>

                <div style={styles.legendInstructions}>
                    <p style={styles.legendNote}>
                        <strong>How to use:</strong><br />
                        • Drag nodes to move them<br />
                        • Hover for quick details<br />
                        • Click for full information<br />
                        • Scroll to zoom in/out<br />
                        • Use "Reset Zoom" to center
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        gap: '1rem',
        height: '100%',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    },
    visualizationContainer: {
        flex: 1,
        position: 'relative',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        background: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
        minHeight: '500px'
    },
    svg: {
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: 'grab'
    },
    dataSourceIndicator: {
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        zIndex: 15,
        backdropFilter: 'blur(8px)'
    },
    realDataText: {
        fontSize: '0.875rem',
        color: '#059669',
        fontWeight: '600'
    },
    sampleDataText: {
        fontSize: '0.875rem',
        color: '#3b82f6',
        fontWeight: '500'
    },
    tooltip: {
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '1rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        pointerEvents: 'none',
        zIndex: 20,
        maxWidth: '280px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
    },
    tooltipTitle: {
        margin: '0 0 0.75rem 0',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#ffffff'
    },
    tooltipText: {
        margin: '0.5rem 0',
        fontSize: '0.875rem',
        lineHeight: '1.4'
    },
    detailsPanel: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        width: '340px',
        maxHeight: 'calc(100% - 2rem)',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        zIndex: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    },
    detailsHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem',
        borderBottom: '1px solid #f3f4f6',
        background: '#fafafa'
    },
    detailsTitle: {
        margin: 0,
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        marginRight: '1rem'
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        color: '#6b7280',
        cursor: 'pointer',
        padding: '0',
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        transition: 'all 0.2s ease'
    },
    detailsContent: {
        padding: '1.25rem',
        fontSize: '0.875rem',
        lineHeight: '1.5',
        overflow: 'auto',
        flex: 1
    },
    detailSection: {
        marginBottom: '1.5rem'
    },
    detailSectionTitle: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#111827',
        margin: '0 0 0.75rem 0'
    },
    detailItem: {
        margin: '0.5rem 0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem'
    },
    detailLabel: {
        fontWeight: '600',
        color: '#374151',
        minWidth: '80px'
    },
    detailValue: {
        color: '#6b7280',
        flex: 1
    },
    connectionsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    connectionItem: {
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
    },
    connectionInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        marginBottom: '0.5rem'
    },
    connectionTitle: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#111827'
    },
    connectionMeta: {
        fontSize: '0.75rem',
        color: '#6b7280'
    },
    connectionTags: {
        fontSize: '0.75rem',
        color: '#3b82f6',
        fontStyle: 'italic'
    },
    connectionStrength: {
        height: '4px',
        background: '#e5e7eb',
        borderRadius: '2px',
        overflow: 'hidden'
    },
    strengthBar: {
        height: '100%',
        borderRadius: '2px',
        transition: 'width 0.3s ease'
    },
    noConnections: {
        color: '#6b7280',
        fontStyle: 'italic',
        fontSize: '0.875rem',
        textAlign: 'center',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px'
    },
    controlsOverlay: {
        position: 'absolute',
        bottom: '1rem',
        left: '1rem',
        display: 'flex',
        gap: '1rem',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(8px)'
    },
    controlItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    controlLabel: {
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '#6b7280'
    },
    controlValue: {
        fontSize: '0.875rem',
        fontWeight: '700',
        color: '#111827'
    },
    legend: {
        width: '240px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '1.25rem',
        height: 'fit-content',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
    },
    legendTitle: {
        margin: '0 0 1rem 0',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#111827'
    },
    legendItems: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1.5rem'
    },
    legendCategory: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    },
    legendCategoryTitle: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#374151',
        margin: '0 0 0.5rem 0'
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.75rem',
        color: '#6b7280'
    },
    legendText: {
        fontSize: '0.75rem',
        color: '#6b7280'
    },
    legendColor: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        flexShrink: 0
    },
    legendDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#9ca3af',
        flexShrink: 0
    },
    legendLine: {
        width: '20px',
        height: '3px',
        borderRadius: '2px',
        flexShrink: 0
    },
    legendInstructions: {
        borderTop: '1px solid #f3f4f6',
        paddingTop: '1rem'
    },
    legendNote: {
        fontSize: '0.75rem',
        color: '#6b7280',
        lineHeight: '1.4',
        margin: 0
    }
};

export default TopicMapVisualization;