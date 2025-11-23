import { Building2, Clock, User, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Visitor } from '../types';

interface VisitorCardProps {
  visitor: Visitor;
  onClick: () => void;
}

export const VisitorCard = ({ visitor, onClick }: VisitorCardProps) => {
  const getStatusConfig = (status: Visitor['status']) => {
    switch (status) {
      case 'checked-in':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          icon: CheckCircle,
          label: 'Checked In'
        };
      case 'checked-out':
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
          icon: XCircle,
          label: 'Checked Out'
        };
      case 'scheduled':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          icon: AlertCircle,
          label: 'Scheduled'
        };
    }
  };

  const hasRejectedApprovals = visitor.approvals.some(a => a.status === 'rejected');
  
  // Override status config if visitor has rejected approvals
  const statusConfig = hasRejectedApprovals 
    ? {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: X,
        label: 'Rejected'
      }
    : getStatusConfig(visitor.status);
  const StatusIcon = statusConfig.icon;

  const getCategoryColor = (category: Visitor['category']) => {
    switch (category) {
      case 'contractor': return 'bg-blue-100 text-blue-800';
      case 'vendor': return 'bg-purple-100 text-purple-800';
      case 'guest': return 'bg-emerald-100 text-emerald-800';
      case 'interview': return 'bg-orange-100 text-orange-800';
      case 'delivery': return 'bg-cyan-100 text-cyan-800';
    }
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      onClick={onClick}
      className="p-6 hover:bg-slate-50 cursor-pointer transition-colors relative"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
            {visitor.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-800 truncate">{visitor.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(visitor.category)} capitalize`}>
                {visitor.category}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span className="truncate">{visitor.company}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="truncate">Host: {visitor.hostName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            <div>
              <div className="font-medium">In: {formatTime(visitor.checkInTime)}</div>
              {visitor.checkOutTime && (
                <div className="text-xs">Out: {formatTime(visitor.checkOutTime)}</div>
              )}
            </div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="font-medium text-sm whitespace-nowrap">{statusConfig.label}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pl-16 text-sm text-slate-600">
        <p className="truncate">Purpose: {visitor.purposeOfVisit}</p>
      </div>
    </div>
  );
};
