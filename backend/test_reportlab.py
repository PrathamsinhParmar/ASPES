import sys
import traceback
from reportlab.platypus import Paragraph, SimpleDocTemplate
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
import io

try:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    
    story = []
    # Test paragraph 1: check em dash
    story.append(Paragraph("ASPES — AI Smart Academic Project", styles["Normal"]))
    
    # Test paragraph 2: check unicode symbols
    story.append(Paragraph("⚠ AI-Generated Code Detected", styles["Normal"]))
    story.append(Paragraph("✓ No AI Code Detected", styles["Normal"]))
    
    doc.build(story)
    print("SUCCESS")
except Exception as e:
    print(f"FAILED: {e}")
    traceback.print_exc()
