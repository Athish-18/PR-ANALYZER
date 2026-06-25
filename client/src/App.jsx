import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { fetchRepository, getProgress, askRepository, reviewDiff } from './services/repositoryApi';

function App() {
  const [repositoryId, setRepositoryId] = useState(null);
  const [repositoryName, setRepositoryName] = useState('');
  const [repositories, setRepositories] = useState([]);
  const [progress, setProgress] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);

  // Fetch all repositories on mount
  useEffect(() => {
    const init = async () => {
      try {
        const repos = await fetch('/api/repos').then(r => r.json());
        setRepositories(repos);

        if (repos.length > 0) {
          const savedRepoId = localStorage.getItem("activeRepositoryId");
          let targetRepo = repos.find(r => r.id === parseInt(savedRepoId, 10));
          if (!targetRepo) targetRepo = repos[0]; // fallback to most recent

          setRepositoryId(targetRepo.id);
          setRepositoryName(targetRepo.name);
          localStorage.setItem("activeRepositoryId", targetRepo.id);
        }
      } catch (err) {
        console.error("Failed to fetch repositories", err);
      }
    };
    init();
  }, []);

  // Poll for progress when repositoryId is available
  useEffect(() => {
    if (!repositoryId) return;

    const pollProgress = async () => {
      try {
        const data = await getProgress(repositoryId);
        setProgress(data);
      } catch (err) {
        console.error("Failed to fetch progress", err);
      }
    };

    pollProgress(); // initial call
    const interval = setInterval(pollProgress, 5000);
    return () => clearInterval(interval);
  }, [repositoryId]);

  // Load conversation on start or when repository changes
  useEffect(() => {
    if (!repositoryId) return;

    const loadConversationData = async () => {
      try {
        const convs = await fetch(`/api/repos/${repositoryId}/conversations?limit=20`).then(r => r.json());
        setConversations(convs);

        const convKey = `activeConversationId_${repositoryId}`;
        const savedId = localStorage.getItem(convKey);
        let targetId = savedId;

        // If no saved ID or it's not in the list, pick the latest
        if (!targetId && convs.length > 0) {
          targetId = convs[0].id;
        }

        if (targetId) {
          const data = await fetch(`/api/repos/${repositoryId}/conversations/${targetId}/messages`).then(r => r.json());
          setMessages(data.messages || []);
          setConversationId(data.conversation.id);
          localStorage.setItem(convKey, data.conversation.id);
        } else {
          setMessages([]);
          setConversationId(null);
          localStorage.removeItem(convKey);
        }
      } catch (err) {
        console.error("Failed to load conversation history", err);
      }
    };

    loadConversationData();
  }, [repositoryId]);

  const handleSelectConversation = async (id) => {
    try {
      const data = await fetch(`/api/repos/${repositoryId}/conversations/${id}/messages`).then(r => r.json());
      setMessages(data.messages || []);
      setConversationId(id);
      localStorage.setItem(`activeConversationId_${repositoryId}`, id);
    } catch (err) {
      console.error("Failed to load conversation", err);
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    localStorage.removeItem(`activeConversationId_${repositoryId}`);
  };

  const handleSelectRepository = (id, name) => {
    setRepositoryId(id);
    setRepositoryName(name);
    setConversationId(null);
    setMessages([]);
    setConversations([]);
    setProgress(null);
    setReviewResult(null);
    localStorage.setItem("activeRepositoryId", id);
  };

  const handleIndexRepository = async (url) => {
    setIsIndexing(true);
    setError(null);
    try {
      // Basic extraction of org/repo from URL
      const parts = url.replace(/\/$/, '').split('/');
      let name = '';
      if (parts.length >= 2) {
         name = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
      } else {
         name = url;
      }
      setRepositoryName(name);

      // Start an optimistic poll to grab the repo from the DB as soon as it's created,
      // since fetchRepository blocks until the entire ingestion pipeline is done.
      const optimisticInterval = setInterval(async () => {
        try {
          const repos = await fetch('/api/repos').then(r => r.json());
          setRepositories(repos);
          const newlyAdded = repos.find(r => r.name === name);
          // Only set if we haven't already and the current repoId isn't it
          setRepositoryId(currentId => {
            if (newlyAdded && currentId !== newlyAdded.id) {
              localStorage.setItem("activeRepositoryId", newlyAdded.id);
              return newlyAdded.id;
            }
            return currentId;
          });
        } catch (e) {
          // ignore background poll errors
        }
      }, 2000);

      const data = await fetchRepository(url);
      
      clearInterval(optimisticInterval);

      setRepositoryId(data.repositoryId);
      localStorage.setItem("activeRepositoryId", data.repositoryId);
      
      // Refresh repositories list one final time
      const repos = await fetch('/api/repos').then(r => r.json());
      setRepositories(repos);
    } catch (err) {
      setError(err.message);
      setRepositoryName('');
    } finally {
      setIsIndexing(false);
    }
  };

  const handleSendMessage = async (question) => {
    if (!repositoryId) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: question }];
    setMessages(newMessages);
    setIsAnswering(true);
    setError(null);

    try {
      // Send debug=true for retrieval diagnostics
      const data = await askRepository(repositoryId, question, true, conversationId);
      
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem(`activeConversationId_${repositoryId}`, data.conversationId);
        
        // Refresh conversation list to show the new one
        fetch(`/api/repos/${repositoryId}/conversations?limit=20`)
          .then(r => r.json())
          .then(convs => setConversations(convs));
      }

      // Update with assistant response
      setMessages([
        ...newMessages, 
        { 
          role: 'assistant', 
          content: data.answer,
          sources: data.sources || null,
          diagnostics: data.diagnostics || null 
        }
      ]);
    } catch (err) {
      setError(err.message);
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsAnswering(false);
    }
  };

  const handleReviewDiff = async (diffText) => {
    if (!repositoryId) return;
    setIsReviewing(true);
    setError(null);
    setReviewResult(null);
    try {
      const data = await reviewDiff(repositoryId, diffText);
      setReviewResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Error Banner - absolute positioned */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-700 text-red-100 px-4 py-2 rounded-md shadow-lg flex items-center gap-3">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-white">✕</button>
        </div>
      )}

      <Sidebar 
        repositories={repositories}
        repositoryId={repositoryId}
        repositoryName={repositoryName}
        progress={progress}
        onIndexRepository={handleIndexRepository}
        onSelectRepository={handleSelectRepository}
        isIndexing={isIndexing}
        conversations={conversations}
        activeConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
      
      <ChatWindow 
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isAnswering}
        hasRepository={!!repositoryId}
        repositoryId={repositoryId}
        onReviewDiff={handleReviewDiff}
        isReviewing={isReviewing}
        reviewResult={reviewResult}
      />
    </div>
  );
}

export default App;
