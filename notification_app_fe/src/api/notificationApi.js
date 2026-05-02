/**
 * API service for the Campus Notification app.
 * Handles authentication and all API calls to the evaluation server.
 */

const API_BASE = '/evaluation-service';

const AUTH_CREDENTIALS = {
  email: 'ma6864@srmist.edu.in',
  name: 'mushkan agarwal',
  rollNo: 'ra2311033010160',
  accessCode: 'QkbpxH',
  clientID: '346b9749-66ed-4ae2-a79d-2d9b336f44e3',
  clientSecret: 'HeEwYHNpMYZCBaPn',
};

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Gets a valid auth token, refreshing if necessary.
 * @returns {Promise<string>} Bearer access token
 */
export async function getAuthToken() {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && tokenExpiry > now + 60) {
    return cachedToken;
  }

  const response = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(AUTH_CREDENTIALS),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = data.expires_in;

  return cachedToken;
}

/**
 * Fetches notifications from the evaluation server.
 * 
 * @param {Object} params - Query parameters
 * @param {number} [params.limit] - Max notifications to return
 * @param {number} [params.page] - Page number for pagination
 * @param {string} [params.notification_type] - Filter by type: 'Event', 'Result', 'Placement'
 * @returns {Promise<Object>} { notifications: Array }
 */
export async function fetchNotifications({ limit, page, notification_type } = {}) {
  const token = await getAuthToken();

  const params = new URLSearchParams();
  if (limit) params.set('limit', limit);
  if (page) params.set('page', page);
  if (notification_type) params.set('notification_type', notification_type);

  const queryString = params.toString();
  const url = `${API_BASE}/notifications${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status}`);
  }

  return await response.json();
}

/**
 * Sends a log entry to the evaluation server.
 * Used by the logging middleware integration.
 * 
 * @param {Object} logEntry - { stack, level, package, message }
 * @returns {Promise<Object>} Server response
 */
export async function sendLog(logEntry) {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE}/logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(logEntry),
  });

  if (!response.ok) {
    console.error(`Log API error: ${response.status}`);
    return null;
  }

  return await response.json();
}
