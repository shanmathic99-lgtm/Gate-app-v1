import { Search } from 'lucide-react';
import { useState } from 'react';
import { Visitor } from '../types';
import { VisitorCard } from './VisitorCard';

interface VisitorListProps {
  visitors: Visitor[];
  onVisitorClick: (visitor: Visitor) => void;
}

export const VisitorList = ({ visitors, onVisitorClick }: VisitorListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch =
      visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.hostName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || visitor.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || visitor.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company, or host..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="checked-in">Checked In</option>
              <option value="checked-out">Checked Out</option>
              <option value="scheduled">Scheduled</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">All Categories</option>
              <option value="contractor">Contractor</option>
              <option value="vendor">Vendor</option>
              <option value="guest">Guest</option>
              <option value="interview">Interview</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {filteredVisitors.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500">No visitors found for the selected criteria</p>
          </div>
        ) : (
          filteredVisitors.map((visitor) => (
            <VisitorCard
              key={visitor.id}
              visitor={visitor}
              onClick={() => onVisitorClick(visitor)}
            />
          ))
        )}
      </div>
    </div>
  );
};
