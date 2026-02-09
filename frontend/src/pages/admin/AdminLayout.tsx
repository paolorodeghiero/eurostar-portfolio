import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
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
  LayoutGrid,
  CreditCard,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid, exact: true },
  { href: '/admin/departments', label: 'Departments', icon: Building2 },
  { href: '/admin/teams', label: 'Teams', icon: Users },
  { href: '/admin/statuses', label: 'Statuses', icon: Flag },
  { href: '/admin/outcomes', label: 'Outcomes', icon: Target },
  { href: '/admin/cost-centers', label: 'Cost Centers', icon: Wallet },
  { href: '/admin/budget-lines', label: 'Budget Lines', icon: CreditCard },
  { href: '/admin/currency-rates', label: 'Currency Rates', icon: DollarSign },
  { href: '/admin/committee-thresholds', label: 'Committee Thresholds', icon: Scale },
  { href: '/admin/cost-tshirt-thresholds', label: 'Cost T-shirt Thresholds', icon: Shirt },
  { href: '/admin/competence-month-patterns', label: 'Competence Month Patterns', icon: Calendar },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return location.pathname === item.href;
    }
    return location.pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen">
      <PortfolioHeader
        onAlertClick={(projectId) => navigate(`/?project=${projectId}`)}
      />
      <div className="flex min-h-[calc(100vh-57px)]">
      <aside className="w-64 bg-white border-r border-border p-4 shrink-0">
        <h2 className="font-semibold text-lg mb-4 text-eurostar-teal">
          Referentials
        </h2>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-eurostar-teal text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-eurostar-light">
        <Outlet />
      </main>
      </div>
    </div>
  );
}
