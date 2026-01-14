
export type Language = 'en' | 'ar';
export type UserRole = 'admin' | 'client' | 'technician' | 'visitor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  packageId?: string;
  referenceNumber?: string;
  permissions?: string[];
}

export interface ClientUser {
  id: string;
  clientId: string;
  name: string;
  email: string;
  position: string;
  phone: string;
  anyDeskId?: string;
}

export interface RemoteSupportTicket {
  id: string;
  client_id: string;
  client_name: string;
  user_id: string;
  user_name: string;
  issue_details: string;
  anydesk_id: string;
  ip_address: string;
  status: 'sent' | 'viewed' | 'resolved'; // Updated statuses
  created_at: string;
}

export interface SystemUser {
  id: string;
  name: string;
  access_code: string;
  permissions: string[];
  created_at?: string;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
  type: 'package' | 'addon_recurring' | 'addon_one_time';
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  totalAmount: number;
  currency: string;
  billingPeriod: string;
  subTotal?: number;
  discountApplied?: number;
  isPublished?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface ClientProfile extends User {
  companyName: string;
  phone: string;
  status: 'active' | 'suspended';
  packageId: string;
  accessCode: string;
  referenceNumber: string;
  logo?: string;
  contractUrl?: string;
  licenseKeys?: {
    microsoft365?: string;
    antivirus?: string;
    [key: string]: string | undefined;
  }; 
  remainingVisits: number;
  remainingTickets: number; // This acts as the Balance
  totalVisits: number;
  totalTickets: number;
  activeUsers: number;
  totalUsersLimit: number;
  usersList?: ClientUser[];
  branches?: Branch[];
  joinedDate: string;
  contractStartDate?: string;
  contractDurationMonths?: number;
  discountPercentage?: number;
  netPrice?: number;
  adminNotes?: string;
  assignedTechnicianId?: string | null;
  paymentConfig?: {
      cliqAlias?: string;
      receiverName?: string;
      bankDetails?: string;
  };
}

export interface Technician {
    id: string;
    name: string;
    phone: string | null;
    credential?: string;
    permissions?: string[];
    created_at: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  created_at: string;
}

export interface TicketMessage {
  id: string;
  sender: 'admin' | 'client';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  clientId: string;
  clientName: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  type?: 'support' | 'order' | 'consultation';
  date: string;
  messages: TicketMessage[];
  affectedUserId?: string;
  affectedUserName?: string;
  adminHasUnread?: boolean;
  clientHasUnread?: boolean;
}

export interface Consultation {
    id: string;
    clientId: string;
    clientName: string;
    subject: string;
    status: 'open' | 'resolved';
    messages: TicketMessage[];
    lastUpdated: string;
    createdAt: string;
}

export interface Order {
    id: string;
    clientId: string;
    clientName: string;
    type: 'user' | 'visit' | 'ticket' | 'license';
    details: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

export interface Booking {
  id: string;
  clientId: string | null;
  clientName: string;
  date: string;
  time?: string;
  type: 'on-site' | 'consultation' | 'system';
  status: string;
  is_blocked?: boolean;
  branchId?: string;
  branchName?: string;
  createdAt?: string;
}

export interface VisitTask {
  id: string;
  text: string;
  isCompleted: boolean;
  status: 'pending' | 'completed' | 'postponed' | 'cancelled';
  notes?: string;
  reason?: string;
  type: 'standard' | 'client_request';
  bookingId?: string;
  visitDate?: string;
  clientId?: string;
  isViewedByAdmin?: boolean;
}

export interface ServicePackage {
  id: string;
  name: string;
  price: number;
  currency: string;
  type: 'one-time' | 'subscription';
  isPopular?: boolean;
  features: string[];
  limits?: {
    users: number;
    visits: number;
    visitDuration: number;
    tickets: number;
  };
  addOnPricing?: {
    extraUser: number;
  };
  includedResources?: {
    microsoft365: number;
    microsoft365Type: string;
    antivirus: number;
    antivirusType: string;
  };
  resourceRates?: {
    microsoft365: number;
    antivirus: number;
  };
  securityFeatures?: string[];
}

export interface AddOnItem {
  id: string;
  name: string;
  price: number | string;
  unit: string;
  type: 'user' | 'visit' | 'ticket' | 'license';
  description?: string;
}

export interface Report {
  id: string;
  clientId: string;
  month: string;
  type: string;
  content: {
    healthScore: number;
    summary: string;
    recommendations?: string;
    visitsPerformed?: string;
    pendingTasks?: string; 
    issuesResolved?: string;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    warnings?: string;
    efficiency?: string;
    system_status?: string;
    backup_status?: string;
    technician_name?: string;
    visit_location?: string;
    key_achievements?: string;
    strategic_recommendations?: string;
    incident_details?: string;
    root_cause?: string;
    resolution?: string;
    prevention?: string;
    completed_tasks?: string;
    licenseActive?: string;
    licenseExpiring?: string;
    licenseExpired?: string;
  };
  createdAt: string;
}

export interface Translation {
  nav: { [key: string]: string };
  hero: { [key: string]: string };
  home: {
    stats: { [key: string]: string };
    features: { [key: string]: { title: string; desc: string } };
    canvasSection: { [key: string]: string };
    servicesTitle: string; servicesSubtitle: string; servicesCta: string;
    pricingTitle: string; pricingSubtitle: string; pricingCta: string;
    contactCtaTitle: string; contactCtaDesc: string; contactCtaButton: string;
  };
  about: { [key: string]: string };
  common: { [key: string]: string };
  services: { title: string; subtitle: string; items: { [key: string]: ServiceItem }; };
  packages: { title: string; oneTimeTitle: string; subTitle: string; addonsTitle: string; items: Record<string, PackageItem>; addons: Record<string, {name: string, unit: string}>; customNote: string; };
  contact: { [key: string]: string };
  footer: { [key: string]: string };
  admin: {
    [key: string]: any;
    report: { [key: string]: string };
  };
  client: {
    [key: string]: any;
    billing: { [key: string]: string };
    reports: { [key: string]: string };
  };
}

interface ServiceItem { title: string; desc: string; features: string[]; }
interface PackageItem { name: string; capacity: string; features: string[]; securityFeatures?: string[]; }
