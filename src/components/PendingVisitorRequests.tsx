import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Loader2, AlertCircle } from 'lucide-react';
import { Visitor } from '../types';
import { fetchPendingRequests, mapPendingRequestToVisitor, fetchVendorVisits, mapVendorVisitToVisitor, fetchFamilyVisits, mapFamilyVisitToVisitor } from '../services/api';

interface PendingVisitorRequestsProps {
  onVisitorClick: (visitor: Visitor) => void;
  onApprove?: (visitorId: string) => Promise<void>;
  onReject?: (visitorId: string) => Promise<void>;
}

export const PendingVisitorRequests = ({
  onVisitorClick,
  onApprove,
  onReject,
}: PendingVisitorRequestsProps) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from all three APIs in parallel
      const [staffResponse, vendorResponse, familyResponse] = await Promise.all([
        fetchPendingRequests().catch(() => ({ status: 'PENDING', count: 0, records: [] })),
        fetchVendorVisits('PENDING').catch(() => ({ status: 'PENDING', count: 0, records: [] })),
        fetchFamilyVisits('PENDING').catch(() => ({ status: 'PENDING', count: 0, records: [] }))
      ]);

      // Map staff requests
      const staffVisitors = staffResponse.records.map(mapPendingRequestToVisitor);
      
      // Group vendor visits by request_id and create grouped visitors
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
      setError(err instanceof Error ? err.message : 'Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const handleApprove = async (visitorId: string) => {
    if (!onApprove) return;
    try {
      setProcessingId(visitorId);
      await onApprove(visitorId);
      // Refresh the list after approval
      await loadPendingRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      setError(error instanceof Error ? error.message : 'Failed to approve request');
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (visitorId: string) => {
    if (!onReject) return;
    try {
      setProcessingId(visitorId);
      await onReject(visitorId);
      // Refresh the list after rejection
      await loadPendingRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError(error instanceof Error ? error.message : 'Failed to reject request');
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  // Get unique categories and subcategories from API data
  // Use originalCategory if available, otherwise use mapped category
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      visitors.map(v => (v as any).originalCategory || v.category)
    );
    return Array.from(uniqueCategories);
  }, [visitors]);

  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'all') {
      // Get all unique subcategories from visitors
      const allSubcategories = new Set(
        visitors.map(v => v.subcategory).filter(Boolean)
      );
      return Array.from(allSubcategories) as string[];
    }
    // Get subcategories for the selected category (using originalCategory if available)
    const subcategories = visitors
      .filter(v => {
        const visitorCategory = (v as any).originalCategory || v.category;
        return visitorCategory === selectedCategory || v.category === selectedCategory;
      })
      .map(v => v.subcategory)
      .filter(Boolean);
    return Array.from(new Set(subcategories)) as string[];
  }, [visitors, selectedCategory]);

  const filteredVisitors = useMemo(() => {
    return visitors.filter(visitor => {
      const matchesSearch =
        visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.purposeOfVisit.toLowerCase().includes(searchTerm.toLowerCase());

      const visitorCategory = (visitor as any).originalCategory || visitor.category;
      const matchesCategory = selectedCategory === 'all' || visitorCategory === selectedCategory || visitor.category === selectedCategory;
      
      const matchesSubcategory = 
        selectedSubcategory === 'all' || 
        visitor.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase() ||
        (!visitor.subcategory && selectedSubcategory === 'all');

      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [visitors, searchTerm, selectedCategory, selectedSubcategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Loading pending requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">Error loading pending requests</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
        </div>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company, host, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Category and Subcategory Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory('all'); // Reset subcategory when category changes
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subcategory
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={selectedCategory === 'all' || availableSubcategories.length === 0}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="all">All Subcategories</option>
                {availableSubcategories.map((subcat) => (
                  <option key={subcat} value={subcat}>
                    {subcat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing <span className="font-medium text-slate-800">{filteredVisitors.length}</span> pending request(s)
        </p>
      </div>

      {/* Visitor List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-200">
          {filteredVisitors.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500">No pending visitor requests found for the selected criteria</p>
            </div>
          ) : (
            filteredVisitors.map((visitor) => {
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
              
              const originalCategory = (visitor as any).originalCategory || visitor.category;
              const groupedVisitors = (visitor as any).groupedVisitors;
              const isVendorGroup = groupedVisitors && groupedVisitors.length > 0 && (visitor as any).apiType === 'hk03';
              const isFamilyGroup = groupedVisitors && groupedVisitors.length > 0 && (visitor as any).apiType === 'hk02';
              
              // Format visit date
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
                  className="p-6 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-200 last:border-b-0"
                  onClick={() => onVisitorClick(visitor)}
                >
                  {isVendorGroup ? (
                    // Vendor grouped display
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800">{(visitor as any).vendorName || visitor.company}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(visitor.category)}`}>
                              {originalCategory}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{(visitor as any).vendorAddress || 'N/A'}</p>
                        </div>
                        {onApprove && onReject && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleApprove(visitor.id)}
                              disabled={processingId === visitor.id}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm"
                            >
                              {processingId === visitor.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(visitor.id)}
                              disabled={processingId === visitor.id}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm"
                            >
                              {processingId === visitor.id ? 'Processing...' : 'Reject'}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 space-y-3 pl-4 border-l-2 border-slate-200">
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
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800">Family Visit</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Family Visit
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">Employee ID: {visitor.empId || 'N/A'}</p>
                        </div>
                        {onApprove && onReject && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleApprove(visitor.id)}
                              disabled={processingId === visitor.id}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm"
                            >
                              {processingId === visitor.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(visitor.id)}
                              disabled={processingId === visitor.id}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm"
                            >
                              {processingId === visitor.id ? 'Processing...' : 'Reject'}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 space-y-3 pl-4 border-l-2 border-slate-200">
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
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
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
                      {onApprove && onReject && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleApprove(visitor.id)}
                            disabled={processingId === visitor.id}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm"
                          >
                            {processingId === visitor.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(visitor.id)}
                            disabled={processingId === visitor.id}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm"
                          >
                            {processingId === visitor.id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      )}
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

