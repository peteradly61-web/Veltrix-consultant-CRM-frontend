export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  industry: string;
  phone?: string;
  status: 'new' | 'contacted' | 'skipped' | 'disqualified';
  createdAt: string; // ISO Timestamp
  comment?: string;
  savedToOpportunities?: boolean;
}

export interface Meeting {
  id: string;
  leadName: string;
  company: string;
  title: string;      // Meeting Title
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  notes?: string;
  createdAt: string;  // ISO Timestamp
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface BDRSession {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'away';
  lastActiveTime: string; // ISO Timestamp string
  emailsSent: number;
  openRate: number; // Percentage (e.g. 64.7)
  replyRate: number; // Percentage (e.g. 26.4)
}

export interface DataPool {
  id: string;
  name: string;
  totalLeads: number;
  allocatedLeads: number;
  unallocatedLeads: number;
}

export interface BatchAllocation {
  id: string;
  name: string;
  poolId: string;
  poolName: string;
  bdrId: string;
  bdrName: string;
  leadCount: number;
  status: 'pending' | 'active' | 'completed';
  allocatedAt: string; // ISO Timestamp string
}

export interface DailyProgress {
  sent: number;
  skipped: number;
  disqualified: number;
  target: number;
}

export interface UserSession {
  name: string;
  role: 'bdr' | 'admin';
  username: string;
}

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string; // Plaintext for demo
  name: string;
  role: 'bdr' | 'admin';
}

export interface VeltrixState {
  // Auth Session State
  user: UserSession | null;
  loginError: string | null;
  registeredUsers: UserAccount[];

  // BDR Workspace Queue
  leads: Lead[];
  currentIndex: number;
  templates: EmailTemplate[];
  selectedTemplateId: string;
  emailSubject: string;
  emailBody: string;
  dailyProgress: DailyProgress;
  meetings: Meeting[];

  // Admin Command Center
  bdrAgents: BDRSession[];
  dataPools: DataPool[];
  batches: BatchAllocation[];

  // Real-time Event Log for simulation visibility
  realtimeLogs: Array<{ id: string; timestamp: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>;

  // Tab Navigation State
  activeBdrTab: string;
  activeAdminTab: string;
  setActiveBdrTab: (tab: string) => void;
  setActiveAdminTab: (tab: string) => void;

  // Auth Actions
  signIn: (username: string, password: string) => boolean;
  signOut: () => void;
  createAccount: (username: string, passwordHash: string, name: string, role: 'bdr' | 'admin') => void;

  // BDR Actions
  selectTemplate: (id: string) => void;
  updateEmailBody: (body: string) => void;
  updateEmailSubject: (subject: string) => void;
  sendEmail: (leadId: string) => void;
  skipLead: (leadId: string) => void;
  disqualifyLead: (leadId: string) => void;
  resetBdrQueue: () => void;
  
  // Extended BDR Actions
  updateLeadStatus: (leadId: string, status: Lead['status']) => void;
  updateLeadComment: (leadId: string, comment: string) => void;
  toggleSaveLeadToOpportunities: (leadId: string) => void;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => void;
  rotateLeadsData: () => void;

  // Admin Actions
  allocateBatch: (poolId: string, bdrId: string, leadCount: number) => void;
  updateAgentStatus: (bdrId: string, status: 'active' | 'idle' | 'away', timestampOffsetMinutes?: number) => void;
  addRealtimeLog: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}
