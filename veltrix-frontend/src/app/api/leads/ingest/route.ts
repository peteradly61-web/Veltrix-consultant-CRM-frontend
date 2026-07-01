import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { sseBroadcaster } from '@/lib/sseBroadcaster';
import fs from 'fs';
import path from 'path';

const INGESTED_LEADS_FILE = path.resolve(process.cwd(), 'data/ingested_leads.json');

function saveLeadsLocally(leads: any[]) {
  try {
    const dir = path.dirname(INGESTED_LEADS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let existingLeads: any[] = [];
    if (fs.existsSync(INGESTED_LEADS_FILE)) {
      const content = fs.readFileSync(INGESTED_LEADS_FILE, 'utf-8');
      existingLeads = JSON.parse(content || '[]');
    }

    // Deduplicate in-memory by contact_email, keeping the newest
    const merged = [...leads, ...existingLeads];
    const uniqueMap = new Map();
    for (const item of merged) {
      if (item.contact_email && !uniqueMap.has(item.contact_email.toLowerCase())) {
        uniqueMap.set(item.contact_email.toLowerCase(), item);
      }
    }
    const finalLeads = Array.from(uniqueMap.values());
    fs.writeFileSync(INGESTED_LEADS_FILE, JSON.stringify(finalLeads, null, 2));
  } catch (err) {
    console.error('Error saving leads locally:', err);
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authentication: read from query param or header
    const { searchParams } = new URL(request.url);
    const apiKeyParam = searchParams.get('api_key');
    const apiKeyHeader = request.headers.get('api_key');
    const apiKey = apiKeyParam || apiKeyHeader;

    const secretKey = process.env.SCRAPER_SECRET_KEY;
    
    if (!secretKey) {
      console.warn('[SCRAPER INGEST] Warning: SCRAPER_SECRET_KEY environment variable is not defined.');
    }

    if (!secretKey || apiKey !== secretKey) {
      return NextResponse.json({ error: 'Unauthorized: Invalid api_key' }, { status: 401 });
    }

    // 2. Payload Interception
    const body = await request.json().catch(() => ({}));
    const { pool_name, leads } = body;

    if (!leads) {
      return NextResponse.json({ error: 'Bad Request: Missing leads payload' }, { status: 400 });
    }

    // Handle either a single lead object or an array of lead objects seamlessly
    const rawLeadsArray = Array.isArray(leads) ? leads : [leads];

    // 3. Schema Mapping & Data Conditioning
    const conditionedLeads = rawLeadsArray.map((lead: any, idx: number) => {
      return {
        id: `lead-ingested-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 11)}`,
        company_name: lead.companyName || null,
        contact_email: lead.email || null,
        contact_name: lead.contactName || 'Prospect',
        title: lead.jobTitle || 'N/A',
        industry: lead.industry || 'General',
        data_pool_name: pool_name || 'Live Scraper Stream',
        status: 'unassigned',
        created_at: new Date().toISOString()
      };
    });

    // Strip out entries that do not have a valid contact_email (required constraint)
    const validLeads = conditionedLeads.filter(lead => lead.contact_email);
    
    if (validLeads.length === 0) {
      return NextResponse.json({ error: 'Bad Request: No valid leads with a contact email provided' }, { status: 400 });
    }

    // Save locally to support offline mode/fallback
    saveLeadsLocally(validLeads);

    // Broadcast in real-time to active SSE clients
    validLeads.forEach(lead => {
      try {
        sseBroadcaster.broadcastLead(lead);
      } catch (broadcastErr) {
        console.error('[SCRAPER INGEST] SSE broadcast error:', broadcastErr);
      }
    });

    // 4. Persistence to Supabase (Best effort, will not crash if offline)
    try {
      const { data, error } = await supabaseServer
        .from('leads')
        .upsert(
          validLeads.map(({ id, ...rest }) => rest), // Let Supabase handle primary keys or matching constraints
          { onConflict: 'contact_email' }
        )
        .select();

      if (error) {
        console.warn('[SCRAPER INGEST] Supabase sync warning (ignored):', error.message);
      } else {
        console.log('[SCRAPER INGEST] Supabase sync successful:', data?.length, 'records');
      }
    } catch (dbErr: any) {
      console.warn('[SCRAPER INGEST] Supabase connection failed (using local storage fallback):', dbErr.message || dbErr);
    }

    return NextResponse.json({
      success: true,
      count: validLeads.length,
      leads: validLeads
    });
  } catch (error: any) {
    console.error('[SCRAPER INGEST] Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
