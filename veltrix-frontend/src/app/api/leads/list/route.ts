import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseServer } from '@/lib/supabaseServer';

const INGESTED_LEADS_FILE = path.resolve(process.cwd(), 'data/ingested_leads.json');
const ASSIGNMENTS_FILE = path.resolve(process.cwd(), 'data/assignments.json');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isVercel = !!process.env.VERCEL;
    let leads: any[] = [];
    if (!isVercel && fs.existsSync(INGESTED_LEADS_FILE)) {
      const content = await fs.promises.readFile(INGESTED_LEADS_FILE, 'utf-8');
      leads = JSON.parse(content || '[]');
    }

    // Load current assignments so we can exclude already-assigned leads
    let assignments: Record<string, any> = {};
    if (!isVercel && fs.existsSync(ASSIGNMENTS_FILE)) {
      try {
        const assignContent = fs.readFileSync(ASSIGNMENTS_FILE, 'utf-8');
        assignments = JSON.parse(assignContent || '{}');
      } catch (e) {
        assignments = {};
      }
    }

    // Filter: show only leads that are unassigned in both the local status field
    // AND not yet present in assignments.json
    let unassigned = leads
      .filter((l: any) => {
        if (!l.contact_email) return false;
        const emailLower = l.contact_email.toLowerCase();
        const alreadyAssigned = assignments[emailLower]?.assignedTo;
        return l.status === 'unassigned' && !alreadyAssigned;
      })
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Fallback: If empty or running on Vercel, read unassigned leads from Supabase
    if (isVercel || unassigned.length === 0) {
      const supabase = getSupabaseServer();
      if (supabase) {
        try {
          const { data: sbLeads, error: sbError } = await supabase
            .from('v_lead_attribution')
            .select('*')
            .is('closing_bdr_id', null)
            .order('lead_created_at', { ascending: false });

          if (sbError) {
            console.warn('[leads-list] Supabase fallback error:', sbError.message);
          } else if (sbLeads && sbLeads.length > 0) {
            unassigned = sbLeads.map((l: any) => ({
              id: l.lead_id || `lead-sb-${l.lead_email}`,
              company_name: l.company_name || 'Unknown',
              contact_email: l.lead_email,
              contact_name: l.contact_name || 'Prospect',
              title: l.title || 'N/A',
              industry: l.industry || 'Other',
              data_pool_name: l.data_pool_name || 'Live Stream',
              status: 'unassigned',
              created_at: l.lead_created_at
            }));
          }
        } catch (sbErr: any) {
          console.warn('[leads-list] Supabase fallback exception:', sbErr.message);
        }
      }
    }

    return NextResponse.json({ success: true, data: unassigned });
  } catch (error: any) {
    console.error('[API LEADS LIST] Error reading leads:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


