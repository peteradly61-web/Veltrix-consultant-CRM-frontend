import { create } from 'zustand';
import { VeltrixState, Lead, EmailTemplate, BDRSession, DataPool, BatchAllocation, UserSession, UserAccount } from '../types';

// Helper to replace template variables with lead data
const replaceVariables = (text: string, lead?: Lead): string => {
  if (!lead) return text;
  return text
    .replace(/{first_name}/g, lead.firstName)
    .replace(/{last_name}/g, lead.lastName)
    .replace(/{company_name}/g, lead.company)
    .replace(/{title}/g, lead.title)
    .replace(/{industry}/g, lead.industry)
    .replace(/{email}/g, lead.email);
};

const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-1',
    firstName: 'Marcus',
    lastName: 'Aurelius',
    email: 'marcus.aurelius@stoicgrowth.io',
    company: 'Stoic Growth Corp',
    title: 'VP of Sales & Strategy',
    industry: 'Logistics Technology',
    phone: '+1 (555) 019-2831',
    status: 'new'
  },
  {
    id: 'lead-2',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'schen@nanoflow.tech',
    company: 'NanoFlow Automation',
    title: 'Director of Procurement',
    industry: 'Industrial Robotics',
    phone: '+1 (555) 014-8844',
    status: 'new'
  },
  {
    id: 'lead-3',
    firstName: 'David',
    lastName: 'Vance',
    email: 'd.vance@apexlogistics.com',
    company: 'Apex Supply Chain Solutions',
    title: 'Head of Global Operations',
    industry: 'Transportation & Logistics',
    phone: '+1 (555) 012-9901',
    status: 'new'
  },
  {
    id: 'lead-4',
    firstName: 'Elena',
    lastName: 'Petrova',
    email: 'e.petrova@cyberdyne.net',
    company: 'Cyberdyne Systems',
    title: 'Chief Technology Officer',
    industry: 'Automation Systems',
    phone: '+1 (555) 017-4321',
    status: 'new'
  },
  {
    id: 'lead-5',
    firstName: 'Devon',
    lastName: 'Miller',
    email: 'dmiller@coreinfra.org',
    company: 'Core Infrastructure Partners',
    title: 'Director of Business Development',
    industry: 'Civil Engineering & Logistics',
    phone: '+1 (555) 015-7766',
    status: 'new'
  }
];

const MOCK_TEMPLATES: EmailTemplate[] = [
  {
    id: 'temp-1',
    name: 'Veltrix Outbound Introduction',
    subject: 'Optimizing outbound pipeline at {company_name}',
    body: 'Hi {first_name},\n\nI noticed that you lead the sales strategy as {title} at {company_name}.\n\nGiven your focus on operations within {industry}, I wanted to share how Veltrix has helped outbound teams automate lead rotation and triple BDR engagement rates.\n\nDo you have 10 minutes next Tuesday at 10 AM EST for a brief tour of our platform?\n\nBest regards,\nAlex Rivera\nSenior BDR, Veltrix'
  },
  {
    id: 'temp-2',
    name: 'Industrial Data Fit Query',
    subject: 'Question about {company_name}\'s lead routing system',
    body: 'Hi {first_name},\n\nI hope your week is off to a great start.\n\nI was looking into {company_name} and saw you head operations there. With logistics teams in the {industry} space facing up to 30% bad data in their prospecting list, I wanted to see if your current setup filters out disconnected numbers and invalid emails automatically.\n\nVeltrix offers a 99.8% data accuracy SLA for industrial operations. Would you be open to reviewing our comparative benchmark PDF?\n\nBest,\nAlex Rivera\nSenior BDR, Veltrix'
  },
  {
    id: 'temp-3',
    name: 'Data Accuracy Value Pitch',
    subject: 'Solving data decay problems for {company_name}',
    body: 'Hi {first_name},\n\nIs {company_name} currently struggling with high bounce rates in your outbound campaigns?\n\nWe specialize in {industry} prospecting. Veltrix routes clean, pre-verified lists straight to your sales tool, meaning your reps spend time talking to decision makers rather than cleaning sheets.\n\nAre you available for a 5-minute call this Thursday?\n\nSincerely,\nAlex Rivera\nSenior BDR, Veltrix'
  }
];

const MOCK_AGENTS = (): BDRSession[] => {
  const now = new Date();
  return [
    {
      id: 'bdr-1',
      name: 'Alex Rivera',
      status: 'active',
      lastActiveTime: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // 2 mins ago (Green)
      emailsSent: 34,
      openRate: 64.7,
      replyRate: 26.4
    },
    {
      id: 'bdr-2',
      name: 'Jordan Vance',
      status: 'active',
      lastActiveTime: new Date(now.getTime() - 12 * 60 * 1000).toISOString(), // 12 mins ago (Green)
      emailsSent: 28,
      openRate: 53.5,
      replyRate: 18.2
    },
    {
      id: 'bdr-3',
      name: 'Elena Rostova',
      status: 'idle',
      lastActiveTime: new Date(now.getTime() - 48 * 60 * 1000).toISOString(), // 48 mins ago (Yellow)
      emailsSent: 19,
      openRate: 42.1,
      replyRate: 10.5
    },
    {
      id: 'bdr-4',
      name: 'Marcus Brody',
      status: 'away',
      lastActiveTime: new Date(now.getTime() - 95 * 60 * 1000).toISOString(), // 95 mins ago (Red)
      emailsSent: 4,
      openRate: 25.0,
      replyRate: 0.0
    },
    {
      id: 'bdr-5',
      name: 'Sarah Jenkins',
      status: 'active',
      lastActiveTime: new Date(now.getTime() - 1 * 60 * 1000).toISOString(), // 1 min ago (Green)
      emailsSent: 41,
      openRate: 68.3,
      replyRate: 29.2
    }
  ];
};

const MOCK_POOLS: DataPool[] = [
  {
    id: 'pool-1',
    name: 'Logistics Infrastructure Midwest',
    totalLeads: 2500,
    allocatedLeads: 1800,
    unallocatedLeads: 700
  },
  {
    id: 'pool-2',
    name: 'SaaS Sales Leaders Q3',
    totalLeads: 1200,
    allocatedLeads: 900,
    unallocatedLeads: 300
  },
  {
    id: 'pool-3',
    name: 'Robotics Founders East Coast',
    totalLeads: 850,
    allocatedLeads: 850,
    unallocatedLeads: 0
  },
  {
    id: 'pool-4',
    name: 'Heavy Supply Chain Operators',
    totalLeads: 1500,
    allocatedLeads: 400,
    unallocatedLeads: 1100
  }
];

const MOCK_BATCHES: BatchAllocation[] = [
  {
    id: 'batch-104',
    name: 'Batch #104 - Alex Rivera',
    poolId: 'pool-2',
    poolName: 'SaaS Sales Leaders Q3',
    bdrId: 'bdr-1',
    bdrName: 'Alex Rivera',
    leadCount: 150,
    status: 'active',
    allocatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'batch-105',
    name: 'Batch #105 - Jordan Vance',
    poolId: 'pool-1',
    poolName: 'Logistics Infrastructure Midwest',
    bdrId: 'bdr-2',
    bdrName: 'Jordan Vance',
    leadCount: 200,
    status: 'active',
    allocatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'batch-106',
    name: 'Batch #106 - Elena Rostova',
    poolId: 'pool-3',
    poolName: 'Robotics Founders East Coast',
    bdrId: 'bdr-3',
    bdrName: 'Elena Rostova',
    leadCount: 100,
    status: 'completed',
    allocatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_USERS: UserAccount[] = [
  { id: 'usr-1', username: 'LMONA', passwordHash: 'admin', name: 'System Administrator', role: 'admin' },
  { id: 'usr-2', username: 'testbdr', passwordHash: 'testpass', name: 'Alex Rivera', role: 'bdr' }
];

export const useVeltrixStore = create<VeltrixState>((set, get) => {
  const initializeTemplate = (leadsList: Lead[], index: number, templateId: string) => {
    const lead = leadsList[index];
    const template = MOCK_TEMPLATES.find(t => t.id === templateId) || MOCK_TEMPLATES[0];
    return {
      selectedTemplateId: template.id,
      emailSubject: replaceVariables(template.subject, lead),
      emailBody: replaceVariables(template.body, lead)
    };
  };

  const getSavedUser = (): UserSession | null => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('veltrix_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const initialTemplateState = initializeTemplate(MOCK_LEADS, 0, 'temp-1');

  return {
    // Auth Session State
    user: getSavedUser(),
    loginError: null,
    registeredUsers: MOCK_USERS,

    // Queue State
    leads: MOCK_LEADS,
    currentIndex: 0,
    templates: MOCK_TEMPLATES,
    selectedTemplateId: initialTemplateState.selectedTemplateId,
    emailSubject: initialTemplateState.emailSubject,
    emailBody: initialTemplateState.emailBody,
    dailyProgress: {
      sent: 18,
      skipped: 3,
      disqualified: 1,
      target: 50
    },

    bdrAgents: MOCK_AGENTS(),
    dataPools: MOCK_POOLS,
    batches: MOCK_BATCHES,
    realtimeLogs: [
      { id: 'log-1', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), message: 'Connected to Supabase realtime gateway.', type: 'info' },
      { id: 'log-2', timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), message: 'Jordan Vance moved from Idle to Active status.', type: 'success' },
      { id: 'log-3', timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(), message: 'Batch #105 allocated to Jordan Vance successfully.', type: 'success' }
    ],

    activeBdrTab: 'queue',
    activeAdminTab: 'operations',
    setActiveBdrTab: (tab) => set({ activeBdrTab: tab }),
    setActiveAdminTab: (tab) => set({ activeAdminTab: tab }),

    // Auth Actions
    signIn: (username: string, password: string) => {
      if (!username || !password) {
        set({ loginError: 'Username and password cannot be empty.' });
        return false;
      }

      const { registeredUsers } = get();
      const account = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (!account) {
        set({ loginError: 'Account not found.' });
        return false;
      }

      if (account.passwordHash !== password) {
        set({ loginError: 'Incorrect password.' });
        return false;
      }

      const userSession: UserSession = { name: account.name, role: account.role, username: account.username };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('veltrix_user', JSON.stringify(userSession));
        } catch (e) {
          console.error('Failed to save session to localStorage', e);
        }
      }

      set({ user: userSession, loginError: null });
      get().addRealtimeLog(`User ${account.name} logged in successfully as ${account.role.toUpperCase()}.`, 'success');
      return true;
    },

    signOut: () => {
      const { user } = get();
      if (user) {
        get().addRealtimeLog(`User ${user.name} logged out.`, 'info');
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('veltrix_user');
        } catch (e) {
          console.error('Failed to remove session from localStorage', e);
        }
      }
      set({ user: null, loginError: null });
    },

    createAccount: (username: string, passwordHash: string, name: string, role: 'bdr' | 'admin') => {
      const { registeredUsers } = get();
      const existing = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (existing) {
        get().addRealtimeLog(`Failed to create account: Username '${username}' already exists.`, 'error');
        return;
      }
      
      const newAccount: UserAccount = {
        id: `usr-${Date.now()}`,
        username,
        passwordHash,
        name,
        role
      };
      
      set({ registeredUsers: [...registeredUsers, newAccount] });
      get().addRealtimeLog(`Created new ${role.toUpperCase()} account for ${name} (@${username}).`, 'success');
    },

    // BDR Workspace Actions
    selectTemplate: (id: string) => {
      const { leads, currentIndex, templates } = get();
      const lead = leads[currentIndex];
      const template = templates.find(t => t.id === id);
      if (template) {
        set({
          selectedTemplateId: id,
          emailSubject: replaceVariables(template.subject, lead),
          emailBody: replaceVariables(template.body, lead)
        });
      }
    },

    updateEmailBody: (body: string) => {
      set({ emailBody: body });
    },

    updateEmailSubject: (subject: string) => {
      set({ emailSubject: subject });
    },

    sendEmail: (leadId: string) => {
      const { leads, currentIndex, selectedTemplateId, dailyProgress, bdrAgents } = get();
      const updatedLeads = leads.map(l => l.id === leadId ? { ...l, status: 'contacted' as const } : l);
      const nextIndex = currentIndex + 1;
      const lead = leads[currentIndex];

      const updatedAgents = bdrAgents.map(agent => {
        if (agent.id === 'bdr-1') {
          return {
            ...agent,
            emailsSent: agent.emailsSent + 1,
            lastActiveTime: new Date().toISOString(),
            status: 'active' as const
          };
        }
        return agent;
      });

      let nextTemplateState = { emailSubject: '', emailBody: '' };
      if (nextIndex < updatedLeads.length) {
        const nextLead = updatedLeads[nextIndex];
        const template = MOCK_TEMPLATES.find(t => t.id === selectedTemplateId) || MOCK_TEMPLATES[0];
        nextTemplateState = {
          emailSubject: replaceVariables(template.subject, nextLead),
          emailBody: replaceVariables(template.body, nextLead)
        };
      }

      set({
        leads: updatedLeads,
        currentIndex: nextIndex,
        emailSubject: nextTemplateState.emailSubject,
        emailBody: nextTemplateState.emailBody,
        dailyProgress: {
          ...dailyProgress,
          sent: dailyProgress.sent + 1
        },
        bdrAgents: updatedAgents
      });

      get().addRealtimeLog(`Email successfully sent to ${lead.firstName} ${lead.lastName} (${lead.company}).`, 'success');
    },

    skipLead: (leadId: string) => {
      const { leads, currentIndex, selectedTemplateId, dailyProgress, bdrAgents } = get();
      const updatedLeads = leads.map(l => l.id === leadId ? { ...l, status: 'skipped' as const } : l);
      const nextIndex = currentIndex + 1;
      const lead = leads[currentIndex];

      const updatedAgents = bdrAgents.map(agent => {
        if (agent.id === 'bdr-1') {
          return {
            ...agent,
            lastActiveTime: new Date().toISOString(),
            status: 'active' as const
          };
        }
        return agent;
      });

      let nextTemplateState = { emailSubject: '', emailBody: '' };
      if (nextIndex < updatedLeads.length) {
        const nextLead = updatedLeads[nextIndex];
        const template = MOCK_TEMPLATES.find(t => t.id === selectedTemplateId) || MOCK_TEMPLATES[0];
        nextTemplateState = {
          emailSubject: replaceVariables(template.subject, nextLead),
          emailBody: replaceVariables(template.body, nextLead)
        };
      }

      set({
        leads: updatedLeads,
        currentIndex: nextIndex,
        emailSubject: nextTemplateState.emailSubject,
        emailBody: nextTemplateState.emailBody,
        dailyProgress: {
          ...dailyProgress,
          skipped: dailyProgress.skipped + 1
        },
        bdrAgents: updatedAgents
      });

      get().addRealtimeLog(`Lead ${lead.firstName} ${lead.lastName} was skipped. Queue advanced.`, 'warning');
    },

    disqualifyLead: (leadId: string) => {
      const { leads, currentIndex, selectedTemplateId, dailyProgress, bdrAgents } = get();
      const updatedLeads = leads.map(l => l.id === leadId ? { ...l, status: 'disqualified' as const } : l);
      const nextIndex = currentIndex + 1;
      const lead = leads[currentIndex];

      const updatedAgents = bdrAgents.map(agent => {
        if (agent.id === 'bdr-1') {
          return {
            ...agent,
            lastActiveTime: new Date().toISOString(),
            status: 'active' as const
          };
        }
        return agent;
      });

      let nextTemplateState = { emailSubject: '', emailBody: '' };
      if (nextIndex < updatedLeads.length) {
        const nextLead = updatedLeads[nextIndex];
        const template = MOCK_TEMPLATES.find(t => t.id === selectedTemplateId) || MOCK_TEMPLATES[0];
        nextTemplateState = {
          emailSubject: replaceVariables(template.subject, nextLead),
          emailBody: replaceVariables(template.body, nextLead)
        };
      }

      set({
        leads: updatedLeads,
        currentIndex: nextIndex,
        emailSubject: nextTemplateState.emailSubject,
        emailBody: nextTemplateState.emailBody,
        dailyProgress: {
          ...dailyProgress,
          disqualified: dailyProgress.disqualified + 1
        },
        bdrAgents: updatedAgents
      });

      get().addRealtimeLog(`Disqualified lead ${lead.firstName} ${lead.lastName} (Bad Data).`, 'error');
    },

    resetBdrQueue: () => {
      const resetLeads = MOCK_LEADS.map(l => ({ ...l, status: 'new' as const }));
      const templateState = initializeTemplate(resetLeads, 0, 'temp-1');

      set({
        leads: resetLeads,
        currentIndex: 0,
        selectedTemplateId: templateState.selectedTemplateId,
        emailSubject: templateState.emailSubject,
        emailBody: templateState.emailBody,
        dailyProgress: {
          sent: 18,
          skipped: 3,
          disqualified: 1,
          target: 50
        }
      });

      get().addRealtimeLog('BDR workspace queue reset for demonstration.', 'info');
    },

    allocateBatch: (poolId: string, bdrId: string, leadCount: number) => {
      const { dataPools, bdrAgents, batches } = get();
      const pool = dataPools.find(p => p.id === poolId);
      const bdr = bdrAgents.find(b => b.id === bdrId);

      if (!pool || !bdr) {
        get().addRealtimeLog('Allocation failed: Invalid pool or BDR selection.', 'error');
        return;
      }

      if (pool.unallocatedLeads < leadCount) {
        get().addRealtimeLog(`Allocation failed: Pool ${pool.name} only has ${pool.unallocatedLeads} leads available.`, 'error');
        return;
      }

      const updatedPools = dataPools.map(p => {
        if (p.id === poolId) {
          return {
            ...p,
            allocatedLeads: p.allocatedLeads + leadCount,
            unallocatedLeads: p.unallocatedLeads - leadCount
          };
        }
        return p;
      });

      const nextBatchId = `batch-${batches.length + 107}`;
      const newBatch: BatchAllocation = {
        id: nextBatchId,
        name: `Batch #${batches.length + 107} - ${bdr.name}`,
        poolId: pool.id,
        poolName: pool.name,
        bdrId: bdr.id,
        bdrName: bdr.name,
        leadCount,
        status: 'active',
        allocatedAt: new Date().toISOString()
      };

      set({
        dataPools: updatedPools,
        batches: [newBatch, ...batches]
      });

      get().addRealtimeLog(`Successfully allocated ${leadCount} leads from '${pool.name}' to ${bdr.name}.`, 'success');
    },

    updateAgentStatus: (bdrId: string, status: 'active' | 'idle' | 'away', timestampOffsetMinutes = 0) => {
      const { bdrAgents } = get();
      const bdr = bdrAgents.find(b => b.id === bdrId);
      if (!bdr) return;

      const offsetMs = timestampOffsetMinutes * 60 * 1000;
      const lastActiveTime = new Date(Date.now() - offsetMs).toISOString();

      const updatedAgents = bdrAgents.map(b => {
        if (b.id === bdrId) {
          return {
            ...b,
            status,
            lastActiveTime
          };
        }
        return b;
      });

      set({ bdrAgents: updatedAgents });
      get().addRealtimeLog(`BDR ${bdr.name} is now marked ${status} (last active: ${timestampOffsetMinutes}m ago).`, 'info');
    },

    addRealtimeLog: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      const log = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        message,
        type
      };
      set(state => ({
        realtimeLogs: [log, ...state.realtimeLogs.slice(0, 19)]
      }));
    }
  };
});
