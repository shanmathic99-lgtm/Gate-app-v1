import { useState, useEffect } from 'react';
import { Calendar, LogOut, Users, UserCheck, UserX, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Visitor } from '../types';
import { generateMockVisitors } from '../utils/mockData';
import { VisitorList } from './VisitorList';
import { VisitorModal } from './VisitorModal';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  useEffect(() => {
    const date = new Date(selectedDate);
    setVisitors(generateMockVisitors(date));
  }, [selectedDate]);

  const stats = {
    total: visitors.length,
    checkedIn: visitors.filter(v => v.status === 'checked-in').length,
    checkedOut: visitors.filter(v => v.status === 'checked-out').length,
    scheduled: visitors.filter(v => v.status === 'scheduled').length,
  };

  const handleCheckOut = (visitorId: string) => {
    setVisitors(prev => prev.map(v =>
      v.id === visitorId
        ? { ...v, status: 'checked-out' as const, checkOutTime: new Date().toISOString() }
        : v
    ));
  };

  const handlePhotoUpdate = (visitorId: string, photo: string) => {
    setVisitors(prev => prev.map(v =>
      v.id === visitorId ? { ...v, photo } : v
    ));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Gate App</h1>
                <p className="text-sm text-slate-600">Monitor and manage facility access</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Daily Visitor Log</h2>
              <p className="text-sm text-slate-600 mt-1">Track all visitors by date</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
              <Calendar className="w-5 h-5 text-slate-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="outline-none text-slate-700 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Visitors</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Checked In</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.checkedIn}</p>
                </div>
                <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Checked Out</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-600">{stats.checkedOut}</p>
                </div>
                <UserX className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Scheduled</p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.scheduled}</p>
                </div>
                <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <VisitorList
          visitors={visitors}
          onVisitorClick={setSelectedVisitor}
        />
      </main>

      {selectedVisitor && (
        <VisitorModal
          visitor={selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
          onCheckOut={handleCheckOut}
          onPhotoUpdate={handlePhotoUpdate}
        />
      )}
    </div>
  );
};
