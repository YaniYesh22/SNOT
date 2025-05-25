// src/services/topicMapService.js

const API_URL = "https://YOUR-API-GATEWAY-URL/getMapping/connections"; // 👈 עדכן כאן את ה-URL שלך

/**
 * מקבל את מפת המחברות (connections בין מחברות)
 * @param {string} userEmail - המייל של המשתמש המחובר
 * @returns {Promise<Object>}
 */
export async function getTopicMap(userEmail) {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: {
      "X-User-Email": userEmail, // 👈 חובה! לשים את המייל של המשתמש
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Topic Map data");
  }

  // בחלק מה-API-ים ייתכן שהגוף עטוף במחרוזת JSON
  const data = await res.json();
  return typeof data.body === "string" ? JSON.parse(data.body) : data;
}
