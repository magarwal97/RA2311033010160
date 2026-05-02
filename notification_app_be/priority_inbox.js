/**
 * Priority Inbox - Campus Notifications Microservice (Stage 1)
 * 
 * Fetches notifications from the evaluation server and displays
 * the top N most important unread notifications based on:
 *   1. Type Weight: Placement (3) > Result (2) > Event (1)
 *   2. Recency: More recent notifications rank higher
 * 
 * Priority Score = typeWeight * 1000 + recencyScore
 * 
 * This approach uses a Min-Heap (size N) for efficient top-N
 * extraction, giving O(n log N) time complexity where n = total
 * notifications and N = desired top count.
 * 
 * Usage: node priority_inbox.js [topN]
 *   e.g., node priority_inbox.js 10
 */

import { Log, configureLogger } from '../logging_middleware/index.js';

// ============================================================
// Configuration
// ============================================================

const API_BASE = 'http://20.207.122.201/evaluation-service';
const AUTH_CREDENTIALS = {
  email: 'ma6864@srmist.edu.in',
  name: 'mushkan agarwal',
  rollNo: 'ra2311033010160',
  accessCode: 'QkbpxH',
  clientID: '346b9749-66ed-4ae2-a79d-2d9b336f44e3',
  clientSecret: 'HeEwYHNpMYZCBaPn',
};

// Priority weights for notification types (higher = more important)
const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

// ============================================================
// Min-Heap Implementation (for efficient Top-N extraction)
// ============================================================

/**
 * Min-Heap that maintains the top N highest-priority items.
 * By using a min-heap of size N, we can efficiently process
 * a stream of notifications:
 * - If heap size < N: insert directly
 * - If new item's priority > heap minimum: replace min and heapify
 * - Otherwise: skip (item doesn't make top N)
 * 
 * Time: O(n log N) for n notifications, N = desired top count
 * Space: O(N)
 */
class MinHeap {
  constructor(maxSize) {
    this.heap = [];
    this.maxSize = maxSize;
  }

  /** Get parent index */
  parent(i) { return Math.floor((i - 1) / 2); }

  /** Get left child index */
  left(i) { return 2 * i + 1; }

  /** Get right child index */
  right(i) { return 2 * i + 2; }

  /** Swap two elements in the heap */
  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  /** Bubble up element at index i to restore heap property */
  heapifyUp(i) {
    while (i > 0 && this.heap[this.parent(i)].priority > this.heap[i].priority) {
      this.swap(i, this.parent(i));
      i = this.parent(i);
    }
  }

  /** Push down element at index i to restore heap property */
  heapifyDown(i) {
    const size = this.heap.length;
    let smallest = i;

    const l = this.left(i);
    const r = this.right(i);

    if (l < size && this.heap[l].priority < this.heap[smallest].priority) {
      smallest = l;
    }
    if (r < size && this.heap[r].priority < this.heap[smallest].priority) {
      smallest = r;
    }

    if (smallest !== i) {
      this.swap(i, smallest);
      this.heapifyDown(smallest);
    }
  }

  /** Get the minimum priority element (root of min-heap) */
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Try to insert an item into the top-N heap.
   * Returns true if inserted, false if priority too low.
   */
  offer(item) {
    if (this.heap.length < this.maxSize) {
      // Heap not full yet - just insert
      this.heap.push(item);
      this.heapifyUp(this.heap.length - 1);
      return true;
    }

    // Heap full - compare with minimum
    if (item.priority > this.heap[0].priority) {
      // Replace the minimum with new item
      this.heap[0] = item;
      this.heapifyDown(0);
      return true;
    }

    return false; // Not in top N
  }

  /** Extract all items sorted by priority (highest first) */
  extractSorted() {
    return [...this.heap].sort((a, b) => b.priority - a.priority);
  }

  get size() {
    return this.heap.length;
  }
}

// ============================================================
// Authentication
// ============================================================

/**
 * Fetches a fresh Bearer token from the auth endpoint.
 * @returns {Promise<string|null>} Access token or null on failure
 */
async function getAuthToken() {
  try {
    const response = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(AUTH_CREDENTIALS),
    });

    if (!response.ok) {
      throw new Error(`Auth failed: ${response.status}`);
    }

    const data = await response.json();
    await Log('backend', 'info', 'auth', 'Auth token obtained successfully');
    return data.access_token;
  } catch (error) {
    await Log('backend', 'error', 'auth', `Token fetch failed: ${error.message}`.substring(0, 48));
    return null;
  }
}

// ============================================================
// Notification Fetching
// ============================================================

/**
 * Fetches all notifications from the evaluation server.
 * @param {string} token - Bearer authentication token
 * @returns {Promise<Array>} Array of notification objects
 */
async function fetchNotifications(token) {
  try {
    const response = await fetch(`${API_BASE}/notifications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const notifications = data.notifications || [];

    await Log('backend', 'info', 'service', `Fetched ${notifications.length} notifications`);
    return notifications;
  } catch (error) {
    await Log('backend', 'error', 'service', `Fetch failed: ${error.message}`.substring(0, 48));
    return [];
  }
}

// ============================================================
// Priority Calculation
// ============================================================

/**
 * Calculates a priority score for a notification.
 * 
 * Formula: priority = typeWeight * 1000 + recencyScore
 * 
 * - typeWeight: Placement(3) > Result(2) > Event(1)
 * - recencyScore: Normalized timestamp (more recent = higher score)
 *   Calculated as seconds since the earliest notification in the batch,
 *   normalized to 0-999 range.
 * 
 * The multiplier of 1000 ensures type always dominates,
 * with recency as a tiebreaker within the same type.
 * 
 * @param {Object} notification - The notification object
 * @param {number} minTimestamp - Earliest timestamp in the batch (ms)
 * @param {number} maxTimestamp - Latest timestamp in the batch (ms)
 * @returns {number} Priority score (higher = more important)
 */
function calculatePriority(notification, minTimestamp, maxTimestamp) {
  const typeWeight = TYPE_WEIGHTS[notification.Type] || 0;
  const timestamp = new Date(notification.Timestamp).getTime();

  // Normalize recency to 0-999 range
  const timeRange = maxTimestamp - minTimestamp;
  const recencyScore = timeRange > 0
    ? Math.round(((timestamp - minTimestamp) / timeRange) * 999)
    : 500; // If all same timestamp, neutral score

  return typeWeight * 1000 + recencyScore;
}

// ============================================================
// Priority Inbox Core Logic
// ============================================================

/**
 * Finds the top N highest-priority notifications using a Min-Heap.
 * 
 * Algorithm:
 * 1. Parse all timestamps to find min/max for recency normalization
 * 2. Initialize a Min-Heap of capacity N
 * 3. For each notification:
 *    a. Calculate priority score
 *    b. If heap not full, insert
 *    c. If priority > heap minimum, replace minimum
 *    d. Otherwise skip
 * 4. Extract sorted results from heap
 * 
 * Complexity: O(n log N) time, O(N) space
 * 
 * @param {Array} notifications - All notifications from API
 * @param {number} topN - Number of top notifications to return
 * @returns {Array} Top N notifications sorted by priority (highest first)
 */
function getTopNPriority(notifications, topN) {
  if (notifications.length === 0) return [];

  // Step 1: Find timestamp range for recency normalization
  let minTs = Infinity, maxTs = -Infinity;
  for (const notif of notifications) {
    const ts = new Date(notif.Timestamp).getTime();
    if (ts < minTs) minTs = ts;
    if (ts > maxTs) maxTs = ts;
  }

  // Step 2: Initialize Min-Heap with capacity N
  const heap = new MinHeap(topN);

  // Step 3: Process each notification
  for (const notif of notifications) {
    const priority = calculatePriority(notif, minTs, maxTs);
    heap.offer({ ...notif, priority });
  }

  // Step 4: Extract sorted results
  return heap.extractSorted();
}

// ============================================================
// Display Formatting
// ============================================================

/**
 * Formats and prints the priority inbox results to console.
 * @param {Array} prioritized - Sorted notifications with priority scores
 * @param {number} topN - Requested top count
 */
function displayResults(prioritized, topN) {
  console.log('\n' + '='.repeat(80));
  console.log(`  PRIORITY INBOX — Top ${topN} Notifications`);
  console.log('='.repeat(80));

  if (prioritized.length === 0) {
    console.log('\n  No notifications found.\n');
    return;
  }

  console.log(
    '\n  ' +
    'Rank'.padEnd(6) +
    'Type'.padEnd(12) +
    'Priority'.padEnd(10) +
    'Message'.padEnd(30) +
    'Timestamp'
  );
  console.log('  ' + '-'.repeat(76));

  prioritized.forEach((notif, index) => {
    const rank = `#${index + 1}`.padEnd(6);
    const type = notif.Type.padEnd(12);
    const priority = String(notif.priority).padEnd(10);
    const message = notif.Message.padEnd(30);
    const timestamp = notif.Timestamp;

    console.log(`  ${rank}${type}${priority}${message}${timestamp}`);
  });

  console.log('\n' + '='.repeat(80));

  // Summary by type
  const typeCounts = {};
  for (const notif of prioritized) {
    typeCounts[notif.Type] = (typeCounts[notif.Type] || 0) + 1;
  }

  console.log('\n  Summary:');
  console.log(`  Total displayed: ${prioritized.length}`);
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => (TYPE_WEIGHTS[b[0]] || 0) - (TYPE_WEIGHTS[a[0]] || 0))) {
    console.log(`    ${type}: ${count} (weight: ${TYPE_WEIGHTS[type]})`);
  }
  console.log();
}

// ============================================================
// Main Entry Point
// ============================================================

async function main() {
  const topN = parseInt(process.argv[2]) || 10;

  console.log('\n  Campus Notifications - Priority Inbox');
  console.log(`  Finding top ${topN} priority notifications...\n`);

  // Configure logging (console only until we get a token)
  configureLogger({ enableConsoleOutput: true, enableRemoteLogging: false });

  // Step 1: Authenticate
  console.log('  [1/3] Authenticating...');
  const token = await getAuthToken();
  if (!token) {
    console.error('  ERROR: Failed to obtain auth token. Exiting.');
    process.exit(1);
  }

  // Now enable remote logging with the token
  configureLogger({ token, enableRemoteLogging: true });
  console.log('  [1/3] Authenticated ✓');

  // Step 2: Fetch notifications
  console.log('  [2/3] Fetching notifications...');
  const notifications = await fetchNotifications(token);
  if (notifications.length === 0) {
    console.error('  ERROR: No notifications returned.');
    process.exit(1);
  }
  console.log(`  [2/3] Fetched ${notifications.length} notifications ✓`);

  // Step 3: Prioritize and display
  console.log(`  [3/3] Computing top ${topN} by priority...`);
  const prioritized = getTopNPriority(notifications, topN);
  await Log('backend', 'info', 'service', `Top ${topN} computed from ${notifications.length}`);

  displayResults(prioritized, topN);

  // Log completion
  await Log('backend', 'info', 'service', 'Priority inbox displayed OK');
}

main().catch(async (err) => {
  await Log('backend', 'fatal', 'service', `Fatal: ${err.message}`.substring(0, 48));
  console.error('Fatal error:', err);
  process.exit(1);
});
