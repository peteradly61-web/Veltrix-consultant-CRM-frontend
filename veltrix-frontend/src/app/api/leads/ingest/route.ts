import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

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
    const conditionedLeads = rawLeadsArray.map((lead: any) => {
      return {
        company_name: lead.companyName || null,
        contact_email: lead.email || null,
        contact_name: lead.contactName || 'Prospect',
        title: lead.jobTitle || 'N/A',
        industry: lead.industry || 'General',
        data_pool_name: pool_name || 'Live Scraper Stream',
        status: 'unassigned',
      };
    });

    // Strip out entries that do not have a valid contact_email (required constraint)
    const validLeads = conditionedLeads.filter(lead => lead.contact_email);
    
    if (validLeads.length === 0) {
      return NextResponse.json({ error: 'Bad Request: No valid leads with a contact email provided' }, { status: 400 });
    }

    // 4. Atomic Persistence using Service Role UPSERT on contact_email conflict
    const { data, error } = await supabaseServer
      .from('leads')
      .upsert(validLeads, { onConflict: 'contact_email' })
      .select();

    if (error) {
      console.error('[SCRAPER INGEST] Supabase upsert error:', error);
      return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      leads: data || []
    });
  } catch (error: any) {
    console.error('[SCRAPER INGEST] Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
