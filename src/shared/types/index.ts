import { UserRole } from '../constants/enums';

// User types
export interface IUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  email: string;
  name: string;
  password: string;
}

export interface IUserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Project types
export interface IProject {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectCreate {
  name: string;
  description?: string;
}

export interface IProjectUpdate {
  name?: string;
  description?: string;
}

export interface IProjectWithMembers extends IProject {
  members: IProjectMember[];
}

// Workspace types
export interface IWorkspace {
  id: string;
  projectId: string;
  name: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspaceCreate {
  name: string;
  settings?: Record<string, any>;
}

export interface IWorkspaceUpdate {
  name?: string;
  settings?: Record<string, any>;
}

// Project Member types
export interface IProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: UserRole;
  invitedAt: Date;
  invitedBy: string | null;
  user?: IUserResponse;
}

export interface IProjectMemberCreate {
  projectId: string;
  userId: string;
  role: UserRole;
  invitedBy: string;
}

// Job types
export interface IJob {
  id: string;
  workspaceId: string;
  type: string;
  status: string;
  retries: number;
  maxRetries: number;
  idempotencyKey?: string | null;
  createdAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
}

export interface IJobCreate {
  workspaceId: string;
  type: string;
  payload: Record<string, any>;
  idempotencyKey?: string;
}

export interface IJobResult {
  jobId: string;
  inputPayload: Record<string, any>;
  outputResult: Record<string, any> | null;
  logs: string[];
  errors: string[];
}

// Activity Log types
export interface IActivityLog {
  workspaceId: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
}

// Collaboration Event types
export interface ICollaborationEvent {
  workspaceId: string;
  userId: string;
  eventType: string;
  payload: Record<string, any>;
  timestamp: Date;
}

// Auth types
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenPayload {
  userId: string;
  email: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  name: string;
  password: string;
}

// API Response types
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// WebSocket types
export interface IWebSocketMessage {
  event: string;
  data: any;
}

export interface IUserJoinedPayload {
  userId: string;
  userName: string;
  workspaceId: string;
}

export interface IFileChangedPayload {
  fileId: string;
  fileName: string;
  changes: any;
  userId: string;
}

export interface ICursorMovedPayload {
  userId: string;
  position: {
    line: number;
    column: number;
  };
  fileId: string;
}

