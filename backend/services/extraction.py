import os
import pdfplumber
import pytesseract
from PIL import Image
import docx

# Optionally set pytesseract path if needed on Windows
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text(file_path):
    """
    Extracts text from a given file (.pdf, .txt, .docx).
    Uses OCR if a PDF page has no extractable text.
    """
    ext = file_path.rsplit('.', 1)[1].lower()
    
    if ext == 'txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
            
    elif ext == 'docx':
        doc = docx.Document(file_path)
        full_text = [para.text for para in doc.paragraphs]
        return '\n'.join(full_text)
        
    elif ext == 'pdf':
        text_content = []
        with pdfplumber.open(file_path) as pdf:
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                
                # If no text found, try OCR
                if not page_text or not page_text.strip():
                    img = page.to_image(resolution=300).original
                    # Convert PIL Image to RGB before passing to pytesseract
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    ocr_text = pytesseract.image_to_string(img)
                    text_content.append(ocr_text)
                else:
                    text_content.append(page_text)
                    
        return '\n'.join(text_content)
        
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
