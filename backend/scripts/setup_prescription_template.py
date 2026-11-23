import os
import sys
import requests
from dotenv import load_dotenv

# Load env variables
load_dotenv('.env')
load_dotenv('backend/.env')

token = os.getenv('WHATSAPP_ACCESS_TOKEN', '')
waba_id = os.getenv('WHATSAPP_WABA_ID', '2357762654985667')
api_version = os.getenv('WHATSAPP_API_VERSION', 'v21.0')

if not token:
    print("[Error] WHATSAPP_ACCESS_TOKEN is missing in .env")
    sys.exit(1)

base_url = f"https://graph.facebook.com/{api_version}"

def check_token():
    res = requests.get(f"{base_url}/me?access_token={token}")
    if res.status_code != 200:
        print("[Auth Error] Token is invalid or expired:", res.json())
        return False
    print("[Auth OK] Token is valid for:", res.json())
    return True

def list_templates():
    url = f"{base_url}/{waba_id}/message_templates"
    res = requests.get(url, headers={'Authorization': f'Bearer {token}'})
    if res.status_code == 200:
        templates = res.json().get('data', [])
        print(f"\n[Found {len(templates)} templates on WABA {waba_id}]:")
        for t in templates:
            print(f" - {t.get('name')} ({t.get('status')} | {t.get('category')} | {t.get('language')})")
        return templates
    else:
        print(f"[Error fetching templates]: {res.json()}")
        return []

def create_or_update_template(name="prescription_delivery_kalpana"):
    url = f"{base_url}/{waba_id}/message_templates"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    payload = {
        "name": name,
        "category": "UTILITY",
        "language": "en",
        "components": [
            {
                "type": "HEADER",
                "format": "DOCUMENT",
                "example": {
                    "header_handle": []
                }
            },
            {
                "type": "BODY",
                "text": "Dear {{1}}, your prescription ({{2}}) from Dr. Kalpana Tripathi Ampeh (Pat.) Homeopathy Clinic is attached. Wishing you vibrant health and speedy recovery!",
                "example": {
                    "body_text": [["Abhi Kush", "RX-2026-1037"]]
                }
            },
            {
                "type": "FOOTER",
                "text": "Dr. Kalpana Tripathi Ampeh (Pat.) Homeopathy Clinic"
            }
        ]
    }
    res = requests.post(url, headers=headers, json=payload)
    print(f"\nCreate template '{name}' response (status {res.status_code}):", res.json())
    return res.status_code in (200, 201)

if __name__ == '__main__':
    if check_token():
        list_templates()
        create_or_update_template("prescription_delivery_kalpana")
