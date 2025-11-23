import { PendingRequestsResponse, VendorVisitsResponse, FamilyVisitsResponse } from '../types/api';
import { Visitor, Approval } from '../types';

const API_BASE_URL = 'https://lun94pxmtb.execute-api.ap-southeast-2.amazonaws.com/default/hk04';
const VENDOR_API_BASE_URL = 'https://jl7yevnyp9.execute-api.ap-southeast-2.amazonaws.com/default/hk03';
const FAMILY_API_BASE_URL = 'https://44wmv2jdqi.execute-api.ap-southeast-2.amazonaws.com/default/hk02';

export const fetchPendingRequests = async (): Promise<PendingRequestsResponse> => {
  const response = await fetch(`${API_BASE_URL}?status=pending`);
  if (!response.ok) {
    throw new Error('Failed to fetch pending requests');
  }
  return response.json();
};

export const fetchApprovedRequests = async (): Promise<PendingRequestsResponse> => {
  const response = await fetch(`${API_BASE_URL}?status=approved`);
  if (!response.ok) {
    throw new Error('Failed to fetch approved requests');
  }
  return response.json();
};

export const fetchVendorVisits = async (status: 'PENDING' | 'APPROVED' = 'PENDING'): Promise<VendorVisitsResponse> => {
  const response = await fetch(`${VENDOR_API_BASE_URL}?status=${status}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vendor visits');
  }
  return response.json();
};

export const fetchFamilyVisits = async (status: 'PENDING' | 'APPROVED' = 'PENDING'): Promise<FamilyVisitsResponse> => {
  const response = await fetch(`${FAMILY_API_BASE_URL}?status=${status}`);
  if (!response.ok) {
    throw new Error('Failed to fetch family visits');
  }
  return response.json();
};

export const updateApprovalStatus = async (id: number, approvalStatus: 'APPROVED' | 'REJECTED', apiType: 'hk04' | 'hk03' | 'hk02' = 'hk04', useRequestId: boolean = false): Promise<void> => {
  let baseUrl: string;
  if (apiType === 'hk04') {
    baseUrl = API_BASE_URL;
  } else if (apiType === 'hk03') {
    baseUrl = VENDOR_API_BASE_URL;
  } else {
    baseUrl = FAMILY_API_BASE_URL;
  }
  
  // For hk04 (staff API): use 'id' with structure { "id": 1, "approval_status": "APPROVED" }
  // For hk03 (vendor API) and hk02 (family API): use 'request_id' with structure { "request_id": 3, "approval_status": "APPROVED" }
  let requestBody: any;
  if (apiType === 'hk04') {
    requestBody = { id, approval_status: approvalStatus };
  } else {
    // For vendor API (hk03) and family API (hk02), always use request_id (same structure as vendor API)
    requestBody = { request_id: id, approval_status: approvalStatus };
  }
  
  const response = await fetch(baseUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to ${approvalStatus.toLowerCase()} request: ${errorText}`);
  }
};

export const mapFamilyVisitToVisitor = (record: FamilyVisitsResponse['records'][0]): Visitor => {
  const approvalStatus = record.approval_status?.toLowerCase() || 'pending';
  const approvals: Approval[] = [
    {
      id: `family-pending-${record.visit_id}`,
      approverName: 'Manager',
      approverRole: 'Manager',
      status: approvalStatus === 'approved' ? 'approved' : 'pending',
      timestamp: record.created_at,
    }
  ];

  return {
    id: `family-${record.visit_id}`,
    name: record.visitor_name,
    email: `${record.visitor_name.toLowerCase().replace(' ', '.')}@family.com`,
    phone: 'N/A',
    company: 'Family Visit',
    category: 'guest',
    subcategory: record.visitor_relationship,
    purposeOfVisit: record.metadata_json?.purpose || 'Family visit',
    hostName: `Employee ${record.emp_id}`,
    hostDepartment: 'Family',
    checkInTime: record.requested_at ? new Date(record.requested_at).toISOString() : new Date().toISOString(),
    accessEndTime: record.requested_at ? new Date(new Date(record.requested_at).getTime() + 4 * 60 * 60 * 1000).toISOString() : undefined,
    status: 'scheduled',
    approvals,
    // Store additional API fields
    ...{
      empId: record.emp_id,
      originalId: record.visit_id,
      requestId: record.request_id,
      visitorGender: record.visitor_gender,
      visitorRelationship: record.visitor_relationship,
      visitDate: record.requested_at,
      createdAt: record.created_at,
      requestedAt: record.requested_at,
      approvedAt: record.approved_at,
      approvalStatus: record.approval_status,
      metadataJson: record.metadata_json,
      originalCategory: 'Family Visit',
      apiType: 'hk02' as const, // Mark this as family API
    }
  } as any;
};

export const mapVendorVisitToVisitor = (record: VendorVisitsResponse['records'][0]): Visitor => {
  const approvalStatus = record.approval_status?.toLowerCase() || 'pending';
  const approvals: Approval[] = [
    {
      id: `vendor-pending-${record.visit_id}`,
      approverName: 'Manager',
      approverRole: 'Manager',
      status: approvalStatus === 'approved' ? 'approved' : 'pending',
      timestamp: record.created_at,
    }
  ];

  return {
    id: `vendor-${record.visit_id}`,
    name: record.visitor_name,
    email: record.company_contact.includes('@') ? record.company_contact : `${record.visitor_name.toLowerCase().replace(' ', '.')}@vendor.com`,
    phone: record.company_contact,
    company: record.vendor_name,
    category: mapCategoryToVisitorCategory(record.category),
    subcategory: record.sub_category,
    purposeOfVisit: record.purpose_of_visit,
    hostName: 'Manager',
    hostDepartment: record.vendor_address || 'N/A',
    checkInTime: record.visit_date ? new Date(record.visit_date).toISOString() : new Date().toISOString(),
    accessEndTime: record.visit_date ? new Date(new Date(record.visit_date).getTime() + 8 * 60 * 60 * 1000).toISOString() : undefined,
    status: 'scheduled',
    approvals,
    // Store additional API fields
    ...{
      empId: record.emp_id,
      originalId: record.visit_id, // Use visit_id for vendor API
      requestId: record.request_id,
      vendorName: record.vendor_name,
      vendorAddress: record.vendor_address,
      companyContact: record.company_contact,
      visitDate: record.visit_date,
      createdAt: record.created_at,
      requestedAt: record.requested_at,
      approvedAt: record.approved_at,
      approvalStatus: record.approval_status,
      metadataJson: record.metadata,
      document: record.document,
      originalCategory: record.category,
      apiType: 'hk03' as const, // Mark this as vendor API
    }
  } as any;
};

export const mapPendingRequestToVisitor = (record: PendingRequestsResponse['records'][0]): Visitor => {
  // Map API response to Visitor type
  const approvalStatus = record.approval_status?.toLowerCase() || 'pending';
  const approvals: Approval[] = [
    {
      id: `pending-${record.id}`,
      approverName: record.delivery_manager_emailid.split('@')[0] || 'Manager',
      approverRole: 'Delivery Manager',
      status: approvalStatus === 'approved' ? 'approved' : 'pending',
      timestamp: record.created_at,
    }
  ];

  if (record.approval_email) {
    approvals.push({
      id: `approval-${record.id}`,
      approverName: record.approval_email.split('@')[0] || 'Approver',
      approverRole: 'Approver',
      status: approvalStatus === 'approved' ? 'approved' : 'pending',
      timestamp: record.approved_at || record.created_at,
    });
  }

  return {
    id: `api-${record.id}`,
    name: record.staff_name,
    email: record.infy_email || record.delivery_manager_emailid,
    phone: record.phone_number,
    company: record.consultancy_name,
    category: mapCategoryToVisitorCategory(record.category),
    subcategory: record.sub_category,
    purposeOfVisit: record.metadata_json?.project || `Visit to ${record.building_number}`,
    hostName: record.delivery_manager_emailid.split('@')[0] || 'Manager',
    hostDepartment: record.building_number || 'N/A',
    checkInTime: record.visit_date ? `${record.visit_date}T09:00:00` : new Date().toISOString(),
    accessEndTime: record.visit_date ? `${record.visit_date}T17:00:00` : undefined,
    status: 'scheduled',
    approvals,
    // Store additional API fields in a way that can be accessed
    ...{
      empId: record.emp_id,
      originalId: record.id, // Store original ID from API for approve/reject
      apiType: 'hk04' as const, // Mark this as staff API
      aadharCard: record.aadhar_card,
      buildingNumber: record.building_number,
      visitDate: record.visit_date,
      createdAt: record.created_at,
      approvedAt: record.approved_at,
      approvalStatus: record.approval_status,
      metadataJson: record.metadata_json,
      deliveryManagerEmail: record.delivery_manager_emailid,
      approvalEmail: record.approval_email,
      originalCategory: record.category, // Store original category from API
    }
  } as any;
};

const mapCategoryToVisitorCategory = (category: string): Visitor['category'] => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('contractor') || lowerCategory.includes('external') || lowerCategory === 'external') {
    return 'contractor';
  }
  if (lowerCategory.includes('vendor')) {
    return 'vendor';
  }
  if (lowerCategory.includes('guest')) {
    return 'guest';
  }
  if (lowerCategory.includes('interview')) {
    return 'interview';
  }
  if (lowerCategory.includes('delivery')) {
    return 'delivery';
  }
  // Default mapping for API categories
  if (lowerCategory.includes('it services') || lowerCategory.includes('services')) {
    return 'vendor';
  }
  return 'contractor'; // default to contractor for External category
};

