import type {
  AuthResponse,
  CreateMonitorRequest,
  CreateMonitorResponse,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  GetWorkspaceResponse,
  GetCurrentUserResponse,
  LoginRequest,
  ListMonitorsResponse,
  ListMonitorChecksResponse,
  ListWorkspacesResponse,
  RegisterRequest,
  RunMonitorCheckResponse,
} from '@orbit/types';

const API_BASE_PATH = '/api/orbit';

type ApiErrorPayload = {
  message?: string | string[];
};

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  accessToken?: string;
};

/** A failed HTTP response with enough context for a useful UI message. */
export class OrbitApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'OrbitApiError';
  }
}

/**
 * The shared, typed boundary for browser-to-API calls.
 *
 * TypeScript checks that callers send and use the documented shapes. It cannot
 * prove that a network response is truthful at runtime; the API integration
 * suite protects that contract today, and runtime schema validation can be
 * added here later if Orbit consumes untrusted external APIs.
 */
async function request<TResponse>(
  path: string,
  init: ApiRequestOptions = {},
): Promise<TResponse> {
  const { body, headers, accessToken, ...requestInit } = init;
  let response: Response;

  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
      ...requestInit,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new OrbitApiError(
      'Orbit could not reach the API. Check that the local API is running.',
      0,
    );
  }

  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | TResponse | null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null;
    const message = errorPayload?.message;
    const errorMessage = Array.isArray(message) ? message.join(', ') : message;

    throw new OrbitApiError(errorMessage || `Orbit API request failed (${response.status}).`, response.status);
  }

  return payload as TResponse;
}

export const orbitApi = {
  register(input: RegisterRequest): Promise<AuthResponse> {
    return request('/auth/register', {
      method: 'POST',
      body: input,
    });
  },

  login(input: LoginRequest): Promise<AuthResponse> {
    return request('/auth/login', {
      method: 'POST',
      body: input,
    });
  },

  getCurrentUser(accessToken: string): Promise<GetCurrentUserResponse> {
    return request('/auth/me', {
      cache: 'no-store',
      accessToken,
    });
  },

  createWorkspace(
    input: CreateWorkspaceRequest,
    accessToken: string,
  ): Promise<CreateWorkspaceResponse> {
    return request('/workspaces', {
      method: 'POST',
      body: input,
      accessToken,
    });
  },

  listWorkspaces(accessToken: string): Promise<ListWorkspacesResponse> {
    return request('/workspaces', {
      cache: 'no-store',
      accessToken,
    });
  },

  getWorkspace(slug: string, accessToken: string): Promise<GetWorkspaceResponse> {
    return request(`/workspaces/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
      accessToken,
    });
  },

  createMonitor(
    workspaceSlug: string,
    accessToken: string,
    input: CreateMonitorRequest,
  ): Promise<CreateMonitorResponse> {
    return request(`/workspaces/${encodeURIComponent(workspaceSlug)}/monitors`, {
      method: 'POST',
      body: input,
      accessToken,
    });
  },

  listMonitors(
    workspaceSlug: string,
    accessToken: string,
  ): Promise<ListMonitorsResponse> {
    return request(`/workspaces/${encodeURIComponent(workspaceSlug)}/monitors`, {
      cache: 'no-store',
      accessToken,
    });
  },

  runMonitorCheck(
    workspaceSlug: string,
    monitorId: string,
    accessToken: string,
  ): Promise<RunMonitorCheckResponse> {
    return request(`/workspaces/${encodeURIComponent(workspaceSlug)}/monitors/${encodeURIComponent(monitorId)}/checks`, {
      method: 'POST',
      accessToken,
    });
  },

  listMonitorChecks(
    workspaceSlug: string,
    monitorId: string,
    accessToken: string,
    limit = 12,
  ): Promise<ListMonitorChecksResponse> {
    return request(`/workspaces/${encodeURIComponent(workspaceSlug)}/monitors/${encodeURIComponent(monitorId)}/checks?limit=${limit}`, {
      cache: 'no-store',
      accessToken,
    });
  },
};
