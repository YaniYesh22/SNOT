import 'react-quill/dist/quill.snow.css';


import React, { useEffect, useState, useRef } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import ReactQuill from 'react-quill';
import Sidebar from '../components/Sidebar';
import UploadConfirmationModal from '../components/UploadConfirmationModal';
import LinkConfirmationModal from '../components/LinkConfirmationModal';
import notebookService from '../services/NotebookService';
import { styles, injectNotebookDetailCSS } from '../styles/NotebookDetailPageStyles';

export default function NotebookDetailPage() {
  injectNotebookDetailCSS();
  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar collapsed state (collapsed by default for every notebook)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

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
  const [chatMessage, setChatMessage] = useState('');

  // Enhanced Chat-related state
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null); // Track the current chat's id
  const chatContainerRef = useRef(null);

  // Chat saving state
  const [showSaveChatModal, setShowSaveChatModal] = useState(false);
  const [chatTitle, setChatTitle] = useState('');
  const [isSavingChat, setIsSavingChat] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [showSavedChatsDropdown, setShowSavedChatsDropdown] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  // 🆕 Enhanced: Add search functionality for saved chats
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSearchingChats, setIsSearchingChats] = useState(false);

  /**
   * 🆕 Search saved chats
   */
  const searchSavedChats = async (searchQuery) => {
    if (!notebook.notebookId) return;

    setIsSearchingChats(true);

    try {
      console.log('🔍 Searching saved chats for:', searchQuery);

      const searchOptions = {
        search: searchQuery,
        limit: 50
      };

      const chats = await notebookService.getSavedChats(notebook.notebookId, searchOptions);
      setSavedChats(chats);

      console.log(`🔍 Found ${chats.length} chats matching "${searchQuery}"`);
    } catch (error) {
      console.error('❌ Error searching saved chats:', error);
      setFileErrors(prev => [...prev, `Search failed: ${error.message}`]);
    } finally {
      setIsSearchingChats(false);
    }
  };

  /**
   * Handle chat search input changes
   */
  const handleChatSearchChange = (e) => {
    const query = e.target.value;
    setChatSearchQuery(query);

    // Debounce search
    if (query.trim()) {
      const timeoutId = setTimeout(() => {
        searchSavedChats(query);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      // If search is cleared, reload all chats
      loadSavedChats();
    }
  };

  // Summary viewing state
  const [generatedSummaries, setGeneratedSummaries] = useState({});
  const [showSummaryView, setShowSummaryView] = useState(false);
  const [selectedSummaryType, setSelectedSummaryType] = useState(null);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);

  // Progress tracking state
  const [summaryProgress, setSummaryProgress] = useState(null);
  const [isPollingProgress, setIsPollingProgress] = useState(false);
  const [summaryProgressInterval, setSummaryProgressInterval] = useState(null);

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
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [showSummaryDropdown, setShowSummaryDropdown] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Helper functions for chat control
  const hasContentSources = () => {
    return files.length > 0 || links.length > 0;
  };

  /**
   * Handle saving the current chat conversation
   */
  const handleSaveChat = async () => {
    if (chatMessages.length === 0) {
      setFileErrors(prev => [...prev, 'No messages to save']);
      return;
    }

    setIsSavingChat(true);

    try {
      // Auto-generate title if not provided
      let finalTitle = chatTitle.trim();
      if (!finalTitle) {
        // Use first user message as title
        const firstUserMessage = chatMessages.find(msg => msg.sender === 'user');
        if (firstUserMessage) {
          finalTitle = firstUserMessage.message.substring(0, 50);
          if (firstUserMessage.message.length > 50) {
            finalTitle += '...';
          }
        } else {
          finalTitle = `Chat - ${new Date().toLocaleDateString()}`;
        }
      }

      console.log('💾 Saving chat with title:', finalTitle, 'and chat_id:', currentChatId);

      const result = await notebookService.saveChatHistory(
        notebook.notebookId,
        chatMessages,
        finalTitle,
        currentChatId // Pass chat_id for update if present
      );

      console.log('✅ Chat saved successfully:', result);

      // If the backend returns the chat_id, update our state
      if (result && result.chat_id) {
        setCurrentChatId(result.chat_id);
      }

      // Close modal and reset
      setShowSaveChatModal(false);
      setChatTitle('');

      // Show success message
      addChatMessage(
        `💾 Chat saved as "${result.title}"`,
        'system',
        'message'
      );

      // Refresh saved chats list
      loadSavedChats();

    } catch (error) {
      console.error('❌ Error saving chat:', error);
      setFileErrors(prev => [...prev, `Failed to save chat: ${error.message}`]);
    } finally {
      setIsSavingChat(false);
    }
  };

  /**
   * Load saved chats for the current notebook
   */
  const loadSavedChats = async () => {
    if (!notebook.notebookId) return;

    setIsLoadingChats(true);

    try {
      console.log('📚 Loading saved chats...');
      const chats = await notebookService.getSavedChats(notebook.notebookId);
      setSavedChats(chats);
      console.log(`✅ Loaded ${chats.length} saved chats`);
    } catch (error) {
      console.error('❌ Error loading saved chats:', error);
      setSavedChats([]);
    } finally {
      setIsLoadingChats(false);
    }
  };

  /**
   * Load a specific saved chat
   */
  const handleLoadSavedChat = async (chatId) => {
    setIsLoadingChats(true);

    try {
      console.log('📖 Loading saved chat:', chatId);

      const chatData = await notebookService.loadSavedChat(notebook.notebookId, chatId);

      // Replace current chat messages with loaded ones
      setChatMessages(chatData.messages);
      setCurrentChatId(chatId); // Track the loaded chat's id

      // Show success message
      addChatMessage(
        `📖 Loaded chat: "${chatData.title}"`,
        'system',
        'message'
      );

      setShowSavedChatsDropdown(false);

      console.log('✅ Chat loaded successfully');

    } catch (error) {
      console.error('❌ Error loading saved chat:', error);
      setFileErrors(prev => [...prev, `Failed to load chat: ${error.message}`]);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Load saved chats when component mounts or notebook changes
  useEffect(() => {
    const loadChats = async () => {
      if (notebook.notebookId && notebook.notebookId !== 'temp-loading') {
        loadSavedChats();
      }
    };
    loadChats();
  }, [notebook.notebookId]); // Remove loadSavedChats from dependency

  const hasSummariesForChat = () => {
    const availableSummaries = Object.entries(generatedSummaries).filter(([type, data]) => {
      const hasValidUrl = data.url && typeof data.url === 'string' && !data.url.startsWith('#');
      const isReady = data.ready === true;
      return hasValidUrl && isReady;
    });
    return availableSummaries.length > 0;
  };

  const getChatState = () => {
    const sourcesAvailable = hasContentSources();
    const summariesAvailable = hasSummariesForChat();

    if (summariesAvailable) {
      return {
        state: 'available',
        title: 'AI Assistant',
        placeholder: 'Ask me anything...',
        note: null,
        disabled: false
      };
    } else if (sourcesAvailable) {
      return {
        state: 'ready_with_sources',
        title: 'AI Assistant',
        placeholder: 'Ask me anything about your sources...',
        note: 'Chat with your uploaded files and links! Generate summaries for enhanced responses.',
        disabled: false
      };
    } else {
      return {
        state: 'ready_no_sources',
        title: 'AI Assistant',
        placeholder: 'Ask me anything...',
        note: 'Upload files or add links for more context, or just start chatting!',
        disabled: false
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

  // Function to count words in HTML content (used in ReactQuill)
  // const getWordCount = (htmlContent) => {
  //   if (!htmlContent) return 0;
  //   const text = htmlContent.replace(/<[^>]*>/g, ' ');
  //   return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  // };

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

      // Try getSummary Lambda first if we have the required info
      try {
        console.log('🚀 Trying getSummary Lambda...');
        const lambdaResult = await notebookService.getSummary(notebook.notebookId, summaryType);

        if (lambdaResult && lambdaResult.summary && lambdaResult.summary.content) {
          summaryContent = lambdaResult.summary.content;
          console.log('✅ Got summary from Lambda');

          // Store additional metadata if available
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

  const viewSummary = async (summaryType, summaryUrl) => {
    try {
      const summaryData = generatedSummaries[summaryType];

      if (!summaryData) {
        console.error(`❌ No summary data found for ${summaryType}`);
        return;
      }

      // Check if we already have content cached
      const hasContent = summaryData.content && summaryData.content.length > 0;

      if (hasContent) {
        // Content is already available, show modal immediately
        console.log(`✅ Using cached content for ${summaryType} summary modal`);
        toggleSummaryView(summaryType);
        return;
      }

      // Need to fetch content from URL
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

  const openSummaryPage = async (summaryType, summaryUrl) => {
    try {
      const summaryData = generatedSummaries[summaryType];

      if (!summaryData) {
        console.error(`❌ No summary data found for ${summaryType}`);
        return;
      }

      // Check if we already have content or need to fetch
      const hasContent = summaryData.content && summaryData.content.length > 0;
      const isContentPlaceholder = summaryUrl.startsWith('#content-');

      if (hasContent) {
        // Content is already available, show immediately
        console.log(`✅ Using cached content for ${summaryType} summary`);
        setCurrentSummaryPage(summaryType);
        setShowSummaryPage(true);
        return;
      }

      if (isContentPlaceholder) {
        // URL is placeholder but we should have content - check again
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

      // Need to fetch content from real URL
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
    setCurrentChatId(null); // Reset chat id when starting a new conversation
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

  // Function to render source information - DISABLED for cleaner chat
  const renderSourceInfo = (sources) => {
    // Return null to hide all source information
    return null;
  };

  const handleSummarize = async (summaryType) => {
    setShowSummaryDropdown(false);
    setIsGeneratingSummary(true);
    setSummaryProgress(null);

    try {
      console.log(`Starting ${summaryType} summary with progress tracking...`);

      // Step 1: Start the summary generation using your new Lambda endpoint
      const startResult = await notebookService.startSummary(notebook.notebookId, [summaryType]);

      console.log(`✅ Summary started:`, startResult);

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

  // Enhanced startProgressPolling function with better interval management
  const startProgressPolling = (notebookId, summaryType, pollInterval) => {
    console.log(`📊 Starting progress polling every ${pollInterval} seconds...`);

    // Clear any existing interval first to prevent multiple intervals
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
      // Check if we should still be polling before each poll
      console.log('🔄 Interval tick - checking if should continue polling...');
      pollSummaryProgress(notebookId, summaryType);
    }, pollInterval * 1000);

    setSummaryProgressInterval(intervalId);
    console.log(`✅ Polling interval started with ID: ${intervalId}`);
  };

  // Updated pollSummaryProgress function with proper completion detection
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

      // Proper completion detection and polling stop
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

  // Enhanced stopProgressPolling function with better cleanup
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

    console.log('✅ All polling state reset');
  };

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

    // Ensure polling is completely stopped (defensive programming)
    if (isPollingProgress || summaryProgressInterval) {
      console.log('🛑 Defensive polling stop in completion handler');
      stopProgressPolling();
    }

    if (progress.status === 'completed') {
      // Show a brief success notification
      console.log(`✨ ${summaryType.charAt(0).toUpperCase() + summaryType.slice(1)} summary completed successfully!`);

      // Properly update generatedSummaries state to show in UI immediately
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

          // Handle both URL-based and content-based summaries
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

        // MERGE summaries by type instead of replacing all
        if (Object.keys(updatedSummaries).length > 0) {
          setGeneratedSummaries(prev => {
            // MERGE: Keep existing summaries and add/update new ones by type
            const mergedSummaries = { ...prev, ...updatedSummaries };

            console.log('✅ generatedSummaries MERGED by type!', {
              previousTypes: Object.keys(prev),
              newTypes: Object.keys(updatedSummaries),
              finalTypes: Object.keys(mergedSummaries),
              totalCount: Object.keys(mergedSummaries).length
            });

            // Save to backend AFTER state merge with ALL summaries
            setTimeout(() => {
              console.log('💾 Saving ALL merged summaries to backend:', {
                allTypes: Object.keys(mergedSummaries),
                count: Object.keys(mergedSummaries).length
              });
              saveSummariesToBackendWithData(mergedSummaries);
            }, 200); // Increased delay to ensure state update completes

            return mergedSummaries;
          });

          // Also update the notebook metadata to persist summaries
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

    } else if (progress.status === 'partial_success') {
      // Handle partial success similarly...
      console.log(`⚠️ Summary partially completed: ${progress.message || ''}`);

    } else if (progress.status === 'failed') {
      const errorMsg = progress.error || progress.message || 'Summary generation failed';
      console.error(`❌ Summary generation failed: ${errorMsg}`);
    }

    console.log('🏁 Completion handling finished');
  };

  // Enhanced save function that accepts specific summary data
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

        // Prepare summary data for backend storage
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

  // Updated renderGeneratedSummariesSection to handle content-only summaries
  const renderGeneratedSummariesSection = () => {
    console.log('🔍 Rendering summaries section, generatedSummaries:', generatedSummaries);

    const availableSummaries = Object.entries(generatedSummaries).filter(([type, data]) => {
      // Accept summaries that either have a valid URL OR have content
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

      // ACCEPT if: ready AND (has valid URL OR has content OR has content placeholder)
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

            // Handle click for both URL-based and content-based summaries
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

  // Progress modal component - Now a small dismissible popup
  const renderSummaryProgress = () => {
    if (!summaryProgress || !isPollingProgress) return null;

    const { status, progressSummary, elapsedTime, estimatedTimeRemaining, message } = summaryProgress;

    if (status !== 'processing') return null;

    const { completed = 0, processing = 0, total = 1 } = progressSummary || {};
    const progressPercentage = total > 0 ? Math.round(((completed + (processing * 0.5)) / total) * 100) : 0;

    return (
      <div style={styles.summaryProgressPopup}>
        <div style={styles.progressPopupHeader}>
          <div style={styles.progressPopupTitle}>
            <span style={styles.progressIcon}>⚡</span>
            Generating Summary...
          </div>
          <button
            onClick={() => {
              setIsPollingProgress(false);
              setIsGeneratingSummary(false);
              setSummaryProgress(null);
              // Note: This just hides the popup, generation continues in background
            }}
            style={styles.progressPopupClose}
            className="progress-popup-close"
            title="Hide progress (generation continues)"
          >
            ✕
          </button>
        </div>

        <div style={styles.progressPopupContent}>
          <div style={styles.progressPopupStats}>
            <span style={{ fontWeight: '600', color: '#0f172a' }}>
              {completed}/{total} completed
            </span>
          </div>

          <div style={styles.progressBar}>
            <div
              style={{
                height: '8px',
                background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                borderRadius: '4px',
                transition: 'width 0.5s ease',
                width: `${Math.min(progressPercentage, 95)}%`,
                backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%)',
                backgroundSize: '16px 16px',
                animation: 'progressStripes 1s linear infinite'
              }}
            />
          </div>

          <div style={styles.progressPopupText}>
            {message || 'Summary generation in progress'}
          </div>

          {(elapsedTime || estimatedTimeRemaining) && (
            <div style={styles.progressPopupTime}>
              {elapsedTime && (
                <span>⏱️ {elapsedTime}</span>
              )}
              {estimatedTimeRemaining && (
                <span>• ~{estimatedTimeRemaining} remaining</span>
              )}
            </div>
          )}

          {summaryProgress.progress && (
            <div style={styles.progressTypeDetails}>
              {Object.entries(summaryProgress.progress).map(([type, typeProgress]) => (
                <div key={type} style={styles.progressTypeItem}>
                  <span style={styles.progressTypeName}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}:
                  </span>
                  <span style={{
                    ...styles.progressTypeStatus,
                    color: typeProgress.status === 'completed' ? '#10b981' :
                      typeProgress.status === 'generating' ? '#3b82f6' : '#6b7280'
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
      </div>
    );
  };

  // Save Chat Modal Component
  const renderSaveChatModal = () => {
    if (!showSaveChatModal) return null;

    return (
      <div style={styles.saveChatModal}>
        <div style={styles.saveChatModalContent}>
          <div style={styles.saveChatModalHeader}>
            <h3 style={styles.saveChatModalTitle}>💾 Save Conversation</h3>
            <button
              onClick={() => {
                setShowSaveChatModal(false);
                setChatTitle('');
              }}
              style={styles.saveChatModalClose}
            >
              ✕
            </button>
          </div>

          <div style={styles.saveChatModalBody}>
            <div style={styles.saveChatInfoText}>
              💬 Saving {chatMessages.length} messages from this conversation
            </div>

            <div style={styles.saveChatInputContainer}>
              <label style={styles.saveChatLabel}>Chat Title (optional)</label>
              <input
                type="text"
                value={chatTitle}
                onChange={(e) => setChatTitle(e.target.value)}
                placeholder="Enter a title for this chat..."
                style={styles.saveChatInput}
                maxLength={100}
                autoFocus
              />
              <div style={styles.saveChatInputHint}>
                If left empty, we'll use your first message as the title
              </div>
            </div>

            <div style={styles.saveChatModalActions}>
              <button
                onClick={() => {
                  setShowSaveChatModal(false);
                  setChatTitle('');
                }}
                style={styles.saveChatCancelButton}
                disabled={isSavingChat}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChat}
                style={{
                  ...styles.saveChatConfirmButton,
                  ...(isSavingChat ? styles.saveChatConfirmButtonLoading : {})
                }}
                disabled={isSavingChat}
              >
                {isSavingChat ? (
                  <>
                    <div style={styles.buttonSpinner}></div>
                    Saving...
                  </>
                ) : (
                  <>
                    💾 Save Chat
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Saved Chats Dropdown Component
  const renderSavedChatsDropdown = () => {
    if (!showSavedChatsDropdown) return null;

    // DEBUG: Add border, background, zIndex, minWidth for visibility
    const debugDropdownStyle = {
      ...styles.savedChatsDropdown,
      border: '2px solid #3b82f6',
      background: '#fff',
      zIndex: 9999,
      minWidth: 320,
      minHeight: 120,
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      position: 'absolute',
      right: 0,
      top: 40,
    };

    // DEBUG: Show a message if savedChats is empty
    if (!isLoadingChats && savedChats.length === 0) {
      return (
        <div style={debugDropdownStyle}>
          <div style={{padding: 16, color: '#1d4ed8', fontWeight: 600}}>
            No saved chats found. (DEBUG)
          </div>
        </div>
      );
    }

    return (
      <div style={debugDropdownStyle}>
        <div style={styles.savedChatsDropdownHeader}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.savedChatsIcon}>
            <path d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M5,7H19V5H5V7M5,11H19V9H5V11M5,15H19V13H5V15M5,19H19V17H5V19Z" />
          </svg>
          Saved Chats ({savedChats.length})
        </div>

        <div style={styles.savedChatsContent}>
          {isLoadingChats ? (
            <div style={styles.savedChatsLoading}>
              <div style={styles.buttonSpinner}></div>
              Loading saved chats...
            </div>
          ) : (
            <div style={styles.savedChatsList}>
              {savedChats.map((chat) => (
                <div
                  key={chat.chat_id}
                  style={styles.savedChatItem}
                  onClick={() => handleLoadSavedChat(chat.chat_id)}
                  className="saved-chat-item"
                >
                  <div style={styles.savedChatItemHeader}>
                    <div style={styles.savedChatItemTitle}>{chat.title}</div>
                    <div style={styles.savedChatItemDate}>
                      {new Date(chat.timestamp).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={styles.savedChatItemMeta}>
                    💬 {chat.message_count} messages
                    {chat.word_count && (
                      <> • 📝 {chat.word_count.toLocaleString()} words</>
                    )}
                    • ⏰ {new Date(chat.timestamp).toLocaleTimeString()}
                  </div>
                  <div style={styles.savedChatItemMeta}>
                    {chat.message_count} messages • {new Date(chat.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {savedChats.length > 0 && (
          <div style={styles.savedChatsFooter}>
            <button
              onClick={() => setShowSavedChatsDropdown(!showSavedChatsDropdown)}
              style={styles.savedChatsButton}
              className="saved-chats-button"
              title={`View ${savedChats.length} saved chats`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M5,7H19V5H5V7M5,11H19V9H5V11M5,15H19V13H5V15M5,19H19V17H5V19Z" />
              </svg>
              📚 Chats ({savedChats.length})
            </button>
          </div>
        )}
      </div>
    );
  };

  // Updated Chat Header Actions
  const renderChatHeaderActions = () => (
    <div style={styles.chatHeaderActions}>
      {/* View Summaries dropdown - only show if summaries available */}
      {getChatState().state === 'available' && Object.keys(generatedSummaries).length > 0 && (
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
              e.target.value = '';
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

      {/* Saved Chats Button - show if there are saved chats or current messages */}
      {(savedChats.length > 0 || chatMessages.length > 0) && (
        <div style={styles.savedChatsContainer}>
          <button
            onClick={() => setShowSavedChatsDropdown(!showSavedChatsDropdown)}
            style={styles.savedChatsButton}
            className="saved-chats-button"
            title={`View ${savedChats.length} saved chats`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M5,7H19V5H5V7M5,11H19V9H5V11M5,15H19V13H5V15M5,19H19V17H5V19Z" />
            </svg>
            📚 Chats ({savedChats.length})
          </button>
          {renderSavedChatsDropdown()}
        </div>
      )}

      {/* Save Chat Button - only show if there are messages to save */}
      {chatMessages.length > 0 && (
        <button
          onClick={() => setShowSaveChatModal(true)}
          style={styles.saveChatButton}
          className="save-chat-button"
          title="Save current conversation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" />
          </svg>
          💾 Save
        </button>
      )}

      {/* Clear chat button - only show if chat has messages */}
      {chatMessages.length > 0 && (
        <button
          onClick={clearConversation}
          style={styles.clearChatButton}
          className="clear-chat-button"
          title="Clear current conversation"
        >
          🗑️ Clear
        </button>
      )}
    </div>
  );

  // Cleanup effects with better dependency handling
  useEffect(() => {
    // Cleanup polling on component unmount or when polling state changes
    return () => {
      if (summaryProgressInterval) {
        console.log('🧹 Cleaning up progress polling interval on unmount/change');
        clearInterval(summaryProgressInterval);
      }
    };
  }, [summaryProgressInterval]); // Include dependency to re-run when interval changes

  // Additional effect to handle polling state changes
  useEffect(() => {
    // If polling is disabled but interval exists, clear it
    if (!isPollingProgress && summaryProgressInterval) {
      console.log('🧹 Polling disabled, clearing interval');
      clearInterval(summaryProgressInterval);
      setSummaryProgressInterval(null);
    }
  }, [isPollingProgress, summaryProgressInterval]);

  // DEBUG: Add debugging effects to track state changes
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

  // Chat availability debugging
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
  }, [files.length, links.length, generatedSummaries]); // Fix dependencies

  // const handleSummaryDropdownClose = (e) => {
  //   if (!e.target.closest('.summary-dropdown-container')) {
  //     setShowSummaryDropdown(false);
  //   }
  // };

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

  // Simplified: loadNotebookData compatible with Lambda response
  useEffect(() => {
    // Always collapse sidebar on notebook load (generic for all notebooks)
    setIsSidebarCollapsed(true);

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

        // Use the fixed getNotebookWithSummaries method
        let notebookData;
        try {
          notebookData = await notebookService.getNotebookWithSummaries(initialNotebookId);
        } catch (enhancedError) {
          console.warn('⚠️ Enhanced fetch failed, using basic getNotebook');
          notebookData = await notebookService.getNotebook(initialNotebookId);
        }

        if (notebookData) {
          // Direct mapping from Lambda response
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

            // Summary data directly from Lambda
            summaryTypesAvailable: Object.keys(notebookData.summaries || {}),
            summaryTypes: notebookData.summaryTypes || [],
            lastSummarization: notebookData.lastSummarization,
            summarizationStatus: notebookData.summarizationStatus,
            hasSummaries: notebookData.hasSummaries || false
          };

          // Use summaries directly from getNotebook response
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

        // localStorage recovery
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

  // Enhanced: Auto-save function that preserves all summary types
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
            // MERGE summaries instead of replacing
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
  }, [generatedSummaries, notebook.notebookId, notebook.title, content, links]); // Include all dependencies

  // Enhanced: Update your handleSave function to include summary data
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
        // Include summary data
        summaryTypesAvailable: Object.keys(generatedSummaries),
        lastSummarization: Object.keys(generatedSummaries).length > 0 ? new Date().toISOString() : notebook.lastSummarization
      };

      setNotebook(updatedNotebook);

      // Include summary data in update
      const updateData = {
        title: updatedNotebook.title,
        chunkNumber: 0,
        chunkContent: content,
        links: links,
        // Summary metadata
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
            // Include summary data in localStorage
            generatedSummaries: generatedSummaries
          };
        } else {
          notebooksArray.push({
            ...updatedNotebook,
            id: idToCheck,
            notebookId: idToCheck,
            // Include summary data in localStorage
            generatedSummaries: generatedSummaries
          });
        }
      } else {
        const idToStore = currentNotebookId;
        notebooksArray = [{
          ...updatedNotebook,
          id: idToStore,
          notebookId: idToStore,
          // Include summary data in localStorage
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

  // const handleAddLink = (e) => {
  //   e.preventDefault();
  //   if (!newLink) return;
  //   if (!isValidUrl(newLink)) {
  //     setFileErrors(prev => [...prev, '❌ Invalid URL']);
  //     return;
  //   }
  //   setLinkToAdd(newLink.trim());
  //   setShowLinkModal(true);
  // };

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

  const handleLinkDropdownConfirm = () => {
    if (!linkInputValue.trim()) {
      setFileErrors(prev => [...prev, 'Please enter a valid URL']);
      return;
    }

    if (!isValidUrl(linkInputValue.trim())) {
      setFileErrors(prev => [...prev, 'Invalid URL format']);
      return;
    }

    setLinkToAdd(linkInputValue.trim());
    setShowLinkModal(true);
    setShowLinkDropdown(false);
    setLinkInputValue('');
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

  // Enhanced chat submit handler without availability restrictions
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setIsChatLoading(true);

    // Add user message to chat
    addChatMessage(userMessage, 'user');

    try {
      // Send message to AI
      const aiResponse = await sendChatMessage(userMessage);

      // Add AI response to chat WITHOUT metadata for cleaner display
      addChatMessage(aiResponse.answer, 'ai', 'message');

      // Remove the separate sources information message - keeping responses clean

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

  const getYouTubeVideoId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const isYouTubeUrl = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeThumbnail = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  const getVideoTitle = (link) => {
    if (link.title && link.title !== link.url) {
      return link.title;
    }

    try {
      const url = new URL(link.url);
      if (isYouTubeUrl(link.url)) {
        return 'YouTube Video';
      }
      return url.hostname.replace('www.', '');
    } catch (error) {
      return isYouTubeUrl(link.url) ? 'YouTube Video' : 'Web Link';
    }
  };

  const getDomainFromUrl = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return 'Web Link';
    }
  };

  const renderLinkThumbnail = (link) => {
    const videoId = getYouTubeVideoId(link.url);

    if (videoId) {
      return (
        <div style={styles.youtubeThumbnailContainer}>
          <img
            src={getYouTubeThumbnail(videoId)}
            alt="Video thumbnail"
            style={styles.thumbnailImage}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div style={{ ...styles.modernLinkIcon, display: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z" />
            </svg>
          </div>
          <div style={styles.playButtonOverlay}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
          </div>
        </div>
      );
    } else {
      return (
        <div style={styles.modernLinkIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z" />
          </svg>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
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

  // Complete JSX Structure
  return (
    <div style={styles.container}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <main style={styles.main}>
        {/* CONDITIONAL HEADER - Minimal for Summary Reading, Full for Notebook */}
        {showSummaryPage && currentSummaryPage ? (
          // MINIMAL READING MODE HEADER
          <header style={styles.readingModeHeader}>
            <div style={styles.readingHeaderLeft}>
              <button
                onClick={handleBack}
                style={styles.readingBackButton}
                className="reading-back-button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Back to Notebooks
              </button>
              <div style={styles.readingNotebookTitle}>
                <svg style={styles.readingNotebookIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,2.75A1.25,1.25 0 0,1 13.25,4A1.25,1.25 0 0,1 12,5.25A1.25,1.25 0 0,1 10.75,4A1.25,1.25 0 0,1 12,2.75Z" />
                </svg>
                {notebook.title}
              </div>
            </div>
            <div style={styles.readingHeaderRight}>
              <span style={styles.readingInfoItem}>
                📊 Sources: {files.length + links.length}
              </span>
              <span style={styles.readingInfoItem}>
                📄 Files: {files.length}
              </span>
              <span style={styles.readingInfoItem}>
                🔗 Links: {links.length}
              </span>
            </div>
          </header>
        ) : (
          // FULL NOTEBOOK HEADER (Normal Mode)
          <>
            {/* Header with Back and Save */}
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

            {/* Toolbar and Notebook Info Section */}
            <div style={styles.toolbarSection}>
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
                </div>
              </div>

              <div style={styles.toolbar}>
                <div style={styles.toolbarActionsSection}>
                  <span style={styles.sectionLabel}>
                    <svg style={styles.sectionIcon} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,2.75A1.25,1.25 0 0,1 13.25,4A1.25,1.25 0 0,1 12,5.25A1.25,1.25 0 0,1 10.75,4A1.25,1.25 0 0,1 12,2.75Z" />
                    </svg>
                    Notebook Actions
                  </span>
                  <div style={styles.toolbarButtons}>
                    {/* Upload Files Button */}
                    <button
                      onClick={() => document.getElementById('fileInput')?.click()}
                      style={styles.toolbarButton}
                      className="toolbar-button"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={styles.toolbarButtonIcon}>
                        <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                      </svg>
                      Add Files
                    </button>

                    {/* Add Link Button */}
                    <div className="link-dropdown-container" style={styles.linkContainer}>
                      <button
                        onClick={() => setShowLinkDropdown(!showLinkDropdown)}
                        style={styles.toolbarButton}
                        className="toolbar-button"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={styles.toolbarButtonIcon}>
                          <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z" />
                        </svg>
                        Add Link
                      </button>

                      {showLinkDropdown && (
                        <div style={styles.linkDropdown}>
                          <div style={styles.linkDropdownHeader}>
                            <svg style={styles.linkDropdownIcon} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z" />
                            </svg>
                            Add Web Link or Video
                          </div>

                          <div style={styles.linkInputContainer}>
                            <input
                              type="url"
                              value={linkInputValue}
                              onChange={(e) => setLinkInputValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleLinkDropdownConfirm();
                                }
                                if (e.key === 'Escape') {
                                  setShowLinkDropdown(false);
                                  setLinkInputValue('');
                                }
                              }}
                              placeholder="Paste your YouTube URL here"
                              style={styles.linkInput}
                              autoFocus
                            />
                          </div>

                          <div style={styles.linkDropdownActions}>
                            <button
                              onClick={() => {
                                setShowLinkDropdown(false);
                                setLinkInputValue('');
                              }}
                              style={styles.linkCancelButton}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleLinkDropdownConfirm}
                              style={{
                                ...styles.linkConfirmButton,
                                ...((!linkInputValue.trim()) ? styles.linkConfirmButtonDisabled : {})
                              }}
                              disabled={!linkInputValue.trim()}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                              </svg>
                              Add Link
                            </button>
                          </div>

                          <div style={styles.linkDropdownNote}>
                            <svg style={styles.linkDropdownNoteIcon} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11M11,9H13V7H11" />
                            </svg>
                            Supports YouTube videos
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Summarize Dropdown */}
                    <div className="summary-dropdown-container" style={styles.summaryContainer}>
                      <button
                        onClick={() => setShowSummaryDropdown(!showSummaryDropdown)}
                        style={{
                          ...styles.toolbarButton,
                          ...(isGeneratingSummary ? styles.toolbarButtonLoading : {})
                        }}
                        disabled={isGeneratingSummary || (files.length === 0 && links.length === 0)}
                        className="toolbar-button"
                      >
                        {isGeneratingSummary ? (
                          <>
                            <div style={styles.summarySpinner}></div>
                            {isPollingProgress ? 'Generating...' : 'Starting...'}
                          </>
                        ) : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={styles.toolbarButtonIcon}>
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                            Summarize
                          </>
                        )}
                      </button>

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
                  </div>
                </div>

                <div style={styles.notebookInfoSection}>
                  <span style={styles.sectionLabel}>Notebook Info:</span>
                  <div style={styles.notebookInfo}>
                    <div style={styles.notebookInfoItem}>
                      <span style={styles.notebookInfoLabel}>Sources:</span>
                      <span style={styles.notebookInfoValue}>{files.length + links.length}</span>
                    </div>
                    <div style={styles.notebookInfoSeparator}>•</div>
                    <div style={styles.notebookInfoItem}>
                      <span style={styles.notebookInfoLabel}>Files:</span>
                      <span style={styles.notebookInfoValue}>{files.length}</span>
                    </div>
                    <div style={styles.notebookInfoSeparator}>•</div>
                    <div style={styles.notebookInfoItem}>
                      <span style={styles.notebookInfoLabel}>Links:</span>
                      <span style={styles.notebookInfoValue}>{links.length}</span>
                    </div>
                    <div style={styles.notebookInfoSeparator}>•</div>
                    <div style={styles.notebookInfoItem}>
                      <span style={styles.notebookInfoLabel}>Last updated:</span>
                      <span style={styles.notebookInfoValue}>
                        {lastSaved ? formatDate(lastSaved) : formatDate(notebook.lastUpdated)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                id="fileInput"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.csv,.xlsx,.xls"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
          </>
        )}

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

        {/* Main Content Area - 3 Column Layout */}
        <div style={styles.contentLayout}>
          {/* Conditional rendering for summary page vs main notebook view */}
          {showSummaryPage && currentSummaryPage ? (
            /* Summary Page View - spans full width */
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
            /* Main 3-Column Notebook View */
            <>
              {/* Left Panel - Sources */}
              <div style={styles.leftPanel}>
                <div style={styles.sourcesPanel}>
                  <div style={styles.sourcesPanelHeader}>
                    <h3 style={styles.sourcesPanelTitle}>Sources</h3>
                    <div style={styles.sourcesCount}>
                      {files.length + links.length}
                    </div>
                  </div>

                  {files.length === 0 && links.length === 0 ? (
                    <div style={styles.noSourcesMessage}>
                      <div style={styles.noSourcesIcon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,2.75A1.25,1.25 0 0,1 13.25,4A1.25,1.25 0 0,1 12,5.25A1.25,1.25 0 0,1 10.75,4A1.25,1.25 0 0,1 12,2.75Z" />
                        </svg>
                      </div>
                      <p style={styles.noSourcesText}>No sources yet</p>
                      <p style={styles.noSourcesSubtext}>Add files or links using the toolbar above</p>
                    </div>
                  ) : (
                    <div style={styles.sourcesContent}>
                      {/* Files Section */}
                      {files.length > 0 && (
                        <div style={styles.sourcesSection}>
                          <div style={styles.sourcesSectionHeader}>
                            <div style={styles.sourcesSectionTitle}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.sourcesSectionIcon}>
                                <path d="M6,2H14L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M18,20V9H13V4H6V20H18Z" />
                              </svg>
                              Files
                            </div>
                            <span style={styles.sourcesSectionCount}>{files.length}</span>
                          </div>
                          <div style={styles.sourcesItems}>
                            {files.map(file => (
                              <div
                                key={file.id}
                                style={{
                                  ...styles.sourceItem,
                                  cursor: file.downloadUrl && file.isValid !== false ? 'pointer' : 'default'
                                }}
                                className="source-item"
                                onClick={() => {
                                  if (file.downloadUrl && file.isValid !== false) {
                                    window.open(file.downloadUrl, '_blank');
                                  }
                                }}
                                title={file.downloadUrl && file.isValid !== false ? `Click to download ${file.name}` : file.name}
                              >
                                <div style={styles.sourceItemIcon}>
                                  <div style={{
                                    ...styles.fileTypeIcon,
                                    backgroundColor: getFileTypeColor(file.extension || file.type)
                                  }}>
                                    {getFileTypeIcon(file.extension || file.type)}
                                  </div>
                                </div>
                                <div style={styles.sourceItemContent}>
                                  <div style={styles.sourceItemTitle}>{file.name}</div>
                                  <div style={styles.sourceItemMeta}>
                                    <span>{file.sizeFormatted || `${(file.size / 1024 / 1024).toFixed(1)} MB`}</span>
                                    {file.uploadedAt && (
                                      <>
                                        <span style={styles.sourceItemSeparator}>•</span>
                                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                                      </>
                                    )}
                                    {file.downloadUrl && file.isValid !== false && (
                                      <>
                                        <span style={styles.sourceItemSeparator}>•</span>
                                        <span style={{ color: '#059669', fontWeight: '600', fontSize: '0.7rem' }}>
                                          View Here
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div style={styles.sourceItemActions}>
                                  {file.downloadUrl && file.isValid !== false && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(file.downloadUrl, '_blank');
                                      }}
                                      style={styles.sourceActionButton}
                                      className="source-action-button"
                                      title="Download"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFile(file.id);
                                    }}
                                    style={styles.sourceRemoveButton}
                                    className="source-remove-button"
                                    title="Remove"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Links Section */}
                      {links.length > 0 && (
                        <div style={styles.sourcesSection}>
                          <div style={styles.sourcesSectionHeader}>
                            <div style={styles.sourcesSectionTitle}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.sourcesSectionIcon}>
                                <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z" />
                              </svg>
                              Links
                            </div>
                            <span style={styles.sourcesSectionCount}>{links.length}</span>
                          </div>
                          <div style={styles.sourcesItems}>
                            {links.map(link => (
                              <div key={link.id} style={styles.sourceItem} className="source-item">
                                <div style={styles.sourceItemIcon}>
                                  {renderLinkThumbnail(link)}
                                </div>
                                <div style={styles.sourceItemContent}>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.sourceItemLink}
                                    className="source-item-link"
                                    title={`${getVideoTitle(link)} - ${link.url}`}
                                  >
                                    {getVideoTitle(link)}
                                  </a>
                                  <div style={styles.sourceItemMeta}>
                                    <span>{getDomainFromUrl(link.url)}</span>
                                    <span style={styles.sourceItemSeparator}>•</span>
                                    <div style={styles.linkStatusBadge}>
                                      {link.status === 'processing' && (
                                        <>
                                          <div style={{
                                            ...styles.statusDot,
                                            backgroundColor: '#f59e0b',
                                            animation: 'pulse 2s infinite'
                                          }}></div>
                                          <span style={styles.statusProcessing}>Processing</span>
                                        </>
                                      )}
                                      {link.status === 'completed' && (
                                        <>
                                          <div style={{
                                            ...styles.statusDot,
                                            backgroundColor: '#10b981'
                                          }}></div>
                                          <span style={styles.statusCompleted}>Ready</span>
                                        </>
                                      )}
                                      {link.status === 'error' && (
                                        <>
                                          <div style={{
                                            ...styles.statusDot,
                                            backgroundColor: '#ef4444'
                                          }}></div>
                                          <span style={styles.statusError}>Error</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div style={styles.sourceItemActions}>
                                  <button
                                    onClick={() => removeLink(link.id)}
                                    style={styles.sourceRemoveButton}
                                    className="source-remove-button"
                                    title="Remove"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Panel - Chat */}
              <div style={styles.middlePanel}>
                <div style={styles.chatPanel}>
                  <div style={styles.chatPanelHeader}>
                    <h3 style={styles.chatPanelTitle}>
                      {getChatState().title}
                    </h3>
                    {renderChatHeaderActions()}
                  </div>

                  {/* Chat Messages */}
                  <div style={styles.chatMessages} ref={chatContainerRef}>
                    {chatMessages.length > 0 ? (
                      chatMessages.map((message) => (
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
                      ))
                    ) : (
                      <div style={styles.chatEmptyState}>
                        <div style={styles.chatEmptyIcon}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p style={styles.chatEmptyText}>No conversation yet</p>
                        <p style={styles.chatEmptySubtext}>Ask me anything about your sources</p>
                      </div>
                    )}

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

                  {/* Chat Form */}
                  <div style={styles.chatForm}>
                    <form onSubmit={handleChatSubmit} style={styles.chatFormInner}>
                      <div style={styles.chatInputContainer}>
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder={getChatState().placeholder}
                          style={styles.chatInput}
                          disabled={isChatLoading}
                        />
                        <button
                          type="submit"
                          style={{
                            ...styles.chatSendButton,
                            ...((!chatMessage.trim() || isChatLoading || getChatState().disabled) ? styles.chatSendButtonDisabled : {})
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

                    {/* Status message */}
                    {getChatState().note && (
                      <div style={styles.chatNote}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={styles.chatNoteIcon}>
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11M11,9H13V7H11" />
                        </svg>
                        {getChatState().note}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Notes and Summaries */}
              <div style={styles.rightPanel}>
                {/* Notes Section */}
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
                </div>

                {/* Generated Summaries Section */}
                {renderGeneratedSummariesSection()}
              </div>
            </>
          )}
        </div>

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

        {/* Save Chat Modal */}
        {renderSaveChatModal()}

        {/* Progress Modal */}
        {isPollingProgress && renderSummaryProgress()}
      </main>
    </div>
  );
}