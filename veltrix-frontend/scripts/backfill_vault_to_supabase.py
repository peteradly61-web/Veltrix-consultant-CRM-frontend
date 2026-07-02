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
                
                # Keep first match, or update if we have a better company name
                if email not in unique_leads:
                    unique_leads[email] = {
                        'company_name': company,
                        'contact_name': 'Prospect',
                        'email': email,
                        'status': 'new'
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
