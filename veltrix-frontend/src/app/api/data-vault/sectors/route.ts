import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SECTOR_NAME_MAP: Record<string, string> = {
  agriculture_food_processing: "Agriculture & Food Processing",
  chemical_plastic_rubber: "Chemical, Plastic & Rubber",
  electrical_machinery_electronics: "Electrical Machinery & Electronics",
  food_nutrition: "Food & Nutrition",
  home_furniture: "Home & Furniture",
  industry_manufacturing: "Industry & Manufacturing",
  machinery_appliances_automation: "Machinery, Appliances & Automation",
  medical_devices_pharma: "Medical Devices & Pharma",
  metal_industries_metallurgy: "Metal Industries & Metallurgy",
  mineral_products_building: "Mineral Products & Building",
  technology_health: "Technology & Health",
  textiles_apparel_fashion: "Textiles, Apparel & Fashion",
  trade_services: "Trade & Services",
  transportation_automotive: "Transportation & Automotive",
  wood_paper_forestry: "Wood, Paper & Forestry"
};

const cleanIndustryName = (fileName: string): string => {
  const base = fileName.replace(/\.csv$/i, '');
  return base
    .split('_')
    .map((word, idx) => {
      if (word.toLowerCase() === 'and') return 'and';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export async function GET() {
  try {
    const rawVaultPath = process.env.DATA_VAULT_PATH || '../../vertlix_scraper/vertlix_scraper/data_vault';
    const vaultPath = path.isAbsolute(rawVaultPath)
      ? rawVaultPath
      : path.resolve(process.cwd(), rawVaultPath);

    if (!fs.existsSync(vaultPath)) {
      return NextResponse.json({
        success: false,
        error: `Data vault directory not found at: ${vaultPath}`
      }, { status: 404 });
    }

    const entries = await fs.promises.readdir(vaultPath, { withFileTypes: true });
    const sectors = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sectorId = entry.name;
        const sectorName = SECTOR_NAME_MAP[sectorId] || cleanIndustryName(sectorId);
        const sectorDir = path.join(vaultPath, sectorId);
        const filesInSector = await fs.promises.readdir(sectorDir, { withFileTypes: true });
        
        const files = [];

        for (const fileVal of filesInSector) {
          if (fileVal.isFile() && fileVal.name.endsWith('.csv')) {
            const filePath = path.join(sectorDir, fileVal.name);
            const stats = await fs.promises.stat(filePath);
            
            // Count lines/leads
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
            // Deduct header line from total count
            const leadCount = Math.max(0, lines.length - 1);

            files.push({
              fileName: fileVal.name,
              industryName: cleanIndustryName(fileVal.name),
              sizeBytes: stats.size,
              leadCount
            });
          }
        }

        sectors.push({
          sectorId,
          sectorName,
          files: files.sort((a, b) => a.industryName.localeCompare(b.industryName))
        });
      }
    }

    // Sort sectors by name
    sectors.sort((a, b) => a.sectorName.localeCompare(b.sectorName));

    return NextResponse.json({
      success: true,
      data: sectors
    });
  } catch (error: any) {
    console.error('Error listing data vault sectors:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to list data vault sectors'
    }, { status: 500 });
  }
}
