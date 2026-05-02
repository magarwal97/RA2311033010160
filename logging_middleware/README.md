# Logging Middleware

A reusable logging middleware module that captures application events across the entire lifecycle — from successful operations to warnings, informational messages, and debugging details.

## Features

- **Multi-level logging**: Supports `debug`, `info`, `warn`, and `error` levels
- **Stack-aware**: Differentiates between `frontend` and `backend` logs
- **Package scoping**: Validates log entries against allowed package names per stack
- **Remote logging**: Sends log entries to the evaluation server with Bearer token auth
- **Retry logic**: Automatic retry with exponential backoff on server errors
- **Console output**: Color-coded console output for local development
- **Scoped loggers**: Create pre-configured loggers for specific stack/package combinations

## Installation

This module is used locally within the project. Import it directly:

```javascript
import { Log, configureLogger, createLogger } from '../logging_middleware/index.js';
```

## Usage

### 1. Configure the Logger

```javascript
import { configureLogger } from '../logging_middleware/index.js';

configureLogger({
  token: 'your-bearer-token',
  enableConsoleOutput: true,
  enableRemoteLogging: true,
});
```

### 2. Log Events

```javascript
import { Log } from '../logging_middleware/index.js';

// Log an info event
await Log('frontend', 'info', 'component', 'Dashboard rendered successfully');

// Log an error
await Log('frontend', 'error', 'api', 'GET /notifications failed: 500');

// Log a warning
await Log('frontend', 'warn', 'state', 'Cache expired, triggering refresh');

// Log debug info
await Log('frontend', 'debug', 'hook', 'useNotifications re-rendered');
```

### 3. Use Scoped Loggers

```javascript
import { createLogger } from '../logging_middleware/index.js';

const logger = createLogger('frontend', 'component');

logger.info('Component mounted');
logger.error('Render failed: missing props');
logger.warn('Deprecated prop used');
logger.debug('Re-render triggered by state change');
```

## API Reference

### `Log(stack, level, package, message)`

| Parameter | Type   | Description |
|-----------|--------|-------------|
| stack     | string | `'frontend'` or `'backend'` |
| level     | string | `'debug'`, `'info'`, `'warn'`, or `'error'` |
| package   | string | Module name (see allowed values below) |
| message   | string | Descriptive log message |

**Returns**: `Promise<Object|null>` — Server response with `logID`, or `null` on failure.

### Allowed Package Values

**Frontend only**: `api`, `component`, `hook`, `page`, `state`, `utils`

**Backend only**: `handler`, `repository`, `route`, `service`

**Both stacks**: `auth`, `config`, `middleware`, `utils`

## Testing

```bash
cd logging_middleware
node test.js
```
