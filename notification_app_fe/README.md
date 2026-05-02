# Campus Notifications Frontend

A responsive React application that displays campus notifications with a Priority Inbox feature. Built with Material UI for styling.

## Features

### All Notifications Page (`/`)
- Displays all notifications from the evaluation API
- **Filter by Type**: Toggle between All Types, Placement, Result, Event
- **Pagination**: Navigate through pages of notifications
- **Limit Control**: Show 5 or 10 items per page
- **New/Viewed Tracking**: Distinguishes between new and already viewed notifications using localStorage
- **Mark as Viewed**: Click the eye icon to mark individual notifications, or use "Mark all as viewed"
- **Badge Count**: Shows unviewed notification count in the navbar

### Priority Inbox Page (`/priority`)
- Ranks notifications by priority score: `typeWeight × 1000 + recencyScore`
- **Type Weights**: Placement (3) > Result (2) > Event (1)
- **Top N Slider**: Configure how many priority notifications to display (5–20)
- **Type Filter**: Filter priority results by notification type
- **Stats Cards**: Visual breakdown of notification types in the top N
- **Priority Score Display**: Shows the calculated priority score for each notification

### Responsive Design
- Desktop layout with full navigation and multi-column stats
- Mobile layout (≤600px) with shortened tab labels and stacked layouts
- All components adapt seamlessly across viewport sizes

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18+ | UI Framework |
| Vite | Build tool & dev server |
| Material UI v9 | Component library & styling |
| React Router v6 | Client-side routing |
| localStorage | Viewed notification persistence |

## Setup & Run

```bash
cd notification_app_fe
npm install
npm run dev
```

The app runs exclusively on **http://localhost:3000**.

## API Integration

Uses the evaluation server API with Vite proxy:
- `POST /evaluation-service/auth` — Get auth token
- `GET /evaluation-service/notifications` — Fetch notifications
- `POST /evaluation-service/logs` — Send log entries

### Supported Query Parameters
- `limit` — Number of results (5 or 10)
- `page` — Page number for pagination
- `notification_type` — Filter: "Event", "Result", "Placement"

## Project Structure

```
notification_app_fe/
├── src/
│   ├── api/
│   │   └── notificationApi.js      # API service with auth & token caching
│   ├── components/
│   │   ├── Navbar.jsx              # Navigation with tabs & badge
│   │   ├── NotificationCard.jsx    # Notification display card
│   │   └── NotificationFilters.jsx # Type filter & limit selector
│   ├── hooks/
│   │   └── useNotifications.js     # Data fetching hook
│   ├── pages/
│   │   ├── AllNotificationsPage.jsx    # All notifications with pagination
│   │   └── PriorityInboxPage.jsx       # Priority inbox with ranking
│   ├── utils/
│   │   ├── logger.js               # Frontend logging middleware
│   │   ├── priority.js             # Priority calculation algorithm
│   │   └── viewedTracker.js        # New/viewed state management
│   ├── App.jsx                     # Root component with routing
│   ├── theme.js                    # MUI dark theme configuration
│   └── main.jsx                    # Entry point
├── vite.config.js                  # Dev server (port 3000) + API proxy
├── index.html                      # HTML template with Inter font
└── demo_recording.webp             # Video demo of app functionality
```

## Demo

A video recording demonstrating all features (desktop and mobile views) is included as `demo_recording.webp`.
