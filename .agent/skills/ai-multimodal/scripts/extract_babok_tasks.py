"""
extract_babok_tasks.py
----------------------
Extract BABOK v3 tasks (inputs, outputs, guideline_tools, elements) from PDF
and save as structured JSON.

Usage:
  python3 extract_babok_tasks.py --pdf <path_to_babok.pdf> --output <output.json>

Requirements:
  pip install google-genai pypdf
"""

import argparse
import json
import os
import sys
import time

# ── CLI ──────────────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description="Extract BABOK v3 task data from PDF using Gemini")
parser.add_argument("--pdf", required=True, help="Path to BABOK v3 PDF")
parser.add_argument("--output", required=True, help="Output JSON file path")
parser.add_argument("--api-key", default=None, help="Gemini API key (or set GEMINI_API_KEY env var)")
parser.add_argument("--model", default="gemini-2.5-pro", help="Gemini model to use")
args = parser.parse_args()

api_key = args.api_key or os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("❌ No GEMINI_API_KEY found. Set env var or use --api-key flag.")
    sys.exit(1)

if not os.path.exists(args.pdf):
    print(f"❌ PDF not found: {args.pdf}")
    sys.exit(1)

# ── Gemini setup ─────────────────────────────────────────────────────────────

try:
    from google import genai
    from google.genai import types as gentypes
except ImportError:
    print("❌ google-genai not installed. Run: pip install google-genai")
    sys.exit(1)

client = genai.Client(api_key=api_key)

# ── Upload PDF ────────────────────────────────────────────────────────────────

print(f"📤 Uploading PDF: {args.pdf} ...")
pdf_size_mb = os.path.getsize(args.pdf) / (1024 * 1024)
print(f"   File size: {pdf_size_mb:.1f} MB")

with open(args.pdf, "rb") as f:
    uploaded_file = client.files.upload(
        file=f,
        config=gentypes.UploadFileConfig(
            display_name="BABOK Guide v3",
            mime_type="application/pdf",
        )
    )

print(f"✅ Uploaded: {uploaded_file.name}")

# Wait for processing
print("⏳ Waiting for file processing...")
while uploaded_file.state.name == "PROCESSING":
    time.sleep(3)
    uploaded_file = client.files.get(name=uploaded_file.name)
    print(f"   State: {uploaded_file.state.name}")

if uploaded_file.state.name != "ACTIVE":
    print(f"❌ File processing failed: {uploaded_file.state.name}")
    sys.exit(1)

print("✅ File ready!")

# ── Extraction prompt ─────────────────────────────────────────────────────────

PROMPT = """
You are a BABOK v3 expert. Extract ALL tasks from this BABOK Guide v3 PDF.

BABOK v3 has exactly 6 Knowledge Areas (KAs):
1. Business Analysis Planning and Monitoring (Chapter 3) — 5 tasks (3.1–3.5)
2. Elicitation and Collaboration (Chapter 4) — 5 tasks (4.1–4.5)
3. Requirements Life Cycle Management (Chapter 5) — 5 tasks (5.1–5.5)
4. Strategy Analysis (Chapter 6) — 4 tasks (6.1–6.4)
5. Requirements Analysis and Design Definition (Chapter 7) — 6 tasks (7.1–7.6)
6. Solution Evaluation (Chapter 8) — 5 tasks (8.1–8.5)

For EACH task, extract:
- `inputs`: ONLY items listed under the "Inputs" section (NOT Guidelines and Tools or Techniques)
- `guideline_tools`: Items listed under the "Guidelines and Tools" section
- `outputs`: Items listed under the "Outputs" section
- `elements`: Items listed under the ".X.4 Elements" subsection (numbered subsections like 3.1.4, 3.2.4, etc.)

CRITICAL RULES:
1. For `inputs`, only include items that are explicitly listed as INPUTS (usually shown as bullet points before the task description body). Do NOT include Guidelines and Tools here.
2. For `elements`, include the NAMES of each element subsection (e.g., "Planning approach", "Formality and level of detail of deliverables", "Business analysis activities") — one per element subsection.
3. Keep names exactly as they appear in the BABOK (preserve capitalization).
4. Do NOT invent or guess — only extract what's explicitly in the PDF.

Return ONLY a valid JSON object (no markdown, no explanation) in this exact structure:

{
  "knowledgeAreas": [
    {
      "id": "ba-planning-monitoring",
      "code": "3",
      "name": "Business Analysis Planning and Monitoring",
      "shortName": "BAPM",
      "tasks": [
        {
          "id": "plan-ba-approach",
          "code": "3.1",
          "name": "Plan Business Analysis Approach",
          "inputs": ["Needs"],
          "guideline_tools": ["Expert judgment", "Organizational process assets"],
          "outputs": ["Business analysis approach"],
          "elements": [
            "Planning approach",
            "Formality and level of detail of deliverables",
            "Business analysis activities",
            "Timing of business analysis work",
            "Complexity and risk",
            "Acceptance"
          ]
        }
      ]
    }
  ]
}

IDs should be kebab-case derived from the task/KA name. Include ALL 30 tasks across all 6 KAs.
"""

# ── Call Gemini ───────────────────────────────────────────────────────────────

print(f"\n🤖 Calling {args.model} to extract BABOK data...")
print("   This may take 1-2 minutes for a large PDF...")

try:
    response = client.models.generate_content(
        model=args.model,
        contents=[
            gentypes.Content(
                role="user",
                parts=[
                    gentypes.Part.from_uri(
                        file_uri=uploaded_file.uri,
                        mime_type="application/pdf",
                    ),
                    gentypes.Part.from_text(text=PROMPT),
                ]
            )
        ],
        config=gentypes.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=8192,
            thinking_config=gentypes.ThinkingConfig(thinking_budget=8000),
        ),
    )
except Exception as e:
    print(f"❌ API call failed: {e}")
    # Clean up
    client.files.delete(name=uploaded_file.name)
    sys.exit(1)

# ── Parse response ────────────────────────────────────────────────────────────

raw = response.text.strip()

# Strip markdown code fences if present
if raw.startswith("```"):
    lines = raw.split("\n")
    raw = "\n".join(lines[1:-1]) if lines[-1] == "```" else "\n".join(lines[1:])
    raw = raw.strip()

try:
    data = json.loads(raw)
except json.JSONDecodeError as e:
    print(f"❌ Failed to parse JSON response: {e}")
    # Save raw for debugging
    debug_path = args.output.replace(".json", "_raw.txt")
    with open(debug_path, "w") as f:
        f.write(raw)
    print(f"   Raw response saved to: {debug_path}")
    client.files.delete(name=uploaded_file.name)
    sys.exit(1)

# ── Validate structure ────────────────────────────────────────────────────────

kas = data.get("knowledgeAreas", [])
total_tasks = sum(len(ka.get("tasks", [])) for ka in kas)
print(f"\n✅ Extracted: {len(kas)} KAs, {total_tasks} tasks")

for ka in kas:
    tasks = ka.get("tasks", [])
    print(f"   KA {ka.get('code')}: {ka.get('shortName')} — {len(tasks)} tasks")
    for task in tasks:
        n_inputs = len(task.get("inputs", []))
        n_outputs = len(task.get("outputs", []))
        n_elements = len(task.get("elements", []))
        print(f"      {task.get('code')} {task.get('name')}: {n_inputs}i / {n_outputs}o / {n_elements}e")

# ── Save output ───────────────────────────────────────────────────────────────

os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
with open(args.output, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n💾 Saved to: {args.output}")

# ── Cleanup ───────────────────────────────────────────────────────────────────

print("🧹 Cleaning up uploaded file...")
client.files.delete(name=uploaded_file.name)
print("✅ Done!")
