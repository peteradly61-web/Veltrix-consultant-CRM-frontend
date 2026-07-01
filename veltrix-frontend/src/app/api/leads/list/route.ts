import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const INGESTED_LEADS_FILE = path.resolve(process.cwd(), 'data/ingested_leads.json');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!fs.existsSync(INGESTED_LEADS_FILE)) {
      return NextResponse.json({ success: true, data: [] });
    }
    const content = await fs.promises.readFile(INGESTED_LEADS_FILE, 'utf-8');
    const leads = JSON.parse(content || '[]');
    
    // Filter for unassigned leads and sort chronologically (newest first)
    const unassigned = leads
      .filter((l: any) => l.status === 'unassigned')
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ success: true, data: unassigned });
  } catch (error: any) {
    console.error('[API LEADS LIST] Error reading leads:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
