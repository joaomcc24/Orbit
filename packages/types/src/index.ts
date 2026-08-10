export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'VIEWER';

export type WorkspaceUserSummary = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type WorkspaceMemberSummary = {
  id: string;
  role: WorkspaceRole;
  createdAt: string;
  user: WorkspaceUserSummary;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  members: WorkspaceMemberSummary[];
};

export type CreateWorkspaceRequest = {
  name: string;
  slug: string;
};

export type CreateWorkspaceResponse = {
  workspace: WorkspaceSummary;
};

export type GetWorkspaceResponse = {
  workspace: WorkspaceSummary;
};

export type ListWorkspacesResponse = {
  workspaces: WorkspaceSummary[];
};

export const MONITOR_INTERVALS = [30, 60, 300] as const;

export type MonitorInterval = (typeof MONITOR_INTERVALS)[number];

export type MonitorStatus = 'PENDING' | 'UP' | 'DOWN';

export type MonitorCheckResult = 'UP' | 'DOWN';

export type MonitorCheckFailureReason =
  | 'HTTP_STATUS'
  | 'TIMEOUT'
  | 'DNS'
  | 'CONNECTION'
  | 'TLS'
  | 'REDIRECT'
  | 'BLOCKED_TARGET';

export type MonitorSummary = {
  id: string;
  workspaceId: string;
  name: string;
  targetUrl: string;
  interval: MonitorInterval;
  status: MonitorStatus;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MonitorCheckSummary = {
  id: string;
  monitorId: string;
  result: MonitorCheckResult;
  failureReason: MonitorCheckFailureReason | null;
  targetUrl: string;
  httpStatusCode: number | null;
  responseTimeMs: number;
  checkedAt: string;
  errorMessage: string | null;
};

export type CreateMonitorRequest = {
  name: string;
  targetUrl: string;
  interval: MonitorInterval;
};

export type CreateMonitorResponse = {
  monitor: MonitorSummary;
};

export type ListMonitorsResponse = {
  monitors: MonitorSummary[];
};

export type RunMonitorCheckResponse = {
  monitor: MonitorSummary;
  check: MonitorCheckSummary;
};

export type ListMonitorChecksResponse = {
  checks: MonitorCheckSummary[];
};

export type AuthUserSummary = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type RegisterRequest = {
  email: string;
  name: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: 900;
  user: AuthUserSummary;
};

export type GetCurrentUserResponse = {
  user: AuthUserSummary;
};
