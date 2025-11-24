import { useState, useMemo, useEffect } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Visitor } from '../types';
import { fetchApprovedRequests, mapPendingRequestToVisitor, fetchVendorVisits, mapVendorVisitToVisitor, fetchFamilyVisits, mapFamilyVisitToVisitor } from '../services/api';

interface ApprovedVisitorRequestsProps {
  onVisitorClick: (visitor: Visitor) => void;
}

export const ApprovedVisitorRequests = ({
  onVisitorClick,
}: ApprovedVisitorRequestsProps) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadApprovedRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch from all three APIs in parallel
        const [staffResponse, vendorResponse, familyResponse] = await Promise.all([
          fetchApprovedRequests().catch(() => ({ status: 'APPROVED', count: 0, records: [] })),
          fetchVendorVisits('APPROVED').catch(() => ({ status: 'APPROVED', count: 0, records: [] })),
          fetchFamilyVisits('APPROVED').catch(() => ({ status: 'APPROVED', count: 0, records: [] }))
        ]);

        // Map staff requests
        const staffVisitors = staffResponse.records.map(mapPendingRequestToVisitor);
        
        // Group vendor visits by request_id
        const vendorRecords = vendorResponse.records.filter(record => 
          record.category === 'External' && 
          record.sub_category === 'Vendor / Supplier'
        );
        
        // Group by request_id
        const groupedVendors = vendorRecords.reduce((acc, record) => {
          const key = record.request_id;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(record);
          return acc;
        }, {} as Record<number, typeof vendorRecords>);
        
        // Create visitor entries for each vendor group
        const vendorVisitors: Visitor[] = Object.entries(groupedVendors).map(([requestId, records]) => {
          // Use the first record for vendor info (all have same vendor_name and vendor_address)
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
        const groupedFamilies = familyResponse.records.reduce((acc, record) => {
          const key = record.request_id;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(record);
          return acc;
        }, {} as Record<number, typeof familyResponse.records>);
        
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
        
        // Combine all lists
        setVisitors([...staffVisitors, ...vendorVisitors, ...familyVisitors]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load approved requests');
      } finally {
        setLoading(false);
      }
    };

    loadApprovedRequests();
  }, []);

  const filteredVisitors = useMemo(() => {
    return visitors.filter(visitor => {
      const matchesSearch =
        visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.purposeOfVisit.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [visitors, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Loading approved requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">Error loading approved requests</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contractor': return 'bg-blue-100 text-blue-800';
      case 'vendor': return 'bg-purple-100 text-purple-800';
      case 'guest': return 'bg-emerald-100 text-emerald-800';
      case 'interview': return 'bg-orange-100 text-orange-800';
      case 'delivery': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company, host, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing <span className="font-medium text-slate-800">{filteredVisitors.length}</span> approved request(s)
        </p>
      </div>

      {/* Visitor List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-200">
          {filteredVisitors.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500">No approved visitor requests found</p>
            </div>
          ) : (
            filteredVisitors.map((visitor) => {
              const originalCategory = (visitor as any).originalCategory || visitor.category;
              const groupedVisitors = (visitor as any).groupedVisitors;
              const isVendorGroup = groupedVisitors && groupedVisitors.length > 0 && (visitor as any).apiType === 'hk03';
              const isFamilyGroup = groupedVisitors && groupedVisitors.length > 0 && (visitor as any).apiType === 'hk02';
              
              // Format visit date
              const formatDate = (dateStr: string) => {
                if (!dateStr) return 'N/A';
                try {
                  const date = new Date(dateStr);
                  return date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                } catch (e) {
                  return 'N/A';
                }
              };
              
              return (
                <div
                  key={visitor.id}
                  className="p-6 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-200 last:border-b-0"
                  onClick={() => onVisitorClick(visitor)}
                >
                  {isVendorGroup ? (
                    // Vendor grouped display
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">{(visitor as any).vendorName || visitor.company}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(visitor.category)}`}>
                          {originalCategory}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{(visitor as any).vendorAddress || 'N/A'}</p>
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-slate-200">
                        {groupedVisitors.map((grouped: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{grouped.visitorName}</span>
                            </div>
                            <p className="text-sm text-slate-600">{grouped.purposeOfVisit}</p>
                            <p className="text-xs text-slate-500">Visit Date: {formatDate(grouped.visitDate)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : isFamilyGroup ? (
                    // Family grouped display
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">Family Visit</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Family Visit
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">Employee ID: {visitor.empId || 'N/A'}</p>
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-slate-200">
                        {groupedVisitors.map((grouped: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{grouped.visitorName}</span>
                              {grouped.relationship && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                                  {grouped.relationship}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{grouped.purposeOfVisit}</p>
                            <p className="text-xs text-slate-500">Visit Date: {formatDate(grouped.visitDate)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Regular staff display
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {visitor.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800">{visitor.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(visitor.category)}`}>
                            {originalCategory}
                          </span>
                          {visitor.subcategory && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                              {visitor.subcategory}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 truncate">{visitor.company}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

