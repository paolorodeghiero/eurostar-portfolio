import { apiClient } from './api-client';

export interface ProjectBudget {
  opexBudget: string | null;
  capexBudget: string | null;
  convertedOpex?: string;
  convertedCapex?: string;
  budgetCurrency: string | null;
  reportCurrency: string | null;
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
  convertedAmount?: string;
}

export interface AvailableBudgetLine {
  id: number;
  lineValue: string;
  company: string;
  available: string;
  currency: string;
}

export async function fetchProjectBudget(projectId: number): Promise<ProjectBudget> {
  return apiClient<ProjectBudget>(`/api/projects/${projectId}/budget`);
}

export async function updateProjectBudget(
  projectId: number,
  data: {
    opexBudget?: string | null;
    capexBudget?: string | null;
    budgetCurrency?: string | null;
    reportCurrency?: string | null;
  }
): Promise<ProjectBudget> {
  return apiClient<ProjectBudget>(`/api/projects/${projectId}/budget`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function fetchAvailableBudgetLines(currency: string): Promise<AvailableBudgetLine[]> {
  const params = new URLSearchParams({ currency });
  const allLines = await apiClient<any[]>(`/api/admin/budget-lines?${params}`);
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
  return apiClient<BudgetAllocation>(`/api/projects/${projectId}/budget/allocations`, {
    method: 'POST',
    body: JSON.stringify({ budgetLineId, allocationAmount: amount }),
  });
}

export async function updateBudgetAllocation(
  projectId: number,
  budgetLineId: number,
  amount: string
): Promise<BudgetAllocation> {
  return apiClient<BudgetAllocation>(`/api/projects/${projectId}/budget/allocations/${budgetLineId}`, {
    method: 'PUT',
    body: JSON.stringify({ allocationAmount: amount }),
  });
}

export async function removeBudgetAllocation(
  projectId: number,
  budgetLineId: number
): Promise<void> {
  await apiClient(`/api/projects/${projectId}/budget/allocations/${budgetLineId}`, {
    method: 'DELETE',
  });
}
