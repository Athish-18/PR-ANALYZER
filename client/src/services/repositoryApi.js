const API_BASE = import.meta.env.VITE_API_URL || '';

export const getRepositories = async () => {
  const response = await fetch(`${API_BASE}/api/repos`);
  if (!response.ok) {
    throw new Error('Failed to fetch repositories');
  }
  return response.json();
};

export const fetchRepository = async (repoUrl) => {
  const response = await fetch(`${API_BASE}/api/repos/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to index repository');
  }
  return response.json();
};

export const getProgress = async (repositoryId) => {
  const response = await fetch(`${API_BASE}/api/repos/${repositoryId}/progress`);
  if (!response.ok) {
    throw new Error('Failed to fetch progress');
  }
  return response.json();
};

export const askRepository = async (repositoryId, question, debug = false, conversationId = null) => {
  const response = await fetch(`${API_BASE}/api/repos/${repositoryId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, debug, conversationId })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate answer');
  }
  return response.json();
};

export const getConversations = async (repositoryId, limit = 20) => {
  const response = await fetch(`${API_BASE}/api/repos/${repositoryId}/conversations?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }
  return response.json();
};

export const getConversationMessages = async (repositoryId, conversationId) => {
  const response = await fetch(`${API_BASE}/api/repos/${repositoryId}/conversations/${conversationId}/messages`);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  return response.json();
};

export const reviewDiff = async (repositoryId, diff) => {
  const response = await fetch(`${API_BASE}/api/repos/${repositoryId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'diff', diff })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate review');
  }
  return response.json();
};

export const reviewGithubPr = async (repositoryId, prUrl) => {
  const response = await fetch(`${API_BASE}/api/repos/${repositoryId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'github', prUrl })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate review');
  }
  return response.json();
};
