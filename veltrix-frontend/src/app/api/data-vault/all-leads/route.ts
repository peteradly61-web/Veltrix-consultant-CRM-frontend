import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ScrapedLead {
  company: string;
  email: string;
  website: string;
  location: string;
  industry: string;
  sectorId: string;
  sectorName: string;
}

interface LeadAssignment {
  assignedTo: string;
  status: string;
  comment?: string;
  createdAt?: string;
  savedToOpportunities?: boolean;
}

type AssignmentsMap = Record<string, LeadAssignment>;

// In-memory cache structure
interface LeadsCache {
  leadsMap: Map<string, ScrapedLead[]>; // file_path -> leads
  leadsList: ScrapedLead[];
  filesMeta: Record<string, { size: number; mtime: number }>;
  lastScanTime: number;
}

// Store cache in NodeJS global to survive dev server hot-reloads
const globalRef = global as any;
if (!globalRef.leadsCache) {
  globalRef.leadsCache = {
    leadsMap: new Map(),
    leadsList: [],
    filesMeta: {},
    lastScanTime: 0
  };
}
const cache: LeadsCache = globalRef.leadsCache;

// Path helper for Assignments JSON file
const ASSIGNMENTS_FILE = path.resolve(process.cwd(), 'data/assignments.json');

// Read assignments from JSON file
function readAssignments(): AssignmentsMap {
  try {
    if (!fs.existsSync(ASSIGNMENTS_FILE)) {
      // Ensure directory exists
      const dir = path.dirname(ASSIGNMENTS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify({}));
      return {};
    }
    const content = fs.readFileSync(ASSIGNMENTS_FILE, 'utf-8');
    return JSON.parse(content || '{}');
  } catch (err) {
    console.error('Error reading assignments file:', err);
    return {};
  }
}

// Write assignments to JSON file
function writeAssignments(data: AssignmentsMap) {
  try {
    const dir = path.dirname(ASSIGNMENTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing assignments file:', err);
  }
}

// Helper to clean industry sector folder names for UI
const cleanSectorName = (id: string) => {
  return id
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// CSV Line Parser with comma/quotes support
function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let inQuotes = false;
  let currentCol = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cols.push(currentCol.trim().replace(/^["']|["']$/g, ''));
      currentCol = '';
    } else {
      currentCol += char;
    }
  }
  cols.push(currentCol.trim().replace(/^["']|["']$/g, ''));
  return cols;
}

// Read and parse a single CSV file
function parseCSVFile(filePath: string, sectorId: string, sectorName: string): ScrapedLead[] {
  try {
    const text = fs.readFileSync(filePath, 'utf-8');
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const companyIdx = headers.findIndex(h => h.toLowerCase() === 'company_name');
    const emailIdx = headers.findIndex(h => h.toLowerCase() === 'contact_email');
    const websiteIdx = headers.findIndex(h => h.toLowerCase() === 'website_url');
    const locationIdx = headers.findIndex(h => h.toLowerCase() === 'location');
    const industryIdx = headers.findIndex(h => h.toLowerCase() === 'industry');

    if (companyIdx === -1 || emailIdx === -1) {
      return []; // Skip files that don't match the schema
    }

    const records: ScrapedLead[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = parseCSVLine(line);
      if (cols.length > 0 && cols[companyIdx] && cols[emailIdx]) {
        records.push({
          company: cols[companyIdx],
          email: cols[emailIdx],
          website: websiteIdx !== -1 && cols[websiteIdx] ? cols[websiteIdx] : '',
          location: locationIdx !== -1 && cols[locationIdx] ? cols[locationIdx] : 'Unknown',
          industry: industryIdx !== -1 && cols[industryIdx] ? cols[industryIdx] : 'Other',
          sectorId,
          sectorName
        });
      }
    }
    return records;
  } catch (err) {
    console.error(`Error parsing file: ${filePath}`, err);
    return [];
  }
}

// Sync the in-memory cache with the local filesystem
function syncCache() {
  const rawVaultPath = process.env.DATA_VAULT_PATH || '../../vertlix_scraper/vertlix_scraper/data_vault';
  const vaultPath = path.isAbsolute(rawVaultPath) ? rawVaultPath : path.resolve(process.cwd(), rawVaultPath);

  if (!fs.existsSync(vaultPath)) {
    console.warn(`Data vault path not found: ${vaultPath}`);
    return;
  }

  // Scan all directories (sectors)
  let folders: string[] = [];
  try {
    folders = fs.readdirSync(vaultPath).filter(f => fs.statSync(path.join(vaultPath, f)).isDirectory());
  } catch (err) {
    console.error('Error scanning vault directory:', err);
    return;
  }

  let cacheChanged = false;

  folders.forEach(sectorFolder => {
    const sectorPath = path.join(vaultPath, sectorFolder);
    let files: string[] = [];
    try {
      files = fs.readdirSync(sectorPath).filter(f => f.endsWith('.csv'));
    } catch (err) {
      return;
    }

    const sectorName = cleanSectorName(sectorFolder);

    files.forEach(file => {
      const filePath = path.join(sectorPath, file);
      const stat = fs.statSync(filePath);
      const cacheKey = `${sectorFolder}/${file}`;

      const existingMeta = cache.filesMeta[cacheKey];
      const isModified = !existingMeta || existingMeta.size !== stat.size || existingMeta.mtime !== stat.mtime.getTime();

      if (isModified) {
        // Re-parse only the modified file
        const fileLeads = parseCSVFile(filePath, sectorFolder, sectorName);
        cache.leadsMap.set(cacheKey, fileLeads);
        cache.filesMeta[cacheKey] = {
          size: stat.size,
          mtime: stat.mtime.getTime()
        };
        cacheChanged = true;
      }
    });
  });

  // Re-flatten the map to leadsList if there were updates
  if (cacheChanged || cache.leadsList.length === 0) {
    const list: ScrapedLead[] = [];
    for (const fileLeads of cache.leadsMap.values()) {
      list.push(...fileLeads);
    }
    cache.leadsList = list;
    cache.lastScanTime = Date.now();
    console.log(`Leads cache re-indexed: ${cache.leadsList.length} total leads.`);
  }
}

// GET all leads with pagination, search, and filters
export async function GET(request: Request) {
  try {
    // 1. Sync files with cache
    syncCache();

    // 2. Read query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const sector = searchParams.get('sector') || '';
    const status = searchParams.get('status') || '';
    const bdr = searchParams.get('bdr') || '';
    const opportunities = searchParams.get('opportunities') === 'true';

    // 3. Load persistent BDR assignments
    const assignments = readAssignments();

    // Get all scraper email addresses as a Set for fast lookup
    const scraperEmails = new Set(cache.leadsList.map(l => l.email.toLowerCase()));

    // Load locally ingested leads to merge
    const INGESTED_LEADS_FILE = path.resolve(process.cwd(), 'data/ingested_leads.json');
    let ingestedLeads: any[] = [];
    if (fs.existsSync(INGESTED_LEADS_FILE)) {
      try {
        const content = fs.readFileSync(INGESTED_LEADS_FILE, 'utf-8');
        ingestedLeads = JSON.parse(content || '[]');
      } catch (err) {
        console.error('Error reading ingested leads in all-leads:', err);
      }
    }

    // 4. Merge and Filter leads
    let filtered = cache.leadsList.map((lead, index) => {
      const emailLower = lead.email.toLowerCase();
      const assignment = assignments[emailLower];
      
      const defaultComment = `Website: ${lead.website || 'N/A'}\nLocation: ${lead.location || 'N/A'}\nSector: ${lead.sectorName}`;

      return {
        id: `lead-scraped-${emailLower}`,
        company: lead.company,
        email: lead.email,
        website: lead.website,
        location: lead.location,
        industry: lead.industry,
        sectorId: lead.sectorId,
        sectorName: lead.sectorName,
        assignedTo: assignment?.assignedTo || undefined,
        status: assignment?.status || 'new',
        comment: assignment?.comment || defaultComment,
        createdAt: assignment?.createdAt || new Date(Date.now() - (index * 60 * 1000)).toISOString(),
        savedToOpportunities: assignment?.savedToOpportunities || false
      };
    });

    // Merge ingested leads if they are not already in scraperEmails
    ingestedLeads.forEach((lead) => {
      // Guard: skip records without a valid email address
      if (!lead.contact_email) return;

      const emailLower = lead.contact_email.toLowerCase();
      if (!scraperEmails.has(emailLower)) {
        const assignment = assignments[emailLower];
        filtered.push({
          id: lead.id,
          company: lead.company_name || 'Unknown Company',
          email: lead.contact_email,
          website: '',
          location: 'Unknown',
          industry: lead.industry,
          sectorId: 'ingested',
          sectorName: lead.data_pool_name,
          assignedTo: assignment?.assignedTo || undefined,
          status: assignment?.status || lead.status || 'new',
          comment: assignment?.comment || `Sourced from live stream: ${lead.data_pool_name}`,
          createdAt: assignment?.createdAt || lead.created_at,
          savedToOpportunities: assignment?.savedToOpportunities || false
        });
        scraperEmails.add(emailLower); // Prevent duplicate addition
      }
    });


    // Add manually created assignments (not in scraper list)
    Object.keys(assignments).forEach(emailLower => {
      if (!scraperEmails.has(emailLower)) {
        const assign = assignments[emailLower];
        // Parse metadata from comment if possible, or use default fallback values
        let company = 'Manual Lead';
        let industry = 'Other';
        if (assign.comment) {
          const lines = assign.comment.split('\n');
          const companyLine = lines.find(l => l.startsWith('Company: '));
          const industryLine = lines.find(l => l.startsWith('Industry: '));
          if (companyLine) company = companyLine.replace('Company: ', '').trim();
          if (industryLine) industry = industryLine.replace('Industry: ', '').trim();
        }

        filtered.push({
          id: `lead-manual-${emailLower}`,
          company,
          email: emailLower,
          website: '',
          location: 'Manual Entry',
          industry,
          sectorId: 'manual',
          sectorName: 'Manual Entry',
          assignedTo: assign.assignedTo,
          status: assign.status,
          comment: assign.comment || '',
          createdAt: assign.createdAt || new Date().toISOString(),
          savedToOpportunities: assign.savedToOpportunities || false
        });
      }
    });

    // Apply Filters
    if (opportunities) {
      filtered = filtered.filter(l => l.savedToOpportunities);
    }

    // Apply Filters
    if (search) {
      filtered = filtered.filter(l => 
        l.company.toLowerCase().includes(search) ||
        l.email.toLowerCase().includes(search) ||
        l.industry.toLowerCase().includes(search) ||
        (l.assignedTo && l.assignedTo.toLowerCase().includes(search))
      );
    }

    if (sector && sector !== 'all') {
      filtered = filtered.filter(l => l.sectorId === sector);
    }

    if (status && status !== 'all') {
      if (status === 'unassigned') {
        filtered = filtered.filter(l => !l.assignedTo);
      } else {
        filtered = filtered.filter(l => l.status === status);
      }
    }

    if (bdr && bdr !== 'all') {
      if (bdr === 'unassigned') {
        filtered = filtered.filter(l => !l.assignedTo);
      } else {
        filtered = filtered.filter(l => l.assignedTo === bdr);
      }
    }

    // Sort: unassigned first, then by date desc
    filtered.sort((a, b) => {
      // Prioritize unassigned
      if (!a.assignedTo && b.assignedTo) return -1;
      if (a.assignedTo && !b.assignedTo) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 5. Paginate
    const totalCount = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedLeads = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedLeads,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    console.error('Error in GET /api/data-vault/all-leads:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}

// POST endpoint to handle assignments and status updates
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, assignments: newAssignments } = body;

    if (!Array.isArray(newAssignments)) {
      return NextResponse.json({
        success: false,
        error: 'Assignments parameter must be an array.'
      }, { status: 400 });
    }

    const currentAssignments = readAssignments();

    newAssignments.forEach((assign: any) => {
      const emailLower = assign.email.toLowerCase();
      
      if (action === 'delete') {
        delete currentAssignments[emailLower];
      } else {
        // Create or update assignment
        const existing = currentAssignments[emailLower] || {};
        currentAssignments[emailLower] = {
          assignedTo: assign.assignedTo || existing.assignedTo,
          status: assign.status || existing.status || 'new',
          comment: assign.comment !== undefined ? assign.comment : existing.comment,
          createdAt: assign.createdAt || existing.createdAt || new Date().toISOString(),
          savedToOpportunities: assign.savedToOpportunities !== undefined ? assign.savedToOpportunities : existing.savedToOpportunities || false
        };
      }
    });

    writeAssignments(currentAssignments);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${newAssignments.length} assignments.`
    });

  } catch (error: any) {
    console.error('Error in POST /api/data-vault/all-leads:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
