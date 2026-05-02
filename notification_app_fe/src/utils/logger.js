/**
 * Frontend Logging Utility
 * 
 * Wraps the logging middleware for use in the React frontend.
 * Sends logs to the evaluation server with proper stack/package values.
 */

import { sendLog } from '../api/notificationApi';

const VALID_PACKAGES = ['api', 'component', 'hook', 'page', 'state', 'style', 'utils', 'auth', 'config', 'middleware'];
const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];

/**
 * Send a log entry to the evaluation server.
 * Messages are auto-truncated to 48 characters.
 * 
 * @param {string} level - Log level
 * @param {string} pkg - Package name
 * @param {string} message - Log message
 */
export async function Log(level, pkg, message) {
  // Validate
  if (!VALID_LEVELS.includes(level)) {
    console.warn(`[Logger] Invalid level: ${level}`);
    return;
  }
  if (!VALID_PACKAGES.includes(pkg)) {
    console.warn(`[Logger] Invalid package: ${pkg}`);
    return;
  }

  // Truncate message to 48 chars
  const truncated = message.length > 48 ? message.substring(0, 48) : message;

  // Console output
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] [frontend/${pkg}] ${truncated}`);

  // Send to server (fire-and-forget)
  try {
    await sendLog({
      stack: 'frontend',
      level,
      package: pkg,
      message: truncated,
    });
  } catch (err) {
    // Don't let logging errors break the app
    console.error('[Logger] Failed to send log:', err.message);
  }
}

/**
 * Create a scoped logger for a specific package.
 * @param {string} pkg - Package name
 * @returns {Object} Logger with level methods
 */
export function createLogger(pkg) {
  return {
    debug: (msg) => Log('debug', pkg, msg),
    info: (msg) => Log('info', pkg, msg),
    warn: (msg) => Log('warn', pkg, msg),
    error: (msg) => Log('error', pkg, msg),
    fatal: (msg) => Log('fatal', pkg, msg),
  };
}
