/**
 * Viewed notifications tracking utility.
 * Uses localStorage to persist which notifications have been viewed.
 */

const STORAGE_KEY = 'viewed_notifications';

/**
 * Get the set of viewed notification IDs from localStorage.
 * @returns {Set<string>} Set of viewed notification IDs
 */
export function getViewedIds() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (err) {
    console.error('[ViewedTracker] Failed to read localStorage:', err);
  }
  return new Set();
}

/**
 * Mark a notification as viewed.
 * @param {string} notificationId - The notification ID to mark as viewed
 */
export function markAsViewed(notificationId) {
  const viewed = getViewedIds();
  viewed.add(notificationId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...viewed]));
  } catch (err) {
    console.error('[ViewedTracker] Failed to write localStorage:', err);
  }
}

/**
 * Mark multiple notifications as viewed.
 * @param {string[]} ids - Array of notification IDs
 */
export function markAllAsViewed(ids) {
  const viewed = getViewedIds();
  ids.forEach((id) => viewed.add(id));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...viewed]));
  } catch (err) {
    console.error('[ViewedTracker] Failed to write localStorage:', err);
  }
}

/**
 * Check if a notification has been viewed.
 * @param {string} notificationId - The notification ID to check
 * @returns {boolean} True if viewed
 */
export function isViewed(notificationId) {
  return getViewedIds().has(notificationId);
}

/**
 * Get the count of unviewed notifications.
 * @param {Array} notifications - All notifications
 * @returns {number} Count of unviewed notifications
 */
export function getUnviewedCount(notifications) {
  const viewed = getViewedIds();
  return notifications.filter((n) => !viewed.has(n.ID)).length;
}
