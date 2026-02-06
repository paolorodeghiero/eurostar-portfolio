const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface CommitteeStatus {
  committeeState: string | null;
  committeeLevel: string | null;
  businessCaseFile: string | null;
  allowedTransitions: string[];
}

export interface TransitionResult {
  id: number;
  committeeState: string;
  allowedTransitions: string[];
  version: number;
}

export interface UploadResult {
  filename: string;
  originalFilename: string;
  size: number;
  project: {
    id: number;
    businessCaseFile: string;
    version: number;
  };
}

// Get committee status and allowed transitions
export async function fetchCommitteeStatus(projectId: number): Promise<CommitteeStatus> {
  const response = await fetch(`${API_BASE}/api/projects/${projectId}/committee`);
  if (!response.ok) {
    throw new Error('Failed to fetch committee status');
  }
  return response.json();
}

// Transition committee state
export async function transitionCommitteeState(
  projectId: number,
  newState: string
): Promise<TransitionResult> {
  const response = await fetch(`${API_BASE}/api/projects/${projectId}/committee-state`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ committeeState: newState }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to transition state');
  }

  return response.json();
}

// Upload business case file
export async function uploadBusinessCase(
  projectId: number,
  file: File
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/projects/${projectId}/business-case`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  return response.json();
}

// Download business case file
export async function downloadBusinessCase(projectId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/projects/${projectId}/business-case/download`);

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  // Get the blob and create download link
  const blob = await response.blob();
  const contentDisposition = response.headers.get('Content-Disposition');
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const filename = filenameMatch?.[1] || 'business-case.pdf';

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

// Delete business case file
export async function deleteBusinessCase(projectId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/projects/${projectId}/business-case`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete file');
  }
}

// State labels for display
export const STATE_LABELS: Record<string, string> = {
  draft: 'Draft',
  presented: 'Presented',
  discussion: 'Discussion',
  approved: 'Approved',
  rejected: 'Rejected',
};

// State colors for badges
export const STATE_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  presented: 'bg-blue-100 text-blue-800',
  discussion: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

// Level labels
export const LEVEL_LABELS: Record<string, string> = {
  mandatory: 'Mandatory',
  optional: 'Optional',
  not_necessary: 'Not Required',
};

// Level colors for badges
export const LEVEL_COLORS: Record<string, string> = {
  mandatory: 'bg-red-100 text-red-800',
  optional: 'bg-yellow-100 text-yellow-800',
  not_necessary: 'bg-gray-100 text-gray-800',
};
