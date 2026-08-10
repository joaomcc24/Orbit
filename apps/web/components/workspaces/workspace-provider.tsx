'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { CreateWorkspaceRequest, WorkspaceSummary } from '@orbit/types';
import { SESSION_EXPIRED_MESSAGE, useAuth } from '@/components/auth/auth-provider';
import { OrbitApiError, orbitApi } from '@/lib/api';

type WorkspaceContextValue = {
  activeWorkspace: WorkspaceSummary | null;
  workspaces: WorkspaceSummary[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  selectWorkspace: (workspace: WorkspaceSummary) => void;
  createWorkspace: (input: CreateWorkspaceRequest) => Promise<void>;
  clearError: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const ACTIVE_SLUG_KEY = 'orbit.dev.active-workspace-slug';

export function WorkspaceProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const { accessToken, expireSession } = useAuth();
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceSummary | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectWorkspace = useCallback((workspace: WorkspaceSummary): void => {
    setActiveWorkspace(workspace);
    window.localStorage.setItem(ACTIVE_SLUG_KEY, workspace.slug);
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await orbitApi.listWorkspaces(accessToken);
      const savedSlug = window.localStorage.getItem(ACTIVE_SLUG_KEY);
      const nextWorkspace =
        response.workspaces.find((workspace) => workspace.slug === savedSlug) ??
        response.workspaces[0] ??
        null;

      setWorkspaces(response.workspaces);
      setActiveWorkspace(nextWorkspace);
      if (nextWorkspace) {
        window.localStorage.setItem(ACTIVE_SLUG_KEY, nextWorkspace.slug);
      }
    } catch (caughtError) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      if (caughtError instanceof OrbitApiError && caughtError.status === 401) {
        expireSession();
      } else {
        setError(messageFor(caughtError));
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, expireSession]);

  const createWorkspace = useCallback(async (input: CreateWorkspaceRequest): Promise<void> => {
    if (!accessToken) return;

    setIsCreating(true);
    setError(null);
    try {
      const response = await orbitApi.createWorkspace(input, accessToken);
      setWorkspaces((current) => [...current, response.workspace]);
      selectWorkspace(response.workspace);
    } catch (caughtError) {
      if (caughtError instanceof OrbitApiError && caughtError.status === 401) {
        expireSession();
        throw new Error(SESSION_EXPIRED_MESSAGE);
      } else {
        setError(messageFor(caughtError));
      }
      throw caughtError;
    } finally {
      setIsCreating(false);
    }
  }, [accessToken, expireSession, selectWorkspace]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    activeWorkspace,
    workspaces,
    isLoading,
    isCreating,
    error,
    refresh,
    selectWorkspace,
    createWorkspace,
    clearError: () => setError(null),
  }), [activeWorkspace, workspaces, isLoading, isCreating, error, refresh, selectWorkspace, createWorkspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return value;
}

function messageFor(error: unknown): string {
  if (error instanceof OrbitApiError) return error.message;
  return 'Orbit could not complete that workspace request.';
}
