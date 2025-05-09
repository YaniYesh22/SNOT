import React, { useEffect, useState } from 'react';

const TopicMapVisualization = () => {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading data from an API
  useEffect(() => {
    // Sample topic data - in a real app, this would come from an API
    const topicData = {
      nodes: [
        { id: 1, label: "Machine Learning", category: "AI", size: 25 },
        { id: 2, label: "Neural Networks", category: "AI", size: 20 },
        { id: 3, label: "Deep Learning", category: "AI", size: 18 },
        { id: 4, label: "Natural Language Processing", category: "AI", size: 22 },
        { id: 5, label: "Computer Vision", category: "AI", size: 15 },
        { id: 6, label: "Reinforcement Learning", category: "AI", size: 12 },
        { id: 7, label: "Transformers", category: "Models", size: 18 },
        { id: 8, label: "GANs", category: "Models", size: 10 },
      ],
      links: [
        { source: 1, target: 2, strength: 0.7 },
        { source: 1, target: 3, strength: 0.8 },
        { source: 1, target: 4, strength: 0.5 },
        { source: 1, target: 5, strength: 0.6 },
        { source: 1, target: 6, strength: 0.4 },
        { source: 2, target: 3, strength: 0.9 },
        { source: 3, target: 7, strength: 0.8 },
        { source: 5, target: 8, strength: 0.6 },
        { source: 4, target: 7, strength: 0.7 },
      ]
    };

    // Simulate API delay
    setTimeout(() => {
      setNodes(topicData.nodes);
      setLinks(topicData.links);
      setIsLoading(false);
    }, 800);
  }, []);

  const handleNodeClick = (node) => {
    setSelectedTopic(node);
  };

  // Generate positions for a simple force-directed layout
  const generatePositions = () => {
    const width = 800;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    
    // Assign positions in a circular layout
    return nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { ...node, x, y };
    });
  };

  const positionedNodes = generatePositions();

  // Get color based on category
  const getCategoryColor = (category) => {
    const colorMap = {
      'AI': '#4f46e5',
      'Models': '#7c3aed',
      'Data': '#0ea5e9',
      'Default': '#6b7280'
    };
    return colorMap[category] || colorMap.Default;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg text-gray-500">Loading topic map...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white rounded-lg shadow p-4 h-96 relative overflow-hidden">
        {/* SVG for the graph */}
        <svg width="100%" height="100%" viewBox="0 0 800 400">
          {/* Links */}
          {links.map((link, index) => {
            const sourceNode = positionedNodes.find(n => n.id === link.source);
            const targetNode = positionedNodes.find(n => n.id === link.target);
            if (!sourceNode || !targetNode) return null;
            
            return (
              <line
                key={`link-${index}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="#d1d5db"
                strokeWidth={link.strength * 3}
                strokeOpacity={0.6}
              />
            );
          })}
          
          {/* Nodes */}
          {positionedNodes.map(node => (
            <g 
              key={`node-${node.id}`}
              transform={`translate(${node.x},${node.y})`}
              onClick={() => handleNodeClick(node)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                r={node.size}
                fill={getCategoryColor(node.category)}
                opacity={selectedTopic && selectedTopic.id === node.id ? 1 : 0.7}
                stroke={selectedTopic && selectedTopic.id === node.id ? "#000" : "none"}
                strokeWidth={2}
              />
              <text
                textAnchor="middle"
                dy=".3em"
                fill="white"
                fontSize={node.size * 0.4}
                fontWeight="bold"
              >
                {node.label.split(' ').map((word, i) => 
                  <tspan 
                    key={i} 
                    x="0" 
                    dy={i === 0 ? 0 : "1.2em"}
                    textAnchor="middle"
                  >
                    {word}
                  </tspan>
                )}
              </text>
            </g>
          ))}
        </svg>
      </div>
      
      {/* Topic details panel */}
      <div className="bg-white rounded-lg shadow p-4">
        {selectedTopic ? (
          <div>
            <h3 className="text-lg font-semibold">{selectedTopic.label}</h3>
            <div className="flex items-center mt-2">
              <span 
                className="px-2 py-1 text-xs rounded-full text-white"
                style={{ backgroundColor: getCategoryColor(selectedTopic.category) }}
              >
                {selectedTopic.category}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                {links.filter(l => l.source === selectedTopic.id || l.target === selectedTopic.id).length} connections
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Click on different nodes to explore connections between topics in your notebooks.
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Click on a topic to see more details</p>
        )}
      </div>
    </div>
  );
};

export default TopicMapVisualization;