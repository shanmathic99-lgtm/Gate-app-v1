import { useState, useEffect } from 'react';
import { Calendar, LogOut, Users, UserCheck, UserX, Clock, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Visitor } from '../types';
import { generateMockVisitors } from '../utils/mockData';
import { VisitorList } from './VisitorList';
import { VisitorModal } from './VisitorModal';
import { QRScanner } from './QRScanner';
import { AdminSidebar } from './AdminSidebar';
import { PendingVisitorRequests } from './PendingVisitorRequests';
import { fetchPendingRequests, mapPendingRequestToVisitor, updateApprovalStatus, fetchVendorVisits, mapVendorVisitToVisitor, fetchApprovedRequests, fetchFamilyVisits, mapFamilyVisitToVisitor } from '../services/api';
import { ApprovedVisitorRequests } from './ApprovedVisitorRequests';

type AdminView = 'overview' | 'pending' | 'approved';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [allVisitors, setAllVisitors] = useState<Visitor[]>([]); // For admin views
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrError, setQrError] = useState<string>('');
  const [adminView, setAdminView] = useState<AdminView>('overview');
  const [pendingRequests, setPendingRequests] = useState<Visitor[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [overviewStats, setOverviewStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    // Only use mock data for security role, admin uses API data
    if (user?.role !== 'admin') {
      const date = new Date(selectedDate);
      setVisitors(generateMockVisitors(date));
    }
  }, [selectedDate, user?.role]);

  // Load visitors from multiple dates for admin views (last 30 days) - only for non-overview views
  useEffect(() => {
    if (user?.role === 'admin' && adminView !== 'overview') {
      const all: Visitor[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateVisitors = generateMockVisitors(date);
        all.push(...dateVisitors);
      }
      setAllVisitors(all);
    }
  }, [user?.role, adminView]);

  // Load overview stats and pending requests
  useEffect(() => {
    if (user?.role === 'admin' && adminView === 'overview') {
      const loadOverviewData = async () => {
        try {
          setLoadingStats(true);
          setLoadingPending(true);
          
          // Fetch pending and approved from all three APIs in parallel
          const [staffPending, staffApproved, vendorPending, vendorApproved, familyPending, familyApproved] = await Promise.all([
            fetchPendingRequests().catch(() => ({ status: 'PENDING', count: 0, records: [] })),
            fetchApprovedRequests().catch(() => ({ status: 'APPROVED', count: 0, records: [] })),
            fetchVendorVisits('PENDING').catch(() => ({ status: 'PENDING', count: 0, records: [] })),
            fetchVendorVisits('APPROVED').catch(() => ({ status: 'APPROVED', count: 0, records: [] })),
            fetchFamilyVisits('PENDING').catch(() => ({ status: 'PENDING', count: 0, records: [] })),
            fetchFamilyVisits('APPROVED').catch(() => ({ status: 'APPROVED', count: 0, records: [] }))
          ]);

          // Count staff requests
          const staffPendingCount = staffPending.records.length;
          const staffApprovedCount = staffApproved.records.length;

          // Count vendor requests (grouped by request_id)
          const vendorPendingRecords = vendorPending.records.filter(record => 
            record.category === 'External' && 
            record.sub_category === 'Vendor / Supplier'
          );
          const vendorApprovedRecords = vendorApproved.records.filter(record => 
            record.category === 'External' && 
            record.sub_category === 'Vendor / Supplier'
          );
          
          // Count unique request_ids for vendors
          const vendorPendingRequestIds = new Set(vendorPendingRecords.map(r => r.request_id));
          const vendorApprovedRequestIds = new Set(vendorApprovedRecords.map(r => r.request_id));
          
          const vendorPendingCount = vendorPendingRequestIds.size;
          const vendorApprovedCount = vendorApprovedRequestIds.size;

          // Count unique request_ids for family visits
          const familyPendingRequestIds = new Set(familyPending.records.map(r => r.request_id));
          const familyApprovedRequestIds = new Set(familyApproved.records.map(r => r.request_id));
          
          const familyPendingCount = familyPendingRequestIds.size;
          const familyApprovedCount = familyApprovedRequestIds.size;

          // Calculate totals
          const pending = staffPendingCount + vendorPendingCount + familyPendingCount;
          const approved = staffApprovedCount + vendorApprovedCount + familyApprovedCount;
          const total = pending + approved;

          setOverviewStats({
            total,
            pending,
            approved,
          });

          // Map staff requests for pending list
          const staffVisitors = staffPending.records.map(mapPendingRequestToVisitor);
          
          // Group vendor visits by request_id for pending list
          const groupedVendors = vendorPendingRecords.reduce((acc, record) => {
            const key = record.request_id;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(record);
            return acc;
          }, {} as Record<number, typeof vendorPendingRecords>);
          
          // Create visitor entries for each vendor group
          const vendorVisitors: Visitor[] = Object.entries(groupedVendors).map(([requestId, records]) => {
            const firstRecord = records[0];
            const visitor = mapVendorVisitToVisitor(firstRecord);
            
            // Store request_id for approval/rejection
            (visitor as any).requestId = parseInt(requestId);
            
            // Store grouped visitor data
            (visitor as any).groupedVisitors = records.map(r => ({
              visitId: r.visit_id,
              visitorName: r.visitor_name,
              purposeOfVisit: r.purpose_of_visit,
              visitDate: r.visit_date,
            }));
            
            return visitor;
          });

          // Group family visits by request_id
          const groupedFamilies = familyPending.records.reduce((acc, record) => {
            const key = record.request_id;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(record);
            return acc;
          }, {} as Record<number, typeof familyPending.records>);
          
          // Create visitor entries for each family group
          const familyVisitors: Visitor[] = Object.entries(groupedFamilies).map(([requestId, records]) => {
            const firstRecord = records[0];
            const visitor = mapFamilyVisitToVisitor(firstRecord);
            
            // Store request_id for approval/rejection
            (visitor as any).requestId = parseInt(requestId);
            
            // Store grouped visitor data
            (visitor as any).groupedVisitors = records.map(r => ({
              visitId: r.visit_id,
              visitorName: r.visitor_name,
              purposeOfVisit: r.metadata_json?.purpose || 'Family visit',
              visitDate: r.requested_at,
              relationship: r.visitor_relationship,
              gender: r.visitor_gender,
            }));
            
            return visitor;
          });
          
          // Combine all lists for pending requests display
          setPendingRequests([...staffVisitors, ...vendorVisitors, ...familyVisitors]);

          // Also set all visitors for the VisitorList component in overview
          // Combine all pending and approved visitors
          const staffApprovedVisitors = staffApproved.records.map(mapPendingRequestToVisitor);
          
          // Group approved vendor visits
          const groupedApprovedVendors = vendorApprovedRecords.reduce((acc, record) => {
            const key = record.request_id;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(record);
            return acc;
          }, {} as Record<number, typeof vendorApprovedRecords>);
          
          const approvedVendorVisitors: Visitor[] = Object.entries(groupedApprovedVendors).map(([requestId, records]) => {
            const firstRecord = records[0];
            const visitor = mapVendorVisitToVisitor(firstRecord);
            (visitor as any).requestId = parseInt(requestId);
            (visitor as any).groupedVisitors = records.map(r => ({
              visitId: r.visit_id,
              visitorName: r.visitor_name,
              purposeOfVisit: r.purpose_of_visit,
              visitDate: r.visit_date,
            }));
            return visitor;
          });

          // Group approved family visits
          const groupedApprovedFamilies = familyApproved.records.reduce((acc, record) => {
            const key = record.request_id;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(record);
            return acc;
          }, {} as Record<number, typeof familyApproved.records>);
          
          const approvedFamilyVisitors: Visitor[] = Object.entries(groupedApprovedFamilies).map(([requestId, records]) => {
            const firstRecord = records[0];
            const visitor = mapFamilyVisitToVisitor(firstRecord);
            (visitor as any).requestId = parseInt(requestId);
            (visitor as any).groupedVisitors = records.map(r => ({
              visitId: r.visit_id,
              visitorName: r.visitor_name,
              purposeOfVisit: r.metadata_json?.purpose || 'Family visit',
              visitDate: r.requested_at,
              relationship: r.visitor_relationship,
              gender: r.visitor_gender,
            }));
            return visitor;
          });

          // Set all visitors (pending + approved) for the overview list
          setVisitors([...staffVisitors, ...vendorVisitors, ...familyVisitors, ...staffApprovedVisitors, ...approvedVendorVisitors, ...approvedFamilyVisitors]);
        } catch (err) {
          console.error('Failed to load overview data:', err);
        } finally {
          setLoadingStats(false);
          setLoadingPending(false);
        }
      };
      loadOverviewData();
    }
  }, [user?.role, adminView]);

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
    setAllVisitors(prev => prev.map(v =>
      v.id === visitorId
        ? { ...v, status: 'checked-out' as const, checkOutTime: new Date().toISOString() }
        : v
    ));
  };

  const handlePhotoUpdate = (visitorId: string, photo: string) => {
    setVisitors(prev => prev.map(v =>
      v.id === visitorId ? { ...v, photo } : v
    ));
    setAllVisitors(prev => prev.map(v =>
      v.id === visitorId ? { ...v, photo } : v
    ));
  };

  const handleApprove = async (visitorId: string) => {
    // Find the visitor to get the original ID and API type
    const visitor = pendingRequests.find(v => v.id === visitorId) || 
                    allVisitors.find(v => v.id === visitorId);
    
    if (!visitor) {
      throw new Error('Visitor not found');
    }

    const apiType = (visitor as any)?.apiType || 'hk04';
    const groupedVisitors = (visitor as any)?.groupedVisitors;
    const requestId = (visitor as any)?.requestId;
    
    if (apiType === 'hk03' || apiType === 'hk02') {
      // For vendor API (hk03) and family API (hk02), always use request_id
      if (!requestId) {
        throw new Error('Request ID is required for vendor/family API');
      }
      await updateApprovalStatus(requestId, 'APPROVED', apiType, true);
    } else {
      // For staff API (hk04), use originalId (which is the id field)
      const originalId = (visitor as any)?.originalId;
      if (!originalId) {
        throw new Error('Invalid visitor ID format');
      }
      await updateApprovalStatus(originalId, 'APPROVED', apiType);
    }
  };

  const handleReject = async (visitorId: string) => {
    // Find the visitor to get the original ID and API type
    const visitor = pendingRequests.find(v => v.id === visitorId) || 
                    allVisitors.find(v => v.id === visitorId);
    
    if (!visitor) {
      throw new Error('Visitor not found');
    }

    const apiType = (visitor as any)?.apiType || 'hk04';
    const groupedVisitors = (visitor as any)?.groupedVisitors;
    const requestId = (visitor as any)?.requestId;
    
    if (apiType === 'hk03' || apiType === 'hk02') {
      // For vendor API (hk03) and family API (hk02), always use request_id
      if (!requestId) {
        throw new Error('Request ID is required for vendor/family API');
      }
      await updateApprovalStatus(requestId, 'REJECTED', apiType, true);
    } else {
      // For staff API (hk04), use originalId (which is the id field)
      const originalId = (visitor as any)?.originalId;
      if (!originalId) {
        throw new Error('Invalid visitor ID format');
      }
      await updateApprovalStatus(originalId, 'REJECTED', apiType);
    }
  };

  const findVisitorById = (visitorId: string): Visitor | null => {
    // Search in current date's visitors first
    const currentVisitor = visitors.find(v => v.id === visitorId);
    if (currentVisitor) {
      return currentVisitor;
    }

    // If not found, search in other dates (last 7 days)
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const pastVisitors = generateMockVisitors(date);
      const found = pastVisitors.find(v => v.id === visitorId);
      if (found) {
        return found;
      }
    }

    return null;
  };

  const handleQRScanSuccess = (scannedData: string) => {
    setQrError('');
    setShowQRScanner(false);

    // Try to parse the scanned data as visitor ID
    // QR code should contain visitor ID (e.g., "2024-11-22-001")
    const visitor = findVisitorById(scannedData);

    if (visitor) {
      setSelectedVisitor(visitor);
    } else {
      setQrError(`Visitor with ID "${scannedData}" not found. Please check the QR code.`);
      // Show error for 3 seconds
      setTimeout(() => setQrError(''), 3000);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className={`${isAdmin ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} py-4`}>
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

      <div className="flex flex-1">
        {isAdmin && (
          <AdminSidebar
            activeView={adminView}
            onViewChange={setAdminView}
          />
        )}

        <main className={`flex-1 ${isAdmin ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} py-8`}>
          {qrError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <p className="text-sm">{qrError}</p>
            </div>
          )}

          {isAdmin ? (
            // Admin Views
            <>
              {adminView === 'overview' && (
                <>
                  <div className="mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-800">Visitor Management Overview</h2>
                        <p className="text-sm text-slate-600 mt-1">View all visitor requests and their status</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Visitors</p>
                            {loadingStats ? (
                              <p className="text-2xl sm:text-3xl font-bold text-slate-400">...</p>
                            ) : (
                              <p className="text-2xl sm:text-3xl font-bold text-slate-800">{overviewStats.total}</p>
                            )}
                          </div>
                          <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-slate-600 mb-1">Pending Visitor Requests</p>
                            {loadingStats ? (
                              <p className="text-2xl sm:text-3xl font-bold text-slate-400">...</p>
                            ) : (
                              <p className="text-2xl sm:text-3xl font-bold text-amber-600">{overviewStats.pending}</p>
                            )}
                          </div>
                          <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-slate-600 mb-1">Approved Visitor Requests</p>
                            {loadingStats ? (
                              <p className="text-2xl sm:text-3xl font-bold text-slate-400">...</p>
                            ) : (
                              <p className="text-2xl sm:text-3xl font-bold text-green-600">{overviewStats.approved}</p>
                            )}
                          </div>
                          <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pending Requests Overview */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="p-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-800">Pending Requests</h3>
                      <p className="text-sm text-slate-600 mt-1">Click on any request to view details</p>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {loadingPending ? (
                        <div className="p-12 text-center">
                          <p className="text-slate-500">Loading pending requests...</p>
                        </div>
                      ) : pendingRequests.length === 0 ? (
                        <div className="p-12 text-center">
                          <p className="text-slate-500">No pending requests</p>
                        </div>
                      ) : (
                        pendingRequests.map((visitor) => {
                          const groupedVisitors = (visitor as any).groupedVisitors;
                          const isVendorGroup = groupedVisitors && groupedVisitors.length > 0 && (visitor as any).apiType === 'hk03';
                          const isFamilyGroup = groupedVisitors && groupedVisitors.length > 0 && (visitor as any).apiType === 'hk02';
                          const formatDate = (dateStr: string) => {
                            if (!dateStr) return 'N/A';
                            const date = new Date(dateStr);
                            return date.toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          };
                          
                          return (
                            <div
                              key={visitor.id}
                              onClick={() => setSelectedVisitor(visitor)}
                              className="p-6 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              {isVendorGroup ? (
                                // Vendor grouped display
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-lg font-semibold text-slate-800">{(visitor as any).vendorName || visitor.company}</h4>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      visitor.category === 'contractor' ? 'bg-blue-100 text-blue-800' :
                                      visitor.category === 'vendor' ? 'bg-purple-100 text-purple-800' :
                                      visitor.category === 'guest' ? 'bg-emerald-100 text-emerald-800' :
                                      visitor.category === 'interview' ? 'bg-orange-100 text-orange-800' :
                                      'bg-cyan-100 text-cyan-800'
                                    }`}>
                                      {visitor.originalCategory || visitor.category.charAt(0).toUpperCase() + visitor.category.slice(1)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600 mb-3">{(visitor as any).vendorAddress || 'N/A'}</p>
                                  <div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-200">
                                    {groupedVisitors.map((grouped: any, idx: number) => (
                                      <div key={idx} className="text-sm">
                                        <div className="font-medium text-slate-800">{grouped.visitorName}</div>
                                        <div className="text-slate-600">{grouped.purposeOfVisit}</div>
                                        <div className="text-xs text-slate-500">Visit Date: {formatDate(grouped.visitDate)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : isFamilyGroup ? (
                                // Family grouped display
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-lg font-semibold text-slate-800">Family Visit</h4>
                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                                      Family Visit
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600 mb-3">Employee ID: {visitor.empId || 'N/A'}</p>
                                  <div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-200">
                                    {groupedVisitors.map((grouped: any, idx: number) => (
                                      <div key={idx} className="text-sm">
                                        <div className="font-medium text-slate-800">
                                          {grouped.visitorName}
                                          {grouped.relationship && (
                                            <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                                              {grouped.relationship}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-slate-600">{grouped.purposeOfVisit}</div>
                                        <div className="text-xs text-slate-500">Visit Date: {formatDate(grouped.visitDate)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                // Regular staff display
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-lg font-semibold text-slate-800">{visitor.name}</h4>
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        visitor.category === 'contractor' ? 'bg-blue-100 text-blue-800' :
                                        visitor.category === 'vendor' ? 'bg-purple-100 text-purple-800' :
                                        visitor.category === 'guest' ? 'bg-emerald-100 text-emerald-800' :
                                        visitor.category === 'interview' ? 'bg-orange-100 text-orange-800' :
                                        'bg-cyan-100 text-cyan-800'
                                      }`}>
                                        {visitor.originalCategory || visitor.category.charAt(0).toUpperCase() + visitor.category.slice(1)}
                                      </span>
                                      {visitor.subcategory && (
                                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                                          {visitor.subcategory}
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                                      <div>
                                        <span className="font-medium">Company:</span> {visitor.company}
                                      </div>
                                      <div>
                                        <span className="font-medium">Visit Date:</span> {visitor.visitDate || 'N/A'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Building:</span> {visitor.buildingNumber || 'N/A'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Status:</span> {visitor.approvalStatus || 'PENDING'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <VisitorList
                    visitors={visitors}
                    onVisitorClick={setSelectedVisitor}
                  />
                </>
              )}

              {adminView === 'pending' && (
                <PendingVisitorRequests
                  onVisitorClick={setSelectedVisitor}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              )}

              {adminView === 'approved' && (
                <ApprovedVisitorRequests
                  onVisitorClick={setSelectedVisitor}
                />
              )}
            </>
          ) : (
            // Security View (original)
            <>
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">Daily Visitor Log</h2>
                    <p className="text-sm text-slate-600 mt-1">Track all visitors by date</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowQRScanner(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition font-medium"
                    >
                      <QrCode className="w-5 h-5" />
                      <span>Scan QR</span>
                    </button>
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
            </>
          )}
        </main>
      </div>

      {selectedVisitor && (
        <VisitorModal
          visitor={selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
          onCheckOut={handleCheckOut}
          onPhotoUpdate={handlePhotoUpdate}
        />
      )}

      {showQRScanner && (
        <QRScanner
          onScanSuccess={handleQRScanSuccess}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};
