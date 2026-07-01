import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ParsedLead {
  company: string;
  email: string;
  website: string;
  location: string;
  industry: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector');
    const file = searchParams.get('file');

    if (!sector || !file) {
      return NextResponse.json({
        success: false,
        error: 'Missing required query parameters: sector and file'
      }, { status: 400 });
    }

    const rawVaultPath = process.env.DATA_VAULT_PATH || '../../vertlix_scraper/vertlix_scraper/data_vault';
    const vaultPath = path.isAbsolute(rawVaultPath)
      ? rawVaultPath
      : path.resolve(process.cwd(), rawVaultPath);

    const filePath = path.join(vaultPath, sector, file);

    // Security Check: Prevent directory traversal
    const resolvedVaultPath = path.resolve(vaultPath);
    const resolvedFilePath = path.resolve(filePath);

    if (!resolvedFilePath.startsWith(resolvedVaultPath)) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Directory traversal detected.'
      }, { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        success: false,
        error: `File not found at: ${filePath}`
      }, { status: 404 });
    }

    const text = await fs.promises.readFile(filePath, 'utf-8');
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Standardize headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    // Find expected indices
    const companyIdx = headers.findIndex(h => h.toLowerCase() === 'company_name');
    const emailIdx = headers.findIndex(h => h.toLowerCase() === 'contact_email');
    const websiteIdx = headers.findIndex(h => h.toLowerCase() === 'website_url');
    const locationIdx = headers.findIndex(h => h.toLowerCase() === 'location');
    const industryIdx = headers.findIndex(h => h.toLowerCase() === 'industry');
    
    if (companyIdx === -1 || emailIdx === -1) {
      return NextResponse.json({
        success: false,
        error: "Invalid CSV schema. Missing required headers: 'Company_Name' and 'Contact_Email'."
      }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      data: records
    });
  } catch (error: any) {
    console.error('Error fetching leads from file:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch leads from data vault file'
    }, { status: 500 });
  }
}
