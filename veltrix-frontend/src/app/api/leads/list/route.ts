import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const INGESTED_LEADS_FILE = path.resolve(process.cwd(), 'data/ingested_leads.json');
const ASSIGNMENTS_FILE = path.resolve(process.cwd(), 'data/assignments.json');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!fs.existsSync(INGESTED_LEADS_FILE)) {
      return NextResponse.json({ success: true, data: [] });
    }
    const content = await fs.promises.readFile(INGESTED_LEADS_FILE, 'utf-8');
    const leads = JSON.parse(content || '[]');

    // Load current assignments so we can exclude already-assigned leads
    let assignments: Record<string, any> = {};
    if (fs.existsSync(ASSIGNMENTS_FILE)) {
      try {
        const assignContent = fs.readFileSync(ASSIGNMENTS_FILE, 'utf-8');
        assignments = JSON.parse(assignContent || '{}');
      } catch (e) {
        // If assignments file is unreadable, fall back to no filtering
        assignments = {};
      }
    }

    // Filter: show only leads that are unassigned in both the local status field
    // AND not yet present in assignments.json
    const unassigned = leads
      .filter((l: any) => {
        if (!l.contact_email) return false;
        const emailLower = l.contact_email.toLowerCase();
        const alreadyAssigned = assignments[emailLower]?.assignedTo;
        return l.status === 'unassigned' && !alreadyAssigned;
      })
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ success: true, data: unassigned });
  } catch (error: any) {
    console.error('[API LEADS LIST] Error reading leads:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

