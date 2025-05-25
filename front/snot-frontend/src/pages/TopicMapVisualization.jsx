import React, { useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

// הכנס כאן את ה-API Gateway שלך
const API_URL = "https://YOUR-API-GATEWAY-URL/getMapping/connections";
const USER_EMAIL = "bengurevich@gmail.com"; // תוכל להחליף לדינאמי לפי היוזר המחובר

export default function TopicMapVisualization() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    // קריאת API
    fetch(API_URL, {
      headers: {
        "X-User-Email": USER_EMAIL,
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(res => {
        // פיענוח (אם התשובה עטופה ב-body)
        const data = typeof res.body === "string" ? JSON.parse(res.body) : res;
        // בניית nodes ו-links לגרף
        const nodes = data.notebooks.map(nb => ({
          id: nb.notebookId,
          label: nb.title,
          tags: nb.tags,
          val: Math.max(3, nb.tags.length * 2 + 4) // קובע את גודל הנקודה, גמיש
        }));
        const links = data.connections.map(link => ({
          source: link.source,
          target: link.target,
          type: link.type,
          strength: link.strength,
          commonTags: link.commonTags || [],
          label: link.type === "explicit"
            ? "ידני"
            : `תגיות משותפות: ${link.commonTags?.join(", ") || ""}`
        }));
        setGraphData({ nodes, links });
        setLoading(false);
      })
      .catch(err => {
        setApiError("שגיאה בטעינת מפת החיבורים. נסה שוב.");
        setLoading(false);
        console.error(err);
      });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>טוען את המפה...</div>;
  if (apiError) return <div style={{ color: "red" }}>{apiError}</div>;
  if (!graphData.nodes.length) return <div>לא נמצאו מחברות להצגה.</div>;

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel={node =>
          `<b>${node.label}</b><br/>תגיות: ${node.tags.join(", ")}`
        }
        nodeAutoColorBy="tags"
        nodeCanvasObject={(node, ctx, globalScale) => {
          // ציור כותרת על הצומת
          const label = node.label;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Arial`;
          ctx.fillStyle = "black";
          ctx.textAlign = "center";
          ctx.fillText(label, node.x, node.y + 10);
        }}
        linkWidth={link => (link.type === "explicit" ? 3 : 2 + link.strength * 3)}
        linkColor={link => (link.type === "explicit" ? "#3b82f6" : "#6b7280")}
        linkLabel={link => link.label}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        onNodeClick={node => {
          alert(`מחברת: ${node.label}\nתגיות: ${node.tags.join(", ")}`);
        }}
      />
    </div>
  );
}
