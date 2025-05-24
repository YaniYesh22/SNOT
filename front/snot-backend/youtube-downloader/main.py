#!/usr/bin/env python3
"""
FastAPI CNVmp3 YouTube Downloader
Production-ready API for downloading YouTube videos via cnvmp3.com
"""

import os
import time
import requests
import asyncio
import tempfile
import shutil
import threading
from pathlib import Path
from urllib.parse import urlparse
import uuid
import re
from datetime import datetime
from typing import Optional, Dict, Any

# Selenium imports
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# FastAPI imports
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, validator
import uvicorn

# AWS imports (optional)
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

# Configuration
AWS_REGION = os.getenv('AWS_REGION', 'eu-central-1')
S3_BUCKET = os.getenv('S3_BUCKET')
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
TEMP_DIR = os.getenv('TEMP_DIR', '/tmp/cnvmp3_downloads')
MAX_CONCURRENT_DOWNLOADS = int(os.getenv('MAX_CONCURRENT_DOWNLOADS', '3'))
DOWNLOAD_TIMEOUT = int(os.getenv('DOWNLOAD_TIMEOUT', '300'))  # 5 minutes

# Ensure temp directory exists
Path(TEMP_DIR).mkdir(parents=True, exist_ok=True)

# FastAPI app
app = FastAPI(
    title="CNVmp3 YouTube Downloader API",
    description="Download YouTube videos and audio using cnvmp3.com automation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for download status
download_status: Dict[str, Dict[str, Any]] = {}
active_downloads = 0

# Pydantic Models
class DownloadRequest(BaseModel):
    url: HttpUrl
    format: Optional[str] = "mp4"  # mp3 or mp4
    quality: Optional[str] = "720p"  # 720p, 480p, 360p
    
    @validator('url')
    def validate_youtube_url(cls, v):
        parsed = urlparse(str(v))
        if parsed.netloc not in ['www.youtube.com', 'youtube.com', 'youtu.be', 'm.youtube.com']:
            raise ValueError('Invalid YouTube URL')
        return v
    
    @validator('format')
    def validate_format(cls, v):
        if v.lower() not in ['mp3', 'mp4']:
            raise ValueError('Format must be mp3 or mp4')
        return v.lower()

class NotebookDownloadRequest(BaseModel):
    url: HttpUrl
    format: Optional[str] = "mp4"  # mp3 or mp4
    quality: Optional[str] = "720p"  # 720p, 480p, 360p
    notebook_id: str  # Notebook identifier
    user_email: str   # User email for organization
    
    @validator('url')
    def validate_youtube_url(cls, v):
        parsed = urlparse(str(v))
        if parsed.netloc not in ['www.youtube.com', 'youtube.com', 'youtu.be', 'm.youtube.com']:
            raise ValueError('Invalid YouTube URL')
        return v
    
    @validator('format')
    def validate_format(cls, v):
        if v.lower() not in ['mp3', 'mp4']:
            raise ValueError('Format must be mp3 or mp4')
        return v.lower()
    
    @validator('notebook_id')
    def validate_notebook_id(cls, v):
        # Allow alphanumeric, hyphens, underscores for UUID support
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Notebook ID must contain only letters, numbers, hyphens, and underscores')
        return v
    
    @validator('user_email')
    def validate_email(cls, v):
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        return v  # Keep original case and format

class DownloadResponse(BaseModel):
    task_id: str
    status: str
    message: str
    download_url: Optional[str] = None
    file_size_mb: Optional[float] = None
    format: Optional[str] = None
    notebook_id: Optional[str] = None
    user_email: Optional[str] = None

# CNVDownloader Class
class CNVDownloader:
    def __init__(self):
        self.base_url = "https://cnvmp3.com/v24"
        self.s3_client = None
        
        # Initialize S3 if configured
        if all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET]):
            try:
                self.s3_client = boto3.client(
                    's3',
                    region_name=AWS_REGION,
                    aws_access_key_id=AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
                )
                self.s3_client.head_bucket(Bucket=S3_BUCKET)
                print("✅ S3 configured successfully")
            except Exception as e:
                print(f"⚠️ S3 setup failed: {e}")
                self.s3_client = None
    
    def create_driver(self):
        """Create Chrome WebDriver with automatic driver management"""
        chrome_options = Options()
        
        # Headless mode for server
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument('--disable-extensions')
        chrome_options.add_argument('--disable-plugins')
        chrome_options.add_argument('--disable-images')
        chrome_options.add_argument('--remote-debugging-port=9222')
        
        # Additional stability options
        chrome_options.add_argument('--disable-background-timer-throttling')
        chrome_options.add_argument('--disable-backgrounding-occluded-windows')
        chrome_options.add_argument('--disable-renderer-backgrounding')
        chrome_options.add_argument('--disable-features=TranslateUI')
        chrome_options.add_argument('--disable-ipc-flooding-protection')
        
        # User agent
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        # Download preferences
        download_dir = str(Path(TEMP_DIR).absolute())
        prefs = {
            'download.default_directory': download_dir,
            'download.prompt_for_download': False,
            'download.directory_upgrade': True,
            'profile.default_content_settings.popups': 0,
            'profile.default_content_setting_values.notifications': 2
        }
        chrome_options.add_experimental_option('prefs', prefs)
        
        try:
            # Try using system ChromeDriver first
            driver = webdriver.Chrome(options=chrome_options)
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            driver.set_page_load_timeout(30)
            return driver
        except Exception as e:
            print(f"System ChromeDriver failed: {e}")
            
            # Fallback: Use webdriver-manager to auto-download correct version
            try:
                from webdriver_manager.chrome import ChromeDriverManager
                from selenium.webdriver.chrome.service import Service
                
                print("Using webdriver-manager to install correct ChromeDriver...")
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=chrome_options)
                driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
                driver.set_page_load_timeout(30)
                return driver
            except Exception as e2:
                raise Exception(f"Failed to create Chrome driver with both methods. System: {e}, WebDriver-Manager: {e2}")
    
    def close_popups(self, driver):
        """Close popups without excessive logging"""
        try:
            close_selectors = [
                '.close', '.close-btn', '.popup-close', '.modal-close',
                '[aria-label="Close"]', '.btn-close', '.ad-close'
            ]
            
            for selector in close_selectors:
                try:
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        if element.is_displayed():
                            driver.execute_script("arguments[0].click();", element)
                            time.sleep(0.3)
                except:
                    continue
            
            # Press Escape
            try:
                driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
            except:
                pass
        except:
            pass
    
    def wait_for_download_completion(self, filepath, timeout=30):
        """Wait for download to complete"""
        start_time = time.time()
        last_size = 0
        stable_count = 0
        
        while time.time() - start_time < timeout:
            if filepath.exists():
                current_size = filepath.stat().st_size
                
                if current_size == last_size and current_size > 0:
                    stable_count += 1
                    if stable_count >= 3:
                        return True
                else:
                    stable_count = 0
                
                last_size = current_size
            
            time.sleep(2)
        
        return filepath.exists() and filepath.stat().st_size > 1024
    
    def validate_file(self, filepath, format_type):
        """Validate downloaded file"""
        try:
            if not filepath.exists():
                return False
            
            file_size = filepath.stat().st_size
            if file_size < 1024:
                return False
            
            # Check for HTML error pages
            try:
                with open(filepath, 'rb') as f:
                    first_bytes = f.read(512)
                    first_text = first_bytes.decode('utf-8', errors='ignore').lower()
                    
                    if any(word in first_text for word in ['<html', 'error', '404']):
                        return False
            except:
                pass
            
            return True
        except:
            return False
    
    def generate_s3_key(self, task_id: str, extension: str, notebook_id: str = None, user_email: str = None):
        """Generate S3 key based on your existing bucket structure"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if notebook_id and user_email:
            # Match your existing structure: notebooks/{email}/{notebook_id}/media/{file}
            return f"notebooks/{user_email}/{notebook_id}/media/{timestamp}_{task_id}{extension}"
        else:
            # Default location for regular downloads
            return f"cnvmp3_downloads/{timestamp}_{task_id}{extension}"
    
    def clean_local_file(self, filepath: Path, delay: int = 10):
        """Clean up local file after delay (to ensure S3 upload completed)"""
        def cleanup():
            time.sleep(delay)
            try:
                if filepath.exists():
                    filepath.unlink()
                    print(f"🗑️ Cleaned up local file: {filepath}")
            except Exception as e:
                print(f"⚠️ Failed to cleanup {filepath}: {e}")
        
        # Run cleanup in background thread
        cleanup_thread = threading.Thread(target=cleanup)
        cleanup_thread.daemon = True
        cleanup_thread.start()
    
    async def download_video(self, url: str, task_id: str, format_type: str = "mp4", quality: str = "720p", notebook_id: str = None, user_email: str = None):
        """Main download function"""
        global active_downloads
        driver = None
        
        try:
            active_downloads += 1
            download_status[task_id]['status'] = 'starting'
            download_status[task_id]['message'] = 'Initializing browser...'
            
            # Create driver
            driver = self.create_driver()
            
            # Navigate to cnvmp3.com
            download_status[task_id]['message'] = 'Loading converter...'
            driver.get(self.base_url)
            time.sleep(3)
            self.close_popups(driver)
            
            # Find URL input
            download_status[task_id]['message'] = 'Entering video URL...'
            url_input = None
            
            input_selectors = ['input[type="text"]', '#url', 'input[name="url"]']
            for selector in input_selectors:
                try:
                    element = driver.find_element(By.CSS_SELECTOR, selector)
                    if element.is_displayed():
                        url_input = element
                        break
                except:
                    continue
            
            if not url_input:
                raise Exception("Could not find URL input field")
            
            # Enter URL
            url_input.clear()
            url_input.send_keys(url)
            time.sleep(2)
            
            # Select format if MP3
            if format_type == "mp3":
                mp3_selectors = ['input[value="mp3"]', '#mp3', '.format-mp3']
                for selector in mp3_selectors:
                    try:
                        element = driver.find_element(By.CSS_SELECTOR, selector)
                        if element.is_displayed():
                            driver.execute_script("arguments[0].click();", element)
                            break
                    except:
                        continue
            
            # Click convert
            download_status[task_id]['message'] = 'Starting conversion...'
            
            convert_selectors = ['input[type="submit"]', '#convert', '.convert-btn']
            convert_button = None
            
            for selector in convert_selectors:
                try:
                    element = driver.find_element(By.CSS_SELECTOR, selector)
                    if element.is_displayed():
                        convert_button = element
                        break
                except:
                    continue
            
            if not convert_button:
                raise Exception("Could not find convert button")
            
            # Get initial files
            initial_files = set(os.listdir(TEMP_DIR)) if os.path.exists(TEMP_DIR) else set()
            
            # Click convert
            driver.execute_script("arguments[0].click();", convert_button)
            time.sleep(3)
            self.close_popups(driver)
            
            # Wait for conversion and check for direct download
            download_status[task_id]['message'] = 'Converting video...'
            
            max_wait = 60
            start_time = time.time()
            
            while time.time() - start_time < max_wait:
                # Check for success messages
                page_text = driver.page_source.lower()
                if any(msg in page_text for msg in ["download is on the way", "enjoy it"]):
                    download_status[task_id]['message'] = 'Download starting...'
                    time.sleep(5)  # Wait for download to start
                    break
                
                time.sleep(2)
                self.close_popups(driver)
            
            # Check for downloaded files
            download_status[task_id]['message'] = 'Checking download...'
            
            current_files = set(os.listdir(TEMP_DIR)) if os.path.exists(TEMP_DIR) else set()
            new_files = current_files - initial_files
            
            if new_files:
                downloaded_files = [f for f in new_files if not f.startswith('.')]
                
                if downloaded_files:
                    downloaded_file = downloaded_files[0]
                    filepath = Path(TEMP_DIR) / downloaded_file
                    
                    # Wait for completion
                    download_status[task_id]['message'] = 'Finalizing download...'
                    self.wait_for_download_completion(filepath)
                    
                    if self.validate_file(filepath, format_type):
                        file_size_mb = filepath.stat().st_size / (1024 * 1024)
                        
                        # Upload to S3 if configured
                        s3_url = None
                        s3_key = None
                        if self.s3_client:
                            try:
                                download_status[task_id]['message'] = 'Uploading to cloud...'
                                
                                # Generate appropriate S3 key
                                extension = filepath.suffix
                                s3_key = self.generate_s3_key(task_id, extension, notebook_id, user_email)
                                
                                # Set content type
                                content_type = 'video/mp4' if format_type == 'mp4' else 'audio/mpeg'
                                
                                # Add metadata
                                metadata = {
                                    'task_id': task_id,
                                    'format': format_type,
                                    'source': 'cnvmp3',
                                    'uploaded_at': datetime.now().isoformat()
                                }
                                
                                if notebook_id:
                                    metadata['notebook_id'] = notebook_id
                                if user_email:
                                    metadata['user_email'] = user_email
                                
                                self.s3_client.upload_file(
                                    str(filepath),
                                    S3_BUCKET,
                                    s3_key,
                                    ExtraArgs={
                                        'ContentType': content_type,
                                        'Metadata': metadata
                                    }
                                )
                                
                                s3_url = self.s3_client.generate_presigned_url(
                                    'get_object',
                                    Params={'Bucket': S3_BUCKET, 'Key': s3_key},
                                    ExpiresIn=86400  # 24 hours
                                )
                                
                                print(f"✅ File uploaded to S3: s3://{S3_BUCKET}/{s3_key}")
                                
                                # Clean up local file after successful S3 upload
                                self.clean_local_file(filepath, delay=5)
                                
                            except Exception as e:
                                print(f"S3 upload failed: {e}")
                        
                        # Update status
                        download_status[task_id].update({
                            'status': 'completed',
                            'message': 'Download completed successfully!',
                            'download_url': s3_url,
                            'file_size_mb': round(file_size_mb, 2),
                            'format': format_type,
                            'completed_at': datetime.now().isoformat(),
                            'local_file': str(filepath) if not s3_url else None,
                            'notebook_id': notebook_id,
                            'user_email': user_email,
                            's3_key': s3_key if s3_url else None
                        })
                        return
            
            raise Exception("No valid file was downloaded")
            
        except Exception as e:
            download_status[task_id].update({
                'status': 'failed',
                'message': f'Download failed: {str(e)}',
                'failed_at': datetime.now().isoformat()
            })
            
        finally:
            active_downloads -= 1
            if driver:
                try:
                    driver.quit()
                except:
                    pass

# Initialize downloader
downloader = CNVDownloader()

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_downloads": active_downloads,
        "s3_configured": downloader.s3_client is not None
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "CNVmp3 YouTube Downloader API",
        "version": "1.0.0",
        "endpoints": {
            "POST /download": "Start download task",
            "POST /download/notebook": "Start download for specific notebook",
            "GET /status/{task_id}": "Check download status",
            "GET /download/{task_id}": "Download file directly",
            "GET /tasks": "List recent tasks",
            "GET /notebook/{notebook_id}/files": "List files in notebook",
            "GET /user/{user_email}/notebooks": "List user's notebooks",
            "GET /health": "Health check"
        }
    }

@app.post("/download", response_model=DownloadResponse)
async def start_download(request: DownloadRequest, background_tasks: BackgroundTasks):
    """Start a YouTube download task"""
    global active_downloads
    
    # Check concurrent download limit
    if active_downloads >= MAX_CONCURRENT_DOWNLOADS:
        raise HTTPException(
            status_code=429, 
            detail=f"Too many concurrent downloads. Limit: {MAX_CONCURRENT_DOWNLOADS}"
        )
    
    try:
        # Generate task ID
        task_id = str(uuid.uuid4())
        
        # Initialize task
        download_status[task_id] = {
            'status': 'queued',
            'message': 'Download queued',
            'created_at': datetime.now().isoformat(),
            'url': str(request.url),
            'format': request.format,
            'quality': request.quality
        }
        
        # Start background task
        background_tasks.add_task(
            downloader.download_video,
            str(request.url),
            task_id,
            request.format,
            request.quality
        )
        
        return DownloadResponse(
            task_id=task_id,
            status='queued',
            message='Download task started',
            format=request.format
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/download/notebook", response_model=DownloadResponse)
async def start_notebook_download(request: NotebookDownloadRequest, background_tasks: BackgroundTasks):
    """Start a YouTube download task for a specific notebook"""
    global active_downloads
    
    # Check concurrent download limit
    if active_downloads >= MAX_CONCURRENT_DOWNLOADS:
        raise HTTPException(
            status_code=429, 
            detail=f"Too many concurrent downloads. Limit: {MAX_CONCURRENT_DOWNLOADS}"
        )
    
    try:
        # Generate task ID
        task_id = str(uuid.uuid4())
        
        # Initialize task with notebook info
        download_status[task_id] = {
            'status': 'queued',
            'message': 'Download queued for notebook',
            'created_at': datetime.now().isoformat(),
            'url': str(request.url),
            'format': request.format,
            'quality': request.quality,
            'notebook_id': request.notebook_id,
            'user_email': request.user_email
        }
        
        # Start background task with notebook context
        background_tasks.add_task(
            downloader.download_video,
            str(request.url),
            task_id,
            request.format,
            request.quality,
            request.notebook_id,
            request.user_email
        )
        
        return DownloadResponse(
            task_id=task_id,
            status='queued',
            message=f'Download task started for notebook {request.notebook_id}',
            format=request.format,
            notebook_id=request.notebook_id,
            user_email=request.user_email
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/status/{task_id}", response_model=DownloadResponse)
async def get_download_status(task_id: str):
    """Get download task status"""
    if task_id not in download_status:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_data = download_status[task_id]
    
    return DownloadResponse(
        task_id=task_id,
        status=task_data['status'],
        message=task_data['message'],
        download_url=task_data.get('download_url'),
        file_size_mb=task_data.get('file_size_mb'),
        format=task_data.get('format'),
        notebook_id=task_data.get('notebook_id'),
        user_email=task_data.get('user_email')
    )

@app.get("/download/{task_id}")
async def download_file(task_id: str):
    """Download file directly (if not using S3)"""
    if task_id not in download_status:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_data = download_status[task_id]
    
    if task_data['status'] != 'completed':
        raise HTTPException(status_code=400, detail="Download not completed")
    
    local_file = task_data.get('local_file')
    if local_file and os.path.exists(local_file):
        return FileResponse(
            local_file,
            media_type='application/octet-stream',
            filename=os.path.basename(local_file)
        )
    
    download_url = task_data.get('download_url')
    if download_url:
        return {"download_url": download_url}
    
    raise HTTPException(status_code=404, detail="File not available")

@app.get("/tasks")
async def list_tasks(limit: int = Query(10, ge=1, le=100)):
    """List recent download tasks"""
    sorted_tasks = sorted(
        download_status.items(),
        key=lambda x: x[1].get('created_at', ''),
        reverse=True
    )
    
    return {
        "tasks": [
            {
                "task_id": task_id,
                "status": data['status'],
                "message": data['message'],
                "created_at": data.get('created_at'),
                "format": data.get('format'),
                "file_size_mb": data.get('file_size_mb'),
                "notebook_id": data.get('notebook_id'),
                "user_email": data.get('user_email')
            }
            for task_id, data in sorted_tasks[:limit]
        ],
        "total": len(download_status),
        "active_downloads": active_downloads
    }

@app.get("/notebook/{notebook_id}/files")
async def list_notebook_files(notebook_id: str, user_email: str = Query(...)):
    """List files for a specific notebook"""
    notebook_tasks = []
    
    for task_id, data in download_status.items():
        if (data.get('notebook_id') == notebook_id and 
            data.get('user_email') == user_email and 
            data.get('status') == 'completed'):
            
            notebook_tasks.append({
                "task_id": task_id,
                "status": data['status'],
                "download_url": data.get('download_url'),
                "file_size_mb": data.get('file_size_mb'),
                "format": data.get('format'),
                "completed_at": data.get('completed_at'),
                "s3_key": data.get('s3_key')
            })
    
    # Sort by completion time (newest first)
    notebook_tasks.sort(key=lambda x: x.get('completed_at', ''), reverse=True)
    
    return {
        "notebook_id": notebook_id,
        "user_email": user_email,
        "files": notebook_tasks,
        "total_files": len(notebook_tasks)
    }

@app.get("/user/{user_email}/notebooks")
async def list_user_notebooks(user_email: str):
    """List all notebooks for a user"""
    user_notebooks = {}
    
    for task_id, data in download_status.items():
        if (data.get('user_email') == user_email and 
            data.get('status') == 'completed' and
            data.get('notebook_id')):
            
            notebook_id = data.get('notebook_id')
            if notebook_id not in user_notebooks:
                user_notebooks[notebook_id] = {
                    'notebook_id': notebook_id,
                    'file_count': 0,
                    'total_size_mb': 0,
                    'last_updated': data.get('completed_at')
                }
            
            user_notebooks[notebook_id]['file_count'] += 1
            user_notebooks[notebook_id]['total_size_mb'] += data.get('file_size_mb', 0)
            
            # Update last_updated if this file is newer
            if data.get('completed_at', '') > user_notebooks[notebook_id]['last_updated']:
                user_notebooks[notebook_id]['last_updated'] = data.get('completed_at')
    
    # Convert to list and sort by last update
    notebooks_list = list(user_notebooks.values())
    notebooks_list.sort(key=lambda x: x['last_updated'], reverse=True)
    
    return {
        "user_email": user_email,
        "notebooks": notebooks_list,
        "total_notebooks": len(notebooks_list)
    }

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task from memory"""
    if task_id not in download_status:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Clean up local file if exists
    task_data = download_status[task_id]
    local_file = task_data.get('local_file')
    if local_file and os.path.exists(local_file):
        try:
            os.remove(local_file)
        except:
            pass
    
    del download_status[task_id]
    return {"message": "Task deleted successfully"}

if __name__ == "__main__":
    print("🎵 CNVmp3 YouTube Downloader API Starting...")
    print(f"📁 Temp directory: {TEMP_DIR}")
    print(f"☁️ S3 configured: {downloader.s3_client is not None}")
    print(f"🔄 Max concurrent downloads: {MAX_CONCURRENT_DOWNLOADS}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )