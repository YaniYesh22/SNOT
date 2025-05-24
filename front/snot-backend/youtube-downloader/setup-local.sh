#!/bin/bash
# setup_local.sh - Setup script for local Y2mate downloader

echo "🎬 Setting up Y2mate YouTube Downloader locally"
echo "=============================================="

# Check Python version
echo "🐍 Checking Python version..."
python3 --version || {
    echo "❌ Python 3 is required but not installed"
    exit 1
}

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate || {
    echo "❌ Failed to activate virtual environment"
    exit 1
}

# Install requirements
echo "📥 Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

# Check Chrome installation
echo "🌐 Checking Chrome browser..."
if command -v google-chrome &> /dev/null || command -v chromium-browser &> /dev/null; then
    echo "✅ Chrome/Chromium found"
else
    echo "⚠️  Chrome/Chromium not found. Please install Google Chrome or Chromium browser."
    echo "   Ubuntu/Debian: sudo apt install chromium-browser"
    echo "   macOS: brew install --cask google-chrome"
    echo "   Windows: Download from https://www.google.com/chrome/"
fi

# Create downloads directory
echo "📁 Creating downloads directory..."
mkdir -p downloads

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Usage examples:"
echo "   # Download video (720p):"
echo "   python3 y2mate_downloader.py 'https://www.youtube.com/watch?v=VIDEO_ID'"
echo ""
echo "   # Download audio only:"
echo "   python3 y2mate_downloader.py 'https://www.youtube.com/watch?v=VIDEO_ID' --audio-only"
echo ""
echo "   # Download with specific quality:"
echo "   python3 y2mate_downloader.py 'https://www.youtube.com/watch?v=VIDEO_ID' --quality 480p"
echo ""
echo "   # Run in headless mode (no browser window):"
echo "   python3 y2mate_downloader.py 'https://www.youtube.com/watch?v=VIDEO_ID' --headless"
echo ""
echo "🔧 Remember to activate the virtual environment before running:"
echo "   source venv/bin/activate"