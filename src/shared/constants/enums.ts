// User roles
export enum UserRole {
  OWNER = 'owner',
  COLLABORATOR = 'collaborator',
  VIEWER = 'viewer',
}

// Job statuses
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Job types
export enum JobType {
  CODE_EXECUTION = 'code_execution',
  FILE_PROCESSING = 'file_processing',
  EXPORT_PROJECT = 'export_project',
}

// WebSocket event types
export enum WebSocketEvent {
  USER_JOINED = 'user:joined',
  USER_LEFT = 'user:left',
  FILE_CHANGED = 'file:changed',
  CURSOR_MOVED = 'cursor:moved',
  ACTIVITY_UPDATE = 'activity:update',
  JOIN_WORKSPACE = 'join:workspace',
  LEAVE_WORKSPACE = 'leave:workspace',
  ERROR = 'error',
}

// Activity types
export enum ActivityType {
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',
  WORKSPACE_CREATED = 'workspace_created',
  WORKSPACE_UPDATED = 'workspace_updated',
  WORKSPACE_DELETED = 'workspace_deleted',
  MEMBER_INVITED = 'member_invited',
  MEMBER_REMOVED = 'member_removed',
  ROLE_UPDATED = 'role_updated',
  FILE_CHANGED = 'file_changed',
  CURSOR_MOVED = 'cursor_moved',
}

// HTTP status codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

