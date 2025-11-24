export interface Visitor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  category: 'contractor' | 'vendor' | 'guest' | 'interview' | 'delivery';
  subcategory?: string;
  purposeOfVisit: string;
  hostName: string;
  hostDepartment: string;
  checkInTime: string;
  checkOutTime?: string;
  accessEndTime?: string;
  photo?: string;
  status: 'checked-in' | 'checked-out' | 'scheduled';
  approvals: Approval[];
  // Additional API fields
  empId?: number;
  originalId?: number; // Original ID from API for approve/reject operations
  apiType?: 'hk04' | 'hk03'; // API type to determine which endpoint to use
  aadharCard?: string | null;
  buildingNumber?: string;
  visitDate?: string;
  createdAt?: string;
  approvedAt?: string | null;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  metadataJson?: Record<string, any> | null;
  deliveryManagerEmail?: string;
  approvalEmail?: string | null;
  originalCategory?: string; // Original category from API (e.g., "External")
  // Vendor API specific fields
  requestId?: number;
  vendorName?: string;
  vendorAddress?: string;
  companyContact?: string;
  requestedAt?: string;
  document?: string | null;
  // Family API specific fields
  visitorGender?: string;
  visitorRelationship?: string;
}

export interface Approval {
  id: string;
  approverName: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: string;
  comments?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'security';
  name: string;
}
