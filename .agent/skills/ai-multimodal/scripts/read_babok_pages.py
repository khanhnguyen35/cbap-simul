"""
read_babok_pages.py — Extract text from BABOK v3 PDF pages
"""
import sys
from pypdf import PdfReader

pdf_path = "/Users/khanhnguyen/Documents/CBAP simul/docs/babok/BABOK_Guide_v3_Member 2.pdf"
reader = PdfReader(pdf_path)

print(f"Total pages: {len(reader.pages)}")

start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
end = int(sys.argv[2]) if len(sys.argv) > 2 else start + 10

for i in range(start, min(end, len(reader.pages))):
    page = reader.pages[i]
    text = page.extract_text()
    print(f"\n{'='*60}")
    print(f"PAGE {i+1}")
    print('='*60)
    print(text[:3000] if text else "(no text)")
