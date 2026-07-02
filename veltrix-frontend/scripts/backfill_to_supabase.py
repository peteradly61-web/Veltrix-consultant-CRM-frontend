import os
import json
import requests
import re
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
    leads_path = root_dir / 'data' / 'ingested_leads.json'

    print(f"Reading environment variables from {env_path}...")
    env_vars = parse_env_local(env_path)

    supabase_url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
    # Use SUPABASE_SERVICE_ROLE_KEY if available, fallback to NEXT_PUBLIC_SUPABASE_ANON_KEY
    supabase_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY') or env_vars.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if not supabase_url or not supabase_key:
        print("Error: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY/ANON_KEY are missing from .env.local")
        return

    if not leads_path.exists():
        print(f"Error: Local leads file not found at {leads_path}")
        return

    print(f"Reading local leads from {leads_path}...")
    with open(leads_path, 'r', encoding='utf-8') as f:
        local_leads = json.load(f)

    print(f"Loaded {len(local_leads)} leads from local JSON file.")

    # Condition and deduplicate leads
    seen_emails = set()
    conditioned_leads = []
    for lead in local_leads:
        email = lead.get('contact_email', '').strip().lower()
        if not email or email in seen_emails:
            continue
        
        # Simple regex check for email format validation
        if not re.match(r'^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$', email):
            continue

        seen_emails.add(email)
        conditioned_leads.append({
            'company_name': lead.get('company_name') or 'Unknown Company',
            'contact_name': lead.get('contact_name') or 'Prospect',
            'email': email,
            'status': 'new'
        })

    total_leads = len(conditioned_leads)
    print(f"Conditioned and filtered leads for upload: {total_leads} unique leads.")

    # Prepare PostgREST endpoint
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/leads"
    headers = {
        'apikey': supabase_key,
        'Authorization': f"Bearer {supabase_key}",
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }

    # Upload in batches of 100
    batch_size = 100
    success_count = 0

    print(f"Uploading leads in batches of {batch_size} to Supabase REST endpoint: {endpoint}")
    for i in range(0, total_leads, batch_size):
        batch = conditioned_leads[i:i+batch_size]
        try:
            response = requests.post(endpoint, headers=headers, json=batch, timeout=15)
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
