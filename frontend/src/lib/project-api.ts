import { apiClient } from './api-client';

export interface Project {
  id: number;
  projectId: string;
  name: string;
  statusId: number | null;
  startDate: string | null;
  endDate: string | null;
  leadTeamId: number;
  projectManager: string | null;
  isOwner: string | null;
  sponsor: string | null;
  isStopped: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  status?: { id: number; name: string; color: string };
  leadTeam?: { id: number; name: string };
  teams?: ProjectTeam[];
  values?: ProjectValue[];
  changeImpact?: ProjectChangeImpact[];
}

export interface ProjectTeam {
  teamId: number;
  teamName: string;
  effortSize: string;
  isLead: boolean;
}

export interface ProjectValue {
  outcomeId: number;
  outcomeName: string;
  score: number;
  justification: string | null;
}

export interface ProjectChangeImpact {
  teamId: number;
  teamName: string;
  impactSize: string;
}

export async function fetchProjects(): Promise<Project[]> {
  return apiClient<Project[]>('/api/projects');
}

export async function fetchProject(id: number): Promise<Project> {
  return apiClient<Project>(`/api/projects/${id}`);
}

export async function createProject(data: {
  name: string;
  leadTeamId: number;
  startDate?: string;
  endDate?: string;
}): Promise<Project> {
  return apiClient<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface ConflictError {
  statusCode: 409;
  message: string;
  serverVersion: number;
  serverData: Project;
}

export async function updateProject(
  id: number,
  data: Partial<Project> & { expectedVersion: number }
): Promise<Project> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );

  if (response.status === 409) {
    const conflict = await response.json();
    const error = new Error('Conflict') as Error & ConflictError;
    error.statusCode = 409;
    error.message = conflict.message;
    error.serverVersion = conflict.serverVersion;
    error.serverData = conflict.serverData;
    throw error;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}
