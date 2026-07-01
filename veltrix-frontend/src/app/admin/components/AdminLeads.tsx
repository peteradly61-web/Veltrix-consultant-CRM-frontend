'use client';

import React, { useState, useRef } from 'react';
import { useVeltrixStore } from '@/lib/store';
import { Lead } from '@/types';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Users, 
  Check, 
  Search, 
  Building2, 
  Sparkles,
  Info,
  Calendar,
  Layers,
  HelpCircle,
  X,
  Database,
  Loader2
} from 'lucide-react';
import sectorsMappingData from '@/lib/sectors_mapping.json';

// Helper to resolve Sector for a given scraper Industry label
const getSectorForIndustry = (industry: string): string => {
  const normalized = (industry || '').toLowerCase().trim();
  const mapping = (sectorsMappingData.industryToSector as Record<string, string>) || {};
  return mapping[normalized] || 'General Trade';
};

// Helper to extract a readable name from email username
const parseNameFromEmail = (email: string, company: string) => {
  if (!email) return { firstName: 'Contact', lastName: 'Representative' };
  
  const username = email.split('@')[0].toLowerCase();
  
  // List of common generic emails
  const generics = [
    'info', 'sales', 'support', 'hello', 'contact', 'office', 'admin', 
    'jobs', 'careers', 'billing', 'team', 'help', 'service', 'inbound',
    'media', 'press', 'marketing', 'orders', 'enquiry', 'enquiries'
  ];
  
  if (generics.includes(username)) {
    return { firstName: 'Contact', lastName: 'Rep' };
  }
  
  // Check for dots, underscores, hyphens
  const splitChars = ['.', '_', '-'];
  for (const char of splitChars) {
    if (username.includes(char)) {
      const parts = username.split(char);
      if (parts.length >= 2) {
        const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        const last = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
        return { firstName: first, lastName: last };
      }
    }
  }
  
  // Single username string
  const formattedFirst = username.charAt(0).toUpperCase() + username.slice(1);
  return { firstName: formattedFirst, lastName: 'Rep' };
};

interface ParsedLead {
  company: string;
  email: string;
  website: string;
  location: string;
  industry: string;
}

interface DataVaultFile {
  fileName: string;
  industryName: string;
  sizeBytes: number;
  leadCount: number;
}

interface DataVaultSector {
  sectorId: string;
  sectorName: string;
  files: DataVaultFile[];
}

export default function AdminLeads() {
  const { bdrAgents } = useVeltrixStore();
  
  // Search & Filter state for existing database
  const [searchQuery, setSearchQuery] = useState('');
  const [bdrFilter, setBdrFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Server-side Leads State
  const [dbLeads, setDbLeads] = useState<any[]>([]);
  const [loadingDbLeads, setLoadingDbLeads] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const limit = 50;

  // Tab states for Ingestion desk
  const [ingestTab, setIngestTab] = useState<'vault' | 'manual'>('vault');
  
  // Data Vault states
  const [sectors, setSectors] = useState<DataVaultSector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [activeFile, setActiveFile] = useState<{ sectorName: string; fileName: string } | null>(null);
  
  // CSV Upload States
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  // Ingestion workflow state
  const [rawParsedLeads, setRawParsedLeads] = useState<ParsedLead[]>([]);
  const [cleanNewLeads, setCleanNewLeads] = useState<ParsedLead[]>([]);
  const [duplicateLeads, setDuplicateLeads] = useState<{ lead: ParsedLead; matchType: 'email' | 'company' | 'both' }[]>([]);
  const [showDuplicatesPreview, setShowDuplicatesPreview] = useState(false);
  
  // Distribution Allocation state: maps BDR name -> leadCount to assign
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch data vault sectors structure on mount
  React.useEffect(() => {
    const fetchSectors = async () => {
      setLoadingSectors(true);
      try {
        const res = await fetch('/api/data-vault/sectors');
        const json = await res.json();
        if (json.success) {
          setSectors(json.data);
          if (json.data.length > 0) {
            setSelectedSectorId(json.data[0].sectorId);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data vault structure:', err);
      } finally {
        setLoadingSectors(false);
      }
    };
    fetchSectors();
  }, []);

  // Fetch paginated leads from database/Data-Vault
  const fetchDbLeads = async () => {
    setLoadingDbLeads(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchQuery,
        bdr: bdrFilter,
        status: statusFilter
      });
      const res = await fetch(`/api/data-vault/all-leads?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDbLeads(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalLeadsCount(json.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch master leads:', err);
    } finally {
      setLoadingDbLeads(false);
    }
  };

  React.useEffect(() => {
    fetchDbLeads();
  }, [page, searchQuery, bdrFilter, statusFilter]);

  // Reset page when query or filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, bdrFilter, statusFilter]);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Parsing CSV text into records
  const parseCSVContent = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) {
      throw new Error("CSV file appears to be empty or lacks data rows.");
    }
    
    // Standardize headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    // Find expected index
    const companyIdx = headers.findIndex(h => h.toLowerCase() === 'company_name');
    const emailIdx = headers.findIndex(h => h.toLowerCase() === 'contact_email');
    const websiteIdx = headers.findIndex(h => h.toLowerCase() === 'website_url');
    const locationIdx = headers.findIndex(h => h.toLowerCase() === 'location');
    const industryIdx = headers.findIndex(h => h.toLowerCase() === 'industry');
    
    if (companyIdx === -1 || emailIdx === -1) {
      throw new Error("Invalid CSV schema. Missing required headers: 'Company_Name' and 'Contact_Email'.");
    }

    const records: ParsedLead[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse line with comma-quote awareness
      const cols: string[] = [];
      let inQuotes = false;
      let currentCol = '';
      
      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(currentCol.trim());
          currentCol = '';
        } else {
          currentCol += char;
        }
      }
      cols.push(currentCol.trim());
      
      const cleanCols = cols.map(c => c.replace(/^["']|["']$/g, '').trim());
      
      if (cleanCols.length > 0 && cleanCols[companyIdx] && cleanCols[emailIdx]) {
        records.push({
          company: cleanCols[companyIdx],
          email: cleanCols[emailIdx],
          website: websiteIdx !== -1 && cleanCols[websiteIdx] ? cleanCols[websiteIdx] : '',
          location: locationIdx !== -1 && cleanCols[locationIdx] ? cleanCols[locationIdx] : 'Unknown',
          industry: industryIdx !== -1 && cleanCols[industryIdx] ? cleanCols[industryIdx] : 'Other'
        });
      }
    }
    return records;
  };

  // Perform deduplication check and split leads
  const processIngestedLeads = (parsed: ParsedLead[], existingLeads: any[]) => {
    const cleanList: ParsedLead[] = [];
    const dupList: { lead: ParsedLead; matchType: 'email' | 'company' | 'both' }[] = [];

    parsed.forEach(row => {
      // Check against current database leads
      const dupByEmail = existingLeads.some(l => l.email.toLowerCase() === row.email.toLowerCase());
      const dupByCompany = existingLeads.some(l => l.company.toLowerCase() === row.company.toLowerCase());

      if (dupByEmail && dupByCompany) {
        dupList.push({ lead: row, matchType: 'both' });
      } else if (dupByEmail) {
        dupList.push({ lead: row, matchType: 'email' });
      } else if (dupByCompany) {
        dupList.push({ lead: row, matchType: 'company' });
      } else {
        // Also check if it's already in the cleanList we are building in this batch (handling internal scraper duplicates)
        const inBatchByEmail = cleanList.some(l => l.email.toLowerCase() === row.email.toLowerCase());
        const inBatchByCompany = cleanList.some(l => l.company.toLowerCase() === row.company.toLowerCase());
        
        if (inBatchByEmail || inBatchByCompany) {
          dupList.push({ lead: row, matchType: inBatchByEmail && inBatchByCompany ? 'both' : inBatchByEmail ? 'email' : 'company' });
        } else {
          cleanList.push(row);
        }
      }
    });

    setRawParsedLeads(parsed);
    setCleanNewLeads(cleanList);
    setDuplicateLeads(dupList);
    
    // Initialize allocations to zero
    const initialAllocations: Record<string, number> = {};
    bdrAgents.forEach(agent => {
      initialAllocations[agent.name] = 0;
    });
    setAllocations(initialAllocations);
    
    setUploadSuccess(`Parsed ${parsed.length} rows successfully. Detected ${cleanList.length} clean new leads.`);
    setUploadError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadError("Only CSV files (.csv) are supported for lead ingestion.");
      setUploadSuccess(null);
      return;
    }

    setUploadSuccess("Analyzing database for duplicate leads...");
    
    let allExistingLeads: any[] = [];
    try {
      const res = await fetch('/api/data-vault/all-leads?limit=200000');
      const json = await res.json();
      if (json.success) {
        allExistingLeads = json.data;
      }
    } catch (err) {
      console.error("Failed to fetch leads for deduplication:", err);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSVContent(text);
        processIngestedLeads(parsed, allExistingLeads);
      } catch (err: any) {
        setUploadError(err.message || "Failed to process CSV file.");
        setUploadSuccess(null);
      }
    };
    reader.readAsText(file);
  };

  // Auto-distribute evenly
  const handleDistributeEvenly = () => {
    if (cleanNewLeads.length === 0) return;
    
    const count = cleanNewLeads.length;
    const bdrCount = bdrAgents.length;
    const base = Math.floor(count / bdrCount);
    let remainder = count % bdrCount;

    const newAllocations: Record<string, number> = {};
    bdrAgents.forEach((agent, idx) => {
      newAllocations[agent.name] = base + (idx < remainder ? 1 : 0);
    });
    
    setAllocations(newAllocations);
  };

  // Adjust custom BDR allocation count
  const handleAllocationChange = (bdrName: string, value: number) => {
    const cleanValue = Math.max(0, isNaN(value) ? 0 : value);
    setAllocations(prev => ({
      ...prev,
      [bdrName]: cleanValue
    }));
  };

  // Clear upload and allocation workspace
  const handleResetWorkspace = () => {
    setRawParsedLeads([]);
    setCleanNewLeads([]);
    setDuplicateLeads([]);
    setAllocations({});
    setUploadSuccess(null);
    setUploadError(null);
    setActiveFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch leads from Data Vault CSV file
  const handleLoadLeadsFromFile = async (sectorId: string, sectorName: string, fileName: string) => {
    setLoadingLeads(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const res = await fetch(`/api/data-vault/leads?sector=${sectorId}&file=${fileName}`);
      const json = await res.json();

      let allExistingLeads: any[] = [];
      try {
        const resAll = await fetch('/api/data-vault/all-leads?limit=200000');
        const jsonAll = await resAll.json();
        if (jsonAll.success) {
          allExistingLeads = jsonAll.data;
        }
      } catch (err) {
        console.error("Failed to fetch leads for deduplication:", err);
      }

      if (json.success) {
        processIngestedLeads(json.data, allExistingLeads);
        setActiveFile({ sectorName, fileName });
      } else {
        setUploadError(json.error || 'Failed to load leads from file');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error occurred while loading leads');
    } finally {
      setLoadingLeads(false);
    }
  };


  // Sum of currently allocated leads in planner
  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  // Submit and ingest Leads to Zustand store
  const handleConfirmDistribution = async () => {
    if (cleanNewLeads.length === 0 || totalAllocated === 0) return;
    if (totalAllocated > cleanNewLeads.length) {
      alert("Error: Total distributed leads exceeds available new leads.");
      return;
    }

    const assignmentsToAdd: any[] = [];
    let leadPointer = 0;

    // Iterate through BDR allocations and assign
    bdrAgents.forEach(agent => {
      const countToAssign = allocations[agent.name] || 0;
      for (let i = 0; i < countToAssign; i++) {
        if (leadPointer >= cleanNewLeads.length) break;
        
        const parsedLead = cleanNewLeads[leadPointer];
        
        assignmentsToAdd.push({
          email: parsedLead.email,
          assignedTo: agent.name,
          status: 'new',
          comment: `Website: ${parsedLead.website || 'N/A'}\nLocation: ${parsedLead.location || 'N/A'}\nSector: ${activeFile ? activeFile.sectorName : parsedLead.industry}`
        });
        leadPointer++;
      }
    });

    try {
      const res = await fetch('/api/data-vault/all-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          assignments: assignmentsToAdd
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(`Successfully distributed and assigned ${assignmentsToAdd.length} leads across the BDR team.`);
        handleResetWorkspace();
        fetchDbLeads(); // Refresh table
      } else {
        alert(`Failed to distribute leads: ${json.error}`);
      }
    } catch (err: any) {
      alert(`Error distributing leads: ${err.message}`);
    }
  };

  // Delete lead assignment helper
  const handleDeleteMasterLead = async (email: string) => {
    if (confirm("Are you sure you want to remove this lead's assignment?")) {
      try {
        const res = await fetch('/api/data-vault/all-leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            assignments: [{ email }]
          })
        });
        const json = await res.json();
        if (json.success) {
          fetchDbLeads();
          useVeltrixStore.getState().addRealtimeLog(`Lead assignment removed by administrator.`, 'warning');
        }
      } catch (err: any) {
        console.error('Failed to delete lead assignment:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">Master Leads & Distribution Desk</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Ingest new leads, remove duplicates, and assign pipelines to outbound agents.</p>
        </div>
      </div>

      {/* CSV Ingestion Work Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Uploader Box */}
        <div className="lg:col-span-1 bg-white border border-gray-300 rounded shadow-sm flex flex-col overflow-hidden">
          <div className="border-b border-gray-300 px-6 py-4 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              {ingestTab === 'vault' ? (
                <Database className="w-4 h-4 text-blue-600" />
              ) : (
                <Upload className="w-4 h-4 text-blue-600" />
              )}
              <span>
                {rawParsedLeads.length > 0
                  ? 'Leads Ingestion Workspace'
                  : ingestTab === 'vault'
                  ? 'Data Vault Explorer'
                  : 'CSV Ingestion Control'}
              </span>
            </h2>
            {rawParsedLeads.length > 0 ? (
              <button 
                onClick={handleResetWorkspace}
                className="text-[10px] text-red-650 font-bold hover:underline"
              >
                Clear Workspace
              </button>
            ) : (
              sectors.length > 0 && (
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-200 rounded font-bold font-mono">
                  Vault Total: {sectors.reduce((sum, sec) => sum + sec.files.reduce((fSum, f) => fSum + f.leadCount, 0), 0).toLocaleString()} leads
                </span>
              )
            )}
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-center space-y-4">
            {rawParsedLeads.length === 0 ? (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Tabs bar */}
                <div className="flex border border-gray-305 rounded overflow-hidden text-xs shrink-0">
                  <button
                    onClick={() => {
                      setIngestTab('vault');
                      setUploadError(null);
                    }}
                    className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 transition-all ${
                      ingestTab === 'vault'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-r border-gray-300'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    Data Vault
                  </button>
                  <button
                    onClick={() => {
                      setIngestTab('manual');
                      setUploadError(null);
                    }}
                    className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 transition-all ${
                      ingestTab === 'manual'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-655'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Manual Upload
                  </button>
                </div>

                {/* Tab Content */}
                {ingestTab === 'manual' ? (
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all flex-1 ${
                      dragActive ? 'border-blue-500 bg-blue-50/20' : 'border-gray-300 hover:border-blue-400 hover:bg-slate-50/50'
                    }`}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                    <FileText className="w-10 h-10 text-slate-400 mb-2.5 opacity-80" />
                    <p className="text-xs font-extrabold text-slate-700">Drag & Drop Scraper CSV</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">or click to browse local filesystem</p>
                    <div className="mt-4 px-2.5 py-1 rounded bg-slate-100 border text-[9px] font-mono text-slate-500">
                      Required columns: Company_Name, Contact_Email
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 flex flex-col justify-start">
                    {/* Sector Selector */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-450 mb-1">
                        Select Scraper Sector Classification
                      </label>
                      {loadingSectors ? (
                        <div className="h-9 w-full bg-slate-100 animate-pulse rounded border border-gray-200" />
                      ) : (
                        <select
                          value={selectedSectorId}
                          onChange={(e) => setSelectedSectorId(e.target.value)}
                          className="w-full text-xs font-semibold px-2.5 py-2 rounded border border-gray-300 bg-white text-slate-750 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          {sectors.length === 0 ? (
                            <option value="">No sectors found in vault</option>
                          ) : (
                            sectors.map((sec) => {
                              const sectorTotal = sec.files.reduce((sum, f) => sum + f.leadCount, 0);
                              return (
                                <option key={sec.sectorId} value={sec.sectorId}>
                                  {sec.sectorName} ({sectorTotal.toLocaleString()} leads)
                                </option>
                              );
                            })
                          )}
                        </select>
                      )}
                    </div>

                    {/* Files list for selected sector */}
                    <div className="flex-1 flex flex-col min-h-[220px]">
                      <span className="block text-[10px] font-bold uppercase text-slate-450 mb-1.5">
                        Available Industry Scrapes ({(() => {
                          const currentSector = sectors.find(s => s.sectorId === selectedSectorId);
                          return currentSector ? `${currentSector.files.length} Industries` : '0 Industries';
                        })()})
                      </span>
                      
                      {loadingSectors ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs py-10">
                          <Loader2 className="w-5 h-5 animate-spin mr-1.5 text-blue-500" />
                          Scanning local Data Vault...
                        </div>
                      ) : sectors.length === 0 ? (
                        <div className="flex-1 border rounded-lg border-gray-200 bg-slate-50 flex items-center justify-center p-6 text-center text-xs text-slate-400">
                          Data Vault is empty or path is incorrect. Please verify scraper configurations.
                        </div>
                      ) : (
                        <div className="flex-1 border border-gray-300 rounded bg-slate-50/50 p-2 overflow-y-auto max-h-[280px] space-y-1.5">
                          {(() => {
                            const currentSector = sectors.find(s => s.sectorId === selectedSectorId);
                            if (!currentSector || currentSector.files.length === 0) {
                              return (
                                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                                  No scraped industry files in this sector folder.
                                </div>
                              );
                            }
                            return currentSector.files.map((fileVal) => (
                              <div
                                key={fileVal.fileName}
                                className="bg-white border border-gray-200 rounded p-2 flex items-center justify-between hover:border-blue-400 transition-all group"
                              >
                                <div className="flex flex-col min-w-0 pr-2">
                                  <span className="text-[11px] font-bold text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">
                                    {fileVal.industryName}
                                  </span>
                                  <span className="text-[9px] text-slate-450 font-mono mt-0.5">
                                    {fileVal.leadCount} total leads • {(fileVal.sizeBytes / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                                <button
                                  disabled={loadingLeads}
                                  onClick={() => handleLoadLeadsFromFile(currentSector.sectorId, currentSector.sectorName, fileVal.fileName)}
                                  className="px-2 py-1 text-[9px] font-bold bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded border border-blue-200 hover:border-blue-700 transition-all shrink-0 flex items-center gap-1 disabled:opacity-50"
                                >
                                  {loadingLeads ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-2.5 h-2.5" />
                                  )}
                                  Sync & Load
                                </button>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded border border-emerald-250 bg-emerald-50/40 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-emerald-950">
                      {activeFile ? 'Vault Sync Complete' : 'File Parsed Successfully'}
                    </h3>
                    <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                      {activeFile 
                        ? `Synced Sector: ${activeFile.sectorName} (${activeFile.fileName})`
                        : uploadSuccess}
                    </p>
                  </div>
                </div>

                {/* Parsing breakdown statistics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border p-3.5 rounded text-center">
                  <div>
                    <span className="block text-xs font-black text-slate-800">{rawParsedLeads.length}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Total Rows</span>
                  </div>
                  <div className="border-x border-gray-300">
                    <span className="block text-xs font-black text-amber-600">{duplicateLeads.length}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Duplicates</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-emerald-600">{cleanNewLeads.length}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Net New</span>
                  </div>
                </div>
                
                {/* Duplicate Viewer Disclosure */}
                {duplicateLeads.length > 0 && (
                  <div className="border rounded bg-slate-50/30">
                    <button 
                      onClick={() => setShowDuplicatesPreview(!showDuplicatesPreview)}
                      className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-extrabold text-slate-650 hover:bg-slate-100/50"
                    >
                      <span>Show duplicate records ({duplicateLeads.length})</span>
                      <span className="text-[10px] text-slate-400 font-bold">{showDuplicatesPreview ? 'Hide' : 'Expand'}</span>
                    </button>
                    {showDuplicatesPreview && (
                      <div className="border-t max-h-[140px] overflow-y-auto p-3 text-[10px] space-y-2 divide-y divide-gray-150 font-mono">
                        {duplicateLeads.map((dup, idx) => (
                          <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-slate-600">
                            <span className="truncate max-w-[130px] font-semibold">{dup.lead.company}</span>
                            <span className="text-amber-700 bg-amber-50 px-1 py-0.5 border rounded text-[9px] font-sans font-bold">
                              {dup.matchType === 'both' ? 'Email & Co.' : dup.matchType === 'email' ? 'Email match' : 'Co. match'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {uploadError && (
              <div className="p-4 rounded border border-red-200 bg-red-50/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-red-950">Ingestion Error</h3>
                  <p className="text-[10px] text-red-650 font-semibold mt-0.5">{uploadError}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lead Distribution Planner Box */}
        <div className="lg:col-span-2 bg-white border border-gray-300 rounded shadow-sm flex flex-col overflow-hidden">
          <div className="border-b border-gray-300 px-6 py-4 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>BDR Lead Allocation & Distribution</span>
            </h2>
            {cleanNewLeads.length > 0 && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDistributeEvenly}
                  className="crm-btn-secondary px-2.5 py-1 text-[10px] font-extrabold flex items-center gap-1 border-gray-350 hover:bg-slate-50"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Distribute Evenly</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-between">
            {cleanNewLeads.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                <Layers className="w-10 h-10 mb-2.5 opacity-60 text-slate-350" />
                <p className="text-xs font-bold uppercase tracking-wider">No leads to distribute</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Please upload a scraper CSV file in the Ingestion panel first.</p>
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                
                {/* Allocator Inputs List */}
                <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                  {bdrAgents.map(agent => {
                    const count = allocations[agent.name] || 0;
                    return (
                      <div key={agent.id} className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center font-bold text-xs">
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{agent.name}</span>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">BDR Outbound Agent</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 font-medium">Assign:</span>
                          <input 
                            type="number" 
                            min="0"
                            max={cleanNewLeads.length}
                            value={count || ''}
                            onChange={(e) => handleAllocationChange(agent.name, parseInt(e.target.value))}
                            className="w-16 px-2.5 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:border-blue-500 bg-white text-slate-700 font-bold"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Allocation Progress Bar & Summary */}
                <div className="bg-slate-50 border p-4 rounded space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <span>Allocation Summary:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        totalAllocated === cleanNewLeads.length 
                          ? 'bg-emerald-100 text-emerald-850' 
                          : totalAllocated > cleanNewLeads.length 
                            ? 'bg-red-100 text-red-850' 
                            : 'bg-amber-100 text-amber-850'
                      }`}>
                        {totalAllocated} / {cleanNewLeads.length} leads assigned
                      </span>
                    </span>
                    <span className="font-mono text-slate-500">
                      {cleanNewLeads.length - totalAllocated} remaining
                    </span>
                  </div>

                  {/* progress bar */}
                  <div className="w-full bg-gray-250 h-2 rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${Math.min(100, (totalAllocated / cleanNewLeads.length) * 100)}%` }}
                      className={`h-full transition-all duration-300 ${
                        totalAllocated > cleanNewLeads.length ? 'bg-red-650' : 'bg-blue-600'
                      }`}
                    />
                  </div>
                  
                  {totalAllocated > cleanNewLeads.length && (
                    <div className="flex items-center gap-1 text-[10px] text-red-650 font-bold mt-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Warning: Assigned count exceeds available new leads count. Decrease allocation values.</span>
                    </div>
                  )}
                </div>

                {/* Submit actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-150">
                  <button
                    onClick={handleResetWorkspace}
                    className="px-4 py-2 border border-gray-300 rounded text-xs font-bold text-slate-650 hover:bg-slate-55 bg-white transition-colors"
                  >
                    Cancel Ingestion
                  </button>
                  <button
                    onClick={handleConfirmDistribution}
                    disabled={totalAllocated === 0 || totalAllocated > cleanNewLeads.length}
                    className={`px-4 py-2 text-xs font-bold rounded shadow-sm text-white flex items-center gap-1.5 transition-all ${
                      totalAllocated === 0 || totalAllocated > cleanNewLeads.length
                        ? 'bg-slate-350 cursor-not-allowed opacity-80'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Ingestion & Distribution</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

      {/* Master Leads Database Table */}
      <div className="crm-panel bg-white shadow-sm border border-gray-300 rounded overflow-hidden">
        
        {/* Table Header Filter controls */}
        <div className="border-b border-gray-300 px-6 py-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-600 shrink-0" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">CRM Master Leads Database</h2>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">
              {totalLeadsCount} Leads
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search master leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-44 text-[11px] rounded border border-gray-300 focus:outline-none focus:border-blue-500 bg-white text-slate-700 font-semibold"
              />
            </div>

            {/* BDR Filter */}
            <select
              value={bdrFilter}
              onChange={(e) => setBdrFilter(e.target.value)}
              className="px-2 py-1.5 text-[11px] font-bold rounded border border-gray-300 bg-white text-slate-650 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All BDRs</option>
              {bdrAgents.map(agent => (
                <option key={agent.id} value={agent.name}>{agent.name}</option>
              ))}
              <option value="unassigned">Unassigned</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 text-[11px] font-bold rounded border border-gray-300 bg-white text-slate-650 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="replied">Replied</option>
              <option value="skipped">Skipped</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-gray-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3">Company Details</th>
                <th className="px-6 py-3">Sector & Industry</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">BDR Owner</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Ingested At</th>
                <th className="w-14 px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 text-xs text-slate-700 bg-white">
              {loadingDbLeads ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-semibold">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading master database leads...</span>
                    </div>
                  </td>
                </tr>
              ) : dbLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-semibold">
                    No leads found matching current filter query parameters.
                  </td>
                </tr>
              ) : (
                dbLeads.map((lead) => {
                  let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (lead.status === 'contacted') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-250';
                  if (lead.status === 'replied') statusBadge = 'bg-blue-50 text-blue-700 border-blue-250';
                  if (lead.status === 'skipped') statusBadge = 'bg-amber-50 text-amber-700 border-amber-250';
                  if (lead.status === 'disqualified') statusBadge = 'bg-red-50 text-red-700 border-red-250';

                  const { firstName, lastName } = parseNameFromEmail(lead.email, lead.company);

                  return (
                    <tr
                      key={lead.id}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      {/* Company Name & Location info */}
                      <td className="px-6 py-3.5">
                        <div>
                          <span className="font-extrabold text-slate-800 block text-[11.5px] tracking-tight">
                            {lead.company}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            {lead.location || 'Unknown location'}
                          </span>
                        </div>
                      </td>

                      {/* Industry Details */}
                      <td className="px-6 py-3.5">
                        <div>
                          <span className="font-bold text-slate-700 block text-[11px] leading-snug">
                            {lead.industry}
                          </span>
                          <span className="text-[9.5px] text-blue-500 font-extrabold uppercase tracking-wide mt-0.5">
                            {lead.sectorName}
                          </span>
                        </div>
                      </td>

                      {/* Contact Info details */}
                      <td className="px-6 py-3.5">
                        <div>
                          <span className="font-semibold text-slate-800 block text-[11px]">
                            {firstName} {lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">
                            {lead.email}
                          </span>
                        </div>
                      </td>

                      {/* Assigned BDR rep badge */}
                      <td className="px-6 py-3.5">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-1.5 text-slate-650">
                            <div className="w-5 h-5 rounded-full bg-slate-100 border text-slate-600 flex items-center justify-center font-bold text-[9px] uppercase">
                              {lead.assignedTo.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <span className="font-extrabold text-[10.5px] tracking-tight">{lead.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold italic">Unassigned</span>
                        )}
                      </td>

                      {/* Lead Status */}
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded border text-[9.5px] font-black uppercase tracking-wider leading-none ${statusBadge}`}>
                          {lead.status}
                        </span>
                      </td>

                      {/* Ingested timestamp */}
                      <td className="px-6 py-3.5 text-[10.5px] text-slate-400 font-semibold">
                        {new Date(lead.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Delete actions */}
                      <td className="px-6 py-3.5 text-center">
                        <button
                          onClick={() => handleDeleteMasterLead(lead.email)}
                          className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-slate-100 rounded transition-colors"
                          title="Delete lead permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4 bg-slate-50/50 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-semibold">
              Showing <span className="font-extrabold text-slate-800">{Math.min(totalLeadsCount, (page - 1) * limit + 1)}</span> to{' '}
              <span className="font-extrabold text-slate-800">{Math.min(totalLeadsCount, page * limit)}</span> of{' '}
              <span className="font-extrabold text-slate-800">{totalLeadsCount}</span> leads
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded text-[11px] font-bold text-slate-650 hover:bg-white bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="text-[11px] font-extrabold text-slate-600 px-2">
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded text-[11px] font-bold text-slate-650 hover:bg-white bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
