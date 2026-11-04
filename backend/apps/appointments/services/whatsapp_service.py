import os
import re
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

class WhatsAppService:
    @property
    def api_version(self):
        return getattr(settings, 'WHATSAPP_API_VERSION', 'v21.0') or os.getenv('WHATSAPP_API_VERSION', 'v21.0')

    @property
    def phone_number_id(self):
        return getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', '') or os.getenv('WHATSAPP_PHONE_NUMBER_ID', '')

    @property
    def access_token(self):
        return getattr(settings, 'WHATSAPP_ACCESS_TOKEN', '') or os.getenv('WHATSAPP_ACCESS_TOKEN', '')

    @property
    def base_url(self):
        return f"https://graph.facebook.com/{self.api_version}"

    def normalize_phone_number(self, raw_phone, default_country_code='91'):
        """
        Normalizes a phone number into Meta E.164 digits-only format (e.g. 919876543210).
        """
        if not raw_phone:
            return None
        # Remove non-digits
        digits = re.sub(r'[^0-9]', '', str(raw_phone))
        if not digits:
            return None

        # If 10 digits (Standard Indian mobile), prepend country code '91'
        if len(digits) == 10:
            return f"{default_country_code}{digits}"

        # If 11 digits starting with 0, strip leading 0 and prepend country code
        if len(digits) == 11 and digits.startswith('0'):
            return f"{default_country_code}{digits[1:]}"

        # If already includes country code (e.g. 919876543210)
        return digits

    def upload_media(self, file_bytes, filename='Prescription.pdf', mime_type='application/pdf'):
        """
        Uploads an in-memory document to Meta's WhatsApp Media API endpoint.
        Returns: (media_id, error_message)
        """
        if not self.phone_number_id or not self.access_token:
            return None, "Meta WhatsApp credentials (Phone Number ID or Access Token) are not configured."

        upload_url = f"{self.base_url}/{self.phone_number_id}/media"
        headers = {
            'Authorization': f'Bearer {self.access_token}',
        }
        files = {
            'file': (filename, file_bytes, mime_type),
        }
        data = {
            'type': mime_type,
            'messaging_product': 'whatsapp',
        }

        try:
            response = requests.post(upload_url, headers=headers, files=files, data=data, timeout=30)
            res_data = response.json()

            if response.status_code == 200 and 'id' in res_data:
                return res_data['id'], None
            
            error_obj = res_data.get('error', {})
            error_msg = error_obj.get('message') or f"Meta media upload failed with status {response.status_code}"
            logger.error(f"WhatsApp media upload error: {res_data}")
            return None, error_msg
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error during WhatsApp media upload: {e}")
            return None, f"Network error communicating with Meta API: {str(e)}"

    def open_template_session(self, clean_phone):
        """
        Sends a standard Meta-approved template (e.g. 'hello_world') to initiate
        the active messaging window when required by WhatsApp Cloud API.
        """
        messages_url = f"{self.base_url}/{self.phone_number_id}/messages"
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
        }
        template_payload = {
            "messaging_product": "whatsapp",
            "to": clean_phone,
            "type": "template",
            "template": {
                "name": "hello_world",
                "language": {"code": "en_US"}
            }
        }
        try:
            r = requests.post(messages_url, headers=headers, json=template_payload, timeout=20)
            return r.status_code == 200
        except Exception as e:
            logger.warning(f"Failed to send template session opener: {e}")
            return False

    def send_document(self, recipient_phone, media_id, filename='Prescription.pdf', caption=''):
        """
        Sends an uploaded media document to the recipient's WhatsApp number.
        Returns: (success: bool, response_dict: dict)
        """
        if not self.phone_number_id or not self.access_token:
            return False, {"error": "Meta WhatsApp credentials not configured."}

        clean_phone = self.normalize_phone_number(recipient_phone)
        if not clean_phone or len(clean_phone) < 10:
            return False, {"error": f"Invalid recipient phone number: '{recipient_phone}'."}

        messages_url = f"{self.base_url}/{self.phone_number_id}/messages"
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "document",
            "document": {
                "id": media_id,
                "caption": caption,
                "filename": filename,
            }
        }

        try:
            response = requests.post(messages_url, headers=headers, json=payload, timeout=30)
            res_data = response.json()

            if response.status_code == 200 and 'messages' in res_data and len(res_data['messages']) > 0:
                msg_id = res_data['messages'][0].get('id')
                return True, {
                    "success": True,
                    "message_id": msg_id,
                    "recipient": clean_phone,
                    "details": "Prescription PDF successfully sent via Meta WhatsApp Cloud API!"
                }

            error_obj = res_data.get('error', {})
            error_code = error_obj.get('code')

            # Auto-retry with session opener if access is denied due to 24-hour window / template requirement
            if error_code in (131005, 131047):
                logger.info(f"Received error {error_code}, opening conversation window with template and retrying document send...")
                if self.open_template_session(clean_phone):
                    retry_resp = requests.post(messages_url, headers=headers, json=payload, timeout=30)
                    retry_data = retry_resp.json()
                    if retry_resp.status_code == 200 and 'messages' in retry_data and len(retry_data['messages']) > 0:
                        return True, {
                            "success": True,
                            "message_id": retry_data['messages'][0].get('id'),
                            "recipient": clean_phone,
                            "details": "Prescription PDF successfully sent via Meta WhatsApp Cloud API!"
                        }
                    res_data = retry_data
                    error_obj = res_data.get('error', {})
                    error_code = error_obj.get('code')
            error_msg = error_obj.get('message', 'Failed to deliver message via WhatsApp.')
            error_subcode = error_obj.get('error_subcode')

            # Special human-friendly handling for Meta Test Mode Sandbox restrictions
            if error_code == 131030 or 'not in allowed list' in error_msg.lower():
                user_friendly = (
                    f"Recipient number (+{clean_phone}) is not verified in your Meta Sandbox 'To' list. "
                    "In test mode, add this number in Meta Developer Portal (Step 1. Try it out -> Recipient -> Manage phone number list)."
                )
            elif error_code == 190 or 'access token' in error_msg.lower():
                user_friendly = "Meta Access Token has expired or is invalid. Please generate a fresh token in Meta Developer Portal."
            else:
                user_friendly = f"Meta WhatsApp API Error ({error_code}): {error_msg}"

            logger.error(f"WhatsApp send document error: {res_data}")
            return False, {
                "error": user_friendly,
                "meta_code": error_code,
                "meta_subcode": error_subcode,
                "raw": error_obj
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error sending WhatsApp document: {e}")
            return False, {"error": f"Network error connecting to Meta WhatsApp API: {str(e)}"}

    def send_prescription_pdf(self, recipient_phone, pdf_bytes, patient_name, rx_id='RX-2026'):
        """
        High-level wrapper: uploads PDF buffer and dispatches document message.
        First attempts to send via the official Document Template 'prescription_delivery'
        (which delivers directly without requiring prior session messages),
        falling back to standard document dispatch.
        """
        filename = f"Prescription_{rx_id}.pdf".replace(' ', '_')
        clean_phone = self.normalize_phone_number(recipient_phone)
        if not clean_phone or len(clean_phone) < 10:
            return False, {"error": f"Invalid recipient phone number: '{recipient_phone}'."}

        # 1. Upload Media
        media_id, upload_err = self.upload_media(pdf_bytes, filename=filename)
        if not media_id:
            return False, {"error": f"Failed to upload prescription PDF to WhatsApp: {upload_err}"}

        # 2. Primary attempt: Send via the official Document Template 'prescription_delivery'
        # Delivers directly as a single message with PDF attached in the header to ANY patient!
        messages_url = f"{self.base_url}/{self.phone_number_id}/messages"
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
        }
        template_payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "template",
            "template": {
                "name": "prescription_delivery",
                "language": {"code": "en"},
                "components": [
                    {
                        "type": "header",
                        "parameters": [
                            {
                                "type": "document",
                                "document": {
                                    "id": media_id,
                                    "filename": filename
                                }
                            }
                        ]
                    },
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": patient_name},
                            {"type": "text", "text": rx_id}
                        ]
                    }
                ]
            }
        }

        try:
            resp = requests.post(messages_url, headers=headers, json=template_payload, timeout=30)
            res_data = resp.json()
            if resp.status_code == 200 and 'messages' in res_data and len(res_data['messages']) > 0:
                logger.info(f"Prescription template sent successfully: {res_data}")
                return True, {
                    "success": True,
                    "message_id": res_data['messages'][0].get('id'),
                    "recipient": clean_phone,
                    "details": "Prescription PDF successfully delivered via official WhatsApp Document Template!"
                }
            logger.info(f"Template send response: {res_data}. Falling back to standard document dispatch...")
        except Exception as e:
            logger.warning(f"Template dispatch exception: {e}")

        # 3. Fallback: Standard document message (with auto session opener if needed)
        caption = (
            f"Dear {patient_name},\n"
            f"Your prescription ({rx_id}) from Dr. Kumar Tripathi Ampeh Homeopathy Clinic is attached.\n"
            f"Wishing you vibrant health and speedy recovery!"
        )
        return self.send_document(
            recipient_phone=clean_phone,
            media_id=media_id,
            filename=filename,
            caption=caption
        )

whatsapp_service = WhatsAppService()

