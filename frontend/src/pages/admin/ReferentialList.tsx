import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Flag,
  Target,
  Wallet,
  DollarSign,
  Scale,
  Shirt,
  Calendar,
} from 'lucide-react';

const referentialTypes = [
  {
    id: 'departments',
    name: 'Departments',
    description: 'Organizational departments',
    icon: Building2,
  },
  {
    id: 'teams',
    name: 'Teams',
    description: 'Teams within departments',
    icon: Users,
  },
  {
    id: 'statuses',
    name: 'Statuses',
    description: 'Project lifecycle statuses',
    icon: Flag,
  },
  {
    id: 'outcomes',
    name: 'Outcomes',
    description: 'Project outcome scoring criteria',
    icon: Target,
  },
  {
    id: 'cost-centers',
    name: 'Cost Centers',
    description: 'Accounting cost center codes',
    icon: Wallet,
  },
  {
    id: 'currency-rates',
    name: 'Currency Rates',
    description: 'Exchange rates between currencies',
    icon: DollarSign,
  },
  {
    id: 'committee-thresholds',
    name: 'Committee Thresholds',
    description: 'Budget thresholds for committee approval',
    icon: Scale,
  },
  {
    id: 'cost-tshirt-thresholds',
    name: 'Cost T-shirt Thresholds',
    description: 'T-shirt size to budget amount mapping',
    icon: Shirt,
  },
  {
    id: 'competence-month-patterns',
    name: 'Competence Month Patterns',
    description: 'Month patterns for competence periods',
    icon: Calendar,
  },
];

export function ReferentialList() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-gray-900">Referential Management</h1>
      <p className="text-gray-600 mb-6">
        Manage the lookup data used throughout the portfolio tool.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {referentialTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Link
              key={type.id}
              to={`/admin/${type.id}`}
              className="p-4 bg-white rounded-lg border border-border hover:shadow-md hover:border-eurostar-teal/30 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-eurostar-light rounded-md group-hover:bg-eurostar-teal/10 transition-colors">
                  <Icon className="h-5 w-5 text-eurostar-teal" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{type.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
