import { X, Mail, Phone, Building2, User, Clock, CheckCircle, XCircle, Camera, Upload, AlertTriangle } from 'lucide-react';
import { Visitor } from '../types';
import { useRef, useState } from 'react';

interface VisitorModalProps {
  visitor: Visitor;
  onClose: () => void;
  onCheckOut: (visitorId: string) => void;
  onPhotoUpdate: (visitorId: string, photo: string) => void;
}

export const VisitorModal = ({ visitor, onClose, onCheckOut, onPhotoUpdate }: VisitorModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState(visitor.photo);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhoto(result);
        onPhotoUpdate(visitor.id, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (timeStr: string | undefined | null) => {
    try {
      if (!timeStr) return 'N/A';
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const hasRejectedApprovals = visitor.approvals?.some(a => a.status === 'rejected') || false;

  // Safety check - if visitor is invalid, don't render
  if (!visitor || !visitor.id) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Visitor Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div className="flex flex-col items-center">
                  {photo ? (
                    <img
                      src={photo}
                      alt={visitor.name}
                      className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-lg">
                      {visitor.name.charAt(0)}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                  >
                    {photo ? <Camera className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    {photo ? 'Update Photo' : 'Add Photo'}
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-sm w-full justify-center ${
                    hasRejectedApprovals ? 'bg-red-50 text-red-700 border-red-200' :
                    visitor.status === 'checked-in' ? 'bg-green-50 text-green-700 border-green-200' :
                    visitor.status === 'checked-out' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {hasRejectedApprovals && <X className="w-4 h-4" />}
                    {!hasRejectedApprovals && visitor.status === 'checked-in' && <CheckCircle className="w-4 h-4" />}
                    {!hasRejectedApprovals && visitor.status === 'checked-out' && <XCircle className="w-4 h-4" />}
                    <span className="capitalize">
                      {hasRejectedApprovals ? 'Rejected' : visitor.status.replace('-', ' ')}
                    </span>
                  </span>
                </div>

                {visitor.status === 'checked-in' && !hasRejectedApprovals && (
                  <button
                    onClick={() => {
                      onCheckOut(visitor.id);
                      onClose();
                    }}
                    className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition font-medium"
                  >
                    Check Out Visitor
                  </button>
                )}
                
                {hasRejectedApprovals && (
                  <div className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium text-center">
                      Check-in not allowed due to rejected approvals
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Full Name</label>
                    <p className="font-medium text-slate-800">{visitor.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Company</label>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <p className="font-medium text-slate-800">{visitor.company}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <p className="font-medium text-slate-800">{visitor.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <p className="font-medium text-slate-800">{visitor.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Visit Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Category</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      visitor.category === 'contractor' ? 'bg-blue-100 text-blue-800' :
                      visitor.category === 'vendor' ? 'bg-purple-100 text-purple-800' :
                      visitor.category === 'guest' ? 'bg-emerald-100 text-emerald-800' :
                      visitor.category === 'interview' ? 'bg-orange-100 text-orange-800' :
                      'bg-cyan-100 text-cyan-800'
                    }`}>
                      {visitor.category}
                    </span>
                    {visitor.subcategory && (
                      <span className="ml-2 inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                        {visitor.subcategory}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Purpose of Visit</label>
                    <p className="font-medium text-slate-800">{visitor.purposeOfVisit}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Host</label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <p className="font-medium text-slate-800">{visitor.hostName}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Department</label>
                      <p className="font-medium text-slate-800">{visitor.hostDepartment}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Check-In Time</label>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <p className="font-medium text-slate-800">{formatTime(visitor.checkInTime)}</p>
                      </div>
                    </div>
                    {visitor.checkOutTime && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Check-Out Time</label>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <p className="font-medium text-slate-800">{formatTime(visitor.checkOutTime)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {visitor.empId && (
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Employee ID</label>
                      <p className="font-medium text-slate-800">{visitor.empId}</p>
                    </div>
                  )}
                  {visitor.buildingNumber && (
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Building Number</label>
                      <p className="font-medium text-slate-800">{visitor.buildingNumber}</p>
                    </div>
                  )}
                  {visitor.visitDate && (
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Visit Date</label>
                      <p className="font-medium text-slate-800">{visitor.visitDate}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* API-specific fields */}
              {(visitor.deliveryManagerEmail || visitor.approvalEmail || visitor.aadharCard || visitor.metadataJson || visitor.createdAt || visitor.approvedAt || (visitor as any).visitorGender || (visitor as any).visitorRelationship) && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Additional Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {visitor.deliveryManagerEmail && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Delivery Manager Email</label>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <p className="font-medium text-slate-800">{visitor.deliveryManagerEmail}</p>
                        </div>
                      </div>
                    )}
                    {visitor.approvalEmail && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Approval Email</label>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <p className="font-medium text-slate-800">{visitor.approvalEmail}</p>
                        </div>
                      </div>
                    )}
                    {(visitor as any).vendorName && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Vendor Name</label>
                        <p className="font-medium text-slate-800">{(visitor as any).vendorName}</p>
                      </div>
                    )}
                    {(visitor as any).vendorAddress && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Vendor Address</label>
                        <p className="font-medium text-slate-800">{(visitor as any).vendorAddress}</p>
                      </div>
                    )}
                    {(visitor as any).companyContact && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Company Contact</label>
                        <p className="font-medium text-slate-800">{(visitor as any).companyContact}</p>
                      </div>
                    )}
                    {(visitor as any).requestedAt && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Requested At</label>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <p className="font-medium text-slate-800">{formatTime((visitor as any).requestedAt)}</p>
                        </div>
                      </div>
                    )}
                    {(visitor as any).document && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Document</label>
                        <a 
                          href={(visitor as any).document} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                    {(visitor as any).visitorGender && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Gender</label>
                        <p className="font-medium text-slate-800">{(visitor as any).visitorGender}</p>
                      </div>
                    )}
                    {(visitor as any).visitorRelationship && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Relationship</label>
                        <p className="font-medium text-slate-800">{(visitor as any).visitorRelationship}</p>
                      </div>
                    )}
                    {visitor.aadharCard && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Aadhar Card</label>
                        <p className="font-medium text-slate-800">{visitor.aadharCard}</p>
                      </div>
                    )}
                    {visitor.createdAt && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Created At</label>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <p className="font-medium text-slate-800">{formatTime(visitor.createdAt)}</p>
                        </div>
                      </div>
                    )}
                    {visitor.approvedAt && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Approved At</label>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <p className="font-medium text-slate-800">{formatTime(visitor.approvedAt)}</p>
                        </div>
                      </div>
                    )}
                    {visitor.approvalStatus && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1 block">Approval Status</label>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          visitor.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          visitor.approvalStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {visitor.approvalStatus}
                        </span>
                      </div>
                    )}
                    {visitor.metadataJson && (
                      <div className="sm:col-span-2">
                        <label className="text-sm text-slate-600 mb-1 block">Metadata</label>
                        <pre className="bg-slate-50 p-3 rounded-lg text-sm text-slate-800 overflow-x-auto">
                          {JSON.stringify(visitor.metadataJson, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Grouped Visitors (for vendor and family visits) */}
              {(visitor as any).groupedVisitors && (visitor as any).groupedVisitors.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    {(visitor as any).apiType === 'hk02' ? 'Family Members' : 'Visitors'}
                  </h3>
                  <div className="space-y-4">
                    {(visitor as any).groupedVisitors.map((grouped: any, idx: number) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-800">{grouped.visitorName}</h4>
                          {grouped.relationship && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                              {grouped.relationship}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{grouped.purposeOfVisit || 'N/A'}</p>
                        <p className="text-xs text-slate-500">
                          Visit Date: {formatTime(grouped.visitDate || grouped.visitDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Approvals Required ({visitor.category})
                </h3>
                <div className="space-y-3">
                  {(visitor.approvals || []).map((approval) => (
                    <div
                      key={approval.id}
                      className={`border rounded-lg p-4 ${getStatusColor(approval.status)} ${
                        approval.status === 'rejected' ? 'border-red-300 border-2' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2">
                          {approval.status === 'rejected' && (
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          )}
                          {approval.status === 'approved' && (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold">{approval.approverName}</p>
                            <p className="text-sm opacity-80">{approval.approverRole}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                          approval.status === 'rejected' ? 'bg-red-200 border-red-400' : ''
                        }`}>
                          {approval.status}
                        </span>
                      </div>
                      {approval.timestamp && (
                        <p className="text-xs opacity-75 mb-1">
                          {formatTime(approval.timestamp)}
                        </p>
                      )}
                      {approval.comments && (
                        <p className={`text-sm mt-2 ${
                          approval.status === 'rejected' ? 'font-medium text-red-800' : 'italic'
                        }`}>
                          "{approval.comments}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
