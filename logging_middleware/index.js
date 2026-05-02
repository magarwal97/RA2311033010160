/**
 * Logging Middleware
 * 
 * A reusable logging module that captures application events and sends
 * them to the evaluation server. Supports multiple log levels, stacks,
 * and packages for comprehensive application observability.
 * 
 * Usage:
 *   import { Log, configureLogger } from 'logging-middleware';
 *   
 *   // Configure with your auth token
 *   configureLogger({ token: 'your-bearer-token' });
 *   
 *   // Log events
 *   Log('frontend', 'info', 'component', 'User dashboard rendered successfully');
 *   Log('frontend', 'error', 'api', 'Failed to fetch notifications');
 */

// ============================================================
// Constants - Allowed values for log fields (case-sensitive)
// ============================================================

const VALID_STACKS = ['frontend', 'backend'];

const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];

const VALID_PACKAGES = {
  backend: ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service'],
  frontend: ['api', 'component', 'hook', 'page', 'state', 'style', 'utils'],
  shared: ['auth', 'config', 'middleware', 'utils'],
};

// ============================================================
// Configuration
// ============================================================

const LOG_API_URL = 'http://20.207.122.201/evaluation-service/logs';

let _config = {
  token: '',
  enableConsoleOutput: true,
  enableRemoteLogging: true,
  batchSize: 1,
  retryAttempts: 2,
  retryDelayMs: 1000,
};

/**
 * Configure the logger with authentication and behavior settings.
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.token - Bearer token for API authentication
 * @param {boolean} [options.enableConsoleOutput=true] - Whether to also log to console
 * @param {boolean} [options.enableRemoteLogging=true] - Whether to send logs to remote server
 * @param {number} [options.retryAttempts=2] - Number of retry attempts on failure
 * @param {number} [options.retryDelayMs=1000] - Delay between retries in milliseconds
 */
export function configureLogger(options) {
  _config = { ..._config, ...options };
}

// ============================================================
// Validation Helpers
// ============================================================

/**
 * Validates that the stack value is one of the allowed values.
 * @param {string} stack - The application stack ('frontend' or 'backend')
 * @returns {boolean} True if valid
 */
function isValidStack(stack) {
  return VALID_STACKS.includes(stack);
}

/**
 * Validates that the level value is one of the allowed values.
 * @param {string} level - The log level ('debug', 'info', 'warn', 'error')
 * @returns {boolean} True if valid
 */
function isValidLevel(level) {
  return VALID_LEVELS.includes(level);
}

/**
 * Validates that the package value is allowed for the given stack.
 * @param {string} stack - The application stack
 * @param {string} pkg - The package/module name
 * @returns {boolean} True if valid
 */
function isValidPackage(stack, pkg) {
  const stackPackages = VALID_PACKAGES[stack] || [];
  const sharedPackages = VALID_PACKAGES.shared;
  return stackPackages.includes(pkg) || sharedPackages.includes(pkg);
}

// ============================================================
// Console Formatting
// ============================================================

const LEVEL_COLORS = {
  debug: '\x1b[36m',   // Cyan
  info: '\x1b[32m',    // Green
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  fatal: '\x1b[35m',   // Magenta
};

const RESET_COLOR = '\x1b[0m';

/**
 * Formats and outputs a log entry to the console with color coding.
 * @param {string} stack - Application stack
 * @param {string} level - Log level
 * @param {string} pkg - Package name
 * @param {string} message - Log message
 */
function consoleLog(stack, level, pkg, message) {
  const timestamp = new Date().toISOString();
  const color = LEVEL_COLORS[level] || '';
  const formattedMessage = `${color}[${timestamp}] [${level.toUpperCase()}] [${stack}/${pkg}] ${message}${RESET_COLOR}`;

  switch (level) {
    case 'fatal':
    case 'error':
      console.error(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'debug':
      console.debug(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
}

// ============================================================
// Remote Logging
// ============================================================

/**
 * Sends a log entry to the remote evaluation server with retry logic.
 * @param {string} stack - Application stack
 * @param {string} level - Log level
 * @param {string} pkg - Package name
 * @param {string} message - Log message
 * @returns {Promise<Object|null>} Server response or null on failure
 */
async function sendLogToServer(stack, level, pkg, message) {
  const payload = {
    stack,
    level,
    package: pkg,
    message,
  };

  for (let attempt = 0; attempt <= _config.retryAttempts; attempt++) {
    try {
      const response = await fetch(LOG_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${_config.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }

      // If unauthorized, don't retry - token issue
      if (response.status === 401) {
        console.error('[LoggingMiddleware] Authentication failed. Please update your token.');
        return null;
      }

      // For server errors, retry
      if (response.status >= 500 && attempt < _config.retryAttempts) {
        await delay(_config.retryDelayMs * (attempt + 1));
        continue;
      }

      const errorText = await response.text();
      console.error(`[LoggingMiddleware] Server returned ${response.status}: ${errorText}`);
      return null;
    } catch (error) {
      if (attempt < _config.retryAttempts) {
        await delay(_config.retryDelayMs * (attempt + 1));
        continue;
      }
      console.error(`[LoggingMiddleware] Network error after ${attempt + 1} attempts:`, error.message);
      return null;
    }
  }

  return null;
}

/**
 * Utility function to create a promise-based delay.
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Main Log Function
// ============================================================

/**
 * Log an application event. This is the primary function to use throughout
 * your codebase. It validates inputs, outputs to console, and sends the
 * log entry to the remote evaluation server.
 * 
 * @param {string} stack - The application stack: 'frontend' or 'backend'
 * @param {string} level - Log severity: 'debug', 'info', 'warn', 'error'
 * @param {string} pkg - The package/module name (e.g., 'component', 'api', 'hook')
 * @param {string} message - Descriptive log message with context
 * @returns {Promise<Object|null>} Server response with logID, or null on failure
 * 
 * @example
 *   // Log a successful component render
 *   await Log('frontend', 'info', 'component', 'NotificationList rendered with 5 items');
 * 
 *   // Log an API error
 *   await Log('frontend', 'error', 'api', 'GET /notifications failed: 500 Internal Server Error');
 * 
 *   // Log a state change
 *   await Log('frontend', 'debug', 'state', 'Notification filter updated: type=urgent');
 */
export async function Log(stack, level, pkg, message) {
  // Validate stack
  if (!isValidStack(stack)) {
    console.error(
      `[LoggingMiddleware] Invalid stack: "${stack}". Must be one of: ${VALID_STACKS.join(', ')}`
    );
    return null;
  }

  // Validate level
  if (!isValidLevel(level)) {
    console.error(
      `[LoggingMiddleware] Invalid level: "${level}". Must be one of: ${VALID_LEVELS.join(', ')}`
    );
    return null;
  }

  // Validate package
  if (!isValidPackage(stack, pkg)) {
    const validPkgs = [
      ...(VALID_PACKAGES[stack] || []),
      ...VALID_PACKAGES.shared,
    ];
    console.error(
      `[LoggingMiddleware] Invalid package: "${pkg}" for stack "${stack}". Must be one of: ${validPkgs.join(', ')}`
    );
    return null;
  }

  // Validate message
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    console.error('[LoggingMiddleware] Message must be a non-empty string.');
    return null;
  }

  // Server enforces a 48-character max on messages
  if (message.length > 48) {
    console.warn(
      `[LoggingMiddleware] Message truncated from ${message.length} to 48 chars.`
    );
    message = message.substring(0, 48);
  }

  // Output to console
  if (_config.enableConsoleOutput) {
    consoleLog(stack, level, pkg, message);
  }

  // Send to remote server
  if (_config.enableRemoteLogging && _config.token) {
    return await sendLogToServer(stack, level, pkg, message);
  }

  return null;
}

// ============================================================
// Convenience Methods
// ============================================================

/**
 * Create a scoped logger for a specific stack and package.
 * Useful when logging multiple events from the same module.
 * 
 * @param {string} stack - The application stack
 * @param {string} pkg - The package/module name
 * @returns {Object} Logger with debug, info, warn, error methods
 * 
 * @example
 *   const logger = createLogger('frontend', 'component');
 *   logger.info('Dashboard loaded successfully');
 *   logger.error('Failed to render chart: invalid data format');
 */
export function createLogger(stack, pkg) {
  return {
    debug: (message) => Log(stack, 'debug', pkg, message),
    info: (message) => Log(stack, 'info', pkg, message),
    warn: (message) => Log(stack, 'warn', pkg, message),
    error: (message) => Log(stack, 'error', pkg, message),
    fatal: (message) => Log(stack, 'fatal', pkg, message),
  };
}

// Default export for convenience
export default { Log, configureLogger, createLogger };
