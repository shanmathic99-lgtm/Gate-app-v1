import { LayoutDashboard, Clock, CheckCircle } from 'lucide-react';

interface AdminSidebarProps {
  activeView: 'overview' | 'pending' | 'approved';
  onViewChange: (view: 'overview' | 'pending' | 'approved') => void;
}

export const AdminSidebar = ({ activeView, onViewChange }: AdminSidebarProps) => {
  const menuItems = [
    {
      id: 'overview' as const,
      label: 'Visitor Management Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'pending' as const,
      label: 'Pending Visitor Requests',
      icon: Clock,
    },
    {
      id: 'approved' as const,
      label: 'Approved Visitor Requests',
      icon: CheckCircle,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Visitor Management</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

