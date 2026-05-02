# Notification System Design

## Overview

This document outlines the architecture and design of the Notification System application. The system is designed to manage, display, and track notifications across a web application with real-time updates and a robust frontend user experience.

## Architecture

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
|---------------|--------------------|
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
| `/evaluation-service/log`             | POST   | Send log entries     |

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
