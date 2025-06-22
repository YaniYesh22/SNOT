import 'react-quill/dist/quill.snow.css';

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import ReactQuill from 'react-quill';
import Sidebar from '../components/Sidebar';
import UploadConfirmationModal from '../components/UploadConfirmationModal';
import LinkConfirmationModal from '../components/LinkConfirmationModal';
import notebookService from '../services/NotebookService';

export default function NotebookDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get notebookId from location state or URL params
  const locationNotebookId = location.state?.notebookId;
  const notebookData = location.state?.notebookData;

  // Try to get from URL params if not in location state
  const urlParams = new URLSearchParams(location.search);
  const urlNotebookId = urlParams.get('id');

  // Use the notebook ID from location state, URL params, or generate fallback
  const initialNotebookId = locationNotebookId || urlNotebookId;

  // Initialize with the notebookId
  const [notebook, setNotebook] = useState(notebookData || {
    notebookId: initialNotebookId || 'temp-loading',
    title: initialNotebookId ? 'Loading...' : 'New Notebook',
    content: '',
    lastUpdated: new Date().toISOString()
  });

  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Enhanced Chat-related state
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const chatContainerRef = useRef(null);

  // Summary viewing state
  const [generatedSummaries, setGeneratedSummaries] = useState({});
  const [showSummaryView, setShowSummaryView] = useState(false);
  const [selectedSummaryType, setSelectedSummaryType] = useState(null);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);

  // 🔄 FIXED: Progress tracking state
  const [summaryProgress, setSummaryProgress] = useState(null);
  const [isPollingProgress, setIsPollingProgress] = useState(false);
  const [summaryProgressInterval, setSummaryProgressInterval] = useState(null);
  const [summaryStartTime, setSummaryStartTime] = useState(null);
  const [summaryTaskId, setSummaryTaskId] = useState(null);

  // Summary page view state
  const [showSummaryPage, setShowSummaryPage] = useState(false);
  const [currentSummaryPage, setCurrentSummaryPage] = useState(null);

  // Updated state variables for the new upload confirmation flow
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [fileErrors, setFileErrors] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkToAdd, setLinkToAdd] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [showSummaryDropdown, setShowSummaryDropdown] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // 🆕 NEW: Helper functions for chat control
  const hasContentSources = () => {
    return files.length > 0 || links.length > 0;
  };

  const hasSummariesForChat = () => {
    const availableSummaries = Object.entries(generatedSummaries).filter(([type, data]) => {
      const hasValidUrl = data.url && typeof data.url === 'string' && !data.url.startsWith('#');
      const isReady = data.ready === true;
      return hasValidUrl && isReady;
    });
    return availableSummaries.length > 0;
  };

  // 🔧 UPDATED: getChatState function to always enable chat
  const getChatState = () => {
    const sourcesAvailable = hasContentSources();
    const summariesAvailable = hasSummariesForChat();

    if (summariesAvailable) {
      return {
        state: 'available',
        title: 'AI Assistant',
        placeholder: 'Ask me anything...',
        note: null,
        disabled: false // ✅ Chat enabled with summaries
      };
    } else if (sourcesAvailable) {
      return {
        state: 'ready_with_sources',
        title: 'AI Assistant',
        placeholder: 'Ask me anything about your sources...',
        note: 'Chat with your uploaded files and links! Generate summaries for enhanced responses.',
        disabled: false // ✅ Chat enabled with sources (no summaries needed)
      };
    } else {
      return {
        state: 'ready_no_sources',
        title: 'AI Assistant',
        placeholder: 'Ask me anything...',
        note: 'Upload files or add links for more context, or just start chatting!',
        disabled: false // ✅ Chat enabled even without sources
      };
    }
  };

  // Auto-scroll chat to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Quill editor modules configuration - simplified
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'
  ];

  // Function to count words in HTML content
  const getWordCount = (htmlContent) => {
    if (!htmlContent) return 0;
    const text = htmlContent.replace(/<[^>]*>/g, ' ');
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Enhanced Chat API function with conversation history
  const sendChatMessage = async (message) => {
    try {
      const headers = await notebookService.authService?.getAuthHeaders() || {};
      const userData = notebookService.authService?.getUserData() || {};
      const userEmail = userData?.email;

      if (!userEmail) {
        throw new Error('Please login to use chat');
      }

      // Build conversation history from chat messages
      const conversationHistory = chatMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message
      }));

      // Generate conversation ID if not exists
      const currentConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (!conversationId) {
        setConversationId(currentConversationId);
      }

      const payload = {
        bucket: 'smart-notebook-media',
        email: userEmail,
        notebook_uuid: notebook.notebookId,
        question: message,
        conversation_history: conversationHistory,
        conversation_id: currentConversationId,
        max_chunks: 5,
        include_sources: true
      };

      console.log('🤖 Sending chat message with history:', {
        ...payload,
        conversation_history_length: conversationHistory.length
      });

      const response = await fetch(`${notebookService.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': headers.Authorization,
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('🤖 Chat API response:', data);

      return {
        answer: data.answer || 'Sorry, I couldn\'t generate a response.',
        sources: data.sources || [],
        chunks_found: data.chunks_found || 0,
        search_method: data.search_method || 'unknown'
      };

    } catch (error) {
      console.error('❌ Chat error:', error);
      throw error;
    }
  };

  // Enhanced function to add a chat message with metadata
  const addChatMessage = (message, sender = 'user', type = 'message', metadata = {}) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      message,
      sender, // 'user', 'ai', or 'system'
      type, // 'message', 'summary', 'error'
      timestamp: new Date().toISOString(),
      metadata // Additional data like sources, chunks_found, etc.
    };

    setChatMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const fetchSummaryContent = async (summaryUrl, summaryType) => {
    try {
      setIsFetchingSummary(true);
      console.log(`📄 Fetching ${summaryType} summary...`);

      let summaryContent;

      // 🆕 NEW: Try getSummary Lambda first if we have the required info
      try {
        console.log('🚀 Trying getSummary Lambda...');
        const lambdaResult = await notebookService.getSummary(notebook.notebookId, summaryType);

        if (lambdaResult && lambdaResult.summary && lambdaResult.summary.content) {
          summaryContent = lambdaResult.summary.content;
          console.log('✅ Got summary from Lambda');

          // 🆕 BONUS: Store additional metadata if available
          const summaryMetadata = {
            content: summaryContent,
            url: summaryUrl,
            fetchedAt: new Date().toISOString(),
            wordCount: lambdaResult.summary.wordCount,
            readingTime: lambdaResult.summary.estimatedReadingTime,
            fileSize: lambdaResult.summary.fileSizeFormatted,
            lastModified: lambdaResult.summary.lastModified
          };

          setGeneratedSummaries(prev => ({
            ...prev,
            [summaryType]: summaryMetadata
          }));

          return summaryContent;
        }
      } catch (lambdaError) {
        console.log('⚠️ Lambda failed, trying direct fetch:', lambdaError.message);
      }

      // Fallback: Direct fetch methods
      if (summaryUrl.startsWith('s3://')) {
        summaryContent = await notebookService.fetchSummaryFromS3(summaryUrl, notebook.notebookId, summaryType);
      } else if (summaryUrl.startsWith('https://')) {
        const response = await fetch(summaryUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch summary: ${response.status}`);
        }
        summaryContent = await response.text();
      } else {
        throw new Error('Unsupported summary URL format');
      }

      // Store the fetched summary
      setGeneratedSummaries(prev => ({
        ...prev,
        [summaryType]: {
          content: summaryContent,
          url: summaryUrl,
          fetchedAt: new Date().toISOString()
        }
      }));

      return summaryContent;

    } catch (error) {
      console.error(`❌ Error fetching ${summaryType} summary:`, error);

      // Add error message to chat
      addChatMessage(
        `❌ Failed to fetch ${summaryType} summary: ${error.message}`,
        'system',
        'error'
      );

      throw error;
    } finally {
      setIsFetchingSummary(false);
    }
  };

  // Function to toggle summary view
  const toggleSummaryView = (summaryType = null) => {
    setSelectedSummaryType(summaryType);
    setShowSummaryView(summaryType !== null);
  };

  // 🔧 FIX: Update viewSummary to handle content-only summaries
  const viewSummary = async (summaryType, summaryUrl) => {
    try {
      const summaryData = generatedSummaries[summaryType];

      if (!summaryData) {
        console.error(`❌ No summary data found for ${summaryType}`);
        return;
      }

      // 🔧 FIXED: Check if we already have content cached
      const hasContent = summaryData.content && summaryData.content.length > 0;

      if (hasContent) {
        // ✅ Content is already available, show modal immediately
        console.log(`✅ Using cached content for ${summaryType} summary modal`);
        toggleSummaryView(summaryType);
        return;
      }

      // ✅ Need to fetch content from URL
      const isRealUrl = summaryUrl &&
        !summaryUrl.startsWith('#') &&
        (summaryUrl.startsWith('http') || summaryUrl.startsWith('s3://'));

      if (isRealUrl) {
        console.log(`🔄 Fetching content for ${summaryType} modal from URL: ${summaryUrl}`);
        await fetchSummaryContent(summaryUrl, summaryType);
        toggleSummaryView(summaryType);
      } else if (summaryUrl.startsWith('#content-')) {
        // Handle placeholder URLs
        if (summaryData.content) {
          console.log(`✅ Using content for placeholder URL ${summaryType}`);
          toggleSummaryView(summaryType);
        } else {
          console.error(`❌ Placeholder URL but no content for ${summaryType}`);
        }
      } else {
        console.error(`❌ Invalid URL for ${summaryType}: ${summaryUrl}`);
      }

    } catch (error) {
      console.error(`❌ Error viewing summary ${summaryType}:`, error);
    }
  };

  // 🆕 NEW: Get summary preview for listing
  const getSummaryPreview = async (notebookId, summaryType) => {
    try {
      const result = await notebookService.getSummary(notebookId, summaryType);
      return {
        type: summaryType,
        preview: result.summary.preview || result.summary.content.substring(0, 200) + '...',
        wordCount: result.summary.wordCount,
        readingTime: result.summary.estimatedReadingTime,
        fileSize: result.summary.fileSizeFormatted,
        lastModified: result.summary.lastModified
      };
    } catch (error) {
      console.error(`Error getting ${summaryType} preview:`, error);
      return null;
    }
  };

  // 🆕 NEW: Download summary as file
  const downloadSummary = async (notebookId, summaryType, format = 'plain') => {
    try {
      const result = await notebookService.getSummary(notebookId, summaryType, format);

      let content, mimeType, extension;

      if (format === 'html') {
        content = result.content;
        mimeType = 'text/html';
        extension = 'html';
      } else if (format === 'plain') {
        content = result.content;
        mimeType = 'text/plain';
        extension = 'txt';
      } else {
        // JSON format
        content = result.summary.content;
        mimeType = 'text/plain';
        extension = 'txt';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${notebookId}_${summaryType}_summary.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`✅ Downloaded ${summaryType} summary as ${format}`);

    } catch (error) {
      console.error('Error downloading summary:', error);
      throw new Error(`Failed to download summary: ${error.message}`);
    }
  };

  // 🔧 FIX: Update openSummaryPage to handle content-only summaries
  const openSummaryPage = async (summaryType, summaryUrl) => {
    try {
      const summaryData = generatedSummaries[summaryType];

      if (!summaryData) {
        console.error(`❌ No summary data found for ${summaryType}`);
        return;
      }

      // 🔧 FIXED: Check if we already have content or need to fetch
      const hasContent = summaryData.content && summaryData.content.length > 0;
      const isContentPlaceholder = summaryUrl.startsWith('#content-');

      if (hasContent) {
        // ✅ Content is already available, show immediately
        console.log(`✅ Using cached content for ${summaryType} summary`);
        setCurrentSummaryPage(summaryType);
        setShowSummaryPage(true);
        return;
      }

      if (isContentPlaceholder) {
        // ✅ URL is placeholder but we should have content - check again
        if (summaryData.content) {
          console.log(`✅ Found content for placeholder URL ${summaryType}`);
          setCurrentSummaryPage(summaryType);
          setShowSummaryPage(true);
          return;
        } else {
          console.error(`❌ Placeholder URL ${summaryUrl} but no content available for ${summaryType}`);
          return;
        }
      }

      // ✅ Need to fetch content from real URL
      const isRealUrl = summaryUrl &&
        !summaryUrl.startsWith('#') &&
        (summaryUrl.startsWith('http') || summaryUrl.startsWith('s3://'));

      if (isRealUrl) {
        console.log(`🔄 Fetching content for ${summaryType} from URL: ${summaryUrl}`);
        await fetchSummaryContent(summaryUrl, summaryType);
        setCurrentSummaryPage(summaryType);
        setShowSummaryPage(true);
      } else {
        console.error(`❌ Invalid URL for ${summaryType}: ${summaryUrl}`);
      }

    } catch (error) {
      console.error(`❌ Error opening summary page for ${summaryType}:`, error);
    }
  };

  // Function to close summary page and return to main notebook view
  const closeSummaryPage = () => {
    setShowSummaryPage(false);
    setCurrentSummaryPage(null);
  };

  // Function to get formatted summary type name
  const getFormattedSummaryName = (summaryType) => {
    const names = {
      'casual': 'Casual Summarization',
      'academic': 'Academic Summarization',
      'simple': 'Simple Summarization'
    };
    return names[summaryType] || `${summaryType.charAt(0).toUpperCase() + summaryType.slice(1)} Summarization`;
  };

  // Function to clear conversation (but keep summaries)
  const clearConversation = () => {
    setChatMessages([]);
    setConversationId(null);
    // Note: We don't clear generatedSummaries so users can still access them
  };

  // Function to format chat message timestamp
  const formatChatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Function to render source information
  const renderSourceInfo = (sources) => {
    if (!sources || sources.length === 0) return null;

    return (
      <div style={styles.sourcesInfo}>
        <div style={styles.sourcesHeader}>📚 Sources:</div>
        {sources.slice(0, 3).map((source, index) => (
          <div key={index} style={styles.sourceItem}>
            <span style={styles.sourceNumber}>{index + 1}.</span>
            <span style={styles.sourceText}>
              {source.filename} ({source.content_type})
              {source.similarity_score && (
                <span style={styles.sourceScore}>
                  - {(source.similarity_score * 100).toFixed(0)}% match
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // 🔄 FIXED: Updated handleSummarize function 
  const handleSummarize = async (summaryType) => {
    setShowSummaryDropdown(false);
    setIsGeneratingSummary(true);
    setSummaryProgress(null);
    setSummaryStartTime(new Date());
    setSummaryTaskId(null);

    try {
      console.log(`Starting ${summaryType} summary with progress tracking...`);

      // Step 1: Start the summary generation using your new Lambda endpoint
      const startResult = await notebookService.startSummary(notebook.notebookId, [summaryType]);

      console.log(`✅ Summary started:`, startResult);
      setSummaryTaskId(startResult.taskId);

      // REMOVED: No longer add chat message when summary starts
      // addChatMessage(
      //   `Starting ${summaryType} summary generation... This will take ${startResult.estimatedTime || '2-8 minutes'}.`,
      //   'system',
      //   'summary',
      //   {
      //     summaryType: summaryType,
      //     taskId: startResult.taskId,
      //     estimatedTime: startResult.estimatedTime
      //   }
      // );

      // Step 2: Start polling for progress
      setIsPollingProgress(true);
      startProgressPolling(notebook.notebookId, summaryType, startResult.pollInterval || 10);

    } catch (error) {
      console.error('❌ Error starting summary:', error);

      // Handle specific error cases
      let errorMessage = 'Failed to start summary generation';

      if (error.message.includes('already in progress')) {
        errorMessage = 'Summary generation is already in progress. Please wait for it to complete.';
      } else if (error.message.includes('still being processed')) {
        errorMessage = 'Files are still being processed. Please wait and try again in a moment.';
      } else if (error.message.includes('login')) {
        errorMessage = 'Please login to generate summaries.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      addChatMessage(`❌ ${errorMessage}`, 'system', 'error');

      setIsGeneratingSummary(false);
      setSummaryProgress(null);
      setIsPollingProgress(false);
    }
  };

  // 🔄 FIXED: Enhanced startProgressPolling function with better interval management
  const startProgressPolling = (notebookId, summaryType, pollInterval) => {
    console.log(`📊 Starting progress polling every ${pollInterval} seconds...`);

    // 🔄 FIXED: Clear any existing interval first to prevent multiple intervals
    if (summaryProgressInterval) {
      console.log('🧹 Clearing existing polling interval');
      clearInterval(summaryProgressInterval);
      setSummaryProgressInterval(null);
    }

    // Set polling state
    setIsPollingProgress(true);

    // Poll immediately first
    pollSummaryProgress(notebookId, summaryType);

    // Then set up interval for subsequent polls
    const intervalId = setInterval(() => {
      // 🔄 FIXED: Check if we should still be polling before each poll
      console.log('🔄 Interval tick - checking if should continue polling...');
      pollSummaryProgress(notebookId, summaryType);
    }, pollInterval * 1000);

    setSummaryProgressInterval(intervalId);
    console.log(`✅ Polling interval started with ID: ${intervalId}`);
  };

  // 🔄 FIXED: Updated pollSummaryProgress function with proper completion detection
  const pollSummaryProgress = async (notebookId, summaryType) => {
    console.log('🔄 Starting poll attempt...', {
      notebookId,
      summaryType,
      isPollingProgress,
      intervalExists: !!summaryProgressInterval
    });

    try {
      const progress = await notebookService.getSummaryStatus(notebookId);

      console.log(`📊 Progress received:`, {
        status: progress.status,
        progressSummary: progress.progressSummary,
        elapsedTime: progress.elapsedTime,
        summariesCount: Object.keys(progress.summaries || {}).length
      });

      setSummaryProgress(progress);

      // 🔄 FIXED: Proper completion detection and polling stop
      const completionStatuses = ['completed', 'partial_success', 'failed'];
      if (completionStatuses.includes(progress.status)) {
        console.log('🎯 COMPLETION DETECTED!', {
          status: progress.status,
          willStopPolling: true,
          willUpdateSummaries: !!progress.summaries
        });

        // CRITICAL: Stop polling FIRST, then handle completion
        stopProgressPolling();
        handleSummaryCompletion(progress, summaryType);
        return; // Exit the function to prevent further polling
      }

      console.log('⏳ Still in progress, continuing to poll...');

    } catch (error) {
      console.error('❌ Poll error:', error);

      // Don't fail immediately on polling errors, just log them
      if (error.message.includes('Network error')) {
        console.log('🔄 Network error during polling, will retry...');
      } else {
        console.error('❌ Unexpected polling error:', error.message);
        // If we get too many errors, stop polling
        stopProgressPolling();
      }
    }
  };

  // 🔄 FIXED: Enhanced stopProgressPolling function with better cleanup
  const stopProgressPolling = () => {
    console.log('🛑 STOP POLLING CALLED:', {
      timestamp: new Date().toISOString(),
      hadInterval: !!summaryProgressInterval,
      intervalId: summaryProgressInterval,
      wasPolling: isPollingProgress,
      wasGenerating: isGeneratingSummary
    });

    // Clear the interval if it exists
    if (summaryProgressInterval) {
      clearInterval(summaryProgressInterval);
      setSummaryProgressInterval(null);
      console.log('✅ Interval cleared successfully');
    } else {
      console.log('⚠️ No interval to clear');
    }

    // Reset all polling-related state
    setIsPollingProgress(false);
    setIsGeneratingSummary(false);
    setSummaryProgress(null);
    setSummaryTaskId(null);

    console.log('✅ All polling state reset');
  };

  // 🔧 FIX: Update handleSummaryCompletion to save ALL summaries after merge
  const handleSummaryCompletion = (progress, summaryType) => {
    console.log('🎉 HANDLING COMPLETION:', {
      timestamp: new Date().toISOString(),
      status: progress.status,
      summaryType,
      hasSummaries: !!progress.summaries,
      summariesCount: Object.keys(progress.summaries || {}).length,
      currentGeneratedCount: Object.keys(generatedSummaries).length,
      currentTypes: Object.keys(generatedSummaries)
    });

    // 🔄 FIXED: Ensure polling is completely stopped (defensive programming)
    if (isPollingProgress || summaryProgressInterval) {
      console.log('🛑 Defensive polling stop in completion handler');
      stopProgressPolling();
    }

    if (progress.status === 'completed') {
      // 🔄 FIXED: Properly update generatedSummaries state to show in UI immediately
      if (progress.summaries && Object.keys(progress.summaries).length > 0) {
        const updatedSummaries = {};
        Object.entries(progress.summaries).forEach(([type, data]) => {
          console.log(`📄 Processing summary: ${type}`, {
            hasUrl: !!data.s3Url,
            hasDownloadUrl: !!data.downloadUrl,
            hasContent: !!data.content,
            s3Url: data.s3Url,
            downloadUrl: data.downloadUrl
          });

          // 🔧 FIX: Handle both URL-based and content-based summaries
          const realUrl = data.s3Url || data.downloadUrl;
          const hasContent = data.content && typeof data.content === 'string' && data.content.length > 0;

          if ((realUrl &&
            realUrl !== 'undefined' &&
            realUrl !== 'null' &&
            !realUrl.startsWith('#') &&
            (realUrl.startsWith('http') || realUrl.startsWith('s3://'))) || hasContent) {

            updatedSummaries[type] = {
              url: realUrl || `#content-${type}`,
              ready: true,
              generatedAt: data.generatedAt || new Date().toISOString(),
              downloadUrl: data.downloadUrl || data.s3Url,
              fileSize: data.fileSize,
              fileSizeFormatted: data.fileSizeFormatted,
              wordCount: data.wordCount,
              characterCount: data.characterCount,
              readingTime: data.readingTime,
              content: data.content || null,
              hasContent: hasContent,
              preview: data.preview || null,
              source: 'completion_handler'
            };

            console.log(`✅ Added summary ${type}:`, {
              url: updatedSummaries[type].url,
              hasContent: hasContent,
              contentLength: data.content?.length || 0
            });
          } else {
            console.warn(`⚠️ Skipping ${type} summary - no valid URL or content:`, {
              s3Url: data.s3Url,
              downloadUrl: data.downloadUrl,
              hasContent: hasContent,
              realUrl
            });
          }
        });

        console.log('🔄 About to MERGE summaries by type:', {
          existingTypes: Object.keys(generatedSummaries),
          newTypes: Object.keys(updatedSummaries),
          will_merge_not_replace: true
        });

        // 🔄 FIXED: MERGE summaries by type instead of replacing all
        if (Object.keys(updatedSummaries).length > 0) {
          setGeneratedSummaries(prev => {
            // ✅ MERGE: Keep existing summaries and add/update new ones by type
            const mergedSummaries = { ...prev, ...updatedSummaries };

            console.log('✅ generatedSummaries MERGED by type!', {
              previousTypes: Object.keys(prev),
              newTypes: Object.keys(updatedSummaries),
              finalTypes: Object.keys(mergedSummaries),
              totalCount: Object.keys(mergedSummaries).length
            });

            // 🔧 FIX: Save to backend AFTER state merge with ALL summaries
            setTimeout(() => {
              console.log('💾 Saving ALL merged summaries to backend:', {
                allTypes: Object.keys(mergedSummaries),
                count: Object.keys(mergedSummaries).length
              });
              saveSummariesToBackendWithData(mergedSummaries);
            }, 200); // Increased delay to ensure state update completes

            return mergedSummaries;
          });

          // 🆕 NEW: Also update the notebook metadata to persist summaries
          setNotebook(prev => {
            const existingSummaryTypes = Object.keys(generatedSummaries);
            const newSummaryTypes = Object.keys(updatedSummaries);
            const allTypes = [...new Set([...existingSummaryTypes, ...newSummaryTypes])];

            return {
              ...prev,
              summaryTypesAvailable: allTypes,
              lastSummarization: new Date().toISOString()
            };
          });

          console.log('📝 Updated notebook metadata with merged summary types');
        } else {
          console.warn('⚠️ No valid summaries to merge!');
        }
      } else {
        console.log('⚠️ No summaries in progress data');
      }

      // 🔄 UPDATED: Don't add chat messages, just log completion
      const elapsedMsg = progress.elapsedTime ? ` (completed in ${progress.elapsedTime})` : '';
      console.log(`✨ ${summaryType.charAt(0).toUpperCase() + summaryType.slice(1)} summary completed successfully!${elapsedMsg}`);

    } else if (progress.status === 'partial_success') {
      // Handle partial success similarly...
      console.log(`⚠️ Summary partially completed: ${progress.message || ''}`);

    } else if (progress.status === 'failed') {
      const errorMsg = progress.error || progress.message || 'Summary generation failed';
      console.error(`❌ Summary generation failed: ${errorMsg}`);
    }

    console.log('🏁 Completion handling finished');
  };

  // 🔧 NEW: Enhanced save function that accepts specific summary data
  const saveSummariesToBackendWithData = async (summariesToSave) => {
    if (Object.keys(summariesToSave).length > 0 && notebook.notebookId) {
      try {
        console.log('💾 Saving specific summaries to backend...', {
          notebookId: notebook.notebookId,
          summaryTypes: Object.keys(summariesToSave),
          summariesCount: Object.keys(summariesToSave).length,
          summariesData: Object.entries(summariesToSave).map(([type, data]) => ({
            type,
            hasContent: !!data.content,
            hasUrl: !!data.url,
            source: data.source
          }))
        });

        // 🆕 ENHANCED: Prepare summary data for backend storage
        const summaryUpdateData = {
          summaryData: summariesToSave,  // Use provided summaries
          summaryTypesAvailable: Object.keys(summariesToSave),
          lastSummarization: new Date().toISOString(),
          summariesCount: Object.keys(summariesToSave).length
        };

        console.log('📤 Sending summary data to backend:', {
          summaryTypes: Object.keys(summariesToSave),
          count: Object.keys(summariesToSave).length,
          dataKeys: Object.keys(summaryUpdateData)
        });

        // Use a separate endpoint for summary metadata if available
        if (notebookService.updateNotebookSummaries) {
          await notebookService.updateNotebookSummaries(notebook.notebookId, summaryUpdateData);
        } else {
          // Fallback to regular update
          await notebookService.updateNotebook(notebook.notebookId, {
            title: notebook.title,
            chunkNumber: 0,
            chunkContent: content,
            links: links,
            ...summaryUpdateData
          });
        }

        console.log('✅ Successfully saved specific summaries to backend:', {
          savedTypes: Object.keys(summariesToSave),
          count: Object.keys(summariesToSave).length
        });

      } catch (error) {
        console.error('❌ Failed to save specific summaries to backend:', error);
      }
    }
  };

  // 🔧 FIX: Updated renderGeneratedSummariesSection to handle content-only summaries
  const renderGeneratedSummariesSection = () => {
    console.log('🔍 Rendering summaries section, generatedSummaries:', generatedSummaries);

    const availableSummaries = Object.entries(generatedSummaries).filter(([type, data]) => {
      // ✅ FIXED: Accept summaries that either have a valid URL OR have content
      const hasValidUrl = data.url &&
        typeof data.url === 'string' &&
        data.url !== 'undefined' &&
        data.url !== 'null' &&
        !data.url.startsWith('#') &&
        (data.url.startsWith('http') || data.url.startsWith('s3://'));

      const hasContent = data.content &&
        typeof data.content === 'string' &&
        data.content.length > 0;

      const hasContentPlaceholder = data.url &&
        typeof data.url === 'string' &&
        data.url.startsWith('#content-');

      const isReady = data.ready === true;

      // ✅ ACCEPT if: ready AND (has valid URL OR has content OR has content placeholder)
      const passes = isReady && (hasValidUrl || hasContent || hasContentPlaceholder);

      console.log(`🔍 Summary ${type}:`, {
        ready: isReady,
        hasValidUrl: hasValidUrl,
        hasContent: hasContent,
        hasContentPlaceholder: hasContentPlaceholder,
        url: data.url,
        contentLength: data.content?.length || 0,
        passes: passes
      });

      return passes;
    });

    if (availableSummaries.length === 0) {
      console.log('⚠️ No available summaries to display');
      return null;
    }

    return (
      <div style={styles.summariesSection}>
        <div style={styles.summariesHeader}>
          <h3 style={styles.summariesTitle}>
            Generated Summaries
          </h3>
          <div style={styles.summariesCount}>
            {availableSummaries.length}
          </div>
        </div>

        <div style={styles.summariesGrid}>
          {availableSummaries.map(([summaryType, summaryData]) => {
            const metadataItems = [];

            if (summaryData.generatedAt) {
              metadataItems.push({
                icon: '📅',
                label: 'Generated',
                value: new Date(summaryData.generatedAt).toLocaleDateString()
              });
            }
            if (summaryData.fileSizeFormatted) {
              metadataItems.push({
                icon: '📦',
                label: 'Size',
                value: summaryData.fileSizeFormatted
              });
            }
            if (summaryData.wordCount) {
              metadataItems.push({
                icon: '📝',
                label: 'Words',
                value: summaryData.wordCount.toLocaleString()
              });
            }
            if (summaryData.readingTime) {
              metadataItems.push({
                icon: '⏱️',
                label: 'Reading',
                value: summaryData.readingTime
              });
            }

            // 🔧 FIXED: Handle click for both URL-based and content-based summaries
            const handleSummaryClick = () => {
              const hasRealUrl = summaryData.url &&
                !summaryData.url.startsWith('#') &&
                (summaryData.url.startsWith('http') || summaryData.url.startsWith('s3://'));

              if (hasRealUrl) {
                // Use the real URL
                openSummaryPage(summaryType, summaryData.url);
              } else if (summaryData.content) {
                // Use content directly with a placeholder URL
                openSummaryPage(summaryType, `#content-${summaryType}`);
              } else {
                console.warn(`⚠️ Cannot open summary ${summaryType} - no URL or content available`);
              }
            };

            return (
              <div
                key={summaryType}
                style={styles.summaryCard}
                onClick={handleSummaryClick}
                className="modern-summary-card"
              >
                {/* Header with icon and type */}
                <div style={styles.summaryCardHeader}>
                  <div style={styles.summaryTypeIcon}>
                    {summaryType === 'casual' ? '💬' :
                      summaryType === 'academic' ? '🎓' :
                        summaryType === 'simple' ? '✨' : '📄'}
                  </div>
                  <div style={styles.summaryCardTitle}>
                    <div style={styles.summaryTypeName}>
                      {getFormattedSummaryName(summaryType)}
                    </div>
                    <div style={styles.summaryStatus}>
                      <div style={styles.statusDot}></div>
                      {summaryData.hasContent ? 'Ready with Content' : 'Ready'}
                    </div>
                  </div>
                  <div style={styles.summaryCardAction}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                    </svg>
                  </div>
                </div>

                {/* Metadata */}
                {metadataItems.length > 0 && (
                  <div style={styles.summaryMetadata}>
                    {metadataItems.map((item, index) => (
                      <div key={index} style={styles.metadataItem}>
                        <span style={styles.metadataIcon}>{item.icon}</span>
                        <span style={styles.metadataLabel}>{item.label}:</span>
                        <span style={styles.metadataValue}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress bar for visual appeal */}
                <div style={styles.summaryProgress}>
                  <div style={styles.progressBar}>
                    <div style={styles.progressFill}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Progress bar component
  const renderSummaryProgress = () => {
    if (!summaryProgress || !isPollingProgress) return null;

    const { status, progressSummary, elapsedTime, estimatedTimeRemaining, message, taskId } = summaryProgress;

    if (status !== 'processing') return null;

    const { completed = 0, processing = 0, pending = 0, total = 1 } = progressSummary || {};
    const progressPercentage = total > 0 ? Math.round(((completed + (processing * 0.5)) / total) * 100) : 0;

    return (
      <div style={styles.progressContainer}>
        <div style={styles.progressHeader}>
          <div style={styles.progressTitle}>
            <span style={styles.progressIcon}>⚡</span>
            Generating Summary...
          </div>
          <div style={styles.progressStats}>
            {completed}/{total} completed
          </div>
        </div>

        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressBarFill,
              width: `${Math.min(progressPercentage, 95)}%` // Cap at 95% until fully done
            }}
          />
        </div>

        <div style={styles.progressDetails}>
          <div style={styles.progressText}>
            {message || 'Processing your content...'}
          </div>
          <div style={styles.progressTime}>
            {elapsedTime && `⏱️ ${elapsedTime}`}
            {estimatedTimeRemaining && ` • ~${estimatedTimeRemaining} remaining`}
            {taskId && (
              <span style={styles.taskId}> • Task: {taskId.substring(0, 8)}...</span>
            )}
          </div>
        </div>

        {summaryProgress.progress && (
          <div style={styles.progressTypeDetails}>
            {Object.entries(summaryProgress.progress).map(([type, typeProgress]) => (
              <div key={type} style={styles.progressTypeItem}>
                <span style={styles.progressTypeName}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}:
                </span>
                <span style={{
                  ...styles.progressTypeStatus,
                  color: typeProgress.status === 'completed' ? ' #10b981' :
                    typeProgress.status === 'generating' ? ' #3b82f6' : ' #6b7280'
                }}>
                  {typeProgress.status === 'completed' ? '✓ Done' :
                    typeProgress.status === 'generating' ? '⚡ Generating...' :
                      '⏳ Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 🔄 FIXED: Enhanced renderSummaryButton with better loading state management
  const renderSummaryButton = () => (
    <div className="summary-dropdown-container" style={styles.summaryContainer}>
      <button
        onClick={() => setShowSummaryDropdown(!showSummaryDropdown)}
        style={{
          ...styles.summaryButton,
          ...(isGeneratingSummary ? styles.summaryButtonLoading : {})
        }}
        disabled={isGeneratingSummary || (files.length === 0 && links.length === 0)}
      >
        {isGeneratingSummary ? (
          <>
            <div style={styles.summarySpinner}></div>
            {isPollingProgress ? 'Generating...' : 'Starting...'}
          </>
        ) : (
          <>
            <span style={styles.summaryIcon}>✨</span>
            Summarize
          </>
        )}
      </button>

      {/* 🔄 FIXED: Only show progress when actually polling */}
      {isPollingProgress && renderSummaryProgress()}

      {showSummaryDropdown && !isGeneratingSummary && (
        <div style={styles.summaryDropdown}>
          <div style={styles.summaryDropdownHeader}>
            Choose Summary Type
          </div>

          <button
            onClick={() => handleSummarize('casual')}
            style={styles.summaryOption}
          >
            <div style={styles.summaryOptionTitle}>Casual</div>
            <div style={styles.summaryOptionDesc}>Conversational and easy to understand</div>
          </button>

          <button
            onClick={() => handleSummarize('academic')}
            style={styles.summaryOption}
          >
            <div style={styles.summaryOptionTitle}>Academic</div>
            <div style={styles.summaryOptionDesc}>Detailed analysis with key findings</div>
          </button>

          <button
            onClick={() => handleSummarize('simple')}
            style={styles.summaryOption}
          >
            <div style={styles.summaryOptionTitle}>Beginner Friendly</div>
            <div style={styles.summaryOptionDesc}>Simple bullet points and essential facts</div>
          </button>
        </div>
      )}
    </div>
  );

  // 🆕 NEW: Chat Section Renderer
  const renderChatSection = () => {
    const chatState = getChatState();
    const summariesAvailable = chatState.state === 'available';

    return (
      <div style={styles.chatSection}>
        <div style={styles.chatContainer}>
          <div style={styles.chatHeader}>
            <h3 style={styles.chatTitle}>
              {chatState.title}
            </h3>
            <div style={styles.chatHeaderActions}>
              {/* View Summaries dropdown - only show if summaries available */}
              {summariesAvailable && Object.keys(generatedSummaries).length > 0 && (
                <div style={styles.summariesDropdown}>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const summaryType = e.target.value;
                        const summaryData = generatedSummaries[summaryType];
                        if (summaryData?.url) {
                          viewSummary(summaryType, summaryData.url);
                        }
                      }
                      e.target.value = ''; // Reset select
                    }}
                    style={styles.summariesSelect}
                    className="summaries-select"
                    defaultValue=""
                  >
                    <option value="">📄 View Summaries</option>
                    {Object.entries(generatedSummaries)
                      .filter(([type, data]) => {
                        const hasValidUrl = data.url && !data.url.startsWith('#');
                        return data.ready && hasValidUrl;
                      })
                      .map(([type, data]) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)} Summary
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Clear chat button - only show if chat has messages and summaries available */}
              {chatMessages.length > 0 && (
                <button onClick={clearConversation} style={styles.clearChatButton} className="clear-chat-button">
                  Clear Conversation
                </button>
              )}
            </div>
          </div>

          {/* Chat Messages - only show if summaries available */}
          {chatMessages.length > 0 && (
            <div style={styles.chatMessages} ref={chatContainerRef}>
              {chatMessages.map((message) => (
                <div key={message.id} style={styles.chatMessage}>
                  <div style={{
                    ...styles.chatMessageContent,
                    ...(message.sender === 'user' ? styles.chatMessageUser : {}),
                    ...(message.sender === 'ai' ? styles.chatMessageAI : {}),
                    ...(message.sender === 'system' ? styles.chatMessageSystem : {}),
                    ...(message.type === 'error' ? styles.chatMessageError : {}),
                    ...(message.type === 'summary' ? styles.chatMessageSummary : {}),
                    ...(message.type === 'sources' ? styles.chatMessageSources : {})
                  }}>
                    <div style={styles.chatMessageText}>
                      {message.message}
                    </div>

                    {/* Display sources for AI messages */}
                    {message.sender === 'ai' && message.metadata?.sources && (
                      renderSourceInfo(message.metadata.sources)
                    )}

                    <div style={styles.chatMessageTime}>
                      {formatChatTime(message.timestamp)}
                      {message.metadata?.chunks_found && (
                        <span style={styles.chatMessageMeta}>
                          • {message.metadata.chunks_found} sources • {message.metadata.search_method}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator for AI responses */}
              {isChatLoading && (
                <div style={styles.chatMessage}>
                  <div style={{ ...styles.chatMessageContent, ...styles.chatMessageAI }}>
                    <div style={styles.chatTypingIndicator}>
                      <div style={styles.typingDot}></div>
                      <div style={styles.typingDot}></div>
                      <div style={styles.typingDot}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Form - conditional rendering based on summary availability */}
          <form onSubmit={handleChatSubmit} style={styles.chatForm}>
            <div style={styles.chatInputContainer}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={chatState.placeholder}
                // 🔧 REPLACE WITH THIS:
                style={styles.chatInput}
                disabled={isChatLoading}
              />
              <button
                type="submit"
                style={{
                  ...styles.chatSendButton,
                  ...((!chatMessage.trim() || isChatLoading || chatState.disabled) ? styles.chatSendButtonDisabled : {})
                }}
                disabled={!chatMessage.trim() || isChatLoading}
              >
                {isChatLoading ? (
                  <div style={styles.buttonSpinner}></div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          {/* Status message - different based on availability */}
          {chatState.note && (
            <div style={styles.chatNote}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.chatNoteIcon}>
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11M11,9H13V7H11" />
              </svg>
              {chatState.note}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 🔄 FIXED: Enhanced cleanup effects with better dependency handling
  useEffect(() => {
    // Cleanup polling on component unmount or when polling state changes
    return () => {
      if (summaryProgressInterval) {
        console.log('🧹 Cleaning up progress polling interval on unmount/change');
        clearInterval(summaryProgressInterval);
      }
    };
  }, [summaryProgressInterval]); // Include dependency to re-run when interval changes

  // 🔄 FIXED: Additional effect to handle polling state changes
  useEffect(() => {
    // If polling is disabled but interval exists, clear it
    if (!isPollingProgress && summaryProgressInterval) {
      console.log('🧹 Polling disabled, clearing interval');
      clearInterval(summaryProgressInterval);
      setSummaryProgressInterval(null);
    }
  }, [isPollingProgress, summaryProgressInterval]);

  // 🔍 DEBUG: Add debugging effects to track state changes
  useEffect(() => {
    console.log('🔍 generatedSummaries state updated:', {
      count: Object.keys(generatedSummaries).length,
      summaries: Object.keys(generatedSummaries),
      detailed: Object.entries(generatedSummaries).map(([type, data]) => ({
        type,
        ready: data.ready,
        hasUrl: !!data.url,
        url: data.url,
        urlValid: data.url && !data.url.startsWith('#')
      }))
    });
  }, [generatedSummaries]);

  useEffect(() => {
    console.log('🔍 Polling state changed:', {
      isPollingProgress,
      isGeneratingSummary,
      hasInterval: !!summaryProgressInterval,
      intervalId: summaryProgressInterval
    });
  }, [isPollingProgress, isGeneratingSummary, summaryProgressInterval]);

  // 🆕 NEW: Chat availability debugging
  useEffect(() => {
    const chatState = getChatState();
    console.log('🔍 Chat state changed:', {
      state: chatState.state,
      disabled: chatState.disabled,
      sourcesCount: files.length + links.length,
      summariesCount: Object.keys(generatedSummaries).filter(key => {
        const data = generatedSummaries[key];
        return data.ready && data.url && !data.url.startsWith('#');
      }).length
    });
  }, [files, links, generatedSummaries]);

  const handleSummaryDropdownClose = (e) => {
    if (!e.target.closest('.summary-dropdown-container')) {
      setShowSummaryDropdown(false);
    }
  };

  // File validation function
  const validateFiles = (fileList) => {
    const validFiles = [];
    const errors = [];
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.csv', '.xlsx', '.xls'];
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB

    Array.from(fileList).forEach(file => {
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();

      // Check file type
      if (!allowedExtensions.includes(fileExt)) {
        errors.push(`${file.name}: Unsupported file type (${fileExt})`);
        return;
      }

      // Check file size
      if (file.size > MAX_SIZE) {
        errors.push(`${file.name}: File too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max 50MB)`);
        return;
      }

      // Check if file is not empty
      if (file.size === 0) {
        errors.push(`${file.name}: File is empty`);
        return;
      }

      validFiles.push(file);
    });

    return { validFiles, errors };
  };

  // 🔧 SIMPLIFIED: loadNotebookData compatible with Lambda response
  useEffect(() => {
    const loadNotebookData = async () => {
      if (!initialNotebookId || initialNotebookId === 'temp-loading') {
        setNotebook({
          notebookId: null,
          title: 'New Notebook',
          content: '',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          files: [],
          links: []
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('📖 Loading notebook:', initialNotebookId);

        // 🔧 SIMPLIFIED: Use the fixed getNotebookWithSummaries method
        let notebookData;
        try {
          notebookData = await notebookService.getNotebookWithSummaries(initialNotebookId);
        } catch (enhancedError) {
          console.warn('⚠️ Enhanced fetch failed, using basic getNotebook');
          notebookData = await notebookService.getNotebook(initialNotebookId);
        }

        if (notebookData) {
          // 🔧 SIMPLIFIED: Direct mapping from Lambda response
          const formattedNotebook = {
            notebookId: notebookData.notebookId || initialNotebookId,
            title: notebookData.title || 'Untitled Notebook',
            content: notebookData.content || '',
            createdAt: notebookData.createdAt || new Date().toISOString(),
            lastUpdated: notebookData.updatedAt || new Date().toISOString(),
            files: notebookData.files || [],
            links: notebookData.links || [],
            createdBy: notebookData.createdBy,
            wordCount: notebookData.wordCount || 0,
            tags: notebookData.tags || [],
            connections: notebookData.connections || [],
            filesCount: notebookData.filesCount || 0,
            filesSummary: notebookData.filesSummary,
            linksCount: notebookData.linksCount || 0,
            linksSummary: notebookData.linksSummary,

            // 🔧 SIMPLIFIED: Summary data directly from Lambda
            summaryTypesAvailable: Object.keys(notebookData.summaries || {}),
            summaryTypes: notebookData.summaryTypes || [],
            lastSummarization: notebookData.lastSummarization,
            summarizationStatus: notebookData.summarizationStatus,
            hasSummaries: notebookData.hasSummaries || false
          };

          // 🔧 SIMPLIFIED: Use summaries directly from getNotebook response
          const initialSummaries = notebookData.summaries || {};

          console.log('✅ Notebook loaded with summaries:', {
            title: formattedNotebook.title,
            summariesCount: Object.keys(initialSummaries).length,
            summaryTypes: Object.keys(initialSummaries),
            hasSummaries: formattedNotebook.hasSummaries
          });

          // Update states
          setGeneratedSummaries(initialSummaries);
          setNotebook(formattedNotebook);
          setContent(formattedNotebook.content);
          setFiles(formattedNotebook.files);
          setLinks(formattedNotebook.links);

          console.log('✅ Notebook loaded:', {
            title: formattedNotebook.title,
            summariesCount: Object.keys(initialSummaries).length,
            summaryTypes: Object.keys(initialSummaries)
          });
        }
      } catch (error) {
        console.error('❌ Failed to load notebook:', error.message);

        // 🔧 SIMPLIFIED: localStorage recovery
        if (initialNotebookId) {
          try {
            console.log('🔄 Attempting localStorage recovery...');
            const savedNotebooks = localStorage.getItem('notebooks');
            if (savedNotebooks) {
              const notebooksArray = JSON.parse(savedNotebooks);
              const savedNotebook = notebooksArray.find(nb =>
                nb.notebookId === initialNotebookId || nb.id === initialNotebookId
              );

              if (savedNotebook) {
                console.log('✅ Recovered from localStorage');
                setNotebook(savedNotebook);
                setContent(savedNotebook.content || '');
                setFiles(savedNotebook.files || []);
                setLinks(savedNotebook.links || []);

                // Recover summaries if available
                if (savedNotebook.generatedSummaries) {
                  setGeneratedSummaries(savedNotebook.generatedSummaries);
                  console.log('✅ Recovered summaries from localStorage:', Object.keys(savedNotebook.generatedSummaries));
                }
              }
            }
          } catch (recoveryError) {
            console.error('❌ localStorage recovery failed:', recoveryError.message);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadNotebookData();
  }, [initialNotebookId]);

  // 🆕 ENHANCED: Auto-save function that preserves all summary types
  useEffect(() => {
    // Auto-save generated summaries to localStorage and backend
    const saveSummaryData = async () => {
      if (Object.keys(generatedSummaries).length > 0 && notebook.notebookId && notebook.notebookId !== 'temp-loading') {
        try {
          console.log('💾 Auto-saving ALL summary types...', {
            notebookId: notebook.notebookId,
            summariesCount: Object.keys(generatedSummaries).length,
            summaryTypes: Object.keys(generatedSummaries)
          });

          // 1. Save to localStorage (immediate backup) with ALL summaries
          const savedNotebooks = localStorage.getItem('notebooks');
          let notebooksArray = [];

          if (savedNotebooks) {
            notebooksArray = JSON.parse(savedNotebooks);
          }

          const notebookIndex = notebooksArray.findIndex(nb =>
            nb.notebookId === notebook.notebookId || nb.id === notebook.notebookId
          );

          const updatedNotebookData = {
            ...notebook,
            generatedSummaries: generatedSummaries,  // ALL summary types
            summaryTypesAvailable: Object.keys(generatedSummaries),
            lastSummarization: new Date().toISOString()
          };

          if (notebookIndex >= 0) {
            // 🔧 MERGE summaries instead of replacing
            const existingNotebook = notebooksArray[notebookIndex];
            const existingSummaries = existingNotebook.generatedSummaries || {};

            notebooksArray[notebookIndex] = {
              ...updatedNotebookData,
              generatedSummaries: { ...existingSummaries, ...generatedSummaries }  // MERGE
            };
          } else {
            notebooksArray.push(updatedNotebookData);
          }

          localStorage.setItem('notebooks', JSON.stringify(notebooksArray));
          console.log('✅ Saved ALL summary types to localStorage:', {
            types: Object.keys(generatedSummaries),
            count: Object.keys(generatedSummaries).length
          });

          // 2. Save to backend (if available) with ALL summaries
          try {
            const updateData = {
              title: notebook.title,
              chunkNumber: 0,
              chunkContent: content,
              links: links,
              summaryData: generatedSummaries,  // Include ALL summary data
              summaryTypesAvailable: Object.keys(generatedSummaries)
            };

            await notebookService.updateNotebook(notebook.notebookId, updateData);
            console.log('✅ Saved ALL summary types to backend');

          } catch (backendError) {
            console.warn('⚠️ Failed to save to backend:', backendError.message);
            // Don't fail if backend save fails - localStorage backup exists
          }

        } catch (error) {
          console.error('❌ Error saving summary data:', error);
        }
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveSummaryData, 1000);
    return () => clearTimeout(timeoutId);
  }, [generatedSummaries, notebook.notebookId]); // Trigger when summaries change

  // 🆕 ENHANCED: Update saveSummariesToBackend to save all summary types
  const saveSummariesToBackend = async () => {
    if (Object.keys(generatedSummaries).length > 0 && notebook.notebookId) {
      try {
        console.log('💾 Saving ALL summary types to backend...', {
          notebookId: notebook.notebookId,
          summaryTypes: Object.keys(generatedSummaries),
          summariesCount: Object.keys(generatedSummaries).length
        });

        // 🆕 ENHANCED: Prepare summary data for backend storage
        const summaryUpdateData = {
          summaryData: generatedSummaries,  // All summary types
          summaryTypesAvailable: Object.keys(generatedSummaries),
          lastSummarization: new Date().toISOString(),
          summariesCount: Object.keys(generatedSummaries).length
        };

        console.log('📤 Sending summary data to backend:', summaryUpdateData);

        // Use a separate endpoint for summary metadata if available
        if (notebookService.updateNotebookSummaries) {
          await notebookService.updateNotebookSummaries(notebook.notebookId, summaryUpdateData);
        } else {
          // Fallback to regular update
          await notebookService.updateNotebook(notebook.notebookId, {
            title: notebook.title,
            chunkNumber: 0,
            chunkContent: content,
            links: links,
            ...summaryUpdateData
          });
        }

        console.log('✅ Successfully saved ALL summary types to backend:', {
          savedTypes: Object.keys(generatedSummaries),
          count: Object.keys(generatedSummaries).length
        });

      } catch (error) {
        console.error('❌ Failed to save summaries to backend:', error);
      }
    }
  };

  // 🔄 ENHANCED: Update your handleSave function to include summary data
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const currentNotebookId = notebook.notebookId;

      if (!currentNotebookId || currentNotebookId === 'temp-loading') {
        setIsSaving(false);
        return;
      }

      const updatedNotebook = {
        ...notebook,
        notebookId: currentNotebookId,
        title: notebook.title,
        content: content,
        lastUpdated: new Date().toISOString(),
        files: files,
        links: links,
        // 🆕 NEW: Include summary data
        summaryTypesAvailable: Object.keys(generatedSummaries),
        lastSummarization: Object.keys(generatedSummaries).length > 0 ? new Date().toISOString() : notebook.lastSummarization
      };

      setNotebook(updatedNotebook);

      // 🆕 ENHANCED: Include summary data in update
      const updateData = {
        title: updatedNotebook.title,
        chunkNumber: 0,
        chunkContent: content,
        links: links,
        // 🆕 NEW: Summary metadata
        summaryData: generatedSummaries,
        summaryTypesAvailable: Object.keys(generatedSummaries),
        lastSummarization: updatedNotebook.lastSummarization
      };

      try {
        console.log('💾 Saving notebook with summary data:', {
          notebookId: currentNotebookId,
          summariesCount: Object.keys(generatedSummaries).length,
          summaryTypes: Object.keys(generatedSummaries)
        });

        await notebookService.updateNotebook(currentNotebookId, updateData);
        console.log('✅ Successfully saved notebook with summaries to backend');
      } catch (apiError) {
        console.error("❌ Error saving to API:", apiError);
      }

      // localStorage backup logic (enhanced)
      const savedNotebooks = localStorage.getItem('notebooks');
      let notebooksArray = [];

      if (savedNotebooks) {
        notebooksArray = JSON.parse(savedNotebooks);
        const idToCheck = currentNotebookId;
        let notebookIndex = notebooksArray.findIndex(nb => nb.id === idToCheck);

        if (notebookIndex === -1) {
          notebookIndex = notebooksArray.findIndex(nb => nb.notebookId === idToCheck);
        }

        if (notebookIndex >= 0) {
          notebooksArray[notebookIndex] = {
            ...updatedNotebook,
            id: idToCheck,
            notebookId: idToCheck,
            // 🆕 NEW: Include summary data in localStorage
            generatedSummaries: generatedSummaries
          };
        } else {
          notebooksArray.push({
            ...updatedNotebook,
            id: idToCheck,
            notebookId: idToCheck,
            // 🆕 NEW: Include summary data in localStorage
            generatedSummaries: generatedSummaries
          });
        }
      } else {
        const idToStore = currentNotebookId;
        notebooksArray = [{
          ...updatedNotebook,
          id: idToStore,
          notebookId: idToStore,
          // 🆕 NEW: Include summary data in localStorage
          generatedSummaries: generatedSummaries
        }];
      }

      localStorage.setItem('notebooks', JSON.stringify(notebooksArray));
      console.log('✅ Saved notebook with summaries to localStorage');

      setLastSaved(new Date());

      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    } catch (error) {
      console.error("❌ Error saving notebook:", error);
      setIsSaving(false);
    }
  };

  // 🔍 DEBUG: Add this to your NotebookDetailPage component
  window.debugCurrentSummaryFormat = async () => {
    const notebookId = notebook?.notebookId;

    if (!notebookId) {
      console.error('❌ No notebook loaded');
      return;
    }

    try {
      console.log('🔍 DEBUGGING CURRENT SUMMARY FORMAT:');

      // Get raw response from current getNotebook
      const response = await notebookService.getNotebook(notebookId, {
        includeSummaryContent: true
      });

      console.log('📡 Current getNotebook response:', response);

      // Check what we got
      console.log('📋 Summary Analysis:');
      console.log('  - summariesCount:', response.summariesCount);
      console.log('  - summaryTypes:', response.summaryTypes);
      console.log('  - hasSummaries:', response.hasSummaries);
      console.log('  - summaries object:', response.summaries);

      if (response.summaries && Object.keys(response.summaries).length > 0) {
        console.log('📄 Individual summaries:');
        for (const [type, data] of Object.entries(response.summaries)) {
          console.log(`  ${type}:`, {
            hasUrl: !!data.url,
            url: data.url,
            hasContent: data.hasContent,
            contentLength: data.content?.length || 0,
            ready: data.ready,
            source: data.source
          });
        }

        // Test fetching content for summaries without content
        console.log('🔄 Testing content fetching...');
        for (const [type, data] of Object.entries(response.summaries)) {
          if (data.url && data.url.startsWith('s3://') && !data.hasContent) {
            try {
              console.log(`📥 Trying to fetch content for ${type}...`);
              const content = await notebookService.fetchSummaryFromS3(data.url, notebookId, type);
              console.log(`✅ Fetched ${type} content: ${content.length} characters`);
            } catch (fetchError) {
              console.log(`❌ Failed to fetch ${type} content:`, fetchError.message);
            }
          }
        }
      } else {
        console.log('📄 No summaries found in processed response');
      }

      // Check React state
      console.log('⚛️ Current React State:');
      console.log('  - generatedSummaries:', generatedSummaries);
      console.log('  - generatedSummaries count:', Object.keys(generatedSummaries || {}).length);

      return {
        notebookResponse: response,
        reactState: generatedSummaries,
        hasSummariesInResponse: response.summariesCount > 0,
        hasSummariesInReact: Object.keys(generatedSummaries || {}).length > 0
      };

    } catch (error) {
      console.error('❌ Debug error:', error);
      return { error: error.message };
    }
  };

  // 🔧 QUICK FIX: Force update summaries from notebook response
  window.forceUpdateSummaries = async () => {
    const notebookId = notebook?.notebookId;

    if (!notebookId) {
      console.error('❌ No notebook loaded');
      return;
    }

    try {
      console.log('🔄 Force updating summaries...');

      const freshNotebook = await notebookService.getNotebook(notebookId, {
        includeSummaryContent: true
      });

      if (freshNotebook.summaries && Object.keys(freshNotebook.summaries).length > 0) {
        console.log('✅ Found summaries, updating React state:', Object.keys(freshNotebook.summaries));
        setGeneratedSummaries(freshNotebook.summaries);

        // Also update notebook state
        setNotebook(prev => ({
          ...prev,
          hasSummaries: true,
          summariesCount: freshNotebook.summariesCount,
          summaryTypes: Object.keys(freshNotebook.summaries)
        }));

        console.log('✅ React state updated with summaries');
        return freshNotebook.summaries;
      } else {
        console.log('⚠️ No summaries found in fresh notebook response');
        return {};
      }

    } catch (error) {
      console.error('❌ Force update failed:', error);
    }
  };

  // 🔧 UTILITY: Force refresh summaries from backend
  window.forceRefreshSummaries = async () => {
    if (!notebook?.notebookId) {
      console.error('❌ No notebook loaded');
      return;
    }

    try {
      console.log('🔄 Force refreshing summaries from backend...');
      const reloadedNotebook = await notebookService.getNotebook(notebook.notebookId, {
        includeSummaryContent: true
      });

      console.log('✅ Reloaded notebook summaries:', {
        summariesCount: reloadedNotebook.summariesCount,
        summaryTypes: Object.keys(reloadedNotebook.summaries || {}),
        summaries: reloadedNotebook.summaries
      });

      // Update the state with reloaded summaries
      if (reloadedNotebook.summaries) {
        setGeneratedSummaries(reloadedNotebook.summaries);
        console.log('✅ Updated React state with reloaded summaries');
      }

      return reloadedNotebook.summaries;
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
    }
  };

  // 🔍 DEBUG: Add this function to help troubleshoot summary persistence
  window.debugSummaryState = () => {
    console.log('🔍 SUMMARY STATE DEBUG REPORT:', {
      timestamp: new Date().toISOString(),

      // Current React state
      reactState: {
        notebookId: notebook?.notebookId,
        title: notebook?.title,
        summaryTypesAvailable: notebook?.summaryTypesAvailable,
        generatedSummariesCount: Object.keys(generatedSummaries || {}).length,
        generatedSummariesTypes: Object.keys(generatedSummaries || {}),
        generatedSummariesDetails: generatedSummaries
      },

      // LocalStorage state
      localStorage: (() => {
        try {
          const saved = localStorage.getItem('notebooks');
          if (saved) {
            const notebooks = JSON.parse(saved);
            const current = notebooks.find(nb =>
              nb.notebookId === notebook?.notebookId || nb.id === notebook?.notebookId
            );
            return {
              hasNotebook: !!current,
              hasSummaries: !!(current?.generatedSummaries),
              summariesCount: Object.keys(current?.generatedSummaries || {}).length,
              summaryTypes: Object.keys(current?.generatedSummaries || {}),
              summariesDetails: current?.generatedSummaries
            };
          }
          return { hasData: false };
        } catch (e) {
          return { error: e.message };
        }
      })(),

      // Check if notebook service method exists
      notebookService: {
        hasGetNotebook: typeof notebookService?.getNotebook === 'function',
        hasGetNotebookWithSummaries: typeof notebookService?.getNotebookWithSummaries === 'function',
        hasEnhanceSummariesWithContent: typeof notebookService?.enhanceSummariesWithContent === 'function'
      }
    });
  };

  // 🔧 UTILITY: Test function to manually reload summaries
  window.testSummaryReload = async () => {
    if (!notebook?.notebookId) {
      console.error('❌ No notebook loaded');
      return;
    }

    try {
      console.log('🔄 Testing summary reload...');
      const reloadedNotebook = await notebookService.getNotebook(notebook.notebookId, {
        includeSummaryContent: true
      });

      console.log('✅ Reloaded notebook:', {
        summariesCount: reloadedNotebook.summariesCount,
        summaryTypes: Object.keys(reloadedNotebook.summaries || {}),
        summaries: reloadedNotebook.summaries
      });

      return reloadedNotebook;
    } catch (error) {
      console.error('❌ Reload test failed:', error);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFileSelection(droppedFiles);
    } else {
      // Handle dropped URLs for links
      const droppedText = e.dataTransfer.getData('text');
      if (droppedText && isValidUrl(droppedText)) {
        setLinkToAdd(droppedText.trim());
        setShowLinkModal(true);
      }
    }
  };

  // File input change handler
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      handleFileSelection(selectedFiles);
    }
    e.target.value = ''; // Reset input
  };

  // New function to handle file selection and show confirmation modal
  const handleFileSelection = (selectedFiles) => {
    // Clear previous errors
    setFileErrors([]);

    // Validate files
    const { validFiles, errors } = validateFiles(selectedFiles);

    if (errors.length > 0) {
      setFileErrors(errors);
    }

    if (validFiles.length > 0) {
      // Show confirmation modal with valid files
      setFilesToUpload(validFiles);
      setShowUploadModal(true);
    }
  };

  // Function to handle upload confirmation
  const handleUploadConfirm = async () => {
    if (!notebook.notebookId || notebook.notebookId === 'temp-loading') {
      setFileErrors(['Please save the notebook before uploading files']);
      setShowUploadModal(false);
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    try {
      // Initialize progress tracking
      const initialProgress = {};
      filesToUpload.forEach(file => {
        initialProgress[file.name] = { status: 'uploading', progress: 0 };
      });
      setUploadProgress(initialProgress);

      // Upload files using the notebook service
      const uploadResult = await notebookService.uploadFiles(notebook.notebookId, filesToUpload);

      // Update progress for successful uploads
      const updatedProgress = { ...initialProgress };
      uploadResult.successful.forEach(result => {
        updatedProgress[result.originalFile.name] = {
          status: 'completed',
          progress: 100,
          fileId: result.fileId
        };
      });

      // Update progress for failed uploads
      uploadResult.failed.forEach(failure => {
        updatedProgress[failure.fileName] = {
          status: 'error',
          progress: 0,
          error: failure.error
        };
      });

      setUploadProgress(updatedProgress);

      // Add successful files to the files state
      const newFiles = uploadResult.successful.map(result => ({
        id: result.fileId,
        name: result.fileName || result.originalFile.name,
        size: result.fileSize || result.originalFile.size,
        type: result.fileType || result.originalFile.type,
        lastModified: new Date().toISOString(),
        s3Url: result.s3Url,
        uploadedAt: result.uploadedAt || new Date().toISOString()
      }));

      setFiles(prevFiles => [...prevFiles, ...newFiles]);

      // Show errors for failed uploads
      if (uploadResult.failed.length > 0) {
        setFileErrors(prev => [
          ...prev,
          ...uploadResult.failed.map(failure => `${failure.fileName}: ${failure.error}`)
        ]);
      }

      // Close modal after successful upload
      setTimeout(() => {
        setShowUploadModal(false);
        setFilesToUpload([]);
      }, 1500);

    } catch (error) {
      console.error('File upload error:', error);
      setFileErrors(prev => [...prev, `Upload failed: ${error.message}`]);

      // Update progress to show error state
      const errorProgress = {};
      filesToUpload.forEach(file => {
        errorProgress[file.name] = { status: 'error', progress: 0, error: error.message };
      });
      setUploadProgress(errorProgress);

      // Close modal on error
      setTimeout(() => {
        setShowUploadModal(false);
        setFilesToUpload([]);
      }, 2000);
    } finally {
      setIsUploading(false);

      // Clear progress after 5 seconds
      setTimeout(() => {
        setUploadProgress({});
      }, 5000);
    }
  };

  // Function to handle upload cancellation
  const handleUploadCancel = () => {
    setShowUploadModal(false);
    setFilesToUpload([]);
    setUploadProgress({});
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const buildLinkObject = (url) => ({
    id: `link-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    url,
    title: url,
    addedAt: new Date().toISOString(),
    status: 'pending'
  });

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!newLink) return;
    if (!isValidUrl(newLink)) {
      setFileErrors(prev => [...prev, '❌ Invalid URL']);
      return;
    }
    setLinkToAdd(newLink.trim());
    setShowLinkModal(true);
  };

  // Enhanced link confirmation with better state management
  const handleLinkConfirm = async () => {
    if (!linkToAdd) return;
    setIsAddingLink(true);

    const newObj = {
      ...buildLinkObject(linkToAdd),
      status: 'processing'
    };

    console.log('🔗 Adding new link:', newObj);

    // Add link to state immediately for optimistic UI
    setLinks(prev => {
      const updated = [...prev, newObj];
      console.log('🔗 Updated links state:', updated);
      return updated;
    });

    setShowLinkModal(false);
    setNewLink('');
    setLinkToAdd('');

    try {
      console.log('🎥 Starting YouTube processing for:', newObj.url);
      const res = await notebookService.addYouTubeLink(
        notebook.notebookId,
        newObj.url,
        'mp3'
      );

      console.log('✅ YouTube processing response:', res);

      // Update link status to completed
      setLinks(prev => {
        const updated = prev.map(link =>
          link.id === newObj.id
            ? { ...link, status: 'completed' }
            : link
        );
        console.log('✅ Updated links after completion:', updated);
        return updated;
      });

      // Save to backend with updated links
      const currentLinks = links.filter(l => l.id !== newObj.id);
      const finalLinks = [...currentLinks, { ...newObj, status: 'completed' }];

      await notebookService.updateNotebook(notebook.notebookId, {
        links: finalLinks,
        chunkNumber: 0,
        chunkContent: content
      });

      console.log('💾 Saved links to backend:', finalLinks);

    } catch (err) {
      console.error('❌ addYouTubeLink failed:', err.message);

      // Update link status to error
      setLinks(prev => {
        const updated = prev.map(link =>
          link.id === newObj.id
            ? { ...link, status: 'error', error: err.message }
            : link
        );
        console.log('❌ Updated links after error:', updated);
        return updated;
      });

      // Only roll back on true client errors (4xx except 429)
      const status = err.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        setLinks(prev => prev.filter(l => l.id !== newObj.id));
        setFileErrors(p => [...p, `Link failed: ${err.message}`]);
      }
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleLinkCancel = () => {
    setShowLinkModal(false);
    setLinkToAdd('');
  };

  const removeFile = async (fileId) => {
    try {
      if (fileId && !fileId.startsWith('file-')) {
        await notebookService.deleteFile(notebook.notebookId, fileId);
      }

      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));

    } catch (error) {
      console.error('Error removing file:', error);
      setFileErrors(prev => [...prev, `Failed to remove file: ${error.message}`]);
      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    }
  };

  const removeLink = (linkId) => {
    console.log('🗑️ Removing link:', linkId);
    setLinks(prevLinks => {
      const updated = prevLinks.filter(link => link.id !== linkId);
      console.log('🗑️ Updated links after removal:', updated);
      return updated;
    });
  };

  // 🔧 UPDATED: Enhanced chat submit handler without availability restrictions
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    // 🔧 REMOVED: No more availability checks - chat is always enabled
    const userMessage = chatMessage.trim();
    setChatMessage('');
    setIsChatLoading(true);

    // Add user message to chat
    addChatMessage(userMessage, 'user');

    try {
      // Send message to AI
      const aiResponse = await sendChatMessage(userMessage);

      // Add AI response to chat with metadata
      const responseMetadata = {
        sources: aiResponse.sources,
        chunks_found: aiResponse.chunks_found,
        search_method: aiResponse.search_method
      };

      addChatMessage(aiResponse.answer, 'ai', 'message', responseMetadata);

      // Optionally add sources information as a separate system message
      if (aiResponse.sources && aiResponse.sources.length > 0) {
        const sourcesText = `📚 Sources used: ${aiResponse.sources.map((s, i) =>
          `${i + 1}. ${s.filename} (${s.content_type})`
        ).join(', ')}`;

        addChatMessage(sourcesText, 'system', 'sources', { sources: aiResponse.sources });
      }

    } catch (error) {
      console.error('❌ Chat error:', error);

      let errorMsg = 'Sorry, I encountered an error. ';
      if (error.message.includes('login')) {
        errorMsg += 'Please make sure you\'re logged in.';
      } else if (error.message.includes('vector database') || error.message.includes('no_vector_db')) {
        errorMsg += 'I can still help with general questions, but for specific answers about your content, try uploading files or generating summaries first.';
      } else {
        errorMsg += 'Please try again in a moment.';
      }

      addChatMessage(errorMsg, 'ai', 'error');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Helper functions for file display
  const getFileTypeColor = (extension) => {
    const colors = {
      'PDF': '#dc2626', 'DOC': '#2563eb', 'DOCX': '#2563eb',
      'CSV': '#059669', 'XLSX': '#059669', 'XLS': '#059669',
      '.pdf': '#dc2626', '.doc': '#2563eb', '.docx': '#2563eb',
      '.csv': '#059669', '.xlsx': '#059669', '.xls': '#059669'
    };
    return colors[extension] || '#6b7280';
  };

  const getFileTypeIcon = (extension) => {
    const ext = extension?.toUpperCase();
    if (ext === 'PDF' || ext === '.PDF') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2Z" />
        </svg>
      );
    } else if (ext === 'DOC' || ext === 'DOCX' || ext === '.DOC' || ext === '.DOCX') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6,2H14L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M18,20V9H13V4H6V20H18Z" />
        </svg>
      );
    } else if (ext === 'CSV' || ext === 'XLSX' || ext === 'XLS' || ext === '.CSV' || ext === '.XLSX' || ext === '.XLS') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 13.06L8.18 15.28H9.97L8 12.06L9.93 8.89H8.22L7.13 10.9L7.09 10.96L7.06 11.03Q6.8 10.5 6.5 9.96 6.25 9.43 6.07 8.89H4.25L6.2 12.1L4.32 15.28H6.04" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z" />
      </svg>
    );
  };

  // Helper function to render links
  const renderLinks = () => {
    console.log('🔗 Rendering links, current links state:', links);

    return (
      <div style={styles.linksList}>
        <h3 style={styles.linksTitle}>Links ({links.length})</h3>
        {links.map(link => (
          <div key={link.id} style={styles.linkItem}>
            {/* link icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={styles.linkIcon}
            >
              <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z" />
            </svg>

            {/* clickable URL */}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.linkText}
              title={link.url}
            >
              {link.title}
            </a>

            {/* Status indicator and remove button */}
            <div style={styles.linkActions}>
              {/* Status icon */}
              {link.status === 'processing' && (
                <div style={styles.linkSpinner} title="Processing…">
                  <div style={styles.spinner16}></div>
                </div>
              )}

              {link.status === 'completed' && (
                <div style={styles.linkCompleted} title="Transcription completed">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                  </svg>
                </div>
              )}

              {link.status === 'error' && (
                <div style={styles.linkError} title={`Error: ${link.error}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                  </svg>
                </div>
              )}

              {/* Remove button - always show */}
              <button
                onClick={() => removeLink(link.id)}
                style={styles.removeButton}
                title="Remove"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 🔍 DEBUG: Add test function to verify state (accessible in browser console)
  window.debugSummarySystem = () => {
    console.log('🔍 SUMMARY SYSTEM DEBUG REPORT:', {
      timestamp: new Date().toISOString(),
      polling: {
        isPollingProgress,
        isGeneratingSummary,
        hasInterval: !!summaryProgressInterval,
        intervalId: summaryProgressInterval
      },
      summaries: {
        count: Object.keys(generatedSummaries).length,
        types: Object.keys(generatedSummaries),
        data: generatedSummaries
      },
      progress: summaryProgress,
      ui: {
        summariesSectionVisible: Object.keys(generatedSummaries).length > 0,
        chatMessagesCount: chatMessages.length
      }
    });
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <main style={styles.main}>
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Loading notebook...</p>
          </div>
          <UploadConfirmationModal
            isOpen={showUploadModal}
            onClose={handleUploadCancel}
            onConfirm={handleUploadConfirm}
            files={filesToUpload}
            isUploading={isUploading}
          />
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar />

      <main style={styles.main}>
        {/* Header - Simplified without title */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={handleBack} style={styles.backButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              Back to Notebooks
            </button>
          </div>
          <div style={styles.headerRight}>
            <button
              onClick={handleSave}
              style={{
                ...styles.saveButton,
                ...(isSaving ? styles.savingButton : {})
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div style={styles.contentLayout}>
          {/* Conditional rendering for summary page vs main notebook view */}
          {showSummaryPage && currentSummaryPage ? (
            /* Summary Page View */
            <div style={styles.summaryPageContainer}>
              <div style={styles.summaryPageHeader}>
                <button onClick={closeSummaryPage} style={styles.backToNotebookButton}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                  Back to Notebook
                </button>
                <div style={styles.summaryPageTitle}>
                  <h1 style={styles.summaryPageMainTitle}>
                    {getFormattedSummaryName(currentSummaryPage)}
                  </h1>
                  <p style={styles.summaryPageSubtitle}>
                    Generated for: {notebook.title}
                  </p>
                </div>
              </div>

              <div style={styles.summaryPageContent}>
                {generatedSummaries[currentSummaryPage]?.content ? (
                  <div style={styles.summaryPageText}>
                    <div style={styles.summaryPageMeta}>
                      <span style={styles.summaryPageMetaItem}>
                        📅 Generated: {new Date(generatedSummaries[currentSummaryPage].generatedAt || Date.now()).toLocaleString()}
                      </span>
                      <span style={styles.summaryPageMetaItem}>
                        📊 Type: {currentSummaryPage}
                      </span>
                      <span style={styles.summaryPageMetaItem}>
                        📄 Sources: {files.length + links.length}
                      </span>
                    </div>

                    <div style={styles.summaryPageTextContent}>
                      {generatedSummaries[currentSummaryPage].content}
                    </div>

                    <div style={styles.summaryPageActions}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedSummaries[currentSummaryPage].content);
                        }}
                        style={styles.summaryPageCopyButton}
                      >
                        📋 Copy Summary
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([generatedSummaries[currentSummaryPage].content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${notebook.title}_${currentSummaryPage}_summary.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        style={styles.summaryPageDownloadButton}
                      >
                        💾 Download Summary
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.summaryPageLoading}>
                    <div style={styles.summaryPageLoadingSpinner}></div>
                    <p>Loading summary...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Main Notebook View */
            <>
              {/* Central Sources/Upload Area - Similar to NotebookLM */}
              <div style={styles.centralArea}>
                {/* Sources Section with Title */}
                <div style={styles.sourcesSection}>
                  {/* Title and Upload Area - Side by Side */}
                  <div style={styles.titleAndUploadContainer}>
                    {/* Title Section - Left Side */}
                    <div style={styles.titleSection}>
                      <div style={styles.titleContainer}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={styles.notebookIcon}>
                          <path d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,2.75A1.25,1.25 0 0,1 13.25,4A1.25,1.25 0 0,1 12,5.25A1.25,1.25 0 0,1 10.75,4A1.25,1.25 0 0,1 12,2.75Z" />
                        </svg>
                        <div style={styles.titleContent}>
                          <input
                            type="text"
                            value={notebook.title}
                            onChange={(e) => setNotebook({ ...notebook, title: e.target.value })}
                            style={styles.titleInput}
                            placeholder="Untitled Notebook"
                          />
                          <div style={styles.titleSubtext}>
                            {formatDate(lastSaved || notebook.lastUpdated)}
                            {(files.length > 0 || links.length > 0) && (
                              <span style={styles.titleSeparator}>•</span>
                            )}
                            {files.length > 0 && (
                              <span style={styles.titleCounter}>
                                {files.length} file{files.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {links.length > 0 && (
                              <>
                                {files.length > 0 && <span style={styles.titleSeparator}>,</span>}
                                <span style={styles.titleCounter}>
                                  {links.length} link{links.length !== 1 ? 's' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Upload Area - Right Side */}
                    <div
                      style={{
                        ...styles.uploadArea,
                        ...(isDraggingOver ? styles.uploadAreaActive : {})
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        id="fileInput"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.csv,.xlsx,.xls"
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                      />

                      <div style={styles.uploadContent}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={styles.uploadIcon}>
                          <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                        </svg>
                        <h3 style={styles.uploadTitle}>
                          Ready to start? Add your sources
                        </h3>
                        <p style={styles.uploadDescription}>
                          Drag and drop files here, or click to browse
                        </p>
                        <button
                          style={styles.uploadButton}
                          onClick={() => document.getElementById('fileInput')?.click()}
                        >
                          Select Files
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Error Display */}
                  {fileErrors.length > 0 && (
                    <div style={styles.errorContainer}>
                      <div style={styles.errorHeader}>
                        <span>Notifications</span>
                        <button onClick={() => setFileErrors([])} style={styles.clearButton}>Clear</button>
                      </div>
                      {fileErrors.map((error, index) => (
                        <div key={index} style={styles.errorItem}>{error}</div>
                      ))}
                    </div>
                  )}

                  {/* Link Input */}
                  <div style={styles.linkSection}>
                    <input
                      type="text"
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      placeholder="Add a link (https://...)"
                      style={styles.linkInput}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddLink(e)}
                    />
                    <button onClick={handleAddLink} style={styles.addLinkButton}>
                      Add Link
                    </button>
                  </div>

                  {/* Files and Links Container - Centered */}
                  <div style={styles.filesLinksContainer}>
                    {/* Files List */}
                    {files.length > 0 && (
                      <div style={styles.filesList}>
                        <h3 style={styles.filesTitle}>Uploaded Files ({files.length})</h3>
                        {files.map(file => (
                          <div key={file.id} style={styles.fileItem}>
                            <div style={styles.fileIcon}>
                              <div style={{
                                ...styles.fileIconBg,
                                backgroundColor: getFileTypeColor(file.extension || file.type)
                              }}>
                                {getFileTypeIcon(file.extension || file.type)}
                              </div>
                            </div>
                            <div style={styles.fileInfo}>
                              <div style={styles.fileName}>{file.name}</div>
                              <div style={styles.fileDetails}>
                                {file.sizeFormatted || `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                                {file.uploadedAt && ` • ${new Date(file.uploadedAt).toLocaleDateString()}`}
                              </div>
                            </div>
                            <div style={styles.fileActions}>
                              {file.downloadUrl && file.isValid !== false && (
                                <button
                                  onClick={() => window.open(file.downloadUrl, '_blank')}
                                  style={styles.actionButton}
                                  title="Download"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => removeFile(file.id)}
                                style={styles.removeButton}
                                title="Remove"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Use the renderLinks function */}
                    {renderLinks()}
                  </div>
                </div>

                {/* 🔄 FIXED: Use renderSummaryButton function */}
                {renderSummaryButton()}
              </div>

              {/* Right Sidebar - Similar to NotebookLM */}
              <div style={styles.rightSidebar}>
                {/* Notes Section - Much Smaller */}
                <div style={styles.notesSection}>
                  <h3 style={styles.notesSectionTitle}>Quick Notes</h3>
                  <div style={styles.notesEditor}>
                    <ReactQuill
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      modules={modules}
                      formats={formats}
                      placeholder="Like to write on your own? Add your notes here..."
                      style={styles.quillEditor}
                    />
                  </div>
                  <div style={styles.notesFooter}>
                    <span style={styles.wordCount}>
                      {getWordCount(content)} words
                    </span>
                  </div>
                </div>

                {/* Notebook Info */}
                <div style={styles.infoSection}>
                  <h3 style={styles.infoTitle}>Notebook Info</h3>
                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>Sources:</span>
                      <span style={styles.infoValue}>{files.length + links.length}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>Files:</span>
                      <span style={styles.infoValue}>{files.length}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>Links:</span>
                      <span style={styles.infoValue}>{links.length}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>Last updated:</span>
                      <span style={styles.infoValue}>
                        {lastSaved ? formatDate(lastSaved) : formatDate(notebook.lastUpdated)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 🔄 FIXED: Use the new renderGeneratedSummariesSection function */}
                {renderGeneratedSummariesSection()}
              </div>
            </>
          )}
        </div>

        {/* 🔄 FIXED: Use the new renderChatSection function */}
        {renderChatSection()}

        {/* Summary View Modal */}
        {showSummaryView && selectedSummaryType && (
          <div style={styles.summaryModal}>
            <div style={styles.summaryModalContent}>
              <div style={styles.summaryModalHeader}>
                <h2 style={styles.summaryModalTitle}>
                  📄 {selectedSummaryType.charAt(0).toUpperCase() + selectedSummaryType.slice(1)} Summary
                </h2>
                <button
                  onClick={() => toggleSummaryView(null)}
                  style={styles.summaryModalClose}
                  className="summary-modal-close"
                >
                  ✕
                </button>
              </div>

              <div style={styles.summaryModalBody}>
                {generatedSummaries[selectedSummaryType]?.content ? (
                  <div style={styles.summaryContent}>
                    <div style={styles.summaryMeta}>
                      <span style={styles.summaryMetaItem}>
                        📅 Generated: {new Date(generatedSummaries[selectedSummaryType].generatedAt || Date.now()).toLocaleString()}
                      </span>
                      <span style={styles.summaryMetaItem}>
                        📊 Type: {selectedSummaryType}
                      </span>
                    </div>

                    <div style={styles.summaryText}>
                      {generatedSummaries[selectedSummaryType].content}
                    </div>

                    <div style={styles.summaryActions}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedSummaries[selectedSummaryType].content);
                        }}
                        style={styles.summaryCopyButton}
                        className="summary-copy-button"
                      >
                        📋 Copy Summary
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([generatedSummaries[selectedSummaryType].content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${notebook.title}_${selectedSummaryType}_summary.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        style={styles.summaryDownloadButton}
                        className="summary-download-button"
                      >
                        💾 Download Summary
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.summaryLoading}>
                    <div style={styles.summaryLoadingSpinner}></div>
                    <p>Loading summary...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Confirmation Modal */}
        <UploadConfirmationModal
          isOpen={showUploadModal}
          onClose={handleUploadCancel}
          onConfirm={handleUploadConfirm}
          files={filesToUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
        <LinkConfirmationModal
          isOpen={showLinkModal}
          onClose={handleLinkCancel}
          onConfirm={handleLinkConfirm}
          link={linkToAdd}
          isAdding={isAddingLink}
        />
      </main>
    </div>
  );
}

const styles = {
  // Progress styles (moved inline to fix initialization error)
  progressContainer: {
    marginTop: '1rem',
    padding: '1rem',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.875rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem'
  },
  progressTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  progressIcon: {
    fontSize: '1rem',
    animation: 'pulse 2s infinite'
  },
  progressStats: {
    color: '#64748b',
    fontSize: '0.8rem',
    fontWeight: '500'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '0.75rem'
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%)',
    backgroundSize: '16px 16px',
    animation: 'progressStripes 1s linear infinite'
  },
  progressDetails: {
    marginBottom: '0.5rem'
  },
  progressText: {
    color: '#475569',
    marginBottom: '0.25rem',
    fontWeight: '500'
  },
  progressTime: {
    color: '#64748b',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  taskId: {
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    padding: '0.125rem 0.25rem',
    borderRadius: '3px',
    fontSize: '0.7rem'
  },
  progressTypeDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid #e2e8f0'
  },
  progressTypeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressTypeName: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500'
  },
  progressTypeStatus: {
    fontSize: '0.75rem',
    fontWeight: '600'
  },

  // Main container styles
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  main: {
    flexGrow: 1,
    background: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh'
  },

  // Header styles
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0
  },
  headerLeft: {
    flex: 1
  },
  headerRight: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease'
  },
  saveButton: {
    padding: '0.5rem 1rem',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease'
  },
  savingButton: {
    background: '#9ca3af',
    cursor: 'not-allowed'
  },

  // Content layout
  contentLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },

  // Central area
  centralArea: {
    flex: 1,
    padding: '2rem 1rem 2rem 1.5rem',
    overflowY: 'auto',
    background: 'white',
    margin: '1rem',
    marginRight: '0.5rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  },

  // Sources section
  sourcesSection: {
    maxWidth: '1000px',
    margin: '0',
    marginLeft: '0',
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },

  // Title and Upload Container
  titleAndUploadContainer: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
    marginBottom: '3rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid #f3f4f6'
  },

  // Title section
  titleSection: {
    flex: '0 0 320px',
    minWidth: '280px'
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem'
  },
  notebookIcon: {
    color: '#4f46e5',
    flexShrink: 0,
    marginTop: '0.25rem'
  },
  titleContent: {
    flex: 1,
    minWidth: 0
  },
  titleInput: {
    border: 'none',
    fontSize: '1.75rem',
    fontWeight: '700',
    padding: '0',
    outline: 'none',
    color: '#111827',
    background: 'transparent',
    width: '100%',
    marginBottom: '0.5rem',
    fontFamily: 'inherit',
    lineHeight: '1.2'
  },
  titleSubtext: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    flexWrap: 'wrap'
  },
  titleSeparator: {
    color: '#d1d5db'
  },
  titleCounter: {
    color: '#4f46e5',
    fontWeight: '500'
  },

  // Upload area
  uploadArea: {
    flex: 1,
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    padding: '2rem 1.5rem',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    background: '#fafafa',
    cursor: 'pointer',
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadAreaActive: {
    borderColor: '#4f46e5',
    background: '#f8faff'
  },
  uploadContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
  },
  uploadIcon: {
    color: '#9ca3af',
    marginBottom: '1rem'
  },
  uploadTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  uploadDescription: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0
  },
  uploadButton: {
    padding: '0.75rem 1.5rem',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
  },

  // Error styles
  errorContainer: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  errorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: '0.5rem'
  },
  clearButton: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    fontSize: '0.75rem',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  errorItem: {
    fontSize: '0.875rem',
    color: '#dc2626',
    marginBottom: '0.25rem'
  },

  // Link section
  linkSection: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '2rem',
    maxWidth: '800px',
    margin: '0 0 2rem 320px',
    paddingLeft: '2rem'
  },
  linkInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.875rem',
    outline: 'none'
  },
  addLinkButton: {
    padding: '0.75rem 1.5rem',
    background: ' #4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.875rem'
  },

  // Files and Links Container
  filesLinksContainer: {
    maxWidth: '800px',
    margin: '0 0 0 320px',
    paddingLeft: '2rem'
  },

  // Files list
  filesList: {
    marginBottom: '2rem'
  },
  filesTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 1rem 0'
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginBottom: '0.5rem'
  },
  fileIcon: {
    flexShrink: 0
  },
  fileIconBg: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  fileInfo: {
    flex: 1,
    minWidth: 0
  },
  fileName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  fileDetails: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.25rem'
  },
  fileActions: {
    display: 'flex',
    gap: '0.5rem',
    flexShrink: 0
  },
  actionButton: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.375rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.375rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Links list
  linksList: {
    marginBottom: '2rem'
  },
  linksTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 1rem 0'
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginBottom: '0.5rem'
  },
  linkIcon: {
    color: '#6b7280',
    flexShrink: 0
  },
  linkText: {
    fontSize: '0.875rem',
    color: '#4f46e5',
    textDecoration: 'none',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  linkSpinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px'
  },
  spinner16: {
    width: '16px',
    height: '16px',
    border: '2px solid #e5e7eb',
    borderTop: '2px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  linkActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0
  },
  linkCompleted: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    color: '#10b981',
    backgroundColor: '#f0fdf4',
    borderRadius: '50%',
    border: '1px solid #bbf7d0'
  },
  linkError: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    borderRadius: '50%',
    border: '1px solid #fecaca'
  },

  // Summary styles
  summaryContainer: {
    marginTop: 'auto',
    paddingTop: '2rem',
    paddingRight: '2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    position: 'relative'
  },
  summaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1.25rem',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
    transition: 'all 0.2s ease',
    minWidth: '140px',
    justifyContent: 'center'
  },
  summaryButtonLoading: {
    background: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: '0 2px 6px rgba(156, 163, 175, 0.2)'
  },
  summaryIcon: {
    flexShrink: 0,
    fontSize: '18px'
  },
  summarySpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    flexShrink: 0
  },
  summaryDropdown: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: '0.5rem',
    width: '280px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    zIndex: 1001
  },
  summaryDropdownHeader: {
    padding: '1rem 1.25rem 0.75rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6'
  },
  summaryOption: {
    width: '100%',
    padding: '1rem 1.25rem',
    background: 'white',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    borderBottom: '1px solid #f9fafb'
  },
  summaryOptionTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: ' #111827',
    marginBottom: '0.25rem'
  },
  summaryOptionDesc: {
    fontSize: '0.8rem',
    color: ' #111827',
    lineHeight: '1.4'
  },

  // Right sidebar
  rightSidebar: {
    width: '320px',
    background: 'white',
    borderLeft: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto'  // ✅ This allows vertical scrolling
  },

  // Notes section
  notesSection: {
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
    flex: '0 0 auto'
  },
  notesSectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 1rem 0'
  },
  notesEditor: {
    height: '200px',
    marginBottom: '0.5rem'
  },
  quillEditor: {
    height: '150px',
    fontSize: '0.875rem'
  },
  notesFooter: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  wordCount: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },

  // Info section
  infoSection: {
    padding: '1.5rem',
    flex: 1
  },
  infoTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 1rem 0'
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  infoValue: {
    fontSize: '0.875rem',
    color: '#111827',
    fontWeight: '500'
  },

  // 🎨 MODERN: Generated Summaries Section - UPDATED
  summariesSection: {
    padding: '1.5rem',
    borderTop: '1px solid #e5e7eb',
    flex: '0 0 auto',  // ✅ Changed from flex: 1 to allow natural height
    background: 'linear-gradient(135deg, #fafafa 0%, #f8fafc 100%)',
    minHeight: 'fit-content'  // ✅ Added to ensure it fits content
  },
  summariesHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #e5e7eb'
  },
  summariesTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  summariesCount: {
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: 'white',
    borderRadius: '12px',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    minWidth: '24px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
  },
  summariesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  summaryCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  summaryCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem'
  },
  summaryTypeIcon: {
    fontSize: '1.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    flexShrink: 0,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  summaryCardTitle: {
    flex: 1,
    minWidth: 0
  },
  summaryTypeName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.25rem',
    lineHeight: 1.2
  },
  summaryStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#059669',
    fontWeight: '500'
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10b981',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },
  summaryCardAction: {
    color: '#6b7280',
    transition: 'all 0.3s ease',
    transform: 'translateX(0)',
    opacity: 0.7
  },
  summaryMetadata: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  metadataItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.8rem',
    transition: 'all 0.2s ease',
    padding: '0.25rem',
    borderRadius: '6px'
  },
  metadataIcon: {
    fontSize: '0.9rem',
    flexShrink: 0,
    width: '16px',
    textAlign: 'center'
  },
  metadataLabel: {
    color: '#6b7280',
    fontWeight: '500',
    minWidth: '60px'
  },
  metadataValue: {
    color: '#111827',
    fontWeight: '600'
  },
  summaryProgress: {
    marginTop: 'auto'
  },
  progressFill: {
    height: '100%',
    width: '100%',
    background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
    borderRadius: '2px'
  },

  // Legacy summary styles (kept for backwards compatibility)
  summariesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  summaryLinkButton: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '0.75rem',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left'
  },
  summaryLinkIcon: {
    fontSize: '1.25rem',
    marginRight: '0.75rem',
    flexShrink: 0
  },
  summaryLinkContent: {
    flex: 1,
    minWidth: 0
  },
  summaryLinkTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#111827',
    marginBottom: '0.25rem'
  },
  summaryLinkMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  summaryLinkDate: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  summaryLinkSize: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  summaryLinkArrow: {
    fontSize: '1rem',
    color: '#4f46e5',
    fontWeight: '600',
    marginLeft: '0.5rem',
    flexShrink: 0
  },

  // Summary Page Styles
  summaryPageContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'white',
    margin: '1rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  },
  summaryPageHeader: {
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #e5e7eb',
    background: '#fafafa',
    flexShrink: 0
  },
  backToNotebookButton: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease',
    marginBottom: '1rem'
  },
  summaryPageTitle: {
    marginLeft: '0.5rem'
  },
  summaryPageMainTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 0.5rem 0',
    lineHeight: '1.2'
  },
  summaryPageSubtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0
  },
  summaryPageContent: {
    flex: 1,
    overflow: 'auto',
    padding: '2rem'
  },
  summaryPageText: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  summaryPageMeta: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap'
  },
  summaryPageMetaItem: {
    fontSize: '0.875rem',
    color: '#6b7280',
    background: '#f3f4f6',
    padding: '0.5rem 1rem',
    borderRadius: '6px'
  },
  summaryPageTextContent: {
    fontSize: '1rem',
    lineHeight: '1.7',
    color: '#374151',
    whiteSpace: 'pre-wrap',
    marginBottom: '2rem',
    background: '#fafafa',
    padding: '2rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  summaryPageActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  summaryPageCopyButton: {
    background: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  summaryPageDownloadButton: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  summaryPageLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '1rem'
  },
  summaryPageLoadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f3f4f6',
    borderRadius: '50%',
    borderTop: '4px solid #4f46e5',
    animation: 'spin 1s linear infinite'
  },

  // Chat section
  chatSection: {
    flexShrink: 0,
    background: 'white',
    borderTop: '1px solid #e5e7eb',
    padding: '1.5rem 2rem',
    maxHeight: '60vh',
    display: 'flex',
    flexDirection: 'column'
  },
  chatContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  chatHeader: {
    textAlign: 'center',
    marginBottom: '1rem',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chatTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    flex: 1,
    textAlign: 'left'
  },
  chatHeaderActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center'
  },
  summariesDropdown: {
    position: 'relative'
  },
  summariesSelect: {
    background: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    color: '#374151',
    cursor: 'pointer',
    minWidth: '120px'
  },
  clearChatButton: {
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  // Chat messages
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '1rem',
    maxHeight: '400px',
    padding: '0.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: '#fafafa'
  },
  chatMessage: {
    marginBottom: '1rem'
  },
  chatMessageContent: {
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    maxWidth: '80%',
    position: 'relative'
  },
  chatMessageUser: {
    background: '#4f46e5',
    color: 'white',
    marginLeft: 'auto',
    borderBottomRightRadius: '4px'
  },
  chatMessageAI: {
    background: 'white',
    border: '1px solid #e5e7eb',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px'
  },
  chatMessageSystem: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    color: '#0369a1',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px'
  },
  chatMessageSummary: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#15803d',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px'
  },
  chatMessageError: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px'
  },
  chatMessageSources: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#475569',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px',
    fontSize: '0.8rem'
  },
  chatMessageText: {
    fontSize: '0.875rem',
    lineHeight: '1.4',
    marginBottom: '0.25rem',
    whiteSpace: 'pre-wrap'
  },
  chatMessageTime: {
    fontSize: '0.75rem',
    opacity: 0.7,
    textAlign: 'right',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chatMessageMeta: {
    fontSize: '0.65rem',
    opacity: 0.8,
    fontStyle: 'italic'
  },

  // Source information
  sourcesInfo: {
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: 'rgba(79, 70, 229, 0.05)',
    borderRadius: '4px',
    border: '1px solid rgba(79, 70, 229, 0.1)'
  },
  sourcesHeader: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#4f46e5',
    marginBottom: '0.25rem'
  },
  sourceItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.25rem',
    marginBottom: '0.125rem',
    fontSize: '0.7rem'
  },
  sourceNumber: {
    fontWeight: '600',
    color: '#4f46e5',
    minWidth: '12px'
  },
  sourceText: {
    color: '#6b7280',
    lineHeight: '1.3'
  },
  sourceScore: {
    color: '#059669',
    fontWeight: '500'
  },

  // Summary actions
  summaryActions: {
    marginTop: '0.5rem',
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  viewSummaryButton: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },

  // Summary modal
  summaryModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '2rem'
  },
  summaryModalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  summaryModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0
  },
  summaryModalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#111827',
    margin: 0
  },
  summaryModalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '6px',
    transition: 'all 0.2s ease'
  },
  summaryModalBody: {
    flex: 1,
    overflow: 'auto',
    padding: '2rem'
  },
  summaryContent: {
    height: '100%'
  },
  summaryMeta: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap'
  },
  summaryMetaItem: {
    fontSize: '0.875rem',
    color: '#6b7280',
    background: '#f3f4f6',
    padding: '0.375rem 0.75rem',
    borderRadius: '6px'
  },
  summaryText: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1.5rem',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    color: '#374151',
    whiteSpace: 'pre-wrap',
    marginBottom: '1.5rem',
    minHeight: '300px',
    overflow: 'auto'
  },
  summaryCopyButton: {
    background: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  summaryDownloadButton: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  summaryLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: '1rem'
  },
  summaryLoadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f3f4f6',
    borderRadius: '50%',
    borderTop: '4px solid #4f46e5',
    animation: 'spin 1s linear infinite'
  },

  // Typing indicator
  chatTypingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem 0'
  },
  typingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#6b7280',
    animation: 'typingAnimation 1.4s infinite ease-in-out'
  },

  // Chat form
  chatForm: {
    marginBottom: '1rem',
    flexShrink: 0
  },
  chatInputContainer: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center'
  },
  chatInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '24px',
    fontSize: '0.875rem',
    outline: 'none',
    background: '#f9fafb'
  },
  chatInputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    cursor: 'not-allowed'
  },
  chatSendButton: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  chatSendButtonDisabled: {
    background: '#9ca3af',
    cursor: 'not-allowed'
  },

  // Button spinner
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  // Chat note
  chatNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#6b7280',
    fontStyle: 'italic',
    flexShrink: 0
  },
  chatNoteIcon: {
    color: '#9ca3af'
  },

  // Loading
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#6b7280"
  },
  loadingSpinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #f3f4f6",
    borderRadius: "50%",
    borderTop: "4px solid #4f46e5",
    animation: "spin 1s linear infinite",
    marginBottom: "1.5rem",
  },
  loadingText: {
    fontSize: '1.1rem',
    fontWeight: '500'
  },

  // Misc
  checkboxCustom: {
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    border: '2px solid #d1d5db',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  }
};

const enhancedAnimations = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes progressStripes {
    0% { background-position: 0 0; }
    100% { background-position: 16px 0; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes typingAnimation {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
  }
  
  @keyframes slideInUp {
    from { 
      opacity: 0; 
      transform: translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }

  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }

  @keyframes breathe {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes slideInLeft {
    from { 
      opacity: 0; 
      transform: translateX(-20px); 
    }
    to { 
      opacity: 1; 
      transform: translateX(0); 
    }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 5px rgba(79, 70, 229, 0.3); }
    50% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.6); }
  }
  
  /* 🎨 MODERN: Summary card hover effects */
  .modern-summary-card {
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: slideInUp 0.5s ease-out;
  }

  .modern-summary-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .modern-summary-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15) !important;
    border-color: #4f46e5 !important;
  }

  .modern-summary-card:hover::before {
    opacity: 1;
  }

  .modern-summary-card:hover .summaryCardAction {
    color: #4f46e5 !important;
    transform: translateX(4px) !important;
    opacity: 1 !important;
  }

  .modern-summary-card:hover .summaryTypeIcon {
    background: linear-gradient(135deg, #4f46e5, #7c3aed) !important;
    color: white !important;
    border-color: #4f46e5 !important;
    transform: scale(1.05);
  }

  .modern-summary-card:hover .metadataItem {
    background: rgba(79, 70, 229, 0.05) !important;
    transform: translateX(2px);
  }

  .modern-summary-card:active {
    transform: translateY(-2px) scale(1.01);
    transition: all 0.1s ease;
  }

  /* Staggered animation for multiple cards */
  .modern-summary-card:nth-child(1) { animation-delay: 0s; }
  .modern-summary-card:nth-child(2) { animation-delay: 0.1s; }
  .modern-summary-card:nth-child(3) { animation-delay: 0.2s; }
  .modern-summary-card:nth-child(4) { animation-delay: 0.3s; }

  /* Loading shimmer effect */
  .modern-summary-card.loading {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200px 100%;
    animation: shimmer 2s infinite;
  }

  /* Enhanced status dot animation */
  .statusDot {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Progress bar animation */
  .progressFill {
    background: linear-gradient(90deg, #4f46e5, #7c3aed);
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
  }

  /* Count badge hover effect */
  .summariesCount {
    transition: all 0.3s ease;
  }

  .summariesHeader:hover .summariesCount {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
  }

  /* Title gradient animation */
  .summariesTitle {
    background-size: 200% auto;
    animation: shimmer 3s ease-in-out infinite;
  }

  /* Focus states for accessibility */
  .modern-summary-card:focus {
    outline: 2px solid #4f46e5;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  }

  /* Glassmorphism effect for modern look */
  .modern-summary-card {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
  }

  .modern-summary-card:hover {
    backdrop-filter: blur(15px);
    background: rgba(255, 255, 255, 0.98);
  }

  /* Icon breathing animation */
  .summaryTypeIcon {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Micro-interactions for metadata items */
  .metadataItem {
    transition: all 0.2s ease;
  }
  
  /* Original hover effects (preserved) */
  .summary-dropdown-container button:hover:not(:disabled) {
    background: #3730a3 !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4) !important;
  }
  
  .summary-dropdown-container .summary-option:hover {
    background-color: #f9fafb !important;
  }
  
  .summary-dropdown-container .summary-option:last-child {
    border-bottom: none !important;
  }
  
  /* Add typing animation delay for dots */
  .typingDot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typingDot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  /* Summary modal animations */
  .summary-modal-close:hover {
    background-color: #f3f4f6 !important;
    color: #374151 !important;
  }
  
  .summary-copy-button:hover {
    background-color: #047857 !important;
  }
  
  .summary-download-button:hover {
    background-color: #3730a3 !important;
  }
  
  .view-summary-button:hover {
    background-color: #3730a3 !important;
  }
  
  .summaries-select:hover {
    border-color: #9ca3af !important;
  }
  
  .clear-chat-button:hover {
    background-color: #f9fafb !important;
    border-color: #9ca3af !important;
  }
  
  /* Legacy summary link button hover effects */
  .summary-link-button:hover {
    background-color: #f3f4f6 !important;
    border-color: #d1d5db !important;
    transform: translateX(2px);
  }
  
  /* Summary page button hover effects */
  .summary-page-copy:hover {
    background-color: #047857 !important;
  }
  
  .summary-page-download:hover {
    background-color: #3730a3 !important;
  }
  
  /* Back to notebook button hover */
  .back-to-notebook:hover {
    background-color: #f3f4f6 !important;
  }
  
  .progress-container {
    animation: fadeIn 0.3s ease-out;
  }

  /* Smooth section entrance */
  .summariesSection {
    animation: slideInUp 0.6s ease-out;
  }

  /* Dark mode support (optional) */
  @media (prefers-color-scheme: dark) {
    .modern-summary-card {
      background: rgba(17, 24, 39, 0.95);
      border-color: #374151;
      color: #f9fafb;
    }
    
    .modern-summary-card:hover {
      background: rgba(17, 24, 39, 0.98);
      border-color: #6366f1;
    }
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .modern-summary-card {
      padding: 1rem;
    }
    
    .summaryTypeIcon {
      width: 40px;
      height: 40px;
      fontSize: 1.5rem;
    }
    
    .summaryTypeName {
      fontSize: 0.9rem;
    }
  }

  /* Enhanced card entrance animation with spring effect */
  .modern-summary-card {
    animation: slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Continuous subtle animations for engagement */
  .summariesTitle {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s ease-in-out infinite;
  }

  .summariesCount {
    animation: breathe 3s ease-in-out infinite;
  }

  /* Hover glow effect for cards */
  .modern-summary-card:hover {
    animation: glow 2s ease-in-out infinite;
  }
`;

// Inject CSS if not already present
if (!document.querySelector('#notebook-detail-styles')) {
  const style = document.createElement('style');
  style.id = 'notebook-detail-styles';
  style.textContent = enhancedAnimations;
  document.head.appendChild(style);
}