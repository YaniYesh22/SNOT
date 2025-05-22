#!/usr/bin/env python3
"""
YouTube Video Downloader API
Downloads YouTube videos as WAV files and uploads to S3
"""

import os
import tempfile
import uuid
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import logging

# FastAPI and related imports
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl, validator

# YouTube and audio processing
import yt_dlp
from pydub import AudioSegment

# AWS S3
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="YouTube Downloader API",
    description="Download YouTube videos as WAV files and upload to S3",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
class Config:
    # AWS Configuration
    AWS_REGION = os.getenv("AWS_REGION", "eu-central-1")
    S3_BUCKET = os.getenv("S3_BUCKET", "your-notebook-bucket")
    
    # Download settings
    MAX_DURATION_MINUTES = int(os.getenv("MAX_DURATION_MINUTES", "60"))  # 1 hour max
    MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "500"))  # 500MB max
    TEMP_DIR = os.getenv("TEMP_DIR", "/tmp/youtube_downloads")
    
    # Audio settings
    AUDIO_BITRATE = "128k"
    AUDIO_SAMPLE_RATE = 44100

config = Config()

# Initialize AWS S3 client
try:
    s3_client = boto3.client('s3', region_name=config.AWS_REGION)
    logger.info(f"✓ AWS S3 client initialized for region: {config.AWS_REGION}")
except NoCredentialsError:
    logger.error("❌ AWS credentials not found")
    s3_client = None

# Pydantic models
class YouTubeDownloadRequest(BaseModel):
    url: str
    notebook_id: str
    user_email: str
    custom_filename: Optional[str] = None
    
    @validator('url')
    def validate_youtube_url(cls, v):
        """Validate that the URL is a valid YouTube URL"""
        if not any(domain in v.lower() for domain in ['youtube.com', 'youtu.be']):
            raise ValueError('URL must be a valid YouTube URL')
        return v
    
    @validator('user_email')
    def validate_email(cls, v):
        """Basic email validation"""
        if '@' not in v or '.' not in v:
            raise ValueError('Invalid email format')
        return v

class DownloadResponse(BaseModel):
    success: bool
    message: str
    download_id: str
    s3_key: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[float] = None
    title: Optional[str] = None

class DownloadStatus(BaseModel):
    download_id: str
    status: str  # "downloading", "processing", "uploading", "completed", "failed"
    progress: int  # 0-100
    message: str
    s3_key: Optional[str] = None
    error: Optional[str] = None

# In-memory storage for download status (use Redis in production)
download_status_store: Dict[str, DownloadStatus] = {}

def create_temp_directory():
    """Create temporary directory for downloads"""
    temp_dir = Path(config.TEMP_DIR)
    temp_dir.mkdir(parents=True, exist_ok=True)
    return temp_dir

def get_video_info(url: str) -> Dict[str, Any]:
    """Get video information without downloading"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            return {
                'title': info.get('title', 'Unknown Title'),
                'duration': info.get('duration', 0),
                'uploader': info.get('uploader', 'Unknown'),
                'view_count': info.get('view_count', 0),
                'upload_date': info.get('upload_date', ''),
            }
        except Exception as e:
            logger.error(f"Error extracting video info: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Could not extract video info: {str(e)}")

def download_youtube_audio(url: str, output_path: str, download_id: str) -> Dict[str, Any]:
    """Download YouTube video as audio"""
    
    def progress_hook(d):
        if d['status'] == 'downloading':
            try:
                progress = int(d.get('_percent_str', '0%').replace('%', ''))
                download_status_store[download_id].progress = min(progress, 80)  # Reserve 20% for processing
                logger.info(f"Download progress: {progress}%")
            except:
                pass
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'extractaudio': True,
        'audioformat': 'wav',
        'outtmpl': str(output_path / '%(title)s.%(ext)s'),
        'progress_hooks': [progress_hook],
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': config.AUDIO_BITRATE,
        }],
        'postprocessor_args': [
            '-ar', str(config.AUDIO_SAMPLE_RATE),  # Sample rate
            '-ac', '2',  # Stereo
        ],
        'quiet': False,
        'no_warnings': False,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            # Update status
            download_status_store[download_id].status = "downloading"
            download_status_store[download_id].message = "Downloading video from YouTube..."
            
            info = ydl.extract_info(url, download=True)
            
            # Find the downloaded file
            title = info.get('title', 'audio')
            possible_files = list(output_path.glob(f"*{title}*.wav")) or list(output_path.glob("*.wav"))
            
            if not possible_files:
                raise Exception("Downloaded file not found")
            
            downloaded_file = possible_files[0]
            
            return {
                'file_path': downloaded_file,
                'title': info.get('title', 'Unknown Title'),
                'duration': info.get('duration', 0),
                'file_size': downloaded_file.stat().st_size if downloaded_file.exists() else 0
            }
            
        except Exception as e:
            logger.error(f"Error downloading video: {str(e)}")
            raise Exception(f"Download failed: {str(e)}")

def process_audio_file(file_path: Path, download_id: str) -> Path:
    """Process the audio file (normalize, compress if needed)"""
    try:
        download_status_store[download_id].status = "processing"
        download_status_store[download_id].message = "Processing audio file..."
        download_status_store[download_id].progress = 85
        
        # Load audio file
        audio = AudioSegment.from_wav(str(file_path))
        
        # Normalize audio (optional)
        # audio = audio.normalize()
        
        # If file is too large, reduce quality
        file_size_mb = file_path.stat().st_size / (1024 * 1024)
        if file_size_mb > config.MAX_FILE_SIZE_MB:
            logger.info(f"File size {file_size_mb:.1f}MB exceeds limit, compressing...")
            # Reduce sample rate and bit depth
            audio = audio.set_frame_rate(22050)  # Reduce from 44100 to 22050
            audio = audio.set_sample_width(2)   # 16-bit
        
        # Save processed file
        processed_path = file_path.with_suffix('.processed.wav')
        audio.export(str(processed_path), format="wav")
        
        # Remove original file
        file_path.unlink()
        
        download_status_store[download_id].progress = 90
        return processed_path
        
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        raise Exception(f"Audio processing failed: {str(e)}")

def upload_to_s3(file_path: Path, s3_key: str, download_id: str) -> bool:
    """Upload file to S3"""
    if not s3_client:
        raise Exception("S3 client not available - check AWS credentials")
    
    try:
        download_status_store[download_id].status = "uploading"
        download_status_store[download_id].message = "Uploading to S3..."
        download_status_store[download_id].progress = 95
        
        # Upload with metadata
        s3_client.upload_file(
            str(file_path),
            config.S3_BUCKET,
            s3_key,
            ExtraArgs={
                'ContentType': 'audio/wav',
                'Metadata': {
                    'source': 'youtube-downloader',
                    'upload-date': datetime.utcnow().isoformat(),
                    'original-filename': file_path.name
                }
            }
        )
        
        logger.info(f"✓ File uploaded to S3: {s3_key}")
        download_status_store[download_id].progress = 100
        return True
        
    except ClientError as e:
        logger.error(f"S3 upload error: {str(e)}")
        raise Exception(f"S3 upload failed: {str(e)}")

async def process_download(request: YouTubeDownloadRequest, download_id: str):
    """Background task to process the download"""
    temp_dir = None
    
    try:
        # Create temporary directory
        temp_dir = create_temp_directory() / download_id
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize status
        download_status_store[download_id] = DownloadStatus(
            download_id=download_id,
            status="starting",
            progress=0,
            message="Initializing download..."
        )
        
        # Get video info first
        video_info = get_video_info(request.url)
        
        # Check duration limit
        if video_info['duration'] > config.MAX_DURATION_MINUTES * 60:
            raise Exception(f"Video duration ({video_info['duration']/60:.1f} min) exceeds limit ({config.MAX_DURATION_MINUTES} min)")
        
        # Download audio
        download_result = download_youtube_audio(request.url, temp_dir, download_id)
        
        # Process audio file
        processed_file = process_audio_file(download_result['file_path'], download_id)
        
        # Generate S3 key
        safe_title = "".join(c for c in video_info['title'] if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = request.custom_filename or f"{safe_title}.wav"
        s3_key = f"notebooks/{request.user_email}/{request.notebook_id}/audio/{uuid.uuid4()}_{filename}"
        
        # Upload to S3
        upload_to_s3(processed_file, s3_key, download_id)
        
        # Update final status
        download_status_store[download_id].status = "completed"
        download_status_store[download_id].message = "Download completed successfully"
        download_status_store[download_id].s3_key = s3_key
        download_status_store[download_id].progress = 100
        
        logger.info(f"✅ Download completed: {download_id}")
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ Download failed: {error_msg}")
        
        download_status_store[download_id].status = "failed"
        download_status_store[download_id].message = f"Download failed: {error_msg}"
        download_status_store[download_id].error = error_msg
        
    finally:
        # Cleanup temporary files
        if temp_dir and temp_dir.exists():
            try:
                import shutil
                shutil.rmtree(temp_dir)
                logger.info(f"✓ Cleaned up temp directory: {temp_dir}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp directory: {str(e)}")

# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "YouTube Downloader API",
        "version": "1.0.0",
        "status": "running",
        "s3_available": s3_client is not None
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "aws_s3": "available" if s3_client else "unavailable",
        "temp_dir": str(config.TEMP_DIR),
        "max_duration": f"{config.MAX_DURATION_MINUTES} minutes",
        "max_file_size": f"{config.MAX_FILE_SIZE_MB} MB"
    }

@app.post("/download", response_model=DownloadResponse)
async def start_download(request: YouTubeDownloadRequest, background_tasks: BackgroundTasks):
    """Start YouTube video download"""
    try:
        # Generate unique download ID
        download_id = str(uuid.uuid4())
        
        # Get video info for validation
        video_info = get_video_info(request.url)
        
        # Validate duration
        if video_info['duration'] > config.MAX_DURATION_MINUTES * 60:
            raise HTTPException(
                status_code=400,
                detail=f"Video duration ({video_info['duration']/60:.1f} min) exceeds limit ({config.MAX_DURATION_MINUTES} min)"
            )
        
        # Start background download task
        background_tasks.add_task(process_download, request, download_id)
        
        return DownloadResponse(
            success=True,
            message="Download started successfully",
            download_id=download_id,
            title=video_info['title'],
            duration=video_info['duration']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting download: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start download: {str(e)}")

@app.get("/status/{download_id}", response_model=DownloadStatus)
async def get_download_status(download_id: str):
    """Get download status"""
    if download_id not in download_status_store:
        raise HTTPException(status_code=404, detail="Download ID not found")
    
    return download_status_store[download_id]

@app.get("/video-info")
async def get_video_info_endpoint(url: str):
    """Get video information without downloading"""
    try:
        info = get_video_info(url)
        return {
            "success": True,
            "info": info
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not get video info: {str(e)}")

@app.delete("/downloads/{download_id}")
async def cancel_download(download_id: str):
    """Cancel/remove download status"""
    if download_id in download_status_store:
        del download_status_store[download_id]
        return {"message": "Download status removed"}
    else:
        raise HTTPException(status_code=404, detail="Download ID not found")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status_code": 500}
    )

if __name__ == "__main__":
    import uvicorn
    
    # Ensure temp directory exists
    create_temp_directory()
    
    print("🚀 Starting YouTube Downloader API...")
    print(f"📁 Temp directory: {config.TEMP_DIR}")
    print(f"☁️ S3 Bucket: {config.S3_BUCKET}")
    print(f"⏱️ Max duration: {config.MAX_DURATION_MINUTES} minutes")
    print(f"📦 Max file size: {config.MAX_FILE_SIZE_MB} MB")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )