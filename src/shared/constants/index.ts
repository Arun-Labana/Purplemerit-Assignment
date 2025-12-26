export const APP_CONSTANTS = {
  // JWT
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Auth rate limiting
  AUTH_RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  AUTH_RATE_LIMIT_MAX_REQUESTS: 5,

  // Job processing
  MAX_JOB_RETRIES: 3,
  JOB_RETRY_DELAYS: [5000, 25000, 125000], // 5s, 25s, 125s (exponential backoff)
  JOB_TIMEOUT_MS: 300000, // 5 minutes

  // Cache TTL (in seconds)
  CACHE_TTL_PROJECT: 300, // 5 minutes
  CACHE_TTL_WORKSPACE: 300, // 5 minutes
  CACHE_TTL_PERMISSIONS: 600, // 10 minutes
  CACHE_TTL_LIST: 120, // 2 minutes

  // WebSocket
  WS_HEARTBEAT_INTERVAL: 30000, // 30 seconds
  WS_HEARTBEAT_TIMEOUT: 60000, // 1 minute

  // Password
  BCRYPT_SALT_ROUNDS: 10,

  // MongoDB
  MONGODB_ACTIVITY_LOG_TTL_DAYS: 90, // Auto-delete logs after 90 days
};

export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_EXPIRED: 'Token has expired',

  // User errors
  USER_NOT_FOUND: 'User not found',

  // Project errors
  PROJECT_NOT_FOUND: 'Project not found',
  PROJECT_ACCESS_DENIED: 'You do not have access to this project',
  PROJECT_NOT_OWNER: 'Only project owner can perform this action',

  // Workspace errors
  WORKSPACE_NOT_FOUND: 'Workspace not found',
  WORKSPACE_ACCESS_DENIED: 'You do not have access to this workspace',

  // Member errors
  MEMBER_NOT_FOUND: 'Member not found in this project',
  MEMBER_ALREADY_EXISTS: 'User is already a member of this project',
  CANNOT_REMOVE_OWNER: 'Cannot remove project owner',

  // Job errors
  JOB_NOT_FOUND: 'Job not found',
  JOB_ALREADY_PROCESSING: 'Job is already being processed',

  // General errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  NOT_FOUND: 'Resource not found',
};

export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  USER_LOGGED_IN: 'Logged in successfully',
  USER_LOGGED_OUT: 'Logged out successfully',
  TOKEN_REFRESHED: 'Token refreshed successfully',

  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',

  WORKSPACE_CREATED: 'Workspace created successfully',
  WORKSPACE_UPDATED: 'Workspace updated successfully',
  WORKSPACE_DELETED: 'Workspace deleted successfully',

  MEMBER_INVITED: 'Member invited successfully',
  MEMBER_REMOVED: 'Member removed successfully',
  ROLE_UPDATED: 'Role updated successfully',

  JOB_SUBMITTED: 'Job submitted successfully',
};

