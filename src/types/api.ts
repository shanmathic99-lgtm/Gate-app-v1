export interface PendingRequestRecord {
  id: number;
  emp_id: number;
  staff_name: string;
  consultancy_name: string;
  category: string;
  sub_category: string;
  delivery_manager_emailid: string;
  approval_email: string | null;
  phone_number: string;
  infy_email: string;
  aadhar_card: string | null;
  metadata_json: Record<string, any> | null;
  visit_date: string;
  building_number: string;
  created_at: string;
  approved_at: string | null;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface PendingRequestsResponse {
  status: string;
  count: number;
  records: PendingRequestRecord[];
}

export interface VendorVisitRecord {
  visit_id: number;
  request_id: number;
  emp_id: number;
  category: string;
  sub_category: string;
  vendor_name: string;
  vendor_address: string;
  company_contact: string;
  visitor_name: string;
  purpose_of_visit: string;
  document: string | null;
  visit_date: string;
  metadata: Record<string, any> | null;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  requested_at: string;
  approved_at: string | null;
}

export interface VendorVisitsResponse {
  status: string;
  count: number;
  records: VendorVisitRecord[];
}

export interface FamilyVisitRecord {
  visit_id: number;
  request_id: number;
  emp_id: number;
  visitor_name: string;
  visitor_gender: string;
  visitor_relationship: string;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  metadata_json: Record<string, any> | null;
  created_at: string;
  requested_at: string;
  approved_at: string | null;
}

export interface FamilyVisitsResponse {
  status: string;
  count: number;
  records: FamilyVisitRecord[];
}

