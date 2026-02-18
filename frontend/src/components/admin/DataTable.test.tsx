import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DataTable, createSortableHeader } from './DataTable'

// Mock column definition
const mockColumns = [
  { accessorKey: 'id', header: createSortableHeader('ID') },
  { accessorKey: 'name', header: createSortableHeader('Name') },
  { accessorKey: 'usageCount', header: createSortableHeader('Usage') }
]

// Mock data
const mockData = [
  { id: 1, name: 'IT', usageCount: 5 },
  { id: 2, name: 'HR', usageCount: 2 }
]

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('DataTable', () => {
  test('renders table headers', () => {
    renderWithRouter(
      <DataTable columns={mockColumns} data={mockData} />
    )

    expect(screen.getByRole('columnheader', { name: /id/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument()
  })

  test('renders data rows', () => {
    renderWithRouter(
      <DataTable columns={mockColumns} data={mockData} />
    )

    expect(screen.getByText('IT')).toBeInTheDocument()
    expect(screen.getByText('HR')).toBeInTheDocument()
  })

  test('handles empty data', () => {
    renderWithRouter(
      <DataTable columns={mockColumns} data={[]} />
    )

    // Should show empty state
    expect(screen.queryByText('IT')).not.toBeInTheDocument()
    expect(screen.getByText(/no results/i)).toBeInTheDocument()
  })

  test('sorting works when clicking header', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <DataTable columns={mockColumns} data={mockData} />
    )

    // Initial order check (IT, HR)
    const initialCells = screen.getAllByRole('cell')
    const initialNames = initialCells.filter((_, i) => i % 3 === 1).map(c => c.textContent)
    expect(initialNames[0]).toBe('IT')
    expect(initialNames[1]).toBe('HR')

    // Click name header to sort
    const nameHeader = screen.getByRole('button', { name: /name/i })
    await user.click(nameHeader)

    // After sorting ascending, HR should come first
    const sortedCells = screen.getAllByRole('cell')
    const sortedNames = sortedCells.filter((_, i) => i % 3 === 1).map(c => c.textContent)
    expect(sortedNames[0]).toBe('HR')
    expect(sortedNames[1]).toBe('IT')
  })

  test('displays row count', () => {
    renderWithRouter(
      <DataTable columns={mockColumns} data={mockData} />
    )

    expect(screen.getByText(/2 of 2 row\(s\)/i)).toBeInTheDocument()
  })
})
