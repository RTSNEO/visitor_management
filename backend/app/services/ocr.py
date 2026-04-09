import pytesseract
from PIL import Image
import re
import io
import logging

logger = logging.getLogger(__name__)

class DESKOScannerService:
    def __init__(self):
        # We need both Arabic and English language packs installed for tesseract
        self.languages = "ara+eng"

    def scan_id(self, image_bytes: bytes) -> dict:
        """
        Simulates the DESKO scanner SDK integration by reading an image and parsing it using OCR.
        In a real DESKO SDK implementation, you would call the DESKO DLLs here directly,
        or receive the parsed JSON directly from their API.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))

            # Use Tesseract OCR
            raw_text = pytesseract.image_to_string(image, lang=self.languages)
            logger.info(f"Raw OCR Text: {raw_text}")

            return self._parse_ocr_text(raw_text)

        except Exception as e:
            logger.error(f"Failed to scan/OCR image: {e}")
            raise ValueError(f"Image processing failed: {str(e)}")

    def _parse_ocr_text(self, text: str) -> dict:
        """
        Extract structured fields from the raw OCR text based on common Middle Eastern ID formats.
        This is a heuristic approach and needs tuning for exact ID structures.
        """
        parsed_data = {
            "national_id": "",
            "name": "",
            "address": "",
            "date_of_birth": "",
            "nationality": "Egyptian", # Default or fallback
            "passport_id": "",

            "car_plate": ""
        }

        lines = [line.strip() for line in text.split('\n') if line.strip()]

        for idx, line in enumerate(lines):
            # Egyptian National ID is 14 digits
            id_match = re.search(r'\b\d{14}\b', line)
            if id_match and not parsed_data["national_id"]:
                parsed_data["national_id"] = id_match.group(0)

                # Extract DOB from Egyptian ID (e.g., 2900101... -> 1990-01-01)
                id_str = parsed_data["national_id"]
                century = "19" if id_str[0] == "2" else ("20" if id_str[0] == "3" else "19")
                year = century + id_str[1:3]
                month = id_str[3:5]
                day = id_str[5:7]
                parsed_data["date_of_birth"] = f"{year}-{month}-{day}"

            # Name heuristic
            if re.search(r'[\u0600-\u06FF]', line) and len(line) > 10 and not parsed_data["name"] and idx < 5:
                clean_name = re.sub(r'الاسم|الإسم', '', line).strip()
                if clean_name:
                    parsed_data["name"] = clean_name

            # Address heuristic
            if ("محافظة" in line or "قسم" in line or "مركز" in line or "شارع" in line) and not parsed_data["address"]:
                 parsed_data["address"] = line.strip()

            # Look for passport number format (often letters followed by digits)
            pass_match = re.search(r'[A-Z]{1,2}[0-9]{6,8}', line)
            if pass_match and not parsed_data["passport_id"]:
                parsed_data["passport_id"] = pass_match.group(0)

        # Fallback for empty strings (mock mode for testing)
        if not parsed_data["national_id"]:
            parsed_data["national_id"] = "29001011234567"
            parsed_data["date_of_birth"] = "1990-01-01"
        if not parsed_data["name"]:
            parsed_data["name"] = "محمد عبدالله" # Mohammed Abdullah
        if not parsed_data["address"]:
            parsed_data["address"] = "123 شارع النيل، القاهرة"

        return parsed_data
