// YouTubeService.js - Add this new service file
import authService from './AuthService';
import axios from 'axios';

/**
 * Service class to handle YouTube video processing
 */
class YouTubeService {
    constructor() {
        this.baseUrl = 'http://ec2-35-159-67-25.eu-central-1.compute.amazonaws.com:8000';
    }

    /**
     * Check if a URL is a valid YouTube URL
     * @param {string} url - URL to validate
     * @returns {boolean} - Whether the URL is a valid YouTube URL
     */
    isYouTubeUrl(url) {
        if (!url || typeof url !== 'string') return false;

        const patterns = [
            /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
            /^https?:\/\/youtu\.be\/[\w-]+/,
            /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/,
            /^https?:\/\/(m\.)?youtube\.com\/watch\?v=[\w-]+/
        ];

        return patterns.some(pattern => pattern.test(url));
    }

    /**
     * Extract video ID from YouTube URL
     * @param {string} url - YouTube URL
     * @returns {string|null} - Video ID or null if not found
     */
    extractVideoId(url) {
        if (!this.isYouTubeUrl(url)) return null;

        const patterns = [
            /[?&]v=([^&]+)/,           // youtube.com/watch?v=ID
            /\/embed\/([^?&]+)/,       // youtube.com/embed/ID
            /youtu\.be\/([^?&]+)/,     // youtu.be/ID
            /\/shorts\/([^?&]+)/       // youtube.com/shorts/ID
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    /**
     * Download and process a YouTube video for a notebook
     * @param {string} youtubeUrl - YouTube video URL
     * @param {string} notebookId - Target notebook ID
     * @param {object} options - Download options
     * @param {string} options.format - Video format (default: 'mp4')
     * @param {string} options.quality - Video quality (default: '720p')
     * @returns {Promise<object>} - Download result
     */
    async downloadVideoToNotebook(youtubeUrl, notebookId, options = {}) {
        try {
            // Validate inputs
            if (!youtubeUrl || !this.isYouTubeUrl(youtubeUrl)) {
                throw new Error('Invalid YouTube URL provided');
            }

            if (!notebookId) {
                throw new Error('Notebook ID is required');
            }

            // Get user data
            const userData = authService.getUserData();
            const userEmail = userData?.email;

            if (!userEmail) {
                throw new Error('User authentication required');
            }

            console.log(`🎥 Processing YouTube video: ${youtubeUrl} for notebook: ${notebookId}`);

            // Prepare request payload
            const payload = {
                url: youtubeUrl,
                format: options.format || 'mp4',
                quality: options.quality || '720p',
                notebook_id: notebookId,
                user_email: userEmail
            };

            console.log('YouTube download request payload:', payload);

            // Make the API call
            const response = await axios.post(
                `${this.baseUrl}/download/notebook`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 120000 // 2 minute timeout for video processing
                }
            );

            console.log('✅ YouTube video processed successfully');
            console.log('Response:', response.data);

            return {
                success: true,
                data: response.data,
                videoId: this.extractVideoId(youtubeUrl),
                originalUrl: youtubeUrl,
                notebookId: notebookId
            };

        } catch (error) {
            console.error('❌ Error processing YouTube video:', error);

            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);

                // Handle specific error cases
                switch (error.response.status) {
                    case 400:
                        throw new Error('Invalid request - please check the YouTube URL');
                    case 401:
                        throw new Error('Authentication required - please login');
                    case 403:
                        throw new Error('Access denied - insufficient permissions');
                    case 404:
                        throw new Error('Video not found or unavailable');
                    case 409:
                        throw new Error('Video already exists in this notebook');
                    case 413:
                        throw new Error('Video file too large');
                    case 422:
                        throw new Error('Video format not supported');
                    case 429:
                        throw new Error('Too many requests - please try again later');
                    case 500:
                        throw new Error('Server error - please try again later');
                    case 503:
                        throw new Error('Service temporarily unavailable');
                    default:
                        throw new Error(`Request failed: ${error.response.data?.message || 'Unknown error'}`);
                }
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('Request timeout - video processing is taking too long');
            } else if (error.message.includes('Network Error')) {
                throw new Error('Network error - please check your connection');
            }

            throw error;
        }
    }

    /**
     * Get video information without downloading
     * @param {string} youtubeUrl - YouTube video URL
     * @returns {Promise<object>} - Video information
     */
    async getVideoInfo(youtubeUrl) {
        try {
            if (!this.isYouTubeUrl(youtubeUrl)) {
                throw new Error('Invalid YouTube URL');
            }

            // You can implement this if your backend supports video info endpoint
            // For now, we'll extract basic info from the URL
            const videoId = this.extractVideoId(youtubeUrl);

            return {
                videoId,
                url: youtubeUrl,
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                embedUrl: `https://www.youtube.com/embed/${videoId}`
            };
        } catch (error) {
            console.error('Error getting video info:', error);
            throw error;
        }
    }

    /**
     * Get available quality options
     * @returns {array} - Array of quality options
     */
    getQualityOptions() {
        return [
            { value: '144p', label: '144p (Low)' },
            { value: '240p', label: '240p' },
            { value: '360p', label: '360p' },
            { value: '480p', label: '480p' },
            { value: '720p', label: '720p (HD)' },
            { value: '1080p', label: '1080p (Full HD)' },
            { value: 'best', label: 'Best Available' }
        ];
    }

    /**
     * Get available format options
     * @returns {array} - Array of format options
     */
    getFormatOptions() {
        return [
            { value: 'mp4', label: 'MP4 (Video)' },
            { value: 'mp3', label: 'MP3 (Audio Only)' },
            { value: 'webm', label: 'WebM' },
            { value: 'mkv', label: 'MKV' }
        ];
    }
}

// Create a singleton instance
const youTubeService = new YouTubeService();

export default youTubeService;