const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ProjectBudget {
  opexBudget: string | null;
  capexBudget: string | null;
  budgetCurrency: string | null;
  costTshirt: string | null;
  totalBudget: string;
  totalAllocated: string;
  allocationMatch: boolean;
  allocations: BudgetAllocation[];
}

export interface BudgetAllocation {
  budgetLineId: number;
  lineValue: string;
  company: string;
  lineAmount: string;
  allocationAmount: string;
  availableAmount: string;
  currency: string;
}

export interface AvailableBudgetLine {
  id: number;
  lineValue: string;
  company: string;
  available: string;
  currency: string;
}

export async function fetchProjectBudget(projectId: number): Promise<ProjectBudget> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/budget`);
  if (!res.ok) throw new Error('Failed to fetch project budget');
  return res.json();
}

export async function updateProjectBudget(
  projectId: number,
  data: {
    opexBudget?: string | null;
    capexBudget?: string | null;
    budgetCurrency?: string | null;
  }
): Promise<ProjectBudget> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/budget`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update project budget');
  return res.json();
}

export async function fetchAvailableBudgetLines(currency: string): Promise<AvailableBudgetLine[]> {
  const params = new URLSearchParams({ currency });
  const res = await fetch(`${API_BASE}/api/admin/budget-lines?${params}`);
  if (!res.ok) throw new Error('Failed to fetch available budget lines');
  const allLines = await res.json();
  // Filter to only those with available > 0 and map to expected interface
  return allLines
    .filter((line: any) => parseFloat(line.availableAmount) > 0)
    .map((line: any) => ({
      id: line.id,
      lineValue: line.lineValue,
      company: line.company,
      available: line.availableAmount,
      currency: line.currency,
    }));
}

export async function addBudgetAllocation(
  projectId: number,
  budgetLineId: number,
  amount: string
): Promise<BudgetAllocation> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/budget/allocations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budgetLineId, allocationAmount: amount }),
  });
  if (!res.ok) {
    const error = await res.json();
    if (res.status === 400) {
      throw new Error(error.message || 'Allocation amount exceeds available budget');
    }
    throw new Error(error.message || 'Failed to add budget allocation');
  }
  return res.json();
}

export async function updateBudgetAllocation(
  projectId: number,
  budgetLineId: number,
  amount: string
): Promise<BudgetAllocation> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/budget/allocations/${budgetLineId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ allocationAmount: amount }),
  });
  if (!res.ok) {
    const error = await res.json();
    if (res.status === 400) {
      throw new Error(error.message || 'Allocation amount exceeds available budget');
    }
    throw new Error(error.message || 'Failed to update budget allocation');
  }
  return res.json();
}

export async function removeBudgetAllocation(
  projectId: number,
  budgetLineId: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/budget/allocations/${budgetLineId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to remove budget allocation');
  }
}
