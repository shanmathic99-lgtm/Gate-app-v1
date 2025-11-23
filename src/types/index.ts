export interface Visitor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  category: 'contractor' | 'vendor' | 'guest' | 'interview' | 'delivery';
  purposeOfVisit: string;
  hostName: string;
  hostDepartment: string;
  checkInTime: string;
  checkOutTime?: string;
  accessEndTime?: string;
  photo?: string;
  status: 'checked-in' | 'checked-out' | 'scheduled';
  approvals: Approval[];
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
