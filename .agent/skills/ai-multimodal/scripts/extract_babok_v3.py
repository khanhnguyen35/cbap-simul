"""
extract_babok_v3.py
-------------------
Extract BABOK v3 task data (inputs, guideline_tools, outputs, elements)
by reading specific page ranges from the PDF.

Based on TOC:
  Chapter 3 (BAPM):    pages 24–55  → PDF pages 33–64  (offset +9)
  Chapter 4 (EC):      pages 56–77  → PDF pages 65–86
  Chapter 5 (RLCM):   pages 79–100 → PDF pages 88–109
  Chapter 6 (SA):     pages 103–133 → PDF pages 112–142
  Chapter 7 (RADD):   pages 136–165 → PDF pages 145–174
  Chapter 8 (SE):     pages 166–185 → PDF pages 175–194

Usage:
  python3 extract_babok_v3.py
"""

import json
import os
import sys
from pypdf import PdfReader

PDF_PATH = "/Users/khanhnguyen/Documents/CBAP simul/docs/babok/BABOK_Guide_v3_Member 2.pdf"
OUTPUT_PATH = "/Users/khanhnguyen/Documents/CBAP simul/cbap-app/public/babok/babok-tasks.json"

# PDF page offset: TOC page numbers use 1-based book pages, PDF pages are 0-indexed
# Book page 24 = PDF index 33 (9-page offset for front matter)
PAGE_OFFSET = 9

def get_pages(start_book_page, end_book_page):
    """Extract text from a range of book page numbers."""
    reader = PdfReader(PDF_PATH)
    texts = []
    for bp in range(start_book_page, end_book_page + 1):
        pdf_idx = bp + PAGE_OFFSET - 1  # Convert to 0-indexed PDF page
        if 0 <= pdf_idx < len(reader.pages):
            page = reader.pages[pdf_idx]
            text = page.extract_text() or ""
            texts.append(f"--- Page {bp} ---\n{text}")
    return "\n\n".join(texts)

def extract_chapter_text(start_page, end_page):
    return get_pages(start_page, end_page)

# Read all chapter texts
print("📖 Reading BABOK v3 PDF chapters...")
print("  Chapter 3 (BAPM)...")
ch3 = extract_chapter_text(24, 55)
print("  Chapter 4 (EC)...")
ch4 = extract_chapter_text(56, 77)
print("  Chapter 5 (RLCM)...")
ch5 = extract_chapter_text(79, 100)
print("  Chapter 6 (SA)...")
ch6 = extract_chapter_text(103, 133)
print("  Chapter 7 (RADD)...")
ch7 = extract_chapter_text(136, 165)
print("  Chapter 8 (SE)...")
ch8 = extract_chapter_text(166, 185)

# Save to temp files for inspection
SCRATCH = "/Users/khanhnguyen/Documents/CBAP simul/.agent/skills/ai-multimodal/scripts"
for name, text in [("ch3",ch3),("ch4",ch4),("ch5",ch5),("ch6",ch6),("ch7",ch7),("ch8",ch8)]:
    with open(f"{SCRATCH}/babok_{name}.txt", "w") as f:
        f.write(text)
    print(f"  Saved {SCRATCH}/babok_{name}.txt ({len(text):,} chars)")

print("\n✅ Raw text extraction complete. Check babok_ch*.txt files.")
