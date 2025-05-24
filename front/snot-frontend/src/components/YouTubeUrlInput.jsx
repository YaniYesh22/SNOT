// YouTubeUrlInput.jsx - New component for YouTube URL handling
import React, { useState } from 'react';
import youTubeService from '../services/YouTubeService';

const YouTubeUrlInput = ({
    notebookId,
    onVideoAdded,
    onError,
    disabled = false
}) => {
    const [url, setUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [quality, setQuality] = useState('720p');
    const [format, setFormat] = useState('mp4');
    const [showOptions, setShowOptions] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!url.trim()) {
            onError('Please enter a YouTube URL');
            return;
        }

        if (!youTubeService.isYouTubeUrl(url)) {
            onError('Please enter a valid YouTube URL');
            return;
        }

        if (!notebookId || notebookId === 'temp-loading') {
            onError('Please save the notebook before adding YouTube videos');
            return;
        }

        setIsProcessing(true);

        try {
            console.log(`Processing YouTube URL: ${url}`);

            // Get video info first (for display purposes)
            const videoInfo = await youTubeService.getVideoInfo(url);

            // Download and process the video
            const result = await youTubeService.downloadVideoToNotebook(url, notebookId, {
                format,
                quality
            });

            // Create a video object for the UI
            const videoItem = {
                id: `youtube-${result.videoId}-${Date.now()}`,
                type: 'youtube',
                url: url,
                videoId: result.videoId,
                title: `YouTube Video (${result.videoId})`,
                quality: quality,
                format: format,
                thumbnail: videoInfo.thumbnail,
                embedUrl: videoInfo.embedUrl,
                addedAt: new Date().toISOString(),
                status: 'processed',
                downloadResult: result.data
            };

            // Notify parent component
            if (onVideoAdded) {
                onVideoAdded(videoItem);
            }

            // Reset form
            setUrl('');
            setShowOptions(false);

            console.log('✅ YouTube video successfully added to notebook');

        } catch (error) {
            console.error('Error processing YouTube video:', error);
            onError(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUrlChange = (e) => {
        const newUrl = e.target.value;
        setUrl(newUrl);

        // Auto-detect if it's a YouTube URL and show options
        if (youTubeService.isYouTubeUrl(newUrl) && !showOptions) {
            setShowOptions(true);
        } else if (!youTubeService.isYouTubeUrl(newUrl) && showOptions) {
            setShowOptions(false);
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputContainer}>
                    <div style={styles.urlInputWrapper}>
                        <input
                            type="text"
                            value={url}
                            onChange={handleUrlChange}
                            placeholder="Paste YouTube URL here (https://youtube.com/watch?v=...)"
                            style={{
                                ...styles.urlInput,
                                ...(youTubeService.isYouTubeUrl(url) ? styles.urlInputValid : {})
                            }}
                            disabled={disabled || isProcessing}
                        />
                        <div style={styles.youtubeIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            ...styles.addButton,
                            ...(isProcessing ? styles.addButtonDisabled : {})
                        }}
                        disabled={disabled || isProcessing || !youTubeService.isYouTubeUrl(url)}
                    >
                        {isProcessing ? (
                            <>
                                <div style={styles.spinner}></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                </svg>
                                Add Video
                            </>
                        )}
                    </button>
                </div>

                {/* Options panel - shows when YouTube URL is detected */}
                {showOptions && (
                    <div style={styles.optionsPanel}>
                        <div style={styles.optionsTitle}>Download Options</div>
                        <div style={styles.optionsGrid}>
                            <div style={styles.optionGroup}>
                                <label style={styles.optionLabel}>Quality:</label>
                                <select
                                    value={quality}
                                    onChange={(e) => setQuality(e.target.value)}
                                    style={styles.select}
                                    disabled={disabled || isProcessing}
                                >
                                    {youTubeService.getQualityOptions().map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.optionGroup}>
                                <label style={styles.optionLabel}>Format:</label>
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value)}
                                    style={styles.select}
                                    disabled={disabled || isProcessing}
                                >
                                    {youTubeService.getFormatOptions().map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Video preview (if URL is valid) */}
                        {youTubeService.isYouTubeUrl(url) && (
                            <div style={styles.previewContainer}>
                                <div style={styles.previewLabel}>Video Preview:</div>
                                <div style={styles.videoPreview}>
                                    <img
                                        src={`https://img.youtube.com/vi/${youTubeService.extractVideoId(url)}/hqdefault.jpg`}
                                        alt="Video thumbnail"
                                        style={styles.thumbnail}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <div style={styles.videoInfo}>
                                        <div style={styles.videoId}>
                                            Video ID: {youTubeService.extractVideoId(url)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </form>

            {/* Processing status */}
            {isProcessing && (
                <div style={styles.processingStatus}>
                    <div style={styles.processingMessage}>
                        🎥 Processing YouTube video... This may take a few moments.
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        marginBottom: '1.5rem'
    },
    form: {
        width: '100%'
    },
    inputContainer: {
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start'
    },
    urlInputWrapper: {
        flex: 1,
        position: 'relative'
    },
    urlInput: {
        width: '100%',
        padding: '0.75rem 2.5rem 0.75rem 0.75rem',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '0.875rem',
        outline: 'none',
        transition: 'border-color 0.2s ease',
        boxSizing: 'border-box'
    },
    urlInputValid: {
        borderColor: '#dc2626',
        boxShadow: '0 0 0 1px rgba(220, 38, 38, 0.1)'
    },
    youtubeIcon: {
        position: 'absolute',
        right: '0.75rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#dc2626',
        pointerEvents: 'none'
    },
    addButton: {
        padding: '0.75rem 1.5rem',
        background: '#dc2626',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '500',
        cursor: 'pointer',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
    },
    addButtonDisabled: {
        background: '#9ca3af',
        cursor: 'not-allowed'
    },
    spinner: {
        width: '14px',
        height: '14px',
        border: '2px solid transparent',
        borderTop: '2px solid currentColor',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    optionsPanel: {
        marginTop: '1rem',
        padding: '1rem',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
    },
    optionsTitle: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '0.75rem'
    },
    optionsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1rem'
    },
    optionGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
    },
    optionLabel: {
        fontSize: '0.75rem',
        fontWeight: '500',
        color: '#6b7280'
    },
    select: {
        padding: '0.5rem',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '0.875rem',
        background: 'white',
        outline: 'none'
    },
    previewContainer: {
        borderTop: '1px solid #e5e7eb',
        paddingTop: '0.75rem'
    },
    previewLabel: {
        fontSize: '0.75rem',
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: '0.5rem'
    },
    videoPreview: {
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center'
    },
    thumbnail: {
        width: '80px',
        height: '60px',
        borderRadius: '4px',
        objectFit: 'cover',
        border: '1px solid #e5e7eb'
    },
    videoInfo: {
        flex: 1
    },
    videoId: {
        fontSize: '0.75rem',
        color: '#6b7280',
        fontFamily: 'monospace'
    },
    processingStatus: {
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '6px'
    },
    processingMessage: {
        fontSize: '0.875rem',
        color: '#92400e',
        textAlign: 'center'
    }
};

export default YouTubeUrlInput;