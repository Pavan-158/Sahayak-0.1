"""
OCR Service - Document Text Extraction
Uses pdfplumber for PDFs and supports OCR for scanned documents.
"""

import os
from typing import Optional


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF file using pdfplumber.
    Falls back to OCR if text extraction yields little content.
    
    Args:
        file_path: Path to the PDF file
    
    Returns:
        Extracted text
    """
    if not os.path.exists(file_path):
        return "[Error: File not found]"
    
    try:
        import pdfplumber
        
        text_parts = []
        
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                
                if page_text and page_text.strip():
                    text_parts.append(f"--- Page {page_num + 1} ---\n{page_text}")
                else:
                    # Page might be scanned - try OCR
                    page_image = page.to_image(resolution=200)
                    # Save temporary image for OCR
                    temp_img_path = f"uploads/temp_page_{page_num}.png"
                    page_image.save(temp_img_path)
                    
                    ocr_text = extract_text_from_image(temp_img_path)
                    if ocr_text:
                        text_parts.append(f"--- Page {page_num + 1} (OCR) ---\n{ocr_text}")
                    
                    # Clean up temp file
                    if os.path.exists(temp_img_path):
                        os.remove(temp_img_path)
        
        full_text = "\n\n".join(text_parts)
        
        if not full_text.strip():
            return "[No text could be extracted from this PDF. It may be a scanned document.]"
        
        return full_text
        
    except ImportError:
        return "[Error: pdfplumber not installed. Run: pip install pdfplumber]"
    except Exception as e:
        return f"[Error extracting PDF: {str(e)}]"


def extract_text_from_image(image_path: str) -> str:
    """
    Extract text from an image using OCR.
    Uses pytesseract or EasyOCR as fallback.
    
    Args:
        image_path: Path to the image file
    
    Returns:
        Extracted text
    """
    if not os.path.exists(image_path):
        return "[Error: Image file not found]"
    
    # Try EasyOCR first (better for Indian languages)
    try:
        import easyocr
        
        reader = easyocr.Reader(['en', 'hi'], gpu=False)
        results = reader.readtext(image_path)
        text = " ".join([result[1] for result in results])
        return text
    except ImportError:
        pass
    except Exception as e:
        print(f"EasyOCR error: {e}")
    
    # Fallback to pytesseract
    try:
        import pytesseract
        from PIL import Image
        
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, lang='eng+hin')
        return text
    except ImportError:
        pass
    except Exception as e:
        print(f"Pytesseract error: {e}")
    
    # Fallback: Try Hugging Face Docling
    try:
        from docling.document_converter import DocumentConverter
        
        converter = DocumentConverter()
        result = converter.convert(image_path)
        return result.document.export_to_markdown()
    except ImportError:
        pass
    except Exception as e:
        print(f"Docling error: {e}")
    
    return "[OCR not available. Install easyocr or pytesseract for image text extraction.]"


def extract_text_from_file(file_path: str) -> str:
    """
    Extract text from any supported file type.
    
    Args:
        file_path: Path to the file
    
    Returns:
        Extracted text
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff"]:
        return extract_text_from_image(file_path)
    elif ext == ".txt":
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        return f"[Unsupported file type: {ext}]"
