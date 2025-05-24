import os
import asyncio
from playwright.async_api import async_playwright
import yt_dlp
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import tempfile
import json

class BrowserYouTubeDownloader:
    def __init__(self):
        self.cookies = None
        
    async def get_youtube_cookies(self):
        """Get fresh YouTube cookies using browser automation"""
        async with async_playwright() as p:
            # Use Chromium in headless mode
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            
            page = await context.new_page()
            
            # Navigate to YouTube
            await page.goto('https://www.youtube.com')
            await page.wait_for_load_state('networkidle')
            
            # Accept cookies if prompted
            try:
                accept_button = await page.wait_for_selector('button:has-text("Accept")', timeout=5000)
                await accept_button.click()
            except:
                pass  # No cookie prompt
            
            # Get cookies
            cookies = await context.cookies()
            
            # Convert to Netscape format for yt-dlp
            netscape_cookies = self._convert_to_netscape_format(cookies)
            
            await browser.close()
            
            return netscape_cookies
    
    def _convert_to_netscape_format(self, cookies):
        """Convert Playwright cookies to Netscape format for yt-dlp"""
        netscape_lines = []
        
        for cookie in cookies:
            domain = cookie['domain']
            flag = 'TRUE' if domain.startswith('.') else 'FALSE'
            path = cookie.get('path', '/')
            secure = 'TRUE' if cookie.get('secure', False) else 'FALSE'
            expiry = str(int(cookie.get('expires', 0)))
            name = cookie['name']
            value = cookie['value']
            
            line = f"{domain}\t{flag}\t{path}\t{secure}\t{expiry}\t{name}\t{value}"
            netscape_lines.append(line)
        
        return '\n'.join(netscape_lines)
    
    async def download_with_fresh_cookies(self, url: str, output_path: str):
        """Download YouTube video with fresh cookies"""
        # Get fresh cookies
        cookies_content = await self.get_youtube_cookies()
        
        # Save cookies to temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(cookies_content)
            cookies_file = f.name
        
        try:
            # Configure yt-dlp with cookies
            ydl_opts = {
                'cookiefile': cookies_file,
                'outtmpl': output_path,
                'quiet': True,
                'no_warnings': True,
                'format': 'best[height<=1080]',
                # Add user agent to match browser
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
                
        finally:
            # Clean up cookies file
            if os.path.exists(cookies_file):
                os.unlink(cookies_file)

# FastAPI integration
app = FastAPI()
downloader = BrowserYouTubeDownloader()

class DownloadRequest(BaseModel):
    url: str

@app.post("/download")
async def download_video(request: DownloadRequest):
    try:
        output_path = f"/tmp/{request.url.split('/')[-1]}.mp4"
        await downloader.download_with_fresh_cookies(request.url, output_path)
        return {"status": "success", "path": output_path}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))