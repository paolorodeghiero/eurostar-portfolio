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

export interface Outcome {
  id: number;
  name: string;
  score1Example: string | null;
  score2Example: string | null;
  score3Example: string | null;
  score4Example: string | null;
  score5Example: string | null;
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

// Team management functions
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchProjectTeams(projectId: number): Promise<ProjectTeam[]> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/teams`);
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
}

export async function addProjectTeam(
  projectId: number,
  teamId: number,
  effortSize: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, effortSize }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to add team');
  }
}

export async function updateProjectTeamSize(
  projectId: number,
  teamId: number,
  effortSize: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/teams/${teamId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ effortSize }),
  });
  if (!res.ok) throw new Error('Failed to update team size');
}

export async function removeProjectTeam(
  projectId: number,
  teamId: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/teams/${teamId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to remove team');
  }
}

// Value score management functions
export async function fetchOutcomes(): Promise<Outcome[]> {
  const res = await fetch(`${API_BASE}/api/admin/outcomes`);
  if (!res.ok) throw new Error('Failed to fetch outcomes');
  return res.json();
}

export async function fetchProjectValues(projectId: number): Promise<ProjectValue[]> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/values`);
  if (!res.ok) throw new Error('Failed to fetch values');
  return res.json();
}

export async function updateProjectValue(
  projectId: number,
  outcomeId: number,
  score: number,
  justification: string | null
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/values/${outcomeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, justification }),
  });
  if (!res.ok) throw new Error('Failed to update value');
}

// Change Impact API
export async function fetchProjectChangeImpact(projectId: number): Promise<ProjectChangeImpact[]> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/change-impact`);
  if (!res.ok) throw new Error('Failed to fetch change impact');
  return res.json();
}

export async function addProjectChangeImpact(
  projectId: number,
  teamId: number,
  impactSize: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/change-impact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, impactSize }),
  });
  if (!res.ok) throw new Error('Failed to add change impact');
}

export async function updateProjectChangeImpact(
  projectId: number,
  teamId: number,
  impactSize: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/change-impact/${teamId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ impactSize }),
  });
  if (!res.ok) throw new Error('Failed to update change impact');
}

export async function removeProjectChangeImpact(
  projectId: number,
  teamId: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/change-impact/${teamId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove change impact');
}

// Lifecycle API
export async function stopProject(id: number): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects/${id}/stop`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to stop project');
  return res.json();
}

export async function reactivateProject(id: number): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects/${id}/reactivate`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to reactivate project');
  return res.json();
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to delete project');
  }
}
