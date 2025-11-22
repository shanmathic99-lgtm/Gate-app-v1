import { Visitor } from '../types';

export const generateMockVisitors = (date: Date): Visitor[] => {
  const dateStr = date.toISOString().split('T')[0];

  const visitors: Visitor[] = [
    {
      id: `${dateStr}-001`,
      name: 'John Anderson',
      email: 'john.anderson@techcorp.com',
      phone: '+1-555-0101',
      company: 'TechCorp Solutions',
      category: 'contractor',
      purposeOfVisit: 'Network Infrastructure Upgrade',
      hostName: 'Sarah Williams',
      hostDepartment: 'IT Operations',
      checkInTime: `${dateStr}T09:15:00`,
      status: 'checked-in',
      approvals: [
        {
          id: '1',
          approverName: 'Michael Chen',
          approverRole: 'IT Manager',
          status: 'approved',
          timestamp: `${dateStr}T08:30:00`,
          comments: 'Approved for full access to server room'
        },
        {
          id: '2',
          approverName: 'Lisa Rodriguez',
          approverRole: 'Security Manager',
          status: 'approved',
          timestamp: `${dateStr}T08:45:00`,
          comments: 'Background check cleared'
        }
      ]
    },
    {
      id: `${dateStr}-002`,
      name: 'Emily Thompson',
      email: 'emily.t@designstudio.com',
      phone: '+1-555-0202',
      company: 'Creative Design Studio',
      category: 'vendor',
      purposeOfVisit: 'Marketing Campaign Discussion',
      hostName: 'David Park',
      hostDepartment: 'Marketing',
      checkInTime: `${dateStr}T10:30:00`,
      checkOutTime: `${dateStr}T12:00:00`,
      status: 'checked-out',
      approvals: [
        {
          id: '3',
          approverName: 'David Park',
          approverRole: 'Marketing Director',
          status: 'approved',
          timestamp: `${dateStr}T09:00:00`
        }
      ]
    },
    {
      id: `${dateStr}-003`,
      name: 'Robert Martinez',
      email: 'r.martinez@email.com',
      phone: '+1-555-0303',
      company: 'N/A',
      category: 'interview',
      purposeOfVisit: 'Senior Developer Interview',
      hostName: 'Jennifer Lee',
      hostDepartment: 'Human Resources',
      checkInTime: `${dateStr}T14:00:00`,
      status: 'checked-in',
      approvals: [
        {
          id: '4',
          approverName: 'Jennifer Lee',
          approverRole: 'HR Manager',
          status: 'approved',
          timestamp: `${dateStr}T13:30:00`
        },
        {
          id: '5',
          approverName: 'Alex Kumar',
          approverRole: 'Engineering Lead',
          status: 'approved',
          timestamp: `${dateStr}T13:35:00`
        }
      ]
    },
    {
      id: `${dateStr}-004`,
      name: 'Maria Garcia',
      email: 'maria@suppliesplus.com',
      phone: '+1-555-0404',
      company: 'Office Supplies Plus',
      category: 'delivery',
      purposeOfVisit: 'Office Equipment Delivery',
      hostName: 'Reception',
      hostDepartment: 'Facilities',
      checkInTime: `${dateStr}T11:00:00`,
      checkOutTime: `${dateStr}T11:20:00`,
      status: 'checked-out',
      approvals: [
        {
          id: '6',
          approverName: 'Tom Baker',
          approverRole: 'Facilities Manager',
          status: 'approved',
          timestamp: `${dateStr}T10:00:00`
        }
      ]
    },
    {
      id: `${dateStr}-005`,
      name: 'James Wilson',
      email: 'jwilson@consulting.com',
      phone: '+1-555-0505',
      company: 'Business Consulting Group',
      category: 'guest',
      purposeOfVisit: 'Executive Strategy Meeting',
      hostName: 'Catherine Moore',
      hostDepartment: 'Executive Office',
      checkInTime: `${dateStr}T15:30:00`,
      status: 'scheduled',
      approvals: [
        {
          id: '7',
          approverName: 'Catherine Moore',
          approverRole: 'CEO',
          status: 'approved',
          timestamp: `${dateStr}T08:00:00`
        },
        {
          id: '8',
          approverName: 'Mark Stevens',
          approverRole: 'COO',
          status: 'approved',
          timestamp: `${dateStr}T08:15:00`
        }
      ]
    }
  ];

  return visitors;
};

export const mockUsers = {
  admin: {
    id: '1',
    username: 'admin',
    role: 'admin' as const,
    name: 'Admin User'
  },
  security: {
    id: '2',
    username: 'security',
    role: 'security' as const,
    name: 'Security Officer'
  }
};
