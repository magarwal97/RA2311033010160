/**
 * Priority calculation utility for notifications.
 * Determines notification importance based on type weight and recency.
 */

// Priority weights: Placement > Result > Event
const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

/**
 * Calculate priority score for a notification.
 * Formula: typeWeight * 1000 + recencyScore (0-999)
 * 
 * @param {Object} notification - Notification object
 * @param {number} minTs - Minimum timestamp in the batch (ms)
 * @param {number} maxTs - Maximum timestamp in the batch (ms)
 * @returns {number} Priority score
 */
export function calculatePriority(notification, minTs, maxTs) {
  const typeWeight = TYPE_WEIGHTS[notification.Type] || 0;
  const timestamp = new Date(notification.Timestamp).getTime();

  const timeRange = maxTs - minTs;
  const recencyScore = timeRange > 0
    ? Math.round(((timestamp - minTs) / timeRange) * 999)
    : 500;

  return typeWeight * 1000 + recencyScore;
}

/**
 * Get the top N priority notifications from a list.
 * 
 * @param {Array} notifications - All notifications
 * @param {number} topN - Number of top items to return
 * @returns {Array} Sorted top N notifications with priority scores
 */
export function getTopNPriority(notifications, topN) {
  if (!notifications || notifications.length === 0) return [];

  // Find timestamp range
  let minTs = Infinity, maxTs = -Infinity;
  for (const notif of notifications) {
    const ts = new Date(notif.Timestamp).getTime();
    if (ts < minTs) minTs = ts;
    if (ts > maxTs) maxTs = ts;
  }

  // Calculate priorities and sort
  const withPriority = notifications.map((notif) => ({
    ...notif,
    priority: calculatePriority(notif, minTs, maxTs),
  }));

  withPriority.sort((a, b) => b.priority - a.priority);

  return withPriority.slice(0, topN);
}

/**
 * Get the type weight for display purposes.
 * @param {string} type - Notification type
 * @returns {number} Weight value
 */
export function getTypeWeight(type) {
  return TYPE_WEIGHTS[type] || 0;
}
