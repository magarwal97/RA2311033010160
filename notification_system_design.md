# Notification System Design

## Overview

This document outlines the architecture and design of the Campus Notifications Microservice. The system manages, prioritizes, and displays campus notifications (Placements, Events, Results) with a focus on helping users find the most important information first.

---

## Stage 1

### Problem Statement

The campus notifications application has a high volume of notifications, causing users to lose track of important ones. The product manager requested a **Priority Inbox** that always displays the top N most important unread notifications based on priority.

### Priority Algorithm

Priority is determined by a combination of **type weight** and **recency**:

#### Type Weights (higher = more important)

| Type       | Weight | Rationale                                    |
|------------|--------|----------------------------------------------|
| Placement  | 3      | Career opportunities are time-critical       |
| Result     | 2      | Academic results need prompt attention        |
| Event      | 1      | Events are informational, less urgent         |

#### Priority Score Formula

```
priorityScore = typeWeight × 1000 + recencyScore
```

- **typeWeight**: Integer weight based on notification type (see table above)
- **recencyScore**: Normalized value (0–999) based on timestamp
  - Calculated as: `((timestamp - minTimestamp) / timeRange) × 999`
  - More recent notifications get a higher recency score

The multiplier of 1000 ensures that **type always dominates** the ranking, while **recency acts as a tiebreaker** within the same type. For example:
- A recent Placement (score: 3999) always outranks any Result (max: 2999)
- Among Placements, the most recent one ranks highest

### Data Structure: Min-Heap (Top-N Extraction)

Instead of sorting all notifications (O(n log n)), I use a **Min-Heap of size N** for efficient top-N extraction:

```
Algorithm: Top-N via Min-Heap
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input:  notifications[] (size n), target count N
Output: top N notifications sorted by priority

1. Calculate min/max timestamps for recency normalization
2. Initialize MinHeap with capacity N
3. For each notification:
   a. Compute priorityScore
   b. If heap.size < N → insert into heap
   c. Else if priorityScore > heap.peek() → replace min, heapify down
   d. Else → skip (not in top N)
4. Extract all from heap, sort descending by priority
```

#### Complexity Analysis

| Operation              | Time Complexity | Space Complexity |
|------------------------|-----------------|------------------|
| Process n notifications | O(n log N)      | O(N)             |
| Extract sorted top N   | O(N log N)      | O(N)             |
| **Total**              | **O(n log N)**  | **O(N)**         |

This is more efficient than full sorting O(n log n) when N << n.

### Handling New Notifications Efficiently

When new notifications arrive continuously, the Min-Heap approach is inherently efficient:

1. **Incremental Insertion**: Each new notification is compared against the heap's minimum in O(log N). If it qualifies for top N, it replaces the min — no need to re-process existing items.

2. **Sliding Window**: For time-based priority, we can maintain a sliding window where notifications older than a threshold are evicted, keeping the heap fresh.

3. **Polling Strategy**: The API is polled at intervals. On each poll:
   - New notifications are processed through the heap
   - Stale entries naturally fall out as newer, higher-priority items arrive
   - The heap always reflects the current top N

4. **Future Enhancement - WebSocket**: For real-time updates, a WebSocket connection would push new notifications directly into the heap without polling overhead.

### Implementation

The solution is implemented in `notification_app_be/priority_inbox.js`:

```javascript
// Core function signature
function getTopNPriority(notifications, topN) → Array

// Usage
Log(stack, level, package, message)  // Integrated logging
```

**Key Design Decisions:**
- Min-Heap over simple sort for O(n log N) vs O(n log n) efficiency
- Priority score separates type weight and recency with a 1000x multiplier to prevent recency from overriding type importance
- Integrated with the Logging Middleware for full observability
- Authentication handled automatically with fresh token per run

### Sample Output

```
================================================================================
  PRIORITY INBOX — Top 10 Notifications
================================================================================

  Rank  Type        Priority  Message                       Timestamp
  ----------------------------------------------------------------------------
  #1    Placement   3999      PayPal Holdings Inc. hiring   2026-05-02 05:28:39
  #2    Placement   3717      Amgen Inc. hiring             2026-05-01 22:59:45
  #3    Placement   3629      Microsoft Corporation hiring  2026-05-01 20:58:27
  #4    Placement   3629      Advanced Micro Devices Inc.   2026-05-01 20:58:21
  #5    Placement   3282      PayPal Holdings Inc. hiring   2026-05-01 12:58:09
  #6    Placement   3239      TSMC hiring                   2026-05-01 11:58:45
  #7    Placement   3217      Marriott Int'l Inc. hiring    2026-05-01 11:29:39
  #8    Placement   3130      Booking Holdings Inc. hiring  2026-05-01 09:28:51
  #9    Placement   3044      Marriott Int'l Inc. hiring    2026-05-01 07:29:33
  #10   Result      2391      end-sem                       2026-05-01 15:29:15

  Summary:
  Total displayed: 10
    Placement: 9 (weight: 3)
    Result: 1 (weight: 2)
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │   Pages   │  │Components│  │   State Mgmt      │  │
│  │          │  │          │  │   (React Context)  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │              │
│       └──────────────┼─────────────────┘              │
│                      │                                │
│              ┌───────▼────────┐                       │
│              │   API Layer    │                       │
│              │  (fetch/axios) │                       │
│              └───────┬────────┘                       │
│                      │                                │
│       ┌──────────────┼──────────────┐                │
│       │              │              │                │
│  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐          │
│  │ Logging  │  │  Auth    │  │  Utils   │          │
│  │Middleware│  │ Service  │  │          │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │  Test Server API  │
            │  (Evaluation)     │
            └──────────────────┘
```

## Component Hierarchy

```
App
├── AuthProvider (Context)
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── NotificationBell (with count badge)
│   ├── Routes
│   │   ├── DashboardPage
│   │   │   ├── NotificationSummary
│   │   │   ├── RecentNotifications
│   │   │   └── StatsOverview
│   │   ├── NotificationsPage
│   │   │   ├── NotificationFilters
│   │   │   ├── NotificationList
│   │   │   │   └── NotificationCard
│   │   │   └── Pagination
│   │   └── SettingsPage
│   │       └── NotificationPreferences
│   └── Footer
└── LoggingProvider (Context)
```

## Data Flow

1. **Authentication Flow**:
   - App initializes → fetches auth token from evaluation server
   - Token stored in React Context → available to all components
   - Token auto-refreshes before expiry

2. **Notification Flow**:
   - Components request data through the API layer
   - API layer attaches auth token and makes requests
   - Responses update the application state
   - Components re-render with new data
   - All significant events are captured by the Logging Middleware

3. **Logging Flow**:
   - Application events trigger `Log()` calls
   - Logs are validated (stack, level, package)
   - Sent to both console (dev) and remote server (evaluation)
   - Failed log attempts retry with exponential backoff

## Tech Stack

| Layer         | Technology         |
|---------------|---------------------|
| Framework     | React 18+          |
| Language      | JavaScript         |
| Styling       | Vanilla CSS        |
| State Mgmt    | React Context API  |
| HTTP Client   | Fetch API          |
| Logging       | Custom Middleware   |
| Build Tool    | Vite               |

## API Integration

### Evaluation Server Endpoints

| Endpoint                              | Method | Purpose              |
|---------------------------------------|--------|----------------------|
| `/evaluation-service/register`        | POST   | Register client      |
| `/evaluation-service/auth`            | POST   | Get auth token       |
| `/evaluation-service/logs`            | POST   | Send log entries     |
| `/evaluation-service/notifications`   | GET    | Fetch notifications  |

### Request/Response Patterns

All API requests include:
- `Content-Type: application/json` header
- `Authorization: Bearer <token>` header (except registration)

## Error Handling Strategy

1. **Network Errors**: Retry with exponential backoff (up to 3 attempts)
2. **Auth Errors (401)**: Trigger token refresh, retry original request
3. **Validation Errors (400)**: Display user-friendly error message
4. **Server Errors (500+)**: Show fallback UI with retry option

## Logging Strategy

Logs are placed at strategic points throughout the application:

| Event Type          | Level  | Package    | Example Message                              |
|---------------------|--------|------------|----------------------------------------------|
| Page load           | info   | page       | "Dashboard page loaded in 342ms"             |
| Component mount     | info   | component  | "NotificationList rendered with 5 items"     |
| API success         | info   | api        | "GET /notifications returned 10 results"     |
| API failure         | error  | api        | "POST /log failed: 401 Unauthorized"         |
| State change        | debug  | state      | "Filter updated: type=urgent, read=false"    |
| Hook execution      | debug  | hook       | "useNotifications: fetched 3 new items"      |
| Cache miss          | warn   | utils      | "Notification cache expired after 5min"      |
| Auth token refresh  | info   | auth       | "Token refreshed, expires in 900s"           |
| Critical failure    | fatal  | service    | "Fatal: database connection lost"            |

## Responsive Design

The application is designed to work across devices:

- **Desktop** (≥1024px): Full sidebar navigation, multi-column layout
- **Tablet** (768px–1023px): Collapsible sidebar, adapted grid
- **Mobile** (≤767px): Bottom navigation, single column, touch-optimized

## Security Considerations

- Auth tokens stored only in memory (React Context), never in localStorage
- API credentials stored in environment variables (`.env`)
- No sensitive data exposed in client-side code
- CORS-aware API calls
