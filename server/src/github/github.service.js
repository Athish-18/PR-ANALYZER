export const parseGitHubUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return null;
    
    // Split the path and remove empty segments
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    
    return { 
      owner: parts[0], 
      repo: parts[1].replace('.git', '') // Strip .git if present
    };
  } catch (error) {
    return null; // Invalid URL
  }
};

export const fetchRepoMetadata = async (owner, repo) => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Context-Aware-PR-Analyzer'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found or is private');
    }
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return response.json();
};

export const fetchRepoTree = async (owner, repo, defaultBranch) => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Context-Aware-PR-Analyzer'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error fetching tree: ${response.statusText}`);
  }

  return response.json();
};

export const getRepoDetails = async (repoUrl) => {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL');
  }

  const { owner, repo } = parsed;

  // 1. Fetch metadata to get default branch
  const metadata = await fetchRepoMetadata(owner, repo);
  const defaultBranch = metadata.default_branch;

  // 2. Fetch the recursive tree to count files
  const treeData = await fetchRepoTree(owner, repo, defaultBranch);
  
  // Extract blobs (files), ignoring trees (directories)
  const files = treeData.tree.filter(item => item.type === 'blob');
  const totalFiles = files.length;

  // 3. Return structured JSON with files array
  return {
    owner,
    repo,
    defaultBranch,
    totalFiles,
    files
  };
};

export const fetchFileContent = async (owner, repo, branch, filePath) => {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
  }
  
  return response.text();
};
