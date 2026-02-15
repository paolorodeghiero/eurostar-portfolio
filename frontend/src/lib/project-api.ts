import { apiClient, getAuthHeaders } from './api-client';

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
  description: string | null;
  businessCaseFile: string | null;
  isStopped: boolean; // Deprecated - use status.isReadOnly instead
  opexBudget: string | null;
  capexBudget: string | null;
  budgetCurrency: string | null;
  reportCurrency: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  status?: {
    id: number;
    name: string;
    color: string;
    isSystemStatus?: boolean;
    isReadOnly?: boolean;
  };
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
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/projects/${id}`,
    {
      method: 'PUT',
      headers,
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
export async function fetchProjectTeams(projectId: number): Promise<ProjectTeam[]> {
  return apiClient<ProjectTeam[]>(`/api/projects/${projectId}/teams`);
}

export async function addProjectTeam(
  projectId: number,
  teamId: number,
  effortSize: string
): Promise<void> {
  await apiClient(`/api/projects/${projectId}/teams`, {
    method: 'POST',
    body: JSON.stringify({ teamId, effortSize }),
  });
}

export async function updateProjectTeamSize(
  projectId: number,
  teamId: number,
  effortSize: string
): Promise<void> {
  await apiClient(`/api/projects/${projectId}/teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify({ effortSize }),
  });
}

export async function removeProjectTeam(
  projectId: number,
  teamId: number
): Promise<void> {
  await apiClient(`/api/projects/${projectId}/teams/${teamId}`, {
    method: 'DELETE',
  });
}

// Value score management functions
export async function fetchOutcomes(): Promise<Outcome[]> {
  return apiClient<Outcome[]>('/api/admin/outcomes');
}

export async function fetchProjectValues(projectId: number): Promise<ProjectValue[]> {
  return apiClient<ProjectValue[]>(`/api/projects/${projectId}/values`);
}

export async function updateProjectValue(
  projectId: number,
  outcomeId: number,
  score: number,
  justification: string | null
): Promise<void> {
  await apiClient(`/api/projects/${projectId}/values/${outcomeId}`, {
    method: 'PUT',
    body: JSON.stringify({ score, justification }),
  });
}

// Change Impact API
export async function fetchProjectChangeImpact(projectId: number): Promise<ProjectChangeImpact[]> {
  return apiClient<ProjectChangeImpact[]>(`/api/projects/${projectId}/change-impact`);
}

export async function addProjectChangeImpact(
  projectId: number,
  teamId: number,
  impactSize: string
): Promise<void> {
  await apiClient(`/api/projects/${projectId}/change-impact`, {
    method: 'POST',
    body: JSON.stringify({ teamId, impactSize }),
  });
}

export async function updateProjectChangeImpact(
  projectId: number,
  teamId: number,
  impactSize: string
): Promise<void> {
  await apiClient(`/api/projects/${projectId}/change-impact/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify({ impactSize }),
  });
}

export async function removeProjectChangeImpact(
  projectId: number,
  teamId: number
): Promise<void> {
  await apiClient(`/api/projects/${projectId}/change-impact/${teamId}`, {
    method: 'DELETE',
  });
}

// Lifecycle API
export async function stopProject(id: number): Promise<Project> {
  return apiClient<Project>(`/api/projects/${id}/stop`, { method: 'PATCH' });
}

export async function reactivateProject(id: number): Promise<Project> {
  return apiClient<Project>(`/api/projects/${id}/reactivate`, { method: 'PATCH' });
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient(`/api/projects/${id}`, { method: 'DELETE' });
}

// Portfolio table with computed fields
export interface PortfolioProject extends Project {
  valueScoreAvg: number | null;
  budgetTotal: number | null;
  actualsTotal: number | null;
  committeeState: string | null;
  committeeLevel: string | null;
  costTshirt: string | null;

  // For expandable rows
  changeImpactTeams?: Array<{
    teamId: number;
    teamName: string;
    impactSize: string;
  }>;

  // Expansion state tracking (internal, set by table)
  _expandType?: 'effort' | 'impact';
}

// Fetch projects with computed fields for portfolio table
export async function fetchPortfolioProjects(reportCurrency: string = 'EUR'): Promise<PortfolioProject[]> {
  // Backend now returns all portfolio fields (teams, valueScoreAvg, budgetTotal, committee)
  // Pass reportCurrency as query param for currency conversion
  return apiClient<PortfolioProject[]>(`/api/projects?reportCurrency=${reportCurrency}`);
}
