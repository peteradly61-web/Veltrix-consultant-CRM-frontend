import os
import json
import requests
import re
import pandas as pd
from pathlib import Path

def parse_env_local(filepath):
    env_vars = {}
    if not filepath.exists():
        return env_vars
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split('=', 1)
            if len(parts) == 2:
                key, val = parts[0].strip(), parts[1].strip()
                # Remove quotes if present
                val = re.sub(r'^["\']|["\']$', '', val)
                env_vars[key] = val
    return env_vars

SECTOR_NAME_MAP = {
    "agriculture_food_processing": "Agriculture & Food Processing",
    "chemical_plastic_rubber": "Chemical, Plastic & Rubber",
    "electrical_machinery_electronics": "Electrical Machinery & Electronics",
    "food_nutrition": "Food & Nutrition",
    "home_furniture": "Home & Furniture",
    "industry_manufacturing": "Industry & Manufacturing",
    "machinery_appliances_automation": "Machinery, Appliances & Automation",
    "medical_devices_pharma": "Medical Devices & Pharma",
    "metal_industries_metallurgy": "Metal Industries & Metallurgy",
    "mineral_products_building": "Mineral Products & Building",
    "technology_health": "Technology & Health",
    "textiles_apparel_fashion": "Textiles, Apparel & Fashion",
    "trade_services": "Trade & Services",
    "transportation_automotive": "Transportation & Automotive",
    "wood_paper_forestry": "Wood, Paper & Forestry"
}

def parse_name_from_email(email):
    if not email:
        return 'Prospect'
    username = email.split('@')[0].lower().strip()
    if not username:
        return 'Prospect'
    generics = {
        'info', 'sales', 'support', 'hello', 'contact', 'office', 'admin', 
        'jobs', 'careers', 'billing', 'team', 'help', 'service', 'inbound',
        'media', 'press', 'marketing', 'orders', 'enquiry', 'enquiries'
    }
    if username in generics:
        return 'Contact Representative'
    
    split_chars = ['.', '_', '-']
    for char in split_chars:
        if char in username:
            parts = [p.capitalize().strip() for p in username.split(char) if p.strip()]
            if len(parts) >= 2:
                return f"{parts[0]} {parts[1]}"
            elif len(parts) == 1:
                return parts[0]
    
    name = username.capitalize().strip()
    return name if name else 'Prospect'


def main():
    root_dir = Path(__file__).resolve().parent.parent
    env_path = root_dir / '.env.local'
    
    # Locate data_vault relative to the script or default path
    vault_path = Path("E:/OneDrive/Desktop/vertlix_scraper/vertlix_scraper/data_vault")

    print(f"Reading environment variables from {env_path}...")
    env_vars = parse_env_local(env_path)

    supabase_url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
    # Use SUPABASE_SERVICE_ROLE_KEY or fallback to ANON_KEY
    supabase_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY') or env_vars.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if not supabase_url or not supabase_key:
        print("Error: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY/ANON_KEY are missing from .env.local")
        return

    if not vault_path.exists():
        print(f"Error: data_vault folder not found at {vault_path}")
        return

    print(f"Scanning CSV files recursively in {vault_path}...")
    csv_files = list(vault_path.rglob('*.csv'))
    print(f"Found {len(csv_files)} CSV files to process.")

    unique_leads = {}
    total_processed_rows = 0

    email_regex = re.compile(r'^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$')

    for idx, csv_file in enumerate(csv_files, 1):
        print(f"[{idx}/{len(csv_files)}] Reading {csv_file.name}...")
        try:
            # Read columns we need
            df = pd.read_csv(csv_file, dtype=str)
            total_processed_rows += len(df)
            
            sector_dir = csv_file.parent.name
            data_pool = SECTOR_NAME_MAP.get(sector_dir, sector_dir.replace('_', ' ').title())

            for _, row in df.iterrows():
                email = row.get('Contact_Email')
                if pd.isna(email) or not isinstance(email, str):
                    continue
                
                email = email.strip().lower()
                if len(email) > 255 or not email_regex.match(email):
                    continue

                company_name = row.get('Company_Name')
                company = company_name.strip() if (isinstance(company_name, str) and company_name.strip()) else 'Unknown Company'
                if len(company) > 255:
                    company = company[:255]

                contact_name = parse_name_from_email(email)

                website = row.get('Website_URL')
                website = website.strip() if (isinstance(website, str) and website.strip()) else ''
                if len(website) > 255:
                    website = website[:255]

                location = row.get('Location')
                location = location.strip() if (isinstance(location, str) and location.strip()) else ''
                if len(location) > 255:
                    location = location[:255]

                industry_val = row.get('Industry')
                industry_val = industry_val.strip() if (isinstance(industry_val, str) and industry_val.strip()) else 'Other'
                if len(industry_val) > 255:
                    industry_val = industry_val[:255]
                
                # Keep first match, or update if we have a better company name
                if email not in unique_leads:
                    unique_leads[email] = {
                        'company_name': company,
                        'contact_name': contact_name,
                        'email': email,
                        'status': 'new',
                        'website': website,
                        'location': location,
                        'industry': industry_val,
                        'data_pool_name': data_pool
                    }
        except Exception as e:
            print(f"Error reading {csv_file}: {e}")

    conditioned_leads = list(unique_leads.values())
    total_leads = len(conditioned_leads)
    print(f"\n--- Scan Summary ---")
    print(f"Total rows read: {total_processed_rows}")
    print(f"Unique valid leads to upload: {total_leads}")

    if total_leads == 0:
        print("No valid leads found to upload.")
        return

    # Prepare PostgREST endpoint
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/leads?on_conflict=email"
    headers = {
        'apikey': supabase_key,
        'Authorization': f"Bearer {supabase_key}",
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }

    # Upload in batches of 1000
    batch_size = 1000
    success_count = 0

    print(f"\nUploading leads in batches of {batch_size} to Supabase REST endpoint: {endpoint}")
    for i in range(0, total_leads, batch_size):
        batch = conditioned_leads[i:i+batch_size]
        try:
            response = requests.post(endpoint, headers=headers, json=batch, timeout=30)
            if response.status_code in (200, 201):
                success_count += len(batch)
                print(f"Successfully uploaded batch {i//batch_size + 1}/{((total_leads - 1)//batch_size) + 1} ({success_count}/{total_leads} leads synced)")
            else:
                print(f"Failed to upload batch starting at index {i}. Status: {response.status_code}. Response: {response.text}")
        except Exception as e:
            print(f"Exception during batch upload starting at index {i}: {e}")

    print("\n--- Sync Summary ---")
    print(f"Total processed: {total_leads}")
    print(f"Successfully uploaded/merged: {success_count}")
    print(f"Failed: {total_leads - success_count}")

if __name__ == '__main__':
    main()
