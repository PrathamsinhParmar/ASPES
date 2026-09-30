#!/usr/bin/env bash
# Render Build Script for ASPES Backend
set -o errexit

echo "📦 Upgrading pip..."
pip install --upgrade pip

echo "📦 Installing Python requirements..."
pip install -r requirements.txt

echo "🧠 Downloading SpaCy NLP model..."
python -m spacy download en_core_web_sm || echo "SpaCy model download skipped/failed, app will use fallback."

echo "✅ ASPES backend build completed successfully!"
